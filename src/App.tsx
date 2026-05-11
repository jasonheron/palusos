import type React from 'react';
import { ArrowRight, Bot, BrainCircuit, Code2, Layers3, LineChart, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { AgentDashboard, PipelineTimeline } from './components/AgentDashboard';
import { marketAdapters, strategyRunners } from './modules/adapters';
import './styles/app.css';

const copy = {
  description:
    'TrenchLab is the learning and evaluation layer for autonomous Solana trading agents. It turns noisy on-chain market data into strategy candidates, tests them in replay and paper mode, calibrates results against executable quote economics, and only graduates agents to bounded canaries when robust safety gates pass.',
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
    <section className="hero">
      <nav className="nav">
        <a href="#top" className="brand"><span>▰</span> TrenchLab</a>
        <div>
          <a href="#demo">Demo</a>
          <a href="#architecture">Architecture</a>
          <a href="#tutorial">Tutorial</a>
        </div>
      </nav>

      <div className="hero__grid" id="top">
        <div className="hero__copy">
          <div className="badge"><Sparkles size={16} /> Frontier Hackathon Submission</div>
          <h1>The learning layer for autonomous Solana trading agents.</h1>
          <p>{copy.description}</p>
          <div className="hero__actions">
            <a className="button primary" href="#demo">See the evaluation flow <ArrowRight size={18} /></a>
            <a className="button secondary" href="https://github.com" aria-label="Repository placeholder"><Code2 size={18} /> Public-safe repo</a>
          </div>
        </div>

        <div className="hero-card" aria-label="TrenchLab verdict preview">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <span className="eyebrow">Current verdict</span>
          <h2>Keep Paper</h2>
          <p>Promising candidate. Not live until executable EV, robustness, and runner safety all pass.</p>
          <div className="hero-card__rows">
            <StatusRow icon={<BrainCircuit />} label="Replay + ML discovery" value="Pass" />
            <StatusRow icon={<LineChart />} label="Quote-adjusted EV" value="Watch" />
            <StatusRow icon={<ShieldCheck />} label="Canary gate" value="Locked" />
          </div>
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
      <article><b>Replay</b><span>Historical market lifecycle tests</span></article>
      <article><b>Paper</b><span>Agent decisions with full audit trails</span></article>
      <article><b>Calibrate</b><span>Executable quote/slippage reality checks</span></article>
      <article><b>Canary</b><span>Tiny guarded dev-wallet graduation</span></article>
    </section>
  );
}

function ModularSection() {
  return (
    <section className="modular-section">
      <div className="section-heading compact">
        <span className="eyebrow">Composable by design</span>
        <h2>Separate adapters, runners, evaluation, gates, and reports.</h2>
        <p>For the hackathon, PumpFun is the proving ground. For the product, any Solana agent can plug into the same truth layer.</p>
      </div>

      <div className="module-grid">
        <ModuleCard icon={<Layers3 />} title="Market adapters" items={marketAdapters.map((adapter) => `${adapter.name}: ${adapter.description}`)} />
        <ModuleCard icon={<Bot />} title="Strategy runners" items={strategyRunners.map((runner) => `${runner.name}: ${runner.input}`)} />
        <ModuleCard icon={<ShieldCheck />} title="Promotion gates" items={['Kill fantasy PnL before live funds', 'Require robust EV after outlier removal', 'Only graduate to tiny canaries under explicit caps']} />
        <ModuleCard icon={<LockKeyhole />} title="Public-safe packaging" items={['No private keys or .env files', 'Demo-safe artifacts only', 'Clear claims: evaluation infra, not money printer']} />
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
        <code>Open the demo, choose an agent, inspect the gate verdict.</code>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="final-cta">
      <span className="eyebrow">Why now?</span>
      <h2>Agents are becoming traders. They need flight recorders before they need bigger wallets.</h2>
      <p>
        Solana has the speed and liquidity to make autonomous trading agents inevitable. TrenchLab makes them measurable before they become dangerous.
      </p>
      <a className="button primary" href="#demo">Review the demo verdict <ArrowRight size={18} /></a>
    </section>
  );
}

export default App;
