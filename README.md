# harbor-signals-lab

Node.js checkout service plus Prometheus. Local Docker Compose only. No Grafana. No cloud. No CI.

There are three faults. `docker compose up -d --build` starts the stack. Fix them so the checks below pass.

## Expected behaviour

- `GET /` returns `Harbor checkout is running` with HTTP 200.
- `GET /checkout` returns HTTP 200 `{"result":"paid"}`.
- `GET /checkout?fail=1` returns HTTP 500 `{"result":"failed"}` and increments `checkout_errors_total`.
- Increment `checkout_requests_total` on every checkout.
- `GET /metrics` uses `prom-client`.
- `GET /health` returns 200 `{"status":"ok"}`. The image `HEALTHCHECK` must call `http://localhost:8080/health`.
- A failed checkout logs one JSON line: `timestamp`, `level`, `request_id`, `message`. `level` is `error`.
- Cause one failure with `curl "http://localhost:8080/checkout?fail=1"`.
- `HighErrorRate` uses `rate(checkout_errors_total[1m]) > 0.1`, `for: 1m`, label `severity: warning`.
- Keep failing checkouts coming for 90 seconds, then open `http://localhost:9090/alerts`.

## Checks

```bash
docker compose up -d --build

curl -i http://localhost:8080/health

docker compose ps

curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8080/checkout?fail=1"

docker compose logs app | grep '"level":"error"'

end=$((SECONDS+90))
while [ $SECONDS -lt $end ]; do curl -s "http://localhost:8080/checkout?fail=1" >/dev/null; done
```

Within about 2 minutes, `http://localhost:9090/alerts` shows `HighErrorRate` firing with `severity="warning"`.
