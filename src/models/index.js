'use strict';

const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions:
    process.env.DATABASE_SSL === 'true'
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
});

const Location = sequelize.define(
  'Location',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false },
    name: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: 'locations', timestamps: false }
);

const InventoryItem = sequelize.define(
  'InventoryItem',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false },
    sku: { type: DataTypes.STRING, allowNull: false },
    productTitle: { type: DataTypes.STRING, allowNull: false },
    variantTitle: { type: DataTypes.STRING, allowNull: true },
  },
  { tableName: 'inventory_items', timestamps: false }
);

const InventoryLevel = sequelize.define(
  'InventoryLevel',
  {
    inventoryItemId: { type: DataTypes.INTEGER, allowNull: false },
    locationId: { type: DataTypes.INTEGER, allowNull: false },
    available: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'inventory_levels',
    timestamps: true,
    indexes: [{ unique: true, fields: ['inventoryItemId', 'locationId'] }],
  }
);

const SyncEvent = sequelize.define(
  'SyncEvent',
  {
    webhookId: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  { tableName: 'sync_events', timestamps: true }
);

InventoryItem.hasMany(InventoryLevel, { foreignKey: 'inventoryItemId' });
InventoryLevel.belongsTo(InventoryItem, { foreignKey: 'inventoryItemId' });

Location.hasMany(InventoryLevel, { foreignKey: 'locationId' });
InventoryLevel.belongsTo(Location, { foreignKey: 'locationId' });

module.exports = {
  sequelize,
  Location,
  InventoryItem,
  InventoryLevel,
  SyncEvent,
};
