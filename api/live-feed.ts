declare const process: { env: Record<string, string | undefined> };

import {
  PUMP_PROGRAM_TARGETS,
  SOL_MINT,
  applyPaperQuoteObservation,
  buildFallbackLivePaperSnapshot,
  buildRpcLivePaperSnapshot,
  enrichEventWithMint,
  normalizeRpcSignatures,
  type LiveMarketEvent,
  type LivePaperSelection,
  type PaperQuoteObservation,
  type RpcSignatureRecord,
} from '../src/modules/livePaper';

const SIGNATURES_PER_PROGRAM = 5;
const MAX_EVENTS = 10;
const MAX_TX_LOOKUPS = 8;
const MAX_JUPITER_QUOTES = 5;
const PAPER_INPUT_SOL = 0.01;
const LAMPORTS_PER_SOL = 1_000_000_000;
const RPC_TIMEOUT_MS = 4_500;
const JUPITER_TIMEOUT_MS = 5_000;

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const selection: LivePaperSelection = {
    agentId: stringParam(req.query?.agentId),
    modelId: stringParam(req.query?.modelId),
  };

  const rpcUrl = process.env.PALUS_RPC_URL
    || process.env.PALUS_HELIUS_RPC_URL
    || process.env.HELIUS_RPC_URL
    || process.env.FLUX_RPC_URL;

  if (!rpcUrl) {
    res.status(200).json(buildFallbackLivePaperSnapshot('missing_rpc_env', selection));
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
      res.status(200).json(buildFallbackLivePaperSnapshot('empty_rpc_result', selection));
      return;
    }

    const eventsWithMints = await enrichMints(rpcUrl, baseEvents);
    const quotedEvents = await enrichJupiterPaperQuotes(eventsWithMints);
    res.status(200).json(buildRpcLivePaperSnapshot(quotedEvents, selection));
  } catch (_error) {
    // Public demo must degrade cleanly on RPC/Jupiter rate limits, bad env,
    // network errors, or upstream JSON-RPC errors. Never expose env values.
    res.status(200).json(buildFallbackLivePaperSnapshot('rpc_error', selection));
  }
}

async function enrichMints(rpcUrl: string, events: LiveMarketEvent[]): Promise<LiveMarketEvent[]> {
  const mintEntries = await Promise.all(
    events.slice(0, MAX_TX_LOOKUPS).map(async (event) => [event.signature, await getPrimaryTokenMint(rpcUrl, event.signature)] as const),
  );
  const mintBySignature = new Map(mintEntries);
  return events.map((event) => enrichEventWithMint(event, mintBySignature.get(event.signature)));
}

async function enrichJupiterPaperQuotes(events: LiveMarketEvent[]): Promise<LiveMarketEvent[]> {
  const apiKey = process.env.PALUS_JUPITER_API_KEY || process.env.JUPITER_API_KEY;
  if (!apiKey) return events;

  const quoteTargets = events.filter((event) => event.mint).slice(0, MAX_JUPITER_QUOTES);
  const quoteEntries = await Promise.all(
    quoteTargets.map(async (event) => [event.signature, await getJupiterRoundTripQuote(apiKey, event.mint as string)] as const),
  );
  const quoteBySignature = new Map(quoteEntries);

  return events.map((event) => {
    const quote = quoteBySignature.get(event.signature);
    return quote ? applyPaperQuoteObservation(event, quote) : event;
  });
}

async function getSignaturesForAddress(rpcUrl: string, address: string, limit: number): Promise<RpcSignatureRecord[]> {
  const payload = await rpcCall(rpcUrl, 'getSignaturesForAddress', [address, { limit }], RPC_TIMEOUT_MS);
  return Array.isArray(payload.result) ? payload.result as RpcSignatureRecord[] : [];
}

async function getPrimaryTokenMint(rpcUrl: string, signature: string): Promise<string | undefined> {
  const payload = await rpcCall(rpcUrl, 'getTransaction', [
    signature,
    {
      encoding: 'jsonParsed',
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    },
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

async function getJupiterRoundTripQuote(apiKey: string, outputMint: string): Promise<PaperQuoteObservation> {
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

    return {
      status: 'quoted',
      inputSol: PAPER_INPUT_SOL,
      outputMint,
      buyOutAmount,
      roundTripSol,
      roundTripReturnPct,
      priceImpactPct,
      routePlanHops,
    };
  } catch (error) {
    return {
      status: 'error',
      inputSol: PAPER_INPUT_SOL,
      outputMint,
      error: error instanceof Error ? error.message.slice(0, 80) : 'quote error',
    };
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
    const response = await fetch(quoteUrl, {
      method: 'GET',
      headers: { 'x-api-key': apiKey, accept: 'application/json' },
      signal: controller.signal,
    });
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

function stringParam(value: unknown): string | undefined {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
