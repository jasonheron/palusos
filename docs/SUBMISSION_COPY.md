# PalusOS Submission Copy

## One-liner

PalusOS is the label-first discovery and proof engine for autonomous trading agents.

## Short description

PalusOS turns raw market data into candidate labels, searches for ML-backed strategy profiles, and proves or rejects those profiles with quote-backed paper outcomes, realistic EV, and staged canary readiness before capital is at risk.

## Longer description

We are building PalusOS for builders, quants, agent teams, and power users who need proof infrastructure before autonomous agents touch capital. The system starts with data truth: lifecycle coverage, freshness, censoring, quote/route observability, and labelable event availability. From there, a Label Foundry designs trade-realistic labels, an ML Lab searches for models and complete strategy profiles, and a Proof Engine accepts only auditable intent-before-outcome records with trusted entry/exit quotes, costs, failed exits, and realistic EV.

The public hackathon repo is intentionally safe and polished: bundled demo data, a landing page, Agent Lab, and a live read-only `/demo` route. The real architecture is modular. In a private deployment, teams can replace the demo rows with lifecycle data, quote archives, agent decision logs, and paper/canary outcomes while keeping the same proof contracts.

## Why now

Autonomous trading agents are getting easier to launch than to evaluate. A fixed label, backtest, or paper-profit chart can look convincing while hiding slippage, latency, fees, failed exits, stale/censored data, route depth, adverse selection, and one-lucky-winner dependence. PalusOS exists to make that gap measurable. It asks the more important first question: what should the model be trying to predict?

## Safety / scope

This public repo ships demo data only. It includes no wallets, private keys, real `.env` files, private databases, transaction signing/sending code, live canary execution, or public live-trading configuration. RPC and Jupiter keys are optional server-side environment variables for the read-only demo route. Canary is disabled by default and belongs in private infrastructure only. The demo does not claim live profitability.

## User journey

Run the polished website UI, inspect the public-safe demo contract, open `/demo` for a read-only paper terminal, then in a private deployment connect real data truth, design labels, run the ML Lab, generate strategy profiles, and pass candidates through quote-backed proof before paper/canary/scale.

## Suggested tagline

Prove the agent before the arena.


## Agent integration

PalusOS can be integrated into OpenClaw, Claude, or another agent runtime by exposing a small tool surface: discover labels, generate strategy profiles, collect quote proof, evaluate gates, and report the next action. A judge-facing prompt is: “Use my market data feed and PalusOS to discover and prove candidate trading profiles in paper/proof mode.” The agent drives the research loop; PalusOS produces the proof artifacts and dashboard/reporting layer.
