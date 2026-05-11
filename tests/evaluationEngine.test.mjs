import assert from 'node:assert/strict';
import test from 'node:test';

import { agentDefinitions, dataFeedDefinitions, modelDefinitions } from '../src/data/agentLabData.ts';
import {
  calculateMaxDrawdown,
  defaultExecutionAssumptions,
  discoverStrategyProfiles,
  evaluateAgentLab,
  evaluateTrade,
  largestWinnerRemovedMean,
  outlierRemovedMean,
} from '../src/modules/evaluationEngine.ts';

const statusScore = { pass: 1, watch: 0.5, fail: 0 };

function summarize(gates) {
  return Math.round((gates.reduce((sum, gate) => sum + statusScore[gate], 0) / gates.length) * 100);
}

test('gate scoring rewards pass, watch, and fail states deterministically', () => {
  assert.equal(summarize(['pass', 'pass', 'watch', 'fail']), 63);
  assert.equal(summarize(['pass', 'pass', 'pass', 'pass']), 100);
  assert.equal(summarize(['fail', 'fail', 'fail', 'fail']), 0);
});

test('evaluateTrade subtracts fees, slippage, latency, and route risk from gross PnL', () => {
  const event = {
    id: 'unit-1',
    asset: 'UNIT',
    scenario: 'unit replay',
    signalScore: 90,
    liquidityScore: 90,
    realizedReturnPct: 0.1,
    adverseDrawdownPct: 0.02,
    routeRiskBps: 10,
  };
  const agent = { ...agentDefinitions[0], edgeAdjustmentPct: 0, latencyPenaltyMultiplier: 1 };
  const model = { ...modelDefinitions[0], returnAdjustmentPct: 0, routeCostReductionBps: 0 };
  const assumptions = {
    ...defaultExecutionAssumptions,
    tradeSizeSol: 1,
    feeBps: 10,
    slippageBps: 20,
    latencyMs: 100,
    latencyBpsPer100Ms: 5,
  };

  const trade = evaluateTrade(event, agent, model, assumptions);

  assert.equal(trade.grossPnlSol, 0.1);
  assert.equal(trade.executionCostSol, 0.0045);
  assert.equal(trade.adjustedPnlSol, 0.0955);
});

test('robust EV helpers remove outliers and largest winner deterministically', () => {
  assert.equal(outlierRemovedMean([1, 2, 100, -50, 3, 4, 5, 6, 7, 8], 0.1), 4.5);
  assert.equal(largestWinnerRemovedMean([1, 2, 100]), 1.5);
  assert.equal(calculateMaxDrawdown([1, 3, 2, -1, 4, 3]), 4);
});

test('default launch-recovery lab report produces a promote verdict with positive robust EV', () => {
  const report = evaluateAgentLab({
    agent: agentDefinitions[0],
    dataFeed: dataFeedDefinitions[0],
    model: modelDefinitions[0],
    assumptions: defaultExecutionAssumptions,
  });

  assert.equal(report.verdict, 'promote');
  assert.equal(report.stats.selectedTrades, 20);
  assert.equal(Number(report.stats.averageEvSol.toFixed(9)), 0.0064025);
  assert.equal(Number(report.stats.outlierRemovedEvSol.toFixed(9)), 0.005531875);
  assert.equal(Number(report.stats.largestWinnerRemovedEvSol.toFixed(9)), 0.005101842);
  assert.ok(report.stats.maxDrawdownSol < defaultExecutionAssumptions.maxDrawdownSol);
});

test('fragile majors momentum configuration is rejected after execution costs', () => {
  const report = evaluateAgentLab({
    agent: agentDefinitions[1],
    dataFeed: dataFeedDefinitions[1],
    model: modelDefinitions[2],
    assumptions: defaultExecutionAssumptions,
  });

  assert.equal(report.verdict, 'reject');
  assert.equal(report.stats.selectedTrades, 12);
  assert.ok(report.stats.averageEvSol < 0);
  assert.ok(report.stats.outlierRemovedEvSol < 0);
});

test('strategy discovery ranks every agent/feed/model profile with proof metadata', () => {
  const candidates = discoverStrategyProfiles(
    agentDefinitions,
    dataFeedDefinitions,
    modelDefinitions,
    defaultExecutionAssumptions,
  );

  assert.equal(candidates.length, agentDefinitions.length * dataFeedDefinitions.length * modelDefinitions.length);
  assert.ok(candidates[0].proofScore >= candidates.at(-1).proofScore);
  assert.ok(candidates.some((candidate) => candidate.stage === 'promotion_candidate'));
  assert.ok(candidates.some((candidate) => candidate.stage === 'reject'));
  assert.ok(candidates.every((candidate) => candidate.profileId.includes(candidate.agent.id)));
  assert.ok(candidates.every((candidate) => candidate.proofPoints.length === 3));
});
