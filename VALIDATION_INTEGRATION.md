# 🔧 TODO 1: INTEGRATE VALIDATION INTO SORTING ALGORITHMS

## Strategy
Instead of modifying existing functions (risky), I'll create wrapper functions that add validation.
This keeps original functions intact and allows gradual migration.

## Functions to Update
1. genBubbleSort() - Line 115
2. genSelectionSort() - Line 163
3. genInsertionSort() - Line 212
4. genMergeSort() - Line 254
5. genQuickSort() - Line 311
6. genBinarySearch() - Line 378 (also needs target validation)
7. genLinearSearch() - Line 422 (also needs target validation)

## Validation Logic
```typescript
// For array-based algorithms
const validation = validateNumberArray(arr)
if (!validation.valid) {
  return [createErrorStep(validation.error)]
}

// For binary/linear search
const arrValidation = validateNumberArray(arr)
if (!arrValidation.valid) return [createErrorStep(arrValidation.error)]
if (typeof target !== 'number' || !isFinite(target)) {
  return [createErrorStep('Target must be a finite number')]
}
```

## Testing
- Empty array: []
- Single element: [5]
- Duplicates: [3, 1, 3, 1]
- Large: [50, 42, 10, ..., 99]
