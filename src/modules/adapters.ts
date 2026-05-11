export interface MarketDataAdapter {
  id: string;
  name: string;
  description: string;
  source: string;
}

export interface StrategyRunner {
  id: string;
  name: string;
  input: string;
  output: string;
}

export const marketAdapters: MarketDataAdapter[] = [
  {
    id: 'launch-market',
    name: 'Launch market adapter',
    description: 'Normalizes new-asset flow, trades, liquidity, wallet concentration, and lifecycle snapshots.',
    source: 'Market stream or archive',
  },
  {
    id: 'dex-market',
    name: 'DEX market adapter',
    description: 'Connects thin-liquidity DEX markets, swaps, pools, and quote routes.',
    source: 'DEX route and quote APIs',
  },
];

export const strategyRunners: StrategyRunner[] = [
  {
    id: 'profile-json',
    name: 'Profile JSON runner',
    input: 'Candidate profile, feature gates, exit policy, and safety envelope.',
    output: 'Replay results, paper trade stream, and promotion evidence.',
  },
  {
    id: 'agent-report',
    name: 'Agent report runner',
    input: 'Third-party autonomous agent decisions and proposed trades.',
    output: 'Decision report: execution-adjusted EV, robustness, and canary verdict.',
  },
];
