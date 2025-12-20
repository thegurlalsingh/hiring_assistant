import MCQAttempt from '../models/mcq.js';
import User from '../models/User.js';
import { generateMCQs } from '../services/generate_questions.js';

export const startMCQ = async (req, res) => {
  const userId = req.user.id;

  try {
    let attempt = await MCQAttempt.findOne({ userId, completed: false });
    if (attempt) {
      return res.json({
        success: true,
        questions: attempt.questions,
        attemptId: attempt._id
      });
    }

    const user = await User.findById(userId);
    const context = {
      name: user.name,
      skills: user.skills || [],
      experienceYears: user.experience,
      appliedFor: user.appliedFor
    };

    const questions = await generateMCQs(context);

    attempt = await MCQAttempt.create({
      userId,
      questions
    });

    res.json({
      success: true,
      questions,
      attemptId: attempt._id
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitMCQ = async (req, res) => {
  const { attemptId, answers } = req.body;
  const userId = req.user.id;

  try {
    const attempt = await MCQAttempt.findOne({ _id: attemptId, userId });
    if (!attempt) {
      return res.status(404).json({ success: false, message: "Attempt not found" });
    }

    if (attempt.completed) {
      return res.json({ success: true, score: attempt.score, total: attempt.questions.length });
    }

    let score = 0;
    answers.forEach((ans, i) => {
      if (ans === attempt.questions[i].correct) score++;
    });

    attempt.answers = answers;
    attempt.score = score;
    attempt.completed = true;
    await attempt.save();

    await User.findByIdAndUpdate(userId, { currentStep: 'video' });

    res.json({
      success: true,
      score,
      total: attempt.questions.length,
      percentage: Math.round((score / attempt.questions.length) * 100)
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};