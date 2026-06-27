import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  SERVICE_NAME: optional('SERVICE_NAME', 'ai-service'),
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '4010'), 10),

  // Gemini (Google AI Studio)
  GEMINI_API_KEY: required('GEMINI_API_KEY'),
  GEMINI_MODEL: optional('GEMINI_MODEL', 'gemini-2.5-pro'),

  // Shared secret guarding /exam/* (other services send it as x-internal-key)
  INTERNAL_API_KEY: optional('INTERNAL_API_KEY', ''),
};
