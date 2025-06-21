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