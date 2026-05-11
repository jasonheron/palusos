# Submission copy

## Description under 500 chars

PalusOS is the learning layer for agentic trading agents. It evaluates strategies against replay data, paper decisions, execution-cost assumptions, and safety gates, then produces a clear verdict: reject, keep testing, or graduate carefully under limits.

## What are you building, and who is it for?

We are building PalusOS, an evidence layer for autonomous trading agents. It is for builders, quants, agent teams, and power users who need to know whether a trading agent has real edge before trusting it with capital. PalusOS ingests live and historical market flow, runs candidate strategies through replay and paper validation, adjusts results for executable quote and slippage assumptions, and produces an auditable decision: reject, keep testing, or graduate carefully under explicit limits.

## Why did you decide to build this, and why build it now?

Trading agents are becoming easier to launch than to evaluate. A backtest or paper-profit chart can look impressive while hiding slippage, latency, fees, failed exits, adverse selection, and outlier dependence. PalusOS exists to make that gap measurable. It gives teams a repeatable way to record evidence, punish fake edge, track drift, and prevent unsafe promotion. As autonomous agents move closer to real execution, evaluation infrastructure becomes a prerequisite rather than a nice-to-have.

## Technologies/integrations

Solana market data, real-time event streaming, SQLite, Python ML/evaluation pipelines, XGBoost/scikit-learn-style tabular models, TypeScript/Node.js dashboard and orchestration, quote-backed execution calibration, paper/live-sim/canary evaluation flows, OpenClaw AI agent workflows.

## Category

Best single category: **AI Platforms / Agents**.

If multi-select is available: **AI Platforms / Agents**, **Data & Analytics**, **DeFi**, **Developer Infrastructure**.
