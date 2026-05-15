import { getDb } from '../db';

const FALLBACK_KEY = process.env.GEMINI_API_KEY || '';

export async function getGeminiApiKey(): Promise<string> {
  try {
    const db = await getDb();
    const setting = await db.appSetting.findUnique({ where: { key: 'GEMINI_API_KEY' } });
    if (setting?.value) return setting.value;
  } catch {
    // DB unavailable — fall back to env
  }
  return FALLBACK_KEY;
}
