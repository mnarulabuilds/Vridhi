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

Backend goes to **Render**. The Android app is a separate EAS build that bakes in that HTTPS URL.

```bash
# once
brew install render && render login
(cd mobile && npx eas-cli login)

# .env.production
#   API_DOMAIN=your-service.onrender.com
#   EXPO_PUBLIC_API_URL=https://your-service.onrender.com
#   RENDER_SERVICE_ID=srv-...   # optional; Dashboard → service Settings

npm run deploy               # trigger a Render deploy of the API
npm run deploy:status        # GET https://your-service.onrender.com/health
npm run deploy:mobile        # Android APK against that URL
npm run deploy:play          # production AAB → Play Console (internal draft)
```

Local Docker (this machine only): `npm run deploy:api:local`

`DATABASE_URL` on Render must be the Postgres **Internal Database URL**, never `localhost`. See `render.yaml` for a Blueprint that wires this automatically.

### Play Store

1. Create a [Play Console](https://play.google.com/console) app with package `com.vridhi.app`.
2. Fill the store listing, privacy policy, Data safety form, and content rating. Upload a 512×512 PNG icon.
3. Create a Google Cloud service account with Play Developer API access, download the JSON key, save it as `mobile/google-play-service-account.json` (gitignored), and set `PLAY_SERVICE_ACCOUNT_JSON` in `.env.production` if the path differs.
4. Run `npm run deploy:play`. That builds an **AAB** (not the preview APK), with HTTP cleartext disabled, and uploads it as an **internal draft**. Complete the listing, add testers, then promote.

Without the JSON key the AAB is still built; upload it in Play Console or run `npm run deploy:play -- --submit-only` after the key is in place. Build only: `npm run deploy:play -- --no-submit`.




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
