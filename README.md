# Telegoat Bot (Telegraf + Bun + TypeScript + Gemini + CMC Free)

> **Description:** The unofficial bot for **Telegoat**.  
> Modes: **Chat**, **Play a game**, **Latest Insights**.  
> Data source: **CoinMarketCap (free plan only)**.  
> Health endpoint: `GET /health` (Bun HTTP server).

---

## ✨ Features

- **/start menu** with inline buttons:
  - **💬 Chat** – AI chat about **Telegoat**, **TON**, and **crypto** (with practical **NFA tips**).
  - **🎮 Play a game** – One-at-a-time crypto quiz (Gemini JSON → regex → local fallback).
  - **📈 Latest Insights** – Global market snapshot (CMC free), top gainers (“trending”), TON quote, Fear & Greed (via CMC data-api if available), plus NFA tips.
- **Website context**: lightweight scrape of `https://telegoat.fun/` for factual grounding (cached 1h).
- **Strict topic scope**: Telegoat / TON / crypto. Politely refuses off-topic.
- **HTML-safe rendering**: no Telegram Markdown pitfalls.
- **Health endpoint**: `GET /health` for uptime checks and Docker `HEALTHCHECK`.
- **Minimal session**: Telegraf `session()` to persist mode across updates.
- **Prod-friendly Dockerfile** (Bun 1.2 alpine, non-root, healthcheck).

---

## 🧱 Tech Stack

- **Runtime:** Bun 1.2 (TypeScript first-class)
- **Bot Framework:** Telegraf
- **LLM:** Google **Gemini 1.5-flash** (`@google/generative-ai`)
- **Market Data:** CoinMarketCap **free plan** (`/v1/global-metrics/quotes/latest`, `/v1/cryptocurrency/listings/latest`, `/v2/cryptocurrency/quotes/latest?symbol=TON`)
- **Scraping:** `cheerio`
- **HTTP health:** native `Bun.serve`

---

## 📂 Project Structure

```
telegoat-bot/
├─ .env.example
├─ bunfig.toml
├─ tsconfig.json
├─ package.json
└─ src/
   ├─ index.ts           # Telegraf bot bootstrap + session + launch + health server
   ├─ http.ts            # Bun HTTP server exposing GET /health
   ├─ config.ts          # env loading + assertions
   ├─ prompts.ts         # SYSTEM_CHAT, SYSTEM_INSIGHTS, SYSTEM_QUIZ (JSON schema)
   ├─ types.ts           # Mode/session/context types
   │
   ├─ services/
   │  ├─ gemini.ts       # text + strict JSON generation helpers
   │  ├─ insights.ts     # CMC free endpoints + (optional) CMC data-api Fear & Greed
   │  └─ scrape.ts       # telegoat.fun text scrape (1h in-memory cache)
   │
   ├─ handlers/
   │  ├─ start.ts        # /start + inline menu
   │  ├─ chat.ts         # Chat mode (no TG/X CTAs here)
   │  ├─ quiz.ts         # Quiz mode with JSON → regex → local fallback
   │  └─ insights.ts     # Insights mode (keeps TG/X CTAs)
   │
   └─ ui/
      ├─ keyboards.ts    # start/back menus + CTAs (used only in Insights)
      └─ format.ts       # HTML escape + pretty USD/% + bullet helper
```

---

## 🔐 Environment Variables

Copy `.env.example` → `.env` and fill:

```env
# Telegram
BOT_TOKEN=123456:ABC-DEF

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# CoinMarketCap (free-tier)
CMC_API_KEY=your_cmc_pro_api_key
CMC_API_BASE=https://pro-api.coinmarketcap.com
CMC_DATA_API_BASE=https://api.coinmarketcap.com/data-api

# Health server
PORT=8080
```

**Notes**
- CMC **must** use the `pro-api` base and header `X-CMC_PRO_API_KEY`.
- Fear & Greed via `CMC_DATA_API_BASE` is best-effort (public data-api). If it fails, we display “N/A”.

---

## ▶️ Run Locally (Dev)

```bash
bun install
cp .env.example .env    # edit values
bun run --watch src/index.ts
```

- Open Telegram → DM your bot → `/start`
- Health check: `curl http://localhost:8080/health`

---

## 🧪 NPM Scripts

```bash
bun run dev        # watch mode
bun run start      # start once
bun run build      # type-check (tsc) only
```

---

## 🐳 Docker (Production with Healthcheck)

**Dockerfile (Bun 1.2 + health):** already included.

Build & run:

```bash
docker build -t telegoat-bot:prod .
docker run --rm -p 8080:8080   -e BOT_TOKEN=xxx   -e GEMINI_API_KEY=xxx   -e CMC_API_KEY=xxx   telegoat-bot:prod
```

Health:

```bash
curl -s http://localhost:8080/health
```

**.dockerignore (included):**
```
.git
node_modules
dist
.env
.env.*
*.log
Dockerfile
README.md
```

---

## 🤖 Bot UX & Modes

### /start
- Shows three inline buttons:
  - **💬 Chat** → enters Chat mode.
  - **🎮 Play a game** → starts Quiz.
  - **📈 Latest Insights** → pulls market data and returns a compact brief.

### Chat
- Scope: **Telegoat / TON / crypto** only (links suggested when relevant).
- Includes practical **NFA** trading hygiene (position sizing, stops, DYOR, liquidity, catalysts).
- **No TG/X buttons** here (clean chat UI).

### Quiz
- Gemini returns **strict JSON**:
  ```json
  {
    "q": "string",
    "options": ["A","B","C","D"],
    "answerIndex": 0,
    "hint": "optional"
  }
  ```
- Fallbacks:
  1) JSON parse
  2) Regex parse (`Q: ... A) ... B) ... C) ... D) ... Answer: A`)
  3) **Local questions bank** (ensures no dead ends)
- UI: A/B/C/D inline buttons + **Skip** + **Back**.

### Latest Insights
- **CMC Free**:
  - `/v1/global-metrics/quotes/latest` → total market cap, BTC dominance, active cryptos
  - `/v1/cryptocurrency/listings/latest?limit=200` → sorted locally by 24h % for “Trending”
  - `/v2/cryptocurrency/quotes/latest?symbol=TON` → TON price/mcap/24h
- **Fear & Greed**: `data-api` best-effort; otherwise “N/A”.
- Adds **Telegoat TG / X** CTAs only in this mode.

---

## 🛡️ Robustness & Safety

- **HTML parse mode** + escaping: prevents Telegram “can’t parse entities” errors.
- **Graceful CMC failures**: partial data instead of crashes; user sees a friendly message if auth fails.
- **Session**: Telegraf `session()` keeps mode across updates (fixes “chat not responding” issue).
- **Global bot catcher**: logs and replies a generic error if something unexpected happens.

---

## 🔧 Common Issues

- `401 CMC`: check `.env`, restart the process, verify with:
  ```bash
  curl -H "X-CMC_PRO_API_KEY: $CMC_API_KEY"     "https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest"
  ```
- `400 Telegram parse`: you’re safe—HTML escaping is enforced everywhere.
- Chat not replying: ensure `session()` middleware is enabled and you used the **Chat** button before sending text.

---

## ➕ Extending Quickly

- **Add a command**: create a handler in `src/handlers/` and register in `index.ts`.
- **More insights**: extend `services/insights.ts` with additional **free** CMC endpoints and format in `handlers/insights.ts`.
- **Webhooks**: switch from polling by adding `setWebhook`, expose `PORT`, and use your existing `http.ts` server.

---

## 📜 License

MIT — ship it for the hackathon and have fun 🐐

---

## 🙌 Credits

- Telegoat: <https://telegoat.fun/>  
- Telegram Bot API via Telegraf  
- Market data via CoinMarketCap (free plan)  
- LLM via Google Gemini 1.5-flash
