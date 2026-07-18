/**
 * Bubble Sort Implementation
 * FIXED: Swap visualization now correctly updates the array before snapping,
 *        sorted-region highlights are accurate, and pointer labels are shown.
 */

import { ExecutionStep, DSANode } from '../../store/ideStore'

function makeFrame(name: string, line: number) {
  return {
    id: `${name}-${Date.now()}`,
    name,
    line,
    variables: [],
    isActive: true,
  }
}

export function genBubbleSort(arr: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []

  // Stable IDs so Framer Motion can animate physical movement between positions
  const a = arr.map((v, i) => ({ id: `n${i}-${v}`, value: v }))
  const n = a.length
  let comps = 0,
    swaps = 0

  // Helper: build sorted highlight map for indices [firstSorted .. n-1]
  const sortedHL = (firstSorted: number): Record<number, DSANode['highlight']> => {
    const h: Record<number, DSANode['highlight']> = {}
    for (let k = firstSorted; k < n; k++) h[k] = 'sorted'
    return h
  }

  const snap = (
    line: number,
    desc: string,
    hl: Record<number, DSANode['highlight']>,
    changed?: string,
    iPtr?: number,
    jPtr?: number
  ): ExecutionStep => ({
    line,
    description: desc,
    variables: [
      { name: 'arr', value: a.map(item => item.value), type: 'Array', scope: 'bubbleSort', changed: changed === 'arr' },
      { name: 'n', value: n, type: 'number', scope: 'bubbleSort' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'bubbleSort', changed: changed === 'comps' },
      { name: 'swaps', value: swaps, type: 'number', scope: 'bubbleSort', changed: changed === 'swaps' },
    ],
    callStack: [makeFrame('main', line), makeFrame('bubbleSort', line)],
    heap: [],
    output: '',
    dsaState: {
      type: 'array',
      nodes: a.map((item, i) => ({ id: item.id, value: item.value, highlight: hl[i] || 'none' })),
      comparisons: comps,
      swaps,
      message: desc,
      // Pass i and j as pointer labels so the visualizer can render them
      pointer: iPtr,
      pointerName: 'i',
      pointer2: jPtr,
      pointer2Name: 'j',
    },
  })

  // ── Initial state ──────────────────────────────────────────────────────────
  steps.push(snap(2, `Starting Bubble Sort on [${arr.join(', ')}]`, {}))

  for (let i = 0; i < n - 1; i++) {
    // Sorted region for this pass: indices already in final position
    const sortedBase = sortedHL(n - i)   // [n-i .. n-1] are sorted from previous passes

    for (let j = 0; j < n - i - 1; j++) {
      comps++

      // ── Compare step ──────────────────────────────────────────────────────
      const hCompare: Record<number, DSANode['highlight']> = {
        ...sortedBase,
        [j]: 'comparing',
        [j + 1]: 'comparing',
      }
      steps.push(
        snap(
          5,
          `Compare arr[${j}]=${a[j].value} vs arr[${j + 1}]=${a[j + 1].value}`,
          hCompare,
          'comps',
          i,
          j
        )
      )

      if (a[j].value > a[j + 1].value) {
        // ── Pre-swap highlight (bars turn red BEFORE moving) ─────────────────
        swaps++
        const hSwapping: Record<number, DSANode['highlight']> = {
          ...sortedBase,
          [j]: 'swapping',
          [j + 1]: 'swapping',
        }
        steps.push(
          snap(
            6,
            `Need to swap: ${a[j].value} > ${a[j + 1].value}`,
            hSwapping,
            'swaps',
            i,
            j
          )
        )

        // ── Perform the physical swap ─────────────────────────────────────────
        ;[a[j], a[j + 1]] = [a[j + 1], a[j]]

        // ── Post-swap snapshot — bars now show updated positions ──────────────
        steps.push(
          snap(
            6,
            `Swapped → arr[${j}]=${a[j].value}, arr[${j + 1}]=${a[j + 1].value}`,
            hSwapping,
            'arr',
            i,
            j
          )
        )
      } else {
        // ── No-swap step (optional, helps show "no swap needed") ─────────────
        const hNoSwap: Record<number, DSANode['highlight']> = {
          ...sortedBase,
          [j]: 'active',
          [j + 1]: 'active',
        }
        steps.push(
          snap(
            5,
            `No swap: ${a[j].value} ≤ ${a[j + 1].value}`,
            hNoSwap,
            undefined,
            i,
            j
          )
        )
      }
    }

    // ── End of pass: mark newly sorted element ────────────────────────────────
    // After pass i, index (n-i-1) is now in its final position
    const hPassDone = sortedHL(n - i - 1)
    steps.push(
      snap(
        3,
        `Pass ${i + 1} done — element ${a[n - i - 1].value} is in its final position`,
        hPassDone,
        undefined,
        i
      )
    )
  }

  // ── Fully sorted ──────────────────────────────────────────────────────────
  const hAll: Record<number, DSANode['highlight']> = {}
  a.forEach((_, idx) => { hAll[idx] = 'found' })
  steps.push(
    snap(
      10,
      `✅ Sorted! [${a.map(item => item.value).join(', ')}] | ${comps} comparisons, ${swaps} swaps`,
      hAll,
      'arr'
    )
  )

  return steps
}
