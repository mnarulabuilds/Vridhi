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

The API is a Docker image plus Postgres. The mobile app is an Expo/EAS build that talks to that API over HTTPS.

### 1. API

On the server (or any Docker host):

```bash
cp .env.production.example .env.production
# Set POSTGRES_PASSWORD and JWT_SECRET (`openssl rand -base64 48`).
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml up -d --build
curl http://127.0.0.1:3001/health
```

Put a reverse proxy (Caddy or Nginx) in front with TLS. Point the public hostname at `127.0.0.1:3001`. Postgres is not published in the prod overlay.

Put `EXPO_PUBLIC_API_URL=https://api.your-domain.com` in the mobile build. Native apps do not need CORS; add web origins to `CORS_ORIGINS` only if you ship Expo web.

### 2. Android preview build

```bash
cd mobile
npx eas-cli login
EXPO_PUBLIC_API_URL=https://api.your-domain.com npx eas-cli build --profile preview --platform android
```

Install the APK from the Expo link. iOS App Store / TestFlight needs an Apple Developer account and `eas build --profile production --platform ios`.

Do not run `gemma4:26b` (or other 20B+ models) on the API host. Structured Ask questions work without a model; open chat can use `OPENAI_API_KEY`.


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
