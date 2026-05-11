import assert from 'node:assert/strict';
import test from 'node:test';

const statusScore = { pass: 1, watch: 0.5, fail: 0 };

function summarize(gates) {
  return Math.round((gates.reduce((sum, gate) => sum + statusScore[gate], 0) / gates.length) * 100);
}

test('gate scoring rewards pass, watch, and fail states deterministically', () => {
  assert.equal(summarize(['pass', 'pass', 'watch', 'fail']), 63);
  assert.equal(summarize(['pass', 'pass', 'pass', 'pass']), 100);
  assert.equal(summarize(['fail', 'fail', 'fail', 'fail']), 0);
});
