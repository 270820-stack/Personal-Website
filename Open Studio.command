#!/bin/bash
cd "$(dirname "$0")"

PORT=8765
while lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

URL="http://127.0.0.1:${PORT}/index.html"

python3 -m http.server "$PORT" >/tmp/studio-server.log 2>&1 &
SERVER_PID=$!
sleep 0.4

if ! kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "Could not start the server. See /tmp/studio-server.log"
  read -r -p "Press Return to close."
  exit 1
fi

open "$URL"

echo "Studio is running at $URL"
echo "Room: http://127.0.0.1:${PORT}/room.html"
echo "Press Ctrl+C to stop."

trap 'kill "$SERVER_PID" 2>/dev/null; exit 0' INT TERM
wait "$SERVER_PID"
