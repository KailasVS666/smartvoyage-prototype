// Utility to build prompts for OpenAI

export const buildItineraryPrompt = (data: any) => {
  // TODO: Build a prompt string based on user input data
  return `Create a travel itinerary for: ${JSON.stringify(data)}`;
}; 