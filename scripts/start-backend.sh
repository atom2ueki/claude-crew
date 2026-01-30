#!/bin/bash

# Start the Claude Crew Backend
# Runs on port 3001 by default

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT/backend"

echo "Starting Claude Crew Backend..."
echo "Server will run on http://localhost:3001"
echo ""

npm run dev
