import { Router, Request, Response } from "express";
import { generateItinerary } from "../services/aiService";

const router = Router();

// POST / - Generate itinerary using Groq API
router.post("/", async (req: Request, res: Response) => {
  const { destination, days, budget, travelType, preferences } = req.body;
  if (!destination || !days) {
    return res.status(400).json({ error: "'destination' and 'days' are required fields." });
  }
  const prompt = `Generate a personalized travel itinerary for:\n\nDestination: ${destination}\n\nDuration: ${days} days\n\nBudget: ${budget || "Not specified"}\n\nType of Travel: ${travelType || "Not specified"}\n\nPreferences: ${preferences || "None"}\n\nMake it creative, practical, and well-structured by day.`;
  try {
    const itinerary = await generateItinerary(prompt);
    res.json({ itinerary });
  } catch (error: any) {
    console.error("Groq API error:", error);
    res.status(500).json({ error: error.message || "Failed to generate itinerary." });
  }
});

// Placeholder GET route
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "Itinerary endpoint placeholder" });
});

export default router; 