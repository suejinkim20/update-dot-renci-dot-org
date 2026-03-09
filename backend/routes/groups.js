import express from 'express';
import { getGroups } from '../services/graphql.js';

const router = express.Router();

// GET /api/groups
// Returns { researchGroups: [...], operationsGroups: [...] }
router.get('/', async (req, res) => {
  try {
    const groups = await getGroups();
    return res.json(groups);
  } catch (err) {
    if (err.code === 'VPN_REQUIRED') {
      return res.status(503).json({ code: 'VPN_REQUIRED', message: err.message });
    }
    console.error('GET /api/groups error:', err);
    return res.status(500).json({ message: 'Failed to load groups.' });
  }
});

export default router;