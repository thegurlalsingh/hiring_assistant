import mongoose from 'mongoose';

const videoAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: String, required: true },
  videoUrl: { type: String, required: true },
  audioUrl: { type: String },
  transcript: { type: String },
  score: { type: Number }, // 0-100
  feedback: { type: String },
  confidence: { type: Number },
  relevance: { type: Number },
  clarity: { type: Number },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('VideoAttempt', videoAttemptSchema);