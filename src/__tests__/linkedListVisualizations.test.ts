import {
  detectAlgorithm,
  genReverseList,
  genMergeTwoLists,
  genReorderList,
  genHasCycle,
  genRemoveNthFromEnd,
  SAMPLE_CODES
} from '../utils/executionEngine'
import { runCode } from '../utils/universalEngine'

describe('Linked List Visualization Suite (5 Core Problems)', () => {

  // ───────────────────────────────────────────────────────────────────────────
  // 1. REVERSE LINKED LIST
  // ───────────────────────────────────────────────────────────────────────────
  describe('Reverse Linked List', () => {
    it('detects reverseList algorithm correctly', () => {
      const code = `
        function reverseList(head) {
          let prev = null, curr = head;
          while (curr !== null) {
            const nextNode = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nextNode;
          }
          return prev;
        }
      `
      expect(detectAlgorithm(code)).toBe('reverseList')
    })

    it('generates execution steps with prev, curr, next badges and reversed links', () => {
      const steps = genReverseList([1, 2, 3, 4, 5])
      expect(steps.length).toBeGreaterThanOrEqual(15)

      // Initial step has head at node 1
      const firstState = steps[0].dsaState!
      expect(firstState.type).toBe('linkedlist')
      expect(firstState.nodes).toHaveLength(5)
      expect(firstState.nodes[0].x).toBeDefined()
      expect(firstState.nodes[0].y).toBe(140)

      // Intermediate step has prev and curr badges
      const stepWithBadges = steps.find(s => s.dsaState?.nodes.some(n => n.label?.includes('prev') && s.dsaState?.nodes.some(m => m.label?.includes('curr'))))
      expect(stepWithBadges).toBeDefined()

      // Reversed edges appear
      const stepWithRevEdge = steps.find(s => s.dsaState?.edges?.some(e => e.id.includes('rev')))
      expect(stepWithRevEdge).toBeDefined()

      // Final step has all nodes marked found and prev as new head
      const lastStep = steps[steps.length - 1]
      expect(lastStep.dsaState?.nodes.every(n => n.highlight === 'found')).toBe(true)
      expect(lastStep.dsaState?.nodes[4].label).toContain('new head')
    })

    it('executes through universalEngine interpreter mode', () => {
      const code = SAMPLE_CODES.reverseList?.code || `
        function ListNode(val, next) { this.val = val; this.next = next || null; }
        function reverseList(head) {
          let prev = null, curr = head;
          while (curr) { const next = curr.next; curr.next = prev; prev = curr; curr = next; }
          return prev;
        }
        const head = new ListNode(1, new ListNode(2, new ListNode(3)));
        reverseList(head);
      `
      const result = runCode(code, 'auto')
      expect(result.steps.length).toBeGreaterThan(0)
      const llSteps = result.steps.filter(s => s.dsaState?.type === 'linkedlist')
      expect(llSteps.length).toBeGreaterThan(0)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 2. MERGE TWO SORTED LISTS
  // ───────────────────────────────────────────────────────────────────────────
  describe('Merge Two Sorted Lists', () => {
    it('detects mergeTwoLists algorithm correctly', () => {
      const code = `
        function mergeTwoLists(list1, list2) {
          const dummy = new ListNode(0);
          let curr = dummy;
          while (list1 !== null && list2 !== null) {
            if (list1.val <= list2.val) { curr.next = list1; list1 = list1.next; }
            else { curr.next = list2; list2 = list2.next; }
            curr = curr.next;
          }
          curr.next = list1 !== null ? list1 : list2;
          return dummy.next;
        }
      `
      expect(detectAlgorithm(code)).toBe('mergeTwoLists')
    })

    it('generates multi-row layout for list1, list2, and dummy/merged list', () => {
      const steps = genMergeTwoLists([1, 2, 4], [1, 3, 4])
      expect(steps.length).toBeGreaterThanOrEqual(10)

      const firstState = steps[0].dsaState!
      expect(firstState.type).toBe('linkedlist')

      // Nodes for list1 (y=80), list2 (y=175), dummy (y=270)
      const l1Nodes = firstState.nodes.filter(n => n.id.startsWith('l1-'))
      const l2Nodes = firstState.nodes.filter(n => n.id.startsWith('l2-'))
      const dummyNode = firstState.nodes.find(n => n.id === 'dummy')

      expect(l1Nodes).toHaveLength(3)
      expect(l2Nodes).toHaveLength(3)
      expect(dummyNode).toBeDefined()
      expect(dummyNode?.y).toBe(270)

      // Pointer badges advance
      const stepWithList1 = steps.find(s => s.dsaState?.nodes.some(n => n.label === 'list1'))
      const stepWithList2 = steps.find(s => s.dsaState?.nodes.some(n => n.label === 'list2'))
      expect(stepWithList1).toBeDefined()
      expect(stepWithList2).toBeDefined()

      // Final step has merged list highlighted with found
      const lastStep = steps[steps.length - 1]
      const mergedFound = lastStep.dsaState?.nodes.filter(n => n.id.startsWith('m-') && n.highlight === 'found')
      expect(mergedFound?.length).toBe(6)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 3. REORDER LIST
  // ───────────────────────────────────────────────────────────────────────────
  describe('Reorder List', () => {
    it('detects reorderList algorithm correctly', () => {
      const code = `
        function reorderList(head) {
          let slow = head, fast = head.next;
          while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
          let prev = null, curr = slow.next;
          slow.next = null;
          while (curr) { const next = curr.next; curr.next = prev; prev = curr; curr = next; }
          let first = head, second = prev;
          while (second) {
            const tmp1 = first.next, tmp2 = second.next;
            first.next = second; second.next = tmp1;
            first = tmp1; second = tmp2;
          }
          return head;
        }
      `
      expect(detectAlgorithm(code)).toBe('reorderList')
    })

    it('generates phases: slow/fast find mid, split & reverse, alternating merge', () => {
      const steps = genReorderList([1, 2, 3, 4])
      expect(steps.length).toBeGreaterThanOrEqual(4)

      // Phase 1 has slow and fast labels
      const slowFastStep = steps.find(s => s.dsaState?.nodes.some(n => n.label?.includes('slow') || n.label?.includes('fast')))
      expect(slowFastStep).toBeDefined()

      // Mid split step
      const splitStep = steps.find(s => s.description.includes('Midpoint'))
      expect(splitStep).toBeDefined()

      // Final step has interleaved nodes
      const lastStep = steps[steps.length - 1]
      expect(lastStep.dsaState?.nodes.map(n => n.value)).toEqual([1, 4, 2, 3])
      expect(lastStep.dsaState?.nodes.every(n => n.highlight === 'found')).toBe(true)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 4. LINKED LIST CYCLE
  // ───────────────────────────────────────────────────────────────────────────
  describe('Linked List Cycle', () => {
    it('detects hasCycle algorithm correctly', () => {
      const code = `
        function hasCycle(head) {
          let slow = head, fast = head;
          while (fast !== null && fast.next !== null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow === fast) return true;
          }
          return false;
        }
      `
      expect(detectAlgorithm(code)).toBe('hasCycle')
    })

    it('generates cycle back-edge and detects collision point when slow === fast', () => {
      const steps = genHasCycle([3, 2, 0, -4], 1)
      expect(steps.length).toBeGreaterThanOrEqual(4)

      // Cycle edge exists
      const firstState = steps[0].dsaState!
      const cycleEdge = firstState.edges?.find(e => e.label === 'cycle' || e.id === 'e-cycle-tail')
      expect(cycleEdge).toBeDefined()
      expect(cycleEdge?.from).toBe('c-node-3')
      expect(cycleEdge?.to).toBe('c-node-1')

      // Collision step where slow and fast meet
      const collisionStep = steps.find(s => s.dsaState?.nodes.some(n => n.label?.includes('slow') && n.label?.includes('fast')))
      expect(collisionStep).toBeDefined()
      expect(collisionStep?.description).toContain('Cycle detected')
      expect(collisionStep?.output).toBe('true')
    })

    it('handles pos = -1 when no cycle exists', () => {
      const steps = genHasCycle([1, 2], -1)
      const noCycleStep = steps.find(s => s.description.includes('no cycle') || s.output === 'false')
      expect(noCycleStep).toBeDefined()
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 5. REMOVE NTH NODE FROM END
  // ───────────────────────────────────────────────────────────────────────────
  describe('Remove Nth Node From End', () => {
    it('detects removeNthFromEnd algorithm correctly', () => {
      const code = `
        function removeNthFromEnd(head, n) {
          const dummy = new ListNode(0, head);
          let fast = dummy, slow = dummy;
          for (let i = 0; i <= n; i++) fast = fast.next;
          while (fast !== null) {
            slow = slow.next;
            fast = fast.next;
          }
          slow.next = slow.next.next;
          return dummy.next;
        }
      `
      expect(detectAlgorithm(code)).toBe('removeNthFromEnd')
    })

    it('generates steps with dummy node, advance gap, and skip link for removed node', () => {
      const steps = genRemoveNthFromEnd([1, 2, 3, 4, 5], 2)
      expect(steps.length).toBeGreaterThanOrEqual(6)

      // Dummy node present
      const firstState = steps[0].dsaState!
      expect(firstState.nodes.find(n => n.id === 'n-dummy')).toBeDefined()

      // Bypass step where slow.next = slow.next.next removes node 4 (index 3)
      const bypassStep = steps.find(s => s.description.includes('slow.next = slow.next.next'))
      expect(bypassStep).toBeDefined()
      const removedNode = bypassStep?.dsaState?.nodes.find(n => n.id === 'node-3')
      expect(removedNode?.highlight).toBe('skipped')
      expect(removedNode?.label).toContain('removed')

      // Skip edge bypassing node 4
      const skipEdge = bypassStep?.dsaState?.edges?.find(e => e.id.includes('skip'))
      expect(skipEdge).toBeDefined()

      // Final step has list [1, 2, 3, 5]
      const lastStep = steps[steps.length - 1]
      expect(lastStep.output).toBe('[1,2,3,5]')
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // PRESETS IN SAMPLE_CODES
  // ───────────────────────────────────────────────────────────────────────────
  describe('SAMPLE_CODES presets', () => {
    it('contains presets for all linked list problems', () => {
      expect(SAMPLE_CODES.linkedList).toBeDefined()
      expect(SAMPLE_CODES.reorderList).toBeDefined()
      expect(SAMPLE_CODES.hasCycle).toBeDefined()
      expect(SAMPLE_CODES.removeNthFromEnd).toBeDefined()
    })
  })
})
