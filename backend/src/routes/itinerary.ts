import { Router, Request, Response } from "express";
import { getItineraryFromAI, generateTextFromAI, generateItinerary } from "../services/aiService";
import { buildItineraryPrompt, buildPackingListPrompt } from "../utils/promptBuilder";
import authMiddleware from '../middleware/auth';

const router = Router();

// Import node-fetch for backend geocoding
const fetch = require('node-fetch');

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

// POST /replan-day - Replan a single day using Gemini
router.post('/replan-day', authMiddleware, async (req: Request, res: Response) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }
  try {
    const text = await generateItinerary(prompt);
    res.json({ text });
  } catch (error: any) {
    console.error('Gemini replan error:', error);
    res.status(500).json({ error: error.message || 'Failed to replan day' });
  }
});

// Placeholder GET route
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "Itinerary endpoint placeholder" });
});

// Add a geocode proxy endpoint
router.get('/geocode', async (req: Request, res: Response) => {
  const place = req.query.place as string;
  if (!place) {
    return res.status(400).json({ error: 'Missing place parameter' });
  }
  try {
    // Optionally: add rate limiting/caching here
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`;
    const fetchRes = await fetch(url, {
      headers: { 'User-Agent': 'SmartVoyage/1.0' }
    });
    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({ error: 'Geocoding failed' });
    }
    const data = await fetchRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Geocoding error' });
  }
});

export default router; 