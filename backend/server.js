import './env.js'; // Must be first — loads .env before any other imports
import express from 'express';
import authRouter from './routes/auth.js';
import peopleRouter from './routes/people.js';
import projectsRouter from './routes/projects.js';
import groupsRouter from './routes/groups.js';
import organizationsRouter from './routes/organizations.js';
import { attachUser, requireAuth, sessionMiddleware } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);
app.use(sessionMiddleware);
app.use(express.json());
app.use(attachUser);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRouter);

app.get('/api/session', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ authenticated: false });
  }

  return res.json({ authenticated: true, user: req.user });
});

app.use('/api', requireAuth);
app.use('/api/people', peopleRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/organizations', organizationsRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
