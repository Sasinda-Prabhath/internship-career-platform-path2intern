import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { simulationApi } from '../services/api';

export default function SimulationRunner() {
  const navigate = useNavigate();
  const [moduleCode, setModuleCode] = useState('');
  const [attempt, setAttempt] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const modules = [
    { code: 'DS', name: 'Data Science' },
    { code: 'SE', name: 'Software Engineering' },
    { code: 'QA', name: 'Quality Assurance' },
    { code: 'BA', name: 'Business Analysis' },
    { code: 'PM', name: 'Project Management' }
  ];

  useEffect(() => {
    if (attempt && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [attempt, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    if (!moduleCode) return;
    setLoading(true);
    try {
      const response = await simulationApi.start(moduleCode);
      setAttempt(response.data);
      setTimeLeft(15 * 60); // 15 minutes
      setAnswers({});
      setCurrentQuestionIndex(0);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, selectedIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < attempt.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const answersArray = Object.entries(answers).map(([id, selectedIndex]) => ({
      id,
      selectedIndex
    }));

    if (answersArray.length !== 15) {
      alert('Please answer all questions');
      return;
    }

    setLoading(true);
    try {
      const response = await simulationApi.submit(attempt.attemptId, answersArray);
      setResults(response.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setAttempt(null);
    setResults(null);
    setModuleCode('');
    setAnswers({});
    setCurrentQuestionIndex(0);
  };

  if (results) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center mb-8">Simulation Results</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">{results.score}/15</div>
                <div className="text-gray-600">Score</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">{results.percentage}%</div>
                <div className="text-gray-600">Percentage</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600">{Math.floor(results.timeTakenSeconds / 60)}:{(results.timeTakenSeconds % 60).toString().padStart(2, '0')}</div>
                <div className="text-gray-600">Time Taken</div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Difficulty Breakdown</h2>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(results.difficultyBreakdown).map(([difficulty, count]) => (
                  <div key={difficulty} className="text-center p-4 bg-gray-100 rounded">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-gray-600">{difficulty}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Question Review</h2>
              <div className="space-y-6">
                {results.results.map((result, index) => (
                  <div key={result.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">Question {index + 1}</h3>
                      <span className={`px-2 py-1 rounded text-sm ${result.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    <p className="mb-3">{result.question}</p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {result.options.map((option, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded border ${
                            i === result.correctIndex ? 'border-green-500 bg-green-50' :
                            i === result.selectedIndex && !result.isCorrect ? 'border-red-500 bg-red-50' :
                            'border-gray-300'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}. {option}
                          {i === result.correctIndex && <span className="ml-2 text-green-600">✓</span>}
                          {i === result.selectedIndex && i !== result.correctIndex && <span className="ml-2 text-red-600">✗</span>}
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <strong>Explanation:</strong> {result.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleRetry}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Try Another Simulation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (attempt) {
    const currentQuestion = attempt.questions[currentQuestionIndex];
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">{modules.find(m => m.code === attempt.questions[0]?.moduleCode)?.name} Simulation</h1>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">{formatTime(timeLeft)}</div>
                <div className="text-sm text-gray-600">Time Remaining</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Question {currentQuestionIndex + 1} of 15</span>
                <span>Answered: {answeredCount}/15</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${((currentQuestionIndex + 1) / 15) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  currentQuestion.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                  currentQuestion.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              </div>
              <h2 className="text-xl font-semibold mb-6">{currentQuestion.question}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                    className={`p-4 text-left border-2 rounded-lg hover:border-blue-500 transition-colors ${
                      answers[currentQuestion.id] === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                Previous
              </button>

              {currentQuestionIndex < 14 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Simulation'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Start Simulation</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Module
          </label>
          <select
            value={moduleCode}
            onChange={(e) => setModuleCode(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a module...</option>
            {modules.map(module => (
              <option key={module.code} value={module.code}>
                {module.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Simulation Details</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 15 multiple-choice questions</li>
            <li>• 15 minutes time limit</li>
            <li>• Interview-focused questions</li>
            <li>• Instant results with explanations</li>
          </ul>
        </div>

        <button
          onClick={handleStart}
          disabled={!moduleCode || loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Starting...' : 'Start Simulation'}
        </button>
      </div>
    </div>
  );
}