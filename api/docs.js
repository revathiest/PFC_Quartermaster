const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/swagger.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'swagger.json'));
});

router.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
  <html>
    <head>
      <title>API Docs</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
      <script>
        window.onload = () => {
          SwaggerUIBundle({ url: '/api/docs/swagger.json', dom_id: '#swagger-ui' });
        };
      </script>
    </body>
  </html>`);
});

module.exports = { router };
