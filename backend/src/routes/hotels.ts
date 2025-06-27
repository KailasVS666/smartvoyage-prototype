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
  images: string[];
  amenities?: string[];
  reviews?: { username: string; rating: number; comment: string; }[];
  location?: { lat: number; lng: number };
  rooms?: { type: string; price: string; images: string[]; availability: boolean; }[];
  specialOffers?: string[];
  policies?: { checkIn: string; checkOut: string; cancellation: string; payment: string; };
  accessibility?: string[];
  nearby?: { name: string; type: string; distance: string; }[];
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
    { name: 'Hotel Le Meurice', address: '228 Rue de Rivoli, 75001 Paris', price: '120.00', bookingLink: null, imageUrl: 'https://tse3.mm.bing.net/th?id=OIP.O8kHPLiE5MBevpbtn-ACEQHaDU&pid=Api&P=0&h=180', description: 'A luxury hotel in the heart of Paris, near the Louvre.', rating: 4.8, images: [
      'https://tse4.mm.bing.net/th?id=OIP.hco9UELK3PiAQxnYTTljGAHaE8&pid=Api&P=0&h=180',
      'https://tse2.mm.bing.net/th?id=OIP.Yaf4ZJI18BG5d42745OnbgHaFj&pid=Api&P=0&h=180',
      'https://tse1.mm.bing.net/th?id=OIP.nzjVI6Fk3KGUPmxaqpdY-QHaE8&pid=Api&P=0&h=180',
    ],
      amenities: ['Free WiFi', 'Spa', 'Fitness Center', 'Pet-friendly', 'Restaurant', 'Bar', 'Airport Shuttle'],
      reviews: [
        { username: 'Alice', rating: 5, comment: 'Absolutely stunning hotel with top-notch service.' },
        { username: 'Bob', rating: 4, comment: 'Great location and beautiful rooms, but pricey.' },
        { username: 'Claire', rating: 5, comment: 'Loved the spa and the breakfast buffet!' }
      ],
      location: { lat: 48.8656, lng: 2.3285 },
      rooms: [
        { type: 'Deluxe Room', price: '120.00', images: ['https://tse4.mm.bing.net/th?id=OIP.hco9UELK3PiAQxnYTTljGAHaE8&pid=Api&P=0&h=180'], availability: true },
        { type: 'Executive Suite', price: '220.00', images: ['https://tse2.mm.bing.net/th?id=OIP.Yaf4ZJI18BG5d42745OnbgHaFj&pid=Api&P=0&h=180'], availability: false },
        { type: 'Presidential Suite', price: '500.00', images: ['https://tse1.mm.bing.net/th?id=OIP.nzjVI6Fk3KGUPmxaqpdY-QHaE8&pid=Api&P=0&h=180'], availability: true }
      ],
      specialOffers: ['Stay 3 nights, get 1 free breakfast', '10% off spa treatments'],
      policies: { checkIn: '15:00', checkOut: '12:00', cancellation: 'Free cancellation up to 24h before check-in', payment: 'Credit Card, Cash' },
      accessibility: ['Wheelchair accessible', 'Elevator', 'Accessible bathroom'],
      nearby: [
        { name: 'Louvre Museum', type: 'Museum', distance: '0.5 km' },
        { name: 'Tuileries Garden', type: 'Park', distance: '0.3 km' },
        { name: 'Eiffel Tower', type: 'Landmark', distance: '2.5 km' }
      ]
    },
    { name: 'Hôtel Plaza Athénée', address: '25 Avenue Montaigne, 75008 Paris', price: '150.00', bookingLink: null, imageUrl: 'https://tse1.mm.bing.net/th?id=OIP.aMmLiYwGVH6suc-0gMQaBQHaFc&pid=Api&P=0&h=180', description: 'Elegant hotel with Eiffel Tower views and fine dining.', rating: 4.7, images: [
      'https://tse1.mm.bing.net/th?id=OIP.zTvftTJlwM1F1c4QDEr8TAHaE8&pid=Api&P=0&h=180',
      'https://tse1.mm.bing.net/th?id=OIP.kOJqfIAA7vYPZdF9AQYoHwHaEr&pid=Api&P=0&h=180',
      'https://tse4.mm.bing.net/th?id=OIP.I_fgcoJKIlckSnUP3fpZWwHaEK&pid=Api&P=0&h=180',
    ],
      amenities: ['Free WiFi', 'Spa', 'Fitness Center', 'Restaurant', 'Bar', 'Airport Shuttle'],
      reviews: [
        { username: 'Marie', rating: 5, comment: 'Spectacular views of the Eiffel Tower and amazing service.' },
        { username: 'Jean', rating: 4, comment: 'Loved the fine dining and the location.' },
        { username: 'Sophie', rating: 5, comment: 'The rooms are beautiful and the staff is very attentive.' }
      ],
      location: { lat: 48.8665, lng: 2.3042 },
      rooms: [
        { type: 'Superior Room', price: '150.00', images: ['https://tse1.mm.bing.net/th?id=OIP.zTvftTJlwM1F1c4QDEr8TAHaE8&pid=Api&P=0&h=180'], availability: true },
        { type: 'Junior Suite', price: '250.00', images: ['https://tse1.mm.bing.net/th?id=OIP.kOJqfIAA7vYPZdF9AQYoHwHaEr&pid=Api&P=0&h=180'], availability: true },
        { type: 'Prestige Suite', price: '400.00', images: ['https://tse4.mm.bing.net/th?id=OIP.I_fgcoJKIlckSnUP3fpZWwHaEK&pid=Api&P=0&h=180'], availability: false }
      ],
      specialOffers: ['Free dinner with 2-night stay', 'Complimentary airport transfer'],
      policies: { checkIn: '14:00', checkOut: '12:00', cancellation: 'Free cancellation up to 48h before check-in', payment: 'Credit Card' },
      accessibility: ['Wheelchair accessible', 'Elevator'],
      nearby: [
        { name: 'Eiffel Tower', type: 'Landmark', distance: '1.2 km' },
        { name: 'Champs-Élysées', type: 'Shopping', distance: '0.5 km' },
        { name: 'Seine River', type: 'River', distance: '0.3 km' }
      ]
    },
    { name: 'Le Bristol Paris', address: '112 Rue du Faubourg Saint-Honoré, 75008 Paris', price: '100.00', bookingLink: null, imageUrl: 'https://tse1.mm.bing.net/th?id=OIP.JpKM2EjCXpCPSnQ2-K-n2QHaFj&pid=Api&P=0&h=180', description: 'Classic Parisian luxury with a beautiful garden.', rating: 4.9, images: [
      'https://tse3.mm.bing.net/th?id=OIP.s-ZJJRuCdaj6vKf-QhfVCgHaEJ&pid=Api&P=0&h=180',
      'https://tse4.mm.bing.net/th?id=OIP.L0lw4AkRczXTHiR9CDxWMQHaEK&pid=Api&P=0&h=180',
      'https://tse4.mm.bing.net/th?id=OIP.-5x7dYjSGVDELq7QAO366AHaEK&pid=Api&P=0&h=180',
    ],
      amenities: ['Free WiFi', 'Garden', 'Spa', 'Pet-friendly', 'Restaurant', 'Bar'],
      reviews: [
        { username: 'Luc', rating: 5, comment: 'The garden is a peaceful oasis in the city.' },
        { username: 'Emma', rating: 5, comment: 'Exceptional service and beautiful rooms.' },
        { username: 'Paul', rating: 4, comment: 'Great for families and pet owners.' }
      ],
      location: { lat: 48.8721, lng: 2.3145 },
      rooms: [
        { type: 'Classic Room', price: '100.00', images: ['https://tse3.mm.bing.net/th?id=OIP.s-ZJJRuCdaj6vKf-QhfVCgHaEJ&pid=Api&P=0&h=180'], availability: true },
        { type: 'Deluxe Suite', price: '200.00', images: ['https://tse4.mm.bing.net/th?id=OIP.L0lw4AkRczXTHiR9CDxWMQHaEK&pid=Api&P=0&h=180'], availability: true },
        { type: 'Garden Suite', price: '350.00', images: ['https://tse4.mm.bing.net/th?id=OIP.-5x7dYjSGVDELq7QAO366AHaEK&pid=Api&P=0&h=180'], availability: false }
      ],
      specialOffers: ['Free spa access with every booking', 'Kids stay free'],
      policies: { checkIn: '15:00', checkOut: '11:00', cancellation: 'Free cancellation up to 72h before check-in', payment: 'Credit Card, Cash' },
      accessibility: ['Wheelchair accessible', 'Accessible bathroom'],
      nearby: [
        { name: 'Parc Monceau', type: 'Park', distance: '0.7 km' },
        { name: "Palais de l'Élysée", type: 'Government', distance: '0.4 km' },
        { name: 'Galeries Lafayette', type: 'Shopping', distance: '1.5 km' }
      ]
    },
  ],
  NYC: [
    { name: 'The Plaza Hotel', address: '768 5th Ave, New York, NY 10019', price: '200.00', bookingLink: null, imageUrl: 'https://tse3.mm.bing.net/th?id=OIP.fA-FnGGhoT3GOW__2_fvjgHaJD&pid=Api&P=0&h=180', description: 'Iconic luxury hotel at Central Park South.', rating: 4.7, images: [
      'https://tse4.mm.bing.net/th?id=OIP.cYIK7SqnHkWKdDi5KjqTJwHaE8&pid=Api&P=0&h=180',
      'https://tse4.mm.bing.net/th?id=OIP.k37s0sge2VFU9h_LHMdMxgAAAA&pid=Api&P=0&h=180',
      'https://tse3.mm.bing.net/th?id=OIP.7vkWJiZsCL-0EVQ8aKW_HQHaE8&pid=Api&P=0&h=180',
    ] },
    { name: 'The St. Regis New York', address: 'Two E 55th St, New York, NY 10022', price: '180.00', bookingLink: null, imageUrl: 'https://cache.marriott.com/is/image/marriotts7prod/nycxr-exterior-1674:Pano-Hor?wid=1600&fit=constrain', description: 'Timeless elegance in Midtown Manhattan.', rating: 4.8, images: [
      'https://cache.marriott.com/content/dam/marriott-renditions/NYCXR/nycxr-dior-suite-9951-hor-clsc.jpg?output-quality=70&interpolation=progressive-bilinear&downsize=856px:*',
      'https://cache.marriott.com/content/dam/marriott-renditions/NYCXR/nycxr-imperial-1528-hor-clsc.jpg?output-quality=70&interpolation=progressive-bilinear&downsize=856px:*',
      'https://cache.marriott.com/content/dam/marriott-renditions/NYCXR/nycxr-presidential-9066-hor-clsc.jpg?output-quality=70&interpolation=progressive-bilinear&downsize=856px:*',
    ] },
    { name: 'The Peninsula New York', address: '700 5th Ave, New York, NY 10019', price: '220.00', bookingLink: null, imageUrl: 'https://images.getaroom-cdn.com/image/upload/s--JtQ_iqsl--/c_limit,e_improve,fl_lossy.immutable_cache,h_460,q_auto:good,w_460/v1665959631/0916e4f44c2de494ad34bbe0c0bebfa050730ab5?_a=BACAEuDL&atc=e7cd1cfa', description: 'Upscale hotel with a rooftop bar and spa.', rating: 4.6, images: [
      'https://images.getaroom-cdn.com/image/upload/s--R8P7hMc2--/c_limit,e_improve,fl_lossy.immutable_cache,h_940,q_auto:good,w_940/v1736369301/c45844d716e17133660cbe3c378b82c61e1eea03?_a=BACAEuDL&atc=e7cd1cfa',
      'https://images.getaroom-cdn.com/image/upload/s--Lt2riyNS--/c_limit,e_improve,fl_lossy.immutable_cache,h_940,q_auto:good,w_940/v1736369301/f9846b549b72235fd0a31857b8512d462943a832?_a=BACAEuDL&atc=e7cd1cfa',
      'https://images.getaroom-cdn.com/image/upload/s--IVtMBGrz--/c_limit,e_improve,fl_lossy.immutable_cache,h_940,q_auto:good,w_940/v1665959631/7c8b712dd0e1aa8c3d82de880bbfd8c96cdabcc7?_a=BACAEuDL&atc=e7cd1cfa',
    ] },
  ],
  LON: [
    { name: "The Savoy", address: "Strand, London WC2R 0EZ", price: "170.00", bookingLink: null, imageUrl: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/40536774.jpg?k=684ce06db01f221294a4252aa1cd4bebf4b2ae63b4e9951ab9684a66985e1023&o=", description: "Historic luxury hotel on the River Thames.", rating: 4.8, images: [
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/198540612.jpg?k=802268ad9b5382d17a9247f93966408c92c115be8a4db12ab82126dad7b1d173&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/522580314.jpg?k=924034ecaf5e69ee04037f24c2522dcb55520573d9f40385146af6ba56a76c7a&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/198541348.jpg?k=fe1d72ffb8d437d37f1fdfacc5776b1acc8fd067ccde754d8dc0042a54074f9f&o=",
    ] },
    { name: "The Ritz London", address: "150 Piccadilly, St. James's, London W1J 9BR", price: "190.00", bookingLink: null, imageUrl: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/24721217.jpg?k=66c6cc4aa76fa5215c212110285193ba47ea42ade88c8f75ae21e51ad8f1b034&o=", description: "World-renowned for its afternoon tea and service.", rating: 4.9, images: [
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/106779100.jpg?k=d322f1b27f3467c4e1d8dfd47d892df4c87fba73e4d4b2da5f1da3c89b6a2866&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/412230343.jpg?k=dfba7c5f151c627f0b475383d313483fd73252f3ba5f31e26bb4d2f77ce4f2f5&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/449664553.jpg?k=2b1a938dfe831685c7d89b6d1d489bb5c8ca02c505b002e3319991e0572e08e4&o=",
    ] },
    { name: "Claridge's", address: "Brook St, Mayfair, London W1K 4HR", price: "160.00", bookingLink: null, imageUrl: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/474967777.jpg?k=7738be5a2ef3f2fcd71c0a9506cfd05abcf6d00ac95c8ef7ba29b6dd140cfd9f&o=", description: "Art Deco luxury in the heart of Mayfair.", rating: 4.7, images: [
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/207161677.jpg?k=7215d2f763323760776ac99a0a651b404f19b0b8b6732de3b5cf1496e278f853&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/274229757.jpg?k=a2348b9611c95d82b79f07c2635716f291c0c0c5aadd6b7b4cce0c619c6f574f&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/274228985.jpg?k=5d5924ad9297682e949d1d953b8c35ccf66eb5ec2b17b1dda7bef4570b1e6d87&o=",
    ] },
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
              rating: hotel.hotel.rating ? hotel.hotel.rating.rating : 0,
              images: hotel.hotel.images && hotel.hotel.images.length > 0 ? hotel.hotel.images.map((image: any) => image.url) : []
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
                rating: hotel.hotel.rating ? hotel.hotel.rating.rating : 0,
                images: hotel.hotel.images && hotel.hotel.images.length > 0 ? hotel.hotel.images.map((image: any) => image.url) : []
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