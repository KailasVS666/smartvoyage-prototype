export async function geocodePlace(place: string): Promise<{ lat: number, lng: number } | null> {
  // Call backend proxy endpoint
  const url = `/itinerary/geocode?place=${encodeURIComponent(place)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  return null;
} 