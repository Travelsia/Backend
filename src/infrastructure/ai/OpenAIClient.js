// src/infrastructure/ai/openaiClient.js
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY es requerido');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
