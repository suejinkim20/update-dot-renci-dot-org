import express from 'express';
import { getOrganizations } from '../services/graphql.js';

const router = express.Router();

// GET /api/organizations
// Returns array of { name, slug, id }
router.get('/', async (req, res) => {
  try {
    const organizations = await getOrganizations();
    return res.json(organizations);
  } catch (err) {
    if (err.code === 'VPN_REQUIRED') {
      return res.status(503).json({ code: 'VPN_REQUIRED', message: err.message });
    }
    console.error('GET /api/organizations error:', err);
    return res.status(500).json({ message: 'Failed to load organizations.' });
  }
});

export default router;