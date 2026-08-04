'use strict';

const {
  sequelize,
  InventoryItem,
  Location,
  InventoryLevel,
  SyncEvent,
} = require('../models');

module.exports = [
  {
    method: 'POST',
    path: '/webhooks/inventory-sync',
    handler: async (request, h) => {
      const webhookId = request.headers['x-mock-webhook-id'];
      const { inventory_item_id, location_id, available } =
        request.payload || {};

      if (!webhookId) {
        return h
          .response({ error: 'x-mock-webhook-id header is required' })
          .code(400);
      }

      if (
        !Number.isInteger(inventory_item_id) ||
        !Number.isInteger(location_id) ||
        !Number.isInteger(available) ||
        available < 0
      ) {
        return h
          .response({
            error:
              'inventory_item_id, location_id must be integers; available must be a non-negative integer',
          })
          .code(400);
      }

      try {
        const result = await sequelize.transaction(async (t) => {
          const [, created] = await SyncEvent.findOrCreate({
            where: { webhookId },
            transaction: t,
          });

          if (!created) {
            return { alreadyProcessed: true };
          }

          const [item, location] = await Promise.all([
            InventoryItem.findByPk(inventory_item_id, { transaction: t }),
            Location.findByPk(location_id, { transaction: t }),
          ]);

          if (!item || !location) {
            const err = new Error('Unknown inventory_item_id or location_id');
            err.isClientError = true;
            throw err;
          }

          const [level] = await InventoryLevel.upsert(
            {
              inventoryItemId: inventory_item_id,
              locationId: location_id,
              available,
            },
            { transaction: t, returning: true }
          );

          return { alreadyProcessed: false, level, item, location };
        });

        if (result.alreadyProcessed) {
          return h
            .response({ status: 'already_processed', webhook_id: webhookId })
            .code(200);
        }

        return h
          .response({
            status: 'synced',
            inventory_item_id: result.level.inventoryItemId,
            location_id: result.level.locationId,
            sku: result.item.sku,
            location: result.location.name,
            available: result.level.available,
          })
          .code(201);
      } catch (err) {
        if (err.isClientError) {
          return h.response({ error: err.message }).code(404);
        }
        throw err;
      }
    },
  },
];
