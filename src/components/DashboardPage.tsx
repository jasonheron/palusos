import { ArrowRight, BarChart3, Beaker, CheckCircle2, CircleDot, DatabaseZap, FlaskConical, Gauge, LockKeyhole, Radar, Scale, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import '../styles/dashboard.css';

const pipelineStages = [
  {
    title: 'Discovery Engine',
    status: 'Scanning',
    detail: 'Lifecycle DB, quote archive, route telemetry, and agent decisions are being audited for coverage and freshness.',
    metric: '24.8M',
    label: 'rows indexed',
    icon: Radar,
  },
  {
    title: 'Label Foundry',
    status: 'Active',
    detail: 'Candidate labels are scored for observability, censoring risk, and whether they map to executable trade decisions.',
    metric: '18',
    label: 'labels in test',
    icon: FlaskConical,
  },
  {
    title: 'ML Lab',
    status: 'Searching',
    detail: 'Model/profile sweeps compare lift, calibration, near-misses, failed exits, and regime stability before promotion.',
    metric: '142',
    label: 'profiles scored',
    icon: Beaker,
  },
  {
    title: 'Proof Engine',
    status: 'Gating',
    detail: 'Pre-outcome intents, trusted quotes, failed route attempts, fees, slippage, and realistic EV are required.',
    metric: '6/8',
    label: 'checks passing',
    icon: ShieldCheck,
  },
  {
    title: 'Paper → Canary',
    status: 'Paper only',
    detail: 'Candidates run in read-only paper mode until proof, paper outcomes, and operator limits agree.',
    metric: '0.74',
    label: 'paper EV ratio',
    icon: Gauge,
  },
  {
    title: 'Scale',
    status: 'Locked',
    detail: 'Scale stays unavailable until canary caps, rollback thresholds, and proof-pack evidence clear the release gate.',
    metric: 'Off',
    label: 'capital path',
    icon: Scale,
  },
];

const systemStats = [
  { label: 'Data truth score', value: '91%', tone: 'good', note: 'freshness + coverage' },
  { label: 'Supported label families', value: '7', tone: 'neutral', note: '4 ready, 3 exploratory' },
  { label: 'Best calibrated profile', value: '0.68', tone: 'good', note: 'Brier improvement' },
  { label: 'Promotion verdict', value: 'Keep Testing', tone: 'watch', note: 'paper evidence building' },
];

const proofRows = [
  ['Intent recorded before outcome', 'Pass'],
  ['Trusted entry and exit quotes', 'Pass'],
  ['Failed-exit accounting', 'Pass'],
  ['Realistic fees + slippage', 'Pass'],
  ['Regime stability', 'Watch'],
  ['Canary limits configured', 'Locked'],
];

const eventRows = [
  { time: '02:07', source: 'Discovery Engine', text: 'New buyer-breadth acceleration cohort queued for label validation.' },
  { time: '02:04', source: 'Proof Engine', text: 'Profile PF-SHARD-12 retained: quote-backed EV positive, drift still under watch.' },
  { time: '01:58', source: 'ML Lab', text: 'Rejected 11 profiles with high lift but weak exit calibration.' },
  { time: '01:52', source: 'Label Foundry', text: 'Migration follow-through label moved from exploratory to supported.' },
];

const chartBars = [42, 55, 49, 66, 58, 74, 69, 81, 76, 88, 84, 92];

export function DashboardPage() {
  return (
    <main className="ops-dashboard-page">
      <header className="ops-topbar">
        <a href="/" className="ops-brand" aria-label="PalusOS home"><span />PalusOS</a>
        <nav className="ops-nav" aria-label="Dashboard navigation">
          <a href="/demo">Paper demo</a>
          <a href="/#architecture">Architecture</a>
          <a href="/">Home</a>
        </nav>
      </header>

      <section className="ops-hero" aria-label="PalusOS dashboard overview">
        <div className="ops-hero__copy">
          <div className="ops-badge"><Sparkles size={14} /> Connected demo dashboard</div>
          <h1>The dashboard half of the PalusOS demo.</h1>
          <p>
            Use this view to understand the operating modules behind the public paper terminal: discovery, label design, model search, proof gates, paper readiness, canary locks, and scale controls.
          </p>
          <div className="ops-hero__actions">
            <a className="button primary" href="/demo">Open connected paper demo <ArrowRight size={18} /></a>
            <span className="ops-pill"><LockKeyhole size={14} /> Simulation state / no wallet path</span>
          </div>
        </div>

        <div className="ops-command-card" aria-label="System status summary">
          <div className="ops-command-card__header">
            <span>VERDICT</span>
            <strong>KEEP TESTING</strong>
          </div>
          <p>Discovery and paper evidence are visible for the demo. Canary and scale remain locked until proof-pack requirements clear.</p>
          <div className="ops-mini-grid">
            <b><DatabaseZap size={16} /> Data fresh</b>
            <b><CheckCircle2 size={16} /> Paper enabled</b>
            <b><LockKeyhole size={16} /> Scale locked</b>
          </div>
        </div>
      </section>

      <section className="ops-stats-grid" aria-label="System metrics">
        {systemStats.map((stat) => (
          <article className={`ops-stat ops-stat--${stat.tone}`} key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.note}</small>
          </article>
        ))}
      </section>

      <section className="ops-layout" aria-label="Operational dashboard">
        <div className="ops-main-panel">
          <div className="ops-panel-heading">
            <div>
              <span className="eyebrow">Pipeline state</span>
              <h2>Discovery → label → model → proof → paper → scale.</h2>
            </div>
            <span className="ops-live-dot"><CircleDot size={14} /> deterministic public snapshot</span>
          </div>

          <div className="ops-stage-grid">
            {pipelineStages.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <article className="ops-stage-card" key={stage.title}>
                  <div className="ops-stage-card__top">
                    <Icon size={22} />
                    <span>{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <h3>{stage.title}</h3>
                  <b>{stage.status}</b>
                  <p>{stage.detail}</p>
                  <div className="ops-stage-metric"><strong>{stage.metric}</strong><small>{stage.label}</small></div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="ops-side-panel" aria-label="Proof engine status">
          <div className="ops-proof-header">
            <ShieldCheck size={22} />
            <div><span className="eyebrow">Proof Engine</span><h2>Gate checklist</h2></div>
          </div>
          <div className="ops-proof-list">
            {proofRows.map(([label, status]) => <ProofRow key={label} label={label} status={status} />)}
          </div>
        </aside>
      </section>

      <section className="ops-bottom-grid" aria-label="Evidence and events">
        <article className="ops-chart-panel">
          <div className="ops-panel-heading compact">
            <div><span className="eyebrow">Paper evidence</span><h2>Quote-backed profile curve</h2></div>
            <BarChart3 size={22} />
          </div>
          <div className="ops-bar-chart" aria-hidden="true">
            {chartBars.map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
          </div>
          <div className="ops-chart-footer">
            <span>12 evaluation windows</span>
            <b><TrendingUp size={15} /> positive but not promoted</b>
          </div>
        </article>

        <article className="ops-event-panel">
          <div className="ops-panel-heading compact">
            <div><span className="eyebrow">System log</span><h2>Latest evidence events</h2></div>
          </div>
          <div className="ops-event-list">
            {eventRows.map((event) => (
              <div className="ops-event-row" key={`${event.time}-${event.source}`}>
                <time>{event.time}</time>
                <div><b>{event.source}</b><p>{event.text}</p></div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

function ProofRow({ label, status }: { label: string; status: string }) {
  const className = status === 'Pass' ? 'pass' : status === 'Watch' ? 'watch' : 'locked';
  return (
    <div className={`ops-proof-row ops-proof-row--${className}`}>
      <span>{label}</span>
      <b>{status}</b>
    </div>
  );
}
