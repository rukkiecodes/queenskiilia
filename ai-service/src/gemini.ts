import axios from 'axios';
import { env } from './config/env';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GeminiOptions {
  systemInstruction?: string;
  /** A Gemini responseSchema; when set, the call returns parsed JSON. */
  responseSchema?: object;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Single entry point for Gemini. With a responseSchema it returns parsed JSON
 * (structured output, application/json); otherwise it returns the raw text.
 * The API key never leaves this service.
 */
export async function geminiGenerate<T = unknown>(
  prompt: string,
  opts: GeminiOptions = {},
): Promise<T | string> {
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 8192,
      ...(opts.responseSchema
        ? { responseMimeType: 'application/json', responseSchema: opts.responseSchema }
        : {}),
    },
  };
  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }

  const { data } = await axios.post(
    `${BASE}/${env.GEMINI_MODEL}:generateContent`,
    body,
    {
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      timeout: 90_000,
    },
  );

  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('') ?? '';
  if (!text) throw new Error('Gemini returned an empty response');

  if (opts.responseSchema) {
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error('Gemini returned invalid JSON');
    }
  }
  return text;
}
