import './env.js'; // Must be first — loads .env before any other imports
import express from 'express';
import cors from 'cors';
import peopleRouter from './routes/people.js';
import projectsRouter from './routes/projects.js';
import groupsRouter from './routes/groups.js';
import organizationsRouter from './routes/organizations.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/people', peopleRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/organizations', organizationsRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});