const express = require('express');
const cors = require('cors');

function createApp() {
  const app = express();
  app.use(cors());

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
