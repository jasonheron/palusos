import type React from 'react';
import { ArrowRight, Bot, BrainCircuit, ChevronDown, ExternalLink, Layers3, LineChart, LockKeyhole, Menu, ShieldCheck, Sparkles } from 'lucide-react';
import { AgentDashboard, PipelineTimeline } from './components/AgentDashboard';
import { AgentLab } from './components/AgentLab';
import { marketAdapters, strategyRunners } from './modules/adapters';
import './styles/app.css';
import './styles/palusos-hero.css';

const copy = {
  tagline: 'Discovery + proof for autonomous trading agents',
};

function App() {
  return (
    <main>
      <Hero />
      <SystemDiagram />
      <AgentLab />
      <AgentDashboard />
      <PipelineTimeline />
      <DeploymentPathSection />
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
          <a className="nav__cta" href="#agent-lab">Agent Lab</a>
          <button className="nav__menu" aria-label="Open menu"><Menu size={18} /></button>
        </div>
      </nav>

      <div className="hero__copy">
        <div className="badge"><Sparkles size={14} /> Frontier Hackathon Build</div>
        <h1>PalusOS</h1>
        <p className="hero__tagline">{copy.tagline}</p>
        <div className="hero__actions">
          <a className="button primary" href="#agent-lab">Run Agent Lab <ArrowRight size={18} /></a>
          <a className="button secondary" href="https://github.com/jasonheron/palusos" aria-label="PalusOS GitHub repository"><GitHubMark /> GitHub <ExternalLink size={16} /></a>
        </div>
      </div>

      <ProofStrip />

      <div className="hero-card" aria-label="PalusOS verdict preview">
        <div className="hero-card__header">
          <span className="eyebrow">Current verdict</span>
          <strong>Keep Testing</strong>
        </div>
        <p>Candidate profile discovered. Not promoted until realistic EV, execution calibration, robustness, and safety checks all pass.</p>
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
    { title: 'Discover', text: 'Search agent/feed/model combinations for candidate strategy profiles.' },
    { title: 'Replay', text: 'Run candidates against historical or adapter-supplied market conditions.' },
    { title: 'Calibrate', text: 'Apply fees, slippage, latency, route risk, and execution assumptions.' },
    { title: 'Prove', text: 'Output clear evidence for what to reject, keep testing, or graduate.' },
  ];

  return (
    <section className="system-section" id="architecture">
      <div className="section-heading compact">
        <span className="eyebrow">What is PalusOS</span>
        <h2>Autonomous trading agents are coming, but “Claude, make profit trading PumpFun” does not work yet.</h2>
        <p>PalusOS gives AI agents the framework needed to discover and test trading profiles: Discovery Lab candidate search, historical backtesting, quote-backed paper trading, execution calibration, robustness gates, and EV proof reports before capital is at risk.</p>
      </div>

      <div className="system-diagram" aria-label="PalusOS system diagram">
        <div className="diagram-input-stack">
          {inputs.map((item) => <DiagramInput key={item.title} {...item} />)}
        </div>

        <div className="diagram-core-label">PalusOS</div>

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
        <p>PalusOS is data-adapter based. This repo ships bundled demo rows for safety, but replacing them with real market feeds makes the same discovery, evaluation, and proof pipeline operate on real inputs.</p>
      </div>

      <div className="module-grid">
        <ModuleCard icon={<Layers3 />} title="Market adapters" items={[...marketAdapters.map((adapter) => `${adapter.name}: ${adapter.description}`), 'Swap bundled demo rows for real feeds in private deployments']} />
        <ModuleCard icon={<Bot />} title="Strategy discovery" items={['Discover candidate profiles across agent/feed/model combinations', ...strategyRunners.map((runner) => `${runner.name}: ${runner.input}`)]} />
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

function DeploymentPathSection() {
  const stages = [
    {
      step: '00',
      title: 'Bundled demo data',
      text: 'Install the repo, run the Vite app, and inspect the public-safe replay rows. Nothing here connects to a wallet, RPC, or private database.',
    },
    {
      step: '01',
      title: 'Private data adapter',
      text: 'Replace or extend adapter modules with your own market feed, quote, agent-decision, and outcome streams. Keep the normalized row shape stable so reports stay auditable.',
    },
    {
      step: '02',
      title: 'Paper proof',
      text: 'Run replay and quote-backed paper proof until execution-adjusted EV, drawdown, largest-winner-removed EV, and sample-density gates survive.',
    },
    {
      step: '03',
      title: 'Optional tiny canary',
      text: 'The public repo does not enable canary trading. In a private operator build, canary must stay disabled by default and require explicit limits, rollback triggers, and human approval.',
    },
    {
      step: '04',
      title: 'Scale only after gates',
      text: 'Raise caps gradually only after paper and canary evidence agree. Any drift, failed exit, quote mismatch, or drawdown breach rolls back to paper.',
    },
  ];

  return (
    <section className="deployment-section" id="deployment-path">
      <div className="section-heading compact">
        <span className="eyebrow">From demo to real deployment</span>
        <h2>A safe path from polished demo rows to private proof infrastructure.</h2>
        <p>
          PalusOS is intentionally public-safe: demo inputs in the repo, private adapters in your deployment,
          paper proof before capital, and no live transaction signing or sending code shipped here.
        </p>
      </div>

      <div className="deployment-grid" aria-label="PalusOS deployment path">
        {stages.map((stage) => (
          <article className="deployment-stage" key={stage.step}>
            <span>{stage.step}</span>
            <h3>{stage.title}</h3>
            <p>{stage.text}</p>
          </article>
        ))}
      </div>

      <div className="deployment-details">
        <article>
          <div className="module-card__icon"><Layers3 /></div>
          <h3>Data adapter contract</h3>
          <p>
            Demo feeds live in <code>src/data/agentLabData.ts</code>. Private adapters should emit normalized events with
            stable IDs, asset/market labels, timestamps, signal/liquidity scores, realized or paper outcome fields,
            and route-risk/execution-cost assumptions. Keep secrets and private archives outside the public repo.
          </p>
        </article>
        <article>
          <div className="module-card__icon"><LockKeyhole /></div>
          <h3>Canary, RPC, and wallet boundary</h3>
          <p>
            Canary is not enabled here. Use <code>.env.example</code> only as a placeholder checklist: operator-provided RPC,
            wallet reference, hard caps, explicit enable flag, and rollback thresholds. Never commit keys; never skip paper.
          </p>
        </article>
        <article>
          <div className="module-card__icon"><ShieldCheck /></div>
          <h3>Responsible scaling</h3>
          <p>
            Start with read-only replay, then paper. If a private canary is approved, use tiny capped exposure, one-way kill
            switches, quote freshness checks, and automatic rollback on drawdown, failed exit, stale feed, or EV drift.
          </p>
        </article>
      </div>
    </section>
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
      <h2>Prove before capital.</h2>
      <p>
        PalusOS gives teams a repeatable way to discover candidate strategy profiles, evaluate them against adapter-backed data, calibrate execution assumptions, and produce clear evidence without claiming live profitability.
      </p>
      <a className="button primary" href="#agent-lab">Run the Agent Lab <ArrowRight size={18} /></a>
    </section>
  );
}

export default App;
