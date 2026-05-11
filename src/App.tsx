import type React from 'react';
import { ArrowRight, Bot, BrainCircuit, Code2, Layers3, LineChart, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { AgentDashboard, PipelineTimeline } from './components/AgentDashboard';
import { marketAdapters, strategyRunners } from './modules/adapters';
import './styles/app.css';
import './styles/palusos-hero.css';

const copy = {
  tagline: 'The learning layer for agentic trading agents.',
  description:
    'PalusOS evaluates trading agents and strategies against real market data, execution costs, and safety rules so teams can decide what to reject, keep testing, or graduate carefully.',
};

function App() {
  return (
    <main>
      <Hero />
      <ProofStrip />
      <AgentDashboard />
      <PipelineTimeline />
      <ModularSection />
      <TutorialSection />
      <FinalCTA />
    </main>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <nav className="nav" aria-label="Primary navigation">
        <a href="#top" className="brand"><span aria-hidden="true" />PalusOS</a>
        <div className="nav__links">
          <a href="#demo">Demo</a>
          <a href="#architecture">Architecture</a>
          <a href="#tutorial">Tutorial</a>
        </div>
        <a className="nav__cta" href="#demo">View demo</a>
      </nav>

      <div className="hero__copy">
        <div className="badge"><Sparkles size={14} /> Frontier Hackathon Build</div>
        <h1>PalusOS</h1>
        <p className="hero__tagline">{copy.tagline}</p>
        <p>{copy.description}</p>
        <div className="hero__actions">
          <a className="button primary" href="#demo">Explore the system <ArrowRight size={18} /></a>
          <a className="button secondary" href="https://github.com" aria-label="Repository placeholder"><Code2 size={18} /> View repo</a>
        </div>
      </div>

      <div className="hero-card" aria-label="PalusOS verdict preview">
        <div className="hero-card__header">
          <span className="eyebrow">Current verdict</span>
          <strong>Keep Testing</strong>
        </div>
        <p>Promising candidate. Not promoted until execution costs, robustness, and safety checks all pass.</p>
        <div className="hero-card__rows">
          <StatusRow icon={<BrainCircuit />} label="Replay + discovery" value="Pass" />
          <StatusRow icon={<LineChart />} label="Execution-adjusted EV" value="Watch" />
          <StatusRow icon={<ShieldCheck />} label="Safety gate" value="Locked" />
        </div>
      </div>
    </section>
  );
}

function StatusRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="status-row"><span>{icon}</span><p>{label}</p><b>{value}</b></div>;
}

function ProofStrip() {
  return (
    <section className="proof-strip" aria-label="Product proof points">
      <article><b>Replay</b><span>Test against historical market conditions</span></article>
      <article><b>Paper</b><span>Record every decision before real capital</span></article>
      <article><b>Calibrate</b><span>Apply execution cost and slippage assumptions</span></article>
      <article><b>Report</b><span>Share clear decisions and evidence</span></article>
    </section>
  );
}

function ModularSection() {
  return (
    <section className="modular-section">
      <div className="section-heading compact">
        <span className="eyebrow">Composable by design</span>
        <h2>Plug in your market feed, strategy runner, gates, and reports.</h2>
        <p>PalusOS is market-agnostic: connect the data source you trust, run the agent you want to evaluate, and get a decision backed by evidence.</p>
      </div>

      <div className="module-grid">
        <ModuleCard icon={<Layers3 />} title="Market adapters" items={marketAdapters.map((adapter) => `${adapter.name}: ${adapter.description}`)} />
        <ModuleCard icon={<Bot />} title="Strategy runners" items={strategyRunners.map((runner) => `${runner.name}: ${runner.input}`)} />
        <ModuleCard icon={<ShieldCheck />} title="Promotion gates" items={['Reject weak strategies before real capital', 'Require robust EV after outlier removal', 'Graduate only under explicit limits and rollback rules']} />
        <ModuleCard icon={<LockKeyhole />} title="Clean product package" items={['No private keys or .env files', 'Demo data only', 'Clear scope: evaluation and reporting infrastructure']} />
      </div>
    </section>
  );
}

function ModuleCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <article className="module-card">
      <div className="module-card__icon">{icon}</div>
      <h3>{title}</h3>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </article>
  );
}

function TutorialSection() {
  return (
    <section className="tutorial-section" id="tutorial">
      <div className="section-heading compact">
        <span className="eyebrow">Tutorial</span>
        <h2>Run your first agent evaluation in three steps.</h2>
      </div>
      <div className="tutorial-card">
        <code>npm install</code>
        <code>npm run dev</code>
        <code>Open the demo, choose an agent, inspect the verdict.</code>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="final-cta">
      <span className="eyebrow">Why now?</span>
      <h2>Trading agents need proof before they need bigger budgets.</h2>
      <p>
        Markets move too quickly for hand-waved backtests. PalusOS gives teams a repeatable way to evaluate agents against real data, realistic execution assumptions, and clear safety gates.
      </p>
      <a className="button primary" href="#demo">Review the demo verdict <ArrowRight size={18} /></a>
    </section>
  );
}

export default App;
