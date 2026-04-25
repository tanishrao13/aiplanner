import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  hashedPassword: { type: String, required: true },
  targetRole: { type: String, required: true },
  deadline: { type: Date, required: true }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
