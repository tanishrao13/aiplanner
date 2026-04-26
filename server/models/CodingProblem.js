import mongoose from 'mongoose';

const codingProblemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  examples: [{
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String }
  }],
  constraints: [{ type: String }],
  starterCode: {
    javascript: { type: String, required: true },
    python: { type: String, required: true }
  },
  testCases: [{
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    hidden: { type: Boolean, default: false }
  }],
  hints: [{ type: String }],
  topic: { type: String, required: true },
  difficulty: { type: Number, required: true, min: 1, max: 5 },
  timeComplexity: { type: String },
  spaceComplexity: { type: String }
}, { timestamps: true });

export const CodingProblem = mongoose.model('CodingProblem', codingProblemSchema);
