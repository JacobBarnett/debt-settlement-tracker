# Debt Settlement Progress Tracker

A small internal tool that tracks clients enrolled in a debt settlement program,
their progress toward settling their debt, and a projected payoff timeline.

## Why this project exists

I built this to demonstrate the ability to ramp up quickly on PHP and Go, coming
from a primarily React/TypeScript background, ahead of an interview for a role
using both languages.

The split into three services is deliberate. Rather than build the whole thing in
the stack I already know, I put the core CRUD API in **PHP/Laravel** and the
payoff calculation in a **Go** microservice, so there is real code in both
languages rather than a React app with a token backend.

## Architecture

```
┌─────────────────────────┐
│  React + TypeScript     │   Vite dev server :5173
│  (frontend/)            │
└───────┬─────────┬───────┘
        │         │
        │ CRUD    │ projections
        ▼         ▼
┌───────────────┐ ┌──────────────────┐
│ PHP 8.3       │ │ Go (stdlib only) │
│ Laravel 13    │ │ payoff-service   │
│ :8000         │ │ :8081            │
└───────┬───────┘ └──────────────────┘
        │
        ▼
   ┌─────────┐
   │ MySQL 8 │
   └─────────┘
```

| Service | Stack | Port | Responsibility |
| --- | --- | --- | --- |
| `frontend/` | React 19, TypeScript, Vite | 5173 | Dashboard UI, client table, add-client form, payoff modal |
| `debt-tracker-api/` | PHP 8.3, Laravel 13, MySQL 8 | 8000 | Client CRUD, validation, persistence |
| `payoff-service/` | Go 1.26, standard library only | 8081 | Payoff projection math |

The two backends do not talk to each other. The frontend is the only client of
both, which keeps each service independently runnable and testable.

## Prerequisites

Installed via Homebrew on macOS:

```bash
brew install php@8.3 composer go mysql@8.4
```

`php@8.3` and `mysql@8.4` are keg-only, so add them to your `PATH`:

```bash
export PATH="/usr/local/opt/php@8.3/bin:/usr/local/opt/mysql@8.4/bin:$PATH"
```

## Running all three services

Start MySQL once, then run each service in its own terminal tab.

### 0. MySQL (once per machine)

```bash
brew services start mysql@8.4
mysql -u root -e "CREATE DATABASE IF NOT EXISTS debt_tracker; CREATE DATABASE IF NOT EXISTS debt_tracker_test;"
```

### 1. PHP / Laravel API — http://localhost:8000

```bash
cd debt-tracker-api
composer install
cp .env.example .env      # first run only
php artisan key:generate  # first run only
php artisan migrate --seed
php artisan serve --port=8000
```

### 2. Go payoff service — http://localhost:8081

```bash
cd payoff-service
go run .
```

### 3. React frontend — http://localhost:5173

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Tests

```bash
cd debt-tracker-api && php artisan test   # 10 tests, PHPUnit
cd payoff-service   && go test ./...      # payoff + httpapi packages
```

The Laravel feature tests run against the `debt_tracker_test` MySQL database
(configured in `phpunit.xml`) rather than SQLite, so they exercise the same
engine, `ENUM` column, and `DECIMAL` behaviour as the running app.

## API reference

### Laravel — clients

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/api/clients` | List, newest first |
| POST | `/api/clients` | Validated by `StoreClientRequest` |
| GET | `/api/clients/{id}` | Single client |
| PUT/PATCH | `/api/clients/{id}` | Partial update via `UpdateClientRequest` |
| DELETE | `/api/clients/{id}` | 204 on success |

Responses are shaped by `ClientResource` and include the computed
`progress_percentage` and `remaining_balance` accessors, so the frontend never
recalculates progress itself.

### Go — payoff projection

```bash
curl -X POST http://localhost:8081/api/project-payoff \
  -H "Content-Type: application/json" \
  -d '{"enrolled_debt":18500,"settled_amount":4625,"monthly_payment":500}'
```

```json
{
  "months_remaining": 28,
  "estimated_payoff_date": "2028-12-19",
  "total_remaining": 13875,
  "schedule": [
    { "month": 1, "date": "2026-09-19", "projected_settled": 5125, "remaining_balance": 13375 }
  ]
}
```

Invalid plans return `422` with an `{"error": "..."}` body. `GET /health` returns
service status.

## Hosting the frontend standalone

The frontend is a plain Vite static build with no server-side rendering:

```bash
cd frontend
npm run build     # outputs to dist/
```

`vite.config.ts` sets `base: "./"` so the bundle works when served from a
sub-path (e.g. a `/debt-tracker` route on a portfolio site) rather than a domain
root. Both backend URLs are read from environment variables at build time:

```
VITE_CLIENTS_API_URL=https://your-laravel-host/api
VITE_PAYOFF_API_URL=https://your-go-host
```

Hosting the `dist/` output is enough to demo the UI; the PHP and Go services need
separate hosting (Render and Railway both have free tiers supporting each).

## What is implemented

- Client table with name, enrolled debt, settled amount, progress bar, and status badge
- Add-client form with inline, per-field validation errors surfaced from Laravel
- Client detail modal with a payoff projection from the Go service, an adjustable
  monthly payment, a month-by-month schedule, and a dependency-free SVG chart
- Portfolio totals across all clients
- Laravel: migration, `Client` model with `progress_percentage` accessor, Form
  Request validation, API Resource responses, `apiResource` routes, CORS scoped
  to the frontend origin, factory and seeder
- Go: standard-library HTTP service, calculation logic split into its own
  package, injected clock for deterministic tests, request size limits, strict
  JSON decoding, sentinel-error handling, and CORS with preflight support
- 10 PHPUnit tests and 7 Go tests

## What I would add next

- **Authentication** — Sanctum is already installed by `install:api`;
  `StoreClientRequest::authorize()` is the natural hook for a policy check
- **Redis caching** for the client list and repeated payoff projections
- **RabbitMQ-based async settlement processing**, so recording a settlement
  publishes an event rather than writing synchronously
- **More test coverage** — Go handler table tests across more input shapes,
  Laravel tests for pagination and filtering, and frontend component tests
- **Pagination and filtering** on `GET /api/clients` once the table grows
- **A demo/offline mode** for the static build so the portfolio deployment can
  render sample data without the backends running
