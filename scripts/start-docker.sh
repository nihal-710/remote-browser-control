
#!/bin/bash
set -e

echo "Starting Chromium Docker container..."
cd "$(dirname "$0")/../docker"

# Stop existing container if running
docker compose down 2>/dev/null || true

# Build and start
docker compose up -d --build

# Wait for Chromium to be ready
echo "Waiting for Chromium to be ready..."
MAX_WAIT=30
COUNT=0
until curl -sf http://localhost:9222/json/version > /dev/null 2>&1; do
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $MAX_WAIT ]; then
        echo "ERROR: Chromium did not start within ${MAX_WAIT}s"
        docker compose logs
        exit 1
    fi
    sleep 1
done

echo "Chromium is ready at http://localhost:9222"
echo "CDP endpoint: $(curl -sf http://localhost:9222/json/version | grep -o '"webSocketDebuggerUrl":"[^"]*"' | head -1)"
