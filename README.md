# PalusOS

**The learning layer for agentic trading agents.**

PalusOS evaluates trading agents and strategies against real market data, realistic execution assumptions, and safety gates. It turns noisy market behavior into clear reports: reject the strategy, keep testing it, or graduate it carefully under limits.

## Why this exists

Trading agents are easy to launch and hard to trust. Backtests and paper PnL can look convincing until slippage, latency, fees, failed exits, and adverse selection show up. PalusOS gives teams a repeatable way to test whether an agent has execution-survivable edge before real capital is at risk.

## What this repo contains

- polished landing page and demo UI;
- modular architecture for market adapters, strategy runners, evaluation gates, and reports;
- demo agent evaluation data;
- tutorial and presentation outline;
- no secrets, private keys, `.env` files, or private databases.

## Demo flow

1. Choose a candidate trading agent.
2. Inspect replay and paper metrics.
3. Compare raw paper results against execution-adjusted assumptions.
4. Review robustness gates such as largest-winner-removed EV and gap-loss exposure.
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
src/data/demoAgents.ts             demo agent evidence
src/modules/adapters.ts            market and strategy adapter shapes
src/modules/evaluationEngine.ts    gate scoring and verdict summary
src/components/AgentDashboard.tsx  demo evaluation UI
docs/ARCHITECTURE.md               system design
docs/TUTORIAL.md                   product walkthrough
presentation/SLIDES.md             submission presentation outline
```

## Category

Primary: **AI Platforms / Agents**

Secondary: **Data & Analytics**, **DeFi**, **Developer Infrastructure**

## Scope

PalusOS is evaluation and reporting infrastructure. Bring the market feed, agent logs, and execution assumptions you use; PalusOS provides the structure to test, compare, gate, and explain the result.
