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
test('project.add: valid (email only)',
  validate('project.add', { submitterEmail: 'a@b.com' }), true);

test('project.add: missing email',
  validate('project.add', {}), false);

// --- project.update ---
test('project.update: valid',
  validate('project.update', { submitterEmail: 'a@b.com', slug: 'my-project', changes: [{ field: 'name', value: 'New Name' }] }), true);

test('project.update: missing slug',
  validate('project.update', { submitterEmail: 'a@b.com', changes: [{}] }), false);

test('project.update: empty changes array',
  validate('project.update', { submitterEmail: 'a@b.com', slug: 'my-project', changes: [] }), false);

// --- project.archive ---
test('project.archive: valid',
  validate('project.archive', { submitterEmail: 'a@b.com', slug: 'my-project' }), true);

// --- person.add ---
test('person.add: valid (all required fields)',
  validate('person.add', {
    submitterEmail: 'a@b.com', firstName: 'Jane', lastName: 'Smith',
    jobTitle: 'Engineer', groups: ['research-group'], startDate: '2026-03-01'
  }), true);

test('person.add: missing firstName',
  validate('person.add', {
    submitterEmail: 'a@b.com', lastName: 'Smith',
    jobTitle: 'Engineer', groups: ['research-group'], startDate: '2026-03-01'
  }), false);

test('person.add: renciScholar true but no bio',
  validate('person.add', {
    submitterEmail: 'a@b.com', firstName: 'Jane', lastName: 'Smith',
    jobTitle: 'Engineer', groups: ['research-group'], startDate: '2026-03-01',
    renciScholar: true
  }), false);

test('person.add: renciScholar true with bio',
  validate('person.add', {
    submitterEmail: 'a@b.com', firstName: 'Jane', lastName: 'Smith',
    jobTitle: 'Engineer', groups: ['research-group'], startDate: '2026-03-01',
    renciScholar: true, renciScholarBio: 'She does research.'
  }), true);

// --- person.archive ---
test('person.archive: valid',
  validate('person.archive', { submitterEmail: 'a@b.com', slug: 'jane-smith', effectiveDate: '2026-03-17' }), true);

test('person.archive: missing effectiveDate',
  validate('person.archive', { submitterEmail: 'a@b.com', slug: 'jane-smith' }), false);

// --- unknown operation ---
test('unknown operation returns error',
  validate('project.delete', {}), false);

console.log(`\n${passed} passed, ${failed} failed`);