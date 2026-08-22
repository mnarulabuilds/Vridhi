# Quick Start Guide

## Backend

1. Start Postgres:

```bash
docker compose up -d postgres
```

2. Configure the API:

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

The API listens on `http://localhost:3001`. Health: `GET /health`. OpenAPI: `http://localhost:3001/api/docs`.

Ask answers spending, savings rate, budgets, balances, and recurring/unusual notices from your ledger **without** a language model. Open-ended chat needs one of:

- `OPENAI_API_KEY` (default `AI_PROVIDER=openai`), or
- a local model: install [Ollama](https://ollama.com), run `ollama pull llama3.2`, then set `AI_PROVIDER=ollama` and `OPENAI_MODEL=llama3.2`. Avoid 20B+ models for Ask; they stall the machine.

## Deploy

The API is a Docker image plus Postgres. The mobile app is an Expo/EAS build that talks to that API over HTTPS. From the repo root:

```bash
npm run deploy:init          # once: writes .env.production with random secrets
# Edit .env.production: API_DOMAIN, EXPO_PUBLIC_API_URL, optional OPENAI_API_KEY
(cd mobile && npx eas-cli login) # once: Expo account for EAS builds
npm run deploy               # API (Docker)
npm run deploy:mobile        # Android preview APK
```

Useful variants:

```bash
npm run deploy:api           # backend only, this machine
npm run deploy:mobile        # EAS only
npm run deploy:status        # compose ps + GET /health
npm run deploy:all           # API, then submit an EAS mobile build
npm run deploy -- mobile --platform ios --profile production
```

Set `API_DOMAIN=api.your-domain.com` (DNS A record pointing at the host) to start Caddy with automatic TLS. Otherwise the API listens on `127.0.0.1:3001` and you can put your own reverse proxy in front. Postgres is not published in the prod overlay.

`EXPO_PUBLIC_API_URL` is baked into the native binary. Native apps do not need CORS; add web origins to `CORS_ORIGINS` only if you ship Expo web.

`npm run deploy` starts the API. `npm run deploy:mobile` submits an Android preview APK that talks to this machine’s LAN IP. `npm run deploy:all` does both.

## Render

`P1001: Can't reach database server at localhost:5432` means `DATABASE_URL` is still the local value from `.env.example`. Render Postgres is a **separate** service; `localhost` inside the API container is not Postgres.

1. Create a **PostgreSQL** instance on Render (same region as the web service).
2. On the **Web Service** → Environment, set:

   - `DATABASE_URL` = the database’s **Internal Database URL** (Dashboard → Postgres → Connections). It looks like `postgresql://…@dpg-….render.com/…` or `postgresql://…@dpg-…-a/…`, never `localhost`.
   - If the URL has no `sslmode`, append `?sslmode=require`.
   - `JWT_SECRET` = a long random string (`openssl rand -hex 32`).
   - Do **not** copy `DATABASE_URL` from `backend/.env`.

3. Docker settings if you did not use `render.yaml`: Dockerfile path `backend/Dockerfile`, context `backend`. Health check `/health`. Let Render set `PORT` (do not force `3001` if Render injects another port).

Or commit `render.yaml` and create a **Blueprint** from this repo; it creates Postgres and injects `DATABASE_URL` for you.

After the API is up, set `EXPO_PUBLIC_API_URL=https://your-service.onrender.com` and run `npm run deploy:mobile`.




## Mobile

```bash
cd mobile
cp .env.example .env
# EXPO_PUBLIC_API_URL=http://localhost:3001
# On a physical device, use your machine's LAN IP instead of localhost.
npm install
npm start
```

## What you can do

- Register / log in (JWT stored in SecureStore; tokens refresh automatically)
- Create accounts and categorized income, expenses, and transfers
- See this month's cash flow, savings rate, net worth, and account balances on the dashboard
- Set category budgets and review them on Insights
- Paste a bank CSV in Settings to import transactions (duplicates are skipped)
- Ask Vridhi questions about **your recorded data** (numbers come from the API, not guesses). Tap a suggested question, or type freely if a model is configured
- Add an expense from the + button: amount, category chip, save

Vridhi does not give professional financial, investment, tax, or legal advice.

## Troubleshooting

- Mobile cannot reach the API: set `EXPO_PUBLIC_API_URL` to `http://<your-lan-ip>:3001`
- Ask tab errors on open chat: start Ollama or set `OPENAI_API_KEY`, then restart the API. Structured questions should still work.
- Database schema drift: `cd backend && npx prisma migrate deploy`
