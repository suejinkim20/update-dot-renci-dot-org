// backend/routes/projects.js

import express from 'express';
import { validate } from '../schemas/validate.js';
import { getProjects } from '../services/graphql.js';
import { createItem, createSubitem } from '../services/monday.js';

const router = express.Router();

const TRUNCATE_LENGTH = 300;

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
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr.map((w) => {
    const type = w.type ? `${w.type}: ` : '';
    return `- ${type}${w.url}`;
  }).join('\n');
}

// ── GET /api/projects ─────────────────────────────────────────────────────────
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
router.post('/', async (req, res) => {
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
  } = req.body;

  try {
    const boardId = process.env.MONDAY_BOARD_ID;
    const today   = new Date().toISOString().slice(0, 10);

    const descTruncated     = truncate(description, 'description');
    const renciRoleTruncated = truncate(renciRole, "RENCI's Role");
    const websiteLines      = formatWebsites(websites);
    const peopleList        = formatList(people);
    const fundingList       = formatList(fundingOrgs);
    const partnerList       = formatList(partnerOrgs);

    // ── Build description ─────────────────────────────────────────────────
    const descriptionLines = [
      `New project request submitted by ${submitterEmail}.`,
      '',
      'PROJECT',
      `Name: ${name || 'Not provided'}`,
      `Slug suggestion: ${slug?.trim() || 'None — team will generate'}`,
      `Owning Group: ${owningGroup || 'Not provided'}`,
    ];

    if (descTruncated || renciRoleTruncated) {
      descriptionLines.push('');
      descriptionLines.push('CONTENT');
      if (descTruncated) {
        descriptionLines.push(`Description:\n${descTruncated}`);
      }
      if (renciRoleTruncated) {
        descriptionLines.push(`RENCI's Role:\n${renciRoleTruncated}`);
      }
    }

    const hasConnections = peopleList !== 'None provided' ||
      fundingList !== 'None provided' ||
      partnerList !== 'None provided' ||
      websiteLines;

    if (hasConnections) {
      descriptionLines.push('');
      descriptionLines.push('CONNECTIONS');
      if (peopleList  !== 'None provided') descriptionLines.push(`Contributors: ${peopleList}`);
      if (fundingList !== 'None provided') descriptionLines.push(`Funding Organizations: ${fundingList}`);
      if (partnerList !== 'None provided') descriptionLines.push(`Partner Organizations: ${partnerList}`);
      if (websiteLines) descriptionLines.push(`Websites:\n${websiteLines}`);
    }

    const descriptionText = descriptionLines.join('\n');

    // ── Column values ─────────────────────────────────────────────────────
    const columnValues = {
      [process.env.MONDAY_COL_STATUS]:          { label: 'New' },
      [process.env.MONDAY_COL_DATE]:            { date: today },
      [process.env.MONDAY_COL_CONTENT_TYPE]:    { labels: ['Project'] },
      [process.env.MONDAY_COL_OPERATION]:       { labels: ['Add'] },
      [process.env.MONDAY_COL_ITEM_NAME]:       { text: name?.trim() || '(unnamed)' },
      [process.env.MONDAY_COL_DESCRIPTION]:     { text: descriptionText },
      [process.env.MONDAY_COL_SUBMITTER_EMAIL]: { email: submitterEmail, text: submitterEmail },
    };

    const item = await createItem(
      boardId,
      `Add Project - ${name?.trim() || '(unnamed)'}`,
      columnValues
    );

    // ── Subitems — one per submitted field ────────────────────────────────
    const subitems = [];

    if (name)       subitems.push({ title: `Name: ${name}`, content: null });
    if (slug?.trim()) subitems.push({ title: `Slug suggestion: ${slug}`, content: null });
    if (owningGroup) subitems.push({ title: `Owning Group: ${owningGroup}`, content: null });
    if (description) subitems.push({ title: 'Add Description', content: description });
    if (renciRole)   subitems.push({ title: "Add RENCI's Role", content: renciRole });

    if (Array.isArray(people) && people.length > 0) {
      subitems.push({ title: `Contributors: ${formatList(people)}`, content: null });
    }
    if (Array.isArray(fundingOrgs) && fundingOrgs.length > 0) {
      for (const org of fundingOrgs) {
        // Distinguish between existing orgs (have slug/id) and new orgs (have officialName)
        if (org.officialName) {
          // New organization
          const short = org.shortName ? ` (${org.shortName})` : '';
          const url   = org.url ? ` — ${org.url}` : '';
          const content = [
            'Add New Funding Organization:',
            `- Official Name: ${org.officialName}`,
            org.shortName ? `- Short Name: ${org.shortName}` : null,
            org.url ? `- Website: ${org.url}` : null,
          ].filter(Boolean).join('\n');
          subitems.push({ title: `Add New Funding Organization: ${org.officialName}${short}${url}`, content });
        } else {
          // Existing organization
          const orgName = typeof org === 'object' ? org.name ?? org.slug : org;
          const content = typeof org === 'object' ? [
            'Add Existing Funding Organization:',
            `- Name: ${org.name || '(not provided)'}`,
            `- Slug: ${org.slug || '(not provided)'}`,
            `- ID: ${org.id || '(not provided)'}`,
          ].join('\n') : null;
          subitems.push({ title: `Add Funding Organization: ${orgName}`, content });
        }
      }
    }
    if (Array.isArray(partnerOrgs) && partnerOrgs.length > 0) {
      for (const org of partnerOrgs) {
        // Distinguish between existing orgs (have slug/id) and new orgs (have officialName)
        if (org.officialName) {
          // New organization
          const short = org.shortName ? ` (${org.shortName})` : '';
          const url   = org.url ? ` — ${org.url}` : '';
          const content = [
            'Add New Partner Organization:',
            `- Official Name: ${org.officialName}`,
            org.shortName ? `- Short Name: ${org.shortName}` : null,
            org.url ? `- Website: ${org.url}` : null,
          ].filter(Boolean).join('\n');
          subitems.push({ title: `Add New Partner Organization: ${org.officialName}${short}${url}`, content });
        } else {
          // Existing organization
          const orgName = typeof org === 'object' ? org.name ?? org.slug : org;
          const content = typeof org === 'object' ? [
            'Add Existing Partner Organization:',
            `- Name: ${org.name || '(not provided)'}`,
            `- Slug: ${org.slug || '(not provided)'}`,
            `- ID: ${org.id || '(not provided)'}`,
          ].join('\n') : null;
          subitems.push({ title: `Add Partner Organization: ${orgName}`, content });
        }
      }
    }
    if (Array.isArray(websites) && websites.length > 0) {
      for (const w of websites) {
        const type = w.type ? `${w.type} — ` : '';
        subitems.push({ title: `Add Website: ${type}${w.url}`, content: null });
      }
    }

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
    console.error('POST /api/projects error:', err);
    return res.status(500).json({ message: 'Failed to create Monday item.' });
  }
});

// ── POST /api/projects/update ─────────────────────────────────────────────────
router.post('/update', async (req, res) => {
  const result = validate('project.update', req.body);
  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }

  const { submitterEmail, slug, name, changes } = req.body;
  const displayName = name || slug;

  try {
    const subitems = buildProjectUpdateSubitems(changes);

    const changeLines = subitems.map((s) => `- ${s.title}`).join('\n');

    const descriptionText = [
      `Update request submitted by ${submitterEmail}.`,
      '',
      'PROJECT',
      `Name: ${displayName}`,
      `Slug: ${slug}`,
      '',
      'CHANGES',
      changeLines,
    ].join('\n');

    const columnValues = {
      [process.env.MONDAY_COL_STATUS]:          { label: 'New' },
      [process.env.MONDAY_COL_DATE]:            { date: new Date().toISOString().slice(0, 10) },
      [process.env.MONDAY_COL_CONTENT_TYPE]:    { labels: ['Project'] },
      [process.env.MONDAY_COL_OPERATION]:       { labels: ['Update'] },
      [process.env.MONDAY_COL_ITEM_NAME]:       { text: displayName },
      [process.env.MONDAY_COL_DESCRIPTION]:     { text: descriptionText },
      [process.env.MONDAY_COL_SUBMITTER_EMAIL]: { email: submitterEmail, text: submitterEmail },
    };

    // Add WordPress link if slug provided
    if (slug) {
      columnValues[process.env.MONDAY_COL_WORDPRESS_LINK] = {
        url: `https://renci.org/project/${slug}`,
        text: `https://renci.org/project/${slug}`
      };
    }

    const item = await createItem(
      process.env.MONDAY_BOARD_ID,
      `Update Project - ${displayName}`,
      columnValues
    );

    for (const { title, content } of subitems) {
      const subitemColumnValues = content
        ? { [process.env.MONDAY_SUBITEM_COL_CONTENT]: { text: content } }
        : {};
      await createSubitem(item.id, title, subitemColumnValues);
    }
    console.log(`Created Monday item ${item.id} for project update request: ${JSON.stringify(columnValues)}`);
    return res.status(201).json({ success: true, itemId: item.id });
  } catch (err) {
    if (err.code === 'VPN_REQUIRED') {
      return res.status(503).json({ code: 'VPN_REQUIRED', message: err.message });
    }
    console.error('POST /api/projects/update error:', err);
    return res.status(500).json({ message: 'Failed to submit request. Please try again.' });
  }
});

// ── POST /api/projects/archive ────────────────────────────────────────────────
router.post('/archive', async (req, res) => {
  const result = validate('project.archive', req.body);
  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }

  const { submitterEmail, slug, name, reason } = req.body;
  const displayName = name || slug;

  try {
    const boardId = process.env.MONDAY_BOARD_ID;
    const today   = new Date().toISOString().slice(0, 10);

    const descriptionText = [
      `Archive request submitted by ${submitterEmail}.`,
      '',
      'PROJECT',
      `Name: ${displayName}`,
      `Slug: ${slug}`,
      '',
      'REASON',
      reason,
    ].join('\n');

    const columnValues = {
      [process.env.MONDAY_COL_STATUS]:          { label: 'New' },
      [process.env.MONDAY_COL_DATE]:            { date: today },
      [process.env.MONDAY_COL_CONTENT_TYPE]:    { labels: ['Project'] },
      [process.env.MONDAY_COL_OPERATION]:       { labels: ['Archive'] },
      [process.env.MONDAY_COL_ITEM_NAME]:       { text: displayName },
      [process.env.MONDAY_COL_DESCRIPTION]:     { text: descriptionText },
      [process.env.MONDAY_COL_SUBMITTER_EMAIL]: { email: submitterEmail, text: submitterEmail },
    };

    // Add WordPress link if slug provided
    if (slug) {
      columnValues[process.env.MONDAY_COL_WORDPRESS_LINK] = {
        url: `https://renci.org/project/${slug}`,
        text: `https://renci.org/project/${slug}`
      };
    }

    const item = await createItem(
      boardId,
      `Archive Project - ${displayName}`,
      columnValues
    );

    return res.status(200).json({ success: true, itemId: item.id });
  } catch (err) {
    if (err.code === 'VPN_REQUIRED') {
      return res.status(503).json({ code: 'VPN_REQUIRED', message: err.message });
    }
    console.error('POST /api/projects/archive error:', err);
    return res.status(500).json({ message: 'Failed to create Monday item.' });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildProjectUpdateSubitems(changes) {
  const subitems = [];

  for (const { field, label, value } of changes) {
    switch (field) {
      case 'name':
        subitems.push({ title: `Update Name: ${value}`, content: null });
        break;

      case 'owningGroup':
        subitems.push({ title: `Update Owning Group: ${value}`, content: null });
        break;

      case 'description':
        subitems.push({ title: 'Update Description', content: value || null });
        break;

      case 'renciRole':
        subitems.push({ title: "Update RENCI's Role", content: value || null });
        break;

      case 'people': {
        const adds    = value?.add    || [];
        const removes = value?.remove || [];
        for (const s of removes) {
          subitems.push({ title: `Remove Contributor: ${typeof s === 'object' ? s.name || s.slug : s}`, content: null });
        }
        for (const s of adds) {
          subitems.push({ title: `Add Contributor: ${typeof s === 'object' ? s.name || s.slug : s}`, content: null });
        }
        break;
      }

      case 'fundingOrgs': {
        const addExisting = value?.addExisting || [];
        const addNew      = value?.addNew || null;
        const removes     = value?.remove || [];
        
        // Remove existing orgs
        for (const s of removes) {
          const orgName = typeof s === 'object' ? s.name || s.slug : s;
          const content = typeof s === 'object' ? [
            'Remove Funding Organization:',
            `- Name: ${s.name || '(not provided)'}`,
            `- Slug: ${s.slug || '(not provided)'}`,
            `- ID: ${s.id || '(not provided)'}`,
          ].join('\n') : null;
          subitems.push({ title: `Remove Funding Organization: ${orgName}`, content });
        }
        
        // Add existing orgs (from dropdown)
        for (const org of addExisting) {
          const orgName = typeof org === 'object' ? org.name || org.slug : org;
          const content = typeof org === 'object' ? [
            'Add Existing Funding Organization:',
            `- Name: ${org.name || '(not provided)'}`,
            `- Slug: ${org.slug || '(not provided)'}`,
            `- ID: ${org.id || '(not provided)'}`,
          ].join('\n') : null;
          subitems.push({ title: `Add Funding Organization: ${orgName}`, content });
        }
        
        // Add new org (from form)
        if (addNew?.officialName?.trim()) {
          const short = addNew.shortName ? ` (${addNew.shortName})` : '';
          const url   = addNew.url ? ` — ${addNew.url}` : '';
          const content = [
            'Add New Funding Organization:',
            `- Official Name: ${addNew.officialName}`,
            addNew.shortName ? `- Short Name: ${addNew.shortName}` : null,
            addNew.url ? `- Website: ${addNew.url}` : null,
          ].filter(Boolean).join('\n');
          subitems.push({ title: `Add New Funding Organization: ${addNew.officialName}${short}${url}`, content });
        }
        break;
      }

      case 'partnerOrgs': {
        const addExisting = value?.addExisting || [];
        const addNew      = value?.addNew || null;
        const removes     = value?.remove || [];
        
        // Remove existing orgs
        for (const s of removes) {
          const orgName = typeof s === 'object' ? s.name || s.slug : s;
          const content = typeof s === 'object' ? [
            'Remove Partner Organization:',
            `- Name: ${s.name || '(not provided)'}`,
            `- Slug: ${s.slug || '(not provided)'}`,
            `- ID: ${s.id || '(not provided)'}`,
          ].join('\n') : null;
          subitems.push({ title: `Remove Partner Organization: ${orgName}`, content });
        }
        
        // Add existing orgs (from dropdown)
        for (const org of addExisting) {
          const orgName = typeof org === 'object' ? org.name || org.slug : org;
          const content = typeof org === 'object' ? [
            'Add Existing Partner Organization:',
            `- Name: ${org.name || '(not provided)'}`,
            `- Slug: ${org.slug || '(not provided)'}`,
            `- ID: ${org.id || '(not provided)'}`,
          ].join('\n') : null;
          subitems.push({ title: `Add Partner Organization: ${orgName}`, content });
        }
        
        // Add new org (from form)
        if (addNew?.officialName?.trim()) {
          const short = addNew.shortName ? ` (${addNew.shortName})` : '';
          const url   = addNew.url ? ` — ${addNew.url}` : '';
          const content = [
            'Add New Partner Organization:',
            `- Official Name: ${addNew.officialName}`,
            addNew.shortName ? `- Short Name: ${addNew.shortName}` : null,
            addNew.url ? `- Website: ${addNew.url}` : null,
          ].filter(Boolean).join('\n');
          subitems.push({ title: `Add New Partner Organization: ${addNew.officialName}${short}${url}`, content });
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