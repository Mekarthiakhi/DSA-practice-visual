import { interpretCode } from '../utils/jsInterpreter'
import { runCode } from '../utils/universalEngine'

describe('Grid, Matrix, DP, Stack & Trees Audit', () => {
  it('36: Valid Sudoku generates matrix visualization steps with r and c', () => {
    const code = `// Valid Sudoku — 9x9 Grid Traversal O(1)
function isValidSudoku(grid) {
  const rows = [];
  const cols = [];
  const boxes = [];
  for (let i = 0; i < 9; i++) {
    rows.push(new Set());
    cols.push(new Set());
    boxes.push(new Set());
  }

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = grid[r][c];
      if (val === '.') continue;
      const boxIdx = Math.floor(r / 3) * 3 + Math.floor(c / 3);
      if (rows[r].has(val) || cols[c].has(val) || boxes[boxIdx].has(val)) {
        return false;
      }
      rows[r].add(val);
      cols[c].add(val);
      boxes[boxIdx].add(val);
    }
  }
  return true;
}

const grid = [
  ["5","3",".",".","7",".",".",".","."],
  ["6",".",".","1","9","5",".",".","."],
  [".","9","8",".",".",".",".","6","."],
  ["8",".",".",".","6",".",".",".","3"],
  ["4",".",".","8",".","3",".",".","1"],
  ["7",".",".",".","2",".",".",".","6"],
  [".","6",".",".",".",".","2","8","."],
  [".",".",".","4","1","9",".",".","5"],
  [".",".",".",".","8",".",".","7","9"]
];
const result = isValidSudoku(grid);
console.log('Result:', result);`

    const res = interpretCode(code)
    console.log('Valid Sudoku steps:', res.steps.length, 'error:', res.error)
    expect(res.error).toBeUndefined()
    expect(res.steps.length).toBeGreaterThan(0)

    const matrixSteps = res.steps.filter(s => s.dsaState?.type === 'matrix')
    console.log('Valid Sudoku matrix steps:', matrixSteps.length)
    expect(matrixSteps.length).toBeGreaterThan(0)

    const sample = matrixSteps.find(s => s.dsaState?.auxiliaryData?.matrix?.rowPointer !== undefined)
    expect(sample).toBeDefined()
    console.log('Valid Sudoku sample matrix pointer:', sample?.dsaState?.auxiliaryData?.matrix)
  })

  it('130: Surrounded Regions generates matrix visualization with boundary BFS and queue', () => {
    const code = `// Surrounded Regions — Boundary BFS O(m*n)
function solve(grid) {
  if (!grid || grid.length === 0) return grid;
  const rows = grid.length;
  const cols = grid[0].length;
  const queue = [];

  for (let r = 0; r < rows; r++) {
    if (grid[r][0] === 'O') { grid[r][0] = 'T'; queue.push([r, 0]); }
    if (grid[r][cols - 1] === 'O') { grid[r][cols - 1] = 'T'; queue.push([r, cols - 1]); }
  }
  for (let c = 0; c < cols; c++) {
    if (grid[0][c] === 'O') { grid[0][c] = 'T'; queue.push([0, c]); }
    if (grid[rows - 1][c] === 'O') { grid[rows - 1][c] = 'T'; queue.push([rows - 1, c]); }
  }

  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length > 0) {
    const curr = queue.shift();
    const cr = curr[0];
    const cc = curr[1];
    for (const d of dirs) {
      const nr = cr + d[0];
      const nc = cc + d[1];
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 'O') {
        grid[nr][nc] = 'T';
        queue.push([nr, nc]);
      }
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 'O') {
        grid[r][c] = 'X';
      } else if (grid[r][c] === 'T') {
        grid[r][c] = 'O';
      }
    }
  }
  return grid;
}

const grid = [
  ["X","X","X","X"],
  ["X","O","O","X"],
  ["X","X","O","X"],
  ["X","O","X","X"]
];
const result = solve(grid);
console.log('Result:', JSON.stringify(result));`

    const res = interpretCode(code)
    console.log('Surrounded Regions steps:', res.steps.length, 'error:', res.error)
    expect(res.error).toBeUndefined()
    expect(res.steps.length).toBeGreaterThan(0)

    const matrixSteps = res.steps.filter(s => s.dsaState?.type === 'matrix')
    console.log('Surrounded Regions matrix steps:', matrixSteps.length)
    expect(matrixSteps.length).toBeGreaterThan(0)

    const stepsWithQueue = matrixSteps.filter(s => s.dsaState?.queueItems && s.dsaState.queueItems.length > 0)
    console.log('Surrounded Regions steps with queue:', stepsWithQueue.length)
    expect(stepsWithQueue.length).toBeGreaterThan(0)
  })

  it('883: Car Fleet generates stack visualization steps', () => {
    const code = `// Car Fleet — Monotonic Stack O(n log n)
function carFleet(target, position, speed) {
  const pairs = [];
  for (let i = 0; i < position.length; i++) {
    pairs.push([position[i], speed[i]]);
  }
  pairs.sort((a, b) => b[0] - a[0]);

  const stack = [];
  for (let i = 0; i < pairs.length; i++) {
    const p = pairs[i][0];
    const s = pairs[i][1];
    const time = (target - p) / s;
    stack.push(time);
    if (stack.length >= 2 && stack[stack.length - 1] <= stack[stack.length - 2]) {
      stack.pop();
    }
  }
  return stack.length;
}

const target = 12;
const position = [10, 8, 0, 5, 3];
const speed = [2, 4, 1, 1, 3];
const result = carFleet(target, position, speed);
console.log('Result:', result);`

    const res = interpretCode(code)
    console.log('Car Fleet steps:', res.steps.length, 'error:', res.error)
    expect(res.error).toBeUndefined()
    expect(res.steps.length).toBeGreaterThan(0)

    const dsaSteps = res.steps.filter(s => s.dsaState)
    console.log('Car Fleet DSA steps:', dsaSteps.length)
    expect(dsaSteps.length).toBeGreaterThan(0)
    const types = Array.from(new Set(dsaSteps.map(s => s.dsaState!.type)))
    console.log('Car Fleet DSA types:', types)
    const stackSteps = res.steps.filter(s => s.dsaState?.type === 'stack')
    console.log('Car Fleet stack steps:', stackSteps.length)
    expect(stackSteps.length).toBeGreaterThan(0)
  })

  it('199: Binary Tree Right Side View generates tree visualization steps', () => {
    const code = `// Binary Tree Right Side View — BFS Level Order Traversal O(n)
function TreeNode(val, left, right) {
  this.val = val;
  this.left = left || null;
  this.right = right || null;
}

function rightSideView(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      if (i === levelSize - 1) {
        result.push(node.val);
      }
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }
  return result;
}

const root = new TreeNode(1,
  new TreeNode(2, null, new TreeNode(5)),
  new TreeNode(3, null, new TreeNode(4))
);
const result = rightSideView(root);
console.log('Result:', JSON.stringify(result));`

    const res = interpretCode(code)
    console.log('Right Side View steps:', res.steps.length, 'error:', res.error)
    expect(res.error).toBeUndefined()
    expect(res.steps.length).toBeGreaterThan(0)

    const treeSteps = res.steps.filter(s => s.dsaState?.type === 'tree')
    console.log('Right Side View tree steps:', treeSteps.length)
    expect(treeSteps.length).toBeGreaterThan(0)
  })

  it('91: Decode Ways generates DP array visualization steps', () => {
    const code = `// Decode Ways — 1-D Dynamic Programming O(n)
function numDecodings(s) {
  if (!s || s[0] === '0') return 0;
  const n = s.length;
  const dp = new Array(n + 1).fill(0);
  dp[0] = 1;
  dp[1] = 1;

  for (let i = 2; i <= n; i++) {
    const oneDigit = Number(s.slice(i - 1, i));
    const twoDigits = Number(s.slice(i - 2, i));

    if (oneDigit >= 1 && oneDigit <= 9) {
      dp[i] += dp[i - 1];
    }
    if (twoDigits >= 10 && twoDigits <= 26) {
      dp[i] += dp[i - 2];
    }
  }

  return dp[n];
}

const s = "226";
const result = numDecodings(s);
console.log('Result:', result);`

    const res = interpretCode(code)
    console.log('Decode Ways steps:', res.steps.length, 'error:', res.error)
    expect(res.error).toBeUndefined()
    expect(res.steps.length).toBeGreaterThan(0)

    const arraySteps = res.steps.filter(s => s.dsaState?.type === 'array')
    console.log('Decode Ways array steps:', arraySteps.length)
    expect(arraySteps.length).toBeGreaterThan(0)
  })
})
