import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }], // 4 options
  correctIndex: { type: Number, required: true, min: 0, max: 3 },
  explanation: { type: String, required: true } // generated on submit
});

const resultSchema = new mongoose.Schema({
  id: { type: String, required: true },
  selectedIndex: { type: Number, required: true, min: 0, max: 3 },
  isCorrect: { type: Boolean, required: true },
  explanation: { type: String, required: true }
});

const attemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moduleCode: { type: String, required: true, enum: ['DS', 'SE', 'QA', 'BA', 'PM'] },
  startedAt: { type: Date, default: Date.now },
  timeLimitSeconds: { type: Number, required: true },
  submittedAt: { type: Date },
  timeTakenSeconds: { type: Number },
  score: { type: Number },
  percentage: { type: Number },
  questions: [questionSchema], // full questions with correctIndex and explanation
  answers: [{ // submitted answers
    id: { type: String, required: true },
    selectedIndex: { type: Number, required: true, min: 0, max: 3 }
  }],
  results: [resultSchema], // after grading
  status: { type: String, enum: ['IN_PROGRESS', 'SUBMITTED'], default: 'IN_PROGRESS' }
});

export const Attempt = mongoose.model('Attempt', attemptSchema);