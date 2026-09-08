import OpenAI from 'openai';
import { config } from '../config.js';

// Groq: free tier + fast inference, which fits the PRD's latency NFR of
// <=1.0s median time-to-first-response for a live voice call.
export const llm = new OpenAI({ apiKey: config.groqApiKey, baseURL: 'https://api.groq.com/openai/v1' });

// llama-3.3-70b-versatile was decommissioned by Groq; gpt-oss-120b is the
// current fast tool-calling model on Groq's hosted lineup.
export const MODEL = 'openai/gpt-oss-120b';
