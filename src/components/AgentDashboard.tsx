import { useMemo, useState } from 'react';
import { Activity, ArrowRight, CheckCircle2, FlaskConical, ShieldAlert, Zap } from 'lucide-react';
import { demoAgents, type DemoAgent, type GateStatus } from '../data/demoAgents';
import { summarizeEvaluation } from '../modules/evaluationEngine';
import { MetricCard } from './MetricCard';

const statusIcon: Record<GateStatus, string> = {
  pass: '✓',
  watch: '◐',
  fail: '×',
};

export function AgentDashboard() {
  const [selectedId, setSelectedId] = useState(demoAgents[0].id);
  const agent = demoAgents.find((item) => item.id === selectedId) ?? demoAgents[0];
  const summary = useMemo(() => summarizeEvaluation(agent), [agent]);

  return (
    <section className="dashboard-section" id="demo">
      <div className="section-heading">
        <span className="eyebrow">Actionable ML EV reports, not a blackbox</span>
        <h2>Choose an agent. PalusOS shows whether the evidence is strong enough.</h2>
        <p>
          Following the same path as industrial quants: ingest market data, run a candidate,
          adjust paper results for execution assumptions, and produce a decision report.
        </p>
      </div>

      <div className="dashboard-grid">
        <aside className="agent-list" aria-label="Candidate agents">
          {demoAgents.map((candidate) => (
            <button
              key={candidate.id}
              className={candidate.id === selectedId ? 'agent-tab active' : 'agent-tab'}
              onClick={() => setSelectedId(candidate.id)}
            >
              <span>{candidate.name}</span>
              <small>{candidate.verdict}</small>
            </button>
          ))}
        </aside>

        <div className="agent-panel">
          <div className="agent-panel__header">
            <div>
              <span className="eyebrow">{agent.market}</span>
              <h3>{agent.name}</h3>
              <p>{agent.subtitle}</p>
            </div>
            <VerdictBadge agent={agent} />
          </div>

          <div className="confidence-strip">
            <span>Evidence confidence</span>
            <div className="confidence-track"><i style={{ width: `${agent.confidence}%` }} /></div>
            <b>{agent.confidence}%</b>
          </div>

          <div className="metrics-grid">
            {agent.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
          </div>

          <div className="gate-grid">
            <div className="truth-report">
              <div className="truth-report__icon"><ShieldAlert size={24} /></div>
              <div>
                <span className="eyebrow">Decision report</span>
                <h4>{summary.headline}</h4>
                <p>{agent.report}</p>
                <div className="mini-stats">
                  <span>{summary.passed} pass</span>
                  <span>{summary.watching} watch</span>
                  <span>{summary.failed} fail</span>
                  <span>{summary.gateScore}% gate score</span>
                </div>
              </div>
            </div>

            <div className="gates-list">
              {agent.gates.map((gate) => (
                <article key={gate.name} className={`gate ${gate.result}`}>
                  <b>{statusIcon[gate.result]}</b>
                  <div>
                    <h5>{gate.name}</h5>
                    <p>{gate.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VerdictBadge({ agent }: { agent: DemoAgent }) {
  const icon = agent.verdict === 'Canary Eligible' ? <CheckCircle2 size={18} /> : agent.verdict === 'Keep Paper' ? <FlaskConical size={18} /> : <Zap size={18} />;
  return <div className={`verdict ${agent.verdict.toLowerCase().replaceAll(' ', '-')}`}>{icon}{agent.verdict}<ArrowRight size={16} /></div>;
}

export function PipelineTimeline() {
  const [agent] = useState(demoAgents[0]);
  return (
    <section className="timeline-section" id="architecture">
      <div className="section-heading compact">
        <span className="eyebrow">Modular architecture</span>
        <h2>Swap in the markets, runners, and agents your team already uses.</h2>
      </div>
      <div className="timeline">
        {agent.timeline.map((step, index) => (
          <article key={step.title} className={`timeline-card ${step.status}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <Activity size={18} />
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
