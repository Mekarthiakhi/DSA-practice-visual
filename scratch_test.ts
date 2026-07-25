import { interpretCode } from './src/utils/jsInterpreter'
import { SAMPLE_CODES } from './src/utils/executionEngine'
import * as fs from 'fs'

const result = interpretCode(SAMPLE_CODES.quickSort.code)
fs.writeFileSync('quicksort_trace.json', JSON.stringify({
  stepsCount: result.steps.length,
  hasDsaState: result.steps.some(s => !!s.dsaState),
  dsaStateNodes: result.steps.filter(s => !!s.dsaState).map(s => s.dsaState?.nodes),
  error: result.error
}, null, 2))
console.log('Trace generated with', result.steps.length, 'steps')
