import { Router, Request, Response } from "express";
import { getItineraryFromAI, generateTextFromAI } from "../services/aiService";
import { buildItineraryPrompt, buildPackingListPrompt } from "../utils/promptBuilder";

const router = Router();

// POST / - Generate itinerary using Gemini API
router.post("/", async (req: Request, res: Response) => {
  const { city, days, interests, budgetLevel, travelStyle } = req.body;

  // Validation
  if (!city || !days) {
    return res.status(400).json({ error: "'city' and 'days' are required fields." });
  }

  // Build the prompt using the new utility function
  const prompt = buildItineraryPrompt({
    city,
    days,
    interests: interests || [],
    budgetLevel,
    travelStyle,
  });

  try {
    const { itinerary, error } = await getItineraryFromAI(prompt);
    if (error) {
      return res.status(500).json({ error });
    }
    res.json({ itinerary });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error.message || "Failed to generate itinerary." });
  }
});

// POST /packing-list - Generate packing list
router.post("/packing-list", async (req: Request, res: Response) => {
  const { destination, duration, activities, travelers } = req.body;

  if (!destination || !duration || !travelers) {
    return res.status(400).json({ error: "Missing required fields: destination, duration, travelers" });
  }

  const prompt = buildPackingListPrompt({
    destination,
    duration,
    activities: activities || [],
    travelers,
  });

  try {
    const { content, error } = await generateTextFromAI(prompt);
    if (error) {
      return res.status(500).json({ error });
    }
    res.json({ packingList: content });
  } catch (error: any) {
    console.error("Packing list generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate packing list." });
  }
});

// Placeholder GET route
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "Itinerary endpoint placeholder" });
});

export default router; 