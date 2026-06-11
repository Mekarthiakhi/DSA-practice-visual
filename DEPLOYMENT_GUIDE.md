# AlgoVision IDE - Vercel Deployment Guide

## Overview
Complete guide to deploy AlgoVision IDE to Vercel with AI backend support.

## Prerequisites
- GitHub repository connected to Vercel
- OpenRouter API key (get from https://openrouter.ai)
- Node.js 18+

---

## Step 1: Set Up OpenRouter API

1. Visit https://openrouter.ai and sign up
2. Create API key in settings
3. Fund your account with credits (free tier available)
4. Copy your API key

---

## Step 2: Configure Vercel Environment Variables

### Frontend (.env.production)
Set these in Vercel Project Settings → Environment Variables:

```
VITE_API_URL=https://dsa-practice-visual.vercel.app/api
VITE_ENVIRONMENT=production
```

### Backend (Vercel Serverless Functions)
Set these in Vercel Project Settings → Environment Variables:

```
OPENROUTER_API_KEY=<your-openrouter-api-key>
CORS_ORIGINS=https://dsa-practice-visual.vercel.app
NODE_ENV=production
RATE_LIMIT_MAX=30
RATE_LIMIT_WINDOW=60000
```

---

## Step 3: Update Backend Configuration

The backend server (`server/src/index.ts`) is configured to:
- Read `OPENROUTER_API_KEY` from environment
- Support CORS from Vercel deployment domain
- Use Claude Sonnet 4 model for AI analysis
- Rate limit at 30 requests/minute

### Key Endpoints
- `GET /health` - Health check with AI configuration status
- `POST /api/analyze` - Code analysis (explain, complexity, optimize, flowchart)
- `POST /api/chat` - AI chat about code
- `POST /api/execute` - Code execution (sandboxed)

---

## Step 4: Deploy

### Option A: Deploy via Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

### Option B: Deploy via GitHub
1. Push changes to main branch
2. Vercel automatically deploys on git push
3. Verify deployment in Vercel dashboard

---

## Step 5: Verify Deployment

### Check Health Endpoint
```
https://dsa-practice-visual.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "2.0.0",
  "service": "AlgoVision IDE Backend",
  "aiConfigured": true
}
```

### Test AI Service
1. Open deployed app: https://dsa-practice-visual.vercel.app
2. Load any algorithm code
3. Click "🪄 Auto" → "Explain Code"
4. AI should provide analysis

---

## Step 6: Troubleshooting

### AI Service Returns 500 Error
**Cause:** OPENROUTER_API_KEY not configured
**Fix:** 
1. Go to Vercel Project Settings
2. Add OPENROUTER_API_KEY environment variable
3. Redeploy: Click "Deployments" → "Redeploy"

### CORS Errors in Console
**Cause:** Origin not in CORS_ORIGINS list
**Fix:**
1. Verify CORS_ORIGINS includes your Vercel domain
2. Check exact domain match (https vs http)
3. Redeploy after updating

### OpenRouter API Key Invalid
**Cause:** Expired or wrong API key
**Fix:**
1. Check OpenRouter dashboard for valid key
2. Update OPENROUTER_API_KEY in Vercel
3. Verify account has credits
4. Test with: `curl -H "Authorization: Bearer YOUR_KEY" https://openrouter.ai/api/v1/models`

### Rate Limit Exceeded
**Cause:** Too many API calls from same IP
**Fix:** Natural limit of 30 requests/minute - users will see "Rate limit exceeded" message after that

---

## Local Development

### Run Backend Locally
```bash
cd server
npm install
npm run dev
```

### Run Frontend Locally
```bash
npm install
npm run dev
```

### Test Full Stack
1. Backend running on http://localhost:3001
2. Frontend running on http://localhost:5173
3. Backend health: http://localhost:3001/health

---

## Performance Notes

- AI analysis requests: ~2-5 seconds (depends on OpenRouter load)
- Code execution: Sandboxed in demo mode, ~50ms response
- DSA visualizations: Instant with validation checks
- All sorting algorithms include input validation

---

## Support

For issues:
1. Check health endpoint: `/health`
2. Review backend logs in Vercel Deployments tab
3. Verify all environment variables are set
4. Check OpenRouter API status: https://openrouter.ai/status
