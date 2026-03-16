// backend/routes/people.js

import express from 'express';
import { validate } from '../schemas/validate.js';
import { getPeople } from '../services/graphql.js';
import { createItem, createSubitem } from '../services/monday.js';

const router = express.Router();

// ── GET /api/people ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const people = await getPeople();
    return res.json(people);
  } catch (err) {
    if (err.code === 'VPN_REQUIRED') {
      return res.status(503).json({ code: 'VPN_REQUIRED', message: err.message });
    }
    console.error('GET /api/people error:', err);
    return res.status(500).json({ message: 'Failed to load people.' });
  }
});

// ── POST /api/people ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const result = validate('person.add', req.body);
  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }

  const {
    submitterEmail,
    firstName,
    lastName,
    preferredName,
    jobTitle,
    groups,
    startDate,
    renciScholar,
    renciScholarBio,
    projects,
    bio,
    websites,
    headshotConfirmed,
  } = req.body;

  try {
    const boardId = process.env.MONDAY_BOARD_ID;
    const today = new Date().toISOString().slice(0, 10);
    const fullName = `${firstName} ${lastName}`;
    const displayName = preferredName ? `${preferredName} ${lastName}` : fullName;

    const formatList = (arr) => {
      if (!Array.isArray(arr) || arr.length === 0) return 'None provided';
      return arr
        .map((v) => (typeof v === 'object' && v !== null ? v.name ?? v.slug : v))
        .join(', ');
    };

    const formatWebsites = (arr) => {
      if (!Array.isArray(arr) || arr.length === 0) return 'None provided';
      return arr.map((w) => {
        const type = w.type ? `${w.type}: ` : '';
        return `${type}${w.url}`;
      }).join('\n');
    };

    const descriptionText = [
      `New person profile requested by ${submitterEmail}.`,
      '',
      `Name: ${displayName}`,
      preferredName ? `Legal name: ${fullName}` : null,
      `Job Title: ${jobTitle}`,
      `Groups: ${formatList(groups)}`,
      `Start Date: ${startDate}`,
      '',
      `RENCI Scholar: ${renciScholar ? 'Yes' : 'No'}`,
      renciScholar && renciScholarBio ? `RENCI Scholar Bio:\n${renciScholarBio}` : null,
      '',
      `Projects: ${formatList(projects)}`,
      '',
      bio ? `Bio:\n${bio}` : 'Bio: Not provided',
      '',
      `Websites:\n${formatWebsites(websites)}`,
      '',
      `Headshot: ${headshotConfirmed ? `Submitter confirmed upload — retrieve from shared org folder labeled "${fullName}"` : 'Not yet uploaded — follow up required'}`,
    ]
      .filter((line) => line !== null)
      .join('\n');

    const columnValues = {
      [process.env.MONDAY_COL_STATUS]:        { label: 'New' },
      [process.env.MONDAY_COL_DATE]:          { date: today },
      [process.env.MONDAY_COL_CONTENT_TYPE]:  { labels: ['Person'] },
      [process.env.MONDAY_COL_DESCRIPTION]:   { text: descriptionText },
      [process.env.MONDAY_COL_SUBMITTER_EMAIL]: { email: submitterEmail, text: submitterEmail },
    };

    const item = await createItem(boardId, `Add Person - ${fullName}`, columnValues);

    const subitems = [];

    // Headshot subitem depends on whether the submitter confirmed upload
    if (headshotConfirmed) {
      subitems.push(`Headshot confirmed by submitter — retrieve from shared org folder labeled "${fullName}"`);
    } else {
      subitems.push(`Follow up: headshot not yet uploaded — request from submitter, label file "${fullName}"`);
    }

    if (!Array.isArray(projects) || projects.length === 0) {
      subitems.push('Follow up: no projects provided — confirm with submitter after onboarding');
    }

    for (const subitemName of subitems) {
      await createSubitem(item.id, subitemName, {});
    }

    return res.status(200).json({ success: true, itemId: item.id });
  } catch (err) {
    if (err.code === 'VPN_REQUIRED') {
      return res.status(503).json({ code: 'VPN_REQUIRED', message: err.message });
    }
    console.error('POST /api/people error:', err);
    return res.status(500).json({ message: 'Failed to create Monday item.' });
  }
});

// ── POST /api/people/update ───────────────────────────────────────────────────
router.post('/update', async (req, res) => {
  const result = validate('person.update', req.body);
  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }

  const { submitterEmail, slug, changes } = req.body;

  const changeSummary = changes
    .map((c) => `${c.label || c.field}:\n${formatChangeValue(c.value)}`)
    .join('\n\n');

  const descriptionText = [
    `Update request submitted by ${submitterEmail}.`,
    `Profile: ${slug}`,
    '',
    'Requested changes:',
    changeSummary,
  ].join('\n');

  const columnValues = {
    [process.env.MONDAY_COL_STATUS]:          { label: 'New' },
    [process.env.MONDAY_COL_DATE]:            { date: new Date().toISOString().slice(0, 10) },
    [process.env.MONDAY_COL_CONTENT_TYPE]:    { labels: ['Person'] },
    [process.env.MONDAY_COL_DESCRIPTION]:     { text: descriptionText },
    [process.env.MONDAY_COL_SUBMITTER_EMAIL]: { email: submitterEmail, text: submitterEmail },
  };

  try {
    const item = await createItem(
      process.env.MONDAY_BOARD_ID,
      `Update Person - ${slug}`,
      columnValues
    );

    await Promise.all(
      changes.map((change) => {
        const subitemName = `${change.label || change.field}: ${summarizeValue(change.value)}`;
        return createSubitem(item.id, subitemName, {});
      })
    );

    return res.status(200).json({ success: true, itemId: item.id });
  } catch (err) {
    if (err.code === 'VPN_REQUIRED') {
      return res.status(503).json({ code: 'VPN_REQUIRED', message: err.message });
    }
    console.error('POST /api/people/update error:', err);
    return res.status(500).json({ message: 'Failed to submit request. Please try again.' });
  }
});

// ── POST /api/people/archive ──────────────────────────────────────────────────
router.post('/archive', async (req, res) => {
  const result = validate('person.archive', req.body);
  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }

  const { submitterEmail, slug, name, effectiveDate, reason } = req.body;

  try {
    const boardId = process.env.MONDAY_BOARD_ID;
    const today = new Date().toISOString().slice(0, 10);

    const descriptionText = [
      `Archive request submitted by ${submitterEmail}.`,
      '',
      `Person: ${name || slug}`,
      `Slug: ${slug}`,
      `Effective Date: ${effectiveDate}`,
      '',
      `Reason: ${reason}`,
    ].join('\n');

    const columnValues = {
      [process.env.MONDAY_COL_STATUS]:          { label: 'New' },
      [process.env.MONDAY_COL_DATE]:            { date: today },
      [process.env.MONDAY_COL_CONTENT_TYPE]:    { labels: ['Person'] },
      [process.env.MONDAY_COL_DESCRIPTION]:     { text: descriptionText },
      [process.env.MONDAY_COL_SUBMITTER_EMAIL]: { email: submitterEmail, text: submitterEmail },
    };

    const item = await createItem(boardId, `Archive Person - ${name?.trim() || slug}`, columnValues);

    return res.status(200).json({ success: true, itemId: item.id });
  } catch (err) {
    if (err.code === 'VPN_REQUIRED') {
      return res.status(503).json({ code: 'VPN_REQUIRED', message: err.message });
    }
    console.error('POST /api/people/archive error:', err);
    return res.status(500).json({ message: 'Failed to create Monday item.' });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatChangeValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return '(none)';
    return value
      .map((v) => (typeof v === 'object' ? v.name || v.url || v.doi || JSON.stringify(v) : String(v)))
      .join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    if ('add' in value || 'remove' in value) {
      const parts = [];
      if (value.remove?.length) {
        parts.push(`Remove: ${value.remove.join(', ')}`);
      }
      if (value.add?.length) {
        parts.push(`Add: ${formatChangeValue(value.add)}`);
      }
      return parts.length ? parts.join('\n') : '(no changes)';
    }
    return value.name || value.url || value.doi || JSON.stringify(value);
  }
  return String(value ?? '');
}

function summarizeValue(value) {
  const full = formatChangeValue(value);
  return full.length > 80 ? full.slice(0, 77) + '...' : full;
}

export default router;