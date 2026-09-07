import OpenAI from 'openai';
import { config } from '../config.js';

// Groq: free tier + fast inference, which fits the PRD's latency NFR of
// <=1.0s median time-to-first-response for a live voice call.
export const llm = new OpenAI({ apiKey: config.groqApiKey, baseURL: 'https://api.groq.com/openai/v1' });

export const MODEL = 'llama-3.3-70b-versatile';
