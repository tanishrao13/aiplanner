import mongoose from 'mongoose';

const conceptSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  description: { type: String, required: true },
  questions: [{
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String },
    timeComplexity: { type: String },
    hint: { type: String },
    difficulty: { type: Number, required: true, min: 1, max: 5 }
  }]
}, { timestamps: true });

export const Concept = mongoose.model('Concept', conceptSchema);
