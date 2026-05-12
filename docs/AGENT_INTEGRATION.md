# Integrating PalusOS with OpenClaw, Claude, or another AI agent

PalusOS is designed to be driven by agents, not clicked by humans.

The website is the presentation layer. The useful integration point is the data and proof loop:

1. an agent receives a research goal;
2. the agent calls PalusOS actions/tools;
3. PalusOS reads a market data layer and writes evidence artifacts;
4. proof gates decide whether profiles are rejected, kept in paper, or eligible for a private canary;
5. dashboards and reports show the trail.

## Minimal agent prompt

```text
Use my market data feed and PalusOS to discover and prove candidate trading profiles in paper/proof mode.
```

A stronger production prompt is:

```text
Use PalusOS on my private PumpFun data feed. Discover candidate labels, generate strategy profiles, collect quote-backed paper evidence, evaluate proof gates, and report which profiles should be rejected, kept in paper, or considered for a tiny gated canary. Do not sign, broadcast, or enable live trading.
```

## Suggested tool surface

Expose PalusOS to OpenClaw, Claude, or another agent runtime as a small set of tools:

```text
palusos.discover_labels
palusos.generate_strategy_profile
palusos.collect_quote_proof
palusos.evaluate_gates
palusos.report_next_action
```

The tools can be implemented as API endpoints, MCP tools, shell commands, AINL workflows, or thin wrappers around your private research scripts.

## Data layer contract

Your private data layer should stay outside the public repo. Normalize it into rows/artifacts with:

- stable event IDs;
- market/asset identifiers;
- timestamps and ordering;
- live-known feature boundaries;
- future-known outcome boundaries;
- label candidate IDs;
- route and quote provenance;
- failed quote/exit records;
- fees, slippage, latency, and depth assumptions;
- resolved / unresolved / censored outcome status.

The public demo data in `src/data/agentLabData.ts` and `src/data/demoAgents.ts` shows the shape expected by the UI and evaluation engine.

## OpenClaw integration pattern

A practical OpenClaw setup is:

```text
OpenClaw agent
  -> palusos.discover_labels
  -> palusos.generate_strategy_profile
  -> palusos.collect_quote_proof
  -> palusos.evaluate_gates
  -> palusos.report_next_action
  -> PalusOS dashboard/report
```

Keep the dangerous boundary outside the public repo:

- no private keys in PalusOS public files;
- no transaction signing in the website;
- no live swaps in `/demo` or `/dashboard`;
- canary disabled by default in private deployments;
- human approval required before capital is used.

## Claude integration pattern

Claude can use the same pattern through tool use or a repository workflow:

1. Give Claude access to your private normalized data exports or adapter outputs.
2. Ask it to call the PalusOS actions in order.
3. Require it to write proof artifacts and summarize gate decisions.
4. Review the generated profile, proof pack, and blocker list before promotion.

Example:

```text
You are using PalusOS as a proof engine. Use the private data adapter output in ./private-data/pumpfun-feed.jsonl. Generate candidate labels, build strategy profiles, evaluate quote-backed proof, and return only profiles that pass realistic EV and robustness checks. Do not propose live trading unless canary gates pass and are explicitly approved.
```
