#!/usr/bin/env bash
set -euo pipefail

# Resolve LAN IP (override with HOST_LAN_IP if needed)
HOST_LAN_IP=${HOST_LAN_IP:-}
if [ -z "${HOST_LAN_IP}" ]; then
  if command -v ip >/dev/null 2>&1; then
    HOST_LAN_IP=$(ip route get 1 | awk '{print $7; exit}')
  else
    echo "Please set HOST_LAN_IP=<your_lan_ip> and re-run" >&2
    exit 1
  fi
fi

# Required env
if [ -z "${BOT_TOKEN:-}" ]; then
  echo "BOT_TOKEN is required. Export it or put it into .env" >&2
  exit 1
fi

# Defaults
export GAME_SHORT_NAME=${GAME_SHORT_NAME:-snake}
export LOG_LEVEL=${LOG_LEVEL:-info}
export REDIS_PASSWORD=${REDIS_PASSWORD:-dev_redis_password}

# Compute GAME_URL reachable from Telegram client on your LAN
export GAME_URL=${GAME_URL:-http://${HOST_LAN_IP}:8080}

echo "Using HOST_LAN_IP=${HOST_LAN_IP}"
echo "Setting GAME_URL=${GAME_URL}"

docker compose up -d --build

echo "\nServices are up:"
echo "- Frontend:  http://${HOST_LAN_IP}:8080"
echo "- Bot (API): http://${HOST_LAN_IP}:3001 (proxied at /api by frontend)"
echo "\nIn @BotFather, set Game URL to: ${GAME_URL}"
echo "On your phone/desktop Telegram, open your game via your bot (/snake or inline)."
