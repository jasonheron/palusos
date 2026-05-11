# TrenchLab

**The learning and evaluation layer for autonomous Solana trading agents.**

TrenchLab turns noisy on-chain market data into strategy candidates, tests them in replay and paper mode, calibrates results against executable quote economics, and only graduates agents to bounded canaries when robust safety gates pass.

## Why this exists

Autonomous trading agents are easy to launch and hard to trust. Most demos stop at prompts, backtests, or fantasy paper PnL. TrenchLab acts as a flight recorder and safety gate: it tells builders whether an agent has execution-survivable edge before it touches meaningful funds.

## What this hackathon repo contains

This is a public-safe product shell extracted from a deeper PumpFun/Solana research system:

- polished landing page and demo UI;
- modular architecture for market adapters, strategy runners, evaluation gates, and reports;
- demo-safe agent evaluation data;
- tutorial and presentation outline;
- no secrets, private keys, `.env` files, or private databases.

## Demo flow

1. Choose a candidate trading agent.
2. Inspect replay and paper metrics.
3. Compare raw paper results against quote-adjusted execution reality.
4. Review robustness gates such as largest-winner-removed EV and rug/gap-loss exposure.
5. Get a final verdict: **Kill**, **Keep Paper**, or **Canary Eligible**.

## Quick start

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Project structure

```text
src/data/demoAgents.ts          demo-safe agent evidence
src/modules/adapters.ts         market and strategy adapter shapes
src/modules/evaluationEngine.ts gate scoring and verdict summary
src/components/AgentDashboard.tsx demo evaluation UI
docs/ARCHITECTURE.md            system design
docs/TUTORIAL.md                judge/builder walkthrough
presentation/SLIDES.md          submission presentation outline
```

## Category

Primary: **AI Platforms / Agents**

Secondary: **Data & Analytics**, **DeFi**, **Developer Infrastructure**

## Public-safe note

PumpFun is the first proving ground because it is fast, adversarial, and brutally honest about execution failure. This repo presents the evaluation layer, not a money-printing bot or production live-trading system.
