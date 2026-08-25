import { validate } from '../schemas/validate.js';

let passed = 0;
let failed = 0;

function test(label, result, expectValid) {
  const ok = result.valid === expectValid;
  console.log(`${ok ? '✅' : '❌'} ${label}`);
  if (!ok || !result.valid) console.log('  ', result.errors ?? '(valid)');
  ok ? passed++ : failed++;
}

// --- project.add ---
test('project.add: valid empty payload',
  validate('project.add', {}), true);

test('project.add: valid with name',
  validate('project.add', { name: 'My Project' }), true);

// --- project.update ---
test('project.update: valid',
  validate('project.update', { slug: 'my-project', changes: [{ field: 'name', value: 'New Name' }] }), true);

test('project.update: missing slug',
  validate('project.update', { changes: [{}] }), false);

test('project.update: empty changes array',
  validate('project.update', { slug: 'my-project', changes: [] }), false);

// --- project.archive ---
test('project.archive: valid',
  validate('project.archive', { slug: 'my-project', reason: 'No longer active.' }), true);

// --- person.add ---
test('person.add: valid (all required fields)',
  validate('person.add', {
    firstName: 'Jane', lastName: 'Smith',
    jobTitle: 'Engineer', groups: ['research-group'], startDate: '2026-03-01'
  }), true);

test('person.add: missing firstName',
  validate('person.add', {
    lastName: 'Smith',
    jobTitle: 'Engineer', groups: ['research-group'], startDate: '2026-03-01'
  }), false);

test('person.add: renciScholar true but no bio',
  validate('person.add', {
    firstName: 'Jane', lastName: 'Smith',
    jobTitle: 'Engineer', groups: ['research-group'], startDate: '2026-03-01',
    renciScholar: true
  }), false);

test('person.add: renciScholar true with bio',
  validate('person.add', {
    firstName: 'Jane', lastName: 'Smith',
    jobTitle: 'Engineer', groups: ['research-group'], startDate: '2026-03-01',
    renciScholar: true, renciScholarBio: 'She does research.'
  }), true);

// --- person.archive ---
test('person.archive: valid',
  validate('person.archive', { slug: 'jane-smith', effectiveDate: '2026-03-17', reason: 'Left RENCI.' }), true);

test('person.archive: missing effectiveDate',
  validate('person.archive', { slug: 'jane-smith', reason: 'Left RENCI.' }), false);

// --- unknown operation ---
test('unknown operation returns error',
  validate('project.delete', {}), false);

console.log(`\n${passed} passed, ${failed} failed`);
