# Tutorial: run your first PalusOS strategy discovery

This tutorial walks through the public-safe PalusOS demo flow.

## 1. Install dependencies

```bash
npm install
```

## 2. Start the app

```bash
npm run dev
```

Open the local Vite URL printed in the terminal.

## 3. Ask an agent to use PalusOS

> “Use my market data feed and PalusOS to discover and prove candidate trading profiles in paper/proof mode.”

The public repo ships demo data only. In a private deployment, your agent connects PalusOS to your own data feed, runs discovery and proof steps, and reports which profiles should be rejected, kept in paper, or considered for gated canary testing.
