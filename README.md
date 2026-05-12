# PalusOS

**Discovery + proof for autonomous trading agents.**

PalusOS is a label-first discovery and proof engine for autonomous trading agents. It turns market data into candidate labels, searches for ML-backed strategy profiles, and proves or rejects those profiles with quote-backed paper outcomes, realistic EV, and staged canary readiness before capital is at risk.

## Why this exists

Trading agents are easy to launch and hard to trust. The first hard question is not “which bot should trade?” — it is “what should the model be trying to predict?” Fixed labels, clean-looking backtests, and paper PnL can all hide censoring, stale data, failed exits, quote depth, slippage, latency, fees, adverse selection, and one-lucky-winner dependence. PalusOS makes that research loop explicit: data truth → label foundry → ML lab → strategy profile → proof engine → paper/canary gates.

## Demo data included

This repo ships with bundled demo data so you can run the full UI immediately. The architecture is adapter based: replace the demo rows with private lifecycle data, quote archives, agent decisions, and outcome streams, and the same discovery/proof pipeline operates on those inputs.

## Screenshots

![PalusOS hero](docs/assets/palusos-hero.png)

![PalusOS Agent Lab](docs/assets/palusos-agent-lab.png)

![PalusOS deployment path](docs/assets/palusos-deployment-path.png)

## What this repo contains

- polished landing page and demo UI;
- label-first discovery framing for autonomous trading research;
- deterministic strategy discovery across bundled agent/feed/model combinations;
- modular architecture for data adapters, label candidates, ML/profile search, proof gates, and reports;
- live read-only `/demo` route with server-side RPC/Jupiter quote support when env is configured;
- `/dashboard` route for a public-safe PalusOS real-system dashboard view;
- demo agent evaluation data;
- tutorial and presentation outline;
- no secrets, private keys, `.env` files, private databases, wallet connection, signing, swaps, or live execution.

## System flow

1. **Data Truth** — audit dataset coverage, freshness, censoring, route observability, and labelable events.
2. **Label Foundry** — design candidate labels as auditable artifacts, not hardcoded guesses.
3. **ML Lab** — search models, strategy profiles, near-misses, and failure modes across supported labels.
4. **Strategy Profile** — define entry selector, quality gates, exit/timeout rules, route assumptions, size bands, and EV method.
5. **Proof Engine** — require pre-outcome intent, trusted entry/exit quotes, failed quote/exit accounting, fees, slippage, latency, and realistic EV.
6. **Paper → Canary → Scale** — graduate only when proof survives; canary is tiny/private/disabled by default, and scale requires continuing evidence.

## Live `/demo` route

The app also ships a proper `/demo` page. It presents PalusOS as a paper-trading control board: active profile, model, PnL, proof chart, positions, signal log, and route/proof details.

- `api/live-feed.ts` reads recent Pump/PumpSwap signatures from one Solana JSON-RPC endpoint (`PALUS_RPC_URL`, `PALUS_HELIUS_RPC_URL`, `HELIUS_RPC_URL`, or `FLUX_RPC_URL`).
- The same server endpoint can call Jupiter quotes with `PALUS_JUPITER_API_KEY` to compute paper-only round-trip quote observations.
- The client never receives RPC URLs, Jupiter keys, wallet material, transaction payloads, or signing capability.
- If env is unavailable or an upstream request fails, `/demo` falls back to bundled public-safe rows.

## Quick start

```bash
npm install
npm run dev
```

Open the local Vite URL printed in the terminal. The first-run experience is the polished PalusOS website and Agent Lab UI. Visit `/demo` for the live read-only paper demo route and `/dashboard` for the PalusOS system dashboard view; without server env these routes intentionally show public-safe fallback state.

## Build

```bash
npm run build
```

## Project structure

```text
.env.example                      public-safe private deployment checklist; no secrets
src/data/agentLabData.ts           bundled demo feeds, agents, and models
src/data/demoAgents.ts             demo agent evidence
src/modules/adapters.ts            market and strategy adapter shapes
src/modules/evaluationEngine.ts    discovery, EV calibration, gates, and verdicts
src/modules/livePaper.ts           shared live-feed normalization and paper snapshot logic
src/components/AgentLab.tsx        discovery and proof demo UI
src/components/LivePaperDemo.tsx   /demo paper terminal UI
src/components/DashboardPage.tsx    /dashboard system dashboard UI
api/live-feed.ts                   server-only RPC + Jupiter quote endpoint
src/components/AgentDashboard.tsx  demo evaluation UI
docs/ARCHITECTURE.md               system design
docs/DEPLOYMENT_PATH.md            demo-to-private proof path
docs/TUTORIAL.md                   product walkthrough
presentation/SLIDES.md             submission presentation outline
```

## From demo to real deployment

The intended path is deliberately staged:

1. **Public demo shell** — run the UI and inspect the public-safe data/proof contract.
2. **Private Data Truth layer** — connect real lifecycle data, quote archives, agent decisions, and outcome streams; audit freshness, coverage, censoring, and route observability.
3. **Label Foundry + ML Lab** — generate trade-realistic labels, evaluate supported families, train/search models, and emit complete strategy profiles.
4. **Proof Engine → paper** — require intent-before-outcome records, quote provenance, failed quote/exit accounting, realistic EV, outlier checks, drawdown limits, and sample density.
5. **Canary → scale** — not enabled in this repo. In a private operator build, canary must be disabled by default and gated by explicit config, hard caps, rollback triggers, and human approval.

See [`docs/DEPLOYMENT_PATH.md`](docs/DEPLOYMENT_PATH.md) for the full checklist and [`docs/AGENT_INTEGRATION.md`](docs/AGENT_INTEGRATION.md) for OpenClaw/Claude integration patterns.

## Agent / OpenClaw / Claude integration

PalusOS is meant to be operated by agents through tools, APIs, or scripts. The UI is the presentation and reporting layer. A minimal agent instruction is:

```text
Use my pumpfun data feed and PalusOS to find profitable trading profiles.
```

Recommended tool surface:

```text
palusos.discover_labels
palusos.generate_strategy_profile
palusos.collect_quote_proof
palusos.evaluate_gates
palusos.report_next_action
```

Private operators connect their own data layer and expose these actions to OpenClaw, Claude, MCP, or another agent runtime. See [`docs/AGENT_INTEGRATION.md`](docs/AGENT_INTEGRATION.md).

## Data adapter expectations

The public repo ships demo rows only. Real deployments should keep private data outside the repo and normalize it into auditable evidence: stable IDs, asset/market labels, timestamps, live-known feature boundaries, future-known outcome boundaries, censoring rules, route/quote provenance, failed quote/exit records, fees/slippage/latency fields, and resolved/unknown outcome status.

## Canary / RPC / wallet boundary

`.env.example` is a placeholder checklist, not a live-trading implementation. Wallets, RPC URLs, and secrets are operator-provided in private infrastructure. This repo does not include transaction signing/sending code, private keys, or live canary execution. Canary must remain disabled by default.

## Category

Primary: **AI Platforms / Agents**

Secondary: **Data & Analytics**, **DeFi**, **Developer Infrastructure**

## Scope

PalusOS is label-first discovery, ML search, proof, calibration, and reporting infrastructure. Bring the market feed, label universe, agent logs, and execution assumptions you use; PalusOS provides the structure to discover, compare, gate, and explain the result before capital.
