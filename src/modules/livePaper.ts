import {
  agentDefinitions,
  dataFeedDefinitions,
  modelDefinitions,
  type AgentDefinition,
  type DataFeedDefinition,
  type MarketEvent,
  type ModelDefinition,
} from '../data/agentLabData.ts';
import {
  defaultExecutionAssumptions,
  discoverStrategyProfiles,
  evaluateAgentLab,
  type AgentLabVerdict,
  type EvaluationReport,
} from './evaluationEngine.ts';

export type LiveFeedMode = 'rpc-live-readonly' | 'demo-fallback';
export type LiveEventSource = 'solana-rpc' | 'bundled-demo';
export type LiveFallbackReason = 'missing_rpc_env' | 'rpc_error' | 'empty_rpc_result' | 'client_fetch_error';
export type PaperQuoteStatus = 'not_configured' | 'quoted' | 'partial' | 'unroutable' | 'error';

export interface PumpProgramTarget {
  label: string;
  address: string;
}

export interface RpcSignatureRecord {
  signature: string;
  slot?: number;
  err?: unknown;
  memo?: string | null;
  blockTime?: number | null;
  confirmationStatus?: string;
}

export interface PaperQuoteObservation {
  status: PaperQuoteStatus;
  inputSol: number;
  outputMint?: string;
  buyOutAmount?: string;
  roundTripSol?: number;
  roundTripReturnPct?: number;
  priceImpactPct?: number;
  routePlanHops?: number;
  error?: string;
}

export interface LiveMarketEvent extends MarketEvent {
  signature: string;
  mint?: string;
  timestamp: string;
  source: LiveEventSource;
  programName: string;
  programId?: string;
  score: number;
  provenance: string;
  quote?: PaperQuoteObservation;
}

export interface LiveFeedMeta {
  mode: LiveFeedMode;
  generatedAt: string;
  reason?: LiveFallbackReason;
  readOnly: true;
  paperOnly: true;
  wallet: 'none';
  sourceLabel: string;
  scoreMethod: string;
  quoteSource: string;
  polledPrograms: PumpProgramTarget[];
}

export interface LivePaperDecision {
  eventId: string;
  signature: string;
  asset: string;
  action: 'paper_candidate' | 'paper_skip';
  score: number;
  reason: string;
  quoteStatus: PaperQuoteStatus;
}

export interface LivePaperSelection {
  agentId?: string;
  modelId?: string;
}

export interface LivePaperSnapshot {
  meta: LiveFeedMeta;
  events: LiveMarketEvent[];
  selectedProfile: {
    profileId: string;
    agentId: string;
    modelId: string;
    agentName: string;
    modelName: string;
    dataFeedName: string;
    proofScore: number;
    stage: string;
  };
  paper: {
    verdict: AgentLabVerdict;
    verdictLabel: string;
    action: string;
    decisions: LivePaperDecision[];
    metrics: Pick<EvaluationReport['stats'], 'selectedTrades' | 'averageEvSol' | 'outlierRemovedEvSol' | 'largestWinnerRemovedEvSol' | 'maxDrawdownSol' | 'confidenceScore'>;
    rationale: string[];
  };
}

export const SOL_MINT = 'So11111111111111111111111111111111111111112';

export const PUMP_PROGRAM_TARGETS: PumpProgramTarget[] = [
  {
    label: 'Pump.fun bonding curve program',
    address: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  },
  {
    label: 'PumpSwap AMM program',
    address: 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA',
  },
];

export function normalizeRpcSignatures(records: RpcSignatureRecord[], program: PumpProgramTarget, limit = 12): LiveMarketEvent[] {
  return records
    .filter((record) => typeof record.signature === 'string' && record.signature.length > 0 && !record.err)
    .slice(0, limit)
    .map((record, index) => signatureRecordToEvent(record, program, index));
}

export function enrichEventWithMint(event: LiveMarketEvent, mint?: string): LiveMarketEvent {
  if (!mint || mint === SOL_MINT) return event;
  return {
    ...event,
    mint,
    asset: mint.endsWith('pump') ? `PUMP-${mint.slice(0, 4)}…pump` : `MINT-${mint.slice(0, 4)}…${mint.slice(-4)}`,
    scenario: `${event.programName} token activity observed; awaiting server-side Jupiter paper quote`,
  };
}

export function applyPaperQuoteObservation(event: LiveMarketEvent, quote: PaperQuoteObservation): LiveMarketEvent {
  if (quote.status !== 'quoted' || typeof quote.roundTripReturnPct !== 'number') {
    return { ...event, quote };
  }

  const roundTripLossBps = Math.max(0, -quote.roundTripReturnPct * 10_000);
  const priceImpactBps = Math.max(0, (quote.priceImpactPct ?? 0) * 100);
  const routeRiskBps = Math.round(clamp(12 + roundTripLossBps * 0.35 + priceImpactBps * 0.5, 8, 95));
  const liquidityScore = Math.round(clamp(92 - routeRiskBps * 0.85, 12, 96));
  const quotePenalty = Math.min(0.06, Math.max(0, -quote.roundTripReturnPct));

  return {
    ...event,
    liquidityScore,
    routeRiskBps,
    realizedReturnPct: round4(event.realizedReturnPct - quotePenalty),
    scenario: `${event.programName} activity with Jupiter paper round-trip quote`,
    provenance: 'Read-only RPC event enriched with server-side Jupiter quote. No wallet, signing, swap, or broadcast.',
    quote,
  };
}

export function buildFallbackLivePaperSnapshot(
  reason: LiveFallbackReason = 'missing_rpc_env',
  selection: LivePaperSelection = {},
): LivePaperSnapshot {
  const now = Date.now();
  const events = dataFeedDefinitions[0].events.slice(0, 12).map((event, index) => ({
    ...event,
    signature: `demo-${event.id}`,
    timestamp: new Date(now - index * 45_000).toISOString(),
    source: 'bundled-demo' as const,
    programName: 'Bundled PalusOS demo rows',
    score: event.signalScore,
    provenance: 'Bundled public-safe replay row; not live chain data.',
    quote: { status: 'not_configured' as const, inputSol: defaultExecutionAssumptions.tradeSizeSol },
  }));

  return buildLivePaperSnapshot(events, {
    mode: 'demo-fallback',
    generatedAt: new Date(now).toISOString(),
    reason,
    readOnly: true,
    paperOnly: true,
    wallet: 'none',
    sourceLabel: 'Bundled demo fallback',
    scoreMethod: 'original bundled demo scores and replay returns',
    quoteSource: 'disabled in fallback; set PALUS_JUPITER_API_KEY server-side for live paper quotes',
    polledPrograms: PUMP_PROGRAM_TARGETS,
  }, selection);
}

export function buildRpcLivePaperSnapshot(events: LiveMarketEvent[], selection: LivePaperSelection = {}): LivePaperSnapshot {
  if (events.length === 0) return buildFallbackLivePaperSnapshot('empty_rpc_result', selection);

  const hasQuotes = events.some((event) => event.quote?.status === 'quoted');
  const hasAttempts = events.some((event) => event.quote && event.quote.status !== 'not_configured');

  return buildLivePaperSnapshot(events, {
    mode: 'rpc-live-readonly',
    generatedAt: new Date().toISOString(),
    readOnly: true,
    paperOnly: true,
    wallet: 'none',
    sourceLabel: 'Server-side Solana RPC read-only feed',
    scoreMethod: hasQuotes
      ? 'RPC signatures scored deterministically and adjusted with server-side Jupiter paper round-trip quotes'
      : 'RPC signatures scored deterministically; quote fields unavailable or disabled',
    quoteSource: hasQuotes
      ? 'Jupiter quote API via server-side PALUS_JUPITER_API_KEY'
      : hasAttempts
        ? 'Jupiter quote attempted server-side; some routes unavailable'
        : 'Jupiter quote not configured',
    polledPrograms: PUMP_PROGRAM_TARGETS,
  }, selection);
}

export function buildClientFetchFallbackSnapshot(selection: LivePaperSelection = {}): LivePaperSnapshot {
  return buildFallbackLivePaperSnapshot('client_fetch_error', selection);
}

export function buildLivePaperSnapshot(events: LiveMarketEvent[], meta: LiveFeedMeta, selection: LivePaperSelection = {}): LivePaperSnapshot {
  const dataFeed: DataFeedDefinition = {
    id: meta.mode === 'rpc-live-readonly' ? 'rpc-readonly-pump-activity' : 'bundled-demo-live-fallback',
    name: meta.mode === 'rpc-live-readonly' ? 'RPC Pump activity read-only feed' : 'Bundled live-demo fallback feed',
    market: meta.mode === 'rpc-live-readonly' ? 'Pump / PumpSwap recent signatures' : 'Public-safe demo launch flow',
    description: meta.mode === 'rpc-live-readonly'
      ? 'Recent program signatures normalized into PalusOS events. Read-only input; paper only; no wallet.'
      : 'Bundled replay rows used when live RPC is not configured or unavailable.',
    events,
  };

  const selectedAgent = resolveAgent(selection.agentId);
  const selectedModel = resolveModel(selection.modelId);
  const report = selectedAgent && selectedModel
    ? evaluateAgentLab({ agent: selectedAgent, dataFeed, model: selectedModel, assumptions: defaultExecutionAssumptions })
    : discoverStrategyProfiles(agentDefinitions, [dataFeed], modelDefinitions, defaultExecutionAssumptions)[0].report;

  const proofScore = discoverStrategyProfiles([report.agent], [dataFeed], [report.model], defaultExecutionAssumptions)[0].proofScore;
  const stage = discoverStrategyProfiles([report.agent], [dataFeed], [report.model], defaultExecutionAssumptions)[0].stage;
  const decisions = events.slice(0, 8).map((event) => buildPaperDecision(event, report));

  return {
    meta,
    events,
    selectedProfile: {
      profileId: `${report.agent.id}__${dataFeed.id}__${report.model.id}`,
      agentId: report.agent.id,
      modelId: report.model.id,
      agentName: report.agent.name,
      modelName: report.model.name,
      dataFeedName: dataFeed.name,
      proofScore,
      stage,
    },
    paper: {
      verdict: report.verdict,
      verdictLabel: report.verdictLabel,
      action: report.action,
      decisions,
      metrics: {
        selectedTrades: report.stats.selectedTrades,
        averageEvSol: report.stats.averageEvSol,
        outlierRemovedEvSol: report.stats.outlierRemovedEvSol,
        largestWinnerRemovedEvSol: report.stats.largestWinnerRemovedEvSol,
        maxDrawdownSol: report.stats.maxDrawdownSol,
        confidenceScore: report.stats.confidenceScore,
      },
      rationale: report.rationale,
    },
  };
}

function signatureRecordToEvent(record: RpcSignatureRecord, program: PumpProgramTarget, index: number): LiveMarketEvent {
  const seed = hashToUnit(`${record.signature}:${record.slot ?? index}`);
  const altSeed = hashToUnit(`${record.slot ?? index}:${record.signature}`);
  const signalScore = clamp(Math.round(48 + seed * 47), 1, 99);
  const liquidityScore = clamp(Math.round(35 + altSeed * 55), 1, 99);
  const routeRiskBps = Math.round(12 + (1 - liquidityScore / 100) * 38);
  const realizedReturnPct = round4((seed - 0.38) * 0.28);
  const adverseDrawdownPct = round4(0.035 + (1 - altSeed) * 0.24);
  const timestamp = record.blockTime ? new Date(record.blockTime * 1000).toISOString() : new Date().toISOString();
  const shortProgram = program.label.includes('Swap') ? 'PSWAP' : 'PUMP';

  return {
    id: `live-${record.signature.slice(0, 12)}`,
    asset: `${shortProgram}-${record.signature.slice(0, 4)}…${record.signature.slice(-4)}`,
    scenario: `${program.label} signature observed; token mint resolved server-side when possible`,
    signalScore,
    liquidityScore,
    realizedReturnPct,
    adverseDrawdownPct,
    routeRiskBps,
    signature: record.signature,
    timestamp,
    source: 'solana-rpc',
    programName: program.label,
    programId: program.address,
    score: signalScore,
    provenance: 'Read-only getSignaturesForAddress record; no transaction signing or broadcasting.',
    quote: { status: 'not_configured', inputSol: defaultExecutionAssumptions.tradeSizeSol },
  };
}

function buildPaperDecision(event: LiveMarketEvent, report: EvaluationReport): LivePaperDecision {
  const selected = event.signalScore >= report.threshold && event.liquidityScore >= report.agent.minLiquidityScore;
  const quoteNote = event.quote?.status === 'quoted'
    ? ` Jupiter paper round-trip ${((event.quote.roundTripReturnPct ?? 0) * 100).toFixed(2)}%.`
    : event.quote?.status && event.quote.status !== 'not_configured'
      ? ` Jupiter quote status: ${event.quote.status}.`
      : '';

  return {
    eventId: event.id,
    signature: event.signature,
    asset: event.asset,
    action: selected ? 'paper_candidate' : 'paper_skip',
    score: event.score,
    quoteStatus: event.quote?.status ?? 'not_configured',
    reason: selected
      ? `Meets paper threshold ${report.threshold} and liquidity floor ${report.agent.minLiquidityScore}; observation only.${quoteNote}`
      : `Below threshold ${report.threshold} or liquidity floor ${report.agent.minLiquidityScore}; skipped in paper logic.${quoteNote}`,
  };
}

function resolveAgent(agentId?: string): AgentDefinition | undefined {
  return agentDefinitions.find((agent) => agent.id === agentId);
}

function resolveModel(modelId?: string): ModelDefinition | undefined {
  return modelDefinitions.find((model) => model.id === modelId);
}

function hashToUnit(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
