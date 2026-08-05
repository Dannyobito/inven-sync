'use strict';

const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Inventory Sync Demo',
    version: '1.0.0',
    description:
      'Hapi + Postgres service that ingests a Shopify-shaped inventory webhook and upserts stock counts idempotently. The `x-mock-webhook-id` header mocks Shopify’s `X-Shopify-Webhook-Id`.',
  },
  servers: [
    { url: 'https://inven-sync.onrender.com', description: 'Render' },
    { url: 'http://localhost:5005', description: 'Local' },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Inventory' },
    { name: 'Webhooks' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Service is up',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                  },
                },
                example: { status: 'ok' },
              },
            },
          },
        },
      },
    },
    '/inventory': {
      get: {
        tags: ['Inventory'],
        summary: 'List current stock levels',
        description:
          'Returns inventory levels joined with catalog SKU/title and location name.',
        operationId: 'listInventory',
        responses: {
          '200': {
            description: 'Current stock',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/InventoryRow' },
                },
                example: [
                  {
                    inventory_item_id: 40010001,
                    location_id: 1,
                    sku: 'EMB-DRS-S-NVY',
                    product_title: 'Embroidered Midi Dress',
                    variant_title: 'Small / Navy',
                    location: 'SoHo Flagship',
                    available: 3,
                    updated_at: '2026-08-04T22:26:22.327Z',
                  },
                ],
              },
            },
          },
        },
      },
    },
    '/webhooks/inventory-sync': {
      post: {
        tags: ['Webhooks'],
        summary: 'Sync inventory from a mock Shopify webhook',
        description:
          'Applies `{ inventory_item_id, location_id, available }` inside a DB transaction. Idempotent on `x-mock-webhook-id`. Unknown catalog IDs return 404.',
        operationId: 'inventorySyncWebhook',
        parameters: [
          {
            name: 'x-mock-webhook-id',
            in: 'header',
            required: true,
            description: 'Unique delivery id (mocks X-Shopify-Webhook-Id)',
            schema: { type: 'string', example: 'whid_evt_1' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InventorySyncPayload' },
              examples: {
                sync: {
                  summary: 'Update stock',
                  value: {
                    inventory_item_id: 40010001,
                    location_id: 1,
                    available: 3,
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Stock synced',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SyncSuccess' },
                example: {
                  status: 'synced',
                  inventory_item_id: 40010001,
                  location_id: 1,
                  sku: 'EMB-DRS-S-NVY',
                  location: 'SoHo Flagship',
                  available: 3,
                },
              },
            },
          },
          '200': {
            description: 'Duplicate delivery — already processed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AlreadyProcessed' },
                example: {
                  status: 'already_processed',
                  webhook_id: 'whid_evt_1',
                },
              },
            },
          },
          '400': {
            description: 'Missing header, bad types, or invalid JSON',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                examples: {
                  missingHeader: {
                    summary: 'Missing webhook id header',
                    value: { error: 'x-mock-webhook-id header is required' },
                  },
                  badPayload: {
                    summary: 'Invalid field types',
                    value: {
                      error:
                        'inventory_item_id, location_id must be integers; available must be a non-negative integer',
                    },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Unknown inventory_item_id or location_id',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: {
                  error: 'Unknown inventory_item_id or location_id',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      InventorySyncPayload: {
        type: 'object',
        required: ['inventory_item_id', 'location_id', 'available'],
        properties: {
          inventory_item_id: {
            type: 'integer',
            example: 40010001,
            description: 'Seeded catalog id (Shopify-shaped)',
          },
          location_id: {
            type: 'integer',
            example: 1,
            description: '1 = SoHo Flagship, 2 = Warehouse — Newark, NJ',
          },
          available: {
            type: 'integer',
            minimum: 0,
            example: 3,
          },
        },
      },
      InventoryRow: {
        type: 'object',
        properties: {
          inventory_item_id: { type: 'integer', example: 40010001 },
          location_id: { type: 'integer', example: 1 },
          sku: { type: 'string', example: 'EMB-DRS-S-NVY' },
          product_title: { type: 'string', example: 'Embroidered Midi Dress' },
          variant_title: { type: 'string', example: 'Small / Navy' },
          location: { type: 'string', example: 'SoHo Flagship' },
          available: { type: 'integer', example: 3 },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      SyncSuccess: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'synced' },
          inventory_item_id: { type: 'integer' },
          location_id: { type: 'integer' },
          sku: { type: 'string' },
          location: { type: 'string' },
          available: { type: 'integer' },
        },
      },
      AlreadyProcessed: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'already_processed' },
          webhook_id: { type: 'string', example: 'whid_evt_1' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
};

module.exports = openapi;
