import { runCode } from '../utils/universalEngine'

describe('Graph & Matrix Visualization Audit', () => {
  it('Number of Islands generates matrix visualization steps', () => {
    const code = `function numIslands(grid) {
  let count = 0;
  function dfs(r, c) {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return;
    if (grid[r][c] !== '1') return;
    grid[r][c] = '0';
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === '1') {
        count++;
        dfs(r, c);
      }
    }
  }
  return count;
}
const grid = [
  ['1', '1', '0'],
  ['0', '1', '0'],
  ['0', '0', '1']
];
const result = numIslands(grid);
console.log('Result:', result);`

    const res = runCode(code, 'auto')
    console.log('Number of Islands mode:', res.mode, 'error:', res.error, 'steps:', res.steps.length)
    const matrixSteps = res.steps.filter(s => s.dsaState?.type === 'matrix')
    console.log('Matrix steps count:', matrixSteps.length)
    if (matrixSteps.length > 0) {
      console.log('First matrix step dsaState:', JSON.stringify(matrixSteps[0].dsaState))
    }
    expect(res.error).toBeUndefined()
    expect(matrixSteps.length).toBeGreaterThan(0)

    const stepsWithHighlights = matrixSteps.filter(s => s.dsaState?.nodes.some(n => n.highlight !== 'none'))
    console.log('Matrix steps with highlights:', stepsWithHighlights.length)
    if (stepsWithHighlights.length > 0) {
      console.log('Sample highlighted step:', {
        line: stepsWithHighlights[0].line,
        desc: stepsWithHighlights[0].description,
        vars: stepsWithHighlights[0].variables.map(v => `${v.name}=${JSON.stringify(v.value)}`).join(', '),
        matrixMeta: stepsWithHighlights[0].dsaState?.auxiliaryData?.matrix,
        highlightedNodes: stepsWithHighlights[0].dsaState?.nodes.filter(n => n.highlight !== 'none')
      })
    }
  })

  it('Course Schedule generates graph visualization steps', () => {
    const code = `function canFinish(numCourses, prerequisites) {
  const graph = {};
  for (let i = 0; i < numCourses; i++) graph[i] = [];
  for (const [a, b] of prerequisites) graph[a].push(b);
  const state = new Array(numCourses).fill(0);
  function dfs(node) {
    if (state[node] === 1) return false;
    if (state[node] === 2) return true;
    state[node] = 1;
    for (const neighbor of graph[node]) {
      if (!dfs(neighbor)) return false;
    }
    state[node] = 2;
    return true;
  }
  for (let i = 0; i < numCourses; i++) {
    if (!dfs(i)) return false;
  }
  return true;
}
const result = canFinish(3, [[1,0],[2,1]]);
console.log('Result:', result);`

    const res = runCode(code, 'auto')
    console.log('Course Schedule mode:', res.mode, 'error:', res.error, 'steps:', res.steps.length)
    const graphSteps = res.steps.filter(s => s.dsaState?.type === 'graph')
    console.log('Graph steps count:', graphSteps.length)
    if (graphSteps.length > 0) {
      console.log('First graph step dsaState:', JSON.stringify(graphSteps[0].dsaState))
    }
    expect(res.error).toBeUndefined()
    expect(graphSteps.length).toBeGreaterThan(0)
  })

  it('Max Area of Island generates matrix steps', () => {
    const code = `function maxAreaOfIsland(grid) {
  let maxArea = 0;
  function dfs(r, c) {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] === 0) return 0;
    grid[r][c] = 0;
    let area = 1;
    area += dfs(r + 1, c);
    area += dfs(r - 1, c);
    area += dfs(r, c + 1);
    area += dfs(r, c - 1);
    return area;
  }
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === 1) {
        const a = dfs(r, c);
        if (a > maxArea) maxArea = a;
      }
    }
  }
  return maxArea;
}
const grid = [
  [1, 1, 0],
  [1, 0, 0],
  [0, 1, 1]
];
const result = maxAreaOfIsland(grid);
console.log('Result:', result);`

    const res = runCode(code, 'auto')
    console.log('Max Area mode:', res.mode, 'error:', res.error, 'steps:', res.steps.length)
    const matrixSteps = res.steps.filter(s => s.dsaState?.type === 'matrix')
    console.log('Max Area matrix steps:', matrixSteps.length)
    expect(res.error).toBeUndefined()
    expect(matrixSteps.length).toBeGreaterThan(0)
  })

  it('Rotting Oranges generates matrix steps with queue', () => {
    const code = `function orangesRotting(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const queue = [];
  let fresh = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) queue.push([r, c]);
      else if (grid[r][c] === 1) fresh++;
    }
  }
  let minutes = 0;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length > 0 && fresh > 0) {
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const curr = queue.shift();
      const r = curr[0];
      const c = curr[1];
      for (const d of dirs) {
        const nr = r + d[0];
        const nc = c + d[1];
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
          grid[nr][nc] = 2;
          fresh--;
          queue.push([nr, nc]);
        }
      }
    }
    minutes++;
  }
  return fresh === 0 ? minutes : -1;
}
const grid = [
  [2, 1, 1],
  [1, 1, 0],
  [0, 1, 1]
];
const result = orangesRotting(grid);
console.log('Result:', result);`

    const res = runCode(code, 'auto')
    console.log('Rotting Oranges mode:', res.mode, 'error:', res.error, 'steps:', res.steps.length)
    const typeCounts: Record<string, number> = {}
    res.steps.forEach(s => {
      const t = s.dsaState?.type || 'none'
      typeCounts[t] = (typeCounts[t] || 0) + 1
    })
    console.log('Rotting Oranges type counts:', typeCounts)
    const stepsWithQueue = res.steps.filter(s => s.dsaState?.queueItems && s.dsaState.queueItems.length > 0)
    console.log('Rotting Oranges steps with queueItems:', stepsWithQueue.length)
    if (stepsWithQueue.length > 0) {
      console.log('Sample Rotting Oranges queue items:', stepsWithQueue[0].dsaState?.queueItems)
    }
    const matrixSteps = res.steps.filter(s => s.dsaState?.type === 'matrix')
    expect(stepsWithQueue.length).toBeGreaterThan(0)
    expect(res.error).toBeUndefined()
    expect(matrixSteps.length).toBeGreaterThan(0)
  })

  it('Pacific Atlantic Water Flow generates matrix steps', () => {
    const code = `function pacificAtlantic(heights) {
  const rows = heights.length;
  const cols = heights[0].length;
  const pac = [];
  const atl = [];
  for (let r = 0; r < rows; r++) {
    pac.push(new Array(cols).fill(false));
    atl.push(new Array(cols).fill(false));
  }
  function dfs(r, c, ocean) {
    ocean[r][c] = true;
    const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
    for (const d of dirs) {
      const nr = r + d[0];
      const nc = c + d[1];
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !ocean[nr][nc] && heights[nr][nc] >= heights[r][c]) {
        dfs(nr, nc, ocean);
      }
    }
  }
  for (let r = 0; r < rows; r++) {
    dfs(r, 0, pac);
    dfs(r, cols - 1, atl);
  }
  return pac;
}
const heights = [
  [1, 2, 2],
  [3, 2, 3],
  [2, 4, 5]
];
const result = pacificAtlantic(heights);
console.log('Result:', result);`

    const res = runCode(code, 'auto')
    console.log('Pacific Atlantic mode:', res.mode, 'error:', res.error, 'steps:', res.steps.length)
    const matrixSteps = res.steps.filter(s => s.dsaState?.type === 'matrix')
    console.log('Pacific Atlantic matrix steps:', matrixSteps.length)
    expect(res.error).toBeUndefined()
    expect(matrixSteps.length).toBeGreaterThan(0)
  })

  it('Spiral Matrix generates matrix steps with traversal pointers', () => {
    const code = `function spiralOrder(matrix) {
  const result = [];
  if (!matrix.length) return result;
  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) {
      result.push(matrix[top][c]);
    }
    top++;
    for (let r = top; r <= bottom; r++) {
      result.push(matrix[r][right]);
    }
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) {
        result.push(matrix[bottom][c]);
      }
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) {
        result.push(matrix[r][left]);
      }
      left++;
    }
  }
  return result;
}
const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];
const result = spiralOrder(matrix);
console.log('Result:', result);`

    const res = runCode(code, 'auto')
    console.log('Spiral Matrix mode:', res.mode, 'error:', res.error, 'steps:', res.steps.length)
    const matrixSteps = res.steps.filter(s => s.dsaState?.type === 'matrix')
    console.log('Spiral Matrix matrix steps:', matrixSteps.length)
    expect(res.error).toBeUndefined()
    expect(matrixSteps.length).toBeGreaterThan(0)
  })

  it('Set Matrix Zeroes generates matrix steps', () => {
    const code = `function setZeroes(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  let firstRowZero = false;
  let firstColZero = false;
  for (let r = 0; r < rows; r++) {
    if (matrix[r][0] === 0) firstColZero = true;
  }
  for (let c = 0; c < cols; c++) {
    if (matrix[0][c] === 0) firstRowZero = true;
  }
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      if (matrix[r][c] === 0) {
        matrix[r][0] = 0;
        matrix[0][c] = 0;
      }
    }
  }
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      if (matrix[r][0] === 0 || matrix[0][c] === 0) {
        matrix[r][c] = 0;
      }
    }
  }
  if (firstRowZero) {
    for (let c = 0; c < cols; c++) matrix[0][c] = 0;
  }
  if (firstColZero) {
    for (let r = 0; r < rows; r++) matrix[r][0] = 0;
  }
  return matrix;
}
const matrix = [
  [1, 1, 1],
  [1, 0, 1],
  [1, 1, 1]
];
const result = setZeroes(matrix);
console.log('Result:', result);`

    const res = runCode(code, 'auto')
    console.log('Set Matrix Zeroes mode:', res.mode, 'error:', res.error, 'steps:', res.steps.length)
    const matrixSteps = res.steps.filter(s => s.dsaState?.type === 'matrix')
    console.log('Set Matrix Zeroes matrix steps:', matrixSteps.length)
    expect(res.error).toBeUndefined()
    expect(matrixSteps.length).toBeGreaterThan(0)
  })

  it('Clone Graph generates graph steps with node cloning', () => {
    const code = `function cloneGraph(graph, start) {
  const cloned = {};
  const queue = [start];
  cloned[start] = [];
  while (queue.length > 0) {
    const curr = queue.shift();
    for (const neighbor of graph[curr]) {
      if (!cloned[neighbor]) {
        cloned[neighbor] = [];
        queue.push(neighbor);
      }
      cloned[curr].push(neighbor);
    }
  }
  return cloned;
}
const graph = {
  1: [2, 4],
  2: [1, 3],
  3: [2, 4],
  4: [1, 3]
};
const result = cloneGraph(graph, 1);
console.log('Result:', result);`

    const res = runCode(code, 'auto')
    console.log('Clone Graph mode:', res.mode, 'error:', res.error, 'steps:', res.steps.length)
    const typeCounts: Record<string, number> = {}
    res.steps.forEach(s => {
      const t = s.dsaState?.type || 'none'
      typeCounts[t] = (typeCounts[t] || 0) + 1
    })
    console.log('Clone Graph type counts:', typeCounts)
    const graphSteps = res.steps.filter(s => s.dsaState?.type === 'graph')
    console.log('Clone Graph graph steps:', graphSteps.length)
    const stepsWithQueue = res.steps.filter(s => s.dsaState?.queueItems && s.dsaState.queueItems.length > 0)
    console.log('Clone Graph steps with queueItems:', stepsWithQueue.length)
    if (stepsWithQueue.length > 0) {
      console.log('Sample Clone Graph queue items:', stepsWithQueue[0].dsaState?.queueItems)
    }
    expect(stepsWithQueue.length).toBeGreaterThan(0)
    expect(res.error).toBeUndefined()
    expect(graphSteps.length).toBeGreaterThan(0)
  })
})
