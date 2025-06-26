import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Helper to get Amadeus access token
async function getAmadeusToken(): Promise<string> {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Missing Amadeus credentials');
  const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`
  });
  if (!res.ok) throw new Error('Failed to authenticate with Amadeus');
  const data: any = await res.json();
  return data.access_token;
}

// --- Types ---
export interface HotelOffer {
  name: string;
  address: string;
  price: string | null;
  bookingLink: string | null;
  imageUrl: string;
  description: string;
  rating: number;
}
export interface HotelOfferResponse {
  offers: HotelOffer[];
  source: 'amadeus' | 'geocode' | 'mock' | 'geocode-dynamic';
}

// --- Supported Cities ---
const CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  PAR: { latitude: 48.8566, longitude: 2.3522 },
  NYC: { latitude: 40.7128, longitude: -74.0060 },
  LON: { latitude: 51.5074, longitude: -0.1278 },
};

const MOCK_HOTELS: Record<string, HotelOffer[]> = {
  PAR: [
    { name: 'Hotel Le Meurice', address: '228 Rue de Rivoli, 75001 Paris', price: '120.00', bookingLink: null, imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80', description: 'A luxury hotel in the heart of Paris, near the Louvre.', rating: 4.8 },
    { name: 'Hôtel Plaza Athénée', address: '25 Avenue Montaigne, 75008 Paris', price: '150.00', bookingLink: null, imageUrl: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80', description: 'Elegant hotel with Eiffel Tower views and fine dining.', rating: 4.7 },
    { name: 'Le Bristol Paris', address: '112 Rue du Faubourg Saint-Honoré, 75008 Paris', price: '100.00', bookingLink: null, imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80', description: 'Classic Parisian luxury with a beautiful garden.', rating: 4.9 },
  ],
  NYC: [
    { name: 'The Plaza Hotel', address: '768 5th Ave, New York, NY 10019', price: '200.00', bookingLink: null, imageUrl: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=80', description: 'Iconic luxury hotel at Central Park South.', rating: 4.7 },
    { name: 'The St. Regis New York', address: 'Two E 55th St, New York, NY 10022', price: '180.00', bookingLink: null, imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', description: 'Timeless elegance in Midtown Manhattan.', rating: 4.8 },
    { name: 'The Peninsula New York', address: '700 5th Ave, New York, NY 10019', price: '220.00', bookingLink: null, imageUrl: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=400&q=80', description: 'Upscale hotel with a rooftop bar and spa.', rating: 4.6 },
  ],
  LON: [
    { name: "The Savoy", address: "Strand, London WC2R 0EZ", price: "170.00", bookingLink: null, imageUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80", description: "Historic luxury hotel on the River Thames.", rating: 4.8 },
    { name: "The Ritz London", address: "150 Piccadilly, St. James's, London W1J 9BR", price: "190.00", bookingLink: null, imageUrl: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=400&q=80", description: "World-renowned for its afternoon tea and service.", rating: 4.9 },
    { name: "Claridge's", address: "Brook St, Mayfair, London W1K 4HR", price: "160.00", bookingLink: null, imageUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80", description: "Art Deco luxury in the heart of Mayfair.", rating: 4.7 },
  ],
};

const USE_MOCK_HOTELS = process.env.USE_MOCK_HOTELS === 'true';
const IS_DEV = process.env.NODE_ENV !== 'production';

// --- In-memory cache for hotel offers (per city, 10 min expiry) ---
const offerCache: Record<string, { data: HotelOfferResponse; expires: number }> = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// --- Rate Limiting Middleware (30 req/min per IP) ---
let rateLimit: any;
try {
  rateLimit = require('express-rate-limit');
} catch (e) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('express-rate-limit is not installed. Run: npm install express-rate-limit');
  }
  rateLimit = () => (req: any, res: any, next: any) => next();
}
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, please try again later.' },
});
router.use(limiter);

// --- Utility: Dynamic geocoding using OpenStreetMap ---
async function geocodeCity(cityCode: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityCode)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'SmartVoyage/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
    }
  } catch (err) {
    if (IS_DEV) console.error('Dynamic geocoding error:', err);
  }
  return null;
}

// Add this above your route handlers:
export async function getHotelOffers(
  cityCode: string,
  checkIn: string,
  checkOut: string,
  adults: string,
  token: string
): Promise<HotelOfferResponse> {
  if (USE_MOCK_HOTELS) {
    if (IS_DEV) console.warn('USE_MOCK_HOTELS is true, serving mock data for', cityCode);
    return { offers: Array.isArray(MOCK_HOTELS[cityCode]) ? MOCK_HOTELS[cityCode] : [], source: 'mock' };
  }
  const cacheKey = `${cityCode}_${checkIn}_${checkOut}_${adults}`;
  if (offerCache[cacheKey] && Array.isArray(offerCache[cacheKey].data.offers) && offerCache[cacheKey].expires > Date.now()) {
    if (IS_DEV) console.log('Serving hotel offers from cache for', cityCode);
    return offerCache[cacheKey].data;
  }
  try {
    const url = `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${encodeURIComponent(cityCode)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data: any = await res.json();
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const hotelIds = data.data.map((hotel: any) => hotel.hotelId).slice(0, 20);
        const offersUrl = `https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${hotelIds.join(',')}&checkInDate=${encodeURIComponent(checkIn)}&checkOutDate=${encodeURIComponent(checkOut)}&adults=${encodeURIComponent(adults)}`;
        const offersRes = await fetch(offersUrl, { headers: { Authorization: `Bearer ${token}` } });
        if (offersRes.ok) {
          const offersData: any = await offersRes.json();
          const offers = (offersData.data || []).map((hotel: any) => {
            const offer = hotel.offers && hotel.offers[0];
            return {
              name: hotel.hotel.name,
              address: hotel.hotel.address && hotel.hotel.address.lines ? hotel.hotel.address.lines.join(', ') : '',
              price: offer && offer.price ? offer.price.total : null,
              bookingLink: offer && offer['urls'] && offer['urls']['booking'] ? offer['urls']['booking'] : null,
              imageUrl: hotel.hotel.images && hotel.hotel.images.length > 0 ? hotel.hotel.images[0].url : '',
              description: hotel.hotel.description ? hotel.hotel.description.text : '',
              rating: hotel.hotel.rating ? hotel.hotel.rating.rating : 0
            };
          });
          if (Array.isArray(offers) && offers.length > 0) {
            const resp: HotelOfferResponse = { offers, source: 'amadeus' };
            offerCache[cacheKey] = { data: resp, expires: Date.now() + CACHE_TTL };
            return resp;
          }
        }
      }
    } else {
      const errorText = await res.text();
      if (IS_DEV) console.error('Amadeus hotel ID fetch error (by-city):', errorText);
    }
  } catch (err) {
    if (IS_DEV) console.error('Error in by-city:', err);
  }
  let coords: { latitude: number; longitude: number } | undefined = CITY_COORDS[cityCode];
  let geocodeSource: 'geocode' | 'geocode-dynamic' = 'geocode';
  if (!coords) {
    const dynamicCoords = await geocodeCity(cityCode);
    if (dynamicCoords && typeof dynamicCoords.latitude === 'number' && typeof dynamicCoords.longitude === 'number') {
      coords = dynamicCoords;
      geocodeSource = 'geocode-dynamic';
    } else {
      coords = undefined;
    }
  }
  if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
    try {
      if (IS_DEV) console.warn('Falling back to', geocodeSource, 'for', cityCode);
      const url = `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-geocode?latitude=${coords.latitude}&longitude=${coords.longitude}&radius=10`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data: any = await res.json();
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          const hotelIds = data.data.map((hotel: any) => hotel.hotelId).slice(0, 20);
          const offersUrl = `https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${hotelIds.join(',')}&checkInDate=${encodeURIComponent(checkIn)}&checkOutDate=${encodeURIComponent(checkOut)}&adults=${encodeURIComponent(adults)}`;
          const offersRes = await fetch(offersUrl, { headers: { Authorization: `Bearer ${token}` } });
          if (offersRes.ok) {
            const offersData: any = await offersRes.json();
            const offers = (offersData.data || []).map((hotel: any) => {
              const offer = hotel.offers && hotel.offers[0];
              return {
                name: hotel.hotel.name,
                address: hotel.hotel.address && hotel.hotel.address.lines ? hotel.hotel.address.lines.join(', ') : '',
                price: offer && offer.price ? offer.price.total : null,
                bookingLink: offer && offer['urls'] && offer['urls']['booking'] ? offer['urls']['booking'] : null,
                imageUrl: hotel.hotel.images && hotel.hotel.images.length > 0 ? hotel.hotel.images[0].url : '',
                description: hotel.hotel.description ? hotel.hotel.description.text : '',
                rating: hotel.hotel.rating ? hotel.hotel.rating.rating : 0
              };
            });
            if (Array.isArray(offers) && offers.length > 0) {
              const resp: HotelOfferResponse = { offers, source: geocodeSource };
              offerCache[cacheKey] = { data: resp, expires: Date.now() + CACHE_TTL };
              return resp;
            }
          }
        }
      } else {
        const errorText = await res.text();
        if (IS_DEV) console.error('Amadeus hotel ID fetch error (by-geocode):', errorText);
      }
    } catch (err) {
      if (IS_DEV) console.error('Error in by-geocode:', err);
    }
  }
  if (IS_DEV) console.warn('Falling back to mock hotel offers for', cityCode);
  return { offers: Array.isArray(MOCK_HOTELS[cityCode]) ? MOCK_HOTELS[cityCode] : [], source: 'mock' };
}

// --- Endpoint: List Supported Cities ---
router.get('/cities', (req: Request, res: Response) => {
  const cities = Object.keys(CITY_COORDS).map(code => ({
    code,
    name:
      code === 'PAR' ? 'Paris' :
      code === 'NYC' ? 'New York' :
      code === 'LON' ? 'London' : code
  }));
  res.json({ cities });
});

// --- Main GET /api/hotels endpoint ---
router.get('/', async (req: Request, res: Response) => {
  const { cityCode, checkIn, checkOut, adults } = req.query;
  if (!cityCode || !checkIn || !checkOut || !adults) {
    return res.status(400).json({ error: 'Missing required query parameters' });
  }
  let token: string;
  try {
    token = await getAmadeusToken();
  } catch (err: any) {
    return res.status(500).json({ error: 'Amadeus authentication failed', details: err.message });
  }
  try {
    const { offers, source } = await getHotelOffers(cityCode as string, checkIn as string, checkOut as string, adults as string, token);
    if (!Array.isArray(offers) || offers.length === 0) {
      if (!CITY_COORDS[cityCode as string] && !MOCK_HOTELS[cityCode as string]) {
        if (IS_DEV) console.warn('Unsupported city requested:', cityCode);
        return res.status(404).json({ error: `No hotel data available for city code: ${cityCode}` });
      }
    }
    return res.json({ offers, source });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch hotel offers', details: err.message });
  }
});

export default router;