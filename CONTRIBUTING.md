# Contributing to AlgoVision IDE

Thank you for your interest in contributing to AlgoVision IDE! This guide will help you get started.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Follow the existing code style
- Write clear commit messages

## Getting Started

### Prerequisites

- Node.js 16+ and npm 8+
- Git
- Text editor (VS Code recommended)

### Setup Development Environment

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/DSA-practice-visual.git
cd DSA-practice-visual

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
# → http://localhost:5173

# 4. Open browser and test
# Edit code in src/ and see hot reload in action
```

### Project Structure

```
src/
├── components/      # React UI components
├── engines/         # Algorithm implementations
├── hooks/          # Custom React hooks
├── store/          # State management
├── utils/          # Helper utilities
└── __tests__/      # Unit tests

server/             # Backend for API key handling
```

## Adding a New Algorithm

### Step 1: Create Algorithm Function

Create file: `src/engines/sorting/heapSort.ts` (or appropriate folder)

```typescript
/**
 * Heap Sort Implementation
 * Time: O(n log n) | Space: O(1)
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

export function genHeapSort(arr: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const a = [...arr]
  const n = a.length

  // Helper: Create snapshot of current state
  const snap = (
    line: number,
    desc: string,
    highlights: Record<number, DSANode['highlight']>,
    changed?: string
  ): ExecutionStep => ({
    line,
    description: desc,
    variables: [
      { name: 'arr', value: [...a], type: 'Array', scope: 'heapSort', changed: changed === 'arr' },
      { name: 'n', value: n, type: 'number', scope: 'heapSort' },
    ],
    callStack: [makeFrame('main', line), makeFrame('heapSort', line)],
    heap: [],
    output: '',
    dsaState: {
      type: 'array',
      nodes: a.map((v, i) => ({ id: `n${i}`, value: v, highlight: highlights[i] || 'none' })),
      message: desc,
    },
  })

  // Your algorithm implementation here
  steps.push(snap(1, 'Starting Heap Sort', {}))
  
  // ... add steps as you go ...
  
  steps.push(snap(n + 1, `✅ Sorted! [${a.join(', ')}]`, {}))

  return steps
}
```

### Step 2: Export from Barrel

Update: `src/engines/sorting/index.ts`

```typescript
export { genHeapSort } from './heapSort'
```

### Step 3: Add Detection Rule

Update: `src/utils/executionEngine.ts`

```typescript
export type AlgoType = 
  | 'bubbleSort' 
  | 'heapSort'  // ADD THIS
  // ...

export function detectAlgorithm(code: string): AlgoType {
  const lower = code.toLowerCase().replace(/\s+/g, ' ')
  
  // ... existing checks ...
  
  if (lower.includes('heapsort') || (lower.includes('heap') && lower.includes('sort'))) 
    return 'heapSort'  // ADD THIS
  
  return 'generic'
}
```

### Step 4: Write Tests

Create: `src/__tests__/heapSort.test.ts`

```typescript
import { genHeapSort } from '../engines/sorting/heapSort'

describe('Heap Sort', () => {
  it('should sort array correctly', () => {
    const result = genHeapSort([5, 2, 8, 1, 9])
    const lastStep = result[result.length - 1]
    const sorted = lastStep.variables.find(v => v.name === 'arr')?.value
    expect(sorted).toEqual([1, 2, 5, 8, 9])
  })

  it('should handle edge cases', () => {
    expect(genHeapSort([1]).length).toBeGreaterThan(0)
    expect(genHeapSort([2, 1]).length).toBeGreaterThan(0)
  })
})
```

### Step 5: Run Tests

```bash
npm test -- heapSort.test.ts
```

### Step 6: Update README

Add to list of supported algorithms in `README.md`

### Step 7: Submit PR

```bash
git add .
git commit -m "Add heap sort algorithm"
git push origin add-heap-sort
# Create PR on GitHub
```

## Writing Tests

### Test Structure

```typescript
describe('Module/Function Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = [5, 2, 8]
    
    // Act
    const result = genBubbleSort(input)
    
    // Assert
    expect(result.length).toBeGreaterThan(0)
  })
})
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific file
npm test -- executionEngine.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode (rerun on file change)
npm test -- --watch
```

### Coverage Goal

Target: **70%+ code coverage**

```bash
npm test -- --coverage
# Shows coverage report
```

## Code Style

### TypeScript Strict Mode

All code must pass strict TypeScript compilation:

```bash
npm run build
```

### Naming Conventions

```typescript
// Components (PascalCase)
export const CodeEditor: React.FC<Props> = () => {}

// Functions (camelCase)
export function interpretCode(code: string) {}

// Constants (UPPER_SNAKE_CASE)
const MAX_STEPS = 3000

// Interfaces (PascalCase with I prefix - optional)
interface Props {
  code: string
}

// Type aliases (PascalCase)
type ExecutionMode = 'dsa' | 'interpreter' | 'auto'
```

### Comments

```typescript
/**
 * Brief description
 * 
 * Optional longer explanation if needed
 * @param arr Input array
 * @returns Sorted array steps
 */
function example(arr: number[]) {
  // Implementation comment if complex logic
}
```

## Commit Messages

Follow conventional commits:

```
type(scope): subject

body (optional)
footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `chore`: Maintenance

**Examples:**

```
feat(engines): add heap sort algorithm
fix(visualization): fix memory leak in drag handlers
docs: update API documentation
test(executionEngine): add bubble sort tests
refactor: split monolithic execution engine
```

## Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Make** your changes
4. **Test** your changes: `npm test`
5. **Lint** your code: `npm run lint` (if available)
6. **Commit** with clear messages
7. **Push** to your fork
8. **Create** a PR with description

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Related Issue
Fixes #123

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation

## Testing
How did you test this?

## Checklist
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] TypeScript strict mode passes
- [ ] Code follows style guide
- [ ] Documentation updated
```

## Common Issues

### Memory Leaks in Event Listeners

Use the custom `usePanelResize` hook:

```typescript
import { usePanelResize } from '../hooks/usePanelResize'

export function MyComponent() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { startDrag } = usePanelResize(
    containerRef,
    onLeftWidthChange,
    onRightWidthChange
  )
  
  return <div onMouseDown={startDrag(true)} />
}
```

### Infinite Loops

If code creates infinite loop, execution stops at MAX_STEPS (3000) with warning:

```typescript
if (stepCount >= MAX_STEPS) {
  maxStepsReached = true
  return { steps, maxStepsWarning: true }
}
```

### Type Errors

Enable strict TypeScript to catch early:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true
  }
}
```

## Performance Considerations

### Memoization

Use `React.memo` for expensive components:

```typescript
const VariableCard = React.memo(({ variable }) => {
  return <div>{variable.name}</div>
}, (prev, next) => {
  // Custom comparison
  return JSON.stringify(prev.variable) === JSON.stringify(next.variable)
})
```

### Large Arrays

Visualization breaks with 10k+ elements. Consider:
- Virtual scrolling
- Sampling data
- Limiting visualization size

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [Algorithm Visualization Concepts](https://www.visualgo.net)

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions and share ideas
- **Email**: team@raccoonai.tech

## Recognition

Contributors are recognized in:
- README.md "Contributors" section
- Release notes
- Twitter announcements

---

**Thank you for contributing!** 🚀
