#!/usr/bin/env bash
# Deploy the Vridhi API to Render, or the mobile app with EAS.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TARGET="api"
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_PATH="${DEPLOY_PATH:-~/vridhi}"
MOBILE_PLATFORM="${MOBILE_PLATFORM:-android}"
MOBILE_PROFILE="${MOBILE_PROFILE:-preview}"
SKIP_BUILD=0
NO_TLS=0
FORCE=0
WAIT_EAS=0
LOCAL_API=0
LAN_PROXY_PORT="${LAN_PROXY_PORT:-8787}"
API_URL_OVERRIDE="${EXPO_PUBLIC_API_URL:-}"
ENV_FILE=""
RENDER_SERVICE_ID="${RENDER_SERVICE_ID:-}"

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
warn() { printf '%s!%s %s\n' "$YELLOW" "$RESET" "$*"; }
die() { printf '%s✗%s %s\n' "$RED" "$RESET" "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Deploy Vridhi.

Usage:
  npm run deploy                  Backend on Render
  npm run deploy:mobile           Android APK (EAS) using the Render API URL
  npm run deploy:status           GET /health on the Render URL
  npm run deploy:init             Create .env.production if missing

  ./scripts/deploy.sh [command] [options]

Commands:
  api       Deploy the backend (Render by default)
  mobile    Build the Expo app against EXPO_PUBLIC_API_URL
  status    Health-check the public API
  init      Write .env.production if it is missing

Options:
  --local                Run the API with Docker Compose on this machine
  --host user@server     Copy the API over SSH and run Compose there
  --platform android|ios|all
  --profile preview|production|development
  --api-url URL          Override EXPO_PUBLIC_API_URL for this mobile build
  --wait                 Wait for the EAS build to finish
  --force                Allow a localhost API URL in a mobile build
  -h, --help

  First time on Render: create the Web Service + Postgres (or apply render.yaml),
  set DATABASE_URL (Internal URL, not localhost) and JWT_SECRET, then:
    brew install render && render login
    npm run deploy

  Then separately:
    npm run deploy:mobile
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing '$1'. $2"
}

env_get() {
  local key="$1" file="${2:-${ENV_FILE:-}}"
  [[ -f "$file" ]] || return 0
  local line val
  line="$(grep -E "^${key}=" "$file" 2>/dev/null | tail -n 1 || true)"
  [[ -n "$line" ]] || return 0
  val="${line#*=}"
  val="${val%$'\r'}"
  if [[ "${val:0:1}" == '"' && "${val: -1}" == '"' ]]; then
    val="${val:1:${#val}-2}"
  elif [[ "${val:0:1}" == "'" && "${val: -1}" == "'" ]]; then
    val="${val:1:${#val}-2}"
  fi
  printf '%s' "$val"
}

find_env_file() {
  if [[ -f "$ROOT/.env.production" ]]; then
    ENV_FILE="$ROOT/.env.production"
  elif [[ -f "$ROOT/backend/.env.production" ]]; then
    ENV_FILE="$ROOT/backend/.env.production"
  else
    ENV_FILE=""
  fi
}

normalize_domain() {
  local value="${1:-}"
  value="${value#https://}"
  value="${value#http://}"
  value="${value%/}"
  printf '%s' "$value"
}

public_api_url() {
  if [[ -n "$API_URL_OVERRIDE" ]]; then
    printf '%s' "${API_URL_OVERRIDE%/}"
    return 0
  fi
  local from_env domain
  from_env="$(env_get EXPO_PUBLIC_API_URL)"
  if [[ -n "$from_env" ]]; then
    printf '%s' "${from_env%/}"
    return 0
  fi
  domain="$(normalize_domain "$(env_get API_DOMAIN)")"
  if [[ -n "$domain" ]]; then
    printf 'https://%s' "$domain"
    return 0
  fi
  printf ''
}

wait_for_health() {
  local url="$1" tries="${2:-45}"
  log "Waiting for ${url} ..."
  for ((i = 1; i <= tries; i++)); do
    if curl -sf "$url" >/dev/null 2>&1; then
      ok "API healthy at ${url}"
      return 0
    fi
    sleep 2
  done
  die "API did not become healthy at ${url}."
}

write_mobile_api_url() {
  local api_url="$1"
  printf 'EXPO_PUBLIC_API_URL=%s\n' "$api_url" >"$ROOT/mobile/.env"
  EXPO_PUBLIC_API_URL="$api_url" MOBILE_PROFILE="$MOBILE_PROFILE" node <<'NODE'
const fs = require('fs');
const path = require('path');
const url = process.env.EXPO_PUBLIC_API_URL;
const profile = process.env.MOBILE_PROFILE || 'preview';
const file = path.join('mobile', 'eas.json');
const eas = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!eas.build || !eas.build[profile]) {
  throw new Error('Unknown EAS profile: ' + profile);
}
eas.build[profile].env = Object.assign({}, eas.build[profile].env, {
  EXPO_PUBLIC_API_URL: url,
});
if (eas.build.production) {
  eas.build.production.env = Object.assign({}, eas.build.production.env, {
    EXPO_PUBLIC_API_URL: url,
  });
}
fs.writeFileSync(file, JSON.stringify(eas, null, 2) + '\n');
NODE
  ok "Wrote Render API URL into mobile/.env and mobile/eas.json"
}

cmd_init() {
  find_env_file
  if [[ -n "$ENV_FILE" ]]; then
    ok "Using existing ${ENV_FILE}"
    return 0
  fi
  local dest="$ROOT/.env.production"
  [[ -f "$ROOT/.env.production.example" ]] || die "Missing .env.production.example"
  require_cmd openssl "Install OpenSSL to generate secrets."
  local secret
  secret="$(openssl rand -hex 32)"
  sed \
    -e "s|JWT_SECRET=change-me-to-a-long-random-secret|JWT_SECRET=${secret}|" \
    "$ROOT/.env.production.example" >"$dest"
  ok "Wrote ${dest}"
  warn "Set API_DOMAIN / EXPO_PUBLIC_API_URL to your Render URL (https://your-service.onrender.com)."
}

# --- Render ---

require_render_cli() {
  if ! command -v render >/dev/null 2>&1; then
    die "Install the Render CLI (brew install render), then run: render login"
  fi
  if [[ -z "${RENDER_API_KEY:-}" ]]; then
    if ! render whoami >/dev/null 2>&1; then
      die "Not logged in to Render. Run: render login"
    fi
  fi
}

resolve_render_service_id() {
  find_env_file
  if [[ -z "$RENDER_SERVICE_ID" ]]; then
    RENDER_SERVICE_ID="$(env_get RENDER_SERVICE_ID)"
  fi
  if [[ -n "$RENDER_SERVICE_ID" ]]; then
    printf '%s' "$RENDER_SERVICE_ID"
    return 0
  fi
  local name domain json
  name="$(env_get RENDER_SERVICE_NAME)"
  name="${name:-vridhi-api}"
  domain="$(normalize_domain "$(env_get API_DOMAIN)")"
  json="$(render services -o json 2>/dev/null || true)"
  [[ -n "$json" ]] || die "Could not list Render services. Run: render login"
  RENDER_SERVICE_NAME="$name" RENDER_API_DOMAIN="$domain" node -e '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
const list = Array.isArray(data) ? data : (data.items || data.services || data.data || []);
const name = process.env.RENDER_SERVICE_NAME;
const domain = process.env.RENDER_API_DOMAIN;
const hit = list.find((s) => {
  const id = String(s.id || "");
  const n = String(s.name || s.slug || "");
  const url = String(s.url || s.serviceDetails && s.serviceDetails.url || "");
  return n === name || (domain && (url.indexOf(domain) !== -1 || n === domain.replace(/\.onrender\.com$/, "")));
});
if (!hit || !hit.id) {
  process.exit(2);
}
process.stdout.write(String(hit.id));
' <<<"$json" || die "No Render web service found. Set RENDER_SERVICE_ID=srv-... in .env.production (Dashboard → service → Settings → ID)."
}

deploy_api_render() {
  require_cmd curl "Install curl for the API health check."
  require_render_cli
  find_env_file
  local service_id api_url
  service_id="$(resolve_render_service_id)"
  api_url="$(public_api_url)"
  [[ -n "$api_url" ]] || die "Set EXPO_PUBLIC_API_URL or API_DOMAIN in .env.production to https://your-service.onrender.com"
  log "${BOLD}Deploying API on Render (${service_id})${RESET}"
  render deploys create "$service_id" --wait --confirm
  wait_for_health "${api_url}/health" 90
  write_mobile_api_url "$api_url"
  ok "Backend is live at ${api_url}"
  log "Next: npm run deploy:mobile"
}

# --- Local Docker (optional) ---

urlencode() {
  node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$1"
}

prepare_compose_env() {
  local user password db existing
  existing="$(env_get DATABASE_URL)"
  user="$(env_get POSTGRES_USER)"
  password="$(env_get POSTGRES_PASSWORD)"
  db="$(env_get POSTGRES_DB)"
  user="${user:-postgres}"
  db="${db:-vridhi}"
  COMPOSE_ENV_FILE="$(mktemp)"
  trap 'rm -f "${COMPOSE_ENV_FILE:-}"' EXIT
  cp "$ENV_FILE" "$COMPOSE_ENV_FILE"
  if [[ -z "$existing" ]]; then
    printf '\nDATABASE_URL=postgresql://%s:%s@postgres:5432/%s?schema=public\n' \
      "$(urlencode "$user")" "$(urlencode "$password")" "$(urlencode "$db")" >>"$COMPOSE_ENV_FILE"
  fi
  printf 'API_BIND=0.0.0.0\n' >>"$COMPOSE_ENV_FILE"
}

compose_args() {
  prepare_compose_env
  COMPOSE_CMD=(docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file "$COMPOSE_ENV_FILE")
}

port_in_use() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | awk 'NR>1 {print $1, $2, $9}' | head -5 || true
}

detect_lan_ip() {
  ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true
}

start_lan_proxy() {
  local target_port="${1:-3001}"
  local pidfile="$ROOT/.lan-proxy.pid"
  if [[ -f "$pidfile" ]]; then
    local oldpid
    oldpid="$(cat "$pidfile" 2>/dev/null || true)"
    if [[ -n "$oldpid" ]] && kill -0 "$oldpid" 2>/dev/null; then
      ok "LAN proxy already running on port ${LAN_PROXY_PORT}"
      return 0
    fi
  fi
  VRIDHI_PROXY_TARGET="$target_port" VRIDHI_PROXY_PORT="$LAN_PROXY_PORT" \
    nohup node "$ROOT/scripts/lan-proxy.js" >/tmp/vridhi-lan-proxy.log 2>&1 &
  echo $! >"$pidfile"
  sleep 0.4
  if curl -sf "http://127.0.0.1:${LAN_PROXY_PORT}/health" >/dev/null; then
    ok "LAN proxy on port ${LAN_PROXY_PORT} -> ${target_port}"
  else
    warn "LAN proxy started but /health did not respond yet. See /tmp/vridhi-lan-proxy.log"
  fi
}

deploy_api_local() {
  find_env_file
  require_cmd docker "Install Docker Desktop, then start it."
  require_cmd curl "Install curl for the API health check."
  docker info >/dev/null 2>&1 || die "Docker is not running. Start Docker Desktop and retry."
  local jwt password port
  jwt="$(env_get JWT_SECRET)"
  password="$(env_get POSTGRES_PASSWORD)"
  if [[ -z "$jwt" || "$jwt" == change-me* ]]; then
    die "Set JWT_SECRET in ${ENV_FILE} (openssl rand -hex 32)."
  fi
  if [[ -z "$password" || "$password" == change-me* ]]; then
    die "Set POSTGRES_PASSWORD in ${ENV_FILE} (openssl rand -hex 32)."
  fi
  port="$(env_get PORT)"
  port="${port:-3001}"
  compose_args
  local up_args=(up -d)
  if [[ "$SKIP_BUILD" -eq 0 ]]; then
    up_args+=(--build)
  fi
  log "${BOLD}Deploying API with Docker Compose (local)${RESET}"
  "${COMPOSE_CMD[@]}" "${up_args[@]}"
  wait_for_health "http://127.0.0.1:${port}/health"
  start_lan_proxy "$port"
  local lan
  lan="$(detect_lan_ip)"
  if [[ -n "$lan" ]]; then
    ok "Phone URL: http://${lan}:${LAN_PROXY_PORT}"
  fi
}

deploy_api_remote() {
  find_env_file
  require_cmd ssh "Install OpenSSH to deploy to a remote host."
  require_cmd rsync "Install rsync to copy the API to ${DEPLOY_HOST}."
  compose_args
  log "${BOLD}Deploying API to ${DEPLOY_HOST}:${DEPLOY_PATH}${RESET}"
  ssh -o BatchMode=yes "$DEPLOY_HOST" "mkdir -p ${DEPLOY_PATH}" \
    || die "Cannot SSH to ${DEPLOY_HOST}. Use an SSH key and try: ssh ${DEPLOY_HOST}"
  rsync -az --delete \
    --exclude node_modules --exclude .git --exclude dist --exclude coverage \
    --exclude .expo --exclude mobile --exclude backend/.env \
    --exclude '.env' --exclude '.env.production' --exclude 'backend/.env.production' \
    --exclude '*.log' \
    "$ROOT/" "$DEPLOY_HOST:${DEPLOY_PATH}/"
  rsync -az "$COMPOSE_ENV_FILE" "$DEPLOY_HOST:${DEPLOY_PATH}/.env.production"
  ssh "$DEPLOY_HOST" "bash -s" <<EOF
set -euo pipefail
cd ${DEPLOY_PATH}
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d --build
EOF
  ok "Compose started on ${DEPLOY_HOST}"
}

cmd_api() {
  if [[ -n "$DEPLOY_HOST" ]]; then
    deploy_api_remote
  elif [[ "$LOCAL_API" -eq 1 ]]; then
    deploy_api_local
  else
    deploy_api_render
  fi
}

cmd_mobile() {
  find_env_file
  require_cmd npx "Install Node.js 22+."
  local api_url
  api_url="$(public_api_url)"
  if [[ -z "$api_url" ]]; then
    die "Set EXPO_PUBLIC_API_URL in .env.production to your Render URL (https://your-service.onrender.com)"
  fi
  if [[ "$api_url" == *localhost* || "$api_url" == *127.0.0.1* ]]; then
    if [[ "$FORCE" -eq 0 ]]; then
      die "Mobile builds cannot reach ${api_url} from a phone. Use the Render HTTPS URL."
    fi
    warn "Building with ${api_url}; physical devices will not reach this API."
  fi
  write_mobile_api_url "$api_url"
  log "${BOLD}Building mobile (${MOBILE_PROFILE} / ${MOBILE_PLATFORM})${RESET}"
  log "EXPO_PUBLIC_API_URL=${api_url}"
  (
    cd "$ROOT/mobile"
    if ! npx --yes eas-cli whoami >/dev/null 2>&1; then
      die "Not logged in to Expo. Run: cd mobile && npx eas-cli login"
    fi
    eas_args=(build --profile "$MOBILE_PROFILE" --platform "$MOBILE_PLATFORM" --non-interactive)
    if [[ "$WAIT_EAS" -eq 0 ]]; then
      eas_args+=(--no-wait)
    fi
    EXPO_PUBLIC_API_URL="$api_url" npx --yes eas-cli "${eas_args[@]}"
  )
  ok "EAS build submitted. Install from the Expo URL when it finishes."
}

cmd_status() {
  find_env_file
  require_cmd curl "Install curl for the API health check."
  local api_url
  api_url="$(public_api_url)"
  if [[ -z "$api_url" ]]; then
    die "Set EXPO_PUBLIC_API_URL or API_DOMAIN in .env.production."
  fi
  log "Checking ${api_url}/health"
  if curl -sf "${api_url}/health"; then
    printf '\n'
    ok "Health check passed"
  else
    die "Health check failed for ${api_url}/health"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    all | api | mobile | init | status)
      TARGET="$1"
      shift
      ;;
    preview | production | development)
      MOBILE_PROFILE="$1"
      shift
      ;;
    --local)
      LOCAL_API=1
      shift
      ;;
    --wait)
      WAIT_EAS=1
      shift
      ;;
    --host)
      DEPLOY_HOST="${2:-}"
      [[ -n "$DEPLOY_HOST" ]] || die "--host needs user@server"
      shift 2
      ;;
    --path)
      DEPLOY_PATH="${2:-}"
      [[ -n "$DEPLOY_PATH" ]] || die "--path needs a directory"
      shift 2
      ;;
    --platform)
      MOBILE_PLATFORM="${2:-}"
      shift 2
      ;;
    --profile)
      MOBILE_PROFILE="${2:-}"
      shift 2
      ;;
    --api-url)
      API_URL_OVERRIDE="${2:-}"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    --no-tls)
      NO_TLS=1
      shift
      ;;
    --force)
      FORCE=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1 (try --help). If you meant an EAS profile, use: npm run deploy:mobile -- --profile $1"
      ;;
  esac
done

case "$TARGET" in
  init) cmd_init ;;
  status) cmd_status ;;
  api) cmd_api ;;
  mobile) cmd_mobile ;;
  all)
    cmd_api
    log "Backend done. Run npm run deploy:mobile separately to build the APK."
    ;;
  *) die "Unknown command: $TARGET" ;;
esac
