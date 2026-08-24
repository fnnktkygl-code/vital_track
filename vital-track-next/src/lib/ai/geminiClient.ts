import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Dual-Tier FinOps Gemini Failover Engine
 * Priorité 1 : GEMINI_API_KEY_FREE (500 RPD à 0,00 €)
 * Priorité 2 : Basculement transparent sur GEMINI_API_KEY_PAID (Tier 1 Paid) en cas de 429/503
 * Priorité 0 : Clé personnalisée passée dans les en-têtes (x-gemini-key)
 */

export interface ModelTierConfig {
  primaryModel: string;
  fallbackModels: string[];
}

export const AI_FEATURE_MODELS: Record<string, ModelTierConfig> = {
  chat: {
    primaryModel: 'gemini-3.6-flash',
    fallbackModels: ['gemini-3.7-flash', 'gemini-3.5-flash-lite'],
  },
  foodSearch: {
    primaryModel: 'gemini-3.7-flash',
    fallbackModels: ['gemini-3.6-flash', 'gemini-3.5-flash-lite'],
  },
  vision: {
    primaryModel: 'gemini-3.7-flash',
    fallbackModels: ['gemini-3.6-flash', 'gemini-3.5-flash-lite'],
  },
  deepSearch: {
    primaryModel: 'gemini-3.7-flash',
    fallbackModels: ['gemini-3.6-flash', 'gemini-3.5-flash-lite'],
  },
  greeting: {
    primaryModel: 'gemini-3.5-flash-lite',
    fallbackModels: ['gemini-3.6-flash'],
  },
};

function getApiKeys(customKey?: string): string[] {
  const keys: string[] = [];
  if (customKey && customKey.trim().length > 10) {
    keys.push(customKey.trim());
  }
  const freeKey = process.env.GEMINI_API_KEY_FREE || process.env.GEMINI_FREE_KEY;
  if (freeKey && freeKey.trim()) {
    keys.push(freeKey.trim());
  }
  const paidKey = process.env.GEMINI_API_KEY_PAID || process.env.GEMINI_PAID_KEY || process.env.GEMINI_API_KEY;
  if (paidKey && paidKey.trim() && !keys.includes(paidKey.trim())) {
    keys.push(paidKey.trim());
  }
  return keys;
}

export async function executeGeminiWithFailover<T>(
  feature: 'chat' | 'foodSearch' | 'vision' | 'deepSearch' | 'greeting',
  customKey: string | undefined,
  executor: (ai: GoogleGenerativeAI, modelName: string) => Promise<T>
): Promise<{ result: T; modelUsed: string; isFallback: boolean }> {
  const keys = getApiKeys(customKey);
  if (keys.length === 0) {
    throw new Error('Aucune clé API Google Gemini disponible. Veuillez configurer GEMINI_API_KEY_FREE ou fournir une clé.');
  }

  const modelConfig = AI_FEATURE_MODELS[feature];
  const modelList = [modelConfig.primaryModel, ...modelConfig.fallbackModels];

  let lastError: Error | null = null;

  for (const apiKey of keys) {
    const ai = new GoogleGenerativeAI(apiKey);

    for (const modelName of modelList) {
      try {
        const result = await executor(ai, modelName);
        return {
          result,
          modelUsed: modelName,
          isFallback: modelName !== modelConfig.primaryModel,
        };
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        const isQuotaOrRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('503');
        
        console.warn(`[FinOps Gemini] Échec sur modèle ${modelName} (Erreur: ${msg.slice(0, 100)}). Tentative de secours...`);
        if (!isQuotaOrRateLimit && !msg.includes('not found')) {
          // If fatal syntax/format error, rethrow
          break;
        }
      }
    }
  }

  throw lastError || new Error('Échec de la cascade d\'appels Gemini AI.');
}
