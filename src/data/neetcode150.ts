import { LeetCodeProblem } from './leetcodeProblems';

export const NEETCODE_150_PROBLEMS: LeetCodeProblem[] = [
  {
    "id": "217",
    "title": "Contains Duplicate",
    "difficulty": "Easy",
    "category": "Arrays & Hashing",
    "description": "Given an integer array nums, return true if any value appears",
    "examples": [],
    "constraints": [
      "1 <= nums.length <= 105",
      "-109 <= nums[i] <= 109"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar containsDuplicate = function(nums) {\n    \n};",
      "python": "class Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "242",
    "title": "Valid Anagram",
    "difficulty": "Easy",
    "category": "Arrays & Hashing",
    "description": "Given two strings s and t, return true if t is an anagram of s, and false otherwise.\n\n \n",
    "examples": [],
    "constraints": [
      "1 <= s.length, t.length <= 5 * 104",
      "s and t consist of lowercase English letters."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @param {string} t\n * @return {boolean}\n */\nvar isAnagram = function(s, t) {\n    \n};",
      "python": "class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "1",
    "title": "Two Sum",
    "difficulty": "Easy",
    "category": "Arrays & Hashing",
    "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have",
    "examples": [
      {
        "input": "nums = [2,7,11,15], target = 9",
        "output": "[0,1]",
        "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        "input": "nums = [3,2,4], target = 6",
        "output": "[1,2]",
        "explanation": ""
      },
      {
        "input": "nums = [3,3], target = 6",
        "output": "[0,1]",
        "explanation": ""
      }
    ],
    "constraints": [
      "2 <= nums.length <= 104",
      "-109 <= nums[i] <= 109",
      "-109 <= target <= 109",
      "Only one valid answer exists."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};",
      "python": "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        "
    },
    "solution": {}
  },
  {
    "id": "49",
    "title": "Group Anagrams",
    "difficulty": "Medium",
    "category": "Arrays & Hashing",
    "description": "Given an array of strings strs, group the anagrams together. You can return the answer in",
    "examples": [],
    "constraints": [
      "1 <= strs.length <= 104",
      "0 <= strs[i].length <= 100",
      "strs[i] consists of lowercase English letters."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string[]} strs\n * @return {string[][]}\n */\nvar groupAnagrams = function(strs) {\n    \n};",
      "python": "class Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        "
    },
    "solution": {}
  },
  {
    "id": "347",
    "title": "Top K Frequent Elements",
    "difficulty": "Medium",
    "category": "Arrays & Hashing",
    "description": "Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in",
    "examples": [],
    "constraints": [
      "1 <= nums.length <= 105",
      "-104 <= nums[i] <= 104",
      "k is in the range [1, the number of unique elements in the array].",
      "It is guaranteed that the answer is unique."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar topKFrequent = function(nums, k) {\n    \n};",
      "python": "class Solution:\n    def topKFrequent(self, nums: List[int], k: int) -> List[int]:\n        "
    },
    "solution": {}
  },
  {
    "id": "238",
    "title": "Product of Array Except Self",
    "difficulty": "Medium",
    "category": "Arrays & Hashing",
    "description": "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].\n\nThe product of any prefix or suffix of nums is",
    "examples": [
      {
        "input": "nums = [1,2,3,4]",
        "output": "[24,12,8,6]",
        "explanation": ""
      },
      {
        "input": "nums = [-1,1,0,-3,3]",
        "output": "[0,0,9,0,0]",
        "explanation": ""
      }
    ],
    "constraints": [
      "2 <= nums.length <= 105",
      "-30 <= nums[i] <= 30",
      "The input is generated such that answer[i] is guaranteed to fit in a 32-bit integer."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar productExceptSelf = function(nums) {\n    \n};",
      "python": "class Solution:\n    def productExceptSelf(self, nums: List[int]) -> List[int]:\n        "
    },
    "solution": {}
  },
  {
    "id": "36",
    "title": "Valid Sudoku",
    "difficulty": "Medium",
    "category": "Arrays & Hashing",
    "description": "Determine if a 9 x 9 Sudoku board is valid. Only the filled cells need to be validated ",
    "examples": [
      {
        "input": "board =",
        "output": "true",
        "explanation": ""
      },
      {
        "input": "board =",
        "output": "false",
        "explanation": "Same as Example 1, except with the 5 in the top left corner being modified to 8. Since there are two 8's in the top left 3x3 sub-box, it is invalid."
      }
    ],
    "constraints": [
      "board.length == 9",
      "board[i].length == 9",
      "board[i][j] is a digit 1-9 or '.'."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {character[][]} board\n * @return {boolean}\n */\nvar isValidSudoku = function(board) {\n    \n};",
      "python": "class Solution:\n    def isValidSudoku(self, board: List[List[str]]) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "128",
    "title": "Longest Consecutive Sequence",
    "difficulty": "Medium",
    "category": "Arrays & Hashing",
    "description": "Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence.\n\nYou must write an algorithm that runs in O(n) time.\n\n \n",
    "examples": [
      {
        "input": "nums = [100,4,200,1,3,2]",
        "output": "4",
        "explanation": "The longest consecutive elements sequence is [1, 2, 3, 4]. Therefore its length is 4."
      },
      {
        "input": "nums = [0,3,7,2,5,8,4,6,0,1]",
        "output": "9",
        "explanation": ""
      },
      {
        "input": "nums = [1,0,1,2]",
        "output": "3",
        "explanation": ""
      }
    ],
    "constraints": [
      "0 <= nums.length <= 105",
      "-109 <= nums[i] <= 109"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar longestConsecutive = function(nums) {\n    \n};",
      "python": "class Solution:\n    def longestConsecutive(self, nums: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "125",
    "title": "Valid Palindrome",
    "difficulty": "Easy",
    "category": "Two Pointers",
    "description": "A phrase is a",
    "examples": [
      {
        "input": "s = \"A man, a plan, a canal: Panama\"",
        "output": "true",
        "explanation": "\"amanaplanacanalpanama\" is a palindrome."
      },
      {
        "input": "s = \"race a car\"",
        "output": "false",
        "explanation": "\"raceacar\" is not a palindrome."
      },
      {
        "input": "s = \" \"",
        "output": "true",
        "explanation": "s is an empty string \"\" after removing non-alphanumeric characters."
      }
    ],
    "constraints": [
      "1 <= s.length <= 2 * 105",
      "s consists only of printable ASCII characters."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @return {boolean}\n */\nvar isPalindrome = function(s) {\n    \n};",
      "python": "class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "167",
    "title": "Two Sum II - Input Array Is Sorted",
    "difficulty": "Medium",
    "category": "Two Pointers",
    "description": "Given a",
    "examples": [
      {
        "input": "numbers = [2,7,11,15], target = 9",
        "output": "[1,2]",
        "explanation": "The sum of 2 and 7 is 9. Therefore, index1 = 1, index2 = 2. We return [1, 2]."
      },
      {
        "input": "numbers = [2,3,4], target = 6",
        "output": "[1,3]",
        "explanation": "The sum of 2 and 4 is 6. Therefore index1 = 1, index2 = 3. We return [1, 3]."
      },
      {
        "input": "numbers = [-1,0], target = -1",
        "output": "[1,2]",
        "explanation": "The sum of -1 and 0 is -1. Therefore index1 = 1, index2 = 2. We return [1, 2]."
      }
    ],
    "constraints": [
      "2 <= numbers.length <= 3 * 104",
      "-1000 <= numbers[i] <= 1000",
      "numbers is sorted in non-decreasing order.",
      "-1000 <= target <= 1000",
      "The tests are generated such that there is exactly one solution."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} numbers\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(numbers, target) {\n    \n};",
      "python": "class Solution:\n    def twoSum(self, numbers: List[int], target: int) -> List[int]:\n        "
    },
    "solution": {}
  },
  {
    "id": "15",
    "title": "3Sum",
    "difficulty": "Medium",
    "category": "Two Pointers",
    "description": "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.\n\nNotice that the solution set must not contain duplicate triplets.\n\n \n",
    "examples": [
      {
        "input": "nums = [-1,0,1,2,-1,-4]",
        "output": "[[-1,-1,2],[-1,0,1]]",
        "explanation": ""
      },
      {
        "input": "nums = [0,1,1]",
        "output": "[]",
        "explanation": "The only possible triplet does not sum up to 0."
      },
      {
        "input": "nums = [0,0,0]",
        "output": "[[0,0,0]]",
        "explanation": "The only possible triplet sums up to 0."
      }
    ],
    "constraints": [
      "3 <= nums.length <= 3000",
      "-105 <= nums[i] <= 105"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar threeSum = function(nums) {\n    \n};",
      "python": "class Solution:\n    def threeSum(self, nums: list[int]) -> list[list[int]]:\n        "
    },
    "solution": {}
  },
  {
    "id": "11",
    "title": "Container With Most Water",
    "difficulty": "Medium",
    "category": "Two Pointers",
    "description": "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.\n\n",
    "examples": [
      {
        "input": "height = [1,8,6,2,5,4,8,3,7]",
        "output": "49",
        "explanation": "The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water (blue section) the container can contain is 49."
      },
      {
        "input": "height = [1,1]",
        "output": "1",
        "explanation": ""
      }
    ],
    "constraints": [
      "n == height.length",
      "2 <= n <= 105",
      "0 <= height[i] <= 104"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} height\n * @return {number}\n */\nvar maxArea = function(height) {\n    \n};",
      "python": "class Solution:\n    def maxArea(self, height: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "42",
    "title": "Trapping Rain Water",
    "difficulty": "Hard",
    "category": "Two Pointers",
    "description": "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.\n\n \n",
    "examples": [
      {
        "input": "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        "output": "6",
        "explanation": "The above elevation map (black section) is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water (blue section) are being trapped."
      },
      {
        "input": "height = [4,2,0,3,2,5]",
        "output": "9",
        "explanation": ""
      }
    ],
    "constraints": [
      "n == height.length",
      "1 <= n <= 2 * 104",
      "0 <= height[i] <= 105"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} height\n * @return {number}\n */\nvar trap = function(height) {\n    \n};",
      "python": "class Solution:\n    def trap(self, height: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "121",
    "title": "Best Time to Buy and Sell Stock",
    "difficulty": "Easy",
    "category": "Sliding Window",
    "description": "You are given an array prices where prices[i] is the price of a given stock on the ith day.\n\nYou want to maximize your profit by choosing a",
    "examples": [
      {
        "input": "prices = [7,1,5,3,6,4]",
        "output": "5",
        "explanation": "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5."
      },
      {
        "input": "prices = [7,6,4,3,1]",
        "output": "0",
        "explanation": "In this case, no transactions are done and the max profit = 0."
      }
    ],
    "constraints": [
      "1 <= prices.length <= 105",
      "0 <= prices[i] <= 104"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} prices\n * @return {number}\n */\nvar maxProfit = function(prices) {\n    \n};",
      "python": "class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "3",
    "title": "Longest Substring Without Repeating Characters",
    "difficulty": "Medium",
    "category": "Sliding Window",
    "description": "Given a string s, find the length of the",
    "examples": [
      {
        "input": "s = \"abcabcbb\"",
        "output": "3",
        "explanation": "The answer is \"abc\", with the length of 3. Note that \"bca\" and \"cab\" are also correct answers."
      },
      {
        "input": "s = \"bbbbb\"",
        "output": "1",
        "explanation": "The answer is \"b\", with the length of 1."
      },
      {
        "input": "s = \"pwwkew\"",
        "output": "3",
        "explanation": "The answer is \"wke\", with the length of 3."
      }
    ],
    "constraints": [
      "0 <= s.length <= 5 * 104",
      "s consists of English letters, digits, symbols and spaces."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @return {number}\n */\nvar lengthOfLongestSubstring = function(s) {\n    \n};",
      "python": "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "424",
    "title": "Longest Repeating Character Replacement",
    "difficulty": "Medium",
    "category": "Sliding Window",
    "description": "You are given a string s and an integer k. You can choose any character of the string and change it to any other uppercase English character. You can perform this operation at most k times.\n\nReturn the length of the longest substring containing the same letter you can get after performing the above operations.\n\n \n",
    "examples": [
      {
        "input": "s = \"ABAB\", k = 2",
        "output": "4",
        "explanation": "Replace the two 'A's with two 'B's or vice versa."
      },
      {
        "input": "s = \"AABABBA\", k = 1",
        "output": "4",
        "explanation": "Replace the one 'A' in the middle with 'B' and form \"AABBBBA\"."
      }
    ],
    "constraints": [
      "1 <= s.length <= 105",
      "s consists of only uppercase English letters.",
      "0 <= k <= s.length"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @param {number} k\n * @return {number}\n */\nvar characterReplacement = function(s, k) {\n    \n};",
      "python": "class Solution:\n    def characterReplacement(self, s: str, k: int) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "567",
    "title": "Permutation in String",
    "difficulty": "Medium",
    "category": "Sliding Window",
    "description": "Given two strings s1 and s2, return true if s2 contains a permutation of s1, or false otherwise.\n\nIn other words, return true if one of s1's permutations is the substring of s2.\n\n \n",
    "examples": [
      {
        "input": "s1 = \"ab\", s2 = \"eidbaooo\"",
        "output": "true",
        "explanation": "s2 contains one permutation of s1 (\"ba\")."
      },
      {
        "input": "s1 = \"ab\", s2 = \"eidboaoo\"",
        "output": "false",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= s1.length, s2.length <= 104",
      "s1 and s2 consist of lowercase English letters."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s1\n * @param {string} s2\n * @return {boolean}\n */\nvar checkInclusion = function(s1, s2) {\n    \n};",
      "python": "class Solution:\n    def checkInclusion(self, s1: str, s2: str) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "76",
    "title": "Minimum Window Substring",
    "difficulty": "Hard",
    "category": "Sliding Window",
    "description": "Given two strings s and t of lengths m and n respectively, return the",
    "examples": [
      {
        "input": "s = \"ADOBECODEBANC\", t = \"ABC\"",
        "output": "\"BANC\"",
        "explanation": "The minimum window substring \"BANC\" includes 'A', 'B', and 'C' from string t."
      },
      {
        "input": "s = \"a\", t = \"a\"",
        "output": "\"a\"",
        "explanation": "The entire string s is the minimum window."
      },
      {
        "input": "s = \"a\", t = \"aa\"",
        "output": "\"\"",
        "explanation": "Both 'a's from t must be included in the window."
      }
    ],
    "constraints": [
      "m == s.length",
      "n == t.length",
      "1 <= m, n <= 105",
      "s and t consist of uppercase and lowercase English letters."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @param {string} t\n * @return {string}\n */\nvar minWindow = function(s, t) {\n    \n};",
      "python": "class Solution:\n    def minWindow(self, s: str, t: str) -> str:\n        "
    },
    "solution": {}
  },
  {
    "id": "239",
    "title": "Sliding Window Maximum",
    "difficulty": "Hard",
    "category": "Sliding Window",
    "description": "You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right. You can only see the k numbers in the window. Each time the sliding window moves right by one position.\n\nReturn the max sliding window.\n\n \n",
    "examples": [
      {
        "input": "nums = [1,3,-1,-3,5,3,6,7], k = 3",
        "output": "[3,3,5,5,6,7]",
        "explanation": ""
      },
      {
        "input": "nums = [1], k = 1",
        "output": "[1]",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= nums.length <= 105",
      "-104 <= nums[i] <= 104",
      "1 <= k <= nums.length"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar maxSlidingWindow = function(nums, k) {\n    \n};",
      "python": "class Solution:\n    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:\n        "
    },
    "solution": {}
  },
  {
    "id": "20",
    "title": "Valid Parentheses",
    "difficulty": "Easy",
    "category": "Stack",
    "description": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n\n\n\tOpen brackets must be closed by the same type of brackets.\n\tOpen brackets must be closed in the correct order.\n\tEvery close bracket has a corresponding open bracket of the same type.\n\n\n \n",
    "examples": [],
    "constraints": [
      "1 <= s.length <= 104",
      "s consists of parentheses only '()[]{}'."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n    \n};",
      "python": "class Solution:\n    def isValid(self, s: str) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "155",
    "title": "Min Stack",
    "difficulty": "Medium",
    "category": "Stack",
    "description": "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.\n\nImplement the MinStack class:\n\n\n\tMinStack() initializes the stack object.\n\tvoid push(int value) pushes the element value onto the stack.\n\tvoid pop() removes the element on the top of the stack.\n\tint top() gets the top element of the stack.\n\tint getMin() retrieves the minimum element in the stack.\n\n\nYou must implement a solution with O(1) time complexity for each function.\n\n \n",
    "examples": [
      {
        "input": "",
        "output": "",
        "explanation": ""
      }
    ],
    "constraints": [
      "-231 <= val <= 231 - 1",
      "Methods pop, top and getMin operations will always be called on non-empty stacks.",
      "At most 3 * 104 calls will be made to push, pop, top, and getMin."
    ],
    "starterCode": {
      "javascript": "\nvar MinStack = function() {\n    \n};\n\n/** \n * @param {number} value\n * @return {void}\n */\nMinStack.prototype.push = function(value) {\n    \n};\n\n/**\n * @return {void}\n */\nMinStack.prototype.pop = function() {\n    \n};\n\n/**\n * @return {number}\n */\nMinStack.prototype.top = function() {\n    \n};\n\n/**\n * @return {number}\n */\nMinStack.prototype.getMin = function() {\n    \n};\n\n/** \n * Your MinStack object will be instantiated and called as such:\n * var obj = new MinStack()\n * obj.push(value)\n * obj.pop()\n * var param_3 = obj.top()\n * var param_4 = obj.getMin()\n */",
      "python": "class MinStack:\n\n    def __init__(self):\n        \n\n    def push(self, value: int) -> None:\n        \n\n    def pop(self) -> None:\n        \n\n    def top(self) -> int:\n        \n\n    def getMin(self) -> int:\n        \n\n\n# Your MinStack object will be instantiated and called as such:\n# obj = MinStack()\n# obj.push(value)\n# obj.pop()\n# param_3 = obj.top()\n# param_4 = obj.getMin()"
    },
    "solution": {}
  },
  {
    "id": "150",
    "title": "Evaluate Reverse Polish Notation",
    "difficulty": "Medium",
    "category": "Stack",
    "description": "You are given an array of strings tokens that represents an arithmetic expression in a Reverse Polish Notation.\n\nEvaluate the expression. Return an integer that represents the value of the expression.\n\n",
    "examples": [
      {
        "input": "tokens = [\"2\",\"1\",\"+\",\"3\",\"*\"]",
        "output": "9",
        "explanation": "((2 + 1) * 3) = 9"
      },
      {
        "input": "tokens = [\"4\",\"13\",\"5\",\"/\",\"+\"]",
        "output": "6",
        "explanation": "(4 + (13 / 5)) = 6"
      },
      {
        "input": "tokens = [\"10\",\"6\",\"9\",\"3\",\"+\",\"-11\",\"*\",\"/\",\"*\",\"17\",\"+\",\"5\",\"+\"]",
        "output": "22",
        "explanation": "((10 * (6 / ((9 + 3) * -11))) + 17) + 5"
      }
    ],
    "constraints": [
      "1 <= tokens.length <= 104",
      "tokens[i] is either an operator: \"+\", \"-\", \"*\", or \"/\", or an integer in the range [-200, 200]."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string[]} tokens\n * @return {number}\n */\nvar evalRPN = function(tokens) {\n    \n};",
      "python": "class Solution:\n    def evalRPN(self, tokens: List[str]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "739",
    "title": "Daily Temperatures",
    "difficulty": "Medium",
    "category": "Stack",
    "description": "Given an array of integers temperatures represents the daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature. If there is no future day for which this is possible, keep answer[i] == 0 instead.\n\n \n",
    "examples": [
      {
        "input": "temperatures = [73,74,75,71,69,72,76,73]",
        "output": "[1,1,4,2,1,1,0,0]",
        "explanation": ""
      },
      {
        "input": "temperatures = [30,40,50,60]",
        "output": "[1,1,1,0]",
        "explanation": ""
      },
      {
        "input": "temperatures = [30,60,90]",
        "output": "[1,1,0]",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= temperatures.length <= 105",
      "30 <= temperatures[i] <= 100"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} temperatures\n * @return {number[]}\n */\nvar dailyTemperatures = function(temperatures) {\n    \n};",
      "python": "class Solution:\n    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:\n        "
    },
    "solution": {}
  },
  {
    "id": "883",
    "title": "Car Fleet",
    "difficulty": "Medium",
    "category": "Stack",
    "description": "There are n cars at given miles away from the starting mile 0, traveling to reach the mile target.\n\nYou are given two integer arrays position and speed, both of length n, where position[i] is the starting mile of the ith car and speed[i] is the speed of the ith car in miles per hour.\n\nA car cannot pass another car, but it can catch up and then travel next to it at the speed of the slower car.\n\nA",
    "examples": [],
    "constraints": [
      "n == position.length == speed.length",
      "1 <= n <= 105",
      "0 < target <= 106",
      "0 <= position[i] < target",
      "All the values of position are unique.",
      "0 < speed[i] <= 106"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} target\n * @param {number[]} position\n * @param {number[]} speed\n * @return {number}\n */\nvar carFleet = function(target, position, speed) {\n    \n};",
      "python": "class Solution:\n    def carFleet(self, target: int, position: List[int], speed: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "84",
    "title": "Largest Rectangle in Histogram",
    "difficulty": "Hard",
    "category": "Stack",
    "description": "Given an array of integers heights representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.\n\n \n",
    "examples": [
      {
        "input": "heights = [2,1,5,6,2,3]",
        "output": "10",
        "explanation": "The above is a histogram where width of each bar is 1."
      },
      {
        "input": "heights = [2,4]",
        "output": "4",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= heights.length <= 105",
      "0 <= heights[i] <= 104"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} heights\n * @return {number}\n */\nvar largestRectangleArea = function(heights) {\n    \n};",
      "python": "class Solution:\n    def largestRectangleArea(self, heights: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "792",
    "title": "Binary Search",
    "difficulty": "Easy",
    "category": "Binary Search",
    "description": "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.\n\n \n",
    "examples": [
      {
        "input": "nums = [-1,0,3,5,9,12], target = 9",
        "output": "4",
        "explanation": "9 exists in nums and its index is 4"
      },
      {
        "input": "nums = [-1,0,3,5,9,12], target = 2",
        "output": "-1",
        "explanation": "2 does not exist in nums so return -1"
      }
    ],
    "constraints": [
      "1 <= nums.length <= 104",
      "-104 < nums[i], target < 104",
      "All the integers in nums are unique.",
      "nums is sorted in ascending order."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar search = function(nums, target) {\n    \n};",
      "python": "class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "74",
    "title": "Search a 2D Matrix",
    "difficulty": "Medium",
    "category": "Binary Search",
    "description": "You are given an m x n integer matrix matrix with the following two properties:\n\n\n\tEach row is sorted in non-decreasing order.\n\tThe first integer of each row is greater than the last integer of the previous row.\n\n\nGiven an integer target, return true if target is in matrix or false otherwise.\n\nYou must write a solution in O(log(m * n)) time complexity.\n\n \n",
    "examples": [
      {
        "input": "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3",
        "output": "true",
        "explanation": ""
      },
      {
        "input": "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13",
        "output": "false",
        "explanation": ""
      }
    ],
    "constraints": [
      "m == matrix.length",
      "n == matrix[i].length",
      "1 <= m, n <= 100",
      "-104 <= matrix[i][j], target <= 104"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} matrix\n * @param {number} target\n * @return {boolean}\n */\nvar searchMatrix = function(matrix, target) {\n    \n};",
      "python": "class Solution:\n    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "907",
    "title": "Koko Eating Bananas",
    "difficulty": "Medium",
    "category": "Binary Search",
    "description": "Koko loves to eat bananas. There are n piles of bananas, the ith pile has piles[i] bananas. The guards have gone and will come back in h hours.\n\nKoko can decide her bananas-per-hour eating speed of k. Each hour, she chooses some pile of bananas and eats k bananas from that pile. If the pile has less than k bananas, she eats all of them instead and will not eat any more bananas during this hour.\n\nKoko likes to eat slowly but still wants to finish eating all the bananas before the guards return.\n\nReturn the minimum integer k such that she can eat all the bananas within h hours.\n\n \n",
    "examples": [
      {
        "input": "piles = [3,6,7,11], h = 8",
        "output": "4",
        "explanation": ""
      },
      {
        "input": "piles = [30,11,23,4,20], h = 5",
        "output": "30",
        "explanation": ""
      },
      {
        "input": "piles = [30,11,23,4,20], h = 6",
        "output": "23",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= piles.length <= 104",
      "piles.length <= h <= 109",
      "1 <= piles[i] <= 109"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} piles\n * @param {number} h\n * @return {number}\n */\nvar minEatingSpeed = function(piles, h) {\n    \n};",
      "python": "class Solution:\n    def minEatingSpeed(self, piles: List[int], h: int) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "153",
    "title": "Find Minimum in Rotated Sorted Array",
    "difficulty": "Medium",
    "category": "Binary Search",
    "description": "Suppose an array of length n sorted in ascending order is",
    "examples": [
      {
        "input": "nums = [3,4,5,1,2]",
        "output": "1",
        "explanation": "The original array was [1,2,3,4,5] rotated 3 times."
      },
      {
        "input": "nums = [4,5,6,7,0,1,2]",
        "output": "0",
        "explanation": "The original array was [0,1,2,4,5,6,7] and it was rotated 4 times."
      },
      {
        "input": "nums = [11,13,15,17]",
        "output": "11",
        "explanation": "The original array was [11,13,15,17] and it was rotated 4 times."
      }
    ],
    "constraints": [
      "n == nums.length",
      "1 <= n <= 5000",
      "-5000 <= nums[i] <= 5000",
      "All the integers of nums are unique.",
      "nums is sorted and rotated between 1 and n times."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findMin = function(nums) {\n    \n};",
      "python": "class Solution:\n    def findMin(self, nums: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "33",
    "title": "Search in Rotated Sorted Array",
    "difficulty": "Medium",
    "category": "Binary Search",
    "description": "There is an integer array nums sorted in ascending order (with",
    "examples": [
      {
        "input": "nums = [4,5,6,7,0,1,2], target = 0",
        "output": "4",
        "explanation": ""
      },
      {
        "input": "nums = [4,5,6,7,0,1,2], target = 3",
        "output": "-1",
        "explanation": ""
      },
      {
        "input": "nums = [1], target = 0",
        "output": "-1",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= nums.length <= 5000",
      "-104 <= nums[i] <= 104",
      "All values of nums are unique.",
      "nums is an ascending array that is possibly rotated.",
      "-104 <= target <= 104"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar search = function(nums, target) {\n    \n};",
      "python": "class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "1023",
    "title": "Time Based Key-Value Store",
    "difficulty": "Medium",
    "category": "Binary Search",
    "description": "Design a time-based key-value data structure that can store multiple values for the same key at different time stamps and retrieve the key's value at a certain timestamp.\n\nImplement the TimeMap class:\n\n\n\tTimeMap() Initializes the object of the data structure.\n\tvoid set(String key, String value, int timestamp) Stores the key key with the value value at the given time timestamp.\n\tString get(String key, int timestamp) Returns a value such that set was called previously, with timestamp_prev <= timestamp. If there are multiple such values, it returns the value associated with the largest timestamp_prev. If there are no values, it returns \"\".\n\n\n \n",
    "examples": [
      {
        "input": "",
        "output": "",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= key.length, value.length <= 100",
      "key and value consist of lowercase English letters and digits.",
      "1 <= timestamp <= 107",
      "All the timestamps timestamp of set are strictly increasing.",
      "At most 2 * 105 calls will be made to set and get."
    ],
    "starterCode": {
      "javascript": "\nvar TimeMap = function() {\n    \n};\n\n/** \n * @param {string} key \n * @param {string} value \n * @param {number} timestamp\n * @return {void}\n */\nTimeMap.prototype.set = function(key, value, timestamp) {\n    \n};\n\n/** \n * @param {string} key \n * @param {number} timestamp\n * @return {string}\n */\nTimeMap.prototype.get = function(key, timestamp) {\n    \n};\n\n/** \n * Your TimeMap object will be instantiated and called as such:\n * var obj = new TimeMap()\n * obj.set(key,value,timestamp)\n * var param_2 = obj.get(key,timestamp)\n */",
      "python": "class TimeMap:\n\n    def __init__(self):\n        \n\n    def set(self, key: str, value: str, timestamp: int) -> None:\n        \n\n    def get(self, key: str, timestamp: int) -> str:\n        \n\n\n# Your TimeMap object will be instantiated and called as such:\n# obj = TimeMap()\n# obj.set(key,value,timestamp)\n# param_2 = obj.get(key,timestamp)"
    },
    "solution": {}
  },
  {
    "id": "4",
    "title": "Median of Two Sorted Arrays",
    "difficulty": "Hard",
    "category": "Binary Search",
    "description": "Given two sorted arrays nums1 and nums2 of size m and n respectively, return",
    "examples": [
      {
        "input": "nums1 = [1,3], nums2 = [2]",
        "output": "2.00000",
        "explanation": "merged array = [1,2,3] and median is 2."
      },
      {
        "input": "nums1 = [1,2], nums2 = [3,4]",
        "output": "2.50000",
        "explanation": "merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5."
      }
    ],
    "constraints": [
      "nums1.length == m",
      "nums2.length == n",
      "0 <= m <= 1000",
      "0 <= n <= 1000",
      "1 <= m + n <= 2000",
      "-106 <= nums1[i], nums2[i] <= 106"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums1\n * @param {number[]} nums2\n * @return {number}\n */\nvar findMedianSortedArrays = function(nums1, nums2) {\n    \n};",
      "python": "class Solution:\n    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:\n        "
    },
    "solution": {}
  },
  {
    "id": "206",
    "title": "Reverse Linked List",
    "difficulty": "Easy",
    "category": "Linked List",
    "description": "Given the head of a singly linked list, reverse the list, and return the reversed list.\n\n \n",
    "examples": [
      {
        "input": "head = [1,2,3,4,5]",
        "output": "[5,4,3,2,1]",
        "explanation": ""
      },
      {
        "input": "head = [1,2]",
        "output": "[2,1]",
        "explanation": ""
      },
      {
        "input": "head = []",
        "output": "[]",
        "explanation": ""
      }
    ],
    "constraints": [
      "The number of nodes in the list is the range [0, 5000].",
      "-5000 <= Node.val <= 5000"
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar reverseList = function(head) {\n    \n};",
      "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        "
    },
    "solution": {}
  },
  {
    "id": "21",
    "title": "Merge Two Sorted Lists",
    "difficulty": "Easy",
    "category": "Linked List",
    "description": "You are given the heads of two sorted linked lists list1 and list2.\n\nMerge the two lists into one",
    "examples": [
      {
        "input": "list1 = [1,2,4], list2 = [1,3,4]",
        "output": "[1,1,2,3,4,4]",
        "explanation": ""
      },
      {
        "input": "list1 = [], list2 = []",
        "output": "[]",
        "explanation": ""
      },
      {
        "input": "list1 = [], list2 = [0]",
        "output": "[0]",
        "explanation": ""
      }
    ],
    "constraints": [
      "The number of nodes in both lists is in the range [0, 50].",
      "-100 <= Node.val <= 100",
      "Both list1 and list2 are sorted in non-decreasing order."
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} list1\n * @param {ListNode} list2\n * @return {ListNode}\n */\nvar mergeTwoLists = function(list1, list2) {\n    \n};",
      "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:\n        "
    },
    "solution": {}
  },
  {
    "id": "141",
    "title": "Linked List Cycle",
    "difficulty": "Easy",
    "category": "Linked List",
    "description": "Given head, the head of a linked list, determine if the linked list has a cycle in it.\n\nThere is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the next pointer. Internally, pos is used to denote the index of the node that tail's next pointer is connected to. ",
    "examples": [
      {
        "input": "head = [3,2,0,-4], pos = 1",
        "output": "true",
        "explanation": "There is a cycle in the linked list, where the tail connects to the 1st node (0-indexed)."
      },
      {
        "input": "head = [1,2], pos = 0",
        "output": "true",
        "explanation": "There is a cycle in the linked list, where the tail connects to the 0th node."
      },
      {
        "input": "head = [1], pos = -1",
        "output": "false",
        "explanation": "There is no cycle in the linked list."
      }
    ],
    "constraints": [
      "The number of the nodes in the list is in the range [0, 104].",
      "-105 <= Node.val <= 105",
      "pos is -1 or a valid index in the linked-list."
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for singly-linked list.\n * function ListNode(val) {\n *     this.val = val;\n *     this.next = null;\n * }\n */\n\n/**\n * @param {ListNode} head\n * @return {boolean}\n */\nvar hasCycle = function(head) {\n    \n};",
      "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, x):\n#         self.val = x\n#         self.next = None\n\nclass Solution:\n    def hasCycle(self, head: Optional[ListNode]) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "143",
    "title": "Reorder List",
    "difficulty": "Medium",
    "category": "Linked List",
    "description": "You are given the head of a singly linked-list. The list can be represented as:\n\n\nL0 &rarr; L1 &rarr; &hellip; &rarr; Ln - 1 &rarr; Ln\n\n\nReorder the list to be on the following form:\n\n\nL0 &rarr; Ln &rarr; L1 &rarr; Ln - 1 &rarr; L2 &rarr; Ln - 2 &rarr; &hellip;\n\n\nYou may not modify the values in the list's nodes. Only nodes themselves may be changed.\n\n \n",
    "examples": [
      {
        "input": "head = [1,2,3,4]",
        "output": "[1,4,2,3]",
        "explanation": ""
      },
      {
        "input": "head = [1,2,3,4,5]",
        "output": "[1,5,2,4,3]",
        "explanation": ""
      }
    ],
    "constraints": [
      "The number of nodes in the list is in the range [1, 5 * 104].",
      "1 <= Node.val <= 1000"
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {void} Do not return anything, modify head in-place instead.\n */\nvar reorderList = function(head) {\n    \n};",
      "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def reorderList(self, head: Optional[ListNode]) -> None:\n        \"\"\"\n        Do not return anything, modify head in-place instead.\n        \"\"\"\n        "
    },
    "solution": {}
  },
  {
    "id": "19",
    "title": "Remove Nth Node From End of List",
    "difficulty": "Medium",
    "category": "Linked List",
    "description": "Given the head of a linked list, remove the nth node from the end of the list and return its head.\n\n \n",
    "examples": [
      {
        "input": "head = [1,2,3,4,5], n = 2",
        "output": "[1,2,3,5]",
        "explanation": ""
      },
      {
        "input": "head = [1], n = 1",
        "output": "[]",
        "explanation": ""
      },
      {
        "input": "head = [1,2], n = 1",
        "output": "[1]",
        "explanation": ""
      }
    ],
    "constraints": [
      "The number of nodes in the list is sz.",
      "1 <= sz <= 30",
      "0 <= Node.val <= 100",
      "1 <= n <= sz"
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @param {number} n\n * @return {ListNode}\n */\nvar removeNthFromEnd = function(head, n) {\n    \n};",
      "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:\n        "
    },
    "solution": {}
  },
  {
    "id": "138",
    "title": "Copy List with Random Pointer",
    "difficulty": "Medium",
    "category": "Linked List",
    "description": "A linked list of length n is given such that each node contains an additional random pointer, which could point to any node in the list, or null.\n\nConstruct a ",
    "examples": [
      {
        "input": "head = [[7,null],[13,0],[11,4],[10,2],[1,0]]",
        "output": "[[7,null],[13,0],[11,4],[10,2],[1,0]]",
        "explanation": ""
      },
      {
        "input": "head = [[1,1],[2,1]]",
        "output": "[[1,1],[2,1]]",
        "explanation": ""
      },
      {
        "input": "head = [[3,null],[3,0],[3,null]]",
        "output": "[[3,null],[3,0],[3,null]]",
        "explanation": ""
      }
    ],
    "constraints": [
      "0 <= n <= 1000",
      "-104 <= Node.val <= 104",
      "Node.random is null or is pointing to some node in the linked list."
    ],
    "starterCode": {
      "javascript": "/**\n * // Definition for a _Node.\n * function _Node(val, next, random) {\n *    this.val = val;\n *    this.next = next;\n *    this.random = random;\n * };\n */\n\n/**\n * @param {_Node} head\n * @return {_Node}\n */\nvar copyRandomList = function(head) {\n    \n};",
      "python": "\"\"\"\n# Definition for a Node.\nclass Node:\n    def __init__(self, x: int, next: 'Node' = None, random: 'Node' = None):\n        self.val = int(x)\n        self.next = next\n        self.random = random\n\"\"\"\n\nclass Solution:\n    def copyRandomList(self, head: 'Optional[Node]') -> 'Optional[Node]':\n        "
    },
    "solution": {}
  },
  {
    "id": "2",
    "title": "Add Two Numbers",
    "difficulty": "Medium",
    "category": "Linked List",
    "description": "You are given two",
    "examples": [
      {
        "input": "l1 = [2,4,3], l2 = [5,6,4]",
        "output": "[7,0,8]",
        "explanation": "342 + 465 = 807."
      },
      {
        "input": "l1 = [0], l2 = [0]",
        "output": "[0]",
        "explanation": ""
      },
      {
        "input": "l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]",
        "output": "[8,9,9,9,0,0,0,1]",
        "explanation": ""
      }
    ],
    "constraints": [
      "The number of nodes in each linked list is in the range [1, 100].",
      "0 <= Node.val <= 9",
      "It is guaranteed that the list represents a number that does not have leading zeros."
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} l1\n * @param {ListNode} l2\n * @return {ListNode}\n */\nvar addTwoNumbers = function(l1, l2) {\n    \n};",
      "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:\n        "
    },
    "solution": {}
  },
  {
    "id": "287",
    "title": "Find the Duplicate Number",
    "difficulty": "Medium",
    "category": "Linked List",
    "description": "Given an array of integers nums containing n + 1 integers where each integer is in the range [1, n] inclusive.\n\nThere is only",
    "examples": [
      {
        "input": "nums = [1,3,4,2,2]",
        "output": "2",
        "explanation": ""
      },
      {
        "input": "nums = [3,1,3,4,2]",
        "output": "3",
        "explanation": ""
      },
      {
        "input": "nums = [3,3,3,3,3]",
        "output": "3",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= n <= 105",
      "nums.length == n + 1",
      "1 <= nums[i] <= n",
      "All the integers in nums appear only once except for precisely one integer which appears two or more times."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findDuplicate = function(nums) {\n    \n};",
      "python": "class Solution:\n    def findDuplicate(self, nums: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "146",
    "title": "LRU Cache",
    "difficulty": "Medium",
    "category": "Linked List",
    "description": "Design a data structure that follows the constraints of a",
    "examples": [
      {
        "input": "",
        "output": "",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= capacity <= 3000",
      "0 <= key <= 104",
      "0 <= value <= 105",
      "At most 2 * 105 calls will be made to get and put."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} capacity\n */\nvar LRUCache = function(capacity) {\n    \n};\n\n/** \n * @param {number} key\n * @return {number}\n */\nLRUCache.prototype.get = function(key) {\n    \n};\n\n/** \n * @param {number} key \n * @param {number} value\n * @return {void}\n */\nLRUCache.prototype.put = function(key, value) {\n    \n};\n\n/** \n * Your LRUCache object will be instantiated and called as such:\n * var obj = new LRUCache(capacity)\n * var param_1 = obj.get(key)\n * obj.put(key,value)\n */",
      "python": "class LRUCache:\n\n    def __init__(self, capacity: int):\n        \n\n    def get(self, key: int) -> int:\n        \n\n    def put(self, key: int, value: int) -> None:\n        \n\n\n# Your LRUCache object will be instantiated and called as such:\n# obj = LRUCache(capacity)\n# param_1 = obj.get(key)\n# obj.put(key,value)"
    },
    "solution": {}
  },
  {
    "id": "23",
    "title": "Merge k Sorted Lists",
    "difficulty": "Hard",
    "category": "Linked List",
    "description": "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.\n\n \n",
    "examples": [
      {
        "input": "lists = [[1,4,5],[1,3,4],[2,6]]",
        "output": "[1,1,2,3,4,4,5,6]",
        "explanation": "The linked-lists are:"
      },
      {
        "input": "lists = []",
        "output": "[]",
        "explanation": ""
      },
      {
        "input": "lists = [[]]",
        "output": "[]",
        "explanation": ""
      }
    ],
    "constraints": [
      "k == lists.length",
      "0 <= k <= 104",
      "0 <= lists[i].length <= 500",
      "-104 <= lists[i][j] <= 104",
      "lists[i] is sorted in ascending order.",
      "The sum of lists[i].length will not exceed 104."
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode[]} lists\n * @return {ListNode}\n */\nvar mergeKLists = function(lists) {\n    \n};",
      "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:\n        "
    },
    "solution": {}
  },
  {
    "id": "25",
    "title": "Reverse Nodes in k-Group",
    "difficulty": "Hard",
    "category": "Linked List",
    "description": "Given the head of a linked list, reverse the nodes of the list k at a time, and return the modified list.\n\nk is a positive integer and is less than or equal to the length of the linked list. If the number of nodes is not a multiple of k then left-out nodes, in the end, should remain as it is.\n\nYou may not alter the values in the list's nodes, only nodes themselves may be changed.\n\n \n",
    "examples": [
      {
        "input": "head = [1,2,3,4,5], k = 2",
        "output": "[2,1,4,3,5]",
        "explanation": ""
      },
      {
        "input": "head = [1,2,3,4,5], k = 3",
        "output": "[3,2,1,4,5]",
        "explanation": ""
      }
    ],
    "constraints": [
      "The number of nodes in the list is n.",
      "1 <= k <= n <= 5000",
      "0 <= Node.val <= 1000"
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @param {number} k\n * @return {ListNode}\n */\nvar reverseKGroup = function(head, k) {\n    \n};",
      "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def reverseKGroup(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:\n        "
    },
    "solution": {}
  },
  {
    "id": "226",
    "title": "Invert Binary Tree",
    "difficulty": "Easy",
    "category": "Trees",
    "description": "Given the root of a binary tree, invert the tree, and return its root.\n\n \n",
    "examples": [
      {
        "input": "root = [4,2,7,1,3,6,9]",
        "output": "[4,7,2,9,6,3,1]",
        "explanation": ""
      },
      {
        "input": "root = [2,1,3]",
        "output": "[2,3,1]",
        "explanation": ""
      },
      {
        "input": "root = []",
        "output": "[]",
        "explanation": ""
      }
    ],
    "constraints": [
      "The number of nodes in the tree is in the range [0, 100].",
      "-100 <= Node.val <= 100"
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {TreeNode}\n */\nvar invertTree = function(root) {\n    \n};",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:\n        "
    },
    "solution": {}
  },
  {
    "id": "104",
    "title": "Maximum Depth of Binary Tree",
    "difficulty": "Easy",
    "category": "Trees",
    "description": "Given the root of a binary tree, return its maximum depth.\n\nA binary tree's",
    "examples": [
      {
        "input": "root = [3,9,20,null,null,15,7]",
        "output": "3",
        "explanation": ""
      },
      {
        "input": "root = [1,null,2]",
        "output": "2",
        "explanation": ""
      }
    ],
    "constraints": [
      "The number of nodes in the tree is in the range [0, 104].",
      "-100 <= Node.val <= 100"
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {number}\n */\nvar maxDepth = function(root) {\n    \n};",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def maxDepth(self, root: Optional[TreeNode]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "543",
    "title": "Diameter of Binary Tree",
    "difficulty": "Easy",
    "category": "Trees",
    "description": "Given the root of a binary tree, return the length of the",
    "examples": [
      {
        "input": "root = [1,2,3,4,5]",
        "output": "3",
        "explanation": "3 is the length of the path [4,2,1,3] or [5,2,1,3]."
      },
      {
        "input": "root = [1,2]",
        "output": "1",
        "explanation": ""
      }
    ],
    "constraints": [
      "The number of nodes in the tree is in the range [1, 104].",
      "-100 <= Node.val <= 100"
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {number}\n */\nvar diameterOfBinaryTree = function(root) {\n    \n};",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def diameterOfBinaryTree(self, root: Optional[TreeNode]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "110",
    "title": "Balanced Binary Tree",
    "difficulty": "Easy",
    "category": "Trees",
    "description": "Given a binary tree, determine if it is ",
    "examples": [
      {
        "input": "root = [3,9,20,null,null,15,7]",
        "output": "true",
        "explanation": ""
      },
      {
        "input": "root = [1,2,2,3,3,null,null,4,4]",
        "output": "false",
        "explanation": ""
      },
      {
        "input": "root = []",
        "output": "true",
        "explanation": ""
      }
    ],
    "constraints": [
      "The number of nodes in the tree is in the range [0, 5000].",
      "-104 <= Node.val <= 104"
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {boolean}\n */\nvar isBalanced = function(root) {\n    \n};",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def isBalanced(self, root: Optional[TreeNode]) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "100",
    "title": "Same Tree",
    "difficulty": "Easy",
    "category": "Trees",
    "description": "Given the roots of two binary trees p and q, write a function to check if they are the same or not.\n\nTwo binary trees are considered the same if they are structurally identical, and the nodes have the same value.\n\n \n",
    "examples": [
      {
        "input": "p = [1,2,3], q = [1,2,3]",
        "output": "true",
        "explanation": ""
      },
      {
        "input": "p = [1,2], q = [1,null,2]",
        "output": "false",
        "explanation": ""
      },
      {
        "input": "p = [1,2,1], q = [1,1,2]",
        "output": "false",
        "explanation": ""
      }
    ],
    "constraints": [
      "The number of nodes in both trees is in the range [0, 100].",
      "-104 <= Node.val <= 104"
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} p\n * @param {TreeNode} q\n * @return {boolean}\n */\nvar isSameTree = function(p, q) {\n    \n};",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def isSameTree(self, p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "572",
    "title": "Subtree of Another Tree",
    "difficulty": "Easy",
    "category": "Trees",
    "description": "Given the roots of two binary trees root and subRoot, return true if there is a subtree of root with the same structure and node values of subRoot and false otherwise.\n\nA subtree of a binary tree tree is a tree that consists of a node in tree and all of this node's descendants. The tree tree could also be considered as a subtree of itself.\n\n \n",
    "examples": [
      {
        "input": "root = [3,4,5,1,2], subRoot = [4,1,2]",
        "output": "true",
        "explanation": ""
      },
      {
        "input": "root = [3,4,5,1,2,null,null,null,null,0], subRoot = [4,1,2]",
        "output": "false",
        "explanation": ""
      }
    ],
    "constraints": [
      "The number of nodes in the root tree is in the range [1, 2000].",
      "The number of nodes in the subRoot tree is in the range [1, 1000].",
      "-104 <= root.val <= 104",
      "-104 <= subRoot.val <= 104"
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @param {TreeNode} subRoot\n * @return {boolean}\n */\nvar isSubtree = function(root, subRoot) {\n    \n};",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def isSubtree(self, root: Optional[TreeNode], subRoot: Optional[TreeNode]) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "235",
    "title": "Lowest Common Ancestor of a Binary Search Tree",
    "difficulty": "Medium",
    "category": "Trees",
    "description": "Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.\n\nAccording to the definition of LCA on Wikipedia: &ldquo;The lowest common ancestor is defined between two nodes p and q as the lowest node in T that has both p and q as descendants (where we allow",
    "examples": [
      {
        "input": "root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8",
        "output": "6",
        "explanation": "The LCA of nodes 2 and 8 is 6."
      },
      {
        "input": "root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4",
        "output": "2",
        "explanation": "The LCA of nodes 2 and 4 is 2, since a node can be a descendant of itself according to the LCA definition."
      },
      {
        "input": "root = [2,1], p = 2, q = 1",
        "output": "2",
        "explanation": ""
      }
    ],
    "constraints": [
      "The number of nodes in the tree is in the range [2, 105].",
      "-109 <= Node.val <= 109",
      "All Node.val are unique.",
      "p != q",
      "p and q will exist in the BST."
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for a binary tree node.\n * function TreeNode(val) {\n *     this.val = val;\n *     this.left = this.right = null;\n * }\n */\n\n/**\n * @param {TreeNode} root\n * @param {TreeNode} p\n * @param {TreeNode} q\n * @return {TreeNode}\n */\nvar lowestCommonAncestor = function(root, p, q) {\n    \n};",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, x):\n#         self.val = x\n#         self.left = None\n#         self.right = None\n\nclass Solution:\n    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':\n        "
    },
    "solution": {}
  },
  {
    "id": "102",
    "title": "Binary Tree Level Order Traversal",
    "difficulty": "Medium",
    "category": "Trees",
    "description": "Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).\n\n \n",
    "examples": [
      {
        "input": "root = [3,9,20,null,null,15,7]",
        "output": "[[3],[9,20],[15,7]]",
        "explanation": ""
      },
      {
        "input": "root = [1]",
        "output": "[[1]]",
        "explanation": ""
      },
      {
        "input": "root = []",
        "output": "[]",
        "explanation": ""
      }
    ],
    "constraints": [
      "The number of nodes in the tree is in the range [0, 2000].",
      "-1000 <= Node.val <= 1000"
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {number[][]}\n */\nvar levelOrder = function(root) {\n    \n};",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:\n        "
    },
    "solution": {}
  },
  {
    "id": "199",
    "title": "Binary Tree Right Side View",
    "difficulty": "Medium",
    "category": "Trees",
    "description": "Given the root of a binary tree, imagine yourself standing on the",
    "examples": [],
    "constraints": [
      "The number of nodes in the tree is in the range [0, 100].",
      "-100 <= Node.val <= 100"
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {number[]}\n */\nvar rightSideView = function(root) {\n    \n};",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def rightSideView(self, root: Optional[TreeNode]) -> List[int]:\n        "
    },
    "solution": {}
  },
  {
    "id": "1544",
    "title": "Count Good Nodes in Binary Tree",
    "difficulty": "Medium",
    "category": "Trees",
    "description": "Given a binary tree root, a node X in the tree is named ",
    "examples": [
      {
        "input": "root = [3,1,4,3,null,1,5]",
        "output": "4",
        "explanation": "Nodes in blue are good."
      },
      {
        "input": "root = [3,3,null,4,2]",
        "output": "3",
        "explanation": "Node 2 -> (3, 3, 2) is not good, because \"3\" is higher than it."
      },
      {
        "input": "root = [1]",
        "output": "1",
        "explanation": "Root is considered as good."
      }
    ],
    "constraints": [
      "The number of nodes in the binary tree is in the range [1, 10^5].",
      "Each node's value is between [-10^4, 10^4]."
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {number}\n */\nvar goodNodes = function(root) {\n    \n};",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def goodNodes(self, root: TreeNode) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "98",
    "title": "Validate Binary Search Tree",
    "difficulty": "Medium",
    "category": "Trees",
    "description": "Given the root of a binary tree, determine if it is a valid binary search tree (BST).\n\nA",
    "examples": [
      {
        "input": "root = [2,1,3]",
        "output": "true",
        "explanation": ""
      },
      {
        "input": "root = [5,1,4,null,null,3,6]",
        "output": "false",
        "explanation": "The root node's value is 5 but its right child's value is 4."
      }
    ],
    "constraints": [
      "The number of nodes in the tree is in the range [1, 104].",
      "-231 <= Node.val <= 231 - 1"
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {boolean}\n */\nvar isValidBST = function(root) {\n    \n};",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def isValidBST(self, root: Optional[TreeNode]) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "230",
    "title": "Kth Smallest Element in a BST",
    "difficulty": "Medium",
    "category": "Trees",
    "description": "Given the root of a binary search tree, and an integer k, return the kth smallest value (",
    "examples": [
      {
        "input": "root = [3,1,4,null,2], k = 1",
        "output": "1",
        "explanation": ""
      },
      {
        "input": "root = [5,3,6,2,4,null,null,1], k = 3",
        "output": "3",
        "explanation": ""
      }
    ],
    "constraints": [
      "The number of nodes in the tree is n.",
      "1 <= k <= n <= 104",
      "0 <= Node.val <= 104"
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @param {number} k\n * @return {number}\n */\nvar kthSmallest = function(root, k) {\n    \n};",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def kthSmallest(self, root: Optional[TreeNode], k: int) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "105",
    "title": "Construct Binary Tree from Preorder and Inorder Traversal",
    "difficulty": "Medium",
    "category": "Trees",
    "description": "Given two integer arrays preorder and inorder where preorder is the preorder traversal of a binary tree and inorder is the inorder traversal of the same tree, construct and return the binary tree.\n\n \n",
    "examples": [
      {
        "input": "preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]",
        "output": "[3,9,20,null,null,15,7]",
        "explanation": ""
      },
      {
        "input": "preorder = [-1], inorder = [-1]",
        "output": "[-1]",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= preorder.length <= 3000",
      "inorder.length == preorder.length",
      "-3000 <= preorder[i], inorder[i] <= 3000",
      "preorder and inorder consist of unique values.",
      "Each value of inorder also appears in preorder.",
      "preorder is guaranteed to be the preorder traversal of the tree.",
      "inorder is guaranteed to be the inorder traversal of the tree."
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {number[]} preorder\n * @param {number[]} inorder\n * @return {TreeNode}\n */\nvar buildTree = function(preorder, inorder) {\n    \n};",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def buildTree(self, preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:\n        "
    },
    "solution": {}
  },
  {
    "id": "124",
    "title": "Binary Tree Maximum Path Sum",
    "difficulty": "Hard",
    "category": "Trees",
    "description": "A",
    "examples": [
      {
        "input": "root = [1,2,3]",
        "output": "6",
        "explanation": "The optimal path is 2 -> 1 -> 3 with a path sum of 2 + 1 + 3 = 6."
      },
      {
        "input": "root = [-10,9,20,null,null,15,7]",
        "output": "42",
        "explanation": "The optimal path is 15 -> 20 -> 7 with a path sum of 15 + 20 + 7 = 42."
      }
    ],
    "constraints": [
      "The number of nodes in the tree is in the range [1, 3 * 104].",
      "-1000 <= Node.val <= 1000"
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {number}\n */\nvar maxPathSum = function(root) {\n    \n};",
      "python": "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def maxPathSum(self, root: Optional[TreeNode]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "297",
    "title": "Serialize and Deserialize Binary Tree",
    "difficulty": "Hard",
    "category": "Trees",
    "description": "Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer, or transmitted across a network connection link to be reconstructed later in the same or another computer environment.\n\nDesign an algorithm to serialize and deserialize a binary tree. There is no restriction on how your serialization/deserialization algorithm should work. You just need to ensure that a binary tree can be serialized to a string and this string can be deserialized to the original tree structure.\n\n",
    "examples": [
      {
        "input": "root = [1,2,3,null,null,4,5]",
        "output": "[1,2,3,null,null,4,5]",
        "explanation": ""
      },
      {
        "input": "root = []",
        "output": "[]",
        "explanation": ""
      }
    ],
    "constraints": [
      "The number of nodes in the tree is in the range [0, 104].",
      "-1000 <= Node.val <= 1000"
    ],
    "starterCode": {
      "javascript": "/**\n * Definition for a binary tree node.\n * function TreeNode(val) {\n *     this.val = val;\n *     this.left = this.right = null;\n * }\n */\n\n/**\n * Encodes a tree to a single string.\n *\n * @param {TreeNode} root\n * @return {string}\n */\nvar serialize = function(root) {\n    \n};\n\n/**\n * Decodes your encoded data to tree.\n *\n * @param {string} data\n * @return {TreeNode}\n */\nvar deserialize = function(data) {\n    \n};\n\n/**\n * Your functions will be called as such:\n * deserialize(serialize(root));\n */",
      "python": "# Definition for a binary tree node.\n# class TreeNode(object):\n#     def __init__(self, x):\n#         self.val = x\n#         self.left = None\n#         self.right = None\n\nclass Codec:\n\n    def serialize(self, root):\n        \"\"\"Encodes a tree to a single string.\n        \n        :type root: TreeNode\n        :rtype: str\n        \"\"\"\n        \n\n    def deserialize(self, data):\n        \"\"\"Decodes your encoded data to tree.\n        \n        :type data: str\n        :rtype: TreeNode\n        \"\"\"\n        \n\n# Your Codec object will be instantiated and called as such:\n# ser = Codec()\n# deser = Codec()\n# ans = deser.deserialize(ser.serialize(root))"
    },
    "solution": {}
  },
  {
    "id": "789",
    "title": "Kth Largest Element in a Stream",
    "difficulty": "Easy",
    "category": "Heap / Priority Queue",
    "description": "You are part of a university admissions office and need to keep track of the kth highest test score from applicants in real-time. This helps to determine cut-off marks for interviews and admissions dynamically as new applicants submit their scores.\n\nYou are tasked to implement a class which, for a given integer k, maintains a stream of test scores and continuously returns the kth highest test score ",
    "examples": [],
    "constraints": [
      "0 <= nums.length <= 104",
      "1 <= k <= nums.length + 1",
      "-104 <= nums[i] <= 104",
      "-104 <= val <= 104",
      "At most 104 calls will be made to add."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} k\n * @param {number[]} nums\n */\nvar KthLargest = function(k, nums) {\n    \n};\n\n/** \n * @param {number} val\n * @return {number}\n */\nKthLargest.prototype.add = function(val) {\n    \n};\n\n/** \n * Your KthLargest object will be instantiated and called as such:\n * var obj = new KthLargest(k, nums)\n * var param_1 = obj.add(val)\n */",
      "python": "class KthLargest:\n\n    def __init__(self, k: int, nums: List[int]):\n        \n\n    def add(self, val: int) -> int:\n        \n\n\n# Your KthLargest object will be instantiated and called as such:\n# obj = KthLargest(k, nums)\n# param_1 = obj.add(val)"
    },
    "solution": {}
  },
  {
    "id": "1127",
    "title": "Last Stone Weight",
    "difficulty": "Easy",
    "category": "Heap / Priority Queue",
    "description": "You are given an array of integers stones where stones[i] is the weight of the ith stone.\n\nWe are playing a game with the stones. On each turn, we choose the",
    "examples": [
      {
        "input": "stones = [2,7,4,1,8,1]",
        "output": "1",
        "explanation": ""
      },
      {
        "input": "stones = [1]",
        "output": "1",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= stones.length <= 30",
      "1 <= stones[i] <= 1000"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} stones\n * @return {number}\n */\nvar lastStoneWeight = function(stones) {\n    \n};",
      "python": "class Solution:\n    def lastStoneWeight(self, stones: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "1014",
    "title": "K Closest Points to Origin",
    "difficulty": "Medium",
    "category": "Heap / Priority Queue",
    "description": "Given an array of points where points[i] = [xi, yi] represents a point on the",
    "examples": [
      {
        "input": "points = [[1,3],[-2,2]], k = 1",
        "output": "[[-2,2]]",
        "explanation": ""
      },
      {
        "input": "points = [[3,3],[5,-1],[-2,4]], k = 2",
        "output": "[[3,3],[-2,4]]",
        "explanation": "The answer [[-2,4],[3,3]] would also be accepted."
      }
    ],
    "constraints": [
      "1 <= k <= points.length <= 104",
      "-104 <= xi, yi <= 104"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} points\n * @param {number} k\n * @return {number[][]}\n */\nvar kClosest = function(points, k) {\n    \n};",
      "python": "class Solution:\n    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:\n        "
    },
    "solution": {}
  },
  {
    "id": "215",
    "title": "Kth Largest Element in an Array",
    "difficulty": "Medium",
    "category": "Heap / Priority Queue",
    "description": "Given an integer array nums and an integer k, return the kth largest element in the array.\n\nNote that it is the kth largest element in the sorted order, not the kth distinct element.\n\nCan you solve it without sorting?\n\n \n",
    "examples": [
      {
        "input": "nums = [3,2,1,5,6,4], k = 2",
        "output": "5",
        "explanation": ""
      },
      {
        "input": "nums = [3,2,3,1,2,4,5,5,6], k = 4",
        "output": "4",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= k <= nums.length <= 105",
      "-104 <= nums[i] <= 104"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number}\n */\nvar findKthLargest = function(nums, k) {\n    \n};",
      "python": "class Solution:\n    def findKthLargest(self, nums: List[int], k: int) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "621",
    "title": "Task Scheduler",
    "difficulty": "Medium",
    "category": "Heap / Priority Queue",
    "description": "You are given an array of CPU tasks, each labeled with a letter from A to Z, and a number n. Each CPU interval can be idle or allow the completion of one task. Tasks can be completed in any order, but there's a constraint: there has to be a gap of",
    "examples": [],
    "constraints": [
      "1 <= tasks.length <= 104",
      "tasks[i] is an uppercase English letter.",
      "0 <= n <= 100"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {character[]} tasks\n * @param {number} n\n * @return {number}\n */\nvar leastInterval = function(tasks, n) {\n    \n};",
      "python": "class Solution:\n    def leastInterval(self, tasks: List[str], n: int) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "355",
    "title": "Design Twitter",
    "difficulty": "Medium",
    "category": "Heap / Priority Queue",
    "description": "Design a simplified version of Twitter where users can post tweets, follow/unfollow another user, and is able to see the 10 most recent tweets in the user's news feed.\n\nImplement the Twitter class:\n\n\n\tTwitter() Initializes your twitter object.\n\tvoid postTweet(int userId, int tweetId) Composes a new tweet with ID tweetId by the user userId. Each call to this function will be made with a unique tweetId.\n\tList<Integer> getNewsFeed(int userId) Retrieves the 10 most recent tweet IDs in the user's news feed. Each item in the news feed must be posted by users who the user followed or by the user themself. Tweets must be",
    "examples": [
      {
        "input": "",
        "output": "",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= userId, followerId, followeeId <= 500",
      "0 <= tweetId <= 104",
      "All the tweets have unique IDs.",
      "At most 3 * 104 calls will be made to postTweet, getNewsFeed, follow, and unfollow.",
      "A user cannot follow himself."
    ],
    "starterCode": {
      "javascript": "\nvar Twitter = function() {\n    \n};\n\n/** \n * @param {number} userId \n * @param {number} tweetId\n * @return {void}\n */\nTwitter.prototype.postTweet = function(userId, tweetId) {\n    \n};\n\n/** \n * @param {number} userId\n * @return {number[]}\n */\nTwitter.prototype.getNewsFeed = function(userId) {\n    \n};\n\n/** \n * @param {number} followerId \n * @param {number} followeeId\n * @return {void}\n */\nTwitter.prototype.follow = function(followerId, followeeId) {\n    \n};\n\n/** \n * @param {number} followerId \n * @param {number} followeeId\n * @return {void}\n */\nTwitter.prototype.unfollow = function(followerId, followeeId) {\n    \n};\n\n/** \n * Your Twitter object will be instantiated and called as such:\n * var obj = new Twitter()\n * obj.postTweet(userId,tweetId)\n * var param_2 = obj.getNewsFeed(userId)\n * obj.follow(followerId,followeeId)\n * obj.unfollow(followerId,followeeId)\n */",
      "python": "class Twitter:\n\n    def __init__(self):\n        \n\n    def postTweet(self, userId: int, tweetId: int) -> None:\n        \n\n    def getNewsFeed(self, userId: int) -> List[int]:\n        \n\n    def follow(self, followerId: int, followeeId: int) -> None:\n        \n\n    def unfollow(self, followerId: int, followeeId: int) -> None:\n        \n\n\n# Your Twitter object will be instantiated and called as such:\n# obj = Twitter()\n# obj.postTweet(userId,tweetId)\n# param_2 = obj.getNewsFeed(userId)\n# obj.follow(followerId,followeeId)\n# obj.unfollow(followerId,followeeId)"
    },
    "solution": {}
  },
  {
    "id": "295",
    "title": "Find Median from Data Stream",
    "difficulty": "Hard",
    "category": "Heap / Priority Queue",
    "description": "The",
    "examples": [
      {
        "input": "",
        "output": "",
        "explanation": ""
      }
    ],
    "constraints": [
      "-105 <= num <= 105",
      "There will be at least one element in the data structure before calling findMedian.",
      "At most 5 * 104 calls will be made to addNum and findMedian."
    ],
    "starterCode": {
      "javascript": "\nvar MedianFinder = function() {\n    \n};\n\n/** \n * @param {number} num\n * @return {void}\n */\nMedianFinder.prototype.addNum = function(num) {\n    \n};\n\n/**\n * @return {number}\n */\nMedianFinder.prototype.findMedian = function() {\n    \n};\n\n/** \n * Your MedianFinder object will be instantiated and called as such:\n * var obj = new MedianFinder()\n * obj.addNum(num)\n * var param_2 = obj.findMedian()\n */",
      "python": "class MedianFinder:\n\n    def __init__(self):\n        \n\n    def addNum(self, num: int) -> None:\n        \n\n    def findMedian(self) -> float:\n        \n\n\n# Your MedianFinder object will be instantiated and called as such:\n# obj = MedianFinder()\n# obj.addNum(num)\n# param_2 = obj.findMedian()"
    },
    "solution": {}
  },
  {
    "id": "78",
    "title": "Subsets",
    "difficulty": "Medium",
    "category": "Backtracking",
    "description": "Given an integer array nums of",
    "examples": [
      {
        "input": "nums = [1,2,3]",
        "output": "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]",
        "explanation": ""
      },
      {
        "input": "nums = [0]",
        "output": "[[],[0]]",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= nums.length <= 10",
      "-10 <= nums[i] <= 10",
      "All the numbers of nums are unique."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar subsets = function(nums) {\n    \n};",
      "python": "class Solution:\n    def subsets(self, nums: List[int]) -> List[List[int]]:\n        "
    },
    "solution": {}
  },
  {
    "id": "39",
    "title": "Combination Sum",
    "difficulty": "Medium",
    "category": "Backtracking",
    "description": "Given an array of",
    "examples": [
      {
        "input": "candidates = [2,3,6,7], target = 7",
        "output": "[[2,2,3],[7]]",
        "explanation": ""
      },
      {
        "input": "candidates = [2,3,5], target = 8",
        "output": "[[2,2,2,2],[2,3,3],[3,5]]",
        "explanation": ""
      },
      {
        "input": "candidates = [2], target = 1",
        "output": "[]",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= candidates.length <= 30",
      "2 <= candidates[i] <= 40",
      "All elements of candidates are distinct.",
      "1 <= target <= 40"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} candidates\n * @param {number} target\n * @return {number[][]}\n */\nvar combinationSum = function(candidates, target) {\n    \n};",
      "python": "class Solution:\n    def combinationSum(self, candidates: List[int], target: int) -> List[List[int]]:\n        "
    },
    "solution": {}
  },
  {
    "id": "40",
    "title": "Combination Sum II",
    "difficulty": "Medium",
    "category": "Backtracking",
    "description": "Given a collection of candidate numbers (candidates) and a target number (target), find all unique combinations in candidates where the candidate numbers sum to target.\n\nEach number in candidates may only be used",
    "examples": [
      {
        "input": "candidates = [10,1,2,7,6,1,5], target = 8",
        "output": "",
        "explanation": ""
      },
      {
        "input": "candidates = [2,5,2,1,2], target = 5",
        "output": "",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= candidates.length <= 100",
      "1 <= candidates[i] <= 50",
      "1 <= target <= 30"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} candidates\n * @param {number} target\n * @return {number[][]}\n */\nvar combinationSum2 = function(candidates, target) {\n    \n};",
      "python": "class Solution:\n    def combinationSum2(self, candidates: List[int], target: int) -> List[List[int]]:\n        "
    },
    "solution": {}
  },
  {
    "id": "46",
    "title": "Permutations",
    "difficulty": "Medium",
    "category": "Backtracking",
    "description": "Given an array nums of distinct integers, return all the possible permutations. You can return the answer in",
    "examples": [
      {
        "input": "nums = [1,2,3]",
        "output": "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]",
        "explanation": ""
      },
      {
        "input": "nums = [0,1]",
        "output": "[[0,1],[1,0]]",
        "explanation": ""
      },
      {
        "input": "nums = [1]",
        "output": "[[1]]",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= nums.length <= 6",
      "-10 <= nums[i] <= 10",
      "All the integers of nums are unique."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar permute = function(nums) {\n    \n};",
      "python": "class Solution:\n    def permute(self, nums: List[int]) -> List[List[int]]:\n        "
    },
    "solution": {}
  },
  {
    "id": "90",
    "title": "Subsets II",
    "difficulty": "Medium",
    "category": "Backtracking",
    "description": "Given an integer array nums that may contain duplicates, return all possible subsets (the power set).\n\nThe solution set",
    "examples": [
      {
        "input": "nums = [1,2,2]",
        "output": "[[],[1],[1,2],[1,2,2],[2],[2,2]]",
        "explanation": ""
      },
      {
        "input": "nums = [0]",
        "output": "[[],[0]]",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= nums.length <= 10",
      "-10 <= nums[i] <= 10"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar subsetsWithDup = function(nums) {\n    \n};",
      "python": "class Solution:\n    def subsetsWithDup(self, nums: List[int]) -> List[List[int]]:\n        "
    },
    "solution": {}
  },
  {
    "id": "22",
    "title": "Generate Parentheses",
    "difficulty": "Medium",
    "category": "Backtracking",
    "description": "Given n pairs of parentheses, write a function to generate all combinations of well-formed parentheses.\n\n \n",
    "examples": [
      {
        "input": "n = 3",
        "output": "[\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"]",
        "explanation": ""
      },
      {
        "input": "n = 1",
        "output": "[\"()\"]",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= n <= 8"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} n\n * @return {string[]}\n */\nvar generateParenthesis = function(n) {\n    \n};",
      "python": "class Solution:\n    def generateParenthesis(self, n: int) -> List[str]:\n        "
    },
    "solution": {}
  },
  {
    "id": "79",
    "title": "Word Search",
    "difficulty": "Medium",
    "category": "Backtracking",
    "description": "Given an m x n grid of characters board and a string word, return true if word exists in the grid.\n\nThe word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.\n\n \n",
    "examples": [
      {
        "input": "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"ABCCED\"",
        "output": "true",
        "explanation": ""
      },
      {
        "input": "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"SEE\"",
        "output": "true",
        "explanation": ""
      },
      {
        "input": "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"ABCB\"",
        "output": "false",
        "explanation": ""
      }
    ],
    "constraints": [
      "m == board.length",
      "n = board[i].length",
      "1 <= m, n <= 6",
      "1 <= word.length <= 15",
      "board and word consists of only lowercase and uppercase English letters."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {character[][]} board\n * @param {string} word\n * @return {boolean}\n */\nvar exist = function(board, word) {\n    \n};",
      "python": "class Solution:\n    def exist(self, board: List[List[str]], word: str) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "131",
    "title": "Palindrome Partitioning",
    "difficulty": "Medium",
    "category": "Backtracking",
    "description": "Given a string s, partition s such that every substring of the partition is a ",
    "examples": [
      {
        "input": "s = \"aab\"",
        "output": "[[\"a\",\"a\",\"b\"],[\"aa\",\"b\"]]",
        "explanation": ""
      },
      {
        "input": "s = \"a\"",
        "output": "[[\"a\"]]",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= s.length <= 16",
      "s contains only lowercase English letters."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @return {string[][]}\n */\nvar partition = function(s) {\n    \n};",
      "python": "class Solution:\n    def partition(self, s: str) -> List[List[str]]:\n        "
    },
    "solution": {}
  },
  {
    "id": "17",
    "title": "Letter Combinations of a Phone Number",
    "difficulty": "Medium",
    "category": "Backtracking",
    "description": "Given a string containing digits from 2-9 inclusive, return all possible letter combinations that the number could represent. Return the answer in",
    "examples": [
      {
        "input": "digits = \"23\"",
        "output": "[\"ad\",\"ae\",\"af\",\"bd\",\"be\",\"bf\",\"cd\",\"ce\",\"cf\"]",
        "explanation": ""
      },
      {
        "input": "digits = \"2\"",
        "output": "[\"a\",\"b\",\"c\"]",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= digits.length <= 4",
      "digits[i] is a digit in the range ['2', '9']."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} digits\n * @return {string[]}\n */\nvar letterCombinations = function(digits) {\n    \n};",
      "python": "class Solution:\n    def letterCombinations(self, digits: str) -> List[str]:\n        "
    },
    "solution": {}
  },
  {
    "id": "51",
    "title": "N-Queens",
    "difficulty": "Hard",
    "category": "Backtracking",
    "description": "The",
    "examples": [
      {
        "input": "n = 4",
        "output": "[[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"],[\"..Q.\",\"Q...\",\"...Q\",\".Q..\"]]",
        "explanation": "There exist two distinct solutions to the 4-queens puzzle as shown above"
      },
      {
        "input": "n = 1",
        "output": "[[\"Q\"]]",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= n <= 9"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} n\n * @return {string[][]}\n */\nvar solveNQueens = function(n) {\n    \n};",
      "python": "class Solution:\n    def solveNQueens(self, n: int) -> List[List[str]]:\n        "
    },
    "solution": {}
  },
  {
    "id": "208",
    "title": "Implement Trie (Prefix Tree)",
    "difficulty": "Medium",
    "category": "Tries",
    "description": "A ",
    "examples": [
      {
        "input": "",
        "output": "",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= word.length, prefix.length <= 2000",
      "word and prefix consist only of lowercase English letters.",
      "At most 3 * 104 calls in total will be made to insert, search, and startsWith."
    ],
    "starterCode": {
      "javascript": "\nvar Trie = function() {\n    \n};\n\n/** \n * @param {string} word\n * @return {void}\n */\nTrie.prototype.insert = function(word) {\n    \n};\n\n/** \n * @param {string} word\n * @return {boolean}\n */\nTrie.prototype.search = function(word) {\n    \n};\n\n/** \n * @param {string} prefix\n * @return {boolean}\n */\nTrie.prototype.startsWith = function(prefix) {\n    \n};\n\n/** \n * Your Trie object will be instantiated and called as such:\n * var obj = new Trie()\n * obj.insert(word)\n * var param_2 = obj.search(word)\n * var param_3 = obj.startsWith(prefix)\n */",
      "python": "class Trie:\n\n    def __init__(self):\n        \n\n    def insert(self, word: str) -> None:\n        \n\n    def search(self, word: str) -> bool:\n        \n\n    def startsWith(self, prefix: str) -> bool:\n        \n\n\n# Your Trie object will be instantiated and called as such:\n# obj = Trie()\n# obj.insert(word)\n# param_2 = obj.search(word)\n# param_3 = obj.startsWith(prefix)"
    },
    "solution": {}
  },
  {
    "id": "211",
    "title": "Design Add and Search Words Data Structure",
    "difficulty": "Medium",
    "category": "Tries",
    "description": "Design a data structure that supports adding new words and finding if a string matches any previously added string.\n\nImplement the WordDictionary class:\n\n\n\tWordDictionary() Initializes the object.\n\tvoid addWord(word) Adds word to the data structure, it can be matched later.\n\tbool search(word) Returns true if there is any string in the data structure that matches word or false otherwise. word may contain dots '.' where dots can be matched with any letter.\n\n\n \n",
    "examples": [],
    "constraints": [
      "1 <= word.length <= 25",
      "word in addWord consists of lowercase English letters.",
      "word in search consist of '.' or lowercase English letters.",
      "There will be at most 2 dots in word for search queries.",
      "At most 104 calls will be made to addWord and search."
    ],
    "starterCode": {
      "javascript": "\nvar WordDictionary = function() {\n    \n};\n\n/** \n * @param {string} word\n * @return {void}\n */\nWordDictionary.prototype.addWord = function(word) {\n    \n};\n\n/** \n * @param {string} word\n * @return {boolean}\n */\nWordDictionary.prototype.search = function(word) {\n    \n};\n\n/** \n * Your WordDictionary object will be instantiated and called as such:\n * var obj = new WordDictionary()\n * obj.addWord(word)\n * var param_2 = obj.search(word)\n */",
      "python": "class WordDictionary:\n\n    def __init__(self):\n        \n\n    def addWord(self, word: str) -> None:\n        \n\n    def search(self, word: str) -> bool:\n        \n\n\n# Your WordDictionary object will be instantiated and called as such:\n# obj = WordDictionary()\n# obj.addWord(word)\n# param_2 = obj.search(word)"
    },
    "solution": {}
  },
  {
    "id": "212",
    "title": "Word Search II",
    "difficulty": "Hard",
    "category": "Tries",
    "description": "Given an m x n board of characters and a list of strings words, return all words on the board.\n\nEach word must be constructed from letters of sequentially adjacent cells, where",
    "examples": [
      {
        "input": "board = [[\"o\",\"a\",\"a\",\"n\"],[\"e\",\"t\",\"a\",\"e\"],[\"i\",\"h\",\"k\",\"r\"],[\"i\",\"f\",\"l\",\"v\"]], words = [\"oath\",\"pea\",\"eat\",\"rain\"]",
        "output": "[\"eat\",\"oath\"]",
        "explanation": ""
      },
      {
        "input": "board = [[\"a\",\"b\"],[\"c\",\"d\"]], words = [\"abcb\"]",
        "output": "[]",
        "explanation": ""
      }
    ],
    "constraints": [
      "m == board.length",
      "n == board[i].length",
      "1 <= m, n <= 12",
      "board[i][j] is a lowercase English letter.",
      "1 <= words.length <= 3 * 104",
      "1 <= words[i].length <= 10",
      "words[i] consists of lowercase English letters.",
      "All the strings of words are unique."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {character[][]} board\n * @param {string[]} words\n * @return {string[]}\n */\nvar findWords = function(board, words) {\n    \n};",
      "python": "class Solution:\n    def findWords(self, board: List[List[str]], words: List[str]) -> List[str]:\n        "
    },
    "solution": {}
  },
  {
    "id": "200",
    "title": "Number of Islands",
    "difficulty": "Medium",
    "category": "Graphs",
    "description": "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.\n\nAn",
    "examples": [
      {
        "input": "grid = [",
        "output": "1",
        "explanation": ""
      },
      {
        "input": "grid = [",
        "output": "3",
        "explanation": ""
      }
    ],
    "constraints": [
      "m == grid.length",
      "n == grid[i].length",
      "1 <= m, n <= 300",
      "grid[i][j] is '0' or '1'."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {character[][]} grid\n * @return {number}\n */\nvar numIslands = function(grid) {\n    \n};",
      "python": "class Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "695",
    "title": "Max Area of Island",
    "difficulty": "Medium",
    "category": "Graphs",
    "description": "You are given an m x n binary matrix grid. An island is a group of 1's (representing land) connected",
    "examples": [
      {
        "input": "grid = [[0,0,1,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0],[0,1,1,0,1,0,0,0,0,0,0,0,0],[0,1,0,0,1,1,0,0,1,0,1,0,0],[0,1,0,0,1,1,0,0,1,1,1,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0],[0,0,0,0,0,0,0,1,1,0,0,0,0]]",
        "output": "6",
        "explanation": "The answer is not 11, because the island must be connected 4-directionally."
      },
      {
        "input": "grid = [[0,0,0,0,0,0,0,0]]",
        "output": "0",
        "explanation": ""
      }
    ],
    "constraints": [
      "m == grid.length",
      "n == grid[i].length",
      "1 <= m, n <= 50",
      "grid[i][j] is either 0 or 1."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} grid\n * @return {number}\n */\nvar maxAreaOfIsland = function(grid) {\n    \n};",
      "python": "class Solution:\n    def maxAreaOfIsland(self, grid: List[List[int]]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "133",
    "title": "Clone Graph",
    "difficulty": "Medium",
    "category": "Graphs",
    "description": "Given a reference of a node in a",
    "examples": [
      {
        "input": "adjList = [[2,4],[1,3],[2,4],[1,3]]",
        "output": "[[2,4],[1,3],[2,4],[1,3]]",
        "explanation": "There are 4 nodes in the graph."
      },
      {
        "input": "adjList = [[]]",
        "output": "[[]]",
        "explanation": "Note that the input contains one empty list. The graph consists of only one node with val = 1 and it does not have any neighbors."
      },
      {
        "input": "adjList = []",
        "output": "[]",
        "explanation": "This an empty graph, it does not have any nodes."
      }
    ],
    "constraints": [
      "The number of nodes in the graph is in the range [0, 100].",
      "1 <= Node.val <= 100",
      "Node.val is unique for each node.",
      "There are no repeated edges and no self-loops in the graph.",
      "The Graph is connected and all nodes can be visited starting from the given node."
    ],
    "starterCode": {
      "javascript": "/**\n * // Definition for a _Node.\n * function _Node(val, neighbors) {\n *    this.val = val === undefined ? 0 : val;\n *    this.neighbors = neighbors === undefined ? [] : neighbors;\n * };\n */\n\n/**\n * @param {_Node} node\n * @return {_Node}\n */\nvar cloneGraph = function(node) {\n    \n};",
      "python": "\"\"\"\n# Definition for a Node.\nclass Node:\n    def __init__(self, val = 0, neighbors = None):\n        self.val = val\n        self.neighbors = neighbors if neighbors is not None else []\n\"\"\"\n\nfrom typing import Optional\nclass Solution:\n    def cloneGraph(self, node: Optional['Node']) -> Optional['Node']:\n        "
    },
    "solution": {}
  },
  {
    "id": "1036",
    "title": "Rotting Oranges",
    "difficulty": "Medium",
    "category": "Graphs",
    "description": "You are given an m x n grid where each cell can have one of three values:\n\n\n\t0 representing an empty cell,\n\t1 representing a fresh orange, or\n\t2 representing a rotten orange.\n\n\nEvery minute, any fresh orange that is",
    "examples": [
      {
        "input": "grid = [[2,1,1],[1,1,0],[0,1,1]]",
        "output": "4",
        "explanation": ""
      },
      {
        "input": "grid = [[2,1,1],[0,1,1],[1,0,1]]",
        "output": "-1",
        "explanation": "The orange in the bottom left corner (row 2, column 0) is never rotten, because rotting only happens 4-directionally."
      },
      {
        "input": "grid = [[0,2]]",
        "output": "0",
        "explanation": "Since there are already no fresh oranges at minute 0, the answer is just 0."
      }
    ],
    "constraints": [
      "m == grid.length",
      "n == grid[i].length",
      "1 <= m, n <= 10",
      "grid[i][j] is 0, 1, or 2."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} grid\n * @return {number}\n */\nvar orangesRotting = function(grid) {\n    \n};",
      "python": "class Solution:\n    def orangesRotting(self, grid: List[List[int]]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "417",
    "title": "Pacific Atlantic Water Flow",
    "difficulty": "Medium",
    "category": "Graphs",
    "description": "There is an m x n rectangular island that borders both the",
    "examples": [
      {
        "input": "heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]",
        "output": "[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]",
        "explanation": "The following cells can flow to the Pacific and Atlantic oceans, as shown below:"
      },
      {
        "input": "heights = [[1]]",
        "output": "[[0,0]]",
        "explanation": "The water can flow from the only cell to the Pacific and Atlantic oceans."
      }
    ],
    "constraints": [
      "m == heights.length",
      "n == heights[r].length",
      "1 <= m, n <= 200",
      "0 <= heights[r][c] <= 105"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} heights\n * @return {number[][]}\n */\nvar pacificAtlantic = function(heights) {\n    \n};",
      "python": "class Solution:\n    def pacificAtlantic(self, heights: List[List[int]]) -> List[List[int]]:\n        "
    },
    "solution": {}
  },
  {
    "id": "130",
    "title": "Surrounded Regions",
    "difficulty": "Medium",
    "category": "Graphs",
    "description": "You are given an m x n matrix board containing",
    "examples": [],
    "constraints": [
      "m == board.length",
      "n == board[i].length",
      "1 <= m, n <= 200",
      "board[i][j] is 'X' or 'O'."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {character[][]} board\n * @return {void} Do not return anything, modify board in-place instead.\n */\nvar solve = function(board) {\n    \n};",
      "python": "class Solution:\n    def solve(self, board: List[List[str]]) -> None:\n        \"\"\"\n        Do not return anything, modify board in-place instead.\n        \"\"\"\n        "
    },
    "solution": {}
  },
  {
    "id": "207",
    "title": "Course Schedule",
    "difficulty": "Medium",
    "category": "Graphs",
    "description": "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you",
    "examples": [
      {
        "input": "numCourses = 2, prerequisites = [[1,0]]",
        "output": "true",
        "explanation": "There are a total of 2 courses to take."
      },
      {
        "input": "numCourses = 2, prerequisites = [[1,0],[0,1]]",
        "output": "false",
        "explanation": "There are a total of 2 courses to take."
      }
    ],
    "constraints": [
      "1 <= numCourses <= 2000",
      "0 <= prerequisites.length <= 5000",
      "prerequisites[i].length == 2",
      "0 <= ai, bi < numCourses",
      "All the pairs prerequisites[i] are unique."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} numCourses\n * @param {number[][]} prerequisites\n * @return {boolean}\n */\nvar canFinish = function(numCourses, prerequisites) {\n    \n};",
      "python": "class Solution:\n    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "210",
    "title": "Course Schedule II",
    "difficulty": "Medium",
    "category": "Graphs",
    "description": "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you",
    "examples": [
      {
        "input": "numCourses = 2, prerequisites = [[1,0]]",
        "output": "[0,1]",
        "explanation": "There are a total of 2 courses to take. To take course 1 you should have finished course 0. So the correct course order is [0,1]."
      },
      {
        "input": "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]",
        "output": "[0,2,1,3]",
        "explanation": "There are a total of 4 courses to take. To take course 3 you should have finished both courses 1 and 2. Both courses 1 and 2 should be taken after you finished course 0."
      },
      {
        "input": "numCourses = 1, prerequisites = []",
        "output": "[0]",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= numCourses <= 2000",
      "0 <= prerequisites.length <= numCourses * (numCourses - 1)",
      "prerequisites[i].length == 2",
      "0 <= ai, bi < numCourses",
      "ai != bi",
      "All the pairs [ai, bi] are distinct."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} numCourses\n * @param {number[][]} prerequisites\n * @return {number[]}\n */\nvar findOrder = function(numCourses, prerequisites) {\n    \n};",
      "python": "class Solution:\n    def findOrder(self, numCourses: int, prerequisites: List[List[int]]) -> List[int]:\n        "
    },
    "solution": {}
  },
  {
    "id": "684",
    "title": "Redundant Connection",
    "difficulty": "Medium",
    "category": "Graphs",
    "description": "In this problem, a tree is an",
    "examples": [
      {
        "input": "edges = [[1,2],[1,3],[2,3]]",
        "output": "[2,3]",
        "explanation": ""
      },
      {
        "input": "edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]",
        "output": "[1,4]",
        "explanation": ""
      }
    ],
    "constraints": [
      "n == edges.length",
      "3 <= n <= 1000",
      "edges[i].length == 2",
      "1 <= ai < bi <= edges.length",
      "ai != bi",
      "There are no repeated edges.",
      "The given graph is connected."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} edges\n * @return {number[]}\n */\nvar findRedundantConnection = function(edges) {\n    \n};",
      "python": "class Solution:\n    def findRedundantConnection(self, edges: List[List[int]]) -> List[int]:\n        "
    },
    "solution": {}
  },
  {
    "id": "127",
    "title": "Word Ladder",
    "difficulty": "Hard",
    "category": "Graphs",
    "description": "A",
    "examples": [
      {
        "input": "beginWord = \"hit\", endWord = \"cog\", wordList = [\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]",
        "output": "5",
        "explanation": "One shortest transformation sequence is \"hit\" -> \"hot\" -> \"dot\" -> \"dog\" -> cog\", which is 5 words long."
      },
      {
        "input": "beginWord = \"hit\", endWord = \"cog\", wordList = [\"hot\",\"dot\",\"dog\",\"lot\",\"log\"]",
        "output": "0",
        "explanation": "The endWord \"cog\" is not in wordList, therefore there is no valid transformation sequence."
      }
    ],
    "constraints": [
      "1 <= beginWord.length <= 10",
      "endWord.length == beginWord.length",
      "1 <= wordList.length <= 5000",
      "wordList[i].length == beginWord.length",
      "beginWord, endWord, and wordList[i] consist of lowercase English letters.",
      "beginWord != endWord",
      "All the words in wordList are unique."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} beginWord\n * @param {string} endWord\n * @param {string[]} wordList\n * @return {number}\n */\nvar ladderLength = function(beginWord, endWord, wordList) {\n    \n};",
      "python": "class Solution:\n    def ladderLength(self, beginWord: str, endWord: str, wordList: List[str]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "744",
    "title": "Network Delay Time",
    "difficulty": "Medium",
    "category": "Advanced Graphs",
    "description": "You are given a network of n nodes, labeled from 1 to n. You are also given times, a list of travel times as directed edges times[i] = (ui, vi, wi), where ui is the source node, vi is the target node, and wi is the time it takes for a signal to travel from source to target.\n\nWe will send a signal from a given node k. Return the",
    "examples": [
      {
        "input": "times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2",
        "output": "2",
        "explanation": ""
      },
      {
        "input": "times = [[1,2,1]], n = 2, k = 1",
        "output": "1",
        "explanation": ""
      },
      {
        "input": "times = [[1,2,1]], n = 2, k = 2",
        "output": "-1",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= k <= n <= 100",
      "1 <= times.length <= 6000",
      "times[i].length == 3",
      "1 <= ui, vi <= n",
      "ui != vi",
      "0 <= wi <= 100",
      "All the pairs (ui, vi) are unique. (i.e., no multiple edges.)"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} times\n * @param {number} n\n * @param {number} k\n * @return {number}\n */\nvar networkDelayTime = function(times, n, k) {\n    \n};",
      "python": "class Solution:\n    def networkDelayTime(self, times: List[List[int]], n: int, k: int) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "332",
    "title": "Reconstruct Itinerary",
    "difficulty": "Hard",
    "category": "Advanced Graphs",
    "description": "You are given a list of airline tickets where tickets[i] = [fromi, toi] represent the departure and the arrival airports of one flight. Reconstruct the itinerary in order and return it.\n\nAll of the tickets belong to a man who departs from \"JFK\", thus, the itinerary must begin with \"JFK\". If there are multiple valid itineraries, you should return the itinerary that has the smallest lexical order when read as a single string.\n\n\n\tFor example, the itinerary [\"JFK\", \"LGA\"] has a smaller lexical order than [\"JFK\", \"LGB\"].\n\n\nYou may assume all tickets form at least one valid itinerary. You must use all the tickets once and only once.\n\n \n",
    "examples": [
      {
        "input": "tickets = [[\"MUC\",\"LHR\"],[\"JFK\",\"MUC\"],[\"SFO\",\"SJC\"],[\"LHR\",\"SFO\"]]",
        "output": "[\"JFK\",\"MUC\",\"LHR\",\"SFO\",\"SJC\"]",
        "explanation": ""
      },
      {
        "input": "tickets = [[\"JFK\",\"SFO\"],[\"JFK\",\"ATL\"],[\"SFO\",\"ATL\"],[\"ATL\",\"JFK\"],[\"ATL\",\"SFO\"]]",
        "output": "[\"JFK\",\"ATL\",\"JFK\",\"SFO\",\"ATL\",\"SFO\"]",
        "explanation": "Another possible reconstruction is [\"JFK\",\"SFO\",\"ATL\",\"JFK\",\"ATL\",\"SFO\"] but it is larger in lexical order."
      }
    ],
    "constraints": [
      "1 <= tickets.length <= 300",
      "tickets[i].length == 2",
      "fromi.length == 3",
      "toi.length == 3",
      "fromi and toi consist of uppercase English letters.",
      "fromi != toi"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string[][]} tickets\n * @return {string[]}\n */\nvar findItinerary = function(tickets) {\n    \n};",
      "python": "class Solution:\n    def findItinerary(self, tickets: List[List[str]]) -> List[str]:\n        "
    },
    "solution": {}
  },
  {
    "id": "1706",
    "title": "Min Cost to Connect All Points",
    "difficulty": "Medium",
    "category": "Advanced Graphs",
    "description": "You are given an array points representing integer coordinates of some points on a 2D-plane, where points[i] = [xi, yi].\n\nThe cost of connecting two points [xi, yi] and [xj, yj] is the",
    "examples": [
      {
        "input": "points = [[0,0],[2,2],[3,10],[5,2],[7,0]]",
        "output": "20",
        "explanation": ""
      },
      {
        "input": "points = [[3,12],[-2,5],[-4,1]]",
        "output": "18",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= points.length <= 1000",
      "-106 <= xi, yi <= 106",
      "All pairs (xi, yi) are distinct."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} points\n * @return {number}\n */\nvar minCostConnectPoints = function(points) {\n    \n};",
      "python": "class Solution:\n    def minCostConnectPoints(self, points: List[List[int]]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "794",
    "title": "Swim in Rising Water",
    "difficulty": "Hard",
    "category": "Advanced Graphs",
    "description": "You are given an n x n integer matrix grid where each value grid[i][j] represents the elevation at that point (i, j).\n\nIt starts raining, and water gradually rises over time. At time t, the water level is t, meaning",
    "examples": [
      {
        "input": "grid = [[0,2],[1,3]]",
        "output": "3",
        "explanation": ""
      },
      {
        "input": "grid = [[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]",
        "output": "16",
        "explanation": "The final route is shown."
      }
    ],
    "constraints": [
      "n == grid.length",
      "n == grid[i].length",
      "1 <= n <= 50",
      "0 <= grid[i][j] < n2",
      "Each value grid[i][j] is unique."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} grid\n * @return {number}\n */\nvar swimInWater = function(grid) {\n    \n};",
      "python": "class Solution:\n    def swimInWater(self, grid: List[List[int]]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "803",
    "title": "Cheapest Flights Within K Stops",
    "difficulty": "Medium",
    "category": "Advanced Graphs",
    "description": "There are n cities connected by some number of flights. You are given an array flights where flights[i] = [fromi, toi, pricei] indicates that there is a flight from city fromi to city toi with cost pricei.\n\nYou are also given three integers src, dst, and k, return ",
    "examples": [
      {
        "input": "n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src = 0, dst = 3, k = 1",
        "output": "700",
        "explanation": ""
      },
      {
        "input": "n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 1",
        "output": "200",
        "explanation": ""
      },
      {
        "input": "n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 0",
        "output": "500",
        "explanation": ""
      }
    ],
    "constraints": [
      "2 <= n <= 100",
      "0 <= flights.length <= (n * (n - 1) / 2)",
      "flights[i].length == 3",
      "0 <= fromi, toi < n",
      "fromi != toi",
      "1 <= pricei <= 104",
      "There will not be any multiple flights between two cities.",
      "0 <= src, dst, k < n",
      "src != dst"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} n\n * @param {number[][]} flights\n * @param {number} src\n * @param {number} dst\n * @param {number} k\n * @return {number}\n */\nvar findCheapestPrice = function(n, flights, src, dst, k) {\n    \n};",
      "python": "class Solution:\n    def findCheapestPrice(self, n: int, flights: List[List[int]], src: int, dst: int, k: int) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "70",
    "title": "Climbing Stairs",
    "difficulty": "Easy",
    "category": "1-D Dynamic Programming",
    "description": "You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?\n\n \n",
    "examples": [
      {
        "input": "n = 2",
        "output": "2",
        "explanation": "There are two ways to climb to the top."
      },
      {
        "input": "n = 3",
        "output": "3",
        "explanation": "There are three ways to climb to the top."
      }
    ],
    "constraints": [
      "1 <= n <= 45"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} n\n * @return {number}\n */\nvar climbStairs = function(n) {\n    \n};",
      "python": "class Solution:\n    def climbStairs(self, n: int) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "747",
    "title": "Min Cost Climbing Stairs",
    "difficulty": "Easy",
    "category": "1-D Dynamic Programming",
    "description": "You are given an integer array cost where cost[i] is the cost of ith step on a staircase. Once you pay the cost, you can either climb one or two steps.\n\nYou can either start from the step with index 0, or the step with index 1.\n\nReturn the minimum cost to reach the top of the floor.\n\n \n",
    "examples": [
      {
        "input": "cost = [10,15,20]",
        "output": "15",
        "explanation": "You will start at index 1."
      },
      {
        "input": "cost = [1,100,1,1,1,100,1,1,100,1]",
        "output": "6",
        "explanation": "You will start at index 0."
      }
    ],
    "constraints": [
      "2 <= cost.length <= 1000",
      "0 <= cost[i] <= 999"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} cost\n * @return {number}\n */\nvar minCostClimbingStairs = function(cost) {\n    \n};",
      "python": "class Solution:\n    def minCostClimbingStairs(self, cost: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "198",
    "title": "House Robber",
    "difficulty": "Medium",
    "category": "1-D Dynamic Programming",
    "description": "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night.\n\nGiven an integer array nums representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.\n\n \n",
    "examples": [
      {
        "input": "nums = [1,2,3,1]",
        "output": "4",
        "explanation": "Rob house 1 (money = 1) and then rob house 3 (money = 3)."
      },
      {
        "input": "nums = [2,7,9,3,1]",
        "output": "12",
        "explanation": "Rob house 1 (money = 2), rob house 3 (money = 9) and rob house 5 (money = 1)."
      }
    ],
    "constraints": [
      "1 <= nums.length <= 100",
      "0 <= nums[i] <= 400"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar rob = function(nums) {\n    \n};",
      "python": "class Solution:\n    def rob(self, nums: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "213",
    "title": "House Robber II",
    "difficulty": "Medium",
    "category": "1-D Dynamic Programming",
    "description": "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. All houses at this place are",
    "examples": [
      {
        "input": "nums = [2,3,2]",
        "output": "3",
        "explanation": "You cannot rob house 1 (money = 2) and then rob house 3 (money = 2), because they are adjacent houses."
      },
      {
        "input": "nums = [1,2,3,1]",
        "output": "4",
        "explanation": "Rob house 1 (money = 1) and then rob house 3 (money = 3)."
      },
      {
        "input": "nums = [1,2,3]",
        "output": "3",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= nums.length <= 100",
      "0 <= nums[i] <= 1000"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar rob = function(nums) {\n    \n};",
      "python": "class Solution:\n    def rob(self, nums: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "5",
    "title": "Longest Palindromic Substring",
    "difficulty": "Medium",
    "category": "1-D Dynamic Programming",
    "description": "Given a string s, return the longest palindromic substring in s.\n\n \n",
    "examples": [
      {
        "input": "s = \"babad\"",
        "output": "\"bab\"",
        "explanation": "\"aba\" is also a valid answer."
      },
      {
        "input": "s = \"cbbd\"",
        "output": "\"bb\"",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= s.length <= 1000",
      "s consist of only digits and English letters."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @return {string}\n */\nvar longestPalindrome = function(s) {\n    \n};",
      "python": "class Solution:\n    def longestPalindrome(self, s: str) -> str:\n        "
    },
    "solution": {}
  },
  {
    "id": "647",
    "title": "Palindromic Substrings",
    "difficulty": "Medium",
    "category": "1-D Dynamic Programming",
    "description": "Given a string s, return the number of",
    "examples": [
      {
        "input": "s = \"abc\"",
        "output": "3",
        "explanation": "Three palindromic strings: \"a\", \"b\", \"c\"."
      },
      {
        "input": "s = \"aaa\"",
        "output": "6",
        "explanation": "Six palindromic strings: \"a\", \"a\", \"a\", \"aa\", \"aa\", \"aaa\"."
      }
    ],
    "constraints": [
      "1 <= s.length <= 1000",
      "s consists of lowercase English letters."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @return {number}\n */\nvar countSubstrings = function(s) {\n    \n};",
      "python": "class Solution:\n    def countSubstrings(self, s: str) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "91",
    "title": "Decode Ways",
    "difficulty": "Medium",
    "category": "1-D Dynamic Programming",
    "description": "You have intercepted a secret message encoded as a string of numbers. The message is",
    "examples": [],
    "constraints": [
      "1 <= s.length <= 100",
      "s contains only digits and may contain leading zero(s)."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @return {number}\n */\nvar numDecodings = function(s) {\n    \n};",
      "python": "class Solution:\n    def numDecodings(self, s: str) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "322",
    "title": "Coin Change",
    "difficulty": "Medium",
    "category": "1-D Dynamic Programming",
    "description": "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.\n\nYou may assume that you have an infinite number of each kind of coin.\n\n \n",
    "examples": [
      {
        "input": "coins = [1,2,5], amount = 11",
        "output": "3",
        "explanation": "11 = 5 + 5 + 1"
      },
      {
        "input": "coins = [2], amount = 3",
        "output": "-1",
        "explanation": ""
      },
      {
        "input": "coins = [1], amount = 0",
        "output": "0",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= coins.length <= 12",
      "1 <= coins[i] <= 231 - 1",
      "0 <= amount <= 104"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nvar coinChange = function(coins, amount) {\n    \n};",
      "python": "class Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "152",
    "title": "Maximum Product Subarray",
    "difficulty": "Medium",
    "category": "1-D Dynamic Programming",
    "description": "Given an integer array nums, find a subarray that has the largest product, and return the product.\n\nThe test cases are generated so that the answer will fit in a",
    "examples": [
      {
        "input": "nums = [2,3,-2,4]",
        "output": "6",
        "explanation": "[2,3] has the largest product 6."
      },
      {
        "input": "nums = [-2,0,-1]",
        "output": "0",
        "explanation": "The result cannot be 2, because [-2,-1] is not a subarray."
      }
    ],
    "constraints": [
      "1 <= nums.length <= 2 * 104",
      "-10 <= nums[i] <= 10",
      "The product of any subarray of nums is guaranteed to fit in a 32-bit integer."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxProduct = function(nums) {\n    \n};",
      "python": "class Solution:\n    def maxProduct(self, nums: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "139",
    "title": "Word Break",
    "difficulty": "Medium",
    "category": "1-D Dynamic Programming",
    "description": "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.\n\n",
    "examples": [
      {
        "input": "s = \"leetcode\", wordDict = [\"leet\",\"code\"]",
        "output": "true",
        "explanation": "Return true because \"leetcode\" can be segmented as \"leet code\"."
      },
      {
        "input": "s = \"applepenapple\", wordDict = [\"apple\",\"pen\"]",
        "output": "true",
        "explanation": "Return true because \"applepenapple\" can be segmented as \"apple pen apple\"."
      },
      {
        "input": "s = \"catsandog\", wordDict = [\"cats\",\"dog\",\"sand\",\"and\",\"cat\"]",
        "output": "false",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= s.length <= 300",
      "1 <= wordDict.length <= 1000",
      "1 <= wordDict[i].length <= 20",
      "s and wordDict[i] consist of only lowercase English letters.",
      "All the strings of wordDict are unique."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @param {string[]} wordDict\n * @return {boolean}\n */\nvar wordBreak = function(s, wordDict) {\n    \n};",
      "python": "class Solution:\n    def wordBreak(self, s: str, wordDict: List[str]) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "300",
    "title": "Longest Increasing Subsequence",
    "difficulty": "Medium",
    "category": "1-D Dynamic Programming",
    "description": "Given an integer array nums, return the length of the longest",
    "examples": [
      {
        "input": "nums = [10,9,2,5,3,7,101,18]",
        "output": "4",
        "explanation": "The longest increasing subsequence is [2,3,7,101], therefore the length is 4."
      },
      {
        "input": "nums = [0,1,0,3,2,3]",
        "output": "4",
        "explanation": ""
      },
      {
        "input": "nums = [7,7,7,7,7,7,7]",
        "output": "1",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= nums.length <= 2500",
      "-104 <= nums[i] <= 104"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar lengthOfLIS = function(nums) {\n    \n};",
      "python": "class Solution:\n    def lengthOfLIS(self, nums: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "416",
    "title": "Partition Equal Subset Sum",
    "difficulty": "Medium",
    "category": "1-D Dynamic Programming",
    "description": "Given an integer array nums, return true if you can partition the array into two subsets such that the sum of the elements in both subsets is equal or false otherwise.\n\n \n",
    "examples": [
      {
        "input": "nums = [1,5,11,5]",
        "output": "true",
        "explanation": "The array can be partitioned as [1, 5, 5] and [11]."
      },
      {
        "input": "nums = [1,2,3,5]",
        "output": "false",
        "explanation": "The array cannot be partitioned into equal sum subsets."
      }
    ],
    "constraints": [
      "1 <= nums.length <= 200",
      "1 <= nums[i] <= 100"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar canPartition = function(nums) {\n    \n};",
      "python": "class Solution:\n    def canPartition(self, nums: List[int]) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "62",
    "title": "Unique Paths",
    "difficulty": "Medium",
    "category": "2-D Dynamic Programming",
    "description": "There is a robot on an m x n grid. The robot is initially located at the",
    "examples": [
      {
        "input": "m = 3, n = 7",
        "output": "28",
        "explanation": ""
      },
      {
        "input": "m = 3, n = 2",
        "output": "3",
        "explanation": "From the top-left corner, there are a total of 3 ways to reach the bottom-right corner:"
      }
    ],
    "constraints": [
      "1 <= m, n <= 100"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} m\n * @param {number} n\n * @return {number}\n */\nvar uniquePaths = function(m, n) {\n    \n};",
      "python": "class Solution:\n    def uniquePaths(self, m: int, n: int) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "1250",
    "title": "Longest Common Subsequence",
    "difficulty": "Medium",
    "category": "2-D Dynamic Programming",
    "description": "Given two strings text1 and text2, return the length of their longest",
    "examples": [
      {
        "input": "text1 = \"abcde\", text2 = \"ace\"",
        "output": "3",
        "explanation": "The longest common subsequence is \"ace\" and its length is 3."
      },
      {
        "input": "text1 = \"abc\", text2 = \"abc\"",
        "output": "3",
        "explanation": "The longest common subsequence is \"abc\" and its length is 3."
      },
      {
        "input": "text1 = \"abc\", text2 = \"def\"",
        "output": "0",
        "explanation": "There is no such common subsequence, so the result is 0."
      }
    ],
    "constraints": [
      "1 <= text1.length, text2.length <= 1000",
      "text1 and text2 consist of only lowercase English characters."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} text1\n * @param {string} text2\n * @return {number}\n */\nvar longestCommonSubsequence = function(text1, text2) {\n    \n};",
      "python": "class Solution:\n    def longestCommonSubsequence(self, text1: str, text2: str) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "309",
    "title": "Best Time to Buy and Sell Stock with Cooldown",
    "difficulty": "Medium",
    "category": "2-D Dynamic Programming",
    "description": "You are given an array prices where prices[i] is the price of a given stock on the ith day.\n\nFind the maximum profit you can achieve. You may complete as many transactions as you like (i.e., buy one and sell one share of the stock multiple times) with the following restrictions:\n\n\n\tAfter you sell your stock, you cannot buy stock on the next day (i.e., cooldown one day).\n\n\n",
    "examples": [
      {
        "input": "prices = [1,2,3,0,2]",
        "output": "3",
        "explanation": "transactions = [buy, sell, cooldown, buy, sell]"
      },
      {
        "input": "prices = [1]",
        "output": "0",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= prices.length <= 5000",
      "0 <= prices[i] <= 1000"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} prices\n * @return {number}\n */\nvar maxProfit = function(prices) {\n    \n};",
      "python": "class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "518",
    "title": "Coin Change II",
    "difficulty": "Medium",
    "category": "2-D Dynamic Programming",
    "description": "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.\n\nReturn the number of combinations that make up that amount. If that amount of money cannot be made up by any combination of the coins, return 0.\n\nYou may assume that you have an infinite number of each kind of coin.\n\nThe",
    "examples": [
      {
        "input": "amount = 5, coins = [1,2,5]",
        "output": "4",
        "explanation": "there are four ways to make up the amount:"
      },
      {
        "input": "amount = 3, coins = [2]",
        "output": "0",
        "explanation": "the amount of 3 cannot be made up just with coins of 2."
      },
      {
        "input": "amount = 10, coins = [10]",
        "output": "1",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= coins.length <= 300",
      "1 <= coins[i] <= 5000",
      "All the values of coins are unique.",
      "0 <= amount <= 5000"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} amount\n * @param {number[]} coins\n * @return {number}\n */\nvar change = function(amount, coins) {\n    \n};",
      "python": "class Solution:\n    def change(self, amount: int, coins: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "494",
    "title": "Target Sum",
    "difficulty": "Medium",
    "category": "2-D Dynamic Programming",
    "description": "You are given an integer array nums and an integer target.\n\nYou want to build an",
    "examples": [
      {
        "input": "nums = [1,1,1,1,1], target = 3",
        "output": "5",
        "explanation": "There are 5 ways to assign symbols to make the sum of nums be target 3."
      },
      {
        "input": "nums = [1], target = 1",
        "output": "1",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= nums.length <= 20",
      "0 <= nums[i] <= 1000",
      "0 <= sum(nums[i]) <= 1000",
      "-1000 <= target <= 1000"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar findTargetSumWays = function(nums, target) {\n    \n};",
      "python": "class Solution:\n    def findTargetSumWays(self, nums: List[int], target: int) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "97",
    "title": "Interleaving String",
    "difficulty": "Medium",
    "category": "2-D Dynamic Programming",
    "description": "Given strings s1, s2, and s3, find whether s3 is formed by an",
    "examples": [
      {
        "input": "s1 = \"aabcc\", s2 = \"dbbca\", s3 = \"aadbbcbcac\"",
        "output": "true",
        "explanation": "One way to obtain s3 is:"
      },
      {
        "input": "s1 = \"aabcc\", s2 = \"dbbca\", s3 = \"aadbbbaccc\"",
        "output": "false",
        "explanation": "Notice how it is impossible to interleave s2 with any other string to obtain s3."
      },
      {
        "input": "s1 = \"\", s2 = \"\", s3 = \"\"",
        "output": "true",
        "explanation": ""
      }
    ],
    "constraints": [
      "0 <= s1.length, s2.length <= 100",
      "0 <= s3.length <= 200",
      "s1, s2, and s3 consist of lowercase English letters."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s1\n * @param {string} s2\n * @param {string} s3\n * @return {boolean}\n */\nvar isInterleave = function(s1, s2, s3) {\n    \n};",
      "python": "class Solution:\n    def isInterleave(self, s1: str, s2: str, s3: str) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "329",
    "title": "Longest Increasing Path in a Matrix",
    "difficulty": "Hard",
    "category": "2-D Dynamic Programming",
    "description": "Given an m x n integers matrix, return the length of the longest increasing path in matrix.\n\nFrom each cell, you can either move in four directions: left, right, up, or down. You",
    "examples": [
      {
        "input": "matrix = [[9,9,4],[6,6,8],[2,1,1]]",
        "output": "4",
        "explanation": "The longest increasing path is [1, 2, 6, 9]."
      },
      {
        "input": "matrix = [[3,4,5],[3,2,6],[2,2,1]]",
        "output": "4",
        "explanation": "The longest increasing path is [3, 4, 5, 6]. Moving diagonally is not allowed."
      },
      {
        "input": "matrix = [[1]]",
        "output": "1",
        "explanation": ""
      }
    ],
    "constraints": [
      "m == matrix.length",
      "n == matrix[i].length",
      "1 <= m, n <= 200",
      "0 <= matrix[i][j] <= 231 - 1"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} matrix\n * @return {number}\n */\nvar longestIncreasingPath = function(matrix) {\n    \n};",
      "python": "class Solution:\n    def longestIncreasingPath(self, matrix: List[List[int]]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "115",
    "title": "Distinct Subsequences",
    "difficulty": "Hard",
    "category": "2-D Dynamic Programming",
    "description": "Given two strings s and t, return the number of distinct subsequences of s which equals t.\n\nThe test cases are generated so that the answer fits on a 32-bit signed integer.\n\n \n",
    "examples": [
      {
        "input": "s = \"rabbbit\", t = \"rabbit\"",
        "output": "3",
        "explanation": ""
      },
      {
        "input": "s = \"babgbag\", t = \"bag\"",
        "output": "5",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= s.length, t.length <= 1000",
      "s and t consist of English letters."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @param {string} t\n * @return {number}\n */\nvar numDistinct = function(s, t) {\n    \n};",
      "python": "class Solution:\n    def numDistinct(self, s: str, t: str) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "72",
    "title": "Edit Distance",
    "difficulty": "Medium",
    "category": "2-D Dynamic Programming",
    "description": "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.\n\nYou have the following three operations permitted on a word:\n\n\n\tInsert a character\n\tDelete a character\n\tReplace a character\n\n\n \n",
    "examples": [
      {
        "input": "word1 = \"horse\", word2 = \"ros\"",
        "output": "3",
        "explanation": ""
      },
      {
        "input": "word1 = \"intention\", word2 = \"execution\"",
        "output": "5",
        "explanation": ""
      }
    ],
    "constraints": [
      "0 <= word1.length, word2.length <= 500",
      "word1 and word2 consist of lowercase English letters."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} word1\n * @param {string} word2\n * @return {number}\n */\nvar minDistance = function(word1, word2) {\n    \n};",
      "python": "class Solution:\n    def minDistance(self, word1: str, word2: str) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "312",
    "title": "Burst Balloons",
    "difficulty": "Hard",
    "category": "2-D Dynamic Programming",
    "description": "You are given n balloons, indexed from 0 to n - 1. Each balloon is painted with a number on it represented by an array nums. You are asked to burst all the balloons.\n\nIf you burst the ith balloon, you will get nums[i - 1] * nums[i] * nums[i + 1] coins. If i - 1 or i + 1 goes out of bounds of the array, then treat it as if there is a balloon with a 1 painted on it.\n\nReturn the maximum coins you can collect by bursting the balloons wisely.\n\n \n",
    "examples": [
      {
        "input": "nums = [3,1,5,8]",
        "output": "167",
        "explanation": ""
      },
      {
        "input": "nums = [1,5]",
        "output": "10",
        "explanation": ""
      }
    ],
    "constraints": [
      "n == nums.length",
      "1 <= n <= 300",
      "0 <= nums[i] <= 100"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxCoins = function(nums) {\n    \n};",
      "python": "class Solution:\n    def maxCoins(self, nums: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "10",
    "title": "Regular Expression Matching",
    "difficulty": "Hard",
    "category": "2-D Dynamic Programming",
    "description": "Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*' where:\n\n\n\t'.' Matches any single character.​​​​\n\t'*' Matches zero or more of the preceding element.\n\n\nReturn a boolean indicating whether the matching covers the entire input string (not partial).\n\n \n",
    "examples": [
      {
        "input": "s = \"aa\", p = \"a\"",
        "output": "false",
        "explanation": "\"a\" does not match the entire string \"aa\"."
      },
      {
        "input": "s = \"aa\", p = \"a*\"",
        "output": "true",
        "explanation": "'*' means zero or more of the preceding element, 'a'. Therefore, by repeating 'a' once, it becomes \"aa\"."
      },
      {
        "input": "s = \"ab\", p = \".*\"",
        "output": "true",
        "explanation": "\".*\" means \"zero or more (*) of any character (.)\"."
      }
    ],
    "constraints": [
      "1 <= s.length <= 20",
      "1 <= p.length <= 20",
      "s contains only lowercase English letters.",
      "p contains only lowercase English letters, '.', and '*'.",
      "It is guaranteed for each appearance of the character '*', there will be a previous valid character to match."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @param {string} p\n * @return {boolean}\n */\nvar isMatch = function(s, p) {\n    \n};",
      "python": "class Solution:\n    def isMatch(self, s: str, p: str) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "53",
    "title": "Maximum Subarray",
    "difficulty": "Medium",
    "category": "Greedy",
    "description": "Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\n \n",
    "examples": [
      {
        "input": "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        "output": "6",
        "explanation": "The subarray [4,-1,2,1] has the largest sum 6."
      },
      {
        "input": "nums = [1]",
        "output": "1",
        "explanation": "The subarray [1] has the largest sum 1."
      },
      {
        "input": "nums = [5,4,-1,7,8]",
        "output": "23",
        "explanation": "The subarray [5,4,-1,7,8] has the largest sum 23."
      }
    ],
    "constraints": [
      "1 <= nums.length <= 105",
      "-104 <= nums[i] <= 104"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxSubArray = function(nums) {\n    \n};",
      "python": "class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "55",
    "title": "Jump Game",
    "difficulty": "Medium",
    "category": "Greedy",
    "description": "You are given an integer array nums. You are initially positioned at the array's",
    "examples": [
      {
        "input": "nums = [2,3,1,1,4]",
        "output": "true",
        "explanation": "Jump 1 step from index 0 to 1, then 3 steps to the last index."
      },
      {
        "input": "nums = [3,2,1,0,4]",
        "output": "false",
        "explanation": "You will always arrive at index 3 no matter what. Its maximum jump length is 0, which makes it impossible to reach the last index."
      }
    ],
    "constraints": [
      "1 <= nums.length <= 104",
      "0 <= nums[i] <= 105"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar canJump = function(nums) {\n    \n};",
      "python": "class Solution:\n    def canJump(self, nums: List[int]) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "45",
    "title": "Jump Game II",
    "difficulty": "Medium",
    "category": "Greedy",
    "description": "You are given a",
    "examples": [
      {
        "input": "nums = [2,3,1,1,4]",
        "output": "2",
        "explanation": "The minimum number of jumps to reach the last index is 2. Jump 1 step from index 0 to 1, then 3 steps to the last index."
      },
      {
        "input": "nums = [2,3,0,1,4]",
        "output": "2",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= nums.length <= 104",
      "0 <= nums[i] <= 1000",
      "It's guaranteed that you can reach nums[n - 1]."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar jump = function(nums) {\n    \n};",
      "python": "class Solution:\n    def jump(self, nums: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "134",
    "title": "Gas Station",
    "difficulty": "Medium",
    "category": "Greedy",
    "description": "There are n gas stations along a circular route, where the amount of gas at the ith station is gas[i].\n\nYou have a car with an unlimited gas tank and it costs cost[i] of gas to travel from the ith station to its next (i + 1)th station. You begin the journey with an empty tank at one of the gas stations.\n\nGiven two integer arrays gas and cost, return the starting gas station's index if you can travel around the circuit once in the clockwise direction, otherwise return -1. If there exists a solution, it is",
    "examples": [
      {
        "input": "gas = [1,2,3,4,5], cost = [3,4,5,1,2]",
        "output": "3",
        "explanation": ""
      },
      {
        "input": "gas = [2,3,4], cost = [3,4,3]",
        "output": "-1",
        "explanation": ""
      }
    ],
    "constraints": [
      "n == gas.length == cost.length",
      "1 <= n <= 105",
      "0 <= gas[i], cost[i] <= 104",
      "The input is generated such that the answer is unique."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} gas\n * @param {number[]} cost\n * @return {number}\n */\nvar canCompleteCircuit = function(gas, cost) {\n    \n};",
      "python": "class Solution:\n    def canCompleteCircuit(self, gas: List[int], cost: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "876",
    "title": "Hand of Straights",
    "difficulty": "Medium",
    "category": "Greedy",
    "description": "Alice has some number of cards and she wants to rearrange the cards into groups so that each group is of size groupSize, and consists of groupSize consecutive cards.\n\nGiven an integer array hand where hand[i] is the value written on the ith card and an integer groupSize, return true if she can rearrange the cards, or false otherwise.\n\n \n",
    "examples": [
      {
        "input": "hand = [1,2,3,6,2,3,4,7,8], groupSize = 3",
        "output": "true",
        "explanation": "Alice's hand can be rearranged as [1,2,3],[2,3,4],[6,7,8]"
      },
      {
        "input": "hand = [1,2,3,4,5], groupSize = 4",
        "output": "false",
        "explanation": "Alice's hand can not be rearranged into groups of 4."
      }
    ],
    "constraints": [
      "1 <= hand.length <= 104",
      "0 <= hand[i] <= 109",
      "1 <= groupSize <= hand.length"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} hand\n * @param {number} groupSize\n * @return {boolean}\n */\nvar isNStraightHand = function(hand, groupSize) {\n    \n};",
      "python": "class Solution:\n    def isNStraightHand(self, hand: List[int], groupSize: int) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "2026",
    "title": "Merge Triplets to Form Target Triplet",
    "difficulty": "Medium",
    "category": "Greedy",
    "description": "A",
    "examples": [
      {
        "input": "triplets = [[2,5,3],[1,8,4],[1,7,5]], target = [2,7,5]",
        "output": "true",
        "explanation": "Perform the following operations:"
      },
      {
        "input": "triplets = [[3,4,5],[4,5,6]], target = [3,2,5]",
        "output": "false",
        "explanation": "It is impossible to have [3,2,5] as an element because there is no 2 in any of the triplets."
      },
      {
        "input": "triplets = [[2,5,3],[2,3,4],[1,2,5],[5,2,3]], target = [5,5,5]",
        "output": "true",
        "explanation": "Perform the following operations:"
      }
    ],
    "constraints": [
      "1 <= triplets.length <= 105",
      "triplets[i].length == target.length == 3",
      "1 <= ai, bi, ci, x, y, z <= 1000"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} triplets\n * @param {number[]} target\n * @return {boolean}\n */\nvar mergeTriplets = function(triplets, target) {\n    \n};",
      "python": "class Solution:\n    def mergeTriplets(self, triplets: List[List[int]], target: List[int]) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "768",
    "title": "Partition Labels",
    "difficulty": "Medium",
    "category": "Greedy",
    "description": "You are given a string s. We want to partition the string into as many parts as possible so that each letter appears in at most one part. For example, the string \"ababcc\" can be partitioned into [\"abab\", \"cc\"], but partitions such as [\"aba\", \"bcc\"] or [\"ab\", \"ab\", \"cc\"] are invalid.\n\nNote that the partition is done so that after concatenating all the parts in order, the resultant string should be s.\n\nReturn a list of integers representing the size of these parts.\n\n \n",
    "examples": [
      {
        "input": "s = \"ababcbacadefegdehijhklij\"",
        "output": "[9,7,8]",
        "explanation": ""
      },
      {
        "input": "s = \"eccbbbbdec\"",
        "output": "[10]",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= s.length <= 500",
      "s consists of lowercase English letters."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @return {number[]}\n */\nvar partitionLabels = function(s) {\n    \n};",
      "python": "class Solution:\n    def partitionLabels(self, s: str) -> List[int]:\n        "
    },
    "solution": {}
  },
  {
    "id": "678",
    "title": "Valid Parenthesis String",
    "difficulty": "Medium",
    "category": "Greedy",
    "description": "Given a string s containing only three types of characters: '(', ')' and '*', return true if s is",
    "examples": [
      {
        "input": "s = \"()\"",
        "output": "true",
        "explanation": ""
      },
      {
        "input": "s = \"(*)\"",
        "output": "true",
        "explanation": ""
      },
      {
        "input": "s = \"(*))\"",
        "output": "true",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= s.length <= 100",
      "s[i] is '(', ')' or '*'."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @return {boolean}\n */\nvar checkValidString = function(s) {\n    \n};",
      "python": "class Solution:\n    def checkValidString(self, s: str) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "57",
    "title": "Insert Interval",
    "difficulty": "Medium",
    "category": "Intervals",
    "description": "You are given an array of non-overlapping intervals intervals where intervals[i] = [starti, endi] represent the start and the end of the ith interval and intervals is sorted in ascending order by starti. You are also given an interval newInterval = [start, end] that represents the start and end of another interval.\n\nInsert newInterval into intervals such that intervals is still sorted in ascending order by starti and intervals still does not have any overlapping intervals (merge overlapping intervals if necessary).\n\nReturn intervals after the insertion.\n\n",
    "examples": [
      {
        "input": "intervals = [[1,3],[6,9]], newInterval = [2,5]",
        "output": "[[1,5],[6,9]]",
        "explanation": ""
      },
      {
        "input": "intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]",
        "output": "[[1,2],[3,10],[12,16]]",
        "explanation": "Because the new interval [4,8] overlaps with [3,5],[6,7],[8,10]."
      }
    ],
    "constraints": [
      "0 <= intervals.length <= 104",
      "intervals[i].length == 2",
      "0 <= starti <= endi <= 105",
      "intervals is sorted by starti in ascending order.",
      "newInterval.length == 2",
      "0 <= start <= end <= 105"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} intervals\n * @param {number[]} newInterval\n * @return {number[][]}\n */\nvar insert = function(intervals, newInterval) {\n    \n};",
      "python": "class Solution:\n    def insert(self, intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:\n        "
    },
    "solution": {}
  },
  {
    "id": "56",
    "title": "Merge Intervals",
    "difficulty": "Medium",
    "category": "Intervals",
    "description": "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.\n\n \n",
    "examples": [
      {
        "input": "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        "output": "[[1,6],[8,10],[15,18]]",
        "explanation": "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]."
      },
      {
        "input": "intervals = [[1,4],[4,5]]",
        "output": "[[1,5]]",
        "explanation": "Intervals [1,4] and [4,5] are considered overlapping."
      },
      {
        "input": "intervals = [[4,7],[1,4]]",
        "output": "[[1,7]]",
        "explanation": "Intervals [1,4] and [4,7] are considered overlapping."
      }
    ],
    "constraints": [
      "1 <= intervals.length <= 104",
      "intervals[i].length == 2",
      "0 <= starti <= endi <= 104"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nvar merge = function(intervals) {\n    \n};",
      "python": "class Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        "
    },
    "solution": {}
  },
  {
    "id": "435",
    "title": "Non-overlapping Intervals",
    "difficulty": "Medium",
    "category": "Intervals",
    "description": "Given an array of intervals intervals where intervals[i] = [starti, endi], return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.\n\n",
    "examples": [
      {
        "input": "intervals = [[1,2],[2,3],[3,4],[1,3]]",
        "output": "1",
        "explanation": "[1,3] can be removed and the rest of the intervals are non-overlapping."
      },
      {
        "input": "intervals = [[1,2],[1,2],[1,2]]",
        "output": "2",
        "explanation": "You need to remove two [1,2] to make the rest of the intervals non-overlapping."
      },
      {
        "input": "intervals = [[1,2],[2,3]]",
        "output": "0",
        "explanation": "You don't need to remove any of the intervals since they're already non-overlapping."
      }
    ],
    "constraints": [
      "1 <= intervals.length <= 105",
      "intervals[i].length == 2",
      "-5 * 104 <= starti < endi <= 5 * 104"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} intervals\n * @return {number}\n */\nvar eraseOverlapIntervals = function(intervals) {\n    \n};",
      "python": "class Solution:\n    def eraseOverlapIntervals(self, intervals: List[List[int]]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "1977",
    "title": "Minimum Interval to Include Each Query",
    "difficulty": "Hard",
    "category": "Intervals",
    "description": "You are given a 2D integer array intervals, where intervals[i] = [lefti, righti] describes the ith interval starting at lefti and ending at righti",
    "examples": [
      {
        "input": "intervals = [[1,4],[2,4],[3,6],[4,4]], queries = [2,3,4,5]",
        "output": "[3,3,1,4]",
        "explanation": "The queries are processed as follows:"
      },
      {
        "input": "intervals = [[2,3],[2,5],[1,8],[20,25]], queries = [2,19,5,22]",
        "output": "[2,-1,4,6]",
        "explanation": "The queries are processed as follows:"
      }
    ],
    "constraints": [
      "1 <= intervals.length <= 105",
      "1 <= queries.length <= 105",
      "intervals[i].length == 2",
      "1 <= lefti <= righti <= 107",
      "1 <= queries[j] <= 107"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} intervals\n * @param {number[]} queries\n * @return {number[]}\n */\nvar minInterval = function(intervals, queries) {\n    \n};",
      "python": "class Solution:\n    def minInterval(self, intervals: List[List[int]], queries: List[int]) -> List[int]:\n        "
    },
    "solution": {}
  },
  {
    "id": "48",
    "title": "Rotate Image",
    "difficulty": "Medium",
    "category": "Math & Geometry",
    "description": "You are given an n x n 2D matrix representing an image, rotate the image by",
    "examples": [
      {
        "input": "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
        "output": "[[7,4,1],[8,5,2],[9,6,3]]",
        "explanation": ""
      },
      {
        "input": "matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]",
        "output": "[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]",
        "explanation": ""
      }
    ],
    "constraints": [
      "n == matrix.length == matrix[i].length",
      "1 <= n <= 20",
      "-1000 <= matrix[i][j] <= 1000"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} matrix\n * @return {void} Do not return anything, modify matrix in-place instead.\n */\nvar rotate = function(matrix) {\n    \n};",
      "python": "class Solution:\n    def rotate(self, matrix: List[List[int]]) -> None:\n        \"\"\"\n        Do not return anything, modify matrix in-place instead.\n        \"\"\"\n        "
    },
    "solution": {}
  },
  {
    "id": "54",
    "title": "Spiral Matrix",
    "difficulty": "Medium",
    "category": "Math & Geometry",
    "description": "Given an m x n matrix, return all elements of the matrix in spiral order.\n\n \n",
    "examples": [
      {
        "input": "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
        "output": "[1,2,3,6,9,8,7,4,5]",
        "explanation": ""
      },
      {
        "input": "matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]",
        "output": "[1,2,3,4,8,12,11,10,9,5,6,7]",
        "explanation": ""
      }
    ],
    "constraints": [
      "m == matrix.length",
      "n == matrix[i].length",
      "1 <= m, n <= 10",
      "-100 <= matrix[i][j] <= 100"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} matrix\n * @return {number[]}\n */\nvar spiralOrder = function(matrix) {\n    \n};",
      "python": "class Solution:\n    def spiralOrder(self, matrix: List[List[int]]) -> List[int]:\n        "
    },
    "solution": {}
  },
  {
    "id": "73",
    "title": "Set Matrix Zeroes",
    "difficulty": "Medium",
    "category": "Math & Geometry",
    "description": "Given an m x n integer matrix matrix, if an element is 0, set its entire row and column to 0's.\n\nYou must do it in place.\n\n \n",
    "examples": [
      {
        "input": "matrix = [[1,1,1],[1,0,1],[1,1,1]]",
        "output": "[[1,0,1],[0,0,0],[1,0,1]]",
        "explanation": ""
      },
      {
        "input": "matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]",
        "output": "[[0,0,0,0],[0,4,5,0],[0,3,1,0]]",
        "explanation": ""
      }
    ],
    "constraints": [
      "m == matrix.length",
      "n == matrix[0].length",
      "1 <= m, n <= 200",
      "-231 <= matrix[i][j] <= 231 - 1"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} matrix\n * @return {void} Do not return anything, modify matrix in-place instead.\n */\nvar setZeroes = function(matrix) {\n    \n};",
      "python": "class Solution:\n    def setZeroes(self, matrix: List[List[int]]) -> None:\n        \"\"\"\n        Do not return anything, modify matrix in-place instead.\n        \"\"\"\n        "
    },
    "solution": {}
  },
  {
    "id": "202",
    "title": "Happy Number",
    "difficulty": "Easy",
    "category": "Math & Geometry",
    "description": "Write an algorithm to determine if a number n is happy.\n\nA",
    "examples": [
      {
        "input": "n = 19",
        "output": "true",
        "explanation": ""
      },
      {
        "input": "n = 2",
        "output": "false",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= n <= 231 - 1"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} n\n * @return {boolean}\n */\nvar isHappy = function(n) {\n    \n};",
      "python": "class Solution:\n    def isHappy(self, n: int) -> bool:\n        "
    },
    "solution": {}
  },
  {
    "id": "66",
    "title": "Plus One",
    "difficulty": "Easy",
    "category": "Math & Geometry",
    "description": "You are given a",
    "examples": [
      {
        "input": "digits = [1,2,3]",
        "output": "[1,2,4]",
        "explanation": "The array represents the integer 123."
      },
      {
        "input": "digits = [4,3,2,1]",
        "output": "[4,3,2,2]",
        "explanation": "The array represents the integer 4321."
      },
      {
        "input": "digits = [9]",
        "output": "[1,0]",
        "explanation": "The array represents the integer 9."
      }
    ],
    "constraints": [
      "1 <= digits.length <= 100",
      "0 <= digits[i] <= 9",
      "digits does not contain any leading 0's."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} digits\n * @return {number[]}\n */\nvar plusOne = function(digits) {\n    \n};",
      "python": "class Solution:\n    def plusOne(self, digits: List[int]) -> List[int]:\n        "
    },
    "solution": {}
  },
  {
    "id": "50",
    "title": "Pow(x, n)",
    "difficulty": "Medium",
    "category": "Math & Geometry",
    "description": "Implement pow(x, n), which calculates x raised to the power n (i.e., xn).\n\n \n",
    "examples": [
      {
        "input": "x = 2.00000, n = 10",
        "output": "1024.00000",
        "explanation": ""
      },
      {
        "input": "x = 2.10000, n = 3",
        "output": "9.26100",
        "explanation": ""
      },
      {
        "input": "x = 2.00000, n = -2",
        "output": "0.25000",
        "explanation": "2-2 = 1/22 = 1/4 = 0.25"
      }
    ],
    "constraints": [
      "-100.0 < x < 100.0",
      "-231 <= n <= 231-1",
      "n is an integer.",
      "Either x is not zero or n > 0.",
      "-104 <= xn <= 104"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} x\n * @param {number} n\n * @return {number}\n */\nvar myPow = function(x, n) {\n    \n};",
      "python": "class Solution:\n    def myPow(self, x: float, n: int) -> float:\n        "
    },
    "solution": {}
  },
  {
    "id": "43",
    "title": "Multiply Strings",
    "difficulty": "Medium",
    "category": "Math & Geometry",
    "description": "Given two non-negative integers num1 and num2 represented as strings, return the product of num1 and num2, also represented as a string.\n\n",
    "examples": [
      {
        "input": "num1 = \"2\", num2 = \"3\"",
        "output": "\"6\"",
        "explanation": ""
      },
      {
        "input": "num1 = \"123\", num2 = \"456\"",
        "output": "\"56088\"",
        "explanation": ""
      }
    ],
    "constraints": [
      "1 <= num1.length, num2.length <= 200",
      "num1 and num2 consist of digits only.",
      "Both num1 and num2 do not contain any leading zero, except the number 0 itself."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} num1\n * @param {string} num2\n * @return {string}\n */\nvar multiply = function(num1, num2) {\n    \n};",
      "python": "class Solution:\n    def multiply(self, num1: str, num2: str) -> str:\n        "
    },
    "solution": {}
  },
  {
    "id": "2139",
    "title": "Detect Squares",
    "difficulty": "Medium",
    "category": "Math & Geometry",
    "description": "You are given a stream of points on the X-Y plane. Design an algorithm that:\n\n\n\t",
    "examples": [
      {
        "input": "",
        "output": "",
        "explanation": ""
      }
    ],
    "constraints": [
      "point.length == 2",
      "0 <= x, y <= 1000",
      "At most 3000 calls in total will be made to add and count."
    ],
    "starterCode": {
      "javascript": "\nvar DetectSquares = function() {\n    \n};\n\n/** \n * @param {number[]} point\n * @return {void}\n */\nDetectSquares.prototype.add = function(point) {\n    \n};\n\n/** \n * @param {number[]} point\n * @return {number}\n */\nDetectSquares.prototype.count = function(point) {\n    \n};\n\n/** \n * Your DetectSquares object will be instantiated and called as such:\n * var obj = new DetectSquares()\n * obj.add(point)\n * var param_2 = obj.count(point)\n */",
      "python": "class DetectSquares:\n\n    def __init__(self):\n        \n\n    def add(self, point: List[int]) -> None:\n        \n\n    def count(self, point: List[int]) -> int:\n        \n\n\n# Your DetectSquares object will be instantiated and called as such:\n# obj = DetectSquares()\n# obj.add(point)\n# param_2 = obj.count(point)"
    },
    "solution": {}
  },
  {
    "id": "136",
    "title": "Single Number",
    "difficulty": "Easy",
    "category": "Bit Manipulation",
    "description": "Given a",
    "examples": [],
    "constraints": [
      "1 <= nums.length <= 3 * 104",
      "-3 * 104 <= nums[i] <= 3 * 104",
      "Each element in the array appears twice except for one element which appears only once."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar singleNumber = function(nums) {\n    \n};",
      "python": "class Solution:\n    def singleNumber(self, nums: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "191",
    "title": "Number of 1 Bits",
    "difficulty": "Easy",
    "category": "Bit Manipulation",
    "description": "Given a positive integer n, write a function that returns the number of set bits in its binary representation (also known as the Hamming weight).\n\n \n",
    "examples": [],
    "constraints": [
      "1 <= n <= 231 - 1"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} n\n * @return {number}\n */\nvar hammingWeight = function(n) {\n    \n};",
      "python": "class Solution:\n    def hammingWeight(self, n: int) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "338",
    "title": "Counting Bits",
    "difficulty": "Easy",
    "category": "Bit Manipulation",
    "description": "Given an integer n, return an array ans of length n + 1 such that for each i (0 <= i <= n), ans[i] is the",
    "examples": [
      {
        "input": "n = 2",
        "output": "[0,1,1]",
        "explanation": ""
      },
      {
        "input": "n = 5",
        "output": "[0,1,1,2,1,2]",
        "explanation": ""
      }
    ],
    "constraints": [
      "0 <= n <= 105"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} n\n * @return {number[]}\n */\nvar countBits = function(n) {\n    \n};",
      "python": "class Solution:\n    def countBits(self, n: int) -> List[int]:\n        "
    },
    "solution": {}
  },
  {
    "id": "190",
    "title": "Reverse Bits",
    "difficulty": "Easy",
    "category": "Bit Manipulation",
    "description": "Reverse bits of a given 32 bits signed integer.\n\n \n",
    "examples": [],
    "constraints": [
      "0 <= n <= 231 - 2",
      "n is even."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} n\n * @return {number}\n */\nvar reverseBits = function(n) {\n    \n};",
      "python": "class Solution:\n    def reverseBits(self, n: int) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "268",
    "title": "Missing Number",
    "difficulty": "Easy",
    "category": "Bit Manipulation",
    "description": "Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.\n\n \n",
    "examples": [],
    "constraints": [
      "n == nums.length",
      "1 <= n <= 104",
      "0 <= nums[i] <= n",
      "All the numbers of nums are unique."
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar missingNumber = function(nums) {\n    \n};",
      "python": "class Solution:\n    def missingNumber(self, nums: List[int]) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "371",
    "title": "Sum of Two Integers",
    "difficulty": "Medium",
    "category": "Bit Manipulation",
    "description": "Given two integers a and b, return the sum of the two integers without using the operators + and -.\n\n \n",
    "examples": [
      {
        "input": "a = 1, b = 2",
        "output": "3",
        "explanation": ""
      },
      {
        "input": "a = 2, b = 3",
        "output": "5",
        "explanation": ""
      }
    ],
    "constraints": [
      "-1000 <= a, b <= 1000"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} a\n * @param {number} b\n * @return {number}\n */\nvar getSum = function(a, b) {\n    \n};",
      "python": "class Solution:\n    def getSum(self, a: int, b: int) -> int:\n        "
    },
    "solution": {}
  },
  {
    "id": "7",
    "title": "Reverse Integer",
    "difficulty": "Medium",
    "category": "Bit Manipulation",
    "description": "Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-231, 231 - 1], then return 0.\n\n",
    "examples": [
      {
        "input": "x = 123",
        "output": "321",
        "explanation": ""
      },
      {
        "input": "x = -123",
        "output": "-321",
        "explanation": ""
      },
      {
        "input": "x = 120",
        "output": "21",
        "explanation": ""
      }
    ],
    "constraints": [
      "-231 <= x <= 231 - 1"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} x\n * @return {number}\n */\nvar reverse = function(x) {\n    \n};",
      "python": "class Solution:\n    def reverse(self, x: int) -> int:\n        "
    },
    "solution": {}
  }
];
