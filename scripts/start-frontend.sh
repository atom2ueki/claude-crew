#!/bin/bash

# Start the Claude Crew Frontend
# Runs on port 5173 by default (Vite)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT/frontend"

echo "Starting Claude Crew Frontend..."
echo "App will be available at http://localhost:5173"
echo ""

npm run dev
