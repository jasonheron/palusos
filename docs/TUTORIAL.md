# Tutorial: run your first PalusOS evaluation

This tutorial walks through the demo PalusOS flow.

## 1. Install and start

```bash
npm install
npm run dev
```

Open the local Vite URL printed in the terminal.

## 2. Pick a candidate agent

The demo includes three curated examples:

- **Slow Bleed Reversal v3** — promising edge, still in paper mode.
- **Universal Snipe v1** — intentionally rejected because execution-adjusted economics fail.
- **Agent Risk Sentinel** — safety/veto agent eligible for a tiny canary after runner acceptance.

## 3. Read the decision report

Each candidate shows:

- replay and paper evidence;
- execution-adjusted EV;
- largest-winner-removed robustness;
- gap-loss exposure;
- canary readiness;
- final gate verdict.

## 4. Interpret verdicts

- **Kill** — no real capital. The agent fails executable economics or robustness.
- **Keep Paper** — promising, but more proof or runner safety is required.
- **Canary Eligible** — can graduate only to a tiny bounded canary with rollback triggers.

## 5. Swap in your own agent later

The demo is modular. Replace `src/data/demoAgents.ts` with your agent report output, or plug a new market adapter into `src/modules/adapters.ts`.

The important rule: do not trust paper PnL until it survives execution-adjusted calibration and robustness gates.
