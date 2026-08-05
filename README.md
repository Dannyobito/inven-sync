# Inventory sync demo

Small Hapi.js + Sequelize/PostgreSQL service that ingests a Shopify-shaped
`inventory_levels/update` webhook and upserts stock counts idempotently.

## Problem

Third-party inventory webhooks can arrive more than once (retries,
at-least-once delivery). Blindly applying every delivery double-writes stock.

## What it does

- `GET /` — Swagger UI (OpenAPI examples + Try it out)
- `POST /webhooks/inventory-sync` — body `{ inventory_item_id, location_id, available }`
  plus `x-mock-webhook-id` header (mocks Shopify’s `X-Shopify-Webhook-Id`)
- Idempotency via a unique `sync_events.webhookId` row inside a DB transaction
- Unknown catalog IDs → `404` (does not invent rows)
- `GET /inventory` — joined stock view
- `GET /health`

Live docs: https://inven-sync.onrender.com/

Seed data: 2 locations, 6 boutique SKUs, starting levels.

## Run locally

```bash
cp .env.example .env
docker compose up --build
docker compose exec api npm run seed
```

API: `http://localhost:5005`  
Postgres (host): `localhost:5433` (avoids clashing with a local Postgres on 5432)

### Simulate a webhook

```bash
curl -X POST http://localhost:5005/webhooks/inventory-sync \
  -H "Content-Type: application/json" \
  -H "x-mock-webhook-id: whid_evt_1" \
  -d '{"inventory_item_id":40010001,"location_id":1,"available":3}'

curl http://localhost:5005/inventory
```

Same `x-mock-webhook-id` again returns `already_processed` without changing stock.

## Deploy

API on Render (Dockerfile), Postgres on Neon. Set `DATABASE_URL` and
`DATABASE_SSL=true` in the host dashboard, then run `npm run seed` once
against the deployed DB. See `DEPLOYMENT.md` for step-by-step.

## What I’d do next

- Verify Shopify HMAC (`X-Shopify-Hmac-SHA256`) before trusting payloads
- Decide out-of-order delivery policy (strict 404 vs stub + enrich)
- Two-way sync (push in-store changes back to Shopify)
- Multi-tenant shop/merchant IDs on every table
- Real migrations instead of `sequelize.sync()`
