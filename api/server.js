const express = require('express');
const cors = require('cors');
const { router: contentRouter } = require('./content');
const { router: eventsRouter } = require('./events');
const { router: accoladesRouter } = require('./accolades');
const { router: docsRouter } = require('./docs');
const { router: uexRouter } = require('./uex');
const { router: tokenRouter } = require('./token');
const { authMiddleware } = require('./auth');

function createApp() {
  const app = express();
  app.use(cors());

  app.use('/api/token', tokenRouter);
  app.use('/api/docs', docsRouter);
  app.use('/api', authMiddleware);
  app.use('/api/content', contentRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/accolades', accoladesRouter);
  app.use('/api/uex', uexRouter);

  // GET /api/data - placeholder for future Sequelize queries
  app.get('/api/data', async (req, res) => {
    res.json({ success: true, message: 'API is working' });
  });

  return app;
}

function startApi() {
  const port = process.env.API_PORT || 8003;
  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`\uD83C\uDF10 API server running on port ${port}`); // 🌐
  });

  server.on('error', err => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`\u26A0\uFE0F API server port ${port} already in use`); // ⚠️
    } else {
      console.error('❌ API server error:', err);
    }
  });

  return server;
}

module.exports = { createApp, startApi };
