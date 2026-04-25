import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Concept } from './models/Concept.js';
import { StudyPlan } from './models/StudyPlan.js';
import { User } from './models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studyos';

const DSA_CONCEPTS = [
  { topic: 'Arrays', description: 'Linear data structure storing elements in contiguous memory. Key operations: traversal, insertion, deletion, searching, sorting. Common patterns: two pointers, prefix sums, kadane\'s algorithm.' },
  { topic: 'Strings', description: 'Sequence of characters. Key operations: pattern matching, substring search, string manipulation. Common algorithms: KMP, Rabin-Karp, Z-algorithm.' },
  { topic: 'Hashing', description: 'Technique mapping data to fixed-size values for O(1) average lookups. Key structures: hash tables, hash maps, hash sets. Handles collisions via chaining or open addressing.' },
  { topic: 'Two Pointers', description: 'Technique using two references to iterate through data. Variants: same direction, opposite direction, fast-slow pointer. Used for sorted arrays, linked lists, and sliding window problems.' },
  { topic: 'Sliding Window', description: 'Technique maintaining a window of elements that slides across data. Fixed-size and variable-size variants. Used for substring, subarray, and optimization problems.' },
  { topic: 'Stack', description: 'LIFO data structure. Key operations: push, pop, peek. Applications: expression evaluation, parentheses matching, monotonic stack, DFS implementation.' },
  { topic: 'Queue', description: 'FIFO data structure. Variants: circular queue, deque, priority queue. Applications: BFS, task scheduling, sliding window maximum.' },
  { topic: 'Linked Lists', description: 'Linear data structure with nodes connected by pointers. Variants: singly, doubly, circular. Key operations: reversal, cycle detection (Floyd\'s), merge, intersection detection.' },
  { topic: 'Trees', description: 'Hierarchical data structure with root node and children. Variants: BST, AVL, Red-Black, segment tree, trie. Traversals: inorder, preorder, postorder, level-order.' },
  { topic: 'Graphs', description: 'Non-linear structure with vertices and edges. Representations: adjacency list, adjacency matrix. Algorithms: BFS, DFS, Dijkstra, Bellman-Ford, Kruskal, Prim, topological sort.' },
  { topic: 'Heaps', description: 'Complete binary tree satisfying heap property. Types: min-heap, max-heap. Key operations: insert, extract-min/max, heapify. Applications: priority queues, median finding, K-way merge.' },
  { topic: 'Dynamic Programming', description: 'Optimization technique solving problems by breaking into overlapping subproblems. Approaches: top-down (memoization), bottom-up (tabulation). Classic: knapsack, LCS, LIS, coin change, matrix chain.' },
  { topic: 'Backtracking', description: 'Algorithmic technique exploring all possible solutions by building incrementally and abandoning paths that fail constraints. Applications: N-Queens, Sudoku, permutations, combinations, subset sum.' },
  { topic: 'Greedy', description: 'Algorithmic paradigm making locally optimal choices at each step. Requires optimal substructure and greedy-choice property. Applications: activity selection, Huffman coding, fractional knapsack, job scheduling.' },
];

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await Concept.deleteMany({});
    await StudyPlan.deleteMany({});

    // Seed concepts
    const concepts = await Concept.insertMany(
      DSA_CONCEPTS.map(c => ({ ...c, questions: [] }))
    );
    console.log(`Seeded ${concepts.length} DSA concepts`);

    // Create or find a demo user
    let demoUser = await User.findOne({ email: 'demo@studyos.com' });
    if (!demoUser) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('demo123', salt);
      demoUser = await User.create({
        name: 'Demo User',
        email: 'demo@studyos.com',
        hashedPassword,
        targetRole: 'SDE',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      });
      console.log('Created demo user: demo@studyos.com / demo123');
    }

    // Seed sample study plan tasks
    const today = new Date();
    const sampleTasks = [
      {
        userId: demoUser._id,
        date: today,
        topic: 'Arrays',
        taskType: 'learn',
        problemCount: 5,
        difficulty: 1,
        completed: false
      },
      {
        userId: demoUser._id,
        date: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        topic: 'Arrays',
        taskType: 'practice',
        problemCount: 8,
        difficulty: 1,
        completed: false
      },
      {
        userId: demoUser._id,
        date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        topic: 'Strings',
        taskType: 'learn',
        problemCount: 5,
        difficulty: 1,
        completed: false
      }
    ];

    await StudyPlan.insertMany(sampleTasks);
    console.log(`Seeded ${sampleTasks.length} sample study plan tasks`);

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
