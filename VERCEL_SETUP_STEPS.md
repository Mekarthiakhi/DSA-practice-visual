# Vercel Environment Setup - Quick Guide

## 🔑 Step 1: Get Your OpenRouter API Key

1. Visit **https://openrouter.ai**
2. Sign up or log in to your account
3. Go to **Settings** → **API Keys**
4. Click **"Create New API Key"**
5. Copy the key (looks like: `sk-or-xxxxxxxxxxxx`)
6. **Keep it safe** - don't share or commit to git

---

## 🚀 Step 2: Add Environment Variables to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to **https://vercel.com/dashboard**
2. Click on your project: **dsa-practice-visual**
3. Click **Settings** tab (top navigation)
4. In left sidebar, click **Environment Variables**
5. Click **"Add New"** button
6. Fill in the form:
   ```
   Name:  OPENROUTER_API_KEY
   Value: sk-or-xxxxxxxxxxxx (your actual key)
   ```
7. Check **Production** checkbox (and Preview if desired)
8. Click **"Save"**

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Link your project
vercel link

# Add environment variable
vercel env add OPENROUTER_API_KEY

# When prompted, paste your API key
# Select which environments: Production (recommended)
```

---

## 🔄 Step 3: Redeploy Your Project

### Option A: Via Dashboard
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **"..."** menu (3 dots)
4. Select **"Redeploy"**
5. Click **"Redeploy"** button to confirm

### Option B: Via Git Push
```bash
git push origin main
# Vercel automatically redeploys on git push
```

### Option C: Via Vercel CLI
```bash
vercel --prod
```

---

## ✅ Step 4: Verify Deployment

Once redeployed, test the health endpoint:

```bash
curl https://dsa-practice-visual.vercel.app/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "version": "2.0.0",
  "service": "AlgoVision IDE Backend",
  "aiConfigured": true
}
```

If `"aiConfigured": false` → API key not loaded, check settings and redeploy again.

---

## 🧪 Step 5: Test AI Service

1. Open **https://dsa-practice-visual.vercel.app**
2. Load any algorithm code (e.g., from LeetCode problems)
3. Click **"🪄 Auto"** button (top right)
4. Select **"Explain Code"**
5. Wait 2-5 seconds for AI analysis

✅ If explanation appears → **AI service working!**  
❌ If error appears → Check health endpoint and verify API key

---

## 🔒 Security Notes

- **Never commit** your API key to git
- **Use .gitignore** for local `.env` files
- **Rotate keys** if accidentally exposed
- **Monitor usage** at https://openrouter.ai/account (check credits)
- **Set spending limit** in OpenRouter settings if desired

---

## 💰 OpenRouter Billing

- Free tier: Limited requests (check your account)
- Paid tier: Pay-as-you-go ($0.01 - $1 per request depending on model)
- Claude Sonnet 4 (used here): ~$0.003 per request
- Monitor usage in OpenRouter dashboard

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| API key not loading | Redeploy after adding env var |
| Still shows `"aiConfigured": false` | Verify key value is correct (starts with `sk-or-`) |
| CORS errors | Check CORS_ORIGINS includes your domain |
| Rate limit exceeded | Wait 1 minute or upgrade OpenRouter plan |
| "No response from AI" | Check OpenRouter account has credits |

---

## 📝 Environment Variables Checklist

For production deployment, ensure these are set in Vercel:

```
✓ OPENROUTER_API_KEY     (required for AI)
✓ CORS_ORIGINS           (should be: https://dsa-practice-visual.vercel.app)
✓ NODE_ENV               (should be: production)
✓ PORT                   (optional, Vercel sets automatically)
```

**Frontend** (optional, set in .env.production):
```
✓ VITE_API_URL           (should be: https://dsa-practice-visual.vercel.app/api)
✓ VITE_ENVIRONMENT       (should be: production)
```

---

## Quick Reference

| Action | Link/Command |
|--------|-------------|
| Vercel Dashboard | https://vercel.com/dashboard |
| Project Settings | https://vercel.com/dashboard/[project-id]/settings |
| OpenRouter API | https://openrouter.ai |
| Health Check | https://dsa-practice-visual.vercel.app/api/health |
| App URL | https://dsa-practice-visual.vercel.app |

---

## Need Help?

1. Check **DEPLOYMENT_GUIDE.md** for detailed steps
2. Check **TROUBLESHOOTING.md** for common issues
3. Verify health endpoint is returning correct status
4. Check Vercel function logs in dashboard
5. Review OpenRouter account status
