# ⚡ AlgoVision IDE v3

> A universal visual code execution environment — visualize **any** JavaScript code, not just DSA patterns.

---

## 🆕 What's New in v3

### Two Execution Modes

| Mode | How it works | Best for |
|------|-------------|----------|
| **DSA Visualizer** | Hand-crafted step generators with rich animations | Known algorithms (sort, search, trees, graphs…) |
| **Live Code Tracer** | Real JS interpreter with Proxy-based variable tracking | Any arbitrary JavaScript code |
| **Auto** (default) | Detects DSA patterns → uses visualizer, falls back to tracer | Everything |

### Universal Code Support
Every JavaScript program can now be visualized — the interpreter:
- Actually **executes** your code in a sandboxed `Function()` environment
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
