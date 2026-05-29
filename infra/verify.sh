#!/usr/bin/env bash
# Smoke-tests the deployed shinex.kz stack from inside the VPS.

set -u

echo "=== Container health ==="
sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo
echo "=== Internal API health (bypass Caddy) ==="
curl -sS http://127.0.0.1:4000/api/v1/health -m 5 || echo "  api unreachable on :4000 from host"

echo
echo "=== Public health via Caddy ==="
for url in https://shinex.kz/ https://shinex.kz/api/v1/health https://shinex.kz/admin https://www.shinex.kz/; do
  printf "%-44s " "$url"
  curl -sS -o /dev/null -w "%{http_code} (%{time_total}s)\n" -m 10 "$url" || echo "  request failed"
done

echo
echo "=== Caddy last 20 log lines ==="
sudo docker logs --tail 20 shinex_caddy 2>&1

echo
echo "=== API last 20 log lines ==="
sudo docker logs --tail 20 shinex_api 2>&1
