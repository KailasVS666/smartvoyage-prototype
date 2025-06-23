import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Itinerary } from "../types/itinerary";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing in environment variables.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateItinerary(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text;
  } catch (error: any) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate itinerary using Gemini.");
  }
}

export async function getItineraryFromAI(prompt: string): Promise<{ itinerary?: Itinerary; error?: string }> {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response.");
    const itinerary: Itinerary = JSON.parse(jsonMatch[0]);
    return { itinerary };
  } catch (error: any) {
    return { error: `Failed to parse AI response as JSON: ${error.message}` };
  }
}

export async function generateTextFromAI(prompt: string): Promise<{ content?: string; error?: string }> {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return { content: text };
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return { error: `Failed to generate content from AI: ${error.message}` };
  }
} 