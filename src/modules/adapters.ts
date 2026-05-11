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
    id: 'pumpfun',
    name: 'PumpFun adapter',
    description: 'Normalizes launch flow, trades, reserves, wallet concentration, and lifecycle snapshots.',
    source: 'PumpPortal / Solana stream',
  },
  {
    id: 'solana-dex',
    name: 'Solana DEX adapter',
    description: 'Future adapter for thin-liquidity DEX markets, swaps, pools, and quote routes.',
    source: 'DEX route + quote APIs',
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
    output: 'Truth report: execution-adjusted EV, robustness, and canary verdict.',
  },
];
