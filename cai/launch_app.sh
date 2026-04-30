#!/bin/bash
set -e

export PATH="$HOME/.local/node/bin:$HOME/.local/bin:$PATH"

# CML routes external traffic to CDSW_APP_PORT; bind Next.js directly to it.
export PORT="${CDSW_APP_PORT:-8080}"
export HOSTNAME="127.0.0.1"
export NODE_ENV="production"
export NEXT_TELEMETRY_DISABLED="1"

cd "$(dirname "$(readlink -f "$0")")/.."

echo "Starting Agent Workflow UI on port $PORT"
exec node .next/standalone/server.js
