'use strict';

const openapi = require('../openapi');

const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Inventory Sync Demo — API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      tryItOutEnabled: true,
      persistAuthorization: false,
    });
  </script>
</body>
</html>`;

module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: (request, h) =>
      h.response(swaggerHtml).type('text/html').code(200),
  },
  {
    method: 'GET',
    path: '/openapi.json',
    handler: () => openapi,
  },
];
