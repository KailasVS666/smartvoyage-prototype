import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserFavorites, addFavorite, removeFavorite } from '../services/favoriteService';
import { toast } from './ui/use-toast';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface HotelOffer {
  name: string;
  address?: string;
  price?: string | null;
  imageUrl?: string;
  rating?: number;
}

const MAX_RECENT_HOTELS = 6;

// Scroll reveal wrapper for recently viewed hotel cards
const ScrollRevealCard: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const ref = useScrollReveal('animate-fade-in-up', delay) as React.RefObject<HTMLDivElement>;
  return (
    <div ref={ref}>
      {children}
    </div>
  );
};

export function RecentlyViewed() {
  const [recentHotels, setRecentHotels] = useState<HotelOffer[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Load recently viewed hotels from localStorage
    try {
      const saved = localStorage.getItem('recentlyViewedHotels');
      if (saved) {
        setRecentHotels(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Error loading recently viewed hotels:', err);
    }
  }, []);

  useEffect(() => {
    // Load favorites
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
  }, [user]);

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

  if (recentHotels.length === 0) return null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-4">
      <h2 className="text-2xl font-semibold text-white tracking-wide">Recently Viewed</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recentHotels.map((hotel, idx) => (
          <ScrollRevealCard key={idx} delay={idx * 60}>
            <div
              className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-md shadow-white/10 transition-transform hover:scale-[1.02] hover:shadow-white/20 animate-fade-in flex flex-col justify-between h-full group cursor-pointer"
              onClick={() => navigate(`/hotel/${encodeURIComponent(hotel.name)}`)}
            >
              {hotel.imageUrl && (
                <img
                  src={hotel.imageUrl}
                  alt={hotel.name}
                  className="w-full aspect-video object-cover rounded-xl mb-4 bg-black/20"
                  loading="lazy"
                />
              )}
              <button
                className={`absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-white/10 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-white ${favorites.includes(hotel.name) ? 'scale-110' : ''}`}
                onClick={e => { e.stopPropagation(); toggleFavorite(hotel.name); }}
                aria-label={favorites.includes(hotel.name) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  className={`h-6 w-6 ${favorites.includes(hotel.name) ? 'fill-white text-white' : 'text-gray-400 group-hover:text-white'}`}
                  fill={favorites.includes(hotel.name) ? '#fff' : 'none'}
                />
              </button>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{hotel.name}</h3>
                {hotel.address && <p className="text-gray-400 text-sm mb-2">{hotel.address}</p>}
                {hotel.price && <p className="text-white font-bold">${hotel.price}</p>}
                {hotel.rating && (
                  <div className="flex items-center gap-1 text-yellow-400 text-sm mt-1">
                    <span>{'★'.repeat(Math.round(hotel.rating))}</span>
                    <span className="text-white/80">{hotel.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </ScrollRevealCard>
        ))}
      </div>
    </div>
  );
}

// Helper function to add a hotel to recently viewed
export function addToRecentlyViewed(hotel: HotelOffer) {
  try {
    const saved = localStorage.getItem('recentlyViewedHotels');
    let recent = saved ? JSON.parse(saved) : [];
    
    // Remove if already exists (to move to front)
    recent = recent.filter((h: HotelOffer) => h.name !== hotel.name);
    
    // Add to front
    recent.unshift(hotel);
    
    // Keep only the most recent
    if (recent.length > MAX_RECENT_HOTELS) {
      recent = recent.slice(0, MAX_RECENT_HOTELS);
    }
    
    localStorage.setItem('recentlyViewedHotels', JSON.stringify(recent));
  } catch (err) {
    console.error('Error saving recently viewed hotel:', err);
  }
} 