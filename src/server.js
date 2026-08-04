'use strict';

require('dotenv').config();

const Hapi = require('@hapi/hapi');
const { sequelize } = require('./models');
const inventoryRoutes = require('./routes/inventory');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5005,
    host: process.env.HOST || '0.0.0.0',
  });

  server.route(inventoryRoutes);

  server.route({
    method: 'GET',
    path: '/health',
    handler: () => ({ status: 'ok' }),
  });

  await sequelize.authenticate();
  console.log('Database connection established.');

  await sequelize.sync();
  console.log('Models synced.');

  await server.start();
  const displayHost =
    server.info.host === '0.0.0.0' ? 'localhost' : server.info.host;
  console.log(`Server running on http://${displayHost}:${server.info.port}`);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
