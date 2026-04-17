# x402 Web Search API

Paid web search API for AI agents. Wraps Google via Serper behind an x402 pay-gate.

## Endpoints

| Endpoint | Description | Price |
|---|---|---|
| `GET /search` | Web search with ranking | $0.01 |
| `GET /images` | Image search | $0.01 |
| `GET /videos` | Video search | $0.01 |
| `GET /news` | News search | $0.01 |
| `GET /site-search` | Site-restricted search | $0.01 |

## Deploy

### 1. Deploy backend to Railway

1. Push this repo to GitHub
2. Go to railway.app → New Project → Deploy from GitHub repo
3. Add environment variable: `SERPER_API_KEY=d50ffd839f1809ab62433fea7fe066e7f6165c95`
4. Railway assigns a public URL like `https://x402-search.up.railway.app`

### 2. Update gate.yaml

Replace `base_url` in `gate.yaml` with your real Railway URL.

### 3. Install pay-gate

```bash
# macOS/Linux
brew install pay-skill/tap/pay
cargo install pay-gate

# Or via npm
npm create pay-gate
```

### 4. Run pay-gate in front of your Railway app

Since Railway handles HTTPS, point pay-gate at it:

```bash
# Update gate.yaml proxy target to your Railway URL
# Then run:
pay-gate start --config gate.yaml
```

Or for a fully serverless deploy, use Cloudflare Worker mode:
```bash
npm create pay-gate -- --config gate.yaml --deploy cloudflare
```

### 5. Test the round-trip

```bash
# Install pay CLI
brew install pay-skill/tap/pay
pay init

# Test 402 → 200 round-trip
pay request "https://your-gate-url.com/search?q=bitcoin+price+today"
```

## Query Parameters

### /search
- `q` — search query (required)
- `region` — country code (default: us)
- `lang` — language code (default: en)
- `daterange` — qdr:d / qdr:w / qdr:m
- `offset` — pagination (default: 0)

### /images
- `q` — query (required)
- `region`, `lang`, `offset`

### /videos
- `q` — query (required)
- `region`, `lang`

### /news
- `q` — query (required)
- `lang`, `region`, `daterange`

### /site-search
- `q` — query (required)
- `domain` — domain to restrict to (required)
- `region`, `lang`, `offset`
