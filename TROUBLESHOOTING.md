# AlgoVision IDE - Troubleshooting Guide

## Common Issues and Fixes

---

### Issue 1: LeetCode Visualization Not Working

**Symptoms:**
- LeetCode problems load but visualization panel shows generic trace
- DSA state not rendering for LeetCode code
- Algorithm detection showing "generic" instead of specific algorithm

**Root Causes:**
1. Algorithm not detected correctly by `detectAlgorithm(code)`
2. LeetCode code format doesn't match detection patterns
3. DSA visualization not generating proper state for algorithm

**Solutions:**

#### A. Verify Algorithm Detection
```javascript
// Test algorithm detection in browser console:
import { detectAlgorithm } from '@/utils/executionEngine'
const code = `function bubbleSort(arr) { ... }`
console.log(detectAlgorithm(code)) // Should output: 'bubbleSort'
```

#### B. Ensure Code Contains Algorithm Name
LeetCode code must include algorithm name or pattern:
- ✅ Contains "bubbleSort" or "bubble" + "sort"
- ✅ Contains "quickSort" or "quick" + "sort" or "partition"
- ✅ Contains "binarySearch" or "binary" + "search"
- ✅ Contains "insertionSort" or "insertion" + "sort"
- ❌ Generic function names like `solution()` won't be detected

#### C. Check Execution Mode
- Switch to **DSA** mode (`setExecMode('dsa')`) in TopBar
- Verify "Visualizer" tab is selected in visualization panel
- Check if `dsaState` is present in execution steps

#### D. Debug LeetCode Panel
1. Open LeetCode problem detail
2. Click "Load Solution" with visualizations enabled
3. Monitor browser console for errors
4. Check if code contains algorithm patterns

---

### Issue 2: AI Service Not Working on Deployed App

**Symptoms:**
- "Explain Code", "Analyze Complexity" buttons show error
- 500 status response from `/api/analyze` or `/api/chat`
- Console shows "CORS error" or "API error"

**Root Causes:**
1. OPENROUTER_API_KEY not configured in Vercel
2. CORS origins not properly configured
3. OpenRouter API key expired or invalid
4. Backend environment variables not loaded

**Solutions:**

#### A. Verify Environment Variables on Vercel
```bash
# In Vercel Dashboard:
1. Project Settings → Environment Variables
2. Check these variables exist:
   - OPENROUTER_API_KEY (required)
   - CORS_ORIGINS (should include your Vercel domain)
   - NODE_ENV=production
3. Click "Redeploy" to apply changes
```

#### B. Verify Health Endpoint
```bash
# Test backend health:
curl https://dsa-practice-visual.vercel.app/api/health

# Expected response:
{
  "status": "ok",
  "version": "2.0.0",
  "service": "AlgoVision IDE Backend",
  "aiConfigured": true
}

# If "aiConfigured": false → OPENROUTER_API_KEY missing
```

#### C. Test OpenRouter API Key
```bash
# Verify API key is valid:
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://openrouter.ai/api/v1/models

# Should return list of available models
# If 401 → API key is invalid or expired
# If 403 → API key doesn't have sufficient funds
```

#### D. Check CORS Configuration
```javascript
// In browser console after error:
console.log('Origin:', window.location.origin)
```

Verify this origin is in CORS_ORIGINS on backend.

#### E. Restart Vercel Deployment
```bash
# Force redeploy in Vercel Dashboard:
1. Go to Deployments tab
2. Find latest deployment
3. Click "..." menu
4. Select "Redeploy"
```

---

### Issue 3: Build Failures

**Symptoms:**
- `npm run build` fails with TypeScript errors
- `npm test` shows failed tests
- Chunks exceed size limits

**Solutions:**

#### A. TypeScript Errors
```bash
# Run type check:
npm run type-check

# Fix specific errors:
npm run type-check -- --pretty
```

#### B. Test Failures
```bash
# Run tests with verbose output:
npm test -- --verbose

# Run specific test file:
npm test executionEngine.test.ts

# Update snapshots if needed:
npm test -- --updateSnapshot
```

#### C. Chunk Size Warnings
- Already configured in vite.config.ts with manual chunks
- Monaco Editor and vendor bundles split automatically
- Warning is non-fatal; app still builds and deploys

---

### Issue 4: Code Execution Errors

**Symptoms:**
- "Restricted operations detected" message
- Execution fails with security error
- Code won't run in sandbox

**Solutions:**

#### A. Restricted Operations
Avoid these in code (blocked for security):
- ❌ `process.exit()`
- ❌ `require()` or `import` (dynamic)
- ❌ `__dirname`, `__filename`
- ❌ `fs.` (file system operations)
- ❌ `child_process` (spawning processes)

#### B. Use Standard Algorithms
Stick to provided DSA algorithm implementations:
- Sorting: bubbleSort, selectionSort, insertionSort, mergeSort, quickSort, heapSort
- Searching: binarySearch, linearSearch
- Data Structures: linkedList, bst, stack, queue, hashMap

---

### Issue 5: Visualization Panel Not Updating

**Symptoms:**
- Step counter doesn't change
- Visualization frozen or stuck
- Can't navigate through execution steps

**Solutions:**

#### A. Check Execution State
```javascript
// In browser console:
const { executionSteps, currentStepIndex } = useIDEStore.getState()
console.log(`Steps: ${executionSteps.length}, Current: ${currentStepIndex}`)
```

#### B. Reload Execution
1. Modify code slightly
2. Click Run button again
3. Visualization should reset and update

#### C. Check Browser Console
- Look for JavaScript errors
- Check for warnings about max steps exceeded
- Verify no network errors

---

### Issue 6: LeetCode Problems Not Loading

**Symptoms:**
- LeetCode panel shows "No problems found"
- Problem detail view blank
- Search doesn't work

**Solutions:**

#### A. Verify Problems Data
```javascript
// In browser console:
import { LEETCODE_PROBLEMS } from '@/data/leetcodeProblems'
console.log(LEETCODE_PROBLEMS.length) // Should show > 0
```

#### B. Check Search Query
- Try searching with problem ID (e.g., "1", "2")
- Try searching with exact title
- Filter by difficulty or category

#### C. Verify Problem Format
Each problem needs:
- id: unique string
- title: problem name
- difficulty: "Easy" | "Medium" | "Hard"
- category: algorithm category
- description, examples, constraints
- starterCode and solution (optional)

---

### Issue 7: Rate Limiting

**Symptoms:**
- "Rate limit exceeded" message after many API calls
- AI service stops working temporarily
- Need to wait before next request

**Solutions:**

#### A. Understand Rate Limits
- 30 requests per minute per IP address
- Limit applies to `/api/analyze`, `/api/chat`, `/api/execute`
- Automatically resets after 1 minute

#### B. Increase Limit (Development)
Edit `server/src/index.ts`:
```typescript
const RATE_LIMIT_MAX = 30        // Increase this
const RATE_LIMIT_WINDOW = 60_000 // Or increase this (ms)
```

#### C. Handle in UI
Users will see message and can retry after 1 minute.

---

## Debugging Workflow

### Step 1: Check Health
```bash
curl https://dsa-practice-visual.vercel.app/api/health
```

### Step 2: Check Console
- Open browser DevTools (F12)
- Look at Console tab for errors
- Check Network tab for failed requests

### Step 3: Check Algorithm Detection
```javascript
// In console:
detectAlgorithm(yourCode)
```

### Step 4: Test Execution Steps
```javascript
// In console:
generateExecutionSteps(yourCode)
```

### Step 5: Review Logs
- Vercel Dashboard → Deployments → Function Logs
- Check backend error messages

### Step 6: Test Locally
```bash
# Run dev server:
npm run dev

# Backend:
cd server
npm run dev
```

---

## Support Resources

- **API Docs:** `/api/health` endpoint
- **OpenRouter:** https://openrouter.ai/status
- **Vercel Docs:** https://vercel.com/docs
- **Monaco Editor:** https://microsoft.github.io/monaco-editor/
- **GitHub Issues:** Create issue with reproduction steps
