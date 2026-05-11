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
    subtitle: 'Buys post-launch capitulation only when order-flow and holder structure recover.',
    market: 'PumpFun memecoin launches',
    verdict: 'Keep Paper',
    confidence: 78,
    metrics: [
      { label: 'Replay trades', value: '214', delta: '+38 vs prior', status: 'pass' },
      { label: 'Paper PnL', value: '+3.84 SOL', delta: '30d window', status: 'pass' },
      { label: 'Quote-adjusted EV', value: '+0.012 SOL', delta: 'per trade', status: 'pass' },
      { label: 'Largest winner removed', value: '+0.006 SOL', delta: 'still positive', status: 'watch' },
      { label: 'Rug / gap-loss exposure', value: '11.8%', delta: '-4.1%', status: 'watch' },
      { label: 'Canary readiness', value: '22 / 30', delta: 'closed proof trades', status: 'watch' },
    ],
    gates: [
      { name: 'Executable quote economics', result: 'pass', detail: 'Replay survives buy/sell quote spread, route fees, and configured slippage.' },
      { name: 'Robustness', result: 'watch', detail: 'EV remains positive after removing the largest winner, but drawdown cluster needs another paper cycle.' },
      { name: 'Safety envelope', result: 'pass', detail: 'Max canary size capped at 0.005 SOL with one-position-at-a-time policy.' },
      { name: 'Promotion decision', result: 'watch', detail: 'Keep in PAPER until 30 closed trades and runner acceptance test are both complete.' },
    ],
    timeline: [
      { title: 'Ingest', description: 'Live PumpFun flow and historical lifecycle data are normalized into market snapshots.', status: 'pass' },
      { title: 'Discover', description: 'Quant search finds a structural reversal pocket instead of hand-tuned sniping rules.', status: 'pass' },
      { title: 'Replay', description: 'Walk-forward replay rejects variants with stale labels or fantasy exits.', status: 'pass' },
      { title: 'Calibrate', description: 'Paper PnL is discounted against executable route economics and drift logs.', status: 'watch' },
      { title: 'Gate', description: 'Agent is not live yet: it needs eight more closed proof trades and runner acceptance.', status: 'watch' },
    ],
    report: 'Candidate has a plausible structural edge, but PalusOS refuses to promote it until proof density and canary runner safety are complete.',
  },
  {
    id: 'universal-snipe-v1',
    name: 'Universal Snipe v1',
    subtitle: 'Naive buy-every-launch baseline used to expose fantasy PnL and adverse selection.',
    market: 'All new PumpFun launches',
    verdict: 'Kill',
    confidence: 94,
    metrics: [
      { label: 'Replay trades', value: '4,912', status: 'pass' },
      { label: 'Paper PnL', value: '+19.2 SOL', delta: 'before correction', status: 'watch' },
      { label: 'Quote-adjusted EV', value: '-0.021 SOL', delta: 'per trade', status: 'fail' },
      { label: 'Largest winner removed', value: '-0.044 SOL', delta: 'per trade', status: 'fail' },
      { label: 'Rug / gap-loss exposure', value: '37.4%', status: 'fail' },
      { label: 'Canary readiness', value: '0 / 30', status: 'fail' },
    ],
    gates: [
      { name: 'Executable quote economics', result: 'fail', detail: 'Profits disappear after route spread, latency, fees, and failed exit assumptions.' },
      { name: 'Robustness', result: 'fail', detail: 'The curve is carried by rare moons and collapses when the biggest winners are capped.' },
      { name: 'Safety envelope', result: 'fail', detail: 'High churn would burn budget and overload canary limits.' },
      { name: 'Promotion decision', result: 'fail', detail: 'Killed automatically; useful only as a baseline benchmark.' },
    ],
    timeline: [
      { title: 'Ingest', description: 'New-token stream provides wide coverage.', status: 'pass' },
      { title: 'Discover', description: 'Strategy is intentionally simple and not structural.', status: 'fail' },
      { title: 'Replay', description: 'Raw paper looks positive but uses non-executable exits.', status: 'watch' },
      { title: 'Calibrate', description: 'Quote-backed costs flip the result negative.', status: 'fail' },
      { title: 'Gate', description: 'Killed before touching a dev wallet.', status: 'fail' },
    ],
    report: 'This is the kind of agent PalusOS exists to stop: exciting paper charts, negative executable economics.',
  },
  {
    id: 'agent-risk-sentinel',
    name: 'Agent Risk Sentinel',
    subtitle: 'A risk-only agent that vetoes trades when flow resembles rug, bundle, or gap-loss patterns.',
    market: 'Solana launchpads and thin-liquidity tokens',
    verdict: 'Canary Eligible',
    confidence: 86,
    metrics: [
      { label: 'Replay decisions', value: '1,087', status: 'pass' },
      { label: 'Avoided drawdown', value: '42%', delta: 'vs baseline', status: 'pass' },
      { label: 'False veto rate', value: '8.6%', status: 'watch' },
      { label: 'Quote-adjusted lift', value: '+0.018 SOL', delta: 'per allowed trade', status: 'pass' },
      { label: 'Largest winner removed', value: '+0.011 SOL', status: 'pass' },
      { label: 'Canary readiness', value: '30 / 30', status: 'pass' },
    ],
    gates: [
      { name: 'Executable quote economics', result: 'pass', detail: 'Lift remains positive after execution adjustment.' },
      { name: 'Robustness', result: 'pass', detail: 'Lower-half winners still cover actual losses after capping outliers.' },
      { name: 'Safety envelope', result: 'pass', detail: 'Risk-only veto can run in tiny canary without increasing trade size.' },
      { name: 'Promotion decision', result: 'pass', detail: 'Eligible for a bounded dev-wallet canary after runner acceptance test.' },
    ],
    timeline: [
      { title: 'Ingest', description: 'Consumes launch flow, wallet concentration, velocity, and exit liquidity features.', status: 'pass' },
      { title: 'Discover', description: 'Learns negative patterns instead of chasing positive alpha directly.', status: 'pass' },
      { title: 'Replay', description: 'Vetoes reduce loss clusters without depending on single moonshots.', status: 'pass' },
      { title: 'Calibrate', description: 'Execution-adjusted lift survives conservative quote assumptions.', status: 'pass' },
      { title: 'Gate', description: 'Canary eligible under small dev-wallet limits and rollback triggers.', status: 'pass' },
    ],
    report: 'Best demo candidate: a safety agent that improves any trading system by refusing structurally bad trades.',
  },
];
