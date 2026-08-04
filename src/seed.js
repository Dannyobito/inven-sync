'use strict';

require('dotenv').config();

const { sequelize, Location, InventoryItem, InventoryLevel } = require('./models');

const locations = [
  { id: 1, name: 'SoHo Flagship' },
  { id: 2, name: 'Warehouse — Newark, NJ' },
];

const items = [
  { id: 40010001, sku: 'EMB-DRS-S-NVY', productTitle: 'Embroidered Midi Dress', variantTitle: 'Small / Navy' },
  { id: 40010002, sku: 'EMB-DRS-M-NVY', productTitle: 'Embroidered Midi Dress', variantTitle: 'Medium / Navy' },
  { id: 40010003, sku: 'LIN-TRS-M-SND', productTitle: 'Linen Wide-Leg Trouser', variantTitle: 'Medium / Sand' },
  { id: 40010004, sku: 'SLK-BLS-S-IVY', productTitle: 'Silk Wrap Blouse', variantTitle: 'Small / Ivory' },
  { id: 40010005, sku: 'DNM-JKT-M-LBL', productTitle: 'Cropped Denim Jacket', variantTitle: 'Medium / Light Blue' },
  { id: 40010006, sku: 'CSH-SWT-L-CML', productTitle: 'Cashmere Crew Sweater', variantTitle: 'Large / Camel' },
];

const startingLevels = [
  { inventoryItemId: 40010001, locationId: 1, available: 6 },
  { inventoryItemId: 40010001, locationId: 2, available: 14 },
  { inventoryItemId: 40010002, locationId: 1, available: 4 },
  { inventoryItemId: 40010002, locationId: 2, available: 10 },
  { inventoryItemId: 40010003, locationId: 1, available: 9 },
  { inventoryItemId: 40010003, locationId: 2, available: 20 },
  { inventoryItemId: 40010004, locationId: 1, available: 3 },
  { inventoryItemId: 40010004, locationId: 2, available: 8 },
  { inventoryItemId: 40010005, locationId: 1, available: 5 },
  { inventoryItemId: 40010005, locationId: 2, available: 12 },
  { inventoryItemId: 40010006, locationId: 1, available: 7 },
  { inventoryItemId: 40010006, locationId: 2, available: 15 },
];

const seed = async () => {
  await sequelize.sync();

  await Location.bulkCreate(locations, { ignoreDuplicates: true });
  await InventoryItem.bulkCreate(items, { ignoreDuplicates: true });
  await InventoryLevel.bulkCreate(startingLevels, { ignoreDuplicates: true });

  console.log(
    `Seeded ${locations.length} locations, ${items.length} inventory items, ${startingLevels.length} inventory levels.`
  );

  await sequelize.close();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
