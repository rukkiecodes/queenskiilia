import { Router, Request, Response } from 'express';
import { geminiGenerate } from '../gemini';

export const examRouter = Router();

const LEVEL_RUBRIC: Record<string, string> = {
  beginner:
    'fundamentals and core concepts — definitions, basic syntax/usage, common terminology.',
  intermediate:
    'practical application — combining concepts, debugging, best practices, common pitfalls.',
  advanced:
    'deep expertise — architecture, performance, edge cases, trade-offs, advanced patterns.',
};

const ALL_TYPES = ['single', 'multiple', 'boolean', 'short_answer', 'code'];

const QUESTIONS_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' }, // single|multiple|boolean|short_answer|code
          prompt: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctIndexes: { type: 'array', items: { type: 'integer' } },
          modelAnswer: { type: 'string' },
          gradingRubric: { type: 'string' },
          expectedLanguage: { type: 'string' },
          explanation: { type: 'string' },
          points: { type: 'integer' },
          diagramSuggestion: { type: 'string' },
        },
        required: ['type', 'prompt', 'explanation', 'points'],
      },
    },
  },
  required: ['questions'],
};

// POST /exam/generate-questions  { skill, level, count, types[] }
examRouter.post('/generate-questions', async (req: Request, res: Response) => {
  const { skill, level = 'beginner', count = 10, types } = req.body ?? {};
  if (!skill) {
    res.status(400).json({ error: 'skill is required' });
    return;
  }
  const n = Math.min(Math.max(parseInt(String(count), 10) || 10, 1), 20);
  const allowed = Array.isArray(types) && types.length ? types : ALL_TYPES;
  const rubric = LEVEL_RUBRIC[level] ?? LEVEL_RUBRIC.beginner;

  const system = [
    'You are an expert assessment author building a professional skill-certification exam.',
    'Write clear, unambiguous questions, each with exactly one defensible correct answer',
    '(or clearly-defined multiple answers for multi-select).',
    'For objective types give "options" (3-5) and 0-based "correctIndexes".',
    'For "short_answer"/"code" give a concise "modelAnswer" and a "gradingRubric"',
    '(how to award partial credit); for "code" also set "expectedLanguage".',
    'Always include a short "explanation" and integer "points" (1 easy, 2 medium, 3 hard).',
    'If a diagram or figure would strengthen a question, describe it in "diagramSuggestion".',
    'Return ONLY JSON matching the provided schema.',
  ].join(' ');

  const prompt =
    `Generate ${n} ${level}-level exam questions for the skill "${skill}". ` +
    `Difficulty focus: ${rubric} ` +
    `Use only these question types: ${allowed.join(', ')}. Vary the types across the set and avoid duplicates.`;

  try {
    const out = (await geminiGenerate<{ questions: unknown[] }>(prompt, {
      systemInstruction: system,
      responseSchema: QUESTIONS_SCHEMA,
      temperature: 0.8,
      maxOutputTokens: 8192,
    })) as { questions?: unknown[] };
    res.json({ questions: Array.isArray(out?.questions) ? out.questions : [] });
  } catch (err: any) {
    console.error('generate-questions error:', err?.message);
    res.status(502).json({ error: 'Question generation failed', detail: err?.message });
  }
});

const GRADE_SCHEMA = {
  type: 'object',
  properties: {
    awardedPoints: { type: 'number' },
    isCorrect: { type: 'boolean' },
    feedback: { type: 'string' },
  },
  required: ['awardedPoints', 'isCorrect', 'feedback'],
};

// POST /exam/grade-answer  { prompt, modelAnswer, rubric, language, answer, maxPoints }
examRouter.post('/grade-answer', async (req: Request, res: Response) => {
  const { prompt, modelAnswer, rubric, language, answer, maxPoints = 1 } = req.body ?? {};
  if (!prompt || answer == null || answer === '') {
    res.status(400).json({ error: 'prompt and answer are required' });
    return;
  }
  const max = Math.max(parseInt(String(maxPoints), 10) || 1, 1);

  const system =
    'You are a strict but fair exam grader. Grade the candidate answer against the model ' +
    'answer and rubric. Award points between 0 and the maximum (halves allowed). Keep ' +
    'feedback to one or two sentences. Return ONLY JSON matching the schema.';

  const gradePrompt = [
    `Question: ${prompt}`,
    language ? `Expected language: ${language}` : '',
    modelAnswer ? `Model answer: ${modelAnswer}` : '',
    rubric ? `Rubric: ${rubric}` : '',
    `Maximum points: ${max}`,
    `Candidate answer: ${answer}`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const out = (await geminiGenerate<{ awardedPoints: number; isCorrect: boolean; feedback: string }>(
      gradePrompt,
      {
        systemInstruction: system,
        responseSchema: GRADE_SCHEMA,
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    )) as { awardedPoints?: number; isCorrect?: boolean; feedback?: string };

    let pts = Number(out?.awardedPoints ?? 0);
    if (Number.isNaN(pts)) pts = 0;
    pts = Math.max(0, Math.min(pts, max));
    res.json({ awardedPoints: pts, isCorrect: !!out?.isCorrect, feedback: String(out?.feedback ?? '') });
  } catch (err: any) {
    console.error('grade-answer error:', err?.message);
    res.status(502).json({ error: 'Grading failed', detail: err?.message });
  }
});

const ANSWER_SCHEMA = {
  type: 'object',
  properties: { correctIndexes: { type: 'array', items: { type: 'integer' } } },
  required: ['correctIndexes'],
};

// POST /exam/answer-question  { type, prompt, options[] } → { correctIndexes }
// Determines the correct option(s) for an objective question (fills answer keys
// the generator occasionally omits).
examRouter.post('/answer-question', async (req: Request, res: Response) => {
  const { type, prompt, options } = req.body ?? {};
  if (!prompt || !Array.isArray(options) || options.length < 2) {
    res.status(400).json({ error: 'prompt and options[] are required' });
    return;
  }
  const system =
    'You are an exam answer key. Given a question and its options, return the 0-based ' +
    'index(es) of the correct option(s). For single-choice or true/false return exactly one; ' +
    'for multi-select return every correct option. Return ONLY JSON matching the schema.';
  const userPrompt =
    `Question type: ${type}\nQuestion: ${prompt}\nOptions:\n` +
    options.map((o: string, i: number) => `${i}: ${o}`).join('\n');

  try {
    const out = (await geminiGenerate(userPrompt, {
      systemInstruction: system,
      responseSchema: ANSWER_SCHEMA,
      temperature: 0.1,
      maxOutputTokens: 256,
    })) as { correctIndexes?: number[] };
    let idx = Array.isArray(out?.correctIndexes)
      ? out.correctIndexes.filter((i) => Number.isInteger(i) && i >= 0 && i < options.length)
      : [];
    if (type !== 'multiple') idx = idx.slice(0, 1);
    res.json({ correctIndexes: idx });
  } catch (err: any) {
    console.error('answer-question error:', err?.message);
    res.status(502).json({ error: 'Answer determination failed', detail: err?.message });
  }
});
