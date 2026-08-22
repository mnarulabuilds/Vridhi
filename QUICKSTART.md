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
- a local model: install [Ollama](https://ollama.com), run `ollama pull llama3.1`, then set `AI_PROVIDER=ollama` and `OPENAI_MODEL=llama3.1` (optional `OPENAI_BASE_URL=http://127.0.0.1:11434/v1`).

Set `CORS_ORIGINS` to your Expo URL in production (required). Password reset shows a debug token only when `NODE_ENV` is not `production`.

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
- See this month's cash flow, savings rate, and account balances on the dashboard
- Set category budgets and review them on Insights
- Paste a bank CSV in Settings to import transactions (duplicates are skipped)
- Ask Vridhi questions about **your recorded data** (numbers come from the API, not guesses). Tap a suggested question, or type freely if a model is configured
- Add an expense from the + button: amount, category chip, save

Vridhi does not give professional financial, investment, tax, or legal advice.

## Troubleshooting

- Mobile cannot reach the API: set `EXPO_PUBLIC_API_URL` to `http://<your-lan-ip>:3001`
- Ask tab errors on open chat: start Ollama or set `OPENAI_API_KEY`, then restart the API. Structured questions should still work.
- Database schema drift: `cd backend && npx prisma migrate deploy`
