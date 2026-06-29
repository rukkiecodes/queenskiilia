import axios from 'axios';
import { env } from '../config/env';

// Server-to-server client for the ai-service (Gemini). The shared secret guards
// the ai-service's /exam/* routes; the API key never lives in this service.

const headers = () => ({
  'Content-Type': 'application/json',
  'x-internal-key': env.AI_INTERNAL_KEY,
});

export interface GeneratedQuestion {
  type: string;
  prompt: string;
  options?: string[];
  correctIndexes?: number[];
  modelAnswer?: string;
  gradingRubric?: string;
  expectedLanguage?: string;
  explanation?: string;
  points?: number;
  diagramSuggestion?: string;
}

export async function generateQuestions(
  skill: string,
  level: string,
  count: number,
  types?: string[],
): Promise<GeneratedQuestion[]> {
  const { data } = await axios.post(
    `${env.AI_SERVICE_URL}/exam/generate-questions`,
    { skill, level, count, types },
    { headers: headers(), timeout: 150_000 },
  );
  return Array.isArray(data?.questions) ? data.questions : [];
}

// Determine the correct option index(es) for an objective question whose answer
// key is missing (the generator occasionally omits it).
export async function answerQuestion(
  type: string,
  prompt: string,
  options: string[],
): Promise<number[]> {
  const { data } = await axios.post(
    `${env.AI_SERVICE_URL}/exam/answer-question`,
    { type, prompt, options },
    { headers: headers(), timeout: 60_000 },
  );
  return Array.isArray(data?.correctIndexes) ? data.correctIndexes : [];
}

export interface GradeResult {
  awardedPoints: number;
  isCorrect: boolean;
  feedback: string;
}

export async function gradeAnswer(params: {
  prompt: string;
  modelAnswer?: string;
  rubric?: string;
  language?: string;
  answer: string;
  maxPoints: number;
}): Promise<GradeResult> {
  const { data } = await axios.post(`${env.AI_SERVICE_URL}/exam/grade-answer`, params, {
    headers: headers(),
    timeout: 90_000,
  });
  return {
    awardedPoints: Number(data?.awardedPoints ?? 0),
    isCorrect: !!data?.isCorrect,
    feedback: String(data?.feedback ?? ''),
  };
}
