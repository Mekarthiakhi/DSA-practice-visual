/**
 * Comprehensive Input Validation Module
 * Validates all algorithm inputs to prevent crashes and edge cases
 */

import { ExecutionStep } from '../store/ideStore'

export interface ValidationError {
  valid: false
  error: string
}

export interface ValidationSuccess {
  valid: true
}

export type ValidationResult = ValidationError | ValidationSuccess

// ─── ARRAY VALIDATION ────────────────────────────────────────────────────

export function validateNumberArray(arr: unknown, maxSize = 100000): ValidationResult {
  if (!Array.isArray(arr)) {
    return { valid: false, error: '❌ Input must be an array' }
  }
  if (arr.length === 0) {
    return { valid: false, error: '❌ Array cannot be empty' }
  }
  if (arr.length > maxSize) {
    return { valid: false, error: `❌ Array too large (max ${maxSize} elements)` }
  }
  if (!arr.every(x => typeof x === 'number' && isFinite(x))) {
    return { valid: false, error: '❌ All array elements must be finite numbers' }
  }
  return { valid: true }
}

export function validateBinarySearchInput(arr: unknown, target: unknown): ValidationResult {
  const arrayValidation = validateNumberArray(arr)
  if (!arrayValidation.valid) return arrayValidation
  if (typeof target !== 'number' || !isFinite(target)) {
    return { valid: false, error: '❌ Target must be a finite number' }
  }
  return { valid: true }
}

export function validateString(str: unknown): ValidationResult {
  if (typeof str !== 'string') {
    return { valid: false, error: '❌ Input must be a string' }
  }
  if (str.length === 0) {
    return { valid: false, error: '❌ String cannot be empty' }
  }
  if (str.length > 10000) {
    return { valid: false, error: '❌ String too long (max 10,000 characters)' }
  }
  return { valid: true }
}

export function validateNumber(n: unknown, max = 1000000): ValidationResult {
  if (typeof n !== 'number' || !isFinite(n)) {
    return { valid: false, error: '❌ Input must be a finite number' }
  }
  if (n < 0) {
    return { valid: false, error: '❌ Number must be non-negative' }
  }
  if (n > max) {
    return { valid: false, error: `❌ Number too large (max ${max})` }
  }
  if (n !== Math.floor(n)) {
    return { valid: false, error: '❌ Number must be an integer' }
  }
  return { valid: true }
}

// ─── ERROR STEP CREATION ────────────────────────────────────────────────────

export function createErrorStep(message: string, line = 1): ExecutionStep {
  return {
    line,
    variables: [],
    callStack: [],
    heap: [],
    output: message,
    description: `⚠️ Error: ${message}`,
    dsaState: { 
      type: 'array', 
      nodes: [], 
      message: `⚠️ ${message}` 
    },
  }
}

export function createWarningStep(message: string, line = 1): ExecutionStep {
  return {
    line,
    variables: [],
    callStack: [],
    heap: [],
    output: message,
    description: `⚠️ ${message}`,
    dsaState: { 
      type: 'array', 
      nodes: [], 
      message: `⚠️ ${message}` 
    },
  }
}
