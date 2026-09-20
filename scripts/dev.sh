#!/usr/bin/env bash
# Start Postgres, apply migrations, and run the API + Expo dev server.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

API_ONLY=0
SKIP_INSTALL=0
FORCE_INSTALL=0
EXPO_LAUNCH=""
PIDS=()
API_LOG="$ROOT/.dev/backend.log"

RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
BOLD=$'\033[1m'
RESET=$'\033[0m'
if [[ ! -t 1 ]]; then
  RED=""; GREEN=""; YELLOW=""; BOLD=""; RESET=""
fi

log() { printf '%s\n' "$*"; }
ok() { printf '%s✓%s %s\n' "$GREEN" "$RESET" "$*"; }
warn() { printf '%s!%s %s\n' "$YELLOW" "$RESET" "$*" >&2; }
die() { printf '%s✗%s %s\n' "$RED" "$RESET" "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Run Vridhi locally (Postgres + Nest API + Expo).

Usage:
  npm run dev
  ./scripts/dev.sh [options]

Options:
  --api-only       Start Postgres and the API only (no Expo)
  --ios            Open the iOS simulator (Expo runs in the foreground)
  --android        Open the Android emulator
  --web            Open in the browser
  --no-install     Skip npm install even if node_modules is missing
  --setup          Run npm install in backend/ and mobile/ before starting
  -h, --help

Environment:
  POSTGRES_PORT    Host port for Vridhi Postgres (default: first free from 5432)

First-time manual setup (optional; dev.sh creates .env from examples):
  cd backend && cp .env.example .env
  cd mobile && cp .env.example .env

Physical device: set EXPO_PUBLIC_API_URL in mobile/.env to http://<your-lan-ip>:3001
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-only) API_ONLY=1 ;;
    --ios) EXPO_LAUNCH="ios" ;;
    --android) EXPO_LAUNCH="android" ;;
    --web) EXPO_LAUNCH="web" ;;
    --no-install) SKIP_INSTALL=1 ;;
    --setup) FORCE_INSTALL=1 ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $1 (try --help)"
      ;;
  esac
  shift
done

command -v docker >/dev/null 2>&1 || die "Docker is required. Install Docker Desktop and try again."

is_port_listening() {
  lsof -iTCP:"$1" -sTCP:LISTEN -P -n >/dev/null 2>&1
}

vridhi_postgres_running() {
  docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'vridhi-postgres'
}

vridhi_postgres_host_port() {
  docker port vridhi-postgres 5432/tcp 2>/dev/null | head -1 | sed 's/.*://' | tr -d '\r\n'
}

sync_database_url() {
  local port="$1"
  local url="postgresql://postgres:postgres@localhost:${port}/vridhi?schema=public"
  local tmp
  tmp="$(mktemp)"
  if [[ -f backend/.env ]]; then
    grep -v '^DATABASE_URL=' backend/.env >"$tmp" || true
  fi
  printf 'DATABASE_URL="%s"\n' "$url" >>"$tmp"
  mv "$tmp" backend/.env
}

pick_postgres_port() {
  if [[ -n "${POSTGRES_PORT:-}" ]]; then
    printf '%s' "$POSTGRES_PORT"
    return
  fi

  if vridhi_postgres_running; then
    local mapped
    mapped="$(vridhi_postgres_host_port)"
    if [[ -n "$mapped" ]]; then
      printf '%s' "$mapped"
      return
    fi
  fi

  local port=5432
  while is_port_listening "$port"; do
    if [[ "$port" -eq 5432 ]]; then
      warn "Port 5432 is already in use (another Postgres?). Vridhi will pick a free port."
    fi
    port=$((port + 1))
    if [[ "$port" -gt 65530 ]]; then
      die "Could not find a free TCP port for Postgres."
    fi
  done
  printf '%s' "$port"
}

start_postgres() {
  local port
  port="$(pick_postgres_port)"
  export POSTGRES_PORT="$port"

  ensure_env
  sync_database_url "$port"

  if [[ "$port" != "5432" ]]; then
    ok "Postgres will listen on localhost:${port} (DATABASE_URL updated in backend/.env)"
  fi

  if ! docker compose up -d postgres --wait; then
    die "Could not start Postgres. Try: docker compose logs postgres"
  fi
}

ensure_env() {
  if [[ ! -f backend/.env ]]; then
    cp backend/.env.example backend/.env
    ok "Created backend/.env from .env.example"
  fi
  if [[ "$API_ONLY" -eq 0 ]] && [[ ! -f mobile/.env ]]; then
    cp mobile/.env.example mobile/.env
    ok "Created mobile/.env from .env.example"
  fi
}

ensure_deps() {
  local install_backend=0
  local install_mobile=0

  if [[ "$FORCE_INSTALL" -eq 1 ]]; then
    install_backend=1
    install_mobile=1
  else
    [[ ! -d backend/node_modules ]] && install_backend=1
    [[ "$API_ONLY" -eq 0 ]] && [[ ! -d mobile/node_modules ]] && install_mobile=1
  fi

  if [[ "$SKIP_INSTALL" -eq 1 ]]; then
    [[ "$install_backend" -eq 1 ]] && warn "backend/node_modules missing (--no-install set)"
    [[ "$install_mobile" -eq 1 ]] && warn "mobile/node_modules missing (--no-install set)"
    return
  fi

  if [[ "$install_backend" -eq 1 ]]; then
    log "Installing backend dependencies…"
    (cd backend && npm install)
    ok "Backend dependencies ready"
  fi
  if [[ "$install_mobile" -eq 1 ]]; then
    log "Installing mobile dependencies…"
    (cd mobile && npm install)
    ok "Mobile dependencies ready"
  fi
}

cleanup() {
  if ((${#PIDS[@]} == 0)); then
    return
  fi
  local pid
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

log "${BOLD}Starting Postgres…${RESET}"
start_postgres
ok "Postgres ready on port ${POSTGRES_PORT}"

ensure_deps

log "Applying database migrations…"
if ! (
  cd backend
  npx prisma migrate deploy
  npx prisma generate
); then
  die "Database migration failed. Check DATABASE_URL in backend/.env (currently port ${POSTGRES_PORT})."
fi
ok "Database ready"

if [[ "${SKIP_API_BUILD:-0}" == "1" ]] && [[ -f backend/dist/main.js ]]; then
  ok "API build skipped (dist present; set SKIP_API_BUILD=0 to force rebuild)"
else
  log "Building API (initial compile)…"
  (
    cd backend
    rm -f tsconfig.build.tsbuildinfo
    npm run build
  )
  ok "API build ready"
fi

wait_for_api() {
  local attempt
  for attempt in $(seq 1 60); do
    if curl -sf "http://127.0.0.1:3001/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

mkdir -p "$ROOT/.dev"
: >"$API_LOG"

log "${BOLD}Starting API on http://localhost:3001${RESET} (Swagger: /api/docs)"
log "API logs → ${API_LOG/#$ROOT\//}"
(
  cd backend
  npm run start:dev
) >>"$API_LOG" 2>&1 &
PIDS+=("$!")

if ! wait_for_api; then
  warn "Last lines from API log:"
  tail -n 30 "$API_LOG" >&2 || true
  die "API did not become healthy on port 3001."
fi
ok "API is healthy"

if [[ "$API_ONLY" -eq 1 ]]; then
  log ""
  ok "Vridhi API is running. Ctrl+C stops the API."
  log "Tail logs: tail -f .dev/backend.log"
  wait "${PIDS[@]}"
  exit 0
fi

log ""
ok "API running in the background. Expo uses this terminal (i/a/w work here)."
log "Tail API logs: tail -f .dev/backend.log"
log "${BOLD}Starting Expo…${RESET}"

cd "$ROOT/mobile"
case "$EXPO_LAUNCH" in
  ios) npx expo start --ios ;;
  android) npx expo start --android ;;
  web) npx expo start --web ;;
  *) npx expo start ;;
esac
