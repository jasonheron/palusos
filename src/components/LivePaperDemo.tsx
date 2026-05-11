import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  BrainCircuit,
  DatabaseZap,
  ExternalLink,
  Pause,
  Play,
  Radio,
  ShieldCheck,
  Waves,
} from 'lucide-react';
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
  const [isRunning, setIsRunning] = useState(true);
  const [snapshot, setSnapshot] = useState<LivePaperSnapshot>(() => buildClientFetchFallbackSnapshot({ agentId, modelId }));
  const [lastError, setLastError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  const statusText = snapshot.meta.mode === 'rpc-live-readonly'
    ? 'Read-only Solana RPC input'
    : `Demo replay${snapshot.meta.reason ? ` · ${snapshot.meta.reason.replaceAll('_', ' ')}` : ''}`;
  const latestEvent = snapshot.events[0];
  const latestCoin = latestEvent ? coinIdentity(latestEvent, 0) : null;
  const activePair = useMemo(() => buildActivePairSummary(latestEvent), [latestEvent]);
  const routeStatus = useMemo(() => buildRouteStatus(snapshot.events), [snapshot.events]);

  return (
    <section className="live-paper-section" id="live-paper-demo" aria-label="PalusOS paper terminal">
      <div className={`trading-terminal trading-terminal--fullscreen${isRunning ? '' : ' is-paused'}`}>
        <header className="terminal-topbar">
          <a href="/" className="terminal-brand-block" aria-label="Back to PalusOS site">
            <span className={`terminal-status-dot ${isRunning ? 'active' : 'paused'}`} />
            <div>
              <b>PalusOS</b>
              <small>/demo · {modeLabel}</small>
            </div>
          </a>

          <nav className="terminal-route-tabs" aria-label="Demo terminal navigation">
            <span className="active">Demo</span>
            <a href="/">Home <ExternalLink size={12} aria-hidden="true" /></a>
          </nav>

          <div className="terminal-search-field" aria-label="Current watched market">
            <Radio size={14} />
            <span>{latestCoin ? `${latestCoin.symbol} / SOL` : 'PUMP / SOL'}</span>
            <small>{quoteSummary(snapshot.events)}</small>
          </div>

          <div className="terminal-safety-strip" aria-label="Demo safety status">
            <span><ShieldCheck size={13} /> read-only</span>
            <span><Activity size={13} /> paper</span>
            <span><Waves size={13} /> no wallet</span>
          </div>

          <time>{new Date(snapshot.meta.generatedAt).toLocaleTimeString()}</time>
        </header>

        <section className="terminal-control-row" aria-label="Paper terminal controls">
          <LiveSelect
            icon={<BrainCircuit size={15} />}
            label="Active profile"
            value={agentId}
            options={agentDefinitions.map((agent) => ({ value: agent.id, label: agent.name, detail: `${agent.role} · signal ≥ ${agent.minSignalScore}` }))}
            onChange={setAgentId}
          />
          <LiveSelect
            icon={<BarChart3 size={15} />}
            label="Model"
            value={modelId}
            options={modelDefinitions.map((model) => ({ value: model.id, label: model.name, detail: model.family }))}
            onChange={setModelId}
          />
          <div className="terminal-start-stop" aria-label="Start or stop paper trading loop">
            <button className="paper-control-button start" type="button" aria-pressed={isRunning} onClick={() => setIsRunning(true)} disabled={isRunning}>
              <Play size={15} /> Start Paper
            </button>
            <button className="paper-control-button stop" type="button" aria-pressed={!isRunning} onClick={() => setIsRunning(false)} disabled={!isRunning}>
              <Pause size={15} /> Stop Paper
            </button>
            <small>Simulation polling only. No wallet, signing, swaps, or broadcasts.</small>
          </div>
        </section>

        <section className="terminal-metrics-grid" aria-label="Paper portfolio metrics">
          <TerminalMetric label="Equity" value={formatUnsignedSol(terminalMetrics.paperEquitySol)} detail="10 SOL sim" tone="neutral" />
          <TerminalMetric label="Net PnL" value={formatSol(terminalMetrics.totalPnlSol)} detail="real + unrl" tone={terminalMetrics.totalPnlSol >= 0 ? 'positive' : 'negative'} />
          <TerminalMetric label="Unrealized" value={formatSol(terminalMetrics.unrealizedPnlSol)} detail={`${terminalMetrics.openPositions} open positions`} tone={terminalMetrics.unrealizedPnlSol >= 0 ? 'positive' : 'negative'} />
          <TerminalMetric label="Realized" value={formatSol(terminalMetrics.realizedPnlSol)} detail={`${terminalMetrics.closedPositions} closed`} tone={terminalMetrics.realizedPnlSol >= 0 ? 'positive' : 'negative'} />
          <TerminalMetric label="Open" value={String(terminalMetrics.openPositions)} detail={`${snapshot.paper.metrics.selectedTrades} selected rows`} tone="neutral" />
          <TerminalMetric label="Confidence" value={`${snapshot.paper.metrics.confidenceScore}%`} detail={terminalMetrics.winRatePct === null ? 'no closed rows' : `${terminalMetrics.winRatePct.toFixed(0)}% win rate`} tone="neutral" />
        </section>

        <section className="terminal-workspace-grid" aria-label="Paper trading workspace">
          <article className="terminal-panel market-feed-panel">
            <div className="terminal-panel-header compact">
              <div>
                <span className="eyebrow">Market feed</span>
                <h3>{snapshot.meta.mode === 'rpc-live-readonly' ? 'Pump / PumpSwap' : 'Demo rows'}</h3>
              </div>
              <span className="terminal-mode-pill">{snapshot.events.length} ROWS</span>
            </div>
            <div className="market-feed-list">
              <div className="market-feed-row market-feed-heading" aria-hidden="true">
                <b>Pair</b>
                <span>MC</span>
                <span>Vol</span>
                <span>Sig</span>
                <small>Quote</small>
              </div>
              {snapshot.events.slice(0, 14).map((event, index) => {
                const coin = coinIdentity(event, index);
                const metrics = buildMarketRowMetrics(event, index);
                return (
                  <div className="market-feed-row" key={event.id}>
                    <span className="token-icon" aria-hidden="true">{coin.symbol.slice(0, 2)}</span>
                    <div className="coin-cell">
                      <b>{coin.symbol}</b>
                      <small>{coin.name}</small>
                    </div>
                    <small className="market-age">{timeAgo(event.timestamp)}</small>
                    <div className="market-row-metrics" aria-label={`${coin.symbol} market metrics`}>
                      <span><small>MC</small><b>{metrics.marketCap}</b></span>
                      <span><small>Vol</small><b>{metrics.volume}</b></span>
                      <span><small>Sig</small><b>{event.score}</b></span>
                      <span className={`quote-badge ${metrics.quoteTone}`}><small>Quote</small><b>{metrics.quoteLabel}</b></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <div className="terminal-center-stack">
            <article className="terminal-panel chart-panel">
              <ActivePairHeader pair={activePair} modePill={isRunning ? 'LIVE LOOP' : 'PAUSED'} />
              <div className="chart-toolbar" aria-label="Chart time range">
                <div className="time-range-chips">
                  {['1m', '5m', '15m', '1h'].map((range) => <span className={range === '5m' ? 'active' : ''} key={range}>{range}</span>)}
                </div>
                <small>{snapshot.meta.mode === 'rpc-live-readonly' ? 'read-only mark stream' : 'bundled demo mark stream'}</small>
              </div>
              <EquityChart points={equityCurve} markerLabel={activePair.price} />
              <div className="chart-stat-strip" aria-label="Paper chart stats">
                <span><small>Avg EV</small><b>{formatSol(snapshot.paper.metrics.averageEvSol)}</b></span>
                <span><small>Outlier EV</small><b>{formatSol(snapshot.paper.metrics.outlierRemovedEvSol)}</b></span>
                <span><small>Max DD</small><b>{formatSol(snapshot.paper.metrics.maxDrawdownSol)}</b></span>
                <span><small>Stage</small><b>{snapshot.selectedProfile.stage}</b></span>
              </div>
            </article>

            <article className="terminal-panel positions-panel">
              <div className="terminal-panel-header compact">
                <div>
                  <span className="eyebrow">Active positions</span>
                  <h3>Paper positions and PnL</h3>
                </div>
                <span className="terminal-mode-pill">{positions.length} TOTAL</span>
              </div>

              <div className="positions-table-wrap">
                <table className="positions-table">
                  <thead>
                    <tr>
                      <th>Coin</th>
                      <th>Side</th>
                      <th>Entry</th>
                      <th>Mark</th>
                      <th>Size</th>
                      <th>Unrl</th>
                      <th>Real</th>
                      <th>Status</th>
                      <th>Age / source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.length > 0 ? positions.map((position) => (
                      <tr key={position.id} className={position.status.toLowerCase()}>
                        <td>
                          <b>{position.symbol}</b>
                          <small>{position.name}</small>
                        </td>
                        <td>{position.side}</td>
                        <td className="numeric">{formatTokenPrice(position.entryPrice)}</td>
                        <td className="numeric">{formatTokenPrice(position.markPrice)}</td>
                        <td className="numeric">{position.sizeSol.toFixed(4)} SOL</td>
                        <td className={`numeric pnl-cell ${position.unrealizedPnlSol >= 0 ? 'positive' : 'negative'}`}>{formatSol(position.unrealizedPnlSol)}</td>
                        <td className={`numeric pnl-cell ${position.realizedPnlSol >= 0 ? 'positive' : 'negative'}`}>{formatSol(position.realizedPnlSol)}</td>
                        <td><span className={`position-status ${position.status.toLowerCase()}`}>{position.status}</span></td>
                        <td>
                          <span>{position.age}</span>
                          <small>{position.source} · {position.quoteStatus}</small>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={9} className="empty-positions-cell">
                          No active paper positions for this profile yet. The terminal is still watching the feed and scoring rows.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </div>

          <aside className="terminal-panel terminal-ticket-panel">
            <div className="terminal-panel-header compact">
              <div>
                <span className="eyebrow">Paper order sim</span>
                <h3>{activePair.pair}</h3>
              </div>
              <span className="terminal-mode-pill">NO WALLET</span>
            </div>

            <div className="paper-order-card" aria-label="Paper-only order simulation ticket">
              <div className="order-ticket-topline">
                <span>Paper mark</span>
                <b>{activePair.price}</b>
                <small className={activePair.changeTone}>{activePair.changeLabel}</small>
              </div>
              <div className="size-preset-grid" aria-label="Paper size presets">
                {['0.005', '0.010', '0.025', '0.050'].map((size, index) => <span className={index === 1 ? 'active' : ''} key={size}>{size} SOL</span>)}
              </div>
              <div className="order-route-grid">
                <span><small>Slippage cap</small><b>{routeStatus.slippageCap}</b></span>
                <span><small>Route</small><b>{routeStatus.route}</b></span>
                <span><small>Impact</small><b>{routeStatus.impact}</b></span>
                <span><small>Quote</small><b>{routeStatus.quote}</b></span>
              </div>
              <div className="paper-sim-actions">
                <button className="paper-sim-button buy" type="button" disabled>Paper Buy Sim</button>
                <button className="paper-sim-button sell" type="button" disabled>Paper Sell Sim</button>
              </div>
              <small className="paper-only-copy">Simulation-only controls. No wallet connect, signing, swaps, transaction creation, or broadcasts.</small>
            </div>

            <div className="proof-log-card">
              <span>Proof / gate status</span>
              <b>{snapshot.paper.verdictLabel}</b>
              <small>{snapshot.paper.action}</small>
              <ul>
                {snapshot.paper.rationale.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>

            <div className="terminal-safety-grid">
              <SafetyPill icon={<ShieldCheck size={14} />} label="RPC" value={snapshot.meta.readOnly ? 'read only' : 'disabled'} />
              <SafetyPill icon={<Activity size={14} />} label="Mode" value={snapshot.meta.paperOnly ? 'paper' : 'unknown'} />
              <SafetyPill icon={<DatabaseZap size={14} />} label="Wallet" value={snapshot.meta.wallet} />
            </div>

            <div className="decision-tape" aria-label="Paper decision log">
              {snapshot.paper.decisions.slice(0, 6).map((decision) => (
                <DecisionRow key={decision.eventId} decision={decision} />
              ))}
            </div>
          </aside>
        </section>

        <footer className="terminal-bottom-status">
          <span><ShieldCheck size={13} /> paper-only public demo</span>
          <span>{statusText}. {snapshot.meta.scoreMethod}</span>
          <span>{lastError ? `fallback: ${lastError}` : isRefreshing ? 'refreshing…' : isRunning ? 'polling 7.5s' : 'polling paused'}</span>
        </footer>
      </div>
    </section>
  );
}

function LiveSelect({ icon, label, value, options, onChange }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: Array<{ value: string; label: string; detail: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="lab-select live-select terminal-select">
      <span>{icon}{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <small>{options.find((option) => option.value === value)?.detail}</small>
    </label>
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

function ActivePairHeader({ pair, modePill }: { pair: ActivePairSummary; modePill: string }) {
  return (
    <div className="active-pair-header">
      <div className="active-pair-title">
        <span className="token-icon large" aria-hidden="true">{pair.symbol.slice(0, 2)}</span>
        <div>
          <span className="eyebrow">Active pair</span>
          <h3>{pair.pair}</h3>
          <small>{pair.name}</small>
        </div>
      </div>
      <div className="active-pair-price">
        <strong>{pair.price}</strong>
        <span className={pair.changeTone}>{pair.changeLabel}</span>
      </div>
      <div className="active-pair-meta" aria-label="Active pair market metadata">
        <span><small>Liq</small><b>{pair.liquidity}</b></span>
        <span><small>MC</small><b>{pair.marketCap}</b></span>
        <span><small>Vol</small><b>{pair.volume}</b></span>
        <span><small>Signal</small><b>{pair.signal}</b></span>
        <span><small>Quote</small><b>{pair.quoteLabel}</b></span>
        <span><small>Status</small><b>{pair.statusLabel}</b></span>
      </div>
      <span className="terminal-mode-pill">{modePill}</span>
    </div>
  );
}

function SafetyPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <span>{icon}<small>{label}</small><b>{value}</b></span>;
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

function formatUnsignedSol(value: number): string {
  return `${value.toFixed(4)} SOL`;
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
