import mongoose from 'mongoose';

const studyPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  topic: { type: String, required: true },
  taskType: { type: String, enum: ['learn', 'practice', 'revise', 'mock'], required: true },
  problemCount: { type: Number, required: true },
  difficulty: { type: Number, required: true, min: 1, max: 5 },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

export const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);
