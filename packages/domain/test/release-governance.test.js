import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReleaseCandidate, exportReleaseReport, setReleaseApproval } from '../src/release-governance.js';

const mockReport = {
  profile: { id: 'dkNaBasic' },
  combinations: { 'z-': { ulsKn: 10, slsKn: 8 } },
  traceability: { formulas: ['a=b*c'] }
};

test('buildReleaseCandidate creates candidate with default approvals false', () => {
  const candidate = buildReleaseCandidate({ version: '1.0.0', calculationReport: mockReport });
  assert.equal(candidate.approvals.technical, false);
  assert.equal(candidate.approvals.business, false);
});

test('setReleaseApproval updates approvals', () => {
  const candidate = buildReleaseCandidate({ version: '1.0.1', calculationReport: mockReport });
  const approved = setReleaseApproval(candidate, { technical: true, business: true });
  assert.equal(approved.approvals.technical, true);
  assert.equal(approved.approvals.business, true);
});

test('exportReleaseReport returns filtered customer view', () => {
  const candidate = buildReleaseCandidate({ version: '1.0.2', calculationReport: mockReport });
  const customer = exportReleaseReport(candidate, 'customer');
  assert.ok(customer.summary);
  assert.equal(customer.report, undefined);
});
