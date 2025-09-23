const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || '*').split(',');
app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Health
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'backend_2', imports: true });
});
app.get('/health', (_req, res) => res.json({ status: 'healthy' }));

// Routes
app.use('/auth', require('../src/routes/auth'));
app.use('/documents', require('../src/routes/documents'));
app.use('/analysis', require('../src/routes/analysis'));
app.use('/chat', require('../src/routes/chat'));

const PORT = parseInt(process.env.PORT || '8000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`backend_2 server listening on http://0.0.0.0:${PORT}`);
});
