/**
 * Engines Barrel Export
 * PHASE 2: Modular organization - split from monolithic executionEngine.ts
 * 
 * All algorithm generators in one place for easy importing
 */

// Sorting algorithms
export { genBubbleSort } from './sorting/bubbleSort'
export * from './sorting/index'

// Re-export for backwards compatibility
export type { AlgoType } from '../utils/executionEngine'
