import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from "../components/Navigation";
import ItineraryMap from "../components/ItineraryMap";

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
    amenities?: string[];
    specialOffers?: string[];
    rooms?: { type: string; price: string; availability: boolean; images?: string[] }[];
    reviews?: { username: string; rating: number; comment: string }[];
    policies?: { checkIn: string; checkOut: string; cancellation: string; payment: string };
    accessibility?: string[];
    nearby?: { name: string; type: string; distance: string }[];
    location?: { lat: number; lng: number };
  };
}

// Booking modal component
const BookingModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (form: { name: string; email: string; phone: string; guests: number; requests: string; agree: boolean }) => void;
  roomType: string;
  submitting: boolean;
  success: boolean;
  checkIn: string;
  checkOut: string;
}> = ({ open, onClose, onSubmit, roomType, submitting, success, checkIn, checkOut }) => {
  const [form, setForm] = React.useState({ name: '', email: '', phone: '', guests: 1, requests: '', agree: false });
  const [error, setError] = React.useState<string | null>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      setForm({ name: '', email: '', phone: '', guests: 1, requests: '', agree: false });
      setError(null);
      setTimeout(() => {
        dialogRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const validate = () => {
    if (!form.name.trim() || form.name.length < 2) return 'Please enter your name.';
    if (!form.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return 'Please enter a valid email.';
    if (!form.phone.trim() || !/^\+?[0-9\-\s]{7,15}$/.test(form.phone)) return 'Please enter a valid phone number.';
    if (!form.guests || form.guests < 1 || form.guests > 10) return 'Number of guests must be between 1 and 10.';
    if (!form.agree) return 'You must agree to the terms.';
    return null;
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const target = e.target;
    if (type === 'checkbox' && target instanceof HTMLInputElement) {
      setForm(f => ({
        ...f,
        [name]: target.checked
      }));
    } else {
      setForm(f => ({
        ...f,
        [name]: name === 'guests' ? Number(value) : value
      }));
    }
    setError(null);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    onSubmit(form);
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in-up">
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative animate-fade-in-up outline-none"
        tabIndex={-1}
        ref={dialogRef}
        aria-modal="true"
        role="dialog"
      >
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl" aria-label="Close booking">&times;</button>
        <h2 className="text-xl font-bold mb-2 text-center">Book {roomType}</h2>
        {success ? (
          <div className="text-green-600 text-center font-semibold animate-fade-in-up">Thank you! Your booking is confirmed.<br/>A confirmation has been sent to your email and phone (demo only).</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3" aria-label="Book room form" noValidate>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your Name"
                className="w-full px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                required
                aria-label="Your Name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Your Email"
                className="w-full px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                required
                aria-label="Your Email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">Phone Number *
                <span className="ml-1 text-gray-400" title="Include country code if possible.">&#9432;</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. +1234567890"
                className="w-full px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                required
                aria-label="Your Phone Number"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">Number of Guests *
                <span className="ml-1 text-gray-400" title="Max 10 guests per room.">&#9432;</span>
              </label>
              <input
                type="number"
                name="guests"
                min={1}
                max={10}
                value={form.guests}
                onChange={handleChange}
                className="w-full px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                required
                aria-label="Number of Guests"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Check-in</label>
                <input
                  type="text"
                  value={checkIn}
                  readOnly
                  className="w-full px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 cursor-not-allowed"
                  aria-label="Check-in date"
                  tabIndex={-1}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Check-out</label>
                <input
                  type="text"
                  value={checkOut}
                  readOnly
                  className="w-full px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 cursor-not-allowed"
                  aria-label="Check-out date"
                  tabIndex={-1}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Special Requests</label>
              <textarea
                name="requests"
                value={form.requests}
                onChange={handleChange}
                placeholder="Special requests (optional)"
                className="w-full px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                rows={2}
                aria-label="Special requests"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="agree"
                checked={form.agree}
                onChange={handleChange}
                className="accent-blue-600"
                required
                aria-label="Agree to terms"
              />
              <span className="text-xs text-gray-500">I agree to the <a href="#" className="underline text-blue-600" tabIndex={0}>terms and conditions</a> <span className="ml-1 text-gray-400" title="You must agree before booking.">&#9432;</span></span>
            </div>
            <button
              type="submit"
              className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 w-full ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={submitting}
              aria-disabled={submitting}
            >
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
            {error && <div className="text-red-500 mt-2 animate-fade-in" role="alert">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
};

const HotelDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as HotelDetailsState | undefined;
  const hotel = state?.hotel;
  const [imgIdx, setImgIdx] = React.useState(0);
  const [imgAnim, setImgAnim] = React.useState(false);
  // Local reviews state for demo submission
  const [reviews, setReviews] = React.useState(hotel.reviews || []);
  const [reviewForm, setReviewForm] = React.useState({ username: '', rating: 5, comment: '' });
  const [reviewSuccess, setReviewSuccess] = React.useState(false);
  const [reviewError, setReviewError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const reviewFormRef = React.useRef<HTMLDivElement>(null);
  const [newReviewIdx, setNewReviewIdx] = React.useState<number | null>(null);
  // --- Room Booking Demo State ---
  const [bookingModal, setBookingModal] = React.useState<{ open: boolean; roomType: string | null }>({ open: false, roomType: null });
  const [bookingSubmitting, setBookingSubmitting] = React.useState(false);
  const [bookingSuccess, setBookingSuccess] = React.useState(false);
  // Track booked rooms in localStorage (per hotel+room type)
  const hotelKey = hotel ? `bookedRooms_${hotel.name}` : '';
  const [bookedRooms, setBookedRooms] = React.useState<string[]>(() => {
    if (!hotelKey) return [];
    try {
      return JSON.parse(localStorage.getItem(hotelKey) || '[]');
    } catch {
      return [];
    }
  });
  // Get check-in/check-out from location.state or hotel (if available)
  const checkIn = (location.state && location.state.checkIn) || '';
  const checkOut = (location.state && location.state.checkOut) || '';
  React.useEffect(() => {
    if (hotelKey) localStorage.setItem(hotelKey, JSON.stringify(bookedRooms));
  }, [bookedRooms, hotelKey]);
  const openBooking = (roomType: string) => setBookingModal({ open: true, roomType });
  const closeBooking = () => { setBookingModal({ open: false, roomType: null }); setBookingSuccess(false); };
  const handleBookingSubmit = (form: { name: string; email: string; phone: string; guests: number; requests: string; agree: boolean }) => {
    setBookingSubmitting(true);
    setTimeout(() => {
      setBookedRooms(prev => bookingModal.roomType ? [...prev, bookingModal.roomType!] : prev);
      setBookingSubmitting(false);
      setBookingSuccess(true);
      setTimeout(() => {
        closeBooking();
      }, 1200);
    }, 900);
  };

  // Animate image on change
  React.useEffect(() => {
    setImgAnim(true);
    const timeout = setTimeout(() => setImgAnim(false), 350);
    return () => clearTimeout(timeout);
  }, [imgIdx]);

  // Scroll to form on error
  React.useEffect(() => {
    if (reviewError && reviewFormRef.current) {
      reviewFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [reviewError]);

  // Animate new review
  React.useEffect(() => {
    if (newReviewIdx === 0) {
      const timeout = setTimeout(() => setNewReviewIdx(null), 1200);
      return () => clearTimeout(timeout);
    }
  }, [newReviewIdx]);

  const validateReview = () => {
    if (!reviewForm.username.trim() || reviewForm.username.trim().length < 2) {
      return 'Please enter your name (at least 2 characters).';
    }
    if (!reviewForm.comment.trim() || reviewForm.comment.trim().length < 10) {
      return 'Please enter a review (at least 10 characters).';
    }
    if (Number(reviewForm.rating) < 1 || Number(reviewForm.rating) > 5) {
      return 'Please select a rating between 1 and 5.';
    }
    return null;
  };

  const handleReviewChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setReviewForm({ ...reviewForm, [e.target.name]: e.target.value });
    setReviewError(null);
  };
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    const error = validateReview();
    if (error) {
      setReviewError(error);
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setReviews([{ ...reviewForm, rating: Number(reviewForm.rating) }, ...reviews]);
      setReviewForm({ username: '', rating: 5, comment: '' });
      setReviewSuccess(true);
      setNewReviewIdx(0);
      setSubmitting(false);
      setTimeout(() => setReviewSuccess(false), 2000);
    }, 600);
  };

  if (!hotel) {
    return <div className="p-8 text-center">No hotel data found. <button className="underline text-blue-600" onClick={() => navigate(-1)}>Go Back</button></div>;
  }

  const images = hotel.images || (hotel.imageUrl ? [hotel.imageUrl] : []);
  const hasGallery = Array.isArray(images) && images.length > 1;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <div className="max-w-xl mx-auto p-4">
        <button onClick={() => navigate(-1)} className="mb-4 text-blue-400 underline">&larr; Back</button>
        {hasGallery ? (
          <div className="relative mb-4">
            <img
              src={images[imgIdx]}
              alt={hotel.name}
              className={`w-full h-64 object-cover rounded transition-all duration-500 ease-in-out ${imgAnim ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
              onAnimationEnd={() => setImgAnim(false)}
            />
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
                <span key={i} className={`inline-block w-2 h-2 rounded-full ${i === imgIdx ? 'bg-blue-400' : 'bg-gray-600'}`}></span>
              ))}
            </div>
          </div>
        ) : images.length === 1 ? (
          <img src={images[0]} alt={hotel.name} className="w-full h-64 object-cover rounded mb-4 transition-all duration-500" />
        ) : (
          <div className="w-full h-64 flex items-center justify-center bg-gray-800 rounded mb-4 text-gray-400 transition-all duration-500">No image available</div>
        )}
        <h1 className="text-3xl font-bold mb-2 text-white">{hotel.name}</h1>
        {hotel.rating && hotel.rating > 0 && <div className="mb-2 text-blue-300">Rating: {hotel.rating} ⭐</div>}
        {hotel.address && <div className="mb-2 text-gray-300">{hotel.address}</div>}
        {hotel.price && <div className="mb-2 font-semibold text-green-400">Price: ${hotel.price}</div>}
        {hotel.description && hotel.description.length > 0 && <div className="mb-2 text-gray-200">{hotel.description}</div>}
        {hotel.bookingLink && (
          <a href={hotel.bookingLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline mb-2 block">Book Now</a>
        )}
        {/* Animate each section fade-in */}
        <div className="space-y-6">
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="mb-4 animate-fade-in-up">
              <h2 className="text-xl font-semibold mb-1 text-white">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {hotel.amenities.map((a, i) => (
                  <span key={i} className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs font-medium">{a}</span>
                ))}
              </div>
            </div>
          )}
          {hotel.specialOffers && hotel.specialOffers.length > 0 && (
            <div className="mb-4 animate-fade-in-up">
              <h2 className="text-xl font-semibold mb-1 text-white">Special Offers</h2>
              <ul className="list-disc list-inside text-green-400">
                {hotel.specialOffers.map((offer, i) => (
                  <li key={i}>{offer}</li>
                ))}
              </ul>
            </div>
          )}
          {hotel.rooms && hotel.rooms.length > 0 && (
            <div className="mb-4 animate-fade-in-up">
              <h2 className="text-xl font-semibold mb-1 text-white">Rooms & Availability</h2>
              <div className="space-y-2">
                {hotel.rooms.map((room, i) => {
                  const isBooked = bookedRooms.includes(room.type);
                  return (
                    <div key={i} className="border border-gray-700 rounded p-2 flex flex-col md:flex-row md:items-center md:justify-between bg-gray-900 relative overflow-hidden">
                      <div>
                        <div className="font-semibold text-white">{room.type}</div>
                        <div className="text-gray-300 text-sm">${room.price}</div>
                        <div className="text-xs text-gray-400">{room.availability ? 'Available' : 'Sold Out'}</div>
                        {room.availability && (
                          <button
                            className={`mt-2 px-4 py-1 rounded font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 text-white ${isBooked ? 'bg-green-700 cursor-not-allowed opacity-70' : 'bg-blue-600 hover:bg-blue-700'}`}
                            onClick={() => !isBooked && openBooking(room.type)}
                            disabled={isBooked}
                            aria-disabled={isBooked}
                            aria-label={isBooked ? 'Room already booked' : `Book ${room.type}`}
                          >
                            {isBooked ? 'Booked!' : 'Book Room'}
                          </button>
                        )}
                        {isBooked && <span className="ml-2 text-green-400 font-bold animate-fade-in-up">✔</span>}
                      </div>
                      {room.images && room.images.length > 0 && (
                        <img src={room.images[0]} alt={room.type} className="w-24 h-16 object-cover rounded mt-2 md:mt-0" />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Booking Modal */}
              <BookingModal
                open={bookingModal.open}
                onClose={closeBooking}
                onSubmit={handleBookingSubmit}
                roomType={bookingModal.roomType || ''}
                submitting={bookingSubmitting}
                success={bookingSuccess}
                checkIn={checkIn}
                checkOut={checkOut}
              />
            </div>
          )}
          {reviews && reviews.length > 0 && (
            <div className="mb-4 animate-fade-in-up">
              <h2 className="text-xl font-semibold mb-1 text-white">Guest Reviews</h2>
              <div className="space-y-2">
                {reviews.map((review, i) => (
                  <div
                    key={i}
                    className={`border border-gray-700 rounded p-2 bg-gray-900 transition-all duration-700 ${i === newReviewIdx ? 'animate-fade-in-up shadow-lg ring-2 ring-blue-400' : ''}`}
                    aria-live={i === 0 && newReviewIdx === 0 ? 'polite' : undefined}
                  >
                    <div className="font-semibold text-sm text-yellow-300">{review.username} <span className="text-yellow-400">{'★'.repeat(review.rating)}</span></div>
                    <div className="text-gray-200 text-sm">{review.comment}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Review Submission Form */}
          <div className="mb-8 animate-fade-in-up" ref={reviewFormRef}>
            <h2 className="text-lg font-semibold mb-2 text-white">Add Your Review</h2>
            <form
              onSubmit={handleReviewSubmit}
              className={`space-y-2 bg-gray-900 p-4 rounded transition-all duration-300 ${reviewError ? 'animate-shake' : ''}`}
              aria-label="Add your review"
              noValidate
            >
              <div>
                <input
                  type="text"
                  name="username"
                  value={reviewForm.username}
                  onChange={handleReviewChange}
                  placeholder="Your Name"
                  className="w-full px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  required
                  minLength={2}
                  aria-label="Your Name"
                  aria-invalid={!!reviewError && reviewError.includes('name')}
                />
              </div>
              <div>
                <select
                  name="rating"
                  value={reviewForm.rating}
                  onChange={handleReviewChange}
                  className="w-full px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  aria-label="Rating"
                >
                  {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div>
                <textarea
                  name="comment"
                  value={reviewForm.comment}
                  onChange={handleReviewChange}
                  placeholder="Your review..."
                  className="w-full px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  rows={3}
                  required
                  minLength={10}
                  aria-label="Your review"
                  aria-invalid={!!reviewError && reviewError.includes('review')}
                />
              </div>
              <button
                type="submit"
                className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={submitting}
                aria-disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              {reviewError && <div className="text-red-400 mt-2 animate-fade-in" role="alert">{reviewError}</div>}
              {reviewSuccess && <div className="text-green-400 mt-2 animate-fade-in" role="status">Thank you for your review!</div>}
            </form>
          </div>
          {hotel.policies && (
            <div className="mb-4 animate-fade-in-up">
              <h2 className="text-xl font-semibold mb-1 text-white">Hotel Policies</h2>
              <ul className="list-disc list-inside text-gray-200">
                <li><b>Check-in:</b> {hotel.policies.checkIn}</li>
                <li><b>Check-out:</b> {hotel.policies.checkOut}</li>
                <li><b>Cancellation:</b> {hotel.policies.cancellation}</li>
                <li><b>Payment:</b> {hotel.policies.payment}</li>
              </ul>
            </div>
          )}
          {hotel.accessibility && hotel.accessibility.length > 0 && (
            <div className="mb-4 animate-fade-in-up">
              <h2 className="text-xl font-semibold mb-1 text-white">Accessibility</h2>
              <div className="flex flex-wrap gap-2">
                {hotel.accessibility.map((a, i) => (
                  <span key={i} className="bg-green-900 text-green-200 px-2 py-1 rounded text-xs font-medium">{a}</span>
                ))}
              </div>
            </div>
          )}
          {hotel.nearby && hotel.nearby.length > 0 && (
            <div className="mb-4 animate-fade-in-up">
              <h2 className="text-xl font-semibold mb-1 text-white">Nearby Attractions</h2>
              <ul className="list-disc list-inside text-blue-200">
                {hotel.nearby.map((place, i) => (
                  <li key={i}><b>{place.name}</b> ({place.type}) - {place.distance}</li>
                ))}
              </ul>
            </div>
          )}
          {hotel.location && (
            <div className="mb-4 animate-fade-in-up">
              <h2 className="text-xl font-semibold mb-1 text-white">Location</h2>
              <div className="w-full h-64 rounded overflow-hidden">
                <ItineraryMap
                  locations={[{
                    name: hotel.name,
                    description: hotel.address || hotel.description || '',
                    lat: hotel.location.lat,
                    lng: hotel.location.lng,
                  }]}
                />
              </div>
            </div>
          )}
        </div>
        {hotel.source && (
          <div className="text-xs text-gray-500 mt-2">Data source: {hotel.source}</div>
        )}
      </div>
    </div>
  );
};

export default HotelDetails; 