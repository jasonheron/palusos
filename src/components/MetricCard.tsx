import type { AgentMetric, GateStatus } from '../data/demoAgents';

const statusLabels: Record<GateStatus, string> = {
  pass: 'Pass',
  watch: 'Watch',
  fail: 'Fail',
};

export function MetricCard({ metric }: { metric: AgentMetric }) {
  return (
    <article className={`metric-card ${metric.status}`}>
      <div className="metric-card__topline">
        <span>{metric.label}</span>
        <b>{statusLabels[metric.status]}</b>
      </div>
      <strong>{metric.value}</strong>
      {metric.delta ? <small>{metric.delta}</small> : null}
    </article>
  );
}
