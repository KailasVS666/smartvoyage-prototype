import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HotelOffer {
  name: string;
  address: string;
  price: string | null;
  bookingLink: string | null;
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
  const navigate = useNavigate();

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setOffers([]);
    setExpanded(null);
    setSource(undefined);
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

  return (
    <TooltipProvider>
      <div className="max-w-xl mx-auto p-4">
        <Card className="p-4 mb-4">
          <h2 className="text-xl font-bold mb-2">Search Hotels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">City Code (e.g. PAR)</label>
              <Input
                placeholder="City Code (e.g. PAR)"
                value={cityCode}
                onChange={e => setCityCode(e.target.value.toUpperCase())}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                Check-in Date
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1 cursor-pointer text-gray-400">&#9432;</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    The first night you will stay at the hotel.
                  </TooltipContent>
                </Tooltip>
              </label>
              <Input
                type="date"
                placeholder="Check-in"
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                Check-out Date
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1 cursor-pointer text-gray-400">&#9432;</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    The day you leave the hotel (you will not stay this night).
                  </TooltipContent>
                </Tooltip>
              </label>
              <Input
                type="date"
                placeholder="Check-out"
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Number of Adults</label>
              <Input
                type="number"
                min={1}
                placeholder="Adults"
                value={adults}
                onChange={e => setAdults(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <Button
            className="mt-4 w-full"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center"><Loader2 className="animate-spin mr-2 h-4 w-4" />Searching...</span>
            ) : 'Search Hotels'}
          </Button>
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </Card>
        <div className="space-y-4">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          )}
          {!loading && offers.length === 0 && !error && (
            <div className="text-center text-gray-500">No hotels found. Try searching above.</div>
          )}
          {!loading && offers.map((offer, idx) => (
            <Card
              key={idx}
              className={`p-4 cursor-pointer transition-all duration-200`}
              onClick={() => navigate(`/hotel/${encodeURIComponent(offer.name)}`, { state: { hotel: { ...offer, source } } })}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <div className="font-semibold text-lg">{offer.name}</div>
                </div>
                <div className="mt-2 md:mt-0 flex flex-col items-end">
                  <div className="font-bold text-primary">{offer.price ? `$${offer.price}` : 'N/A'}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        {source && (
          <div className="text-xs text-gray-400 mt-2">Data source: {source}</div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default HotelSearch; 