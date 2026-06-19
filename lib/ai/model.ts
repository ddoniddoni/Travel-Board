import "server-only";
import { createOpenAI } from "@ai-sdk/openai";

export function hasOpenAIKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getTripPlannerModel() {
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return openai(process.env.OPENAI_MODEL ?? "gpt-4.1-mini");
}
