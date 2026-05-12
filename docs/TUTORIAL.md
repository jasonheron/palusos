# Tutorial: run your first PalusOS strategy discovery

This tutorial walks through the public-safe PalusOS demo flow.

## 1. Install and start

```bash
npm install
npm run dev
```

Open the local Vite URL printed in the terminal.

You should land on the polished PalusOS website and Agent Lab UI. The public install path is not CLI-only.

## 2. Read the public demo-data caveat

The repo ships bundled demo rows only. It includes no wallets, API keys, private databases, real `.env` files, private infra, or live execution. PalusOS is data-adapter based: in a private deployment, replacing the demo rows with real market feeds or agent decision logs makes the same discovery/evaluation/proof pipeline operate on real inputs.

## 3. Discover candidate profiles

The Agent Lab ranks candidate profiles across:

- agent definition;
- data feed;
- ML model;
- execution assumptions.

Click any discovered profile to load its deterministic proof report.

## 4. Pick a candidate agent

The demo includes three curated examples:

- **Slow Bleed Reversal v3** — promising proof profile, still in paper mode.
- **Universal Snipe v1** — intentionally rejected because execution-adjusted economics fail.
- **Agent Risk Sentinel** — safety/veto agent eligible for a tiny canary only after runner acceptance.

## 5. Read the proof report

Each candidate shows:

- replay and paper evidence;
- execution-adjusted EV;
- outlier-removed EV;
- largest-winner-removed robustness;
- drawdown behavior;
- canary readiness;
- final gate verdict.

## 6. Interpret verdicts

- **Reject** — no real capital. The agent fails executable economics or robustness.
- **Keep Testing** — promising, but more proof or runner safety is required.
- **Promote / Canary Eligible** — can graduate only to a tiny bounded canary with rollback triggers.

## 7. Integrate PalusOS with an AI agent or OpenClaw

PalusOS is not controlled by the UI. The UI is the read-only proof recorder. Agents drive PalusOS through tools, APIs, or scripts; PalusOS writes artifacts and state; the console shows the lifecycle from discovery through proof gates.

A typical OpenClaw integration exposes PalusOS actions as tools such as:

- `palusos.discover_labels`
- `palusos.generate_strategy_profile`
- `palusos.collect_quote_proof`
- `palusos.evaluate_gates`
- `palusos.report_next_action`

Example agent prompt:

> Use PalusOS to find a candidate trading label, build a strategy profile, collect read-only quote proof, and tell me whether it can advance to paper or is blocked.

Demo flow:

1. **OpenClaw agent** receives the research goal.
2. **PalusOS tools/scripts** run discovery, label design, profile generation, and proof collection.
3. **Artifacts/state** are written to the PalusOS evidence store.
4. **Proof gates** decide whether the candidate is rejected, kept in paper, or eligible for a tiny canary.
5. **Read-only console** updates as the black-box recorder: Discovery → Label Foundry → ML Lab → Proof Engine → Paper / Canary → Scale.

That separation is intentional: agents operate the research loop; the UI explains and audits what happened.

## 8. Swap in your own data later

The demo is modular. Replace `src/data/agentLabData.ts` with adapter output, replace `src/data/demoAgents.ts` with your agent report output, or plug a new market adapter into `src/modules/adapters.ts`.

Private adapter rows should preserve the high-level evidence shape PalusOS evaluates: stable event IDs, asset/market labels, replay order or timestamps, signal/liquidity scores, route-risk and execution-cost fields, realized/paper outcomes, and provenance metadata. Keep private feeds, archives, API keys, RPC endpoints, and wallet references outside the public repo.

## 9. Canary, RPC, wallet, and scaling rules

The public repo does not enable canary trading and does not implement transaction signing or sending. `.env.example` is only a placeholder checklist for private operators.

Safe progression:

1. bundled demo rows;
2. private adapter replay;
3. quote-backed paper proof;
4. optional tiny canary, disabled by default and explicitly approved;
5. progressive caps only after gates pass.

Rollback on stale feeds, failed exits, quote mismatches, drawdown breaches, or EV drift. Never skip paper or canary.

The important rule: do not trust paper PnL until it survives execution-adjusted calibration and robustness gates. The public demo proves the workflow shape; it does not claim live profitability.
