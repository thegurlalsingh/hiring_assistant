import mongoose from 'mongoose';

const mcqSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [{
    question: String,
    options: [String],
    correct: Number
  }],
  answers: [Number],  // user's selected indices
  score: Number,
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('MCQAttempt', mcqSchema);