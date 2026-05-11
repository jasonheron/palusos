export type GateStatus = 'pass' | 'watch' | 'fail';

export interface AgentMetric {
  label: string;
  value: string;
  delta?: string;
  status: GateStatus;
}

export interface TimelineStep {
  title: string;
  description: string;
  status: GateStatus;
}

export interface EvaluationGate {
  name: string;
  result: GateStatus;
  detail: string;
}

export interface DemoAgent {
  id: string;
  name: string;
  subtitle: string;
  market: string;
  verdict: 'Kill' | 'Keep Paper' | 'Canary Eligible';
  confidence: number;
  metrics: AgentMetric[];
  gates: EvaluationGate[];
  timeline: TimelineStep[];
  report: string;
}

export const demoAgents: DemoAgent[] = [
  {
    id: 'slow-bleed-reversal-v3',
    name: 'Slow Bleed Reversal v3',
    subtitle: 'Buys after sharp post-launch selloffs only when flow and holder signals recover.',
    market: 'Launch market feed',
    verdict: 'Keep Paper',
    confidence: 78,
    metrics: [
      { label: 'Replay trades', value: '214', delta: '+38 vs prior', status: 'pass' },
      { label: 'Paper PnL', value: '+3.84 SOL', delta: '30d window', status: 'pass' },
      { label: 'Execution-adjusted EV', value: '+0.012 SOL', delta: 'per trade', status: 'pass' },
      { label: 'Largest winner removed', value: '+0.006 SOL', delta: 'still positive', status: 'watch' },
      { label: 'Gap-loss exposure', value: '11.8%', delta: '-4.1%', status: 'watch' },
      { label: 'Canary readiness', value: '22 / 30', delta: 'closed proof trades', status: 'watch' },
    ],
    gates: [
      { name: 'Executable economics', result: 'pass', detail: 'Replay survives configured spread, route fees, and slippage assumptions.' },
      { name: 'Robustness', result: 'watch', detail: 'EV remains positive after removing the largest winner, but the drawdown cluster needs another paper cycle.' },
      { name: 'Safety envelope', result: 'pass', detail: 'Canary size is capped with a one-position-at-a-time policy.' },
      { name: 'Promotion decision', result: 'watch', detail: 'Keep in paper mode until 30 closed trades and runner acceptance are complete.' },
    ],
    timeline: [
      { title: 'Ingest', description: 'Live and historical market events are normalized into comparable snapshots.', status: 'pass' },
      { title: 'Discover', description: 'Search finds a structural reversal pocket instead of hand-tuned entry rules.', status: 'pass' },
      { title: 'Replay', description: 'Walk-forward replay rejects variants with stale labels or unrealistic exits.', status: 'pass' },
      { title: 'Calibrate', description: 'Paper PnL is discounted against execution cost assumptions and drift logs.', status: 'watch' },
      { title: 'Gate', description: 'Agent needs eight more closed proof trades and runner acceptance before promotion.', status: 'watch' },
    ],
    report: 'Candidate shows a plausible structural edge, but PalusOS keeps it in paper mode until proof density and runner safety are complete.',
  },
  {
    id: 'universal-snipe-v1',
    name: 'Universal Snipe v1',
    subtitle: 'Naive buy-every-launch baseline used to expose weak paper results and adverse selection.',
    market: 'New-asset launch feed',
    verdict: 'Kill',
    confidence: 94,
    metrics: [
      { label: 'Replay trades', value: '4,912', status: 'pass' },
      { label: 'Paper PnL', value: '+19.2 SOL', delta: 'before correction', status: 'watch' },
      { label: 'Execution-adjusted EV', value: '-0.021 SOL', delta: 'per trade', status: 'fail' },
      { label: 'Largest winner removed', value: '-0.044 SOL', delta: 'per trade', status: 'fail' },
      { label: 'Gap-loss exposure', value: '37.4%', status: 'fail' },
      { label: 'Canary readiness', value: '0 / 30', status: 'fail' },
    ],
    gates: [
      { name: 'Executable economics', result: 'fail', detail: 'Profits disappear after spread, latency, fees, and failed-exit assumptions.' },
      { name: 'Robustness', result: 'fail', detail: 'The curve depends on rare outliers and collapses when the biggest winners are capped.' },
      { name: 'Safety envelope', result: 'fail', detail: 'High churn would burn budget and exceed canary limits.' },
      { name: 'Promotion decision', result: 'fail', detail: 'Rejected automatically; useful only as a baseline benchmark.' },
    ],
    timeline: [
      { title: 'Ingest', description: 'New-asset stream provides wide coverage.', status: 'pass' },
      { title: 'Discover', description: 'Strategy is intentionally simple and not structural.', status: 'fail' },
      { title: 'Replay', description: 'Raw paper looks positive but relies on unrealistic exits.', status: 'watch' },
      { title: 'Calibrate', description: 'Quote-backed costs flip the result negative.', status: 'fail' },
      { title: 'Gate', description: 'Rejected before real capital is used.', status: 'fail' },
    ],
    report: 'This baseline shows why PalusOS exists: attractive paper charts can disappear once execution assumptions are applied.',
  },
  {
    id: 'agent-risk-sentinel',
    name: 'Agent Risk Sentinel',
    subtitle: 'A risk-only agent that vetoes trades when flow resembles bundle, concentration, or gap-loss patterns.',
    market: 'Thin-liquidity token markets',
    verdict: 'Canary Eligible',
    confidence: 86,
    metrics: [
      { label: 'Replay decisions', value: '1,087', status: 'pass' },
      { label: 'Avoided drawdown', value: '42%', delta: 'vs baseline', status: 'pass' },
      { label: 'False veto rate', value: '8.6%', status: 'watch' },
      { label: 'Execution-adjusted lift', value: '+0.018 SOL', delta: 'per allowed trade', status: 'pass' },
      { label: 'Largest winner removed', value: '+0.011 SOL', status: 'pass' },
      { label: 'Canary readiness', value: '30 / 30', status: 'pass' },
    ],
    gates: [
      { name: 'Executable economics', result: 'pass', detail: 'Lift remains positive after execution adjustment.' },
      { name: 'Robustness', result: 'pass', detail: 'Lower-half winners still cover losses after capping outliers.' },
      { name: 'Safety envelope', result: 'pass', detail: 'Risk-only veto can run under small canary limits without increasing trade size.' },
      { name: 'Promotion decision', result: 'pass', detail: 'Eligible for a bounded canary after runner acceptance.' },
    ],
    timeline: [
      { title: 'Ingest', description: 'Consumes launch flow, wallet concentration, velocity, and exit-liquidity features.', status: 'pass' },
      { title: 'Discover', description: 'Learns negative patterns instead of chasing positive alpha directly.', status: 'pass' },
      { title: 'Replay', description: 'Vetoes reduce loss clusters without depending on single outlier wins.', status: 'pass' },
      { title: 'Calibrate', description: 'Execution-adjusted lift survives conservative quote assumptions.', status: 'pass' },
      { title: 'Gate', description: 'Canary eligible under small limits and rollback triggers.', status: 'pass' },
    ],
    report: 'Strongest demo candidate: a safety agent that can improve a trading system by refusing structurally poor trades.',
  },
];
