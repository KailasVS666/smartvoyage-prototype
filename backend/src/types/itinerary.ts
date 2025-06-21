// Type definitions for itinerary

export interface ItineraryRequest {
  destination: string;
  duration: string;
  budget: string;
  travelers: number;
  travelType: string[];
  preferences: string[];
}

export interface ItineraryResponse {
  itinerary: string;
}

export interface Itinerary {
  days: {
    day: number;
    summary: string;
    activities: {
      time: string;
      title: string;
      description: string;
    }[];
  }[];
} 