// Cloudflare Workers AI integration for MCQ generation

const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4/accounts';

// Module descriptions for better context
const MODULE_DESCRIPTIONS = {
  DS: "Data Science - including statistics, machine learning, data analysis, Python, R, SQL, and data visualization",
  SE: "Software Engineering - including programming, algorithms, data structures, design patterns, testing, and development methodologies",
  QA: "Quality Assurance - including testing methodologies, automation, bug tracking, quality standards, and software validation",
  BA: "Business Analysis - including requirements gathering, stakeholder management, process modeling, and business intelligence",
  PM: "Project Management - including agile methodologies, risk management, resource planning, and project lifecycle"
};

// Mock MCQ data for development when Cloudflare credentials are not available
const MOCK_QUESTIONS = {
  DS: [
    { question: "What is the primary purpose of exploratory data analysis (EDA)?", options: ["To predict future values", "To understand data structure and patterns", "To clean raw data", "To build machine learning models"], correctIndex: 1, explanation: "EDA helps you understand the structure, patterns, and relationships in your data before building models." },
    { question: "Which algorithm is typically used for unsupervised learning?", options: ["Linear Regression", "Decision Trees", "K-Means Clustering", "Logistic Regression"], correctIndex: 2, explanation: "K-Means is an unsupervised clustering algorithm used to group similar data points." },
    { question: "What does SQL stand for?", options: ["Structured Query Language", "Simple Query Logic", "Sequential Query Language", "Standard Quick Learning"], correctIndex: 0, explanation: "SQL stands for Structured Query Language, used for managing databases." },
    { question: "In Python, which library is most commonly used for numerical computing?", options: ["Pandas", "Matplotlib", "NumPy", "Scikit-learn"], correctIndex: 2, explanation: "NumPy is the fundamental library for numerical and array computing in Python." },
    { question: "What is the difference between correlation and causation?", options: ["They are the same thing", "Correlation implies causation", "Causation implies correlation but not vice versa", "They are completely unrelated"], correctIndex: 2, explanation: "Just because two variables are correlated doesn't mean one causes the other." }
  ],
  SE: [
    { question: "Which design pattern is used to ensure a class has only one instance?", options: ["Factory Pattern", "Singleton Pattern", "Observer Pattern", "Strategy Pattern"], correctIndex: 1, explanation: "The Singleton pattern restricts a class to have only one instance and provides global access to it." },
    { question: "What is the main benefit of using version control systems like Git?", options: ["Faster code execution", "Tracking changes and collaboration", "Automatic bug fixing", "Reducing memory usage"], correctIndex: 1, explanation: "Git allows teams to track changes, collaborate, and maintain code history effectively." },
    { question: "In OOP, what does encapsulation mean?", options: ["Breaking code into small functions", "Bundling data and methods together while hiding internal details", "Creating parent-child relationships", "Using loops effectively"], correctIndex: 1, explanation: "Encapsulation hides internal implementation details and exposes only necessary interfaces." },
    { question: "What is a key benefit of unit testing?", options: ["Makes code run faster", "Catches bugs early and ensures code reliability", "Reduces code complexity", "Eliminates the need for other tests"], correctIndex: 1, explanation: "Unit tests verify that individual components work correctly, catching bugs early in development." },
    { question: "Which HTTP method is used to retrieve data without modifying it?", options: ["POST", "PUT", "DELETE", "GET"], correctIndex: 3, explanation: "GET is the HTTP method used to request data from a server without making changes." }
  ],
  QA: [
    { question: "What is the difference between testing and quality assurance?", options: ["They are the same", "Testing finds bugs; QA ensures overall quality", "QA is for backend; testing is for frontend", "Testing is manual only"], correctIndex: 1, explanation: "Testing is the process of finding bugs; QA is a broader discipline ensuring overall product quality." },
    { question: "What is a regression test?", options: ["Testing a feature for the first time", "Testing that previously working features still work after changes", "Testing user behavior", "Testing performance"], correctIndex: 1, explanation: "Regression testing ensures that new changes don't break existing functionality." },
    { question: "Which type of testing requires no knowledge of internal code structure?", options: ["White-box testing", "Black-box testing", "Gray-box testing", "Unit testing"], correctIndex: 1, explanation: "Black-box testing treats the software as a black box, testing only inputs and outputs." },
    { question: "What is a test case?", options: ["A bug report", "A specific scenario with inputs, expected outputs, and steps to verify", "A code review", "A deployment plan"], correctIndex: 1, explanation: "A test case defines inputs, expected outcomes, and steps to verify software behavior." },
    { question: "What is the purpose of automation in testing?", options: ["Replace all manual testing", "Run repetitive tests efficiently and quickly", "Eliminate the need for QA teams", "Make testing more expensive"], correctIndex: 1, explanation: "Test automation runs repetitive test cases quickly and efficiently, improving productivity." }
  ],
  BA: [
    { question: "What is a requirement specification document used for?", options: ["Project timeline", "Defining what the system should do", "Code implementation", "User feedback"], correctIndex: 1, explanation: "Requirements specifications document what the system must do and serve as a blueprint for development." },
    { question: "Which technique is used to gather requirements from stakeholders?", options: ["Code review", "Interviews and workshops", "Unit testing", "Performance monitoring"], correctIndex: 1, explanation: "Interviews and workshops are effective techniques for gathering requirements from stakeholders." },
    { question: "What does SMART goals stand for?", options: ["Simple Marketing Analysis Report", "Specific, Measurable, Achievable, Relevant, Time-bound", "System Maintenance And Review Team", "Strategic Market Analysis"], correctIndex: 1, explanation: "SMART is a framework for setting effective goals that are Specific, Measurable, Achievable, Relevant, and Time-bound." },
    { question: "What is business process modeling used for?", options: ["Writing code", "Visualizing and analyzing current or future business processes", "Testing software", "Managing budgets"], correctIndex: 1, explanation: "Business process modeling helps visualize workflows and identify improvement opportunities." },
    { question: "What is stakeholder analysis?", options: ["Analyzing stock market data", "Identifying and understanding the interests of people affected by a project", "Writing project documentation", "Estimating project cost"], correctIndex: 1, explanation: "Stakeholder analysis identifies who is affected by a project and understands their needs and concerns." }
  ],
  PM: [
    { question: "What is the main difference between Agile and Waterfall?", options: ["Agile is more expensive", "Waterfall is iterative; Agile is linear", "Agile is iterative; Waterfall is linear", "They are the same"], correctIndex: 2, explanation: "Waterfall follows a linear, sequential approach while Agile uses iterative development cycles." },
    { question: "What is a sprint in Agile methodology?", options: ["A type of running exercise", "A fixed time period for delivering incremental value", "A project phase", "A team meeting"], correctIndex: 1, explanation: "A sprint is a fixed time box (usually 1-4 weeks) where the team completes a set of work items." },
    { question: "What is the purpose of a project charter?", options: ["A legal document", "To authorize the project and define its high-level objectives", "To list team members", "To track budget"], correctIndex: 1, explanation: "A project charter formally authorizes a project and establishes its objectives and constraints." },
    { question: "How is project risk management performed?", options: ["Ignoring potential problems", "Identifying, analyzing, and mitigating risks", "Accepting all risks", "Only addressing risks that occur"], correctIndex: 1, explanation: "Risk management involves identifying potential problems early and developing mitigation strategies." },
    { question: "What is a critical path in project management?", options: ["The easiest path to completion", "The longest sequence of dependent activities", "The shortest tasks in the project", "Optional activities"], correctIndex: 1, explanation: "The critical path is the longest sequence of dependent tasks that determines the project timeline." }
  ]
};

// Generate a mock MCQ with realistic variation
const generateMockMcq = (moduleCode, total, difficultyMix) => {
  const questions = [];
  const moduleQuestions = MOCK_QUESTIONS[moduleCode] || MOCK_QUESTIONS.SE;
  
  // Parse difficulty mix (e.g., "easy=5, medium=7, hard=3")
  const difficultyCount = { EASY: 0, MEDIUM: 0, HARD: 0 };
  if (difficultyMix) {
    const parts = difficultyMix.split(',').map(p => p.trim());
    parts.forEach(part => {
      const [difficulty, count] = part.split('=').map(s => s.trim());
      const key = difficulty.toUpperCase();
      if (key in difficultyCount) {
        difficultyCount[key] = parseInt(count) || 0;
      }
    });
  } else {
    // Default distribution
    const easy = Math.ceil(total * 0.33);
    const medium = Math.ceil(total * 0.47);
    const hard = total - easy - medium;
    difficultyCount.EASY = easy;
    difficultyCount.MEDIUM = medium;
    difficultyCount.HARD = hard;
  }

  const difficultySequence = [];
  Object.entries(difficultyCount).forEach(([difficulty, count]) => {
    for (let i = 0; i < count; i++) {
      difficultySequence.push(difficulty);
    }
  });

  // Shuffle difficulty sequence
  for (let i = difficultySequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [difficultySequence[i], difficultySequence[j]] = [difficultySequence[j], difficultySequence[i]];
  }

  // Generate questions with variations from mock data
  for (let i = 0; i < total; i++) {
    const baseQuestion = moduleQuestions[i % moduleQuestions.length];
    const questionId = `q${i + 1}`;
    const difficulty = difficultySequence[i] || 'MEDIUM';

    // Shuffle options while tracking correct index
    const optionsWithIndex = baseQuestion.options.map((opt, idx) => ({ opt, idx }));
    for (let j = optionsWithIndex.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [optionsWithIndex[j], optionsWithIndex[k]] = [optionsWithIndex[k], optionsWithIndex[j]];
    }

    const correctIndex = optionsWithIndex.findIndex(item => item.idx === baseQuestion.correctIndex);
    const options = optionsWithIndex.map(item => item.opt);

    questions.push({
      id: questionId,
      difficulty,
      question: baseQuestion.question,
      options,
      correctIndex,
      explanation: baseQuestion.explanation
    });
  }

  return {
    moduleCode,
    total,
    timeLimitMinutes: 15,
    questions
  };
};

export const generateSimulationMcqs = async ({ moduleCode, total = 15, timeLimitMinutes = 15, difficultyMix }) => {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    // Use mock implementation if credentials are not configured
    if (!accountId || !apiToken) {
      console.log('Using mock MCQ generation (Cloudflare credentials not configured)');
      return generateMockMcq(moduleCode, total, difficultyMix);
    }

    // Otherwise use Cloudflare API for production
    const moduleDescription = MODULE_DESCRIPTIONS[moduleCode] || "General technical knowledge";

    const prompt = `You are an expert technical interviewer creating interview questions for ${moduleDescription}.

Generate exactly ${total} multiple-choice questions (MCQs) for an interview simulation. Each question must be relevant to real job interviews in this field.

Return ONLY valid JSON with this exact structure:
{
  "moduleCode": "${moduleCode}",
  "total": ${total},
  "timeLimitMinutes": ${timeLimitMinutes},
  "questions": [
    {
      "id": "q1",
      "difficulty": "EASY",
      "question": "Clear, concise interview question",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Brief explanation why the answer is correct"
    }
  ]
}

Requirements:
- Exactly ${total} questions
- Difficulty distribution: ${difficultyMix || 'mix of EASY, MEDIUM, HARD'}
- Questions must be interview-appropriate and professional
- Each question must have exactly 4 options (A, B, C, D)
- correctIndex must be 0-3 pointing to the correct option
- Explanations should be 1-2 sentences, helpful for learning
- Questions should test practical knowledge and problem-solving
- Avoid theoretical or overly academic questions
- Ensure questions are original and not copied from existing sources

Focus on practical, job-relevant questions that would appear in real technical interviews.`;

    const response = await fetch(`${CLOUDFLARE_API_URL}/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.result.response;

    // Clean the response (remove markdown code blocks if present)
    const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();

    // Parse JSON
    const parsed = JSON.parse(cleanedText);

    // Validate structure
    if (parsed.moduleCode !== moduleCode || parsed.total !== total || parsed.timeLimitMinutes !== timeLimitMinutes) {
      throw new Error('Invalid JSON structure: metadata mismatch');
    }

    if (!Array.isArray(parsed.questions) || parsed.questions.length !== total) {
      throw new Error('Invalid JSON: questions array incorrect length');
    }

    // Validate each question
    for (let i = 0; i < parsed.questions.length; i++) {
      const q = parsed.questions[i];
      if (!q.id || typeof q.id !== 'string') throw new Error(`Question ${i}: invalid id`);
      if (!['EASY', 'MEDIUM', 'HARD'].includes(q.difficulty)) throw new Error(`Question ${i}: invalid difficulty`);
      if (!q.question || typeof q.question !== 'string') throw new Error(`Question ${i}: invalid question`);
      if (!Array.isArray(q.options) || q.options.length !== 4) throw new Error(`Question ${i}: invalid options`);
      if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) throw new Error(`Question ${i}: invalid correctIndex`);
      if (!q.explanation || typeof q.explanation !== 'string') throw new Error(`Question ${i}: invalid explanation`);

      // Check for duplicate options
      const uniqueOptions = new Set(q.options);
      if (uniqueOptions.size !== 4) throw new Error(`Question ${i}: duplicate options`);
    }

    return parsed;

  } catch (error) {
    throw new Error(`Failed to generate MCQs: ${error.message}`);
  }
};