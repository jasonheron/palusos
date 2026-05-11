# Submission copy

## Description under 500 chars

TrenchLab is the learning and evaluation layer for autonomous Solana trading agents. It turns noisy on-chain market data into strategy candidates, tests them in replay and paper mode, calibrates results against executable quote economics, and only graduates agents to bounded canaries when robust safety gates pass.

## What are you building, and who is it for?

We are building TrenchLab, an evidence layer for autonomous trading agents on Solana. It is for builders, quants, agent teams, and power users who need to know whether a trading agent has real edge before letting it touch funds. TrenchLab ingests live and historical market flow, discovers candidate strategies, runs replay and paper validation, adjusts results for executable quote/slippage reality, and produces an auditable verdict: kill, keep testing, or graduate to a tiny guarded canary. PumpFun/memecoins are our first proving ground because they are fast, adversarial, and brutally honest about whether an agent can survive real execution.

## Why did you decide to build this, and why build it now?

Autonomous trading agents are suddenly easy to launch, but hard to trust. Most demos stop at prompts, backtests, or fantasy paper PnL, then fail when rugs, latency, slippage, quote failures, and adverse selection hit real Solana execution. We built this because we needed a truth layer for our own PumpFun research system: something that learns from market data, punishes fake edge, records drift, and prevents unsafe promotion. Now is the right time because Solana has the speed, liquidity, agent tooling, and memecoin market structure to make autonomous agents inevitable — but without evaluation infrastructure, users will not know which agents are robust and which are just overfit gambling bots.

## Technologies/integrations

Solana, PumpFun/PumpPortal, Yellowstone/Flux-style real-time streaming, SQLite, Python ML pipeline, XGBoost/scikit-learn-style tabular ML, TypeScript/Node.js collector/dashboard/orchestration, quote-backed execution calibration, paper/live-sim/dev-wallet canary framework, OpenClaw AI agent workflows.

## Category

Best single category: **AI Platforms / Agents**.

If multi-select is available: **AI Platforms / Agents**, **Data & Analytics**, **DeFi**, **Developer Infrastructure**.
