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

export const generateSimulationMcqs = async ({ moduleCode, total = 15, timeLimitMinutes = 15, difficultyMix }) => {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      throw new Error('Cloudflare credentials not configured');
    }

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
    throw new Error(`Failed to generate MCQs with Cloudflare Workers AI: ${error.message}`);
  }
};