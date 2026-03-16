// backend/routes/people.js

import express from 'express';
import { validate } from '../schemas/validate.js';
import { getPeople } from '../services/graphql.js';
import { createItem, createSubitem } from '../services/monday.js';

const router = express.Router();

const TRUNCATE_LENGTH = 300;
const GOOGLE_FOLDER_URL = 'https://drive.google.com/placeholder-folder-link';

// Truncate long text for the Description column.
// Full text goes in the subitem content column for web team reference.
function truncate(text, label) {
  if (!text) return null;
  if (text.length <= TRUNCATE_LENGTH) return text;
  return `${text.slice(0, TRUNCATE_LENGTH)}...\n(Reply to this email for the full ${label}.)`;
}

function formatList(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 'None provided';
  return arr
    .map((v) => (typeof v === 'object' && v !== null ? v.name ?? v.slug : String(v)))
    .join(', ');
}

function formatWebsites(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 'None provided';
  return arr.map((w) => {
    const type = w.type ? `${w.type}: ` : '';
    return `- ${type}${w.url}`;
  }).join('\n');
}

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
    const boardId    = process.env.MONDAY_BOARD_ID;
    const today      = new Date().toISOString().slice(0, 10);
    const fullName   = `${firstName} ${lastName}`;
    const displayName = preferredName ? `${preferredName} ${lastName}` : fullName;

    // ── Build description (Option C sectioned format) ─────────────────────
    const nameNote = preferredName
      ? `${displayName} (legal: ${fullName})`
      : fullName;

    const bioTruncated           = truncate(bio, 'biography');
    const renciScholarBioTruncated = renciScholar && renciScholarBio
      ? truncate(renciScholarBio, 'RENCI Scholar bio')
      : null;

    const descriptionLines = [
      `New profile request submitted by ${submitterEmail}.`,
      '',
      'PERSON',
      `Name: ${nameNote}`,
      `Job Title: ${jobTitle}`,
      `Groups: ${formatList(groups)}`,
      `Start Date: ${startDate}`,
    ];

    if (bioTruncated || renciScholar) {
      descriptionLines.push('');
      descriptionLines.push('CONTENT');
      if (bioTruncated) {
        descriptionLines.push(`Bio:\n${bioTruncated}`);
      }
      if (renciScholar) {
        descriptionLines.push(`RENCI Scholar: Yes`);
        if (renciScholarBioTruncated) {
          descriptionLines.push(`RENCI Scholar Bio:\n${renciScholarBioTruncated}`);
        }
      }
    }

    const websiteLines  = formatWebsites(websites);
    const projectList   = formatList(projects);
    if (projectList !== 'None provided' || websiteLines !== 'None provided') {
      descriptionLines.push('');
      descriptionLines.push('CONNECTIONS');
      if (projectList !== 'None provided') {
        descriptionLines.push(`Projects: ${projectList}`);
      }
      if (websiteLines !== 'None provided') {
        descriptionLines.push(`Websites:\n${websiteLines}`);
      }
    }

    descriptionLines.push('');
    descriptionLines.push('HEADSHOT');
    descriptionLines.push(
      headshotConfirmed
        ? `Confirmed uploaded — retrieve from shared folder labeled "${fullName}"`
        : `Not yet uploaded — follow up with submitter, label file "${fullName}"`
    );

    const descriptionText = descriptionLines.join('\n');

    // ── Column values ─────────────────────────────────────────────────────
    const columnValues = {
      [process.env.MONDAY_COL_STATUS]:          { label: 'New' },
      [process.env.MONDAY_COL_DATE]:            { date: today },
      [process.env.MONDAY_COL_CONTENT_TYPE]:    { labels: ['Person'] },
      [process.env.MONDAY_COL_OPERATION]:       { labels: ['Add'] },
      [process.env.MONDAY_COL_ITEM_NAME]:       { text: fullName },
      [process.env.MONDAY_COL_DESCRIPTION]:     { text: descriptionText },
      [process.env.MONDAY_COL_SUBMITTER_EMAIL]: { email: submitterEmail, text: submitterEmail },
    };

    const item = await createItem(boardId, `Add Person - ${fullName}`, columnValues);

    // ── Subitems — one per submitted field ────────────────────────────────
    const subitems = [];

    // Name
    const nameParts = [
      `First: ${firstName}`,
      `Last: ${lastName}`,
      preferredName ? `Preferred: ${preferredName}` : null,
    ].filter(Boolean).join(', ');
    subitems.push({ title: `Name: ${nameNote}`, content: nameParts });

    // Job title
    subitems.push({ title: `Job Title: ${jobTitle}`, content: null });

    // Groups
    subitems.push({ title: `Groups: ${formatList(groups)}`, content: null });

    // Start date
    subitems.push({ title: `Start Date: ${startDate}`, content: null });

    // Bio
    if (bio) {
      subitems.push({ title: 'Add Bio', content: bio });
    }

    // RENCI Scholar
    if (renciScholar) {
      subitems.push({
        title: 'RENCI Scholar: Yes',
        content: renciScholarBio || null,
      });
    }

    // Projects
    if (Array.isArray(projects) && projects.length > 0) {
      subitems.push({ title: `Projects: ${formatList(projects)}`, content: null });
    }

    // Websites — one subitem per entry
    if (Array.isArray(websites) && websites.length > 0) {
      for (const w of websites) {
        const type = w.type ? `${w.type}: ` : '';
        subitems.push({ title: `Add Website: ${type}${w.url}`, content: null });
      }
    }

    // Headshot
    subitems.push({
      title: headshotConfirmed
        ? `Headshot: confirmed uploaded — retrieve from shared folder labeled "${fullName}"`
        : `Headshot: not yet uploaded — follow up with submitter, label file "${fullName}"`,
      content: headshotConfirmed ? GOOGLE_FOLDER_URL : null,
    });

    // Create all subitems
    for (const { title, content } of subitems) {
      const subitemColumnValues = content
        ? { [process.env.MONDAY_SUBITEM_COL_CONTENT]: { text: content } }
        : {};
      await createSubitem(item.id, title, subitemColumnValues);
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

  const { submitterEmail, slug, name, changes } = req.body;
  const displayName = name || slug;

  try {
    // ── Build subitems from changes (Option B — one per atomic action) ────
    const subitems = buildPersonUpdateSubitems(changes, slug);

    // ── Build description ─────────────────────────────────────────────────
    const changeLines = subitems.map((s) => `- ${s.title}`).join('\n');

    const descriptionText = [
      `Update request submitted by ${submitterEmail}.`,
      '',
      'PERSON',
      `Name: ${displayName}`,
      `Slug: ${slug}`,
      '',
      'CHANGES',
      changeLines,
    ].join('\n');

    const columnValues = {
      [process.env.MONDAY_COL_STATUS]:          { label: 'New' },
      [process.env.MONDAY_COL_DATE]:            { date: new Date().toISOString().slice(0, 10) },
      [process.env.MONDAY_COL_CONTENT_TYPE]:    { labels: ['Person'] },
      [process.env.MONDAY_COL_OPERATION]:       { labels: ['Update'] },
      [process.env.MONDAY_COL_ITEM_NAME]:       { text: displayName },
      [process.env.MONDAY_COL_DESCRIPTION]:     { text: descriptionText },
      [process.env.MONDAY_COL_SUBMITTER_EMAIL]: { email: submitterEmail, text: submitterEmail },
    };

    const item = await createItem(
      process.env.MONDAY_BOARD_ID,
      `Update Person - ${displayName}`,
      columnValues
    );

    for (const { title, content } of subitems) {
      const subitemColumnValues = content
        ? { [process.env.MONDAY_SUBITEM_COL_CONTENT]: { text: content } }
        : {};
      await createSubitem(item.id, title, subitemColumnValues);
    }

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
  const displayName = name || slug;

  try {
    const boardId = process.env.MONDAY_BOARD_ID;
    const today   = new Date().toISOString().slice(0, 10);

    const descriptionText = [
      `Archive request submitted by ${submitterEmail}.`,
      '',
      'PERSON',
      `Name: ${displayName}`,
      `Slug: ${slug}`,
      `Effective Date: ${effectiveDate}`,
      '',
      'REASON',
      reason,
    ].join('\n');

    const columnValues = {
      [process.env.MONDAY_COL_STATUS]:          { label: 'New' },
      [process.env.MONDAY_COL_DATE]:            { date: today },
      [process.env.MONDAY_COL_CONTENT_TYPE]:    { labels: ['Person'] },
      [process.env.MONDAY_COL_OPERATION]:       { labels: ['Archive'] },
      [process.env.MONDAY_COL_ITEM_NAME]:       { text: displayName },
      [process.env.MONDAY_COL_DESCRIPTION]:     { text: descriptionText },
      [process.env.MONDAY_COL_SUBMITTER_EMAIL]: { email: submitterEmail, text: submitterEmail },
    };

    const item = await createItem(
      boardId,
      `Archive Person - ${displayName}`,
      columnValues
    );

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

/**
 * Build Option B subitems for Update Person.
 * Returns array of { title, content } objects.
 * content goes into MONDAY_SUBITEM_COL_CONTENT for long fields.
 */
function buildPersonUpdateSubitems(changes, slug) {
  const subitems = [];

  for (const change of changes) {
    const { field, label, value } = change;

    switch (field) {
      case 'name': {
        // value is { firstName?, lastName?, preferredName? }
        const parts = [];
        if (value?.firstName)    parts.push(`Update First Name: ${value.firstName}`);
        if (value?.lastName)     parts.push(`Update Last Name: ${value.lastName}`);
        if (value?.preferredName) parts.push(`Update Preferred Name: ${value.preferredName}`);
        for (const part of parts) {
          subitems.push({ title: part, content: null });
        }
        break;
      }

      case 'jobTitle':
        subitems.push({ title: `Update Job Title: ${value}`, content: null });
        break;

      case 'bio':
        subitems.push({
          title:   'Update Bio',
          content: value || null,
        });
        break;

      case 'renciScholar': {
        const status = value?.renciScholar ? 'Yes' : 'No';
        subitems.push({
          title:   `Update RENCI Scholar: ${status}`,
          content: value?.renciScholarBio || null,
        });
        break;
      }

      case 'groups': {
        const adds    = value?.add    || [];
        const removes = value?.remove || [];
        for (const slug of removes) {
          subitems.push({ title: `Remove from Groups: ${slug}`, content: null });
        }
        for (const slug of adds) {
          subitems.push({ title: `Add to Groups: ${slug}`, content: null });
        }
        break;
      }

      case 'projects': {
        const adds    = value?.add    || [];
        const removes = value?.remove || [];
        for (const s of removes) {
          subitems.push({ title: `Remove from Projects: ${typeof s === 'object' ? s.name || s.slug : s}`, content: null });
        }
        for (const s of adds) {
          subitems.push({ title: `Add to Projects: ${typeof s === 'object' ? s.name || s.slug : s}`, content: null });
        }
        break;
      }

      case 'websites': {
        const entries = Array.isArray(value) ? value : [];
        for (const w of entries) {
          const type = w.type ? `${w.type} — ` : '';
          subitems.push({ title: `Add Website: ${type}${w.url}`, content: null });
        }
        break;
      }

      case 'publications': {
        const entries = Array.isArray(value) ? value : [];
        for (const pub of entries) {
          subitems.push({ title: `Add Publication: ${pub.doi}`, content: null });
        }
        break;
      }

      case 'headshot':
        subitems.push({
          title:   `Update Headshot — retrieve from shared folder labeled "${slug}"`,
          content: GOOGLE_FOLDER_URL,
        });
        break;

      case 'other':
        subitems.push({
          title:   `Other: ${typeof value === 'string' ? value.slice(0, 80) : 'see content'}`,
          content: typeof value === 'string' && value.length > 80 ? value : null,
        });
        break;

      default:
        subitems.push({
          title:   `${label || field}: ${typeof value === 'string' ? value.slice(0, 80) : 'see content'}`,
          content: null,
        });
    }
  }

  return subitems;
}

export default router;