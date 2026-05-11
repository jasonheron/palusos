import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Pause, Play } from 'lucide-react';
import { agentDefinitions, modelDefinitions } from '../data/agentLabData';
import {
  buildClientFetchFallbackSnapshot,
  buildLivePaperSnapshot,
  type LiveFeedMode,
  type LiveMarketEvent,
  type LivePaperDecision,
  type LivePaperSnapshot,
  type PaperQuoteStatus,
} from '../modules/livePaper';
import { formatSol } from '../modules/evaluationEngine';

const POLL_MS = 7_500;
const PAPER_STARTING_EQUITY_SOL = 10;

const DISCOVERY_ENGINE_STAGES = [
  { title: 'DATA TRUTH', text: 'Audit lifecycle coverage, freshness, censoring, and route visibility.' },
  { title: 'LABEL FOUNDRY', text: 'Generate candidate labels that are actually worth predicting.' },
  { title: 'ML LAB', text: 'Train/search models and expose near-misses plus failure modes.' },
  { title: 'PROFILE BUILDER', text: 'Bind entry, exit, size, route, score, and veto assumptions.' },
  { title: 'PROOF ENGINE', text: 'Require intent, trusted quotes, failed exits, costs, and realistic EV.' },
  { title: 'PAPER / CANARY', text: 'Paper first; canary stays private, tiny, capped, and explicit.' },
  { title: 'SCALE', text: 'Scale only after proof, paper, and canary evidence agree.' },
];

type PaperPositionStatus = 'OPEN' | 'CLOSED';

interface PaperPosition {
  id: string;
  symbol: string;
  name: string;
  side: 'LONG';
  entryPrice: number;
  markPrice: number;
  sizeSol: number;
  unrealizedPnlSol: number;
  realizedPnlSol: number;
  status: PaperPositionStatus;
  age: string;
  source: string;
  quoteStatus: PaperQuoteStatus;
}

interface TerminalMetrics {
  paperEquitySol: number;
  totalPnlSol: number;
  realizedPnlSol: number;
  unrealizedPnlSol: number;
  openPositions: number;
  closedPositions: number;
  winRatePct: number | null;
}

interface EquityPoint {
  x: number;
  y: number;
  value: number;
  label: string;
}

interface ActivePairSummary {
  symbol: string;
  name: string;
  pair: string;
  price: string;
  changeLabel: string;
  changeTone: 'positive' | 'negative' | 'neutral';
  liquidity: string;
  marketCap: string;
  volume: string;
  signal: string;
  quoteLabel: string;
  statusLabel: string;
}

interface MarketRowMetrics {
  marketCap: string;
  volume: string;
  liquidity: string;
  quoteLabel: string;
  quoteTone: string;
}

interface RouteStatusSummary {
  slippageCap: string;
  route: string;
  impact: string;
  quote: string;
}

export function LivePaperDemo() {
  const [agentId, setAgentId] = useState(agentDefinitions[0].id);
  const [modelId, setModelId] = useState(modelDefinitions[0].id);
  const [isRunning, setIsRunning] = useState(false);
  const [snapshot, setSnapshot] = useState<LivePaperSnapshot>(() => buildClientFetchFallbackSnapshot({ agentId, modelId }));
  const [lastError, setLastError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());

  useEffect(() => {
    const clock = setInterval(() => setClockNow(Date.now()), 1_000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      setIsRefreshing(false);
      return undefined;
    }

    let alive = true;
    let interval: ReturnType<typeof setInterval> | undefined;

    async function refresh() {
      setIsRefreshing(true);
      try {
        const params = new URLSearchParams({ agentId, modelId });
        const response = await fetch(`/api/live-feed?${params.toString()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const nextSnapshot = await response.json() as LivePaperSnapshot;
        if (!alive) return;
        setSnapshot(nextSnapshot);
        setLastError(null);
      } catch (error) {
        if (!alive) return;
        setSnapshot(buildClientFetchFallbackSnapshot({ agentId, modelId }));
        setLastError(error instanceof Error ? error.message : 'fetch failed');
      } finally {
        if (alive) setIsRefreshing(false);
      }
    }

    void refresh();
    interval = setInterval(() => { void refresh(); }, POLL_MS);

    return () => {
      alive = false;
      if (interval) clearInterval(interval);
    };
  }, [agentId, modelId, isRunning]);

  useEffect(() => {
    if (isRunning) return;
    setSnapshot((current) => buildLivePaperSnapshot(current.events, current.meta, { agentId, modelId }));
  }, [agentId, modelId, isRunning]);

  const positions = useMemo(() => buildPaperPositions(snapshot), [snapshot]);
  const terminalMetrics = useMemo(() => calculateTerminalMetrics(positions), [positions]);
  const equityCurve = useMemo(() => buildEquityCurve(snapshot, positions), [snapshot, positions]);
  const modeLabel = useMemo(() => modeToLabel(snapshot.meta.mode), [snapshot.meta.mode]);
  const latestEvent = snapshot.events[0];
  const activePair = useMemo(() => buildActivePairSummary(latestEvent), [latestEvent]);
  const routeStatus = useMemo(() => buildRouteStatus(snapshot.events), [snapshot.events]);
  const selectedAgent = useMemo(() => agentDefinitions.find((agent) => agent.id === agentId) ?? agentDefinitions[0], [agentId]);
  const selectedModel = useMemo(() => modelDefinitions.find((model) => model.id === modelId) ?? modelDefinitions[0], [modelId]);
  const profileName = selectedAgent.name.replace(/\s+Agent$/i, '');
  const profileSubtitle = `${selectedAgent.role.toUpperCase()} / MIN SCORE ${selectedAgent.minSignalScore}`;

  return (
    <section className="live-paper-section" id="live-paper-demo" aria-label="PalusOS paper terminal">
      <div className={`trading-terminal${isRunning ? '' : ' is-paused'}`}>
        <header className="terminal-topbar">
          <div className="terminal-nav-left" aria-label="Demo terminal navigation">
            <a href="/" className="terminal-brand-block" aria-label="Back to PalusOS site">
              <b>PalusOS</b>
            </a>
            <span className="terminal-nav-tab active">DEMO</span>
            <span className="terminal-nav-divider" aria-hidden="true" />
            <a href="/" className="terminal-nav-tab">HOME <ExternalLink size={12} aria-hidden="true" /></a>
          </div>

          <div className="terminal-safety-strip" aria-label="Demo safety status">
            <span>READ-ONLY DATA</span>
            <span>PAPER</span>
            <span>NO WALLET</span>
            <time>{new Date(clockNow).toLocaleTimeString()}</time>
          </div>
        </header>

        <div className="terminal-sim-disclaimer">SIMULATED PAPER VIEW — NOT VERIFIED STRATEGY PNL. PUBLIC DEMO VISUALIZES THE PROOF LOOP; REAL LABEL DISCOVERY, ML SEARCH, AND QUOTE-BACKED OUTCOMES RUN IN PRIVATE SYSTEM INFRASTRUCTURE.</div>

        <section className="terminal-dashboard" aria-label="PalusOS paper dashboard">
          <aside className="terminal-profile-rail" aria-label="Profile controls and pipeline">
            <div className="profile-control-stack">
              <label className="profile-select-card">
                <span className="rail-label">ACTIVE PROFILE</span>
                <select value={agentId} onChange={(event) => setAgentId(event.target.value)} aria-label="Active profile">
                  {agentDefinitions.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                </select>
                <strong>{profileName}</strong>
                <small>{profileSubtitle}</small>
              </label>

              <label className="model-inline-control">
                <span>MODEL</span>
                <select value={modelId} onChange={(event) => setModelId(event.target.value)} aria-label="Model">
                  {modelDefinitions.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
                </select>
                <small>{selectedModel.family}</small>
              </label>

              <div className="paper-loop-controls" aria-label="Start or stop paper polling loop">
                <button className="paper-control-button start" type="button" aria-pressed={isRunning} onClick={() => setIsRunning(true)} disabled={isRunning}>
                  <Play size={13} /> START
                </button>
                <button className="paper-control-button stop" type="button" aria-pressed={!isRunning} onClick={() => setIsRunning(false)} disabled={!isRunning}>
                  <Pause size={13} /> STOP
                </button>
                <small>{isRunning ? 'POLLING PAPER FEED' : 'PAPER POLLING PAUSED'}</small>
              </div>
            </div>

            <div className="rail-divider" />

            <div className="profile-process-list">
              <span className="rail-label">DISCOVERY ENGINE</span>
              <p className="profile-process-copy">
                Simulated public view of the PalusOS discovery loop: read-only evidence becomes labels, model searches, strategy profiles, and proof gates before paper or canary.
              </p>
              <ol>
                {DISCOVERY_ENGINE_STAGES.map((stage) => (
                  <li key={stage.title}>
                    <b>{stage.title}</b>
                    <small>{stage.text}</small>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          <main className="terminal-chart-column" aria-label="Portfolio metrics and chart">
            <section className="terminal-metrics-grid" aria-label="Paper portfolio metrics">
              <TerminalMetric label="CUM. PNL" value={formatSol(terminalMetrics.totalPnlSol)} detail="REALIZED + UNREALIZED" tone={terminalMetrics.totalPnlSol >= 0 ? 'positive' : 'negative'} />
              <TerminalMetric label="CUM. UNREALIZED" value={formatSol(terminalMetrics.unrealizedPnlSol)} detail={`${terminalMetrics.openPositions} OPEN POSITIONS`} tone={terminalMetrics.unrealizedPnlSol >= 0 ? 'positive' : 'negative'} />
              <TerminalMetric label="TRADES" value={String(positions.length)} detail={terminalMetrics.winRatePct === null ? 'CUMULATIVE PAPER' : `${terminalMetrics.winRatePct.toFixed(0)}% CLOSED WIN`} tone="neutral" />
              <TerminalMetric label="OPEN" value={String(terminalMetrics.openPositions)} detail={`${terminalMetrics.closedPositions} CLOSED`} tone="neutral" />
            </section>

            <article className="chart-panel terminal-chart-panel">
              <div className="chart-header-minimal">
                <span>CHART</span>
                <small>{modeLabel} · {quoteSummary(snapshot.events)}</small>
              </div>

              <EquityChart points={equityCurve} markerLabel={activePair.price} />
            </article>

            <section className="positions-under-chart">
              <div className="right-module-header">
                <span>POSITIONS</span>
                <b>{positions.length} CUMULATIVE</b>
              </div>
              <div className="compact-position-list compact-position-list--wide">
                {positions.length > 0 ? positions.map((position) => {
                  const pnl = position.realizedPnlSol + position.unrealizedPnlSol;
                  return (
                    <div className="compact-position-row" key={position.id}>
                      <div>
                        <b>{position.symbol}</b>
                        <small>{position.name}</small>
                      </div>
                      <span className={position.status.toLowerCase()}>{position.status}</span>
                      <strong className={pnl >= 0 ? 'positive' : 'negative'}>{formatSol(pnl)}</strong>
                    </div>
                  );
                }) : <p className="terminal-empty-copy">Press START to begin the paper feed. No active paper positions yet.</p>}
              </div>
            </section>
          </main>

          <aside className="terminal-right-rail" aria-label="Signal and proof details">
            <section className="right-module signal-module">
              <div className="right-module-header">
                <span>SIGNAL LOG</span>
                <b>{snapshot.paper.decisions.length} ROWS</b>
              </div>
              <div className="decision-tape" aria-label="Paper decision log">
                {snapshot.paper.decisions.slice(0, 5).map((decision) => <DecisionRow key={decision.eventId} decision={decision} />)}
              </div>
            </section>

            <section className="right-module proof-module-right">
              <div className="right-module-header">
                <span>PROOF TRACE</span>
                <b>{snapshot.paper.verdictLabel}</b>
              </div>
              <div className="route-proof-grid">
                <span><small>SLIPPAGE</small><b>{routeStatus.slippageCap}</b></span>
                <span><small>ROUTE</small><b>{routeStatus.route}</b></span>
                <span><small>IMPACT</small><b>{routeStatus.impact}</b></span>
                <span><small>QUOTE</small><b>{routeStatus.quote}</b></span>
              </div>
              <p>{snapshot.paper.action}</p>
              <ul>
                {snapshot.paper.rationale.slice(0, 2).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <footer className="right-status-line">
              <span>{snapshot.meta.readOnly ? 'READ-ONLY RPC' : 'DEMO REPLAY'}</span>
              <span>{lastError ? `FALLBACK ${lastError}` : isRefreshing ? 'REFRESHING' : isRunning ? 'POLLING 7.5S' : 'PAUSED'}</span>
            </footer>
          </aside>
        </section>
      </div>
    </section>
  );
}

function TerminalMetric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'positive' | 'negative' | 'neutral' }) {
  return (
    <article className={`terminal-metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function EquityChart({ points, markerLabel }: { points: EquityPoint[]; markerLabel: string }) {
  if (points.length === 0) return null;

  const first = points[0];
  const last = points[points.length - 1];
  const values = points.map((point) => point.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const markerY = clamp(last.y, 10, 86);
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${last.x} 94 L ${first.x} 94 Z`;
  const pointString = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className="equity-chart" aria-label={`Synthetic paper equity curve ending at ${last.value.toFixed(4)} SOL`}>
      <div className="chart-center-label" aria-hidden="true">CHART</div>
      <svg viewBox="0 0 120 100" role="img" aria-hidden="true" preserveAspectRatio="none">
        <defs>
          <linearGradient id="paperEquityGlow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(245,242,235,.32)" />
            <stop offset="100%" stopColor="rgba(245,242,235,0)" />
          </linearGradient>
        </defs>
        <text className="equity-chart__axis" x="4" y="13">{maxValue.toFixed(4)}</text>
        <text className="equity-chart__axis" x="4" y="88">{minValue.toFixed(4)}</text>
        <path className="equity-chart__area" d={areaPath} />
        <polyline className="equity-chart__line" points={pointString} />
        {points.map((point) => <circle className="equity-chart__point" cx={point.x} cy={point.y} r="1.4" key={`${point.label}-${point.x}`} />)}
        <line className="equity-chart__price-line" x1="0" x2="120" y1={markerY} y2={markerY} />
        <text className="equity-chart__price-label" x="116" y={Math.max(12, markerY - 3)}>{markerLabel}</text>
        <circle className="equity-chart__last" cx={last.x} cy={last.y} r="2.8" />
      </svg>
      <div className="equity-chart__labels">
        <span>{first.label}</span>
        <b>{last.value.toFixed(4)} SOL</b>
        <span>{last.label}</span>
      </div>
    </div>
  );
}

function DecisionRow({ decision }: { decision: LivePaperDecision }) {
  const candidate = decision.action === 'paper_candidate';
  return (
    <div className={`decision-row ${candidate ? 'candidate' : 'skip'}`}>
      <span>{candidate ? 'PAPER POSITION' : 'WATCHLIST'}</span>
      <div>
        <b>{friendlyAsset(decision.asset)}</b>
        <small>{decision.reason}</small>
      </div>
      <strong>{decision.score}</strong>
    </div>
  );
}

function buildPaperPositions(snapshot: LivePaperSnapshot): PaperPosition[] {
  const decisionByEventId = new Map(snapshot.paper.decisions.map((decision) => [decision.eventId, decision]));
  const candidateEvents = snapshot.events
    .filter((event) => decisionByEventId.get(event.id)?.action === 'paper_candidate')
    .slice(0, 7);

  return candidateEvents.map((event, index) => buildPaperPosition(event, index));
}

function buildPaperPosition(event: LiveMarketEvent, index: number): PaperPosition {
  const identity = coinIdentity(event, index);
  const status: PaperPositionStatus = index % 4 === 3 ? 'CLOSED' : 'OPEN';
  const seed = hashToUnit(`${event.signature}:${event.asset}:${index}`);
  const quotedInput = event.quote?.inputSol ?? 0.01;
  const sizeSol = round6(clamp(quotedInput * (0.72 + seed * 1.18), 0.003, 0.028));
  const entryPrice = roundTokenPrice(0.0000012 + seed * 0.000019);
  const quoteMove = event.quote?.status === 'quoted' && typeof event.quote.roundTripReturnPct === 'number'
    ? event.quote.roundTripReturnPct
    : 0;
  const movePct = clamp(event.realizedReturnPct * (status === 'OPEN' ? 0.62 : 1) + quoteMove * 0.18, -0.42, 0.72);
  const markPrice = roundTokenPrice(Math.max(entryPrice * 0.18, entryPrice * (1 + movePct)));
  const pnlSol = round6(sizeSol * movePct);

  return {
    id: `${event.id}-${status}`,
    symbol: identity.symbol,
    name: identity.name,
    side: 'LONG',
    entryPrice,
    markPrice,
    sizeSol,
    unrealizedPnlSol: status === 'OPEN' ? pnlSol : 0,
    realizedPnlSol: status === 'CLOSED' ? pnlSol : 0,
    status,
    age: timeAgo(event.timestamp),
    source: event.source === 'solana-rpc' ? event.programName.replace(' program', '') : 'Demo replay',
    quoteStatus: event.quote?.status ?? 'not_configured',
  };
}

function calculateTerminalMetrics(positions: PaperPosition[]): TerminalMetrics {
  const realizedPnlSol = round6(positions.reduce((total, position) => total + position.realizedPnlSol, 0));
  const unrealizedPnlSol = round6(positions.reduce((total, position) => total + position.unrealizedPnlSol, 0));
  const totalPnlSol = round6(realizedPnlSol + unrealizedPnlSol);
  const openPositions = positions.filter((position) => position.status === 'OPEN').length;
  const closedPositions = positions.filter((position) => position.status === 'CLOSED').length;
  const closed = positions.filter((position) => position.status === 'CLOSED');
  const wins = closed.filter((position) => position.realizedPnlSol > 0).length;

  return {
    paperEquitySol: round6(PAPER_STARTING_EQUITY_SOL + totalPnlSol),
    totalPnlSol,
    realizedPnlSol,
    unrealizedPnlSol,
    openPositions,
    closedPositions,
    winRatePct: closed.length === 0 ? null : (wins / closed.length) * 100,
  };
}

function buildEquityCurve(snapshot: LivePaperSnapshot, positions: PaperPosition[]): EquityPoint[] {
  const samples = snapshot.events.slice(0, 14).reverse();
  let equity = PAPER_STARTING_EQUITY_SOL;
  const rawPoints: Array<{ value: number; label: string }> = [{ value: equity, label: 'Start' }];

  samples.forEach((event, index) => {
    const inputSol = event.quote?.inputSol ?? 0.01;
    const conviction = 0.55 + hashToUnit(`${event.id}:${event.score}`) * 0.65;
    const boundedReturn = clamp(event.realizedReturnPct, -0.42, 0.72);
    equity = round6(equity + inputSol * boundedReturn * conviction);
    rawPoints.push({ value: equity, label: coinIdentity(event, index).symbol });
  });

  if (rawPoints.length < 4) {
    positions.forEach((position) => {
      equity = round6(equity + position.realizedPnlSol + position.unrealizedPnlSol);
      rawPoints.push({ value: equity, label: position.symbol });
    });
  }

  const values = rawPoints.map((point) => point.value);
  const min = Math.min(...values, PAPER_STARTING_EQUITY_SOL - 0.002);
  const max = Math.max(...values, PAPER_STARTING_EQUITY_SOL + 0.002);
  const range = Math.max(max - min, 0.001);
  const denominator = Math.max(rawPoints.length - 1, 1);

  return rawPoints.map((point, index) => ({
    x: 6 + (index / denominator) * 108,
    y: 86 - ((point.value - min) / range) * 68,
    value: point.value,
    label: point.label,
  }));
}

function buildActivePairSummary(event: LiveMarketEvent | undefined): ActivePairSummary {
  if (!event) {
    return {
      symbol: 'PUMP',
      name: 'Waiting for read-only demo feed',
      pair: 'PUMP/SOL',
      price: formatTokenPrice(0.0000125),
      changeLabel: '+0.0%',
      changeTone: 'neutral',
      liquidity: '$0',
      marketCap: '$0',
      volume: '$0',
      signal: '—',
      quoteLabel: 'read-only',
      statusLabel: 'watching',
    };
  }

  const identity = coinIdentity(event, 0);
  const metrics = buildMarketRowMetrics(event, 0);
  const changePct = event.realizedReturnPct * 100;
  const quoteLabel = quoteStatusLabel(event.quote?.status);

  return {
    symbol: identity.symbol,
    name: identity.name,
    pair: `${identity.symbol}/SOL`,
    price: formatTokenPrice(syntheticMarkPrice(event, 0)),
    changeLabel: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`,
    changeTone: changePct > 0 ? 'positive' : changePct < 0 ? 'negative' : 'neutral',
    liquidity: metrics.liquidity,
    marketCap: metrics.marketCap,
    volume: metrics.volume,
    signal: String(event.score),
    quoteLabel,
    statusLabel: event.quote?.status === 'quoted' ? 'quoted paper' : event.source === 'solana-rpc' ? 'read-only' : 'demo row',
  };
}

function buildMarketRowMetrics(event: LiveMarketEvent, index: number): MarketRowMetrics {
  const seed = hashToUnit(`${event.id}:${event.signature}:${index}:market`);
  const liquidityUsd = 18_000 + event.liquidityScore * 2_250 + seed * 72_000;
  const marketCapUsd = liquidityUsd * (2.4 + seed * 4.8);
  const volumeUsd = 5_000 + event.score * 480 + Math.abs(event.realizedReturnPct) * 120_000 + seed * 26_000;

  return {
    marketCap: formatCompactUsd(marketCapUsd),
    volume: formatCompactUsd(volumeUsd),
    liquidity: formatCompactUsd(liquidityUsd),
    quoteLabel: quoteStatusLabel(event.quote?.status),
    quoteTone: quoteStatusClass(event.quote?.status),
  };
}

function buildRouteStatus(events: LiveMarketEvent[]): RouteStatusSummary {
  const event = events.find((item) => item.quote?.status === 'quoted') ?? events[0];
  if (!event) {
    return { slippageCap: '1.0%', route: 'no route', impact: 'n/a', quote: 'read-only' };
  }

  const impact = typeof event.quote?.priceImpactPct === 'number'
    ? `${Math.abs(event.quote.priceImpactPct * 100).toFixed(2)}%`
    : `${Math.max(0.10, event.routeRiskBps / 100).toFixed(2)}%`;

  return {
    slippageCap: '1.0%',
    route: event.quote?.routePlanHops ? `${event.quote.routePlanHops} hops` : `${event.routeRiskBps} bps risk`,
    impact,
    quote: quoteSummary(events),
  };
}

function syntheticMarkPrice(event: LiveMarketEvent, index: number): number {
  const seed = hashToUnit(`${event.signature}:${event.asset}:${index}`);
  return roundTokenPrice(0.0000012 + seed * 0.000019);
}

function quoteStatusLabel(status: PaperQuoteStatus | undefined): string {
  switch (status) {
    case 'quoted':
      return 'quoted';
    case 'partial':
      return 'partial';
    case 'unroutable':
      return 'no route';
    case 'error':
      return 'error';
    case 'not_configured':
    default:
      return 'demo';
  }
}

function quoteStatusClass(status: PaperQuoteStatus | undefined): string {
  switch (status) {
    case 'quoted':
      return 'quoted';
    case 'partial':
      return 'partial';
    case 'unroutable':
    case 'error':
      return 'warning';
    case 'not_configured':
    default:
      return 'demo';
  }
}

function coinIdentity(event: LiveMarketEvent, index: number): { symbol: string; name: string } {
  const asset = event.asset.replace(/[·…]/g, '').replace(/[^a-zA-Z0-9-]/g, '');
  const fallback = String(index + 1).padStart(2, '0');

  if (event.mint) {
    const prefix = event.mint.slice(0, 4).toUpperCase();
    const suffix = event.mint.slice(-4).toUpperCase();
    return {
      symbol: event.mint.endsWith('pump') ? `PUMP${prefix}` : `MINT${prefix}`,
      name: event.mint.endsWith('pump') ? `Pump token ${prefix}` : `Mint ${prefix}…${suffix}`,
    };
  }

  if (asset.startsWith('PUMP-LAUNCH-')) {
    const launchId = asset.replace('PUMP-LAUNCH-', '').padStart(2, '0');
    return { symbol: `LAUNCH${launchId}`, name: `Launch Recovery #${launchId}` };
  }

  if (asset.startsWith('MINT-')) {
    const mintId = asset.replace('MINT-', '');
    return { symbol: `MINT${mintId}`, name: `Mint ${mintId}` };
  }

  if (asset.startsWith('PSWAP-')) {
    return { symbol: `PSWAP${fallback}`, name: 'PumpSwap token activity' };
  }

  if (asset.startsWith('PUMP-')) {
    return { symbol: `PUMP${fallback}`, name: 'Pump token activity' };
  }

  return { symbol: asset.slice(0, 10).toUpperCase() || `COIN${fallback}`, name: friendlyAsset(event.asset) };
}

function quoteSummary(events: LiveMarketEvent[]): string {
  const quoted = events.filter((event) => event.quote?.status === 'quoted').length;
  if (quoted > 0) return `${quoted}/${events.length} quoted`;
  const attempted = events.filter((event) => event.quote && event.quote.status !== 'not_configured').length;
  return attempted > 0 ? `${attempted}/${events.length} attempted` : 'read-only';
}

function friendlyAsset(asset: string): string {
  return asset.replace(/^PUMP-/, '').replace(/^MINT-/, 'Mint ').replaceAll('…', '…');
}

function modeToLabel(mode: LiveFeedMode): string {
  return mode === 'rpc-live-readonly' ? 'RPC live read-only' : 'Demo fallback mode';
}

function timeAgo(timestamp: string): string {
  const elapsedMs = Date.now() - Date.parse(timestamp);
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return 'just now';
  const seconds = Math.round(elapsedMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}


function formatTokenPrice(value: number): string {
  if (value < 0.00001) return value.toExponential(2);
  return value.toFixed(7);
}

function formatCompactUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 1,
    notation: 'compact',
    style: 'currency',
  }).format(value);
}

function roundTokenPrice(value: number): number {
  return Math.round(value * 100_000_000_000) / 100_000_000_000;
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

function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
