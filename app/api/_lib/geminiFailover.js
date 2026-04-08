import { GoogleGenAI } from "@google/genai";

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const RETRYABLE_ERROR_HINTS = [
  'rate limit',
  'quota',
  'resource exhausted',
  'overload',
  'unavailable',
  'timeout',
  'deadline',
  'internal'
];

export const getGeminiApiKeys = () => {
  const keyList = (process.env.GEMINI_API_KEYS || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);

  if (keyList.length > 0) {
    return keyList;
  }

  if (process.env.GEMINI_API_KEY?.trim()) {
    return [process.env.GEMINI_API_KEY.trim()];
  }

  return [];
};

const isRetryableGeminiError = (error) => {
  const status =
    error?.status ||
    error?.code ||
    error?.response?.status ||
    error?.cause?.status;

  if (RETRYABLE_STATUS_CODES.has(Number(status))) {
    return true;
  }

  const message = String(
    error?.message ||
    error?.error ||
    error?.cause?.message ||
    ''
  ).toLowerCase();

  return RETRYABLE_ERROR_HINTS.some((hint) => message.includes(hint));
};

export const generateGeminiContentWithFailover = async ({
  model,
  contents,
  config
}) => {
  const apiKeys = getGeminiApiKeys();

  if (apiKeys.length === 0) {
    throw new Error('Gemini API key not configured');
  }

  let lastError = null;

  for (let i = 0; i < apiKeys.length; i += 1) {
    const apiKey = apiKeys[i];

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({ model, contents, config });
      return { response, usedKeyIndex: i };
    } catch (error) {
      lastError = error;
      const canRetry = i < apiKeys.length - 1 && isRetryableGeminiError(error);

      if (!canRetry) {
        break;
      }

      console.warn(`Gemini key index ${i} failed. Retrying with next key.`);
    }
  }

  throw lastError || new Error('Gemini request failed');
};
