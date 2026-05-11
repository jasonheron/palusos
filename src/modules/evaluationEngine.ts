import type { AgentDefinition, DataFeedDefinition, MarketEvent, ModelDefinition } from '../data/agentLabData';
import type { DemoAgent, GateStatus } from '../data/demoAgents';

const statusScore: Record<GateStatus, number> = {
  pass: 1,
  watch: 0.5,
  fail: 0,
};

export interface EvaluationSummary {
  agentId: string;
  verdict: DemoAgent['verdict'];
  gateScore: number;
  passed: number;
  watching: number;
  failed: number;
  headline: string;
}

export function summarizeEvaluation(agent: DemoAgent): EvaluationSummary {
  const passed = agent.gates.filter((gate) => gate.result === 'pass').length;
  const watching = agent.gates.filter((gate) => gate.result === 'watch').length;
  const failed = agent.gates.filter((gate) => gate.result === 'fail').length;
  const gateScore = Math.round(
    (agent.gates.reduce((sum, gate) => sum + statusScore[gate.result], 0) / agent.gates.length) * 100,
  );

  return {
    agentId: agent.id,
    verdict: agent.verdict,
    gateScore,
    passed,
    watching,
    failed,
    headline: buildHeadline(agent.verdict),
  };
}

function buildHeadline(verdict: DemoAgent['verdict']): string {
  switch (verdict) {
    case 'Canary Eligible':
      return 'Ready for a tiny, bounded dev-wallet canary after runner checks.';
    case 'Keep Paper':
      return 'Promising, but proof density or safety checks are not complete.';
    case 'Kill':
      return 'Rejected before live funds because executable economics failed.';
  }
}

export interface ExecutionAssumptions {
  tradeSizeSol: number;
  feeBps: number;
  slippageBps: number;
  latencyMs: number;
  latencyBpsPer100Ms: number;
  maxDrawdownSol: number;
  outlierTrimFraction: number;
}

export interface EvaluationInput {
  agent: AgentDefinition;
  dataFeed: DataFeedDefinition;
  model: ModelDefinition;
  assumptions: ExecutionAssumptions;
}

export type AgentLabVerdict = 'reject' | 'keep_testing' | 'promote';

export interface EvaluationTrade {
  eventId: string;
  asset: string;
  scenario: string;
  signalScore: number;
  liquidityScore: number;
  realizedReturnPct: number;
  grossPnlSol: number;
  executionCostSol: number;
  adjustedPnlSol: number;
  cumulativePnlSol: number;
}

export interface EvaluationStats {
  selectedTrades: number;
  sampleCoveragePct: number;
  totalAdjustedPnlSol: number;
  averageEvSol: number;
  averageEvPctOfSize: number;
  largestWinnerRemovedEvSol: number;
  outlierRemovedEvSol: number;
  winRatePct: number;
  maxDrawdownSol: number;
  executionCostSol: number;
  confidenceScore: number;
}

export interface EvaluationReport {
  agent: AgentDefinition;
  dataFeed: DataFeedDefinition;
  model: ModelDefinition;
  assumptions: ExecutionAssumptions;
  threshold: number;
  trades: EvaluationTrade[];
  stats: EvaluationStats;
  verdict: AgentLabVerdict;
  verdictLabel: string;
  action: string;
  rationale: string[];
}

export interface StrategyDiscoveryCandidate {
  profileId: string;
  agent: AgentDefinition;
  dataFeed: DataFeedDefinition;
  model: ModelDefinition;
  report: EvaluationReport;
  proofScore: number;
  stage: 'reject' | 'continue_proof' | 'promotion_candidate';
  headline: string;
  proofPoints: string[];
  riskFlags: string[];
}

export const defaultExecutionAssumptions: ExecutionAssumptions = {
  tradeSizeSol: 0.05,
  feeBps: 45,
  slippageBps: 80,
  latencyMs: 650,
  latencyBpsPer100Ms: 3,
  maxDrawdownSol: 0.025,
  outlierTrimFraction: 0.1,
};

export function evaluateAgentLab(input: EvaluationInput): EvaluationReport {
  const { agent, dataFeed, model, assumptions } = input;
  const threshold = clamp(agent.minSignalScore + model.thresholdAdjustment, 1, 99);
  const selected = dataFeed.events.filter(
    (event) => event.signalScore >= threshold && event.liquidityScore >= agent.minLiquidityScore,
  );

  let cumulativePnlSol = 0;
  const trades = selected.map((event) => {
    const trade = evaluateTrade(event, agent, model, assumptions, cumulativePnlSol);
    cumulativePnlSol = trade.cumulativePnlSol;
    return trade;
  });

  const adjusted = trades.map((trade) => trade.adjustedPnlSol);
  const totalAdjustedPnlSol = sum(adjusted);
  const averageEvSol = mean(adjusted);
  const largestWinnerRemovedEvSol = largestWinnerRemovedMean(adjusted);
  const outlierRemovedEvSol = outlierRemovedMean(adjusted, assumptions.outlierTrimFraction);
  const maxDrawdownSol = calculateMaxDrawdown(trades.map((trade) => trade.cumulativePnlSol));
  const winRatePct = trades.length === 0 ? 0 : (trades.filter((trade) => trade.adjustedPnlSol > 0).length / trades.length) * 100;
  const executionCostSol = sum(trades.map((trade) => trade.executionCostSol));
  const sampleCoveragePct = dataFeed.events.length === 0 ? 0 : (trades.length / dataFeed.events.length) * 100;
  const averageEvPctOfSize = assumptions.tradeSizeSol === 0 ? 0 : (averageEvSol / assumptions.tradeSizeSol) * 100;
  const confidenceScore = clamp(
    Math.round(40 + Math.min(35, trades.length * 1.7) + model.confidenceAdjustment + Math.max(-14, averageEvPctOfSize * 1.8)),
    0,
    99,
  );

  const stats: EvaluationStats = {
    selectedTrades: trades.length,
    sampleCoveragePct,
    totalAdjustedPnlSol,
    averageEvSol,
    averageEvPctOfSize,
    largestWinnerRemovedEvSol,
    outlierRemovedEvSol,
    winRatePct,
    maxDrawdownSol,
    executionCostSol,
    confidenceScore,
  };
  const verdict = decideVerdict(stats, assumptions);

  return {
    agent,
    dataFeed,
    model,
    assumptions,
    threshold,
    trades,
    stats,
    verdict,
    verdictLabel: verdictLabel(verdict),
    action: actionForVerdict(verdict),
    rationale: buildRationale(stats, assumptions, verdict),
  };
}

export function discoverStrategyProfiles(
  agents: AgentDefinition[],
  dataFeeds: DataFeedDefinition[],
  models: ModelDefinition[],
  assumptions: ExecutionAssumptions,
): StrategyDiscoveryCandidate[] {
  return agents
    .flatMap((agent) => dataFeeds.flatMap((dataFeed) => models.map((model) => {
      const report = evaluateAgentLab({ agent, dataFeed, model, assumptions });
      const proofScore = scoreDiscoveryCandidate(report);
      return {
        profileId: `${agent.id}__${dataFeed.id}__${model.id}`,
        agent,
        dataFeed,
        model,
        report,
        proofScore,
        stage: discoveryStage(report),
        headline: discoveryHeadline(report),
        proofPoints: buildDiscoveryProofPoints(report),
        riskFlags: buildDiscoveryRiskFlags(report),
      } satisfies StrategyDiscoveryCandidate;
    })))
    .sort((a, b) => b.proofScore - a.proofScore || b.report.stats.selectedTrades - a.report.stats.selectedTrades);
}

export function evaluateTrade(
  event: MarketEvent,
  agent: AgentDefinition,
  model: ModelDefinition,
  assumptions: ExecutionAssumptions,
  priorCumulativePnlSol = 0,
): EvaluationTrade {
  const modeledReturnPct = event.realizedReturnPct + agent.edgeAdjustmentPct + model.returnAdjustmentPct;
  const grossPnlSol = assumptions.tradeSizeSol * modeledReturnPct;
  const latencyBps = (assumptions.latencyMs / 100) * assumptions.latencyBpsPer100Ms * agent.latencyPenaltyMultiplier;
  const totalCostBps = Math.max(0, assumptions.feeBps + assumptions.slippageBps + event.routeRiskBps + latencyBps - model.routeCostReductionBps);
  const executionCostSol = assumptions.tradeSizeSol * (totalCostBps / 10_000);
  const adjustedPnlSol = grossPnlSol - executionCostSol;

  return {
    eventId: event.id,
    asset: event.asset,
    scenario: event.scenario,
    signalScore: event.signalScore,
    liquidityScore: event.liquidityScore,
    realizedReturnPct: event.realizedReturnPct,
    grossPnlSol,
    executionCostSol,
    adjustedPnlSol,
    cumulativePnlSol: priorCumulativePnlSol + adjustedPnlSol,
  };
}

export function calculateMaxDrawdown(cumulativePnl: number[]): number {
  let peak = 0;
  let maxDrawdown = 0;

  for (const value of cumulativePnl) {
    peak = Math.max(peak, value);
    maxDrawdown = Math.max(maxDrawdown, peak - value);
  }

  return maxDrawdown;
}

export function outlierRemovedMean(values: number[], trimFraction: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const boundedTrim = clamp(trimFraction, 0, 0.45);
  const trimCount = Math.floor(sorted.length * boundedTrim);
  const trimmed = trimCount > 0 && sorted.length - trimCount * 2 >= 3
    ? sorted.slice(trimCount, sorted.length - trimCount)
    : sorted;
  return mean(trimmed);
}

export function largestWinnerRemovedMean(values: number[]): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];
  const sorted = [...values].sort((a, b) => a - b);
  sorted.pop();
  return mean(sorted);
}

function decideVerdict(stats: EvaluationStats, assumptions: ExecutionAssumptions): AgentLabVerdict {
  if (stats.selectedTrades < 8) return 'keep_testing';
  if (stats.averageEvSol <= 0 || stats.largestWinnerRemovedEvSol <= 0 || stats.outlierRemovedEvSol <= 0) return 'reject';
  if (stats.maxDrawdownSol > assumptions.maxDrawdownSol) return 'reject';
  if (
    stats.selectedTrades >= 14
    && stats.averageEvPctOfSize >= 5
    && stats.largestWinnerRemovedEvSol > 0
    && stats.outlierRemovedEvSol > 0
    && stats.maxDrawdownSol <= assumptions.maxDrawdownSol * 0.75
    && stats.confidenceScore >= 70
  ) {
    return 'promote';
  }
  return 'keep_testing';
}

function buildRationale(stats: EvaluationStats, assumptions: ExecutionAssumptions, verdict: AgentLabVerdict): string[] {
  const reasons = [
    `${stats.selectedTrades} deterministic demo trades selected from the bundled feed.`,
    `Execution-adjusted EV is ${formatSol(stats.averageEvSol)} per trade after fees, slippage, latency, and route risk.`,
    `Outlier-removed EV is ${formatSol(stats.outlierRemovedEvSol)}; largest-winner-removed EV is ${formatSol(stats.largestWinnerRemovedEvSol)}.`,
    `Max drawdown is ${formatSol(stats.maxDrawdownSol)} against a configured ${formatSol(assumptions.maxDrawdownSol)} limit.`,
  ];

  if (verdict === 'reject') {
    reasons.push('Decision: reject until the economics remain positive without relying on a single winner or breaching drawdown.');
  } else if (verdict === 'promote') {
    reasons.push('Decision: promote to a bounded paper/canary plan in a real deployment, subject to runner acceptance and human policy gates.');
  } else {
    reasons.push('Decision: keep testing and collect more proof before any real-money path.');
  }

  return reasons;
}

function verdictLabel(verdict: AgentLabVerdict): string {
  switch (verdict) {
    case 'reject':
      return 'Reject';
    case 'keep_testing':
      return 'Keep Testing';
    case 'promote':
      return 'Promote';
  }
}

function actionForVerdict(verdict: AgentLabVerdict): string {
  switch (verdict) {
    case 'reject':
      return 'Archive this configuration and mutate the agent/model before testing again.';
    case 'keep_testing':
      return 'Run another paper cycle, increase closed-trade count, and inspect failure clusters.';
    case 'promote':
      return 'Prepare a small, reversible promotion plan with explicit limits and rollback triggers.';
  }
}

function scoreDiscoveryCandidate(report: EvaluationReport): number {
  const verdictBase = report.verdict === 'promote' ? 36 : report.verdict === 'keep_testing' ? 18 : 0;
  const sampleScore = Math.min(18, report.stats.selectedTrades * 0.9);
  const robustEvScore = clamp(report.stats.outlierRemovedEvSol / report.assumptions.tradeSizeSol * 100 * 2.2, -18, 28);
  const winnerRemovedScore = clamp(report.stats.largestWinnerRemovedEvSol / report.assumptions.tradeSizeSol * 100 * 1.7, -16, 22);
  const drawdownPenalty = report.stats.maxDrawdownSol > report.assumptions.maxDrawdownSol
    ? 20
    : (report.stats.maxDrawdownSol / report.assumptions.maxDrawdownSol) * 8;

  return clamp(Math.round(verdictBase + sampleScore + robustEvScore + winnerRemovedScore + report.stats.confidenceScore * 0.24 - drawdownPenalty), 0, 99);
}

function discoveryStage(report: EvaluationReport): StrategyDiscoveryCandidate['stage'] {
  if (report.verdict === 'promote') return 'promotion_candidate';
  if (report.verdict === 'reject') return 'reject';
  return 'continue_proof';
}

function discoveryHeadline(report: EvaluationReport): string {
  switch (report.verdict) {
    case 'promote':
      return 'Candidate profile discovered: strong demo proof, still gated before capital.';
    case 'keep_testing':
      return 'Candidate profile needs more proof before promotion.';
    case 'reject':
      return 'Rejected in proof engine before any capital path.';
  }
}

function buildDiscoveryProofPoints(report: EvaluationReport): string[] {
  return [
    `${report.stats.selectedTrades} selected replay events`,
    `${formatSol(report.stats.outlierRemovedEvSol)} outlier-removed EV`,
    `${formatSol(report.stats.largestWinnerRemovedEvSol)} largest-winner-removed EV`,
  ];
}

function buildDiscoveryRiskFlags(report: EvaluationReport): string[] {
  const flags: string[] = [];
  if (report.stats.selectedTrades < 14) flags.push('low proof density');
  if (report.stats.outlierRemovedEvSol <= 0) flags.push('negative robust EV');
  if (report.stats.largestWinnerRemovedEvSol <= 0) flags.push('single-winner dependence');
  if (report.stats.maxDrawdownSol > report.assumptions.maxDrawdownSol) flags.push('drawdown breach');
  if (flags.length === 0) flags.push('no demo risk breach detected');
  return flags;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatSol(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toFixed(6)} SOL`;
}

export function formatPct(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}
