/**
 * Bubble Sort Implementation
 * PHASE 2: Split from monolithic executionEngine.ts
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
  const a = [...arr]
  const n = a.length
  let comps = 0,
    swaps = 0

  const snap = (
    line: number,
    desc: string,
    hl: Record<number, DSANode['highlight']>,
    changed?: string
  ): ExecutionStep => ({
    line,
    description: desc,
    variables: [
      { name: 'arr', value: [...a], type: 'Array', scope: 'bubbleSort', changed: changed === 'arr' },
      { name: 'n', value: n, type: 'number', scope: 'bubbleSort' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'bubbleSort', changed: changed === 'comps' },
      { name: 'swaps', value: swaps, type: 'number', scope: 'bubbleSort', changed: changed === 'swaps' },
    ],
    callStack: [makeFrame('main', line), makeFrame('bubbleSort', line)],
    heap: [],
    output: '',
    dsaState: {
      type: 'array',
      nodes: a.map((v, i) => ({ id: `n${i}`, value: v, highlight: hl[i] || 'none' })),
      comparisons: comps,
      swaps,
      message: desc,
    },
  })

  steps.push(snap(2, `Starting Bubble Sort on [${arr.join(', ')}]`, {}))

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comps++
      const h1: Record<number, DSANode['highlight']> = {}
      for (let k = n - i; k < n; k++) h1[k] = 'sorted'
      h1[j] = 'comparing'
      h1[j + 1] = 'comparing'
      steps.push(snap(4, `Compare arr[${j}]=${a[j]} vs arr[${j + 1}]=${a[j + 1]}`, h1, 'comps'))

      if (a[j] > a[j + 1]) {
        swaps++
        const h2: Record<number, DSANode['highlight']> = { ...h1, [j]: 'swapping', [j + 1]: 'swapping' }
        steps.push(snap(5, `Swap ${a[j]} ↔ ${a[j + 1]}`, h2, 'swaps'))
        ;[a[j], a[j + 1]] = [a[j + 1], a[j]]
        steps.push(snap(5, `After swap: ${a[j]} ↔ ${a[j + 1]}`, h2, 'arr'))
      }
    }

    const hSorted: Record<number, DSANode['highlight']> = {}
    for (let k = n - i - 1; k < n; k++) hSorted[k] = 'sorted'
    steps.push(snap(3, `Pass ${i + 1} done — ${i + 1} element(s) in place`, hSorted))
  }

  const hAll: Record<number, DSANode['highlight']> = {}
  a.forEach((_, i) => {
    hAll[i] = 'found'
  })
  steps.push(snap(8, `✅ Sorted! [${a.join(', ')}] | ${comps} comparisons, ${swaps} swaps`, hAll, 'arr'))

  return steps
}
