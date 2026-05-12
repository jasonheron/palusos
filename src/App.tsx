import type React from 'react';
import { ArrowRight, Bot, BrainCircuit, ChevronDown, DatabaseZap, ExternalLink, Layers3, LineChart, LockKeyhole, Menu, ShieldCheck, Sparkles } from 'lucide-react';
import { AgentDashboard, PipelineTimeline } from './components/AgentDashboard';
import { AgentLab } from './components/AgentLab';
import { LivePaperDemo } from './components/LivePaperDemo';
import { marketAdapters, strategyRunners } from './modules/adapters';
import './styles/app.css';
import './styles/palusos-hero.css';

const copy = {
  tagline: 'Discovery + proof for autonomous trading agents',
};

function App() {
  const isDemoRoute = typeof window !== 'undefined' && window.location.pathname === '/demo';

  if (isDemoRoute) {
    return <DemoPage />;
  }

  return (
    <main>
      <Hero />
      <SystemDiagram />
      <AgentIntegrationSection />
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

function DemoPage() {
  return (
    <main className="demo-terminal-page">
      <LivePaperDemo />
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
          <a className="nav__cta" href="/demo">Live Demo</a>
          <button className="nav__menu" aria-label="Open menu"><Menu size={18} /></button>
        </div>
      </nav>

      <div className="hero__copy">
        <div className="badge"><Sparkles size={14} /> Frontier Hackathon Build</div>
        <h1>PalusOS</h1>
        <p className="hero__tagline">{copy.tagline}</p>
        <div className="hero__actions">
          <a className="button primary" href="/demo">Open Live Demo <ArrowRight size={18} /></a>
          <a className="button secondary" href="#agent-lab">Run Agent Lab</a>
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
          <StatusRow icon={<BrainCircuit />} label="Label foundry" value="Active" />
          <StatusRow icon={<LineChart />} label="Realistic EV" value="Watch" />
          <StatusRow icon={<ShieldCheck />} label="Proof gate" value="Locked" />
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
        <div className="proof-input proof-input--quote"><span>THE PALUS WAS THE GLADIATOR’S SILENT TRAINING GROUND — A WOODEN POST WHERE DISCIPLINE, MUSCLE MEMORY, AND SURVIVAL WERE FORGED LONG BEFORE THE ARENA EVER SAW THEM.</span></div>
        <div className="proof-stack proof-stage" aria-label="Discovery stage"><b>DISCOVERY ENGINE</b><span>Search agent, feed, and model space</span></div>
      </article>
      <article><b>LABEL FOUNDRY</b><span>Design data labels worth predicting</span></article>
      <article><b>ML LAB</b><span>Find models and strategy profiles</span></article>
      <article><b>PROOF ENGINE</b><span>Require trusted quotes and outcomes</span></article>
      <article><b>PAPER → CANARY</b><span>Graduate only after realistic EV</span></article>
      <article><b>SCALE</b><span>Autonomous trading after proof</span></article>
    </section>
  );
}


function SystemDiagram() {
  const inputs = [
    { title: 'Dataset Adapter', options: ['PumpFun lifecycle DB', 'Quote archive', 'Agent decisions', 'DEX flow'] },
    { title: 'Label Candidate', options: ['First 2x continuation', 'Migration follow-through', 'Buyer breadth accel', 'Executable EV'] },
    { title: 'ML / Profile', options: ['Label Foundry', 'ML Lab', 'Strategy Profile', 'Proof Pack'] },
  ];
  const loop = [
    { title: 'Data Truth', text: 'Audit lifecycle coverage, censoring, freshness, labels, and route observability.' },
    { title: 'Label Foundry', text: 'Design trade-realistic labels before deciding what any model should predict.' },
    { title: 'ML Lab', text: 'Search models and strategy profiles against supported labels and full data.' },
    { title: 'Proof Engine', text: 'Accept only quote-backed intents, outcomes, costs, failed exits, and realistic EV.' },
  ];

  return (
    <section className="system-section" id="architecture">
      <div className="section-heading compact">
        <span className="eyebrow">What is PalusOS</span>
        <h2>Autonomous trading agents need a research system before they need a wallet.</h2>
        <p>PalusOS is a label-first discovery and proof stack: it audits real market data, designs trade-realistic labels, searches the ML lab for strategy profiles, then proves candidates with quote-backed paper outcomes, realistic EV, and gated canary readiness before capital is at risk.</p>
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

function AgentIntegrationSection() {
  const tools = [
    'palusos.discover_labels',
    'palusos.generate_strategy_profile',
    'palusos.collect_quote_proof',
    'palusos.evaluate_gates',
    'palusos.report_next_action',
  ];
  const flow = [
    { title: 'OpenClaw agent', text: 'Receives a goal and chooses PalusOS actions as tools.' },
    { title: 'PalusOS actions', text: 'Run discovery, label design, profile generation, and read-only proof collection.' },
    { title: 'Artifacts + gates', text: 'Write evidence/state, then decide reject, keep testing, paper, or canary eligible.' },
    { title: 'Read-only console', text: 'Visualizes the agent loop as a black-box recorder, not a controller.' },
  ];

  return (
    <section className="agent-integration-section" id="agent-integration">
      <div className="section-heading compact">
        <span className="eyebrow">Agent integration</span>
        <h2>Agents operate PalusOS through tools. The UI records the proof trail.</h2>
        <p>
          PalusOS is designed for OpenClaw-style agents and autonomous research workers. An agent calls the PalusOS tool surface, PalusOS writes auditable artifacts and gate decisions, and the console shows what happened across Discovery, Label Foundry, ML Lab, Proof Engine, Paper / Canary, and Scale.
        </p>
      </div>

      <div className="agent-integration-grid">
        <article className="agent-command-card">
          <div className="module-card__icon"><Bot /></div>
          <span className="eyebrow">Example OpenClaw prompt</span>
          <p>
            “Use PalusOS to find a candidate trading label, build a strategy profile, collect read-only quote proof, and tell me whether it can advance to paper or is blocked.”
          </p>
        </article>

        <article className="agent-tools-card">
          <span className="eyebrow">Agent-facing tool surface</span>
          <div className="tool-list">
            {tools.map((tool) => <code key={tool}>{tool}</code>)}
          </div>
        </article>
      </div>

      <div className="agent-flow" aria-label="OpenClaw to PalusOS integration flow">
        {flow.map((item, index) => (
          <article className="agent-flow-step" key={item.title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ModularSection() {
  return (
    <section className="modular-section">
      <div className="section-heading compact">
        <span className="eyebrow">Composable by design</span>
        <h2>Plug in data truth, label design, ML search, proof gates, and reports.</h2>
        <p>PalusOS is adapter based. This repo ships safe demo rows, but the real architecture is built for private lifecycle data, label candidates, model searches, strategy profiles, proof packs, and staged paper/canary promotion.</p>
      </div>

      <div className="module-grid">
        <ModuleCard icon={<Layers3 />} title="Data truth layer" items={[...marketAdapters.map((adapter) => `${adapter.name}: ${adapter.description}`), 'Audit coverage, freshness, censoring, and route observability before modelling']} />
        <ModuleCard icon={<Bot />} title="Label Foundry + ML Lab" items={['Generate labels as auditable artifacts, not hardcoded guesses', 'Search models, profiles, near-misses, and failure modes across full data']} />
        <ModuleCard icon={<ShieldCheck />} title="Proof Engine" items={['Require pre-outcome intent, trusted entry/exit quotes, failed-exit accounting, and realistic EV', 'Graduate to paper/canary only under explicit limits']} />
        <ModuleCard icon={<LockKeyhole />} title="Public-safe package" items={['No private keys or .env files', 'Demo data included', 'Private adapters and wallets stay outside the repo']} />
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
      title: 'Public demo shell',
      text: 'Install the repo, run the Vite app, and inspect the safe UI/data contract. Nothing here ships wallets, private databases, or transaction signing.',
    },
    {
      step: '01',
      title: 'Data Truth layer',
      text: 'Connect private lifecycle data, quote archives, agent decisions, and outcome streams. Audit freshness, coverage, censoring, and route observability before ML work counts.',
    },
    {
      step: '02',
      title: 'Label Foundry + ML Lab',
      text: 'Design labels worth predicting, evaluate supported label families, train/search models, and emit complete strategy profiles with entry, exit, size, and route assumptions.',
    },
    {
      step: '03',
      title: 'Proof Engine → paper',
      text: 'Record pre-outcome intents, trusted entry/exit quotes, failed quote/exit rows, fees, latency, slippage, and realistic EV before any capital path.',
    },
    {
      step: '04',
      title: 'Canary → scale',
      text: 'Canary is private, tiny, and disabled by default. Scale only after proof, paper, and canary evidence agree; rollback on drift, failed exits, or EV decay.',
    },
  ];

  return (
    <section className="deployment-section" id="deployment-path">
      <div className="section-heading compact">
        <span className="eyebrow">From demo to real deployment</span>
        <h2>A safe path from demo shell to label-first autonomous trading research.</h2>
        <p>
          PalusOS is intentionally public-safe: demo inputs in the repo, private adapters in your deployment,
          label-first discovery before modelling, proof before capital, and no live transaction signing or sending code shipped here.
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
            Demo feeds live in <code>src/data/agentLabData.ts</code>. Private adapters should emit auditable lifecycle,
            quote, decision, and outcome records with stable IDs, timestamps, provenance, route observability,
            and explicit censoring/unknown handling. Keep secrets and private archives outside the public repo.
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
            Start with data truth, label discovery, ML search, and quote-backed proof. If a private canary is approved,
            use tiny capped exposure, one-way kill switches, quote freshness checks, and automatic rollback on failed exits,
            stale feeds, drawdown, or EV drift.
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
        PalusOS gives teams a repeatable way to turn raw market data into label candidates, ML-tested strategy profiles, quote-backed proof packs, and staged paper/canary decisions without pretending a model deserves capital before the evidence exists.
      </p>
      <a className="button primary" href="#agent-lab">Run the Agent Lab <ArrowRight size={18} /></a>
    </section>
  );
}

export default App;
