declare const process: { env: Record<string, string | undefined> };

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const PUMP_PROGRAM_TARGETS = [
  { label: 'Pump.fun bonding curve program', address: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P' },
  { label: 'PumpSwap AMM program', address: 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA' },
];

const SIGNATURES_PER_PROGRAM = 5;
const MAX_EVENTS = 10;
const MAX_TX_LOOKUPS = 8;
const MAX_JUPITER_QUOTES = 5;
const PAPER_INPUT_SOL = 0.01;
const LAMPORTS_PER_SOL = 1_000_000_000;
const RPC_TIMEOUT_MS = 4_500;
const JUPITER_TIMEOUT_MS = 5_000;

const AGENTS = [
  { id: 'launch-recovery-scout', name: 'Launch Recovery Scout', minSignalScore: 68, minLiquidityScore: 42, edgeAdjustmentPct: 0.018, latencyPenaltyMultiplier: 0.75 },
  { id: 'rug-avoidance-sentinel', name: 'Rug Avoidance Sentinel', minSignalScore: 74, minLiquidityScore: 58, edgeAdjustmentPct: 0.009, latencyPenaltyMultiplier: 0.55 },
  { id: 'majors-momentum-agent', name: 'Majors Momentum Agent', minSignalScore: 61, minLiquidityScore: 64, edgeAdjustmentPct: 0.006, latencyPenaltyMultiplier: 0.95 },
];

const MODELS = [
  { id: 'palusos-custom', name: 'PalusOS Custom', thresholdAdjustment: -4, returnAdjustmentPct: 0.012, routeCostReductionBps: 12, confidenceAdjustment: 8 },
  { id: 'xgboost-bundle', name: 'XGBoost Bundle', thresholdAdjustment: 2, returnAdjustmentPct: 0.006, routeCostReductionBps: 5, confidenceAdjustment: 4 },
  { id: 'regime-lstm', name: 'LSTM Regime Model', thresholdAdjustment: 5, returnAdjustmentPct: 0.003, routeCostReductionBps: 0, confidenceAdjustment: 1 },
  { id: 'palusos-memes', name: 'PalusOS Memes', thresholdAdjustment: -1, returnAdjustmentPct: 0.009, routeCostReductionBps: 8, confidenceAdjustment: 6 },
];

const ASSUMPTIONS = {
  tradeSizeSol: 0.05,
  feeBps: 45,
  slippageBps: 80,
  latencyMs: 650,
  latencyBpsPer100Ms: 3,
  maxDrawdownSol: 0.025,
  outlierTrimFraction: 0.1,
};

const FALLBACK_ROWS = [
  { id: 'demo-001', asset: 'PUMP-LAUNCH-01', scenario: 'Fresh launch recovered after early sell pressure', signalScore: 84, liquidityScore: 72, realizedReturnPct: 0.24, adverseDrawdownPct: 0.07, routeRiskBps: 24 },
  { id: 'demo-002', asset: 'PUMP-LAUNCH-02', scenario: 'Low-liquidity spike rejected by robustness gate', signalScore: 78, liquidityScore: 38, realizedReturnPct: -0.18, adverseDrawdownPct: 0.31, routeRiskBps: 74 },
  { id: 'demo-003', asset: 'PUMP-LAUNCH-03', scenario: 'Slow grind continuation with clean quote path', signalScore: 91, liquidityScore: 81, realizedReturnPct: 0.33, adverseDrawdownPct: 0.05, routeRiskBps: 18 },
  { id: 'demo-004', asset: 'PUMP-LAUNCH-04', scenario: 'Noisy launch skipped by profile threshold', signalScore: 54, liquidityScore: 69, realizedReturnPct: 0.04, adverseDrawdownPct: 0.09, routeRiskBps: 31 },
  { id: 'demo-005', asset: 'PUMP-LAUNCH-05', scenario: 'Fast reversal with acceptable drawdown', signalScore: 87, liquidityScore: 66, realizedReturnPct: 0.19, adverseDrawdownPct: 0.08, routeRiskBps: 27 },
  { id: 'demo-006', asset: 'PUMP-LAUNCH-06', scenario: 'Adverse route risk punished by execution calibration', signalScore: 73, liquidityScore: 44, realizedReturnPct: 0.02, adverseDrawdownPct: 0.16, routeRiskBps: 58 },
  { id: 'demo-007', asset: 'PUMP-LAUNCH-07', scenario: 'Clean expansion after initial consolidation', signalScore: 89, liquidityScore: 78, realizedReturnPct: 0.27, adverseDrawdownPct: 0.04, routeRiskBps: 20 },
  { id: 'demo-008', asset: 'PUMP-LAUNCH-08', scenario: 'Failed continuation caught by paper logic', signalScore: 76, liquidityScore: 61, realizedReturnPct: -0.09, adverseDrawdownPct: 0.2, routeRiskBps: 42 },
];

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const selection = {
    agentId: stringParam(req.query?.agentId),
    modelId: stringParam(req.query?.modelId),
  };

  const rpcUrl = process.env.PALUS_RPC_URL
    || process.env.PALUS_HELIUS_RPC_URL
    || process.env.HELIUS_RPC_URL
    || process.env.FLUX_RPC_URL;

  if (!rpcUrl) {
    res.status(200).json(buildFallbackSnapshot('missing_rpc_env', selection));
    return;
  }

  try {
    const eventGroups = await Promise.all(
      PUMP_PROGRAM_TARGETS.map(async (program) => {
        const signatures = await getSignaturesForAddress(rpcUrl, program.address, SIGNATURES_PER_PROGRAM);
        return normalizeRpcSignatures(signatures, program, SIGNATURES_PER_PROGRAM);
      }),
    );

    const baseEvents = eventGroups
      .flat()
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, MAX_EVENTS);

    if (baseEvents.length === 0) {
      res.status(200).json(buildFallbackSnapshot('empty_rpc_result', selection));
      return;
    }

    const eventsWithMints = await enrichMints(rpcUrl, baseEvents);
    const quotedEvents = await enrichJupiterPaperQuotes(eventsWithMints);
    res.status(200).json(buildSnapshot(quotedEvents, liveMeta(quotedEvents), selection));
  } catch (_error) {
    res.status(200).json(buildFallbackSnapshot('rpc_error', selection));
  }
}

async function enrichMints(rpcUrl: string, events: any[]): Promise<any[]> {
  const mintEntries = await Promise.all(
    events.slice(0, MAX_TX_LOOKUPS).map(async (event) => [event.signature, await getPrimaryTokenMint(rpcUrl, event.signature)] as const),
  );
  const mintBySignature = new Map(mintEntries);
  return events.map((event) => enrichEventWithMint(event, mintBySignature.get(event.signature)));
}

async function enrichJupiterPaperQuotes(events: any[]): Promise<any[]> {
  const apiKey = process.env.PALUS_JUPITER_API_KEY || process.env.JUPITER_API_KEY;
  if (!apiKey) return events;

  const quoteTargets = events.filter((event) => event.mint).slice(0, MAX_JUPITER_QUOTES);
  const quoteEntries = await Promise.all(
    quoteTargets.map(async (event) => [event.signature, await getJupiterRoundTripQuote(apiKey, event.mint)] as const),
  );
  const quoteBySignature = new Map(quoteEntries);

  return events.map((event) => {
    const quote = quoteBySignature.get(event.signature);
    return quote ? applyPaperQuoteObservation(event, quote) : event;
  });
}

function normalizeRpcSignatures(records: any[], program: any, limit = 12): any[] {
  return records
    .filter((record) => typeof record.signature === 'string' && record.signature.length > 0 && !record.err)
    .slice(0, limit)
    .map((record, index) => signatureRecordToEvent(record, program, index));
}

function enrichEventWithMint(event: any, mint?: string): any {
  if (!mint || mint === SOL_MINT) return event;
  return {
    ...event,
    mint,
    asset: mint.endsWith('pump') ? `PUMP-${mint.slice(0, 4)}…pump` : `MINT-${mint.slice(0, 4)}…${mint.slice(-4)}`,
    scenario: `${event.programName} token activity observed; awaiting server-side Jupiter paper quote`,
  };
}

function applyPaperQuoteObservation(event: any, quote: any): any {
  if (quote.status !== 'quoted' || typeof quote.roundTripReturnPct !== 'number') {
    return { ...event, quote };
  }

  const roundTripLossBps = Math.max(0, -quote.roundTripReturnPct * 10_000);
  const priceImpactBps = Math.max(0, (quote.priceImpactPct ?? 0) * 100);
  const routeRiskBps = Math.round(clamp(12 + roundTripLossBps * 0.35 + priceImpactBps * 0.5, 8, 95));
  const liquidityScore = Math.round(clamp(92 - routeRiskBps * 0.85, 12, 96));
  const quotePenalty = Math.min(0.06, Math.max(0, -quote.roundTripReturnPct));

  return {
    ...event,
    liquidityScore,
    routeRiskBps,
    realizedReturnPct: round4(event.realizedReturnPct - quotePenalty),
    scenario: `${event.programName} activity with Jupiter paper round-trip quote`,
    provenance: 'Read-only RPC event enriched with server-side Jupiter quote. No wallet, signing, swap, or broadcast.',
    quote,
  };
}

function buildFallbackSnapshot(reason = 'missing_rpc_env', selection: any = {}) {
  const now = Date.now();
  const events = FALLBACK_ROWS.map((event, index) => ({
    ...event,
    signature: `demo-${event.id}`,
    timestamp: new Date(now - index * 45_000).toISOString(),
    source: 'bundled-demo',
    programName: 'Bundled PalusOS demo rows',
    score: event.signalScore,
    provenance: 'Bundled public-safe replay row; not live chain data.',
    quote: { status: 'not_configured', inputSol: ASSUMPTIONS.tradeSizeSol },
  }));

  return buildSnapshot(events, {
    mode: 'demo-fallback',
    generatedAt: new Date(now).toISOString(),
    reason,
    readOnly: true,
    paperOnly: true,
    wallet: 'none',
    sourceLabel: 'Bundled demo fallback',
    scoreMethod: 'original bundled demo scores and replay returns',
    quoteSource: 'disabled in fallback; set PALUS_JUPITER_API_KEY server-side for live paper quotes',
    polledPrograms: PUMP_PROGRAM_TARGETS,
  }, selection);
}

function liveMeta(events: any[]) {
  const hasQuotes = events.some((event) => event.quote?.status === 'quoted');
  const hasAttempts = events.some((event) => event.quote && event.quote.status !== 'not_configured');
  return {
    mode: 'rpc-live-readonly',
    generatedAt: new Date().toISOString(),
    readOnly: true,
    paperOnly: true,
    wallet: 'none',
    sourceLabel: 'Server-side Solana RPC read-only feed',
    scoreMethod: hasQuotes
      ? 'RPC signatures scored deterministically and adjusted with server-side Jupiter paper round-trip quotes'
      : 'RPC signatures scored deterministically; quote fields unavailable or disabled',
    quoteSource: hasQuotes
      ? 'Jupiter quote API via server-side PALUS_JUPITER_API_KEY'
      : hasAttempts
        ? 'Jupiter quote attempted server-side; some routes unavailable'
        : 'Jupiter quote not configured',
    polledPrograms: PUMP_PROGRAM_TARGETS,
  };
}

function buildSnapshot(events: any[], meta: any, selection: any = {}) {
  const agent = AGENTS.find((item) => item.id === selection.agentId) ?? AGENTS[0];
  const model = MODELS.find((item) => item.id === selection.modelId) ?? MODELS[0];
  const threshold = clamp(agent.minSignalScore + model.thresholdAdjustment, 1, 99);
  const decisions = events.slice(0, 8).map((event) => buildDecision(event, agent, threshold));
  const selected = events.filter((event) => event.signalScore >= threshold && event.liquidityScore >= agent.minLiquidityScore);
  const adjusted = selected.map((event) => evaluateAdjustedPnl(event, agent, model));
  const cumulative = adjusted.reduce((acc: number[], value: number) => [...acc, (acc.at(-1) ?? 0) + value], []);
  const averageEvSol = mean(adjusted);
  const largestWinnerRemovedEvSol = largestWinnerRemovedMean(adjusted);
  const outlierRemovedEvSol = outlierRemovedMean(adjusted, ASSUMPTIONS.outlierTrimFraction);
  const maxDrawdownSol = calculateMaxDrawdown(cumulative);
  const confidenceScore = clamp(Math.round(40 + Math.min(35, selected.length * 3) + model.confidenceAdjustment + Math.max(-14, (averageEvSol / ASSUMPTIONS.tradeSizeSol) * 180)), 0, 99);
  const verdict = selected.length < 3 ? 'keep_testing' : averageEvSol <= 0 || largestWinnerRemovedEvSol <= 0 || outlierRemovedEvSol <= 0 || maxDrawdownSol > ASSUMPTIONS.maxDrawdownSol ? 'reject' : 'promote';

  return {
    meta,
    events,
    selectedProfile: {
      profileId: `${agent.id}__live-paper__${model.id}`,
      agentId: agent.id,
      modelId: model.id,
      agentName: agent.name,
      modelName: model.name,
      dataFeedName: meta.mode === 'rpc-live-readonly' ? 'RPC Pump activity read-only feed' : 'Bundled live-demo fallback feed',
      proofScore: confidenceScore,
      stage: verdict,
    },
    paper: {
      verdict,
      verdictLabel: verdict === 'promote' ? 'Promote Candidate' : verdict === 'reject' ? 'Reject' : 'Keep Testing',
      action: verdict === 'promote'
        ? 'Candidate survives current paper proof gates; keep papering or promote only in private capped canary.'
        : verdict === 'reject'
          ? 'Candidate fails current realistic EV gates; reject before capital.'
          : 'Insufficient proof density; continue read-only paper observation.',
      decisions,
      metrics: {
        selectedTrades: selected.length,
        averageEvSol,
        outlierRemovedEvSol,
        largestWinnerRemovedEvSol,
        maxDrawdownSol,
        confidenceScore,
      },
      rationale: [
        `${selected.length} live-paper observations selected from ${events.length} recent events.`,
        `Average adjusted EV is ${formatSol(averageEvSol)} per observation after route risk and execution assumptions.`,
        `Outlier EV ${formatSol(outlierRemovedEvSol)}; largest-winner-removed EV ${formatSol(largestWinnerRemovedEvSol)}.`,
      ],
    },
  };
}

function signatureRecordToEvent(record: any, program: any, index: number): any {
  const seed = hashToUnit(`${record.signature}:${record.slot ?? index}`);
  const altSeed = hashToUnit(`${record.slot ?? index}:${record.signature}`);
  const signalScore = clamp(Math.round(48 + seed * 47), 1, 99);
  const liquidityScore = clamp(Math.round(35 + altSeed * 55), 1, 99);
  const routeRiskBps = Math.round(12 + (1 - liquidityScore / 100) * 38);
  const realizedReturnPct = round4((seed - 0.38) * 0.28);
  const adverseDrawdownPct = round4(0.035 + (1 - altSeed) * 0.24);
  const timestamp = record.blockTime ? new Date(record.blockTime * 1000).toISOString() : new Date().toISOString();
  const shortProgram = program.label.includes('Swap') ? 'PSWAP' : 'PUMP';

  return {
    id: `live-${record.signature.slice(0, 12)}`,
    asset: `${shortProgram}-${record.signature.slice(0, 4)}…${record.signature.slice(-4)}`,
    scenario: `${program.label} signature observed; token mint resolved server-side when possible`,
    signalScore,
    liquidityScore,
    realizedReturnPct,
    adverseDrawdownPct,
    routeRiskBps,
    signature: record.signature,
    timestamp,
    source: 'solana-rpc',
    programName: program.label,
    programId: program.address,
    score: signalScore,
    provenance: 'Read-only getSignaturesForAddress record; no transaction signing or broadcasting.',
    quote: { status: 'not_configured', inputSol: ASSUMPTIONS.tradeSizeSol },
  };
}

function buildDecision(event: any, agent: any, threshold: number) {
  const selected = event.signalScore >= threshold && event.liquidityScore >= agent.minLiquidityScore;
  const quoteNote = event.quote?.status === 'quoted'
    ? ` Jupiter paper round-trip ${((event.quote.roundTripReturnPct ?? 0) * 100).toFixed(2)}%.`
    : event.quote?.status && event.quote.status !== 'not_configured'
      ? ` Jupiter quote status: ${event.quote.status}.`
      : '';

  return {
    eventId: event.id,
    signature: event.signature,
    asset: event.asset,
    action: selected ? 'paper_candidate' : 'paper_skip',
    score: event.score,
    quoteStatus: event.quote?.status ?? 'not_configured',
    reason: selected
      ? `Meets paper threshold ${threshold} and liquidity floor ${agent.minLiquidityScore}; observation only.${quoteNote}`
      : `Below threshold ${threshold} or liquidity floor ${agent.minLiquidityScore}; skipped in paper logic.${quoteNote}`,
  };
}

function evaluateAdjustedPnl(event: any, agent: any, model: any): number {
  const modeledReturnPct = event.realizedReturnPct + agent.edgeAdjustmentPct + model.returnAdjustmentPct;
  const grossPnlSol = ASSUMPTIONS.tradeSizeSol * modeledReturnPct;
  const latencyBps = (ASSUMPTIONS.latencyMs / 100) * ASSUMPTIONS.latencyBpsPer100Ms * agent.latencyPenaltyMultiplier;
  const totalCostBps = Math.max(0, ASSUMPTIONS.feeBps + ASSUMPTIONS.slippageBps + event.routeRiskBps + latencyBps - model.routeCostReductionBps);
  return grossPnlSol - ASSUMPTIONS.tradeSizeSol * (totalCostBps / 10_000);
}

async function getSignaturesForAddress(rpcUrl: string, address: string, limit: number): Promise<any[]> {
  const payload = await rpcCall(rpcUrl, 'getSignaturesForAddress', [address, { limit }], RPC_TIMEOUT_MS);
  return Array.isArray(payload.result) ? payload.result : [];
}

async function getPrimaryTokenMint(rpcUrl: string, signature: string): Promise<string | undefined> {
  const payload = await rpcCall(rpcUrl, 'getTransaction', [
    signature,
    { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0, commitment: 'confirmed' },
  ], RPC_TIMEOUT_MS);

  const balances = [
    ...(payload.result?.meta?.postTokenBalances ?? []),
    ...(payload.result?.meta?.preTokenBalances ?? []),
  ];

  const mints = balances
    .map((balance: any) => typeof balance?.mint === 'string' ? balance.mint : undefined)
    .filter((mint: string | undefined): mint is string => Boolean(mint) && mint !== SOL_MINT);

  const pumpMint = mints.find((mint) => mint.endsWith('pump'));
  return pumpMint ?? mints[0];
}

async function getJupiterRoundTripQuote(apiKey: string, outputMint: string): Promise<any> {
  const inputLamports = Math.round(PAPER_INPUT_SOL * LAMPORTS_PER_SOL);
  try {
    const buy = await jupiterQuote(apiKey, SOL_MINT, outputMint, String(inputLamports));
    const buyOutAmount = buy?.outAmount;
    if (!buyOutAmount || BigInt(buyOutAmount) <= 0n) {
      return { status: 'unroutable', inputSol: PAPER_INPUT_SOL, outputMint, error: 'no buy route' };
    }

    const sell = await jupiterQuote(apiKey, outputMint, SOL_MINT, buyOutAmount);
    const sellOutAmount = sell?.outAmount;
    if (!sellOutAmount || BigInt(sellOutAmount) <= 0n) {
      return { status: 'partial', inputSol: PAPER_INPUT_SOL, outputMint, buyOutAmount, error: 'no sell route' };
    }

    const roundTripSol = Number(sellOutAmount) / LAMPORTS_PER_SOL;
    const roundTripReturnPct = roundTripSol / PAPER_INPUT_SOL - 1;
    const priceImpactPct = Number(buy?.priceImpactPct ?? 0) + Number(sell?.priceImpactPct ?? 0);
    const routePlanHops = (buy?.routePlan?.length ?? 0) + (sell?.routePlan?.length ?? 0);

    return { status: 'quoted', inputSol: PAPER_INPUT_SOL, outputMint, buyOutAmount, roundTripSol, roundTripReturnPct, priceImpactPct, routePlanHops };
  } catch (error) {
    return { status: 'error', inputSol: PAPER_INPUT_SOL, outputMint, error: error instanceof Error ? error.message.slice(0, 80) : 'quote error' };
  }
}

async function jupiterQuote(apiKey: string, inputMint: string, outputMint: string, amount: string): Promise<any> {
  const quoteUrl = new URL(process.env.PALUS_JUPITER_QUOTE_URL || 'https://api.jup.ag/swap/v1/quote');
  quoteUrl.searchParams.set('inputMint', inputMint);
  quoteUrl.searchParams.set('outputMint', outputMint);
  quoteUrl.searchParams.set('amount', amount);
  quoteUrl.searchParams.set('slippageBps', '80');
  quoteUrl.searchParams.set('restrictIntermediateTokens', 'true');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), JUPITER_TIMEOUT_MS);
  try {
    const response = await fetch(quoteUrl, { method: 'GET', headers: { 'x-api-key': apiKey, accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`Jupiter HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function rpcCall(rpcUrl: string, method: string, params: unknown[], timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: `palusos-${method}`, method, params }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.error) throw new Error('RPC JSON error');
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function outlierRemovedMean(values: number[], trimFraction: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * clamp(trimFraction, 0, 0.45));
  const trimmed = trimCount > 0 && sorted.length - trimCount * 2 >= 3 ? sorted.slice(trimCount, sorted.length - trimCount) : sorted;
  return mean(trimmed);
}

function largestWinnerRemovedMean(values: number[]): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];
  const sorted = [...values].sort((a, b) => a - b);
  sorted.pop();
  return mean(sorted);
}

function calculateMaxDrawdown(cumulativePnl: number[]): number {
  let peak = 0;
  let maxDrawdown = 0;
  for (const value of cumulativePnl) {
    peak = Math.max(peak, value);
    maxDrawdown = Math.max(maxDrawdown, peak - value);
  }
  return maxDrawdown;
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;
}

function hashToUnit(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function formatSol(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(5)} SOL`;
}

function stringParam(value: unknown): string | undefined {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
