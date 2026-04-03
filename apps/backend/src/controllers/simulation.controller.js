import { Attempt } from '../models/attempt.model.js';
import { generateSimulationMcqs } from '../services/cloudflare.service.js';

// POST /api/simulations/start
export const startSimulation = async (req, res) => {
  try {
    const { moduleCode } = req.body;

    if (!moduleCode || !['DS', 'SE', 'QA', 'BA', 'PM'].includes(moduleCode)) {
      return res.status(400).json({ message: 'Valid moduleCode required' });
    }

    // Check if user already has an in-progress attempt for this module
    const existingAttempt = await Attempt.findOne({
      userId: req.user.userId,
      moduleCode,
      status: 'IN_PROGRESS'
    });

    if (existingAttempt) {
      return res.status(409).json({ message: 'You already have an in-progress simulation for this module' });
    }

    // Generate MCQs
    const difficultyMix = 'easy=5, medium=7, hard=3'; // can be parameterized later
    const mcqData = await generateSimulationMcqs({
      moduleCode,
      total: 15,
      timeLimitMinutes: 15,
      difficultyMix
    });

    // Create attempt
    const timeLimitSeconds = 15 * 60;
    const attempt = await Attempt.create({
      userId: req.user.userId,
      moduleCode,
      timeLimitSeconds,
      questions: mcqData.questions // store full questions
    });

    // Return to client without correctIndex and explanation
    const clientQuestions = mcqData.questions.map(q => ({
      id: q.id,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options
    }));

    res.status(201).json({
      attemptId: attempt._id,
      startedAt: attempt.startedAt,
      expiresAt: new Date(attempt.startedAt.getTime() + timeLimitSeconds * 1000),
      questions: clientQuestions
    });

  } catch (error) {
    console.error('Start simulation error:', error);
    res.status(500).json({ message: 'Failed to start simulation', error: error.message });
  }
};

// POST /api/simulations/:attemptId/submit
export const submitSimulation = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body; // [{ id: "q1", selectedIndex: 2 }, ...]

    if (!Array.isArray(answers) || answers.length !== 15) {
      return res.status(400).json({ message: 'Exactly 15 answers required' });
    }

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (attempt.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not your attempt' });
    }

    if (attempt.status === 'SUBMITTED') {
      return res.status(409).json({ message: 'Simulation already submitted' });
    }

    // Check time limit (optional: allow late submit)
    const now = new Date();
    const timeTaken = Math.floor((now - attempt.startedAt) / 1000);
    const isLate = timeTaken > attempt.timeLimitSeconds;

    // Grade answers
    const results = [];
    let correctCount = 0;
    const difficultyBreakdown = { EASY: 0, MEDIUM: 0, HARD: 0 };

    for (const answer of answers) {
      const question = attempt.questions.find(q => q.id === answer.id);
      if (!question) {
        return res.status(400).json({ message: `Invalid question id: ${answer.id}` });
      }

      const isCorrect = answer.selectedIndex === question.correctIndex;
      if (isCorrect) {
        correctCount++;
        difficultyBreakdown[question.difficulty]++;
      }

      results.push({
        id: answer.id,
        selectedIndex: answer.selectedIndex,
        isCorrect,
        explanation: question.explanation // already stored
      });
    }

    const score = correctCount;
    const percentage = Math.round((correctCount / 15) * 100);

    // Update attempt
    attempt.submittedAt = now;
    attempt.timeTakenSeconds = timeTaken;
    attempt.score = score;
    attempt.percentage = percentage;
    attempt.answers = answers;
    attempt.results = results;
    attempt.status = 'SUBMITTED';
    await attempt.save();

    res.json({
      score,
      percentage,
      timeTakenSeconds: timeTaken,
      isLate,
      difficultyBreakdown,
      results: results.map(r => ({
        id: r.id,
        selectedIndex: r.selectedIndex,
        isCorrect: r.isCorrect,
        explanation: r.explanation,
        question: attempt.questions.find(q => q.id === r.id).question,
        options: attempt.questions.find(q => q.id === r.id).options,
        correctIndex: attempt.questions.find(q => q.id === r.id).correctIndex
      }))
    });

  } catch (error) {
    console.error('Submit simulation error:', error);
    res.status(500).json({ message: 'Failed to submit simulation', error: error.message });
  }
};