
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

// Import shared config (assuming relative path from scripts/utils)
import { MODELS, WATERFALL_CHAINS, TaskTier, Provider } from '../../src/lib/routingConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.join(__dirname, 'quota-state.json');

interface UsageStats {
  requests: number;
  lastReset: number;
}

class NodeRouter {
  private static instance: NodeRouter;
  private keyIndices: Record<Provider, number> = { groq: 0, gemini: 0 };
  private usage: Record<string, UsageStats> = {};

  private groqKeys: string[] = [];
  private geminiKeys: string[] = [];

  private constructor() {
    this.loadKeys();
    this.loadUsage();
  }

  public static getInstance(): NodeRouter {
    if (!NodeRouter.instance) {
      NodeRouter.instance = new NodeRouter();
    }
    return NodeRouter.instance;
  }

  private loadKeys() {
    this.groqKeys = [
      process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY,
      process.env.VITE_GROQ_API_KEY_2,
      process.env.VITE_GROQ_API_KEY_3,
      process.env.VITE_GROQ_API_KEY_4,
      process.env.VITE_GROQ_API_KEY_5,
      process.env.VITE_GROQ_API_KEY_6,
    ].filter(Boolean) as string[];

    this.geminiKeys = [
      process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
      process.env.VITE_GEMINI_API_KEY_2,
      process.env.VITE_GEMINI_API_KEY_3,
      process.env.VITE_GEMINI_API_KEY_4,
      process.env.VITE_GEMINI_API_KEY_5,
      process.env.VITE_GEMINI_API_KEY_6,
    ].filter(Boolean) as string[];
  }

  private loadUsage() {
    if (fs.existsSync(STATE_FILE)) {
      try {
        this.usage = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      } catch (e) { this.usage = {}; }
    }
  }

  private saveUsage() {
    fs.writeFileSync(STATE_FILE, JSON.stringify(this.usage, null, 2));
  }

  private checkDailyLimit(modelId: string, keyIndex: number): boolean {
    const spec = MODELS[modelId];
    if (!spec) return true;

    const key = `${modelId}_${keyIndex}`;
    const stats = this.usage[key];
    if (!stats) return true;

    if (Date.now() - stats.lastReset > 24 * 60 * 60 * 1000) {
      stats.requests = 0;
      stats.lastReset = Date.now();
      return true;
    }

    return stats.requests < (spec.rpd * 0.85);
  }

  private incrementUsage(modelId: string, keyIndex: number) {
    const key = `${modelId}_${keyIndex}`;
    if (!this.usage[key]) {
      this.usage[key] = { requests: 0, lastReset: Date.now() };
    }
    this.usage[key].requests++;
    this.saveUsage();
  }

  public async route(
    messages: { role: string; content: string }[],
    tier: TaskTier = 'T3',
    options: any = {}
  ): Promise<any> {
    const chain = WATERFALL_CHAINS[tier];
    let lastError: any = null;

    for (const modelId of chain) {
      const spec = MODELS[modelId];
      if (!spec) continue;

      const provider = spec.provider;
      const keys = provider === 'groq' ? this.groqKeys : this.geminiKeys;

      for (let k = 0; k < keys.length; k++) {
        const index = (this.keyIndices[provider] + k) % keys.length;
        if (!this.checkDailyLimit(modelId, index)) continue;

        try {
          if (provider === 'groq') {
            const client = new Groq({ apiKey: keys[index] });
            const completion = await client.chat.completions.create({
              model: modelId,
              messages: messages as any,
              temperature: options.temperature ?? 0.7,
              max_tokens: options.max_tokens ?? 2000,
              response_format: options.jsonMode ? { type: 'json_object' } : undefined
            });
            this.incrementUsage(modelId, index);
            this.keyIndices[provider] = (index + 1) % keys.length;
            return completion.choices[0]?.message?.content;
          } else {
            const genAI = new GoogleGenerativeAI(keys[index]);
            const model = genAI.getGenerativeModel({
              model: modelId,
              generationConfig: {
                temperature: options.temperature ?? 0.7,
                maxOutputTokens: options.max_tokens ?? 2500,
                responseMimeType: options.jsonMode ? "application/json" : undefined
              }
            });
            const system = messages.find(m => m.role === 'system')?.content || '';
            const user = messages.find(m => m.role === 'user')?.content || '';
            const result = await model.generateContent(`${system}\n\n${user}`);
            const text = result.response.text();
            this.incrementUsage(modelId, index);
            this.keyIndices[provider] = (index + 1) % keys.length;
            return text;
          }
        } catch (error: any) {
          lastError = error;
          console.warn(`[NodeRouter] Task ${tier} failed with ${modelId} on key ${index}: ${error.message?.slice(0, 80)}`);
          continue;
        }
      }
    }
    throw lastError || new Error(`All models in tier ${tier} failed for script execution.`);
  }
}

export const nodeRouter = NodeRouter.getInstance();
