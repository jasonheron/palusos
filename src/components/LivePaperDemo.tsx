import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, BrainCircuit, DatabaseZap, Radio, ShieldCheck, Waves } from 'lucide-react';
import { agentDefinitions, modelDefinitions } from '../data/agentLabData';
import {
  buildClientFetchFallbackSnapshot,
  type LiveFeedMode,
  type LivePaperSnapshot,
} from '../modules/livePaper';
import { formatSol } from '../modules/evaluationEngine';

const POLL_MS = 7_500;

export function LivePaperDemo() {
  const [agentId, setAgentId] = useState(agentDefinitions[0].id);
  const [modelId, setModelId] = useState(modelDefinitions[0].id);
  const [snapshot, setSnapshot] = useState<LivePaperSnapshot>(() => buildClientFetchFallbackSnapshot({ agentId, modelId }));
  const [lastError, setLastError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
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
  }, [agentId, modelId]);

  const modeLabel = useMemo(() => modeToLabel(snapshot.meta.mode), [snapshot.meta.mode]);
  const statusText = snapshot.meta.mode === 'rpc-live-readonly'
    ? 'Solana RPC live read-only input'
    : `Demo fallback${snapshot.meta.reason ? ` · ${snapshot.meta.reason.replaceAll('_', ' ')}` : ''}`;

  return (
    <section className="live-paper-section" id="live-paper-demo">
      <div className="section-heading compact">
        <span className="eyebrow"><Radio size={14} /> Live Paper Demo</span>
        <h2>Select a trading profile and model, then paper-evaluate live Pump activity.</h2>
        <p>
          The browser never touches RPC or Jupiter. The server reads one Solana RPC feed, optionally asks
          Jupiter for paper round-trip quotes, and returns normalized proof rows. No wallet, signing, swaps,
          private keys, or broadcasts exist in this route.
        </p>
      </div>

      <div className="live-paper-shell">
        <article className="live-config-card">
          <span className="eyebrow">Demo controls</span>
          <LiveSelect
            icon={<BrainCircuit size={18} />}
            label="Trading profile"
            value={agentId}
            options={agentDefinitions.map((agent) => ({ value: agent.id, label: agent.name, detail: `${agent.role} · min signal ${agent.minSignalScore}` }))}
            onChange={setAgentId}
          />
          <LiveSelect
            icon={<BarChart3 size={18} />}
            label="ML model"
            value={modelId}
            options={modelDefinitions.map((model) => ({ value: model.id, label: model.name, detail: model.family }))}
            onChange={setModelId}
          />
          <div className="live-fixed-feed">
            <DatabaseZap size={18} />
            <div>
              <b>Live feed</b>
              <span>Server-side Pump/PumpSwap RPC signatures</span>
            </div>
          </div>
        </article>

        <article className="live-mode-card">
          <div className="live-mode-card__top">
            <span className={`live-dot ${snapshot.meta.mode}`} />
            <div>
              <b>{modeLabel}</b>
              <small>{statusText}</small>
            </div>
          </div>
          <div className="live-safety-grid">
            <SafetyPill icon={<ShieldCheck size={16} />} label="Read-only RPC" value={snapshot.meta.readOnly ? 'yes' : 'no'} />
            <SafetyPill icon={<Activity size={16} />} label="Paper only" value={snapshot.meta.paperOnly ? 'yes' : 'no'} />
            <SafetyPill icon={<Waves size={16} />} label="Wallet" value={snapshot.meta.wallet} />
          </div>
          <p>
            {snapshot.meta.scoreMethod}. Quote source: {snapshot.meta.quoteSource}. {lastError ? `Local fallback active (${lastError}).` : 'Polls every 7.5 seconds.'}
            {isRefreshing ? ' Refreshing…' : ''}
          </p>
        </article>

        <article className="live-profile-card">
          <span className="eyebrow">Current paper report</span>
          <h3>{snapshot.selectedProfile.agentName}</h3>
          <p>{snapshot.selectedProfile.modelName} · {snapshot.selectedProfile.dataFeedName}</p>
          <div className="live-profile-stats">
            <b>{snapshot.selectedProfile.proofScore}<small>proof score</small></b>
            <b>{snapshot.paper.verdictLabel}<small>paper verdict</small></b>
            <b>{snapshot.paper.metrics.confidenceScore}<small>confidence</small></b>
          </div>
        </article>

        <div className="live-metrics-grid">
          <LiveMetric label="Paper observations" value={String(snapshot.paper.metrics.selectedTrades)} detail="threshold-selected events" />
          <LiveMetric label="Projected EV / obs" value={formatSol(snapshot.paper.metrics.averageEvSol)} detail="quote-adjusted when available" />
          <LiveMetric label="Outlier EV" value={formatSol(snapshot.paper.metrics.outlierRemovedEvSol)} detail="trimmed proof metric" />
          <LiveMetric label="Largest winner removed" value={formatSol(snapshot.paper.metrics.largestWinnerRemovedEvSol)} detail="robustness check" />
        </div>

        <article className="live-feed-card">
          <div className="live-card-header">
            <div>
              <span className="eyebrow">Recent normalized events</span>
              <h3>{snapshot.meta.mode === 'rpc-live-readonly' ? 'Program signatures + quote status' : 'Bundled demo rows'}</h3>
            </div>
            <small>{new Date(snapshot.meta.generatedAt).toLocaleTimeString()}</small>
          </div>
          <div className="live-event-list">
            {snapshot.events.slice(0, 6).map((event) => (
              <div className="live-event" key={event.id}>
                <div>
                  <b>{event.asset}</b>
                  <span>{event.scenario}</span>
                  {event.mint && <i>{event.mint}</i>}
                </div>
                <div>
                  <strong>{event.score}</strong>
                  <small>{event.quote?.status ?? 'not_configured'} · {shortSignature(event.signature)} · {timeAgo(event.timestamp)}</small>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="live-feed-card live-decisions-card">
          <div className="live-card-header">
            <div>
              <span className="eyebrow">Paper decisions</span>
              <h3>Observe, score, gate — never execute</h3>
            </div>
          </div>
          <div className="live-event-list">
            {snapshot.paper.decisions.slice(0, 6).map((decision) => (
              <div className={`live-event decision ${decision.action}`} key={decision.eventId}>
                <div>
                  <b>{decision.action === 'paper_candidate' ? 'Paper candidate' : 'Paper skip'} · {decision.asset}</b>
                  <span>{decision.reason}</span>
                </div>
                <strong>{decision.score}</strong>
              </div>
            ))}
          </div>
        </article>
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
    <label className="lab-select live-select">
      <span>{icon}{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <small>{options.find((option) => option.value === value)?.detail}</small>
    </label>
  );
}

function SafetyPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <span>{icon}<small>{label}</small><b>{value}</b></span>;
}

function LiveMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="lab-stat-card live-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function modeToLabel(mode: LiveFeedMode): string {
  return mode === 'rpc-live-readonly' ? 'RPC live read-only' : 'Demo fallback mode';
}

function shortSignature(signature: string): string {
  if (signature.length <= 16) return signature;
  return `${signature.slice(0, 6)}…${signature.slice(-6)}`;
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
