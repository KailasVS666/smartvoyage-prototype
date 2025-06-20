import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is missing in environment variables.");
}

export async function generateItinerary(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error("Groq API error:", error.response?.data || error.message);
    throw new Error("Failed to generate itinerary using Groq.");
  }
} 