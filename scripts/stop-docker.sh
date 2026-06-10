#!/bin/bash
echo "Stopping Chromium Docker container..."
cd "$(dirname "$0")/../docker"
docker compose down
echo "Container stopped."
