import type React from 'react';
import { ArrowRight, Bot, BrainCircuit, ChevronDown, ExternalLink, Layers3, LineChart, LockKeyhole, Menu, ShieldCheck, Sparkles } from 'lucide-react';
import { AgentDashboard, PipelineTimeline } from './components/AgentDashboard';
import { marketAdapters, strategyRunners } from './modules/adapters';
import './styles/app.css';
import './styles/palusos-hero.css';

const copy = {
  tagline: 'The learning layer for agentic trading agents',
};

function App() {
  return (
    <main>
      <Hero />
      <SystemDiagram />
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
        <div className="nav__spacer" />
        <div className="nav__actions">
          <a className="nav__cta" href="#demo">Demo</a>
          <button className="nav__menu" aria-label="Open menu"><Menu size={18} /></button>
        </div>
      </nav>

      <div className="hero__copy">
        <div className="badge"><Sparkles size={14} /> Frontier Hackathon Build</div>
        <h1>PalusOS</h1>
        <p className="hero__tagline">{copy.tagline}</p>
        <div className="hero__actions">
          <a className="button primary" href="#demo">Explore <ArrowRight size={18} /></a>
          <a className="button secondary" href="https://github.com/jasonheron/palusos" aria-label="PalusOS GitHub repository"><GitHubMark /> GitHub <ExternalLink size={16} /></a>
        </div>
      </div>

      <ProofStrip />

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

function GitHubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.02c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18A10.9 10.9 0 0 1 12 6.17c.98 0 1.96.13 2.88.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.83 1.19 3.08 0 4.42-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.04c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function ProofStrip() {
  return (
    <section className="proof-strip" aria-label="Product proof points">
      <article className="proof-module">
        <div className="proof-input"><b>PalusOS</b><span>Model Inputs</span></div>
        <div className="proof-stack" aria-label="Module input types"><span>Agent</span><span>Data</span><span>ML Model</span></div>
      </article>
      <article><b>REPLAY</b><span>Test against historical market conditions</span></article>
      <article><b>PAPER</b><span>Record every decision before real capital</span></article>
      <article><b>CALIBRATE</b><span>Apply execution cost and slippage assumptions</span></article>
      <article><b>REPORT</b><span>Share clear decisions and evidence</span></article>
    </section>
  );
}


function SystemDiagram() {
  const inputs = [
    { title: 'Agent', options: ['Claude 4.7', 'GPT-5.5', 'Gemini Quant', 'Kimi Trader'] },
    { title: 'Data Feed', options: ['PumpFun live collector', 'BTC/USD spot', 'SOL perps', 'DEX pool flow'] },
    { title: 'ML Model', options: ['PalusOS Custom', 'XGBoost Bundle', 'LSTM Regime Model', 'PalusOS Memes'] },
  ];
  const loop = [
    { title: 'Replay', text: 'Run the agent against historical market conditions.' },
    { title: 'Paper', text: 'Record every decision before capital is at risk.' },
    { title: 'Calibrate', text: 'Feed outcomes back into the ML loop with execution costs.' },
    { title: 'Report', text: 'Output clear evidence for what to reject, keep testing, or graduate.' },
  ];

  return (
    <section className="system-section" id="architecture">
      <div className="section-heading compact">
        <span className="eyebrow">What is PalusOS</span>
        <h2>Autonomous trading agents are coming, but they need more than a wallet and a prompt.</h2>
        <p>PalusOS is the learning layer for AI trading agents: a full ML lab, backtesting engine, quote-backed paper trader, and live-calibration system that helps agents discover strategies, test realistic EV, and build trading profiles before risking capital.</p>
      </div>

      <div className="system-diagram" aria-label="PalusOS system diagram">
        <div className="diagram-input-stack">
          <div className="diagram-core-label">PalusOS</div>
          {inputs.map((item) => <DiagramInput key={item.title} {...item} />)}
        </div>

        <div className="diagram-loop-flow">
          {loop.map((item, index) => (
            <article key={item.title} className="loop-step">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <b>{item.title}</b>
              <p>{item.text}</p>
            </article>
          ))}
          <div className="loop-return" aria-hidden="true">ML LOOP ↺</div>
        </div>
      </div>
    </section>
  );
}

function DiagramInput({ title, options }: { title: string; options: string[] }) {
  return (
    <article className="diagram-input">
      <span>{title}</span>
      <div className="diagram-choice" aria-label={`${title} selected option`}>
        {options.map((option, index) => <b key={option} style={{ '--option-index': index } as React.CSSProperties}>{option}<ChevronDown size={16} /></b>)}
      </div>
    </article>
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
      <h2>Actionable ML EV reports, not a blackbox.</h2>
      <p>
        In the words of your favourite LLM: "no more hand-waving, just real results". PalusOS gives teams a repeatable way to evaluate agents against real data, realistic execution assumptions, and clear safety gates.
      </p>
      <a className="button primary" href="#demo">Review the demo verdict <ArrowRight size={18} /></a>
    </section>
  );
}

export default App;
