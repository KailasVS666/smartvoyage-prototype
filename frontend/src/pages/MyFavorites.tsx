import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Heart, ArrowUp, Star } from 'lucide-react';
import { toast } from "../components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { getUserFavorites, setUserFavorites, addFavorite, removeFavorite } from "../services/favoriteService";

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

const CATEGORY_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Luxury', value: 'Luxury' },
  { label: 'Budget', value: 'Budget' },
  { label: 'Pet-Friendly', value: 'Pet-Friendly' },
  { label: 'Family', value: 'Family' },
  { label: 'Spa', value: 'Spa' },
  { label: 'Airport Shuttle', value: 'Airport Shuttle' },
];

const MyFavorites: React.FC = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteHotels, setFavoriteHotels] = useState<HotelOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showScroll, setShowScroll] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    async function loadFavorites() {
      setLoading(true);
      if (user) {
        try {
          const favs = await getUserFavorites(user.uid);
          setFavorites(favs);
        } catch (err) {
          toast({ title: "Error loading favorites", description: "Could not load your favorites from the cloud.", variant: "destructive" });
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
      setLoading(false);
    }
    loadFavorites();
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    async function fetchHotels() {
      setLoading(true);
      // Try to fetch all hotels for the current city (or all cities if needed)
      // For demo, fetch Paris, NYC, London and filter by favorites
      const cityCodes = ['PAR', 'NYC', 'LON'];
      let hotels: HotelOffer[] = [];
      for (const cityCode of cityCodes) {
        try {
          const res = await fetch(`/api/hotels?cityCode=${cityCode}&checkIn=2024-12-01&checkOut=2024-12-02&adults=1`);
          const data = await res.json();
          if (Array.isArray(data.offers)) {
            hotels = hotels.concat(data.offers);
          }
        } catch (err) {
          toast({
            title: "Error fetching hotels",
            description: `Could not load hotels for city code ${cityCode}`,
            variant: "destructive",
          });
        }
      }
      setFavoriteHotels(hotels.filter(h => favorites.includes(h.name)));
      setLoading(false);
    }
    if (favorites.length > 0) fetchHotels();
    else setLoading(false);
  }, [favorites]);

  const removeFavoriteHandler = async (hotelName: string) => {
    if (user) {
      try {
        await removeFavorite(user.uid, hotelName);
        setFavorites(favs => favs.filter(f => f !== hotelName));
        setFavoriteHotels(favoriteHotels.filter(h => h.name !== hotelName));
        toast({ title: "Removed from Favorites", description: `${hotelName} has been removed from your favorites.` });
      } catch {
        toast({ title: "Error", description: "Failed to remove favorite from the cloud.", variant: "destructive" });
      }
    } else {
      const newFavs = favorites.filter(f => f !== hotelName);
      setFavorites(newFavs);
      localStorage.setItem('hotelFavorites', JSON.stringify(newFavs));
      setFavoriteHotels(favoriteHotels.filter(h => h.name !== hotelName));
      toast({ title: "Removed from Favorites", description: `${hotelName} has been removed from your favorites.` });
    }
  };

  // Scroll-to-top FAB visibility
  useEffect(() => {
    const onScroll = () => setShowScroll(window.scrollY > 200);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Filtered hotels by search and category
  const filteredHotels = favoriteHotels.filter(hotel => {
    const matchesSearch = hotel.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || (hotel.amenities && hotel.amenities.some(a => a.toLowerCase().includes(category.toLowerCase())));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 max-w-5xl mx-auto space-y-8">
      {/* Sticky Glassmorphic Navigation Bar */}
      <nav className="backdrop-blur-md bg-black/60 border-b border-white/10 shadow-md z-50 sticky top-0 flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg tracking-wide">SmartVoyage</span>
        </div>
        <div className="flex gap-6 items-center">
          <a href="/" className="text-white hover:text-gray-300 text-sm md:text-base transition-colors">Home</a>
          <a href="/explore" className="text-white hover:text-gray-300 text-sm md:text-base transition-colors">Explore</a>
          <a href="/plan" className="text-white hover:text-gray-300 text-sm md:text-base transition-colors">Planner</a>
          <a href="/my-favorites" className="text-white font-bold underline underline-offset-4 text-sm md:text-base transition-colors">My Favorites</a>
          <a href="/about" className="text-white hover:text-gray-300 text-sm md:text-base transition-colors">About</a>
          <button className="text-white hover:text-gray-300 text-sm md:text-base transition-colors">Logout</button>
        </div>
      </nav>
      {/* Heading Section */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-semibold text-white tracking-wide mb-1">My Favorite Hotels</h1>
            <div className="text-sm text-gray-400 mb-1">Here are the stays you've marked as favorites – curated for your next trip.</div>
            <div className="text-sm text-white/80 flex items-center gap-2">✨ <span className="font-semibold">{favoriteHotels.length}</span> favorite{favoriteHotels.length === 1 ? '' : 's'} saved</div>
          </div>
          {favoriteHotels.length > 0 && (
            <button
              className="rounded-md bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-sm transition-all ring-1 ring-transparent hover:ring-white focus:ring-2 focus:ring-white focus:outline-none"
              onClick={() => {
                if (user) {
                  setFavorites([]);
                  setFavoriteHotels([]);
                  setUserFavorites(user.uid, []).then(() => {
                    toast({ title: "All Favorites Cleared", description: "Your favorite hotels list is now empty." });
                  }).catch(() => {
                    toast({ title: "Error", description: "Failed to clear favorites from the cloud.", variant: "destructive" });
                  });
                } else {
                  setFavorites([]);
                  localStorage.setItem('hotelFavorites', '[]');
                  setFavoriteHotels([]);
                  toast({ title: "All Favorites Cleared", description: "Your favorite hotels list is now empty." });
                }
              }}
              aria-label="Clear all favorites"
            >
              Clear All Favorites
            </button>
          )}
        </div>
        {/* Filter/Search Bar */}
        {favoriteHotels.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 animate-fade-in">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search favorites by hotel name..."
              className="bg-white/5 border border-white/10 backdrop-blur-md rounded-md px-4 py-2 w-full md:w-1/2 text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-white transition"
              aria-label="Search favorites"
            />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="text-sm bg-black text-white border border-white/10 rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-white transition"
              aria-label="Filter by category"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
      </section>
      {/* Hotel Cards or Empty State */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading favorites...</div>
      ) : filteredHotels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 animate-fade-in space-y-4">
          <span className="text-4xl text-white/30">💔</span>
          <div className="text-gray-400 text-center text-lg">You haven't added any favorites yet.</div>
          <a href="/explore" className="text-blue-400 underline hover:text-blue-300 transition text-sm">Start exploring hotels now →</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHotels.map((hotel, idx) => (
            <div
              key={idx}
              className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-md shadow-white/10 p-4 transition-transform hover:scale-[1.02] hover:shadow-white/20 animate-fade-in flex flex-col justify-between h-full group cursor-pointer focus-within:ring-2 focus-within:ring-white"
              tabIndex={0}
              aria-label={`View details for ${hotel.name}`}
              onClick={e => {
                if ((e.target as HTMLElement).closest('.favorite-btn, .compare-toggle')) return;
                navigate(`/hotel/${encodeURIComponent(hotel.name)}`, { state: { hotel } });
              }}
            >
              {/* Hotel Image */}
              {hotel.imageUrl || (hotel.images && hotel.images[0]) ? (
                <img
                  src={hotel.imageUrl || hotel.images?.[0]}
                  alt={hotel.name}
                  className="w-full aspect-video object-cover rounded-xl mb-4 bg-black/20"
                  loading="lazy"
                />
              ) : null}
              {/* Heart Icon */}
              <button
                className="favorite-btn absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-white/10 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-white scale-110"
                aria-label="Toggle Favorite"
                onClick={e => { e.stopPropagation(); removeFavoriteHandler(hotel.name); }}
                tabIndex={0}
              >
                <span className="relative block">
                  <Heart className="h-7 w-7 fill-pink-500 text-pink-500 transition-transform duration-200" fill="#ec4899" />
                  {/* Animate ping on remove */}
                  <span className="absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-40 animate-ping top-0 left-0 pointer-events-none" style={{ display: 'none' }}></span>
                </span>
              </button>
              {/* Hotel Info */}
              <div className="flex flex-col gap-2 flex-1">
                <div className="text-white font-semibold text-base md:text-lg truncate" title={hotel.name}>{hotel.name}</div>
                {hotel.rating && (
                  <div className="flex items-center gap-1 text-yellow-400 text-sm">
                    <Star className="h-4 w-4" />
                    <span>{hotel.rating}</span>
                  </div>
                )}
                {hotel.address && <div className="text-gray-400 text-sm truncate">{hotel.address}</div>}
                <div className="text-white font-bold text-lg mt-1">{hotel.price ? `$${hotel.price}` : 'N/A'}</div>
                {/* Amenities badges (optional) */}
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {hotel.amenities.slice(0, 4).map((a, i) => (
                      <span key={i} className="bg-white/10 text-white text-xs px-2 py-1 rounded-full tracking-wide">{a}</span>
                    ))}
                  </div>
                )}
              </div>
              {/* Compare Toggle (Optional, UI only) */}
              <div className="flex justify-end mt-4">
                <label className="flex items-center gap-2 cursor-pointer compare-toggle select-none">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    aria-label="Add to comparison"
                    tabIndex={0}
                    readOnly
                  />
                  <div className="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-white transition duration-300 relative">
                    <div className="w-4 h-4 bg-white absolute top-0.5 left-0.5 rounded-full transition peer-checked:translate-x-5"></div>
                  </div>
                  <span className="text-xs text-white">Compare</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Scroll to Top FAB */}
      {showScroll && (
        <button
          className="fixed bottom-6 right-6 z-50 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full shadow-lg transition focus:outline-none focus:ring-2 focus:ring-white animate-fade-in"
          aria-label="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default MyFavorites; 