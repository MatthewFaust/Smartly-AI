// Express server entry point — mounts all routes and starts listening
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const leadsRouter = require('./routes/leads');
const followupsRouter = require('./routes/followups');
const testRouter = require('./routes/test');
const chatRouter = require('./routes/chat');
const propertiesRouter = require('./routes/properties');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/leads', leadsRouter);
app.use('/followups', followupsRouter);
app.use('/test', testRouter);
app.use('/chat', chatRouter);
app.use('/properties', propertiesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

module.exports = app;
