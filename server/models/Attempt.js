import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Concept' },
  topic: { type: String, required: true },
  difficulty: { type: Number, required: true, min: 1, max: 5 },
  accuracy: { type: Number, required: true, min: 0, max: 1 },
  timeTaken: { type: Number, required: true }, // in seconds
  expectedTime: { type: Number, required: true }, // in seconds
  correct: { type: Boolean, required: true }
}, { timestamps: true });

export const Attempt = mongoose.model('Attempt', attemptSchema);
