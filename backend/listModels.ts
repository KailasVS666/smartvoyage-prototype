import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("The GEMINI_API_KEY environment variable is missing or empty. Please set it in your .env file.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = await genAI.listModels();

  console.log("Available models:\n");
  for (const model of models) {
    if (typeof model === "string") {
      console.log(model);
    } else if (model && typeof model === "object" && "name" in model) {
      console.log(model.name);
    }
  }
}

listModels().catch((err) => {
  console.error("Error listing models:", err);
  process.exit(1);
}); 