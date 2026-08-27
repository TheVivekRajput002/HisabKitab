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
const HIGH_DEMAND_ERROR_HINTS = [
  'high demand',
  'spikes in demand',
  'temporarily unavailable',
  'currently experiencing high demand'
];
const MODEL_SELECTION_ERROR_HINTS = [
  'model not found',
  'unknown model',
  'unsupported model',
  'invalid model',
  'not a valid model',
  'is not found for api version',
  'no longer available',
  'not found'
];
const DEFAULT_LIGHT_MODEL_FALLBACKS = [
  'gemini-3.1-pro-preview',
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash'
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

const getConfiguredFallbackModels = () =>
  (process.env.GEMINI_FALLBACK_MODELS || '')
    .split(',')
    .map((modelName) => modelName.trim())
    .filter(Boolean);

const dedupeModelList = (models) => {
  const seen = new Set();

  return models.filter((modelName) => {
    const key = String(modelName || '').trim();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const isHighDemandGeminiError = (error) => {
  const status =
    error?.status ||
    error?.code ||
    error?.response?.status ||
    error?.cause?.status;

  if (Number(status) === 503) {
    return true;
  }

  const message = String(
    error?.message ||
    error?.error ||
    error?.cause?.message ||
    ''
  ).toLowerCase();

  return HIGH_DEMAND_ERROR_HINTS.some((hint) => message.includes(hint));
};

const isModelSelectionError = (error) => {
  const status =
    error?.status ||
    error?.code ||
    error?.response?.status ||
    error?.cause?.status ||
    error?.error?.code ||
    error?.error?.status;

  if (Number(status) === 404 || String(status).toUpperCase() === 'NOT_FOUND') {
    return true;
  }

  const message = String(
    error?.message ||
    error?.error?.message ||
    error?.error ||
    error?.cause?.message ||
    ''
  ).toLowerCase();

  return MODEL_SELECTION_ERROR_HINTS.some((hint) => message.includes(hint));
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
  fallbackModels,
  contents,
  config
}) => {
  const apiKeys = getGeminiApiKeys();

  if (apiKeys.length === 0) {
    throw new Error('Gemini API key not configured');
  }

  let lastError = null;
  const modelChain = dedupeModelList([
    model,
    ...(Array.isArray(fallbackModels) ? fallbackModels : []),
    ...getConfiguredFallbackModels(),
    ...DEFAULT_LIGHT_MODEL_FALLBACKS
  ]);

  for (let modelIndex = 0; modelIndex < modelChain.length; modelIndex += 1) {
    const currentModel = modelChain[modelIndex];

    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex += 1) {
      const apiKey = apiKeys[keyIndex];

      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: currentModel,
          contents,
          config
        });

        return { response, usedKeyIndex: keyIndex, usedModel: currentModel };
      } catch (error) {
        lastError = error;
        const canRetryWithNextKey =
          keyIndex < apiKeys.length - 1 && isRetryableGeminiError(error);

        if (canRetryWithNextKey) {
          console.warn(
            `Gemini model "${currentModel}" with key index ${keyIndex} failed. Retrying with next key.`
          );
          continue;
        }

        const canRetryWithFallbackModel =
          modelIndex < modelChain.length - 1 &&
          (
            isHighDemandGeminiError(error) ||
            isRetryableGeminiError(error) ||
            isModelSelectionError(error)
          );

        if (canRetryWithFallbackModel) {
          console.warn(
            `Gemini model "${currentModel}" failed (${error?.message || 'unknown error'}). Retrying with fallback model.`
          );
          break;
        }

        throw error;
      }
    }
  }

  throw lastError || new Error('Gemini request failed');
};
