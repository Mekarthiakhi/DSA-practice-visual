/**
 * Multi-Language Code Samples
 * Python, Java, C, C++, C#, Go, Rust
 * All major DSA + common patterns in each language
 */

export type SampleLang = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'c' | 'csharp' | 'go' | 'rust'

export interface CodeSample {
  label: string
  language: SampleLang
  category: string
  description: string
  code: string
}

export const MULTI_LANG_SAMPLES: Record<string, CodeSample> = {

  // ══════════════════════════════════════════════════════════════
  // PYTHON
  // ══════════════════════════════════════════════════════════════

  py_bubble: {
    label: 'Bubble Sort', language: 'python', category: 'Python — Sorting',
    description: 'Classic O(n²) sorting with swap visualization',
    code: `# Bubble Sort in Python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

data = [64, 34, 25, 12, 22, 11, 90]
print("Input: ", data)
sorted_data = bubble_sort(data[:])
print("Sorted:", sorted_data)`,
  },

  py_binary_search: {
    label: 'Binary Search', language: 'python', category: 'Python — Searching',
    description: 'O(log n) divide-and-conquer search',
    code: `# Binary Search in Python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        print(f"  left={left} mid={mid} right={right} arr[mid]={arr[mid]}")
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1

arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
target = 23
result = binary_search(arr, target)
print(f"Found {target} at index: {result}")`,
  },

  py_fibonacci: {
    label: 'Fibonacci', language: 'python', category: 'Python — Recursion',
    description: 'Recursive Fibonacci with memoization',
    code: `# Fibonacci with memoization
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

print("Fibonacci sequence:")
for i in range(11):
    print(f"  F({i}) = {fib(i)}")`,
  },

  py_linked_list: {
    label: 'Linked List', language: 'python', category: 'Python — Data Structures',
    description: 'Singly linked list with push and traversal',
    code: `# Singly Linked List in Python
class Node:
    def __init__(self, value):
        self.value = value
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None
        self.size = 0

    def push(self, value):
        node = Node(value)
        if not self.head:
            self.head = node
        else:
            cur = self.head
            while cur.next:
                cur = cur.next
            cur.next = node
        self.size += 1

    def display(self):
        values = []
        cur = self.head
        while cur:
            values.append(str(cur.value))
            cur = cur.next
        print(" -> ".join(values) + " -> None")

ll = LinkedList()
for v in [10, 20, 30, 40, 50]:
    ll.push(v)
    print(f"Inserted {v}, size={ll.size}")
ll.display()`,
  },

  py_two_sum: {
    label: 'Two Sum', language: 'python', category: 'Python — Problems',
    description: 'LeetCode #1 with hashmap approach O(n)',
    code: `# Two Sum — LeetCode #1
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        print(f"  i={i} num={num} complement={complement} seen={seen}")
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return [-1, -1]

nums = [2, 7, 11, 15]
target = 9
result = two_sum(nums, target)
print(f"Answer: {result}")`,
  },

  py_bst: {
    label: 'Binary Search Tree', language: 'python', category: 'Python — Data Structures',
    description: 'BST insert and in-order traversal',
    code: `# Binary Search Tree in Python
class BST:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

def insert(root, val):
    if root is None:
        return BST(val)
    if val < root.val:
        root.left = insert(root.left, val)
    else:
        root.right = insert(root.right, val)
    return root

def inorder(root, result=None):
    if result is None:
        result = []
    if root:
        inorder(root.left, result)
        result.append(root.val)
        inorder(root.right, result)
    return result

values = [50, 30, 70, 20, 40, 60, 80]
root = None
for v in values:
    root = insert(root, v)
    print(f"Inserted {v}")

print("In-order:", inorder(root))`,
  },

  py_list_comprehension: {
    label: 'List Comprehensions', language: 'python', category: 'Python — Patterns',
    description: 'Pythonic list operations',
    code: `# Python List Comprehensions & Generators

numbers = list(range(1, 21))

# Filter primes
def is_prime(n):
    return n > 1 and all(n % i != 0 for i in range(2, int(n**0.5) + 1))

primes = [n for n in numbers if is_prime(n)]
squares = [n**2 for n in range(1, 11)]
evens = [n for n in numbers if n % 2 == 0]
flat = [x for row in [[1,2],[3,4],[5,6]] for x in row]

print("Primes:", primes)
print("Squares:", squares)
print("Evens:", evens)
print("Flattened:", flat)`,
  },

  py_sorting_algos: {
    label: 'Quick Sort', language: 'python', category: 'Python — Sorting',
    description: 'Quick sort with partition',
    code: `# Quick Sort in Python
def quick_sort(arr, low=0, high=None):
    if high is None:
        high = len(arr) - 1
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)
    return arr

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    print(f"  Pivot={pivot} → {arr}")
    return i + 1

data = [10, 7, 8, 9, 1, 5]
print("Input: ", data)
result = quick_sort(data[:])
print("Sorted:", result)`,
  },

  py_stack_queue: {
    label: 'Stack & Queue', language: 'python', category: 'Python — Data Structures',
    description: 'Stack (LIFO) and Queue (FIFO) using deque',
    code: `# Stack and Queue in Python
from collections import deque

# Stack (LIFO)
stack = []
for v in [10, 20, 30, 40]:
    stack.append(v)
    print(f"Push {v}  → stack: {stack}")

while stack:
    popped = stack.pop()
    print(f"Pop {popped} → stack: {stack}")

print()

# Queue (FIFO)
queue = deque()
for v in [1, 2, 3, 4]:
    queue.append(v)
    print(f"Enqueue {v} → queue: {list(queue)}")

while queue:
    front = queue.popleft()
    print(f"Dequeue {front} → queue: {list(queue)}")`,
  },

  // ══════════════════════════════════════════════════════════════
  // JAVA
  // ══════════════════════════════════════════════════════════════

  java_bubble: {
    label: 'Bubble Sort', language: 'java', category: 'Java — Sorting',
    description: 'Classic bubble sort in Java',
    code: `// Bubble Sort in Java
public class BubbleSort {
    public static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }

    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90};
        System.out.println("Before: " + java.util.Arrays.toString(arr));
        bubbleSort(arr);
        System.out.println("After:  " + java.util.Arrays.toString(arr));
    }
}`,
  },

  java_binary_search: {
    label: 'Binary Search', language: 'java', category: 'Java — Searching',
    description: 'Iterative binary search',
    code: `// Binary Search in Java
public class BinarySearch {
    public static int binarySearch(int[] arr, int target) {
        int left = 0, right = arr.length - 1;
        
        while (left <= right) {
            int mid = left + (right - left) / 2;
            System.out.println("left=" + left + " mid=" + mid + " right=" + right);
            
            if (arr[mid] == target) return mid;
            else if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] arr = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
        int target = 23;
        int idx = binarySearch(arr, target);
        System.out.println("Found " + target + " at index: " + idx);
    }
}`,
  },

  java_fibonacci: {
    label: 'Fibonacci DP', language: 'java', category: 'Java — Recursion',
    description: 'Fibonacci with dynamic programming',
    code: `// Fibonacci with Dynamic Programming
public class Fibonacci {
    public static long fib(int n) {
        if (n <= 1) return n;
        long[] dp = new long[n + 1];
        dp[0] = 0;
        dp[1] = 1;
        for (int i = 2; i <= n; i++) {
            dp[i] = dp[i-1] + dp[i-2];
            System.out.println("F(" + i + ") = " + dp[i]);
        }
        return dp[n];
    }

    public static void main(String[] args) {
        System.out.println("Fibonacci sequence:");
        for (int i = 0; i <= 10; i++) {
            System.out.println("F(" + i + ") = " + fib(i));
        }
    }
}`,
  },

  java_linked_list: {
    label: 'Linked List', language: 'java', category: 'Java — Data Structures',
    description: 'Generic linked list in Java',
    code: `// Singly Linked List in Java
public class LinkedList<T> {
    private class Node {
        T data;
        Node next;
        Node(T data) { this.data = data; }
    }
    
    private Node head;
    private int size;
    
    public void add(T value) {
        Node node = new Node(value);
        if (head == null) {
            head = node;
        } else {
            Node cur = head;
            while (cur.next != null) cur = cur.next;
            cur.next = node;
        }
        size++;
        System.out.println("Added " + value + ", size=" + size);
    }
    
    public static void main(String[] args) {
        LinkedList<Integer> list = new LinkedList<>();
        for (int v : new int[]{10, 20, 30, 40, 50}) {
            list.add(v);
        }
    }
}`,
  },

  java_stack: {
    label: 'Stack', language: 'java', category: 'Java — Data Structures',
    description: 'Stack implementation using ArrayDeque',
    code: `// Stack in Java
import java.util.ArrayDeque;
import java.util.Deque;

public class StackDemo {
    public static void main(String[] args) {
        Deque<Integer> stack = new ArrayDeque<>();
        
        // Push
        for (int v : new int[]{10, 20, 30, 40}) {
            stack.push(v);
            System.out.println("Push " + v + " → " + stack);
        }
        
        System.out.println("Peek: " + stack.peek());
        
        // Pop
        while (!stack.isEmpty()) {
            System.out.println("Pop: " + stack.pop() + " → " + stack);
        }
    }
}`,
  },

  java_hashmap: {
    label: 'HashMap', language: 'java', category: 'Java — Data Structures',
    description: 'HashMap operations in Java',
    code: `// HashMap in Java
import java.util.HashMap;
import java.util.Map;

public class HashMapDemo {
    public static void main(String[] args) {
        Map<String, Integer> freq = new HashMap<>();
        String[] words = {"apple","banana","apple","cherry","banana","apple"};
        
        // Count word frequency
        for (String word : words) {
            freq.put(word, freq.getOrDefault(word, 0) + 1);
            System.out.println("Process '" + word + "' → " + freq);
        }
        
        // Find most frequent
        String maxWord = "";
        int maxCount = 0;
        for (Map.Entry<String, Integer> entry : freq.entrySet()) {
            if (entry.getValue() > maxCount) {
                maxCount = entry.getValue();
                maxWord = entry.getKey();
            }
        }
        System.out.println("Most frequent: " + maxWord + " (" + maxCount + ")");
    }
}`,
  },

  // ══════════════════════════════════════════════════════════════
  // C++
  // ══════════════════════════════════════════════════════════════

  cpp_bubble: {
    label: 'Bubble Sort', language: 'cpp', category: 'C++ — Sorting',
    description: 'Bubble sort with swap counter',
    code: `// Bubble Sort in C++
#include <iostream>
#include <vector>
using namespace std;

void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    int swaps = 0;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
                swaps++;
            }
        }
    }
    cout << "Total swaps: " << swaps << endl;
}

int main() {
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    cout << "Before: ";
    for (int x : arr) cout << x << " ";
    cout << endl;
    
    bubbleSort(arr);
    
    cout << "After:  ";
    for (int x : arr) cout << x << " ";
    cout << endl;
    return 0;
}`,
  },

  cpp_binary_search: {
    label: 'Binary Search', language: 'cpp', category: 'C++ — Searching',
    description: 'STL lower_bound and manual binary search',
    code: `// Binary Search in C++
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int binarySearch(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        cout << "left=" << left << " mid=" << mid << " right=" << right << endl;
        
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

int main() {
    vector<int> arr = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    int target = 23;
    int idx = binarySearch(arr, target);
    cout << "Found " << target << " at index: " << idx << endl;
    return 0;
}`,
  },

  cpp_linked_list: {
    label: 'Linked List', language: 'cpp', category: 'C++ — Data Structures',
    description: 'Linked list with pointers and memory',
    code: `// Singly Linked List in C++
#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

class LinkedList {
    Node* head;
    int size;
public:
    LinkedList() : head(nullptr), size(0) {}
    
    void push(int val) {
        Node* node = new Node(val);
        if (!head) { head = node; }
        else {
            Node* cur = head;
            while (cur->next) cur = cur->next;
            cur->next = node;
        }
        size++;
        cout << "Inserted " << val << ", size=" << size << endl;
    }
    
    void display() {
        Node* cur = head;
        while (cur) {
            cout << cur->data << " -> ";
            cur = cur->next;
        }
        cout << "NULL" << endl;
    }
};

int main() {
    LinkedList ll;
    for (int v : {10, 20, 30, 40, 50}) ll.push(v);
    ll.display();
    return 0;
}`,
  },

  cpp_stack: {
    label: 'Stack', language: 'cpp', category: 'C++ — Data Structures',
    description: 'Stack using STL',
    code: `// Stack in C++ using STL
#include <iostream>
#include <stack>
using namespace std;

int main() {
    stack<int> st;
    
    // Push
    for (int v : {10, 20, 30, 40}) {
        st.push(v);
        cout << "Push " << v << " | Top: " << st.top() << " Size: " << st.size() << endl;
    }
    
    cout << "--- Popping ---" << endl;
    
    // Pop
    while (!st.empty()) {
        cout << "Pop: " << st.top() << endl;
        st.pop();
    }
    
    return 0;
}`,
  },

  cpp_bst: {
    label: 'BST', language: 'cpp', category: 'C++ — Data Structures',
    description: 'Binary Search Tree insert and traversal',
    code: `// Binary Search Tree in C++
#include <iostream>
using namespace std;

struct Node {
    int val;
    Node *left, *right;
    Node(int v) : val(v), left(nullptr), right(nullptr) {}
};

Node* insert(Node* root, int val) {
    if (!root) return new Node(val);
    if (val < root->val) root->left = insert(root->left, val);
    else root->right = insert(root->right, val);
    return root;
}

void inorder(Node* root) {
    if (!root) return;
    inorder(root->left);
    cout << root->val << " ";
    inorder(root->right);
}

int main() {
    Node* root = nullptr;
    int values[] = {50, 30, 70, 20, 40, 60, 80};
    for (int v : values) {
        root = insert(root, v);
        cout << "Inserted " << v << endl;
    }
    cout << "In-order: ";
    inorder(root);
    cout << endl;
    return 0;
}`,
  },

  cpp_sorting_compare: {
    label: 'STL sort + comparator', language: 'cpp', category: 'C++ — Sorting',
    description: 'Custom comparators and lambdas',
    code: `// C++ STL sort with custom comparators
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<pair<string,int>> students = {
        {"Alice", 92}, {"Bob", 78}, {"Carol", 88}, {"Dave", 65}
    };
    
    // Sort by score descending
    sort(students.begin(), students.end(),
        [](const auto& a, const auto& b) {
            return a.second > b.second;
        });
    
    cout << "Ranked students:" << endl;
    for (int i = 0; i < students.size(); i++) {
        cout << i+1 << ". " << students[i].first 
             << " - " << students[i].second << endl;
    }
    return 0;
}`,
  },

  // ══════════════════════════════════════════════════════════════
  // C
  // ══════════════════════════════════════════════════════════════

  c_bubble: {
    label: 'Bubble Sort', language: 'c', category: 'C — Sorting',
    description: 'Bubble sort in pure C',
    code: `// Bubble Sort in C
#include <stdio.h>

void bubbleSort(int arr[], int n) {
    int i, j, temp;
    for (i = 0; i < n - 1; i++) {
        for (j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

void printArray(int arr[], int n) {
    for (int i = 0; i < n; i++)
        printf("%d ", arr[i]);
    printf("\\n");
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    printf("Before: "); printArray(arr, n);
    bubbleSort(arr, n);
    printf("After:  "); printArray(arr, n);
    return 0;
}`,
  },

  c_binary_search: {
    label: 'Binary Search', language: 'c', category: 'C — Searching',
    description: 'Binary search in C',
    code: `// Binary Search in C
#include <stdio.h>

int binarySearch(int arr[], int n, int target) {
    int left = 0, right = n - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        printf("left=%d mid=%d right=%d arr[mid]=%d\\n", left, mid, right, arr[mid]);
        
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

int main() {
    int arr[] = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    int n = sizeof(arr) / sizeof(arr[0]);
    int target = 23;
    
    int idx = binarySearch(arr, n, target);
    printf("Found %d at index: %d\\n", target, idx);
    return 0;
}`,
  },

  c_fibonacci: {
    label: 'Fibonacci', language: 'c', category: 'C — Recursion',
    description: 'Fibonacci iterative with array',
    code: `// Fibonacci in C
#include <stdio.h>

long long fibonacci(int n) {
    if (n <= 1) return n;
    long long a = 0, b = 1, c;
    for (int i = 2; i <= n; i++) {
        c = a + b;
        a = b;
        b = c;
        printf("F(%d) = %lld\\n", i, c);
    }
    return b;
}

int main() {
    printf("Fibonacci(10) = %lld\\n", fibonacci(10));
    return 0;
}`,
  },

  c_pointers: {
    label: 'Pointers & Arrays', language: 'c', category: 'C — Pointers',
    description: 'Pointer arithmetic and array operations',
    code: `// Pointers and Arrays in C
#include <stdio.h>

void reverseArray(int* arr, int n) {
    int* left = arr;
    int* right = arr + n - 1;
    while (left < right) {
        int temp = *left;
        *left = *right;
        *right = temp;
        left++;
        right--;
    }
}

int sumArray(int* arr, int n) {
    int sum = 0;
    for (int* p = arr; p < arr + n; p++) {
        sum += *p;
    }
    return sum;
}

int main() {
    int arr[] = {1, 2, 3, 4, 5, 6, 7, 8};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    printf("Sum = %d\\n", sumArray(arr, n));
    
    reverseArray(arr, n);
    printf("Reversed: ");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");
    return 0;
}`,
  },

  // ══════════════════════════════════════════════════════════════
  // C#
  // ══════════════════════════════════════════════════════════════

  cs_bubble: {
    label: 'Bubble Sort', language: 'csharp', category: 'C# — Sorting',
    description: 'Bubble sort with LINQ display',
    code: `// Bubble Sort in C#
using System;
using System.Linq;

class BubbleSort {
    static void Sort(int[] arr) {
        int n = arr.Length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    (arr[j], arr[j + 1]) = (arr[j + 1], arr[j]);
                }
            }
        }
    }

    static void Main() {
        int[] arr = { 64, 34, 25, 12, 22, 11, 90 };
        Console.WriteLine("Before: " + string.Join(", ", arr));
        Sort(arr);
        Console.WriteLine("After:  " + string.Join(", ", arr));
    }
}`,
  },

  cs_linq: {
    label: 'LINQ Queries', language: 'csharp', category: 'C# — Patterns',
    description: 'LINQ for data manipulation',
    code: `// LINQ in C#
using System;
using System.Linq;
using System.Collections.Generic;

class LinqDemo {
    static void Main() {
        var numbers = Enumerable.Range(1, 20).ToList();
        
        var evens = numbers.Where(n => n % 2 == 0).ToList();
        var squares = numbers.Select(n => n * n).ToList();
        var sum = numbers.Sum();
        var avg = numbers.Average();
        
        bool isPrime(int n) => n > 1 && 
            Enumerable.Range(2, (int)Math.Sqrt(n) - 1)
                      .All(i => n % i != 0);
        
        var primes = numbers.Where(isPrime).ToList();
        
        Console.WriteLine($"Numbers: {string.Join(", ", numbers)}");
        Console.WriteLine($"Evens: {string.Join(", ", evens)}");
        Console.WriteLine($"Primes: {string.Join(", ", primes)}");
        Console.WriteLine($"Sum={sum} Avg={avg:F1}");
    }
}`,
  },

  cs_generics: {
    label: 'Generics & Collections', language: 'csharp', category: 'C# — Patterns',
    description: 'Generic Stack and Dictionary',
    code: `// Generics in C#
using System;
using System.Collections.Generic;

class GenericsDemo {
    static void Main() {
        // Generic Stack
        var stack = new Stack<int>();
        foreach (var v in new[] { 10, 20, 30, 40 }) {
            stack.Push(v);
            Console.WriteLine($"Push {v} → Count: {stack.Count}");
        }
        while (stack.Count > 0)
            Console.WriteLine($"Pop: {stack.Pop()}");
        
        // Dictionary
        var dict = new Dictionary<string, int> {
            ["one"] = 1, ["two"] = 2, ["three"] = 3
        };
        foreach (var kv in dict)
            Console.WriteLine($"  {kv.Key} = {kv.Value}");
    }
}`,
  },

  // ══════════════════════════════════════════════════════════════
  // TYPESCRIPT
  // ══════════════════════════════════════════════════════════════

  ts_generics: {
    label: 'Generic Data Structures', language: 'typescript', category: 'TypeScript — Patterns',
    description: 'Type-safe Stack and Queue',
    code: `// Generic Stack & Queue in TypeScript
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
    console.log(\`Push \${item} | size=\${this.items.length}\`);
  }

  pop(): T | undefined {
    const item = this.items.pop();
    console.log(\`Pop \${item} | size=\${this.items.length}\`);
    return item;
  }

  peek(): T | undefined { return this.items[this.items.length - 1]; }
  get size(): number { return this.items.length; }
  isEmpty(): boolean { return this.items.length === 0; }
}

const numStack = new Stack<number>();
[10, 20, 30, 40].forEach(v => numStack.push(v));
console.log("Top:", numStack.peek());
while (!numStack.isEmpty()) numStack.pop();`,
  },

  ts_interfaces: {
    label: 'Interfaces & Types', language: 'typescript', category: 'TypeScript — Patterns',
    description: 'Interfaces, union types, type guards',
    code: `// TypeScript Interfaces & Type Guards
interface Animal {
  name: string;
  sound(): string;
}

interface Flyable {
  fly(): string;
}

class Dog implements Animal {
  constructor(public name: string) {}
  sound() { return "Woof!"; }
}

class Bird implements Animal, Flyable {
  constructor(public name: string) {}
  sound() { return "Tweet!"; }
  fly() { return \`\${this.name} is flying!\`; }
}

function isFlyable(animal: Animal): animal is Bird {
  return 'fly' in animal;
}

const animals: Animal[] = [new Dog("Rex"), new Bird("Tweety"), new Dog("Max")];
animals.forEach(a => {
  console.log(\`\${a.name}: \${a.sound()}\`);
  if (isFlyable(a)) console.log("  →", a.fly());
});`,
  },

  ts_bubble_sort: {
    label: 'Typed Bubble Sort', language: 'typescript', category: 'TypeScript — Sorting',
    description: 'Bubble sort with TypeScript types',
    code: `// Bubble Sort with TypeScript
function bubbleSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
  const result = [...arr];
  const n = result.length;
  let swaps = 0;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (compare(result[j], result[j + 1]) > 0) {
        [result[j], result[j + 1]] = [result[j + 1], result[j]];
        swaps++;
      }
    }
  }
  console.log(\`Swaps: \${swaps}\`);
  return result;
}

const nums = [64, 34, 25, 12, 22, 11, 90];
console.log("Numbers:", bubbleSort(nums, (a, b) => a - b));

const words = ["banana", "apple", "cherry", "date"];
console.log("Words:", bubbleSort(words, (a, b) => a.localeCompare(b)));`,
  },
}

// Derive all categories from samples
export const MULTI_LANG_CATEGORIES: string[] = [
  ...new Set(Object.values(MULTI_LANG_SAMPLES).map(s => s.category))
].sort()

// Group by language for the language-filtered view
export const LANG_LABELS: Record<SampleLang, { label: string; color: string; icon: string }> = {
  javascript: { label: 'JavaScript', color: '#f7df1e', icon: 'JS' },
  typescript: { label: 'TypeScript', color: '#3178c6', icon: 'TS' },
  python:     { label: 'Python',     color: '#3776ab', icon: 'PY' },
  java:       { label: 'Java',       color: '#ed8b00', icon: 'JV' },
  cpp:        { label: 'C++',        color: '#00599c', icon: 'C++' },
  c:          { label: 'C',          color: '#a8b9cc', icon: 'C' },
  csharp:     { label: 'C#',         color: '#9b4f96', icon: 'C#' },
  go:         { label: 'Go',         color: '#00add8', icon: 'GO' },
  rust:       { label: 'Rust',       color: '#dea584', icon: 'RS' },
}
