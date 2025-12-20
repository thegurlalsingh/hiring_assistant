import CodingAttempt from '../models/coding.js';
import { generateCodingProblem } from '../services/generate_questions.js';
import { executeCode } from '../services/execute_code.js';
import { assessSolution } from '../services/assessAnswer.js';
import User from '../models/User.js';

export const startCodingRound = async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);

  try {
    const problem = await generateCodingProblem(user);

    const attempt = await CodingAttempt.create({
      userId,
      problem,
      completed: false
    });

    res.json({
      success: true,
      problem,
      attemptId: attempt._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitCodingSolution = async (req, res) => {
  const { attemptId, solution } = req.body;
  const userId = req.user.id;

  try {
    const attempt = await CodingAttempt.findOne({ _id: attemptId, userId });
    if (!attempt || attempt.completed) {
      return res.status(400).json({ success: false, message: "Invalid attempt" });
    }

    const execResult = await executeCode(solution, attempt.problem.testCases);
    const aiAssessment = await assessSolution(attempt.problem, solution, execResult);

    attempt.solution = solution;
    attempt.passedTests = execResult.passed;
    attempt.totalTests = execResult.total;
    attempt.score = aiAssessment.score;
    attempt.feedback = aiAssessment.feedback;
    attempt.completed = true;
    await attempt.save();

    await User.findByIdAndUpdate(userId, { currentStep: 'completed' });

    res.json({
      success: true,
      score: aiAssessment.score,
      passed: execResult.passed,
      total: execResult.total,
      feedback: aiAssessment.feedback
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};