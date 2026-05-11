# From demo to real deployment

PalusOS is public-safe by default. The repo ships a polished Vite/React UI and bundled demo rows only. It does **not** ship live trading, transaction signing, private keys, private databases, or real wallet/RPC configuration.

## 0. Run the public demo

```bash
npm install
npm run dev
```

Open the Vite URL and use the Agent Lab. You should see the website-style PalusOS UI, not a CLI-only workflow.

## 1. Replace demo rows with a private data adapter

The demo rows live in `src/data/agentLabData.ts`. A private deployment can replace or extend adapter modules so PalusOS ingests real inputs from your own market feeds, quote archives, paper-trade logs, or agent decision logs.

At a high level, adapter output should preserve the normalized evidence shape PalusOS expects:

- stable event ID;
- asset/market label;
- scenario or source label;
- timestamp or replay order;
- signal and liquidity scores;
- route/execution-risk fields;
- realized, paper, or replay outcome fields;
- metadata needed to audit where the row came from.

Keep private archives, API keys, RPC endpoints, and wallet references outside the public repo.

## 2. Prove in paper before any capital path

Run replay and paper proof until results survive:

- execution-adjusted EV after fees, slippage, latency, and route risk;
- outlier-removed EV;
- largest-winner-removed EV;
- drawdown and loss-cluster limits;
- quote freshness / route-quality checks;
- enough sample density to avoid one-lucky-winner promotion.

Paper PnL alone is not enough.

## 3. Optional private canary, disabled by default

The public repo does not implement live transaction signing or sending. If an operator builds a private canary layer, it should be disabled by default and gated by an explicit `.env.local`/secret-manager configuration derived from `.env.example`.

Minimum canary rules:

- wallet and RPC are operator-provided, never committed;
- tiny trade caps and daily caps;
- human approval for promotion;
- one-way kill switch;
- rollback on failed exit, quote mismatch, stale feed, drawdown breach, or EV drift;
- logs that prove every decision and every quote.

## 4. Scale responsibly

Scale only after paper and canary agree. Increase caps progressively and stop immediately when evidence degrades.

Suggested progression:

1. demo replay;
2. private adapter replay;
3. quote-backed paper proof;
4. tiny private canary;
5. small capped expansion;
6. larger caps only after repeated proof gates pass.

Never skip paper. Never skip canary. Never treat public demo data as production evidence.
