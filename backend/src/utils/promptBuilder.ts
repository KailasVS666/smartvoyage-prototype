type BuildItineraryPromptInput = {
  city: string;
  days: number;
  interests: string[];
  budgetLevel: "low" | "medium" | "high";
  travelStyle: "slow" | "fast-paced" | "luxurious" | "backpacking";
};

export function buildItineraryPrompt(input: BuildItineraryPromptInput): string {
  return `
Act as a travel planner AI. Create a ${input.days}-day itinerary for a traveler visiting ${input.city}.
- Interests: ${input.interests.length ? input.interests.join(", ") : "none specified"}
- Travel style: ${input.travelStyle}
- Budget: ${input.budgetLevel}

Instructions:
- Output ONLY a valid JSON object in this format (no markdown, no extra text):

{
  "days": [
    {
      "day": 1,
      "summary": "Brief summary of the day",
      "activities": [
        {
          "time": "09:00 AM",
          "title": "Activity title",
          "description": "Details about the activity"
        }
        // ... more activities
      ]
    }
    // ... more days
  ]
}

- Each day should have a summary and 3-5 activities with time, title, and description.
- Do NOT include any text or explanation before or after the JSON.
- Ensure the JSON is valid and parsable.
`;
}

type BuildPackingListPromptInput = {
  destination: string;
  duration: number;
  activities: string[];
  travelers: number;
};

export function buildPackingListPrompt(input: BuildPackingListPromptInput): string {
  // Get current month for seasonal context
  const month = new Date().toLocaleString('default', { month: 'long' });

  return `
Act as a travel packing expert. Generate a practical packing list for a ${input.duration}-day trip to ${input.destination} for ${input.travelers} people during the month of ${month}.
- The planned activities include: ${input.activities.length ? input.activities.join(", ") : "general tourism, dining, and exploring"}.
- Consider the destination's likely weather for the specified time of year.

Instructions:
- Output ONLY a markdown-formatted list. Do NOT include any other text, titles, or explanations.
- Group items into logical categories (e.g., Clothing, Toiletries, Documents, Electronics).
- Start each item with a hyphen.

Example format:
### Clothing
- T-shirts
- Jeans
- Socks

### Documents
- Passport
- Visa (if required)
`;
}