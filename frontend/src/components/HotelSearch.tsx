import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Loader2, Heart, Search, Calendar, Users, DollarSign, Star, Sliders, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ItineraryMap, { MapLocation } from './ItineraryMap';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Dialog } from './ui/dialog';
import { useIsMobile } from '../hooks/use-mobile';
import { useEffect as useReactEffect } from 'react';
import { toast } from "./ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { getUserFavorites, addFavorite, removeFavorite } from "../services/favoriteService";
import { HotelCardSkeleton } from './ui/skeleton';
import { useInView } from 'react-intersection-observer';
import { RecentlyViewed } from './RecentlyViewed';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface HotelOffer {
  name: string;
  address: string;
  price: string | null;
  bookingLink: string | null;
  imageUrl?: string;
  description?: string;
  rating?: number;
  images?: string[];
  amenities?: string[];
  reviews?: { username: string; rating: number; comment: string; }[];
  location?: { lat: number; lng: number };
  rooms?: { type: string; price: string; images: string[]; availability: boolean; }[];
  specialOffers?: string[];
  policies?: { checkIn: string; checkOut: string; cancellation: string; payment: string; };
  accessibility?: string[];
  nearby?: { name: string; type: string; distance: string; }[];
  source?: string;
}

// Add a simple modal for hotel details
const HotelDetailsModal: React.FC<{
  hotel: HotelOffer & { source?: string; imageUrl?: string; description?: string; rating?: number };
  onClose: () => void;
}> = ({ hotel, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-md w-full relative">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">&times;</button>
      {hotel.imageUrl && hotel.imageUrl.length > 0 ? (
        <img src={hotel.imageUrl} alt={hotel.name} className="w-full h-48 object-cover rounded mb-4" />
      ) : (
        <div className="w-full h-48 flex items-center justify-center bg-gray-200 rounded mb-4 text-gray-500">No image available</div>
      )}
      <h2 className="text-2xl font-bold mb-2">{hotel.name}</h2>
      {hotel.rating && hotel.rating > 0 && <div className="mb-2">Rating: {hotel.rating} ⭐</div>}
      {hotel.address && <div className="mb-2 text-gray-600">{hotel.address}</div>}
      {hotel.price && <div className="mb-2 font-semibold">Price: ${hotel.price}</div>}
      {hotel.description && hotel.description.length > 0 && <div className="mb-2">{hotel.description}</div>}
      {hotel.bookingLink && (
        <a href={hotel.bookingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mb-2 block">Book Now</a>
      )}
      {hotel.source && (
        <div className="text-xs text-gray-400 mt-2">Data source: {hotel.source}</div>
      )}
    </div>
  </div>
);

const ITEMS_PER_PAGE = 12;

const HotelSearch: React.FC = () => {
  const [cityCode, setCityCode] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(1);
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<HotelOffer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelOffer & { source?: string } | null>(null);
  const [source, setSource] = useState<string | undefined>(undefined);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [starRatings, setStarRatings] = useState<number[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating-desc' | 'rating-asc'>('price-asc');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const priceSliderRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { ref: loadMoreRef, inView } = useInView();

  // Sync favorites with Firestore/localStorage on mount or user change
  useEffect(() => {
    async function loadFavorites() {
      if (user) {
        try {
          const favs = await getUserFavorites(user.uid);
          setFavorites(favs);
        } catch {
          setFavorites([]);
        }
      } else {
        try {
          const favs = JSON.parse(localStorage.getItem('hotelFavorites') || '[]');
          setFavorites(favs);
        } catch {
          setFavorites([]);
        }
      }
    }
    loadFavorites();
    // eslint-disable-next-line
  }, [user]);
  // Toggle favorite handler
  const toggleFavorite = async (hotelName: string) => {
    if (user) {
      try {
        if (favorites.includes(hotelName)) {
          await removeFavorite(user.uid, hotelName);
          setFavorites(favs => favs.filter(f => f !== hotelName));
          toast({ title: "Removed from Favorites", description: `${hotelName} has been removed from your favorites.` });
        } else {
          await addFavorite(user.uid, hotelName);
          setFavorites(favs => [...favs, hotelName]);
          toast({ title: "Added to Favorites", description: `${hotelName} has been added to your favorites!` });
        }
      } catch {
        toast({ title: "Error", description: "Failed to update favorites in the cloud.", variant: "destructive" });
      }
    } else {
      setFavorites(favs => {
        let newFavs;
        if (favs.includes(hotelName)) {
          newFavs = favs.filter(f => f !== hotelName);
          toast({ title: "Removed from Favorites", description: `${hotelName} has been removed from your favorites.` });
        } else {
          newFavs = [...favs, hotelName];
          toast({ title: "Added to Favorites", description: `${hotelName} has been added to your favorites!` });
        }
        localStorage.setItem('hotelFavorites', JSON.stringify(newFavs));
        return newFavs;
      });
    }
  };

  // For amenities options
  const allAmenities = Array.from(new Set(offers.flatMap(h => h.amenities || [])));
  // For price range
  const minPrice = Math.min(...offers.map(h => Number(h.price) || 0), 0);
  const maxPrice = Math.max(...offers.map(h => Number(h.price) || 0), 1000);

  // Persist filter state in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hotelFilters');
    if (saved) {
      const parsed = JSON.parse(saved);
      setPriceRange(parsed.priceRange || [minPrice, maxPrice]);
      setStarRatings(parsed.starRatings || []);
      setAmenities(parsed.amenities || []);
      setOnlyAvailable(parsed.onlyAvailable || false);
      setSortBy(parsed.sortBy || 'price-asc');
    }
    // eslint-disable-next-line
  }, []);
  useEffect(() => {
    localStorage.setItem('hotelFilters', JSON.stringify({ priceRange, starRatings, amenities, onlyAvailable, sortBy }));
  }, [priceRange, starRatings, amenities, onlyAvailable, sortBy]);

  // Load more items when the load more div comes into view
  useEffect(() => {
    if (inView && hasMore && !loading) {
      setPage(p => p + 1);
    }
  }, [inView, hasMore, loading]);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setOffers([]);
    setExpanded(null);
    setSource(undefined);
    setPage(1);
    setHasMore(true);
    try {
      const params = new URLSearchParams({
        cityCode,
        checkIn,
        checkOut,
        adults: adults.toString(),
      });
      const res = await fetch(`/api/hotels?${params.toString()}`);
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch hotels');
      setOffers(data.offers || []);
      setSource(data.source);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtering logic
  const filteredOffers = offers.filter(h => {
    const price = Number(h.price) || 0;
    const rating = h.rating || 0;
    const hasAmenity = (a: string) => (h.amenities || []).includes(a);
    const available = !onlyAvailable || (h.rooms && h.rooms.some(r => r.availability));
    return (
      price >= priceRange[0] && price <= priceRange[1] &&
      (starRatings.length === 0 || starRatings.includes(Math.round(rating))) &&
      (amenities.length === 0 || amenities.every(a => hasAmenity(a))) &&
      available
    );
  });
  // Sorting logic
  const sortedOffers = [...filteredOffers].sort((a, b) => {
    if (sortBy === 'price-asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
    if (sortBy === 'price-desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
    if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'rating-asc') return (a.rating || 0) - (b.rating || 0);
    return 0;
  });

  // Helper: count active filters
  const activeFilterCount = [
    priceRange[0] > minPrice || priceRange[1] < maxPrice,
    starRatings.length > 0,
    amenities.length > 0,
    onlyAvailable
  ].filter(Boolean).length;

  // Helper: reset all filters
  const clearAllFilters = () => {
    setPriceRange([minPrice, maxPrice]);
    setStarRatings([]);
    setAmenities([]);
    setOnlyAvailable(false);
  };

  // Map locations for hotels (with full hotel data for popups)
  const hotelMapLocations = sortedOffers
    .filter(h => h.location && typeof h.location.lat === 'number' && typeof h.location.lng === 'number')
    .map(h => ({
      name: h.name,
      description: h.address || h.description || '',
      lat: h.location!.lat,
      lng: h.location!.lng,
      price: h.price,
      imageUrl: h.imageUrl,
      id: h.name, // Use name as id for now
      hotel: h,
    }));

  // Helper: Fit map to markers
  function FitBounds({ locations }: { locations: typeof hotelMapLocations }) {
    const map = useMap();
    React.useEffect(() => {
      if (locations.length === 0) return;
      const bounds = L.latLngBounds(locations.map(l => [l.lat, l.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }, [locations, map]);
    return null;
  }

  // Add/remove hotel for comparison
  const toggleCompare = (hotelName: string) => {
    setCompare(prev =>
      prev.includes(hotelName)
        ? prev.filter(n => n !== hotelName)
        : prev.length < 3 ? [...prev, hotelName] : prev
    );
  };
  const clearCompare = () => setCompare([]);
  const removeCompare = (hotelName: string) => setCompare(prev => prev.filter(n => n !== hotelName));

  // Get hotel data for comparison
  const compareHotels = sortedOffers.filter(h => compare.includes(h.name));

  // Close comparison modal on Esc key
  useReactEffect(() => {
    if (!compareOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCompareOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [compareOpen]);

  // Pagination logic
  const paginatedOffers = sortedOffers.slice(0, page * ITEMS_PER_PAGE);
  useEffect(() => {
    setHasMore(paginatedOffers.length < sortedOffers.length);
  }, [paginatedOffers.length, sortedOffers.length]);

  // Scroll reveal wrapper for hotel cards
  const ScrollRevealCard: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
    const ref = useScrollReveal('animate-fade-in-up', delay) as React.RefObject<HTMLDivElement>;
    return (
      <div ref={ref}>
        {children}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex flex-col items-center justify-start py-12 px-2 space-y-8">
        {/* Search Card */}
        <div className="w-full max-w-4xl mx-auto mb-8">
          <div className="rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl p-8 transition-all duration-300 ease-in-out animate-slide-in-left">
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* City Code */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none">
                  <Filter className="h-5 w-5" />
                </span>
                <Input
                  placeholder="City Code (e.g. PAR)"
                  value={cityCode}
                  onChange={e => setCityCode(e.target.value.toUpperCase())}
                  className="w-full pl-10 bg-transparent border border-white/20 text-white placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-base tracking-wide h-12"
                  aria-label="City Code"
                />
              </div>
              {/* Check-in Date */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none">
                  <Calendar className="h-5 w-5" />
                </span>
                <Input
                  type="date"
                  placeholder="Check-in"
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                  className="w-full pl-10 bg-transparent border border-white/20 text-white placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-base tracking-wide h-12"
                  aria-label="Check-in Date"
                />
              </div>
              {/* Check-out Date */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none">
                  <Calendar className="h-5 w-5" />
                </span>
                <Input
                  type="date"
                  placeholder="Check-out"
                  value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                  className="w-full pl-10 bg-transparent border border-white/20 text-white placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-base tracking-wide h-12"
                  aria-label="Check-out Date"
                />
              </div>
              {/* Number of Adults */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none">
                  <Users className="h-5 w-5" />
                </span>
                <Input
                  type="number"
                  min={1}
                  placeholder="Adults"
                  value={adults}
                  onChange={e => setAdults(Number(e.target.value))}
                  className="w-full pl-10 bg-transparent border border-white/20 text-white placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-base tracking-wide h-12"
                  aria-label="Number of Adults"
                />
              </div>
            </form>
            <Button
              className="mt-8 w-full bg-white text-black hover:bg-gray-100 hover:animate-scale rounded-lg px-4 py-2 shadow-md transition-colors duration-200 text-base font-semibold flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white active:scale-95 tracking-wide"
              onClick={handleSearch}
              disabled={loading}
              aria-label="Search Hotels"
              type="button"
            >
              <Search className="h-5 w-5" />
              {loading ? (
                <span className="flex items-center justify-center"><Loader2 className="animate-rotate mr-2 h-4 w-4" />Searching...</span>
              ) : 'Search Hotels'}
            </Button>
            {error && <div className="text-red-500 mt-2 text-center text-sm tracking-wide" aria-live="polite">{error}</div>}
          </div>
        </div>
        {/* Filter Bar */}
        <div className="w-full max-w-5xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Filter Controls */}
            <div className="flex flex-col gap-6">
              {/* Price Range */}
              <div className="flex flex-col items-start space-y-2">
                <label className="block text-sm font-medium text-gray-300 flex items-center gap-1"><DollarSign className="h-4 w-4" /> Price</label>
                <div className="flex items-center gap-3 w-full">
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={priceRange[0]}
                    onChange={e => setPriceRange([Math.min(Number(e.target.value), priceRange[1]), priceRange[1]])}
                    className="w-20 accent-white h-2"
                    aria-label="Minimum price"
                  />
                  <span className="text-sm text-gray-300">${priceRange[0]}</span>
                  <span className="text-sm text-gray-500">-</span>
                  <span className="text-sm text-gray-300">${priceRange[1]}</span>
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={priceRange[1]}
                    onChange={e => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0])])}
                    className="w-20 accent-white h-2"
                    aria-label="Maximum price"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 w-full">
                  <span>${minPrice}</span>
                  <span>${maxPrice}</span>
                </div>
              </div>
              {/* Star Rating */}
              <div className="flex flex-col items-start space-y-2">
                <label className="block text-sm font-medium text-gray-300 flex items-center gap-1"><Star className="h-4 w-4 text-white" /> Stars</label>
                <div className="flex gap-2">
                  {[5,4,3,2,1].map(star => (
                    <label key={star} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={starRatings.includes(star)}
                        onChange={e => setStarRatings(e.target.checked ? [...starRatings, star] : starRatings.filter(s => s !== star))}
                        className="appearance-none h-4 w-4 border border-white rounded bg-black checked:bg-white checked:border-white focus:outline-none focus:ring-2 focus:ring-white transition-all duration-200"
                        aria-label={`${star} star`}
                      />
                      <span className="text-white text-base tracking-wide">{'★'.repeat(star)}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Amenities Dropdown & Chips */}
              <div className="flex flex-col items-start space-y-2">
                <label className="block text-sm font-medium text-gray-300 flex items-center gap-1"><Sliders className="h-4 w-4" /> Amenities</label>
                <select
                  multiple
                  value={amenities}
                  onChange={e => setAmenities(Array.from(e.target.selectedOptions, o => o.value))}
                  className="bg-black/40 text-white rounded px-2 py-1 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white text-sm tracking-wide max-h-32 overflow-y-auto"
                  aria-label="Select amenities"
                >
                  {allAmenities.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {/* Amenity chips */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {amenities.map(a => (
                    <span key={a} className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-medium shadow-inner border border-white/20">
                      {a}
                      <button
                        className="ml-1 text-white/70 hover:text-white focus:outline-none"
                        onClick={() => setAmenities(amenities.filter(am => am !== a))}
                        aria-label={`Remove ${a}`}
                        tabIndex={0}
                      >×</button>
                    </span>
                  ))}
                </div>
              </div>
              {/* Availability Checkbox */}
              <div className="flex flex-col items-start space-y-2">
                <label className="block text-sm font-medium text-gray-300 flex items-center gap-1"><Filter className="h-4 w-4" /> Only Available</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={e => setOnlyAvailable(e.target.checked)}
                    className="appearance-none h-4 w-4 border border-white rounded bg-black checked:bg-white checked:border-white focus:outline-none focus:ring-2 focus:ring-white transition-all duration-200"
                    aria-label="Only show available hotels"
                  />
                  <span className="text-xs text-white">Show only available</span>
                </label>
              </div>
            </div>
            {/* Sort & Clear All Row */}
            <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-1 justify-end items-end">
              <div className="flex flex-row gap-4 w-full justify-end">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1"><Sliders className="h-4 w-4" /> Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as typeof sortBy)}
                    className="bg-white text-black rounded-lg px-4 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-white shadow-md transition-colors duration-200 text-sm tracking-wide"
                    aria-label="Sort hotels"
                  >
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating-desc">Rating: High to Low</option>
                    <option value="rating-asc">Rating: Low to High</option>
                  </select>
                </div>
                <button
                  className="bg-white text-black hover:bg-gray-100 rounded-lg px-4 py-2 shadow-md transition-colors duration-200 font-semibold border border-black focus:outline-none focus:ring-2 focus:ring-white active:scale-95 animate-fade-in text-sm tracking-wide"
                  onClick={clearAllFilters}
                  aria-label="Clear all filters"
                  type="button"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Mobile filters modal */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in-up">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative animate-fade-in-up">
              <button onClick={() => setFiltersOpen(false)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" aria-label="Close filters">&times;</button>
              <h3 className="text-lg font-bold mb-2">Filters {activeFilterCount > 0 && <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">{activeFilterCount}</span>}</h3>
              {/* Price range */}
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-400">Price</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={priceRange[0]}
                    onChange={e => setPriceRange([Math.min(Number(e.target.value), priceRange[1]), priceRange[1]])}
                    className="w-20"
                    aria-label="Minimum price"
                  />
                  <span className="text-xs text-gray-300">${priceRange[0]}</span>
                  <span className="text-xs text-gray-400">-</span>
                  <span className="text-xs text-gray-300">${priceRange[1]}</span>
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={priceRange[1]}
                    onChange={e => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0])])}
                    className="w-20"
                    aria-label="Maximum price"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>${minPrice}</span>
                  <span>${maxPrice}</span>
                </div>
              </div>
              {/* Star rating */}
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-400">Stars</label>
                <div className="flex gap-1">
                  {[5,4,3,2,1].map(star => (
                    <label key={star} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={starRatings.includes(star)}
                        onChange={e => setStarRatings(e.target.checked ? [...starRatings, star] : starRatings.filter(s => s !== star))}
                        className="accent-yellow-400"
                        aria-label={`${star} star`}
                      />
                      <span className="text-yellow-400">{'★'.repeat(star)}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Amenities */}
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-400">Amenities</label>
                <select
                  multiple
                  value={amenities}
                  onChange={e => setAmenities(Array.from(e.target.selectedOptions, o => o.value))}
                  className="bg-gray-800 text-white rounded px-2 py-1 w-full"
                  aria-label="Select amenities"
                >
                  {allAmenities.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {/* Amenity chips */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {amenities.map(a => (
                    <span key={a} className="bg-blue-900 text-blue-200 px-2 py-0.5 rounded text-xs flex items-center">
                      {a}
                      <button
                        className="ml-1 text-blue-300 hover:text-white focus:outline-none"
                        onClick={() => setAmenities(amenities.filter(am => am !== a))}
                        aria-label={`Remove ${a}`}
                        tabIndex={0}
                      >×</button>
                    </span>
                  ))}
                </div>
              </div>
              {/* Availability */}
              <label className="flex items-center gap-1 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={e => setOnlyAvailable(e.target.checked)}
                  className="accent-green-400"
                  aria-label="Only show available hotels"
                />
                <span className="text-xs text-gray-400">Only available</span>
                {onlyAvailable && <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-1.5">1</span>}
              </label>
              {/* Clear All */}
              <button
                className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-2 rounded font-semibold transition mt-2"
                onClick={clearAllFilters}
                aria-label="Clear all filters"
                type="button"
              >
                Clear All
              </button>
              <button className="w-full bg-blue-600 text-white py-2 rounded mt-2 font-semibold" onClick={() => setFiltersOpen(false)} aria-label="Apply filters">Apply Filters</button>
            </div>
          </div>
        )}
        {/* View mode toggle */}
        <div className="flex justify-end mb-2 gap-2">
          <button
            className={`px-3 py-1 rounded font-semibold transition border ${viewMode === 'list' ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-800 text-gray-200 border-gray-700'} focus:outline-none focus:ring-2 focus:ring-blue-400`}
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            aria-label="Show hotel list view"
          >
            List
          </button>
          <button
            className={`px-3 py-1 rounded font-semibold transition border ${viewMode === 'map' ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-800 text-gray-200 border-gray-700'} focus:outline-none focus:ring-2 focus:ring-blue-400`}
            onClick={() => setViewMode('map')}
            aria-pressed={viewMode === 'map'}
            aria-label="Show hotel map view"
          >
            Map
          </button>
        </div>
        {/* Sticky compare bar */}
        {compare.length >= 2 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-gray-900 shadow-lg rounded-full flex items-center gap-2 px-4 py-2 animate-slide-in-right border border-gray-300 dark:border-gray-700">
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">Compare:</span>
            {compareHotels.map(h => (
              <span key={h.name} className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 rounded px-2 py-1 text-xs font-medium">
                {h.name}
                <button onClick={() => removeCompare(h.name)} aria-label={`Remove ${h.name} from comparison`} className="ml-1 text-gray-500 hover:text-red-500">×</button>
              </span>
            ))}
            <button
              className="ml-2 bg-blue-600 hover:bg-blue-700 hover:animate-wiggle text-white px-4 py-1 rounded-full font-semibold transition"
              onClick={() => setCompareOpen(true)}
            >Compare</button>
            <button
              className="ml-1 text-xs text-gray-400 hover:text-red-500 underline"
              onClick={clearCompare}
            >Clear</button>
          </div>
        )}
        {/* Recently Viewed Section */}
        <RecentlyViewed />
        {/* Results: List or Map */}
        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
            {loading && page === 1 && (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <HotelCardSkeleton />
                  </div>
                ))}
              </>
            )}
            {!loading && paginatedOffers.length === 0 && !error && (
              <div className="text-center text-gray-500 col-span-full">No hotels found. Try adjusting your filters.</div>
            )}
            {!loading && paginatedOffers.map((offer, idx) => (
              <ScrollRevealCard key={idx} delay={idx * 60}>
                <div
                  className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 shadow-md shadow-white/10 transition-transform duration-300 ease-in-out hover:scale-[1.02] focus-within:ring-2 focus-within:ring-white group cursor-pointer"
                  tabIndex={0}
                  aria-label={`View details for ${offer.name}`}
                  onClick={e => {
                    if ((e.target as HTMLElement).closest('.favorite-btn, .compare-toggle')) return;
                    navigate(`/hotel/${encodeURIComponent(offer.name)}`, { state: { hotel: { ...offer, source } } });
                  }}
                >
                  {/* Hotel Image */}
                  {offer.imageUrl || (offer.images && offer.images[0]) ? (
                    <img
                      src={offer.imageUrl || offer.images?.[0]}
                      alt={offer.name}
                      className="w-full aspect-[3/2] object-cover rounded-xl mb-4 bg-black/20"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-[3/2] rounded-xl mb-4 bg-black/30 flex items-center justify-center text-gray-500 text-lg">No image</div>
                  )}
                  {/* Favorite Icon */}
                  <button
                    className={`favorite-btn absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-white/10 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-white ${favorites.includes(offer.name) ? 'scale-110 animate-bounce' : ''}`}
                    aria-label={favorites.includes(offer.name) ? 'Remove from favorites' : 'Add to favorites'}
                    onClick={e => { e.stopPropagation(); toggleFavorite(offer.name); }}
                    tabIndex={0}
                  >
                    <Heart
                      className={`h-7 w-7 ${favorites.includes(offer.name) ? 'fill-white text-white' : 'text-gray-400 group-hover:text-white'}`}
                      fill={favorites.includes(offer.name) ? '#fff' : 'none'}
                    />
                  </button>
                  {/* Info Section */}
                  <div className="flex flex-col gap-2">
                    <div className="text-white font-semibold text-lg md:text-xl truncate" title={offer.name}>{offer.name}</div>
                    <div className="text-white/80 text-sm">{offer.price ? `$${offer.price}` : 'N/A'}</div>
                    {offer.rating && (
                      <div className="flex items-center gap-1 text-yellow-400 text-sm">
                        <span>{'★'.repeat(Math.round(offer.rating))}</span>
                        <span className="text-white/80 ml-1">{offer.rating}</span>
                      </div>
                    )}
                    {offer.amenities && offer.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {offer.amenities.slice(0, 6).map((a, i) => (
                          <span key={i} className="px-3 py-1 bg-white/10 text-white text-xs rounded-full font-medium shadow-inner border border-white/20">{a}</span>
                        ))}
                        {offer.amenities.length > 6 && <span className="text-xs text-gray-400">+{offer.amenities.length - 6} more</span>}
                      </div>
                    )}
                  </div>
                  {/* Compare Toggle */}
                  <div className="flex justify-end mt-4">
                    <label className="flex items-center gap-2 cursor-pointer compare-toggle select-none">
                      <input
                        type="checkbox"
                        checked={compare.includes(offer.name)}
                        onChange={e => { e.stopPropagation(); toggleCompare(offer.name); }}
                        className="sr-only peer"
                        aria-label={compare.includes(offer.name) ? 'Remove from comparison' : 'Add to comparison'}
                        tabIndex={0}
                      />
                      <div className="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-white transition duration-300 relative">
                        <div className="w-4 h-4 bg-white absolute top-0.5 left-0.5 rounded-full transition peer-checked:translate-x-5"></div>
                      </div>
                      <span className="text-xs text-white">Compare</span>
                    </label>
                  </div>
                </div>
              </ScrollRevealCard>
            ))}
            {/* Load more trigger */}
            {hasMore && (
              <div
                ref={loadMoreRef}
                className="col-span-full flex justify-center p-4"
              >
                {loading && page > 1 && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                    <span className="text-white">Loading more...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-[500px] rounded-lg overflow-hidden mb-4">
            {hotelMapLocations.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center p-4">
                  <div className="text-gray-500 text-lg mb-2">📍 No hotel locations to display</div>
                  <div className="text-gray-600">Try adjusting your filters or search for a different city.</div>
                </div>
              </div>
            ) : (
              <MapContainer
                center={[hotelMapLocations[0].lat, hotelMapLocations[0].lng]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                className="rounded-lg shadow-lg animate-fade-in-up"
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <FitBounds locations={hotelMapLocations} />
                <MarkerClusterGroup
                  chunkedLoading
                  iconCreateFunction={cluster => {
                    // Get all markers in the cluster
                    const markers = cluster.getAllChildMarkers();
                    // Compute average rating
                    let sum = 0, count = 0;
                    markers.forEach(m => {
                      const rating = m.options?.hotel?.rating || m.options?.hotel?.hotel?.rating;
                      if (typeof rating === 'number') { sum += rating; count++; }
                    });
                    const avgRating = count > 0 ? sum / count : 0;
                    let color = '#fbbf24'; // yellow
                    if (avgRating >= 4.5) color = '#22c55e'; // green
                    else if (avgRating > 0 && avgRating < 3) color = '#ef4444'; // red
                    // Custom HTML for cluster icon
                    return L.divIcon({
                      html: `<div style="background:${color};color:#fff;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1rem;box-shadow:0 2px 8px #0002;outline:2px solid #fff;outline-offset:2px;" aria-label="${cluster.getChildCount()} hotels, average rating ${avgRating.toFixed(1)}">${cluster.getChildCount()}</div>`,
                      className: 'custom-cluster-icon',
                      iconSize: [40, 40],
                      iconAnchor: [20, 20]
                    });
                  }}
                >
                  {hotelMapLocations.map((location, idx) => {
                    const markerOptions: Record<string, unknown> = { hotel: location.hotel };
                    return (
                      <Marker key={location.id || idx} position={[location.lat, location.lng]} {...markerOptions}>
                        <Popup autoPan className="animate-fade-in-up">
                          <div className="p-2 min-w-[180px] max-w-[220px] relative">
                            {location.imageUrl && (
                              <img src={location.imageUrl} alt={location.name} className="w-full h-20 object-cover rounded mb-2" loading="lazy" />
                            )}
                            <div className="font-bold text-base mb-1">{location.name}</div>
                            <div className="text-xs text-gray-500 mb-1">{location.description}</div>
                            {location.price && <div className="text-green-600 font-semibold mb-1">${location.price}</div>}
                            {/* Favorite heart icon in popup */}
                            <button
                              className={`favorite-btn absolute top-2 right-2 z-10 p-1 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-black/60 hover:bg-pink-100/20 ${favorites.includes(location.name) ? 'scale-110' : 'opacity-70'}`}
                              aria-label={favorites.includes(location.name) ? 'Remove from favorites' : 'Add to favorites'}
                              onClick={e => { e.stopPropagation(); toggleFavorite(location.name); }}
                              tabIndex={0}
                            >
                              <Heart
                                className={`h-6 w-6 transition-all duration-200 ${favorites.includes(location.name) ? 'fill-pink-500 text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
                                fill={favorites.includes(location.name) ? '#ec4899' : 'none'}
                              />
                            </button>
                            {/* Compare checkbox/button in popup */}
                            <button
                              className={`compare-btn absolute top-2 left-2 z-10 p-1 rounded-full border-2 border-blue-400 bg-white/80 dark:bg-gray-900/80 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 ${compare.includes(location.name) ? 'scale-110 border-blue-600' : 'opacity-70'}`}
                              aria-label={compare.includes(location.name) ? 'Remove from comparison' : 'Add to comparison'}
                              onClick={e => { e.stopPropagation(); toggleCompare(location.name); }}
                              tabIndex={0}
                            >
                              <span className={`block w-4 h-4 rounded-full border-2 ${compare.includes(location.name) ? 'bg-blue-500 border-blue-600' : 'border-blue-400 bg-white dark:bg-gray-900'}`}></span>
                            </button>
                            <button
                              className="mt-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold transition w-full"
                              onClick={() => navigate(`/hotel/${encodeURIComponent(location.name)}`, { state: { hotel: location.hotel, source } })}
                            >
                              View Details
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MarkerClusterGroup>
              </MapContainer>
            )}
          </div>
        )}
        {/* Comparison Modal */}
        {compareOpen && (
          <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in-up">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-5xl w-full overflow-x-auto relative animate-fade-in-up">
                <button onClick={() => setCompareOpen(false)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl" aria-label="Close comparison">&times;</button>
                <button onClick={clearCompare} className="absolute top-2 left-2 text-xs text-gray-400 hover:text-red-500 underline" aria-label="Clear all comparisons">Clear All</button>
                <h2 className="text-2xl font-bold mb-4 text-center">Compare Hotels</h2>
                {/* Sticky header row */}
                <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 flex gap-4 border-b border-gray-300 dark:border-gray-700 pb-2 mb-2">
                  <div className="min-w-[260px] max-w-xs font-semibold text-gray-700 dark:text-gray-200 text-sm text-center">Image</div>
                  <div className="min-w-[260px] max-w-xs font-semibold text-gray-700 dark:text-gray-200 text-sm text-center">Name</div>
                  <div className="min-w-[260px] max-w-xs font-semibold text-gray-700 dark:text-gray-200 text-sm text-center">Price</div>
                  <div className="min-w-[260px] max-w-xs font-semibold text-gray-700 dark:text-gray-200 text-sm text-center">Rating</div>
                  <div className="min-w-[260px] max-w-xs font-semibold text-gray-700 dark:text-gray-200 text-sm text-center">Amenities</div>
                  <div className="min-w-[260px] max-w-xs font-semibold text-gray-700 dark:text-gray-200 text-sm text-center">Reviews</div>
                  <div className="min-w-[260px] max-w-xs font-semibold text-gray-700 dark:text-gray-200 text-sm text-center">Location</div>
                  <div className="min-w-[80px] max-w-[80px]" />
                </div>
                {/* Find best price and rating for highlight */}
                {(() => {
                  const prices = compareHotels.map(h => Number(h.price) || Infinity);
                  const minPrice = Math.min(...prices);
                  const ratings = compareHotels.map(h => h.rating || 0);
                  const maxRating = Math.max(...ratings);
                  return (
                    <div className="flex gap-4 overflow-x-auto animate-fade-in-up">
                      {compareHotels.map((hotel, idx) => (
                        <div key={hotel.name} className="min-w-[260px] max-w-xs bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex-shrink-0 relative border border-gray-300 dark:border-gray-700 group focus-within:ring-2 focus-within:ring-blue-400 transition-all duration-300">
                          {/* Image */}
                          <div className="mb-2 flex justify-center">
                            {hotel.images && hotel.images.length > 0 ? (
                              <img src={hotel.images[0]} alt={hotel.name} className="w-32 h-20 object-cover rounded shadow" />
                            ) : hotel.imageUrl ? (
                              <img src={hotel.imageUrl} alt={hotel.name} className="w-32 h-20 object-cover rounded shadow" />
                            ) : (
                              <div className="w-32 h-20 flex items-center justify-center bg-gray-200 rounded text-gray-500">No image</div>
                            )}
                          </div>
                          {/* Name */}
                          <div className="font-bold text-base mb-1 text-center text-gray-900 dark:text-white">{hotel.name}</div>
                          {/* Price */}
                          <div className="text-center mb-1">
                            {hotel.price ? (
                              <span className={`font-semibold text-lg ${Number(hotel.price) === minPrice ? 'text-green-600 bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded' : 'text-gray-800 dark:text-gray-200'}`}>${hotel.price}
                                {Number(hotel.price) === minPrice && <span className="ml-1 text-xs font-bold text-green-700 dark:text-green-300">Best</span>}
                              </span>
                            ) : <span className="text-gray-400">N/A</span>}
                          </div>
                          {/* Rating */}
                          <div className="text-center mb-1">
                            {hotel.rating ? (
                              <span className={`font-semibold text-lg ${hotel.rating === maxRating ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900 px-2 py-0.5 rounded' : 'text-gray-800 dark:text-gray-200'}`}>{hotel.rating} ★
                                {hotel.rating === maxRating && <span className="ml-1 text-xs font-bold text-yellow-700 dark:text-yellow-300">Top</span>}
                              </span>
                            ) : <span className="text-gray-400">N/A</span>}
                          </div>
                          {/* Amenities */}
                          <div className="mb-1 text-center">
                            {hotel.amenities && hotel.amenities.length > 0 ? (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {hotel.amenities.slice(0, 6).map((a, i) => (
                                  <span key={i} className="bg-blue-900 text-blue-200 px-2 py-0.5 rounded text-xs">{a}</span>
                                ))}
                                {hotel.amenities.length > 6 && <span className="text-xs text-gray-400">+{hotel.amenities.length - 6} more</span>}
                              </div>
                            ) : <span className="text-gray-400">N/A</span>}
                          </div>
                          {/* Reviews */}
                          <div className="mb-1 text-xs text-gray-600 dark:text-gray-300 max-h-20 overflow-y-auto text-center">
                            {hotel.reviews && hotel.reviews.length > 0 ? (
                              hotel.reviews.slice(0, 2).map((r, i) => (
                                <div key={i} className="mb-1">{r.username}: <span className="text-yellow-500">{'★'.repeat(r.rating)}</span> {r.comment}</div>
                              ))
                            ) : <span className="text-gray-400">No reviews</span>}
                          </div>
                          {/* Location */}
                          <div className="mb-1 text-xs text-gray-500 text-center">{hotel.location ? `Lat: ${hotel.location.lat}, Lng: ${hotel.location.lng}` : 'N/A'}</div>
                          {/* Remove button */}
                          <button
                            className="mt-2 w-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded py-1 text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-800 transition"
                            onClick={() => removeCompare(hotel.name)}
                            aria-label={`Remove ${hotel.name} from comparison`}
                          >Remove</button>
                        </div>
          ))}
        </div>
                  );
                })()}
              </div>
            </div>
          </Dialog>
        )}
        {source && (
          <div className="text-xs text-gray-400 mt-2">Data source: {source}</div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default HotelSearch; 