# Vital Track AI Proxy

Secure backend proxy for Gemini calls. Keeps API keys server-side.

## 1) Setup

```bash
cd ai_proxy
cp .env.example .env
# edit .env with GEMINI_API_KEY and ALLOWED_ORIGINS
npm install
npm start
```

Default URL: `http://localhost:8080`

Health check:

```bash
curl http://localhost:8080/health
```

## 2) Flutter App Integration

Run/build the app with:

```bash
flutter run --dart-define=AI_PROXY_BASE_URL=http://localhost:8080
```

Production example:

```bash
flutter build web --dart-define=AI_PROXY_BASE_URL=https://your-proxy.example.com
```

## 3) Environment Variables

- `PORT` (default `8080`)
- `GEMINI_API_KEY` (**required**)
- `ALLOWED_ORIGINS` (comma-separated origins, e.g. `https://fnnktkygl-code.github.io`)
- `RATE_LIMIT_WINDOW_MS` (default `60000`)
- `RATE_LIMIT_MAX` (default `60`)

## 4) Exposed Routes

- `GET /health`
- `POST /v1/analyze-text`
- `POST /v1/analyze-image` (multipart)
- `POST /v1/chat`
- `POST /v1/files/upload` (multipart)
- `GET /v1/files`
- `GET /v1/files/{encodedName}`
- `DELETE /v1/files/{encodedName}`

Use [../docs/ai_proxy_contract.md](../docs/ai_proxy_contract.md) as the canonical request/response contract.
