// Type definitions for itinerary

export interface ItineraryRequest {
  destination: string;
  duration: string;
  budget: string;
  travelType: string[];
  preferences: string[];
}

export interface ItineraryResponse {
  itinerary: string;
} 