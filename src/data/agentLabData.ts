export interface MarketEvent {
  id: string;
  asset: string;
  scenario: string;
  signalScore: number;
  liquidityScore: number;
  realizedReturnPct: number;
  adverseDrawdownPct: number;
  routeRiskBps: number;
}

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  description: string;
  minSignalScore: number;
  minLiquidityScore: number;
  edgeAdjustmentPct: number;
  latencyPenaltyMultiplier: number;
}

export interface DataFeedDefinition {
  id: string;
  name: string;
  market: string;
  description: string;
  events: MarketEvent[];
}

export interface ModelDefinition {
  id: string;
  name: string;
  family: string;
  description: string;
  thresholdAdjustment: number;
  returnAdjustmentPct: number;
  confidenceAdjustment: number;
  routeCostReductionBps: number;
}

export const agentDefinitions: AgentDefinition[] = [
  {
    id: 'slow-bleed-reversal',
    name: 'Slow Bleed Reversal Agent',
    role: 'Recovery buyer',
    description: 'Looks for oversold launches where holder flow recovers before momentum returns.',
    minSignalScore: 66,
    minLiquidityScore: 42,
    edgeAdjustmentPct: 0.012,
    latencyPenaltyMultiplier: 1.0,
  },
  {
    id: 'breakout-chaser',
    name: 'Breakout Chaser Agent',
    role: 'Momentum entrant',
    description: 'Trades frequent high-velocity moves. Useful for exposing fee and latency fragility.',
    minSignalScore: 58,
    minLiquidityScore: 30,
    edgeAdjustmentPct: 0.002,
    latencyPenaltyMultiplier: 1.45,
  },
  {
    id: 'risk-sentinel',
    name: 'Risk Sentinel Agent',
    role: 'Veto / filter agent',
    description: 'Only allows trades when liquidity, route quality, and downside clusters look clean.',
    minSignalScore: 72,
    minLiquidityScore: 55,
    edgeAdjustmentPct: 0.018,
    latencyPenaltyMultiplier: 0.72,
  },
];

export const modelDefinitions: ModelDefinition[] = [
  {
    id: 'palus-gradient-v2',
    name: 'Palus Gradient v2',
    family: 'Gradient ensemble',
    description: 'Balanced demo model with modest uplift and normal selectivity.',
    thresholdAdjustment: 0,
    returnAdjustmentPct: 0.006,
    confidenceAdjustment: 4,
    routeCostReductionBps: 1.5,
  },
  {
    id: 'conservative-forest',
    name: 'Conservative Forest',
    family: 'Tree ensemble',
    description: 'Requires cleaner signals and discounts returns to avoid outlier dependence.',
    thresholdAdjustment: 7,
    returnAdjustmentPct: -0.004,
    confidenceAdjustment: 9,
    routeCostReductionBps: 2.5,
  },
  {
    id: 'fast-regime-probe',
    name: 'Fast Regime Probe',
    family: 'Latency-aware classifier',
    description: 'Admits more candidates, then offsets part of the latency drag in the execution model.',
    thresholdAdjustment: -5,
    returnAdjustmentPct: 0.002,
    confidenceAdjustment: -2,
    routeCostReductionBps: 5,
  },
];

const launchRecoveryEvents: MarketEvent[] = [
  { id: 'lr-01', asset: 'MINT-031', scenario: 'panic wick + holder recovery', signalScore: 82, liquidityScore: 68, realizedReturnPct: 0.21, adverseDrawdownPct: 0.08, routeRiskBps: 18 },
  { id: 'lr-02', asset: 'MINT-044', scenario: 'selloff exhaustion', signalScore: 75, liquidityScore: 57, realizedReturnPct: 0.13, adverseDrawdownPct: 0.07, routeRiskBps: 20 },
  { id: 'lr-03', asset: 'MINT-052', scenario: 'thin bounce fakeout', signalScore: 63, liquidityScore: 34, realizedReturnPct: -0.24, adverseDrawdownPct: 0.28, routeRiskBps: 42 },
  { id: 'lr-04', asset: 'MINT-066', scenario: 'flow recovery', signalScore: 79, liquidityScore: 64, realizedReturnPct: 0.18, adverseDrawdownPct: 0.10, routeRiskBps: 17 },
  { id: 'lr-05', asset: 'MINT-071', scenario: 'late recovery', signalScore: 69, liquidityScore: 50, realizedReturnPct: 0.045, adverseDrawdownPct: 0.09, routeRiskBps: 24 },
  { id: 'lr-06', asset: 'MINT-088', scenario: 'bundle concentration', signalScore: 71, liquidityScore: 39, realizedReturnPct: -0.18, adverseDrawdownPct: 0.32, routeRiskBps: 38 },
  { id: 'lr-07', asset: 'MINT-104', scenario: 'clean mean reversion', signalScore: 86, liquidityScore: 72, realizedReturnPct: 0.27, adverseDrawdownPct: 0.06, routeRiskBps: 15 },
  { id: 'lr-08', asset: 'MINT-119', scenario: 'recovering liquidity', signalScore: 74, liquidityScore: 61, realizedReturnPct: 0.092, adverseDrawdownPct: 0.08, routeRiskBps: 19 },
  { id: 'lr-09', asset: 'MINT-123', scenario: 'dead-cat bounce', signalScore: 67, liquidityScore: 47, realizedReturnPct: -0.075, adverseDrawdownPct: 0.20, routeRiskBps: 31 },
  { id: 'lr-10', asset: 'MINT-137', scenario: 'strong reclaim', signalScore: 90, liquidityScore: 80, realizedReturnPct: 0.35, adverseDrawdownPct: 0.05, routeRiskBps: 12 },
  { id: 'lr-11', asset: 'MINT-142', scenario: 'sideways churn', signalScore: 68, liquidityScore: 44, realizedReturnPct: 0.018, adverseDrawdownPct: 0.11, routeRiskBps: 27 },
  { id: 'lr-12', asset: 'MINT-155', scenario: 'holder recovery + volume', signalScore: 83, liquidityScore: 69, realizedReturnPct: 0.16, adverseDrawdownPct: 0.07, routeRiskBps: 16 },
  { id: 'lr-13', asset: 'MINT-160', scenario: 'route degradation', signalScore: 76, liquidityScore: 52, realizedReturnPct: -0.035, adverseDrawdownPct: 0.16, routeRiskBps: 35 },
  { id: 'lr-14', asset: 'MINT-177', scenario: 'capitulation rebound', signalScore: 81, liquidityScore: 66, realizedReturnPct: 0.145, adverseDrawdownPct: 0.09, routeRiskBps: 19 },
  { id: 'lr-15', asset: 'MINT-188', scenario: 'news-driven outlier', signalScore: 88, liquidityScore: 71, realizedReturnPct: 0.62, adverseDrawdownPct: 0.04, routeRiskBps: 14 },
  { id: 'lr-16', asset: 'MINT-193', scenario: 'late liquidity fade', signalScore: 72, liquidityScore: 49, realizedReturnPct: -0.11, adverseDrawdownPct: 0.22, routeRiskBps: 33 },
  { id: 'lr-17', asset: 'MINT-204', scenario: 'orderly recovery', signalScore: 78, liquidityScore: 63, realizedReturnPct: 0.105, adverseDrawdownPct: 0.07, routeRiskBps: 18 },
  { id: 'lr-18', asset: 'MINT-218', scenario: 'clean reclaim', signalScore: 85, liquidityScore: 76, realizedReturnPct: 0.19, adverseDrawdownPct: 0.06, routeRiskBps: 13 },
  { id: 'lr-19', asset: 'MINT-225', scenario: 'weak reclaim', signalScore: 70, liquidityScore: 43, realizedReturnPct: -0.045, adverseDrawdownPct: 0.18, routeRiskBps: 29 },
  { id: 'lr-20', asset: 'MINT-239', scenario: 'flow + liquidity alignment', signalScore: 84, liquidityScore: 74, realizedReturnPct: 0.225, adverseDrawdownPct: 0.05, routeRiskBps: 13 },
  { id: 'lr-21', asset: 'MINT-248', scenario: 'median winner', signalScore: 77, liquidityScore: 58, realizedReturnPct: 0.082, adverseDrawdownPct: 0.09, routeRiskBps: 21 },
  { id: 'lr-22', asset: 'MINT-260', scenario: 'small failed reclaim', signalScore: 73, liquidityScore: 53, realizedReturnPct: -0.028, adverseDrawdownPct: 0.14, routeRiskBps: 26 },
];

const majorsPerpEvents: MarketEvent[] = [
  { id: 'mp-01', asset: 'BTC-PERP', scenario: 'trend continuation', signalScore: 78, liquidityScore: 92, realizedReturnPct: 0.018, adverseDrawdownPct: 0.012, routeRiskBps: 4 },
  { id: 'mp-02', asset: 'ETH-PERP', scenario: 'failed breakout', signalScore: 61, liquidityScore: 88, realizedReturnPct: -0.014, adverseDrawdownPct: 0.025, routeRiskBps: 5 },
  { id: 'mp-03', asset: 'SOL-PERP', scenario: 'clean impulse', signalScore: 84, liquidityScore: 84, realizedReturnPct: 0.041, adverseDrawdownPct: 0.018, routeRiskBps: 6 },
  { id: 'mp-04', asset: 'BTC-PERP', scenario: 'chop zone', signalScore: 66, liquidityScore: 95, realizedReturnPct: -0.006, adverseDrawdownPct: 0.019, routeRiskBps: 4 },
  { id: 'mp-05', asset: 'ETH-PERP', scenario: 'funding squeeze', signalScore: 73, liquidityScore: 90, realizedReturnPct: 0.026, adverseDrawdownPct: 0.015, routeRiskBps: 5 },
  { id: 'mp-06', asset: 'SOL-PERP', scenario: 'late breakout', signalScore: 69, liquidityScore: 79, realizedReturnPct: 0.007, adverseDrawdownPct: 0.021, routeRiskBps: 7 },
  { id: 'mp-07', asset: 'BTC-PERP', scenario: 'stop run reversal', signalScore: 59, liquidityScore: 91, realizedReturnPct: -0.022, adverseDrawdownPct: 0.03, routeRiskBps: 4 },
  { id: 'mp-08', asset: 'ETH-PERP', scenario: 'range expansion', signalScore: 82, liquidityScore: 87, realizedReturnPct: 0.035, adverseDrawdownPct: 0.014, routeRiskBps: 5 },
  { id: 'mp-09', asset: 'SOL-PERP', scenario: 'volatility spike', signalScore: 76, liquidityScore: 76, realizedReturnPct: -0.011, adverseDrawdownPct: 0.034, routeRiskBps: 8 },
  { id: 'mp-10', asset: 'BTC-PERP', scenario: 'breakout follow-through', signalScore: 87, liquidityScore: 93, realizedReturnPct: 0.052, adverseDrawdownPct: 0.01, routeRiskBps: 4 },
  { id: 'mp-11', asset: 'ETH-PERP', scenario: 'low-vol grind', signalScore: 71, liquidityScore: 86, realizedReturnPct: 0.011, adverseDrawdownPct: 0.012, routeRiskBps: 5 },
  { id: 'mp-12', asset: 'SOL-PERP', scenario: 'mean reversion loss', signalScore: 64, liquidityScore: 77, realizedReturnPct: -0.019, adverseDrawdownPct: 0.031, routeRiskBps: 8 },
];

const dexFlowEvents: MarketEvent[] = [
  { id: 'df-01', asset: 'POOL-A', scenario: 'LP inflow', signalScore: 74, liquidityScore: 62, realizedReturnPct: 0.075, adverseDrawdownPct: 0.052, routeRiskBps: 19 },
  { id: 'df-02', asset: 'POOL-B', scenario: 'route split', signalScore: 68, liquidityScore: 58, realizedReturnPct: -0.032, adverseDrawdownPct: 0.11, routeRiskBps: 28 },
  { id: 'df-03', asset: 'POOL-C', scenario: 'volume continuation', signalScore: 80, liquidityScore: 70, realizedReturnPct: 0.14, adverseDrawdownPct: 0.047, routeRiskBps: 16 },
  { id: 'df-04', asset: 'POOL-D', scenario: 'LP pull warning', signalScore: 65, liquidityScore: 35, realizedReturnPct: -0.16, adverseDrawdownPct: 0.26, routeRiskBps: 46 },
  { id: 'df-05', asset: 'POOL-E', scenario: 'stable route', signalScore: 77, liquidityScore: 74, realizedReturnPct: 0.088, adverseDrawdownPct: 0.04, routeRiskBps: 14 },
  { id: 'df-06', asset: 'POOL-F', scenario: 'quote fade', signalScore: 72, liquidityScore: 51, realizedReturnPct: -0.041, adverseDrawdownPct: 0.13, routeRiskBps: 34 },
  { id: 'df-07', asset: 'POOL-G', scenario: 'flow compression', signalScore: 83, liquidityScore: 78, realizedReturnPct: 0.155, adverseDrawdownPct: 0.045, routeRiskBps: 13 },
  { id: 'df-08', asset: 'POOL-H', scenario: 'toxic flow', signalScore: 59, liquidityScore: 48, realizedReturnPct: -0.095, adverseDrawdownPct: 0.19, routeRiskBps: 39 },
  { id: 'df-09', asset: 'POOL-I', scenario: 'clean rotation', signalScore: 85, liquidityScore: 81, realizedReturnPct: 0.19, adverseDrawdownPct: 0.035, routeRiskBps: 12 },
  { id: 'df-10', asset: 'POOL-J', scenario: 'late route stall', signalScore: 70, liquidityScore: 56, realizedReturnPct: 0.012, adverseDrawdownPct: 0.08, routeRiskBps: 31 },
  { id: 'df-11', asset: 'POOL-K', scenario: 'deep liquidity reclaim', signalScore: 88, liquidityScore: 84, realizedReturnPct: 0.21, adverseDrawdownPct: 0.032, routeRiskBps: 11 },
  { id: 'df-12', asset: 'POOL-L', scenario: 'fragmented liquidity', signalScore: 67, liquidityScore: 44, realizedReturnPct: -0.052, adverseDrawdownPct: 0.15, routeRiskBps: 37 },
];

export const dataFeedDefinitions: DataFeedDefinition[] = [
  {
    id: 'launch-recovery-demo',
    name: 'Launch Recovery Demo Feed',
    market: 'New-token launch flow',
    description: 'Bundled public-safe demo rows that resemble launch-market replays without private infra or wallets.',
    events: launchRecoveryEvents,
  },
  {
    id: 'majors-perp-demo',
    name: 'Major Perps Demo Feed',
    market: 'BTC / ETH / SOL perps',
    description: 'Lower-return, higher-liquidity trend and chop examples for testing execution-cost sensitivity.',
    events: majorsPerpEvents,
  },
  {
    id: 'dex-flow-demo',
    name: 'DEX Flow Demo Feed',
    market: 'DEX pool flow',
    description: 'Route-quality and LP-flow examples with both clean and toxic liquidity scenarios.',
    events: dexFlowEvents,
  },
];
