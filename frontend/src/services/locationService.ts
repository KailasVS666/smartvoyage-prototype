// Nominatim (OpenStreetMap) Geocoding for SmartVoyage
import type { MapLocation } from '@/components/ItineraryMap';
import type { Itinerary } from '@/types/itinerary';

// Simple delay to respect Nominatim's 1 request/sec rate limit
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCoordinatesFromPlace(place: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`;
  try {
    // Respect 1 request/sec
    await delay(1100);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'SmartVoyage/1.0 (your@email.com)',
        'Accept-Language': 'en',
      },
    });
    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error('Nominatim geocoding error:', error);
    return null;
  }
}

export const convertActivitiesToMapLocations = async (itinerary: Itinerary): Promise<MapLocation[]> => {
  const locations: MapLocation[] = [];
  for (const day of itinerary.days) {
    for (const activity of day.activities) {
      if (!activity.title) continue;
      if (activity.lat && activity.lng) {
        locations.push({
          name: activity.title,
          description: `Day ${day.day}, ${activity.time}: ${activity.description}`,
          lat: activity.lat,
          lng: activity.lng
        });
        continue;
      }
      // Use Nominatim geocoding if coordinates are missing
      try {
        const coordinates = await getCoordinatesFromPlace(activity.title);
        if (coordinates) {
          locations.push({
            name: activity.title,
            description: `Day ${day.day}, ${activity.time}: ${activity.description}`,
            ...coordinates
          });
        }
      } catch (error) {
        console.error(`Error getting coordinates for ${activity.title}:`, error);
      }
    }
  }
  return locations;
}; 