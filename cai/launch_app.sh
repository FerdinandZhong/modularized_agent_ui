#!/bin/bash
set -e

export PATH="$HOME/.local/bin:$HOME/.local/node/bin:$PATH"
APP_PORT="${CDSW_APP_PORT:-8080}"
REPO_DIR="/home/cdsw/modularized_agent_ui"
NGINX_CONF="$REPO_DIR/cai/nginx.conf.rendered"

# Write nginx config with the actual port substituted
sed "s/__APP_PORT__/$APP_PORT/g" "$REPO_DIR/cai/nginx.conf" > "$NGINX_CONF"

# Start Next.js standalone server on port 3000
cd "$REPO_DIR"
NODE_ENV=production node .next/standalone/server.js &
NEXT_PID=$!

# Give Next.js a moment to start before nginx begins proxying
sleep 2

# Start nginx on CDSW_APP_PORT
nginx -c "$NGINX_CONF" -g "daemon off;" &
NGINX_PID=$!

echo "Next.js PID: $NEXT_PID  nginx PID: $NGINX_PID  port: $APP_PORT"

# Exit when either process dies
wait -n $NEXT_PID $NGINX_PID
