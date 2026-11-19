import { DSANode, DSAEdge } from '../store/ideStore'

export interface LayoutOptions {
  width?: number
  height?: number
  nodeRadius?: number
  paddingX?: number
  paddingY?: number
  isDualTree?: boolean
}

/**
 * Computes dynamic, non-overlapping (x, y) coordinates for binary tree nodes.
 * Uses hierarchical in-order projection so that left < parent < right strictly holds,
 * preventing any sibling or cousin node overlap at any depth.
 */
export function computeTreeLayout(
  rawNodes: DSANode[],
  rawEdges: DSAEdge[] = [],
  options: LayoutOptions = {}
): { nodes: DSANode[]; edges: DSAEdge[] } {
  if (!rawNodes.length) {
    return { nodes: [], edges: [] }
  }

  const width = options.width ?? 650
  const height = options.height ?? 400
  const padX = options.paddingX ?? 50
  const padY = options.paddingY ?? 50
  const r = options.nodeRadius ?? 22

  // Build lookup maps and child sets
  const nodeMap = new Map<string, DSANode>()
  const childrenSet = new Set<string>()
  const adj = new Map<string, { left?: string; right?: string }>()

  rawNodes.forEach(n => {
    nodeMap.set(n.id, { ...n })
    adj.set(n.id, {})
  })

  // Map edges or node.left/node.right pointers
  const edges: DSAEdge[] = [...rawEdges]

  rawNodes.forEach(n => {
    const currentAdj = adj.get(n.id)!
    if (n.left) {
      currentAdj.left = n.left
      childrenSet.add(n.left)
      if (!edges.some(e => e.from === n.id && e.to === n.left)) {
        edges.push({ id: `e-${n.id}-${n.left}`, from: n.id, to: n.left, directed: true, label: 'L' })
      }
    }
    if (n.right) {
      currentAdj.right = n.right
      childrenSet.add(n.right)
      if (!edges.some(e => e.from === n.id && e.to === n.right)) {
        edges.push({ id: `e-${n.id}-${n.right}`, from: n.id, to: n.right, directed: true, label: 'R' })
      }
    }
  })

  // Also read edges to populate adj if left/right was not on node
  edges.forEach(e => {
    childrenSet.add(e.to)
    const pAdj = adj.get(e.from)
    if (pAdj) {
      if (!pAdj.left && e.label !== 'R') {
        pAdj.left = e.to
      } else if (!pAdj.right) {
        pAdj.right = e.to
      }
    }
  })

  // Identify root(s) (nodes that have in-degree 0)
  const roots = rawNodes.filter(n => !childrenSet.has(n.id))
  if (roots.length === 0 && rawNodes.length > 0) {
    roots.push(rawNodes[0])
  }

  // Layout each root subtree. If multiple roots (e.g. Same Tree p and q), divide horizontal canvas.
  const numRoots = roots.length
  const subtreeWidth = (width - padX * 2) / numRoots

  const layoutSubtree = (rootId: string, rootIndex: number) => {
    const subtreeNodes: string[] = []
    const depthMap = new Map<string, number>()
    let maxSubtreeDepth = 0

    // 1. BFS to get depths and collect reachable nodes
    const queue: Array<{ id: string; depth: number }> = [{ id: rootId, depth: 0 }]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)
      subtreeNodes.push(id)
      depthMap.set(id, depth)
      if (depth > maxSubtreeDepth) maxSubtreeDepth = depth

      const nodeAdj = adj.get(id)
      if (nodeAdj?.left && nodeMap.has(nodeAdj.left)) {
        queue.push({ id: nodeAdj.left, depth: depth + 1 })
      }
      if (nodeAdj?.right && nodeMap.has(nodeAdj.right)) {
        queue.push({ id: nodeAdj.right, depth: depth + 1 })
      }
    }

    // 2. In-order traversal of this subtree to assign horizontal order
    const inorderList: string[] = []
    const inorderVisit = (id: string | undefined) => {
      if (!id || !nodeMap.has(id)) return
      const nodeAdj = adj.get(id)
      if (nodeAdj?.left && visited.has(nodeAdj.left)) {
        inorderVisit(nodeAdj.left)
      }
      inorderList.push(id)
      if (nodeAdj?.right && visited.has(nodeAdj.right)) {
        inorderVisit(nodeAdj.right)
      }
    }
    inorderVisit(rootId)

    // Fallback: if any nodes in subtree were missed by in-order, append them
    subtreeNodes.forEach(id => {
      if (!inorderList.includes(id)) inorderList.push(id)
    })

    // 3. Compute coordinates
    const startX = padX + rootIndex * subtreeWidth
    const availableW = Math.max(subtreeWidth, inorderList.length * (r * 2 + 16))
    const stepX = inorderList.length > 1 ? (availableW - 40) / (inorderList.length - 1) : 0
    const stepY = maxSubtreeDepth > 0 ? Math.min(85, (height - padY * 2 - 40) / maxSubtreeDepth) : 80

    inorderList.forEach((id, orderIdx) => {
      const node = nodeMap.get(id)!
      const depth = depthMap.get(id) ?? 0
      node.depth = depth
      node.x = inorderList.length === 1 ? startX + availableW / 2 : startX + 20 + orderIdx * stepX
      node.y = padY + 20 + depth * stepY
    })
  }

  roots.forEach((rootNode, i) => {
    layoutSubtree(rootNode.id, i)
  })

  // Handle any orphan nodes not reachable from roots
  rawNodes.forEach(n => {
    const node = nodeMap.get(n.id)!
    if (node.x === undefined || node.y === undefined) {
      node.x = width / 2
      node.y = padY + 20
    }
  })

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
  }
}

/**
 * Computes synchronized Array and Complete Binary Tree layout for Heaps.
 * For any heap of size N:
 * - Node i has parent floor((i - 1) / 2)
 * - Node i has left child 2i + 1 (if < N)
 * - Node i has right child 2i + 2 (if < N)
 * - Horizontal spread is evenly spaced per level with zero overlap.
 */
export function computeHeapLayout(
  heapArray: Array<number | string | DSANode>,
  options: LayoutOptions = {}
): { nodes: DSANode[]; edges: DSAEdge[] } {
  if (!heapArray.length) {
    return { nodes: [], edges: [] }
  }

  const n = heapArray.length
  const width = options.width ?? 650
  const height = options.height ?? 380
  const padX = options.paddingX ?? 40
  const padY = options.paddingY ?? 40

  const maxDepth = Math.floor(Math.log2(n))
  const stepY = maxDepth > 0 ? Math.min(75, (height - padY * 2) / maxDepth) : 75

  const nodes: DSANode[] = []
  const edges: DSAEdge[] = []

  for (let i = 0; i < n; i++) {
    const item = heapArray[i]
    const id = typeof item === 'object' && item.id ? item.id : `heap-n-${i}`
    const val = typeof item === 'object' && item.value !== undefined ? item.value : item
    const hl = typeof item === 'object' && item.highlight ? item.highlight : 'none'
    const label = typeof item === 'object' && item.label ? item.label : `[${i}]`

    const depth = Math.floor(Math.log2(i + 1))
    const posInLevel = i - (Math.pow(2, depth) - 1)
    const countInLevel = Math.pow(2, depth)

    // Evenly distribute across width for this level
    const levelWidth = width - padX * 2
    const spreadX = levelWidth / (countInLevel + 1)
    const x = padX + (posInLevel + 1) * spreadX
    const y = padY + 20 + depth * stepY

    const leftIdx = 2 * i + 1
    const rightIdx = 2 * i + 2
    const parentIdx = i > 0 ? Math.floor((i - 1) / 2) : undefined

    nodes.push({
      id,
      value: val as string | number,
      x,
      y,
      depth,
      highlight: hl,
      label,
      left: leftIdx < n ? (typeof heapArray[leftIdx] === 'object' && (heapArray[leftIdx] as DSANode).id ? (heapArray[leftIdx] as DSANode).id : `heap-n-${leftIdx}`) : undefined,
      right: rightIdx < n ? (typeof heapArray[rightIdx] === 'object' && (heapArray[rightIdx] as DSANode).id ? (heapArray[rightIdx] as DSANode).id : `heap-n-${rightIdx}`) : undefined,
      parent: parentIdx !== undefined ? (typeof heapArray[parentIdx] === 'object' && (heapArray[parentIdx] as DSANode).id ? (heapArray[parentIdx] as DSANode).id : `heap-n-${parentIdx}`) : undefined,
    })

    // Edges from parent to this node
    if (i > 0 && parentIdx !== undefined) {
      const parentId = typeof heapArray[parentIdx] === 'object' && (heapArray[parentIdx] as DSANode).id ? (heapArray[parentIdx] as DSANode).id : `heap-n-${parentIdx}`
      edges.push({
        id: `e-${parentId}-${id}`,
        from: parentId,
        to: id,
        directed: true,
        label: i === 2 * parentIdx + 1 ? 'L' : 'R',
      })
    }
  }

  return { nodes, edges }
}
