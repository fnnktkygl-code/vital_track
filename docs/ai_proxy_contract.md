# AI Proxy Contract (Recommended)

To avoid exposing API keys in the client, configure a backend proxy and set:

`--dart-define=AI_PROXY_BASE_URL=https://your-secure-api.example.com`

When this variable is set, `AIService` routes **text analysis** and **chat** to your backend.

## Endpoints

### `POST /v1/analyze-text`

Request:

```json
{
  "query": "is white rice okay?"
}
```

Response (either shape is accepted):

```json
{
  "items": [
    {
      "name": "White rice"
    }
  ]
}
```

or

```json
{
  "data": {
    "items": []
  }
}
```

### `POST /v1/chat`

Request:

```json
{
  "query": "What should I eat today?",
  "profile": {
    "name": "User",
    "goals": ["detox"],
    "restrictions": ["gluten"],
    "bodyType": "",
    "fastingExperience": "beginner"
  },
  "context": [
    {
      "title": "Dr. Sebi — Nutritional Guide",
      "type": "text",
      "chunks": ["..."]
    }
  ],
  "history": [
    {
      "isUser": true,
      "text": "..."
    }
  ]
}
```

Response (any of these keys is accepted):

```json
{
  "text": "Your answer..."
}
```

or

```json
{
  "reply": "Your answer..."
}
```

## Security Requirements for Backend

- Keep Gemini/API keys **only on server**.
- Enforce CORS allowlist to your app origins.
- Add per-IP/user rate limiting.
- Validate payload size and sanitize input.
- Log only metadata, never full sensitive payloads.
- Return generic errors without internal stack traces.
