import mongoose from 'mongoose';

const codingAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problem: {
    title: String,
    description: String,
    difficulty: String,
    language: { type: String, default: 'javascript' },
    starterCode: String,
    testCases: [{
      input: String,
      expectedOutput: String,
      hidden: { type: Boolean, default: false }
    }]
  },
  solution: String,
  passedTests: Number,
  totalTests: Number,
  score: Number, // 0-100
  feedback: String,
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('CodingAttempt', codingAttemptSchema);