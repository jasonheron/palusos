# Submission copy

## Description under 500 chars

PalusOS is the discovery and proof engine for autonomous trading agents. It searches for candidate trading profiles, tests them through replay and quote-backed paper trading, calibrates results against execution reality, and produces EV reports before capital is at risk.

## What are you building, and who is it for?

We are building PalusOS, the discovery and proof engine for autonomous trading agents. It is for builders, quants, agent teams, and power users who need to know whether a candidate strategy profile deserves more testing before any capital path. PalusOS ingests market flow through adapters, runs agent/profile candidates through replay and paper validation, adjusts results for executable quote and slippage assumptions, and produces an auditable decision: reject, keep testing, or graduate carefully under explicit limits.

## Why did you decide to build this, and why build it now?

Trading agents are becoming easier to launch than to evaluate. A backtest or paper-profit chart can look impressive while hiding slippage, latency, fees, failed exits, adverse selection, and outlier dependence. PalusOS exists to make that gap measurable. It gives teams a repeatable way to discover strategy candidates, punish fake signal, track drift, calibrate execution assumptions, and prevent unsafe promotion. As autonomous agents move closer to real execution, proof infrastructure becomes a prerequisite rather than a nice-to-have.

## Public repo / demo-data caveat

This public repo ships bundled demo data only for safety. It includes no wallets, API keys, private databases, real `.env` files, private infra, transaction signing/sending code, or live-trading configuration. The architecture is data-adapter based: replacing the bundled demo rows with real market feeds or agent decision logs in a private deployment makes the same discovery/evaluation/proof pipeline operate on real inputs. `.env.example` is only a placeholder checklist for operator-provided RPC/wallet references, canary caps, and rollback gates. Canary is disabled by default and belongs in private infrastructure only. The demo does not claim live profitability.

## Demo-to-real deployment path

Run the polished website UI with `npm install` and `npm run dev`, inspect bundled demo rows, plug in a private data adapter, prove candidates in replay and quote-backed paper, optionally run a tiny disabled-by-default private canary after explicit approval, and scale only through progressive caps once gates pass. Roll back on failed exits, stale feeds, quote mismatches, drawdown breaches, or EV drift; never skip paper/canary.

## Technologies/integrations

Solana-style market data adapters, real-time event streaming patterns, SQLite/Python-style ML evaluation pipelines, XGBoost/scikit-learn-style tabular models, TypeScript/Node.js dashboard and orchestration, quote-backed execution calibration, paper/live-sim/canary evaluation flows, OpenClaw AI agent workflows.

## Category

Best single category: **AI Platforms / Agents**.

If multi-select is available: **AI Platforms / Agents**, **Data & Analytics**, **DeFi**, **Developer Infrastructure**.
