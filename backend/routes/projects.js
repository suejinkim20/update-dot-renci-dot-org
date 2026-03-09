// backend/routes/projects.js

import express from 'express';
import { validate } from '../schemas/validate.js';
import { getProjects } from '../services/graphql.js';
import { createItem, createSubitem } from '../services/monday.js';

const router = express.Router();

// ── GET /api/projects ─────────────────────────────────────────────────────────
// Returns all projects from the GraphQL API.
router.get('/', async (req, res) => {
  try {
    const projects = await getProjects();
    return res.json(projects);
  } catch (err) {
    if (err.code === 'VPN_REQUIRED') {
      return res.status(503).json({ code: 'VPN_REQUIRED', message: err.message });
    }
    console.error('GET /api/projects error:', err);
    return res.status(500).json({ message: 'Failed to load projects.' });
  }
});

// ── POST /api/projects ────────────────────────────────────────────────────────
// Accepts an Add Project submission, creates a Monday parent item + subitems.
router.post('/', async (req, res) => {
  // 1. Validate required-to-submit fields
  const result = validate('project.add', req.body);
  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }

  const {
    submitterEmail,
    name,
    slug,
    description,
    renciRole,
    owningGroup,
    people,
    fundingOrgs,
    partnerOrgs,
    websites,
    reviewRequests = [],
  } = req.body;

  try {
    const boardId = process.env.MONDAY_BOARD_ID;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // ── 2. Build column values for the parent item ──────────────────────────

    // Helper: format a mixed TagsInput value array as a readable string
    const formatTags = (arr) => {
      if (!Array.isArray(arr) || arr.length === 0) return '(none)';
      return arr
        .map((v) => (typeof v === 'object' && v !== null ? v.name : v))
        .join(', ');
    };

    const formatWebsites = (arr) => {
      if (!Array.isArray(arr) || arr.length === 0) return '(none)';
      return arr.map((w) => (w.label ? `${w.label}: ${w.url}` : w.url)).join('\n');
    };

    const descriptionText = [
      `Submitter: ${submitterEmail}`,
      `Name: ${name || '(not provided)'}`,
      `Slug: ${slug || '(not provided)'}`,
      `Description: ${description || '(not provided)'}`,
      `RENCI Role: ${renciRole || '(not provided)'}`,
      `Owning Group: ${owningGroup || '(not provided)'}`,
      `Contributors: ${formatTags(people)}`,
      `Funding Orgs: ${formatTags(fundingOrgs)}`,
      `Partner Orgs: ${formatTags(partnerOrgs)}`,
      `Websites:\n${formatWebsites(websites)}`,
    ].join('\n');

    const columnValues = {
      [process.env.MONDAY_COL_STATUS]: { label: 'New' },
      [process.env.MONDAY_COL_DATE]: { date: today },
      [process.env.MONDAY_COL_CONTENT_TYPE]: { labels: ['Project'] },
      [process.env.MONDAY_COL_DESCRIPTION]: { text: descriptionText },
    };

    const itemName = `Add Project - ${name?.trim() || '(unnamed)'}`;

    // ── 3. Create Monday parent item ────────────────────────────────────────
    const item = await createItem(boardId, itemName, columnValues);

    // ── 4. Build subitem list ───────────────────────────────────────────────

    const subitems = [];

    // Missing publish-required fields → auto-flag
    const publishRequired = [
      { key: name, label: 'Project Name' },
      { key: owningGroup, label: 'Owning Group' },
      { key: description, label: 'Description' },
      { key: renciRole, label: "RENCI's Role" },
    ];
    for (const { key, label } of publishRequired) {
      if (!key || (typeof key === 'string' && key.trim() === '')) {
        subitems.push(`Follow up: ${label} not provided`);
      }
    }

    // Missing important (non-blocking) fields → auto-flag
    const importantFields = [
      {
        key: Array.isArray(people) && people.length > 0,
        label: 'Contributors',
      },
      {
        key: Array.isArray(fundingOrgs) && fundingOrgs.length > 0,
        label: 'Funding Organizations',
      },
      {
        key: Array.isArray(partnerOrgs) && partnerOrgs.length > 0,
        label: 'Partner Organizations',
      },
      {
        key: slug?.trim(),
        label: 'Slug',
      },
    ];
    for (const { key, label } of importantFields) {
      if (!key) {
        subitems.push(`Follow up: ${label} not provided`);
      }
    }

    // Review requests
    const reviewFieldLabels = {
      name: 'Project Name',
      description: 'Description',
      renciRole: "RENCI's Role",
      slug: 'Slug',
    };
    for (const fieldName of reviewRequests) {
      const label = reviewFieldLabels[fieldName];
      if (label) {
        subitems.push(`Review: ${label}`);
      }
    }

    // ── 5. Create subitems ──────────────────────────────────────────────────
    for (const subitemName of subitems) {
      await createSubitem(item.id, subitemName, {});
    }

    return res.status(200).json({ success: true, itemId: item.id });
  } catch (err) {
    if (err.code === 'VPN_REQUIRED') {
      return res.status(503).json({ code: 'VPN_REQUIRED', message: err.message });
    }
    console.error('POST /api/projects error:', err);
    return res.status(500).json({ message: 'Failed to create Monday item.' });
  }
});

// Place after the existing POST /api/projects (add) handler and before POST /api/projects/archive

// POST /api/projects/update
router.post('/update', async (req, res) => {
  const result = validate('project.update', req.body);
  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }

  const { submitterEmail, slug, changes } = req.body;

  // Build structured summary for the parent item description
  const changeSummary = changes
    .map((c) => `${c.label || c.field}: ${formatChangeValue(c.value)}`)
    .join('\n');

  const description = [
    `Slug: ${slug}`,
    `Submitter: ${submitterEmail}`,
    '',
    'Requested Changes:',
    changeSummary,
  ].join('\n');

  // Find project name from slug for the item title
  // (slug is the reliable identifier; name is informational)
  const itemName = `Update Project - ${slug}`;

  const columnValues = {
    [process.env.MONDAY_COL_STATUS]: { label: 'New' },
    [process.env.MONDAY_COL_DATE]: { date: new Date().toISOString().split('T')[0] },
    [process.env.MONDAY_COL_CONTENT_TYPE]: { labels: ['Project'] },
    [process.env.MONDAY_COL_DESCRIPTION]: { text: description },
  };

  try {
    const item = await createItem(
      process.env.MONDAY_BOARD_ID,
      itemName,
      columnValues
    );

    const parentItemId = item.id;

    // One subitem per declared change block
    await Promise.all(
      changes.map((change) => {
        const subitemName = `${change.label || change.field}: ${summarizeValue(change.value)}`;
        return createSubitem(parentItemId, subitemName, {});
      })
    );

    return res.status(201).json({ success: true, itemId: parentItemId });
  } catch (err) {
    if (err.code === 'VPN_REQUIRED') {
      return res.status(503).json({
        code: 'VPN_REQUIRED',
        message: 'Could not connect to the data API. Make sure you are connected to the VPN.',
      });
    }
    console.error('Error creating Monday item (update project):', err);
    return res.status(500).json({ message: 'Failed to submit request. Please try again.' });
  }
});

// Helper: format a change value for display in the Monday description
function formatChangeValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return '(none)';
    return value
      .map((v) => (typeof v === 'object' ? v.name || v.url || JSON.stringify(v) : String(v)))
      .join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return value.name || value.url || JSON.stringify(value);
  }
  return String(value ?? '');
}

// Helper: short summary for subitem name (truncated to keep Monday item names readable)
function summarizeValue(value) {
  const full = formatChangeValue(value);
  return full.length > 80 ? full.slice(0, 77) + '...' : full;
}

// ── POST /api/projects/archive ────────────────────────────────────────────────
// Accepts an Archive Project submission, creates a Monday parent item.
router.post('/archive', async (req, res) => {
  // 1. Validate
  const result = validate('project.archive', req.body);
  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }

  const { submitterEmail, slug, name, reason } = req.body;

  try {
    const boardId = process.env.MONDAY_BOARD_ID;
    const today = new Date().toISOString().slice(0, 10);

    // 2. Build description summary
    const descriptionText = [
      `Submitter: ${submitterEmail}`,
      `Project: ${name || slug}`,
      `Slug: ${slug}`,
      `Reason: ${reason}`,
    ].join('\n');

    const columnValues = {
      [process.env.MONDAY_COL_STATUS]: { label: 'New' },
      [process.env.MONDAY_COL_DATE]: { date: today },
      [process.env.MONDAY_COL_CONTENT_TYPE]: { labels: ['Project'] },
      [process.env.MONDAY_COL_DESCRIPTION]: { text: descriptionText },
    };

    const itemName = `Archive Project - ${name?.trim() || slug}`;

    // 3. Create Monday parent item (no subitems for Archive)
    const item = await createItem(boardId, itemName, columnValues);

    return res.status(200).json({ success: true, itemId: item.id });
  } catch (err) {
    if (err.code === 'VPN_REQUIRED') {
      return res.status(503).json({ code: 'VPN_REQUIRED', message: err.message });
    }
    console.error('POST /api/projects/archive error:', err);
    return res.status(500).json({ message: 'Failed to create Monday item.' });
  }
});

export default router;