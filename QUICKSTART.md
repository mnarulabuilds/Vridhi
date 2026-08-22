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

Set `OPENAI_API_KEY` in `backend/.env` to enable the Ask assistant.

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
- Ask Vridhi questions about **your recorded data** (numbers come from API tools, not guesses)

Vridhi does not give professional financial, investment, tax, or legal advice.

## Troubleshooting

- Mobile cannot reach the API: set `EXPO_PUBLIC_API_URL` to `http://<your-lan-ip>:3001`
- Ask tab errors: confirm `OPENAI_API_KEY` and that the backend restarted
- Database schema drift: `cd backend && npx prisma migrate deploy`
