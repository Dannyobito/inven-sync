'use strict';

const { InventoryLevel, InventoryItem, Location } = require('../models');

module.exports = [
  {
    method: 'GET',
    path: '/inventory',
    handler: async (request, h) => {
      const levels = await InventoryLevel.findAll({
        include: [
          {
            model: InventoryItem,
            attributes: ['sku', 'productTitle', 'variantTitle'],
          },
          { model: Location, attributes: ['name'] },
        ],
        order: [['updatedAt', 'DESC']],
      });

      const shaped = levels.map((level) => ({
        inventory_item_id: level.inventoryItemId,
        location_id: level.locationId,
        sku: level.InventoryItem.sku,
        product_title: level.InventoryItem.productTitle,
        variant_title: level.InventoryItem.variantTitle,
        location: level.Location.name,
        available: level.available,
        updated_at: level.updatedAt,
      }));

      return h.response(shaped).code(200);
    },
  },
];
