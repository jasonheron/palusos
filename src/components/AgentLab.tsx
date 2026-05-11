import type React from 'react';
import { useMemo, useState } from 'react';
import { BarChart3, BrainCircuit, Calculator, DatabaseZap, Play, SearchCheck, ShieldCheck } from 'lucide-react';
import { agentDefinitions, dataFeedDefinitions, modelDefinitions } from '../data/agentLabData';
import {
  defaultExecutionAssumptions,
  discoverStrategyProfiles,
  evaluateAgentLab,
  formatPct,
  formatSol,
  type ExecutionAssumptions,
  type StrategyDiscoveryCandidate,
} from '../modules/evaluationEngine';

type AssumptionKey = keyof Pick<ExecutionAssumptions, 'tradeSizeSol' | 'feeBps' | 'slippageBps' | 'latencyMs' | 'maxDrawdownSol'>;

const assumptionControls: Array<{ key: AssumptionKey; label: string; step: number; min: number; suffix: string }> = [
  { key: 'tradeSizeSol', label: 'Trade size', step: 0.005, min: 0.005, suffix: 'SOL' },
  { key: 'feeBps', label: 'Fees', step: 1, min: 0, suffix: 'bps' },
  { key: 'slippageBps', label: 'Slippage', step: 5, min: 0, suffix: 'bps' },
  { key: 'latencyMs', label: 'Latency', step: 50, min: 0, suffix: 'ms' },
  { key: 'maxDrawdownSol', label: 'Max drawdown', step: 0.005, min: 0.005, suffix: 'SOL' },
];

export function AgentLab() {
  const [agentId, setAgentId] = useState(agentDefinitions[0].id);
  const [feedId, setFeedId] = useState(dataFeedDefinitions[0].id);
  const [modelId, setModelId] = useState(modelDefinitions[0].id);
  const [assumptions, setAssumptions] = useState<ExecutionAssumptions>(defaultExecutionAssumptions);

  const selected = useMemo(() => ({
    agent: agentDefinitions.find((agent) => agent.id === agentId) ?? agentDefinitions[0],
    dataFeed: dataFeedDefinitions.find((feed) => feed.id === feedId) ?? dataFeedDefinitions[0],
    model: modelDefinitions.find((model) => model.id === modelId) ?? modelDefinitions[0],
  }), [agentId, feedId, modelId]);

  const [report, setReport] = useState(() => evaluateAgentLab({ ...selected, assumptions }));
  const [runCount, setRunCount] = useState(1);

  const draftReport = useMemo(() => evaluateAgentLab({ ...selected, assumptions }), [selected, assumptions]);
  const discoveryCandidates = useMemo(
    () => discoverStrategyProfiles(agentDefinitions, dataFeedDefinitions, modelDefinitions, assumptions).slice(0, 5),
    [assumptions],
  );
  const isStale = report.agent.id !== selected.agent.id
    || report.dataFeed.id !== selected.dataFeed.id
    || report.model.id !== selected.model.id
    || JSON.stringify(report.assumptions) !== JSON.stringify(assumptions);

  const runEvaluation = () => {
    setReport(draftReport);
    setRunCount((count) => count + 1);
  };

  const loadDiscoveryCandidate = (candidate: StrategyDiscoveryCandidate) => {
    setAgentId(candidate.agent.id);
    setFeedId(candidate.dataFeed.id);
    setModelId(candidate.model.id);
    setReport(candidate.report);
    setRunCount((count) => count + 1);
  };

  const updateAssumption = (key: AssumptionKey, value: number) => {
    setAssumptions((current) => ({ ...current, [key]: Number.isFinite(value) ? value : current[key] }));
  };

  return (
    <section className="agent-lab-section" id="agent-lab">
      <div className="section-heading compact">
        <span className="eyebrow">Agent Lab MVP</span>
        <h2>Discover candidate strategy profiles, then prove their realistic EV before capital.</h2>
        <p>
          PalusOS ranks agent/feed/model combinations, calibrates execution assumptions, and turns
          each candidate into an auditable proof report. This public demo uses bundled rows only;
          the same adapter pipeline can run on real market feeds in a private deployment.
        </p>
      </div>

      <div className="lab-shell">
        <div className="lab-config-panel">
          <LabSelect
            icon={<BrainCircuit size={18} />}
            label="Agent"
            value={agentId}
            options={agentDefinitions.map((agent) => ({ value: agent.id, label: agent.name, detail: `${agent.role} · min score ${agent.minSignalScore}` }))}
            onChange={setAgentId}
          />
          <LabSelect
            icon={<DatabaseZap size={18} />}
            label="Data Feed"
            value={feedId}
            options={dataFeedDefinitions.map((feed) => ({ value: feed.id, label: feed.name, detail: `${feed.market} · ${feed.events.length} rows` }))}
            onChange={setFeedId}
          />
          <LabSelect
            icon={<BarChart3 size={18} />}
            label="ML Model"
            value={modelId}
            options={modelDefinitions.map((model) => ({ value: model.id, label: model.name, detail: model.family }))}
            onChange={setModelId}
          />

          <div className="assumption-grid" aria-label="Execution assumptions">
            {assumptionControls.map((control) => (
              <label key={control.key} className="assumption-control">
                <span>{control.label}</span>
                <div>
                  <input
                    type="number"
                    min={control.min}
                    step={control.step}
                    value={assumptions[control.key]}
                    onChange={(event) => updateAssumption(control.key, Number(event.target.value))}
                  />
                  <em>{control.suffix}</em>
                </div>
              </label>
            ))}
          </div>

          <button className="run-evaluation-button" type="button" onClick={runEvaluation}>
            <Play size={18} fill="currentColor" /> Run Evaluation
          </button>

          <div className="lab-note">
            <Calculator size={18} />
            <span>Selection threshold: {draftReport.threshold}. Run #{runCount}{isStale ? ' · pending changes' : ' · report current'}.</span>
          </div>

          <div className="demo-data-note">
            <b>Public repo safety note</b>
            <span>Demo data only: no wallets, API keys, private databases, or live execution are shipped here.</span>
          </div>
        </div>

        <div className="lab-report-panel">
          <div className="discovery-panel" aria-label="Strategy discovery candidates">
            <div className="discovery-panel__header">
              <div>
                <span className="eyebrow">Strategy discovery OS</span>
                <h3>Candidate profiles found in the bundled replay set</h3>
              </div>
              <SearchCheck size={22} />
            </div>
            <div className="discovery-cards">
              {discoveryCandidates.map((candidate) => (
                <button
                  key={candidate.profileId}
                  className={`discovery-card ${candidate.stage}`}
                  type="button"
                  onClick={() => loadDiscoveryCandidate(candidate)}
                >
                  <span>{candidate.proofScore} proof score</span>
                  <strong>{candidate.agent.name}</strong>
                  <small>{candidate.dataFeed.market} · {candidate.model.name}</small>
                  <em>{candidate.headline}</em>
                  <i>{candidate.riskFlags.join(' · ')}</i>
                </button>
              ))}
            </div>
          </div>

          <div className="lab-report-hero">
            <div>
              <span className="eyebrow">Current report</span>
              <h3>{report.verdictLabel}</h3>
              <p>{report.action}</p>
            </div>
            <div className={`lab-verdict ${report.verdict}`}><ShieldCheck size={18} />{report.verdictLabel}</div>
          </div>

          <div className="lab-card-grid">
            <LabStat label="Trades" value={String(report.stats.selectedTrades)} detail={`${report.stats.sampleCoveragePct.toFixed(1)}% feed coverage`} />
            <LabStat label="Execution EV / trade" value={formatSol(report.stats.averageEvSol)} detail={formatPct(report.stats.averageEvPctOfSize)} />
            <LabStat label="Outlier-removed EV" value={formatSol(report.stats.outlierRemovedEvSol)} detail="trimmed mean" />
            <LabStat label="Largest winner removed" value={formatSol(report.stats.largestWinnerRemovedEvSol)} detail="robustness gate" />
            <LabStat label="Win rate" value={`${report.stats.winRatePct.toFixed(1)}%`} detail={`${formatSol(report.stats.totalAdjustedPnlSol)} total`} />
            <LabStat label="Max drawdown" value={formatSol(report.stats.maxDrawdownSol)} detail={`${formatSol(report.assumptions.maxDrawdownSol)} limit`} />
          </div>

          <div className="rationale-box">
            <h4>Actionable ML EV report</h4>
            <ul>{report.rationale.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          </div>

          <div className="trade-table-wrap">
            <table className="trade-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Scenario</th>
                  <th>Signal</th>
                  <th>Gross</th>
                  <th>Costs</th>
                  <th>Adjusted</th>
                </tr>
              </thead>
              <tbody>
                {report.trades.slice(0, 8).map((trade) => (
                  <tr key={trade.eventId}>
                    <td>{trade.asset}</td>
                    <td>{trade.scenario}</td>
                    <td>{trade.signalScore}</td>
                    <td>{formatSol(trade.grossPnlSol)}</td>
                    <td>{formatSol(-trade.executionCostSol)}</td>
                    <td className={trade.adjustedPnlSol >= 0 ? 'positive' : 'negative'}>{formatSol(trade.adjustedPnlSol)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.trades.length > 8 && <small>Showing first 8 of {report.trades.length} selected deterministic replay trades.</small>}
          </div>
        </div>
      </div>
    </section>
  );
}

function LabSelect({ icon, label, value, options, onChange }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: Array<{ value: string; label: string; detail: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="lab-select">
      <span>{icon}{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <small>{options.find((option) => option.value === value)?.detail}</small>
    </label>
  );
}

function LabStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="lab-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
