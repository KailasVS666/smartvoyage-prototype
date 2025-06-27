import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface HotelDetailsState {
  hotel: {
    name: string;
    address?: string;
    price?: string | null;
    bookingLink?: string | null;
    imageUrl?: string;
    description?: string;
    rating?: number;
    source?: string;
    images?: string[];
  };
}

const HotelDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as HotelDetailsState | undefined;
  const hotel = state?.hotel;
  const [imgIdx, setImgIdx] = React.useState(0);

  if (!hotel) {
    return <div className="p-8 text-center">No hotel data found. <button className="underline text-blue-600" onClick={() => navigate(-1)}>Go Back</button></div>;
  }

  const images = hotel.images || (hotel.imageUrl ? [hotel.imageUrl] : []);
  const hasGallery = Array.isArray(images) && images.length > 1;

  return (
    <div className="max-w-xl mx-auto p-4">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-600 underline">&larr; Back</button>
      {hasGallery ? (
        <div className="relative mb-4">
          <img src={images[imgIdx]} alt={hotel.name} className="w-full h-64 object-cover rounded" />
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 rounded-full px-2 py-1 text-lg"
            onClick={() => setImgIdx((imgIdx - 1 + images.length) % images.length)}
            aria-label="Previous image"
          >&larr;</button>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 rounded-full px-2 py-1 text-lg"
            onClick={() => setImgIdx((imgIdx + 1) % images.length)}
            aria-label="Next image"
          >&rarr;</button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <span key={i} className={`inline-block w-2 h-2 rounded-full ${i === imgIdx ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
            ))}
          </div>
        </div>
      ) : images.length === 1 ? (
        <img src={images[0]} alt={hotel.name} className="w-full h-64 object-cover rounded mb-4" />
      ) : (
        <div className="w-full h-64 flex items-center justify-center bg-gray-200 rounded mb-4 text-gray-500">No image available</div>
      )}
      <h1 className="text-3xl font-bold mb-2">{hotel.name}</h1>
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
  );
};

export default HotelDetails; 