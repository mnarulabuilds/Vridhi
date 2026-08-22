#!/usr/bin/env bash
# Deploy the Vridhi API (Docker Compose) and/or the mobile app (EAS).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)
TARGET="all"
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_PATH="${DEPLOY_PATH:-~/vridhi}"
MOBILE_PLATFORM="${MOBILE_PLATFORM:-android}"
MOBILE_PROFILE="${MOBILE_PROFILE:-preview}"
SKIP_BUILD=0
NO_TLS=0
FORCE=0
API_URL_OVERRIDE="${EXPO_PUBLIC_API_URL:-}"

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
Deploy Vridhi with one command.

Usage:
  npm run deploy                  API + Android preview build
  npm run deploy:api              API only (Docker Compose)
  npm run deploy:mobile           Mobile only (EAS)
  npm run deploy -- init          Create .env.production with random secrets
  npm run deploy -- status        Show API container and health status

  ./scripts/deploy.sh [command] [options]

Commands:
  all       Deploy API, then start an EAS mobile build (default)
  api       Deploy the backend
  mobile    Build the Expo app
  init      Write .env.production if it is missing
  status    Print compose status and GET /health

Options:
  --host user@server     Copy the API to this host over SSH and deploy there
  --path DIR             Remote directory (default: ~/vridhi)
  --platform android|ios|all
  --profile preview|production|development
  --api-url URL          Public API URL baked into the mobile build
  --skip-build           Recreate containers without rebuilding images
  --no-tls               Do not start Caddy even if API_DOMAIN is set
  --force                Build mobile even if the API URL is localhost
  -h, --help

Environment:
  .env.production at the repo root (or backend/.env.production) supplies
  Postgres, JWT, and AI settings. Set API_DOMAIN for automatic HTTPS via
  Caddy. Set EXPO_PUBLIC_API_URL (or pass --api-url) for the mobile build.
  DEPLOY_HOST / DEPLOY_PATH work the same as --host / --path.

  npm run deploy skips the mobile build until a public API URL is set.
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing '$1'. $2"
}

env_get() {
  local key="$1" file="${2:-$ENV_FILE}"
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
}

compose_args() {
  local domain profile_args=()
  domain="$(normalize_domain "$(env_get API_DOMAIN)")"
  if [[ -n "$domain" && "$NO_TLS" -eq 0 ]]; then
    profile_args=(--profile tls)
  fi
  prepare_compose_env
  COMPOSE_CMD=("${COMPOSE[@]}" "${profile_args[@]}" --env-file "$COMPOSE_ENV_FILE")
}

wait_for_health() {
  local url="$1" tries=30
  log "Waiting for ${url} ..."
  for ((i = 1; i <= tries; i++)); do
    if curl -sf "$url" >/dev/null 2>&1; then
      ok "API healthy at ${url}"
      return 0
    fi
    sleep 2
  done
  die "API did not become healthy at ${url}. Check: docker compose -f docker-compose.yml -f docker-compose.prod.yml logs api"
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
  local password secret
  password="$(openssl rand -hex 32)"
  secret="$(openssl rand -hex 32)"
  sed \
    -e "s|POSTGRES_PASSWORD=change-me-to-a-long-random-password|POSTGRES_PASSWORD=${password}|" \
    -e "s|JWT_SECRET=change-me-to-a-long-random-secret|JWT_SECRET=${secret}|" \
    "$ROOT/.env.production.example" >"$dest"
  ok "Wrote ${dest} with random Postgres and JWT secrets"
  warn "Set API_DOMAIN and EXPO_PUBLIC_API_URL before a public deploy."
}

ensure_env() {
  find_env_file
  if [[ -z "$ENV_FILE" ]]; then
    warn "No .env.production found. Running init..."
    cmd_init
    find_env_file
  fi
  [[ -n "$ENV_FILE" && -f "$ENV_FILE" ]] || die "Could not create .env.production"
  local jwt password
  jwt="$(env_get JWT_SECRET)"
  password="$(env_get POSTGRES_PASSWORD)"
  if [[ -z "$jwt" || "$jwt" == change-me* ]]; then
    die "Set JWT_SECRET in ${ENV_FILE} (openssl rand -hex 32)."
  fi
  if [[ -z "$password" || "$password" == change-me* ]]; then
    die "Set POSTGRES_PASSWORD in ${ENV_FILE} (openssl rand -hex 32)."
  fi
  local ollama_url
  ollama_url="$(env_get OPENAI_BASE_URL)"
  if [[ "$ollama_url" == *127.0.0.1:11434* ]]; then
    warn "OPENAI_BASE_URL points at 127.0.0.1. Inside Docker use http://host.docker.internal:11434/v1"
  fi
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

deploy_api_local() {
  require_cmd docker "Install Docker Desktop, then start it."
  require_cmd curl "Install curl for the API health check."
  docker info >/dev/null 2>&1 || die "Docker is not running. Start Docker Desktop and retry."
  docker compose version >/dev/null 2>&1 || die "Need Docker Compose v2 (the docker compose plugin)."
  compose_args
  local up_args=(up -d)
  if [[ "$SKIP_BUILD" -eq 0 ]]; then
    up_args+=(--build)
  fi
  log "${BOLD}Deploying API with Docker Compose${RESET}"
  "${COMPOSE_CMD[@]}" "${up_args[@]}"
  local port
  port="$(env_get PORT)"
  port="${port:-3001}"
  wait_for_health "http://127.0.0.1:${port}/health"
  local domain
  domain="$(normalize_domain "$(env_get API_DOMAIN)")"
  if [[ -n "$domain" && "$NO_TLS" -eq 0 ]]; then
    ok "Caddy will serve https://${domain} (DNS A record must point at this machine)"
  else
    warn "API is bound to 127.0.0.1:${port}. Put Caddy/Nginx in front, or set API_DOMAIN for built-in TLS."
  fi
}

deploy_api_remote() {
  require_cmd ssh "Install OpenSSH to deploy to a remote host."
  require_cmd rsync "Install rsync to copy the API to ${DEPLOY_HOST}."
  log "${BOLD}Deploying API to ${DEPLOY_HOST}:${DEPLOY_PATH}${RESET}"
  ssh -o BatchMode=yes "$DEPLOY_HOST" "mkdir -p ${DEPLOY_PATH}" \
    || die "Cannot SSH to ${DEPLOY_HOST}. Use an SSH key and try: ssh ${DEPLOY_HOST}"
  compose_args
  rsync -az --delete \
    --exclude node_modules \
    --exclude .git \
    --exclude dist \
    --exclude coverage \
    --exclude .expo \
    --exclude mobile \
    --exclude backend/.env \
    --exclude '.env' \
    --exclude '.env.production' \
    --exclude 'backend/.env.production' \
    --exclude '*.log' \
    "$ROOT/" "$DEPLOY_HOST:${DEPLOY_PATH}/"
  rsync -az "$COMPOSE_ENV_FILE" "$DEPLOY_HOST:${DEPLOY_PATH}/.env.production"
  local profile_arg=""
  local domain
  domain="$(normalize_domain "$(env_get API_DOMAIN)")"
  if [[ -n "$domain" && "$NO_TLS" -eq 0 ]]; then
    profile_arg="--profile tls"
  fi
  local build_flag="--build"
  if [[ "$SKIP_BUILD" -eq 1 ]]; then
    build_flag=""
  fi
  ssh "$DEPLOY_HOST" "bash -s" <<EOF
set -euo pipefail
cd ${DEPLOY_PATH}
docker compose -f docker-compose.yml -f docker-compose.prod.yml ${profile_arg} --env-file .env.production up -d ${build_flag}
EOF
  local port
  port="$(env_get PORT)"
  port="${port:-3001}"
  log "Waiting for remote health check..."
  for ((i = 1; i <= 30; i++)); do
    if ssh "$DEPLOY_HOST" "curl -sf http://127.0.0.1:${port}/health" >/dev/null 2>&1; then
      ok "API healthy on ${DEPLOY_HOST}"
      if [[ -n "$domain" && "$NO_TLS" -eq 0 ]]; then
        ok "Point DNS for ${domain} at ${DEPLOY_HOST}, then https://${domain}/health"
      fi
      return 0
    fi
    sleep 2
  done
  die "Remote API did not become healthy. ssh ${DEPLOY_HOST} 'cd ${DEPLOY_PATH} && docker compose logs api'"
}

cmd_api() {
  ensure_env
  if [[ -n "$DEPLOY_HOST" ]]; then
    deploy_api_remote
  else
    deploy_api_local
  fi
}

cmd_mobile() {
  find_env_file
  require_cmd npx "Install Node.js 22+."
  local api_url
  api_url="$(public_api_url)"
  if [[ -z "$api_url" ]]; then
    die "Set EXPO_PUBLIC_API_URL in .env.production or pass --api-url https://your-api.example.com"
  fi
  if [[ "$api_url" == *localhost* || "$api_url" == *127.0.0.1* ]]; then
    if [[ "$FORCE" -eq 0 ]]; then
      die "Mobile builds cannot reach ${api_url} from a phone. Set a public HTTPS URL or pass --force."
    fi
    warn "Building with ${api_url}; physical devices will not reach this API."
  fi
  log "${BOLD}Building mobile (${MOBILE_PROFILE} / ${MOBILE_PLATFORM})${RESET}"
  log "EXPO_PUBLIC_API_URL=${api_url}"
  (
    cd "$ROOT/mobile"
    if ! npx --yes eas-cli whoami >/dev/null 2>&1; then
      die "Not logged in to Expo. Run: cd mobile && npx eas-cli login"
    fi
    EXPO_PUBLIC_API_URL="$api_url" npx --yes eas-cli build \
      --profile "$MOBILE_PROFILE" \
      --platform "$MOBILE_PLATFORM" \
      --non-interactive
  )
  ok "EAS build submitted. Install from the Expo URL when it finishes."
}

cmd_status() {
  find_env_file
  require_cmd docker "Install Docker Desktop, then start it."
  if [[ -n "$ENV_FILE" ]]; then
    compose_args
    "${COMPOSE_CMD[@]}" ps
    local port
    port="$(env_get PORT)"
    port="${port:-3001}"
    if curl -sf "http://127.0.0.1:${port}/health"; then
      printf '\n'
      ok "Health check passed"
    else
      printf '\n'
      warn "Health check failed on http://127.0.0.1:${port}/health"
    fi
  else
    docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    all | api | mobile | init | status)
      TARGET="$1"
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
      die "Unknown argument: $1 (try --help)"
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
    if [[ -z "$(public_api_url)" ]]; then
      warn "Skipping mobile: set EXPO_PUBLIC_API_URL or API_DOMAIN (or pass --api-url)."
    else
      cmd_mobile
    fi
    ;;
  *) die "Unknown command: $TARGET" ;;
esac
