import type { DemoAgent, GateStatus } from '../data/demoAgents';

const statusScore: Record<GateStatus, number> = {
  pass: 1,
  watch: 0.5,
  fail: 0,
};

export interface EvaluationSummary {
  agentId: string;
  verdict: DemoAgent['verdict'];
  gateScore: number;
  passed: number;
  watching: number;
  failed: number;
  headline: string;
}

export function summarizeEvaluation(agent: DemoAgent): EvaluationSummary {
  const passed = agent.gates.filter((gate) => gate.result === 'pass').length;
  const watching = agent.gates.filter((gate) => gate.result === 'watch').length;
  const failed = agent.gates.filter((gate) => gate.result === 'fail').length;
  const gateScore = Math.round(
    (agent.gates.reduce((sum, gate) => sum + statusScore[gate.result], 0) / agent.gates.length) * 100,
  );

  return {
    agentId: agent.id,
    verdict: agent.verdict,
    gateScore,
    passed,
    watching,
    failed,
    headline: buildHeadline(agent.verdict),
  };
}

function buildHeadline(verdict: DemoAgent['verdict']): string {
  switch (verdict) {
    case 'Canary Eligible':
      return 'Ready for a tiny, bounded dev-wallet canary after runner checks.';
    case 'Keep Paper':
      return 'Promising, but proof density or safety checks are not complete.';
    case 'Kill':
      return 'Rejected before live funds because executable economics failed.';
  }
}
