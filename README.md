# ⚡ AlgoVision IDE v3

> A visual code execution environment with real JavaScript, TypeScript, and Python tracing plus configurable compiled-language runtimes.

---

## 🆕 What's New in v3

### Two Execution Modes

| Mode | How it works | Best for |
|------|-------------|----------|
| **DSA Visualizer** | Executes current source and derives DSA state from runtime values | Arrays, strings, trees, graphs, stacks, queues |
| **Live Code Tracer** | Executes current source with line, variable, call-stack, and error tracking | Debugging arbitrary code |
| **Auto** (default) | Uses the real source-driven tracer and selects the matching canvas | Recommended for learners |

### Dynamic language runtimes

| Language | Runtime |
|---|---|
| JavaScript | Local browser tracer |
| TypeScript | Local TypeScript transpilation + browser tracer |
| Python | Real CPython in a Web Worker through Pyodide/WebAssembly |
| Java, C, C++, C#, Go, Rust | Isolated trace service configured with `VITE_EXECUTION_API_URL` |

AI traces remain available as an explicitly labelled simulation fallback. Without a compiled-language runtime service or AI key, the UI displays an actionable `RuntimeUnavailable` diagnostic instead of fake static execution steps.

For compiled languages, set frontend `VITE_EXECUTION_API_URL=http://localhost:3001/api/execute` and backend `EXECUTION_SERVICE_URL` to a separately isolated trace runner. The backend now validates and proxies that trace request; it returns a clear unavailable error when no runner is configured and never reports demo output as real execution.

### LeetCode coverage (verified)

- The bundled catalog currently contains **144 unique problems**.
- **130** include at least one example input.
- Automatic runnable harnesses can currently be generated for **122 JavaScript** starters and **111 Python** starters.
- The catalog includes complete solutions for **10 JavaScript** problems and **1 Python** problem; the remaining entries are practice starters.
- Primitive values, arrays, matrices, strings, standard linked lists, and level-order binary trees are handled automatically. Design problems, random-pointer nodes, and custom graph-node objects require fixture code in the editor.
- Every successfully executed program receives a generic variable/call-stack flow. A specialized DSA canvas is shown only when its runtime data structure can be recognized reliably.

The LeetCode panel labels each item as `Auto input` or `Needs fixture` and provides an editable visualization-input field. This prevents an empty starter or malformed catalog example from being presented as a successful visualization.

## Deployment

### Docker (recommended for the complete frontend/backend pair)

```bash
docker compose up --build
```

Open `http://localhost:5173`. Set `OPENROUTER_API_KEY` if server-side AI is required. Set `EXECUTION_SERVICE_URL` only when a separately isolated compiled-language trace runner is available.

The frontend image builds with same-origin `/api` routing, nginx proxies that traffic to the backend, and Python loads the pinned Pyodide runtime from jsDelivr. The nginx policy therefore allows the pinned CDN and module Web Workers.

### Vercel

Deploy the frontend and `server/` as separate projects. For the frontend project set:

```env
VITE_API_URL=https://your-backend.example.com
VITE_EXECUTION_API_URL=https://your-backend.example.com/api/execute
```

Do not add `/api` to `VITE_API_URL`; the client adds endpoint paths itself. In the backend project set `CORS_ORIGINS` to the frontend origin and configure `OPENROUTER_API_KEY` and optional `EXECUTION_SERVICE_URL`. Vite variables are embedded at build time, so redeploy the frontend after changing them.

Before public launch, test `/health`, JavaScript, Python first-load behavior, editor error markers, and one linked-list/tree fixture from the deployed HTTPS origin.

### Universal Code Support
Every JavaScript program can now be visualized — the interpreter:
- Actually **executes** your code in a controlled browser `Function()` runtime
- Tracks **every variable assignment** in real-time via a Proxy
- Shows **live variable values** with type-aware coloring
- Renders a **variable timeline** showing when each variable changed
- Captures all **console.log** output
- Shows the **call stack** depth

### New Visualization: Generic Code View
When your code isn't a DSA pattern, the Visualizer tab switches to:
- Animated variable cards (with mini bar charts for numeric arrays)
- **Variable Timeline** — SVG chart showing value changes over all steps
- Per-step change highlighting (glowing border when a var just changed)
- Type badges with color coding

### 35+ Code Examples in 14 Categories

**DSA (original):** Sorting × 5, Searching × 2, Recursion × 2, Data Structures × 5, Graphs × 2, Problems × 3

**New Categories:**
- **Arrays** — Kadane's, Sliding Window, Prefix Sum, Two Pointers
- **Strings** — Longest Unique Substring, Anagram Check, String Analysis
- **Math** — Sieve of Eratosthenes, GCD/LCM, Fast Exponentiation
- **Dynamic Programming** — 0/1 Knapsack, Coin Change, LCS
- **JavaScript Patterns** — Closures, Array Methods Chain, Memoization
- **OOP** — Class Inheritance & Polymorphism
- **Bit Ops** — Bit tricks, Power of Two
- **Misc** — Pascal's Triangle, Matrix Operations

---

## 🚀 Quick Start

```bash
cd algovision-ide
npm install
npm run dev
# → http://localhost:5173
```

## Execution Mode Switcher

In the top bar, use the `Auto / DSA / Trace` toggle:
- **Auto** — smart detection (recommended)
- **DSA** — force the rich DSA visualizer
- **Trace** — force the live JS interpreter (shows every variable change)

## AI Features

Click the 🔑 key icon → enter your Anthropic API key → use Explain / Complexity / Flowchart / Optimize tabs.

---

## Architecture

```
src/
├── utils/
│   ├── executionEngine.ts   # Hand-crafted DSA step generators (20+ algos)
│   ├── jsInterpreter.ts     # Real JS code tracer (Proxy + Function sandbox)
│   └── universalEngine.ts   # Router + 35+ code examples
│
├── components/
│   ├── dsa/
│   │   └── DSAVisualizer.tsx          # Array/Tree/Graph/Stack/Queue/HashMap views
│   ├── visualization/
│   │   ├── GenericCodeViz.tsx         # Variable cards + timeline for arbitrary code
│   │   ├── VisualizationPanel.tsx     # Tabs: Visualizer / Variables / Call Stack / Steps / Console
│   │   ├── VariablesPanel.tsx         # Detailed variable inspector
│   │   └── CallStackPanel.tsx         # Call stack frames
│   ├── editor/
│   │   └── CodeEditor.tsx             # Monaco editor with execution line highlight
│   ├── ai-panel/
│   │   └── AIPanel.tsx                # Claude-powered explain/complexity/optimize
│   └── layout/
│       └── TopBar.tsx                 # Controls, example picker, playback
```
