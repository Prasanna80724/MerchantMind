# MerchantMind

Multi-user inventory management for merchants — products, suppliers, supply, inventory, sales, and auto-generated purchase orders.

## Environment setup

Configuration is loaded from environment files. **Never commit `.env` files** — they are gitignored.

### Backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your local or production values.

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | HTTP server port (default: `5000`) |
| `NODE_ENV` | No | `development` or `production` (default: `development`) |
| `DB_HOST` | **Yes** | MySQL host |
| `DB_PORT` | No | MySQL port (default: `3306`) |
| `DB_USER` | **Yes** | MySQL username |
| `DB_PASSWORD` | **Yes** | MySQL password |
| `DB_NAME` | **Yes** | MySQL database name |
| `JWT_SECRET` | **Yes** | Secret for signing JWT tokens |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: `1d`) |
| `EMAIL_HOST` | No | SMTP host (default: `smtp.gmail.com`) |
| `EMAIL_PORT` | No | SMTP port (default: `587`) |
| `EMAIL_USER` | No | SMTP username |
| `EMAIL_PASS` | No | SMTP password or app password |
| `UPLOAD_PATH` | No | Local upload directory (default: `uploads`) |
| `CORS_ORIGIN` | No | Allowed frontend origin (default: `http://localhost:5173`) |
| `CRON_LOW_STOCK_PO` | No | Cron schedule for low-stock PO job (default: `*/1 * * * *`) |
| `GEMINI_API_KEY` | **Yes** (for AI chat) | Google Gemini API key |
| `GEMINI_MODEL` | No | Gemini model id (default: `gemini-2.0-flash`) |
| `SCHEMA_CACHE_TTL_MS` | No | Schema cache TTL in ms (default: `3600000`) |
| `AI_QUERY_TIMEOUT_MS` | No | Max SQL execution time (default: `15000`) |
| `AI_MAX_RESULT_ROWS` | No | Max rows per query (default: `500`) |
| `AI_RATE_LIMIT_PER_MINUTE` | No | AI requests per user per minute (default: `20`) |

If a required variable is missing, the backend prints a clear error and exits:

```
Missing required environment variable(s):
  DB_PASSWORD
```

Configuration is centralized in `backend/config/env.js`.

### Frontend

The React app uses Vite env vars from the **project root**:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Backend API base URL (e.g. `http://localhost:5000/api`) |

Frontend config is centralized in `src/config/env.js`.

## Running locally

1. Create and configure both env files (above).
2. Apply the database schema / migrations as needed.
3. Start the backend:

   ```bash
   node backend/server.js
   ```

4. Start the frontend:

   ```bash
   npm run dev
   ```

5. Open the URL shown by Vite (typically `http://localhost:5173`).

## MerchantMind Assistant (floating widget)

The assistant appears as a **floating button** on every authenticated page. Tap it to open the chat panel; your conversation stays active as you move between Dashboard, Inventory, Sales, and other screens.

- **API:** `POST /api/ai/chat` (JWT), `GET /api/ai/suggestions`
- **Required:** `GEMINI_API_KEY` in `backend/.env`
- **Optional tuning:** `SCHEMA_CACHE_TTL_MS`, `AI_QUERY_TIMEOUT_MS`, `AI_MAX_RESULT_ROWS`, `AI_RATE_LIMIT_PER_MINUTE`

The `/ai-assistant` route redirects to the dashboard (the dedicated page was removed).

## Project structure

```
backend/
  config/env.js       # Centralized backend configuration
  config/db.js        # MySQL connection (uses env)
  config/auth.js      # JWT settings (uses env)
  server.js           # Express API server
  migrations/         # Database migrations (use env via migrationDb.mjs)
  services/ai/         # schemaService, sqlGenerator, sqlValidator, sqlExecutor, chatService

src/
  context/AssistantContext.jsx
  components/assistant/   # Floating widget UI
  components/ai/          # Shared insight cards & message rendering
```

## Security notes

- Do not hardcode credentials in source code.
- Use strong, unique `JWT_SECRET` values in production.
- Keep `backend/.env` and root `.env` out of version control.
- Share `backend/.env.example` and `.env.example` with your team instead.
