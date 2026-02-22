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

### `POST /v1/analyze-image`

Request: `multipart/form-data`

- `file`: image bytes
- `mimeType`: `image/jpeg` or `image/png`

Response (same accepted shapes as text analysis):

```json
{
  "items": []
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

### `POST /v1/files/upload`

Request: `multipart/form-data`

- `file`: file bytes
- `displayName`: string
- `mimeType`: string

Response:

```json
{
  "file": {
    "name": "files/abc123",
    "uri": "https://...",
    "mimeType": "application/pdf",
    "sizeBytes": 12345,
    "createTime": "2026-02-22T12:00:00Z",
    "expirationTime": "2026-02-24T12:00:00Z",
    "displayName": "My PDF",
    "state": "PROCESSING"
  }
}
```

### `GET /v1/files`

Response:

```json
{
  "files": [
    {
      "name": "files/abc123",
      "uri": "https://...",
      "mimeType": "application/pdf",
      "sizeBytes": 12345,
      "createTime": "2026-02-22T12:00:00Z",
      "expirationTime": "2026-02-24T12:00:00Z",
      "displayName": "My PDF",
      "state": "ACTIVE"
    }
  ]
}
```

### `GET /v1/files/{encodedName}`

Where `{encodedName}` is URL-encoded (e.g. `files%2Fabc123`).

Response:

```json
{
  "file": {
    "name": "files/abc123",
    "uri": "https://...",
    "mimeType": "application/pdf",
    "sizeBytes": 12345,
    "createTime": "2026-02-22T12:00:00Z",
    "expirationTime": "2026-02-24T12:00:00Z",
    "displayName": "My PDF",
    "state": "ACTIVE"
  }
}
```

### `DELETE /v1/files/{encodedName}`

Response: `200` or `204`.

## Security Requirements for Backend

- Keep Gemini/API keys **only on server**.
- Enforce CORS allowlist to your app origins.
- Add per-IP/user rate limiting.
- Validate payload size and sanitize input.
- Log only metadata, never full sensitive payloads.
- Return generic errors without internal stack traces.
