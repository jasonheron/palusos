# Tutorial: run your first TrenchLab evaluation

This tutorial walks a judge or builder through the demo-safe TrenchLab flow.

## 1. Install and start

```bash
npm install
npm run dev
```

Open the local Vite URL printed in the terminal.

## 2. Pick a candidate agent

The demo includes three curated examples:

- **Slow Bleed Reversal v3** — promising alpha, still in paper.
- **Universal Snipe v1** — intentionally killed because executable economics fail.
- **Agent Risk Sentinel** — safety/veto agent eligible for tiny canary after runner acceptance.

## 3. Read the truth report

Each candidate shows:

- replay/paper evidence;
- quote-adjusted EV;
- largest-winner-removed robustness;
- rug/gap-loss exposure;
- canary readiness;
- final gate verdict.

## 4. Interpret verdicts

- **Kill** — no live funds. The agent fails executable economics or robustness.
- **Keep Paper** — promising, but more proof or runner safety is required.
- **Canary Eligible** — can graduate only to a tiny bounded dev-wallet canary with rollback triggers.

## 5. Swap in your own agent later

The demo is modular. Replace `src/data/demoAgents.ts` with your agent report output, or plug a new market adapter into `src/modules/adapters.ts`.

The important rule: do not trust paper PnL until it survives execution-adjusted calibration and robustness gates.
