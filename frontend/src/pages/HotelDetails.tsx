import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from "../components/Navigation";
import ItineraryMap from "../components/ItineraryMap";
import { toast } from "../components/ui/use-toast";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { useAuth } from "../contexts/AuthContext";
import { addFavorite as addFavoriteCloud, removeFavorite as removeFavoriteCloud, getUserFavorites } from "../services/favoriteService";
import { Review, getHotelReviews, addHotelReview, updateHotelReview, deleteHotelReview, onHotelReviewsSnapshot } from '../services/reviewService';

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
  // Images and gallery info (move up for use in effects)
  const images = hotel?.images || (hotel?.imageUrl ? [hotel.imageUrl] : []);
  const hasGallery = Array.isArray(images) && images.length > 1;
  // Local reviews state for demo submission
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = React.useState(true);
  const [reviewsError, setReviewsError] = React.useState<string | null>(null);
  const [reviewForm, setReviewForm] = React.useState({ rating: 5, comment: '' });
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
      toast({
        title: "Booking Confirmed!",
        description: `Your booking for ${bookingModal.roomType} is confirmed.`,
      });
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
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    
    // Check if user is logged in
    if (!user) {
      setReviewError('Please log in to submit a review.');
      return;
    }

    // Only validate comment and rating since we'll use the user's display name
    if (!reviewForm.comment.trim() || reviewForm.comment.trim().length < 10) {
      setReviewError('Please enter a review (at least 10 characters).');
      return;
    }
    if (Number(reviewForm.rating) < 1 || Number(reviewForm.rating) > 5) {
      setReviewError('Please select a rating between 1 and 5.');
      return;
    }

    setSubmitting(true);
    try {
      if (!hotel) return;
      const newReview = {
        username: user.displayName || 'Anonymous User',
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
        avatarUrl: user.photoURL || defaultAvatar,
        timestamp: Date.now(),
      };
      await addHotelReview(hotel.name, newReview);
      setReviews(revs => [newReview, ...revs]);
      setReviewForm({ rating: 5, comment: '' });
      setReviewSuccess(true);
      setNewReviewIdx(0);
      toast({ title: "Review Submitted!", description: "Thank you for sharing your feedback." });
      setTimeout(() => setReviewSuccess(false), 2000);
    } catch {
      toast({ title: "Error", description: "Failed to submit review.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = React.useState(false);

  // Sync favorite status with Firestore/localStorage on mount or user change
  React.useEffect(() => {
    if (!hotel) return;
    async function checkFavorite() {
      if (user) {
        try {
          const favs = await getUserFavorites(user.uid);
          setIsFavorite(favs.includes(hotel.name));
        } catch {
          setIsFavorite(false);
        }
      } else {
        try {
          const favs = JSON.parse(localStorage.getItem('hotelFavorites') || '[]');
          setIsFavorite(favs.includes(hotel.name));
        } catch {
          setIsFavorite(false);
        }
      }
    }
    checkFavorite();
    // eslint-disable-next-line
  }, [user, hotel?.name]);

  const toggleFavorite = async () => {
    if (!hotel) return;
    if (user) {
      try {
        if (isFavorite) {
          await removeFavoriteCloud(user.uid, hotel.name);
          setIsFavorite(false);
          toast({ title: "Removed from Favorites", description: `${hotel.name} has been removed from your favorites.` });
        } else {
          await addFavoriteCloud(user.uid, hotel.name);
          setIsFavorite(true);
          toast({ title: "Added to Favorites", description: `${hotel.name} has been added to your favorites!` });
        }
      } catch {
        toast({ title: "Error", description: "Failed to update favorites in the cloud.", variant: "destructive" });
      }
    } else {
      let favs: string[] = [];
      try {
        favs = JSON.parse(localStorage.getItem('hotelFavorites') || '[]');
      } catch {
        // Ignore JSON parse errors and use empty array
      }
      if (isFavorite) {
        favs = favs.filter(f => f !== hotel.name);
        toast({ title: "Removed from Favorites", description: `${hotel.name} has been removed from your favorites.` });
      } else {
        favs.push(hotel.name);
        toast({ title: "Added to Favorites", description: `${hotel.name} has been added to your favorites!` });
      }
      localStorage.setItem('hotelFavorites', JSON.stringify(favs));
      setIsFavorite(!isFavorite);
    }
  };

  const [galleryOpen, setGalleryOpen] = React.useState(false);

  // Keyboard navigation for gallery modal
  React.useEffect(() => {
    if (!galleryOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setImgIdx(idx => (idx - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setImgIdx(idx => (idx + 1) % images.length);
      if (e.key === 'Escape') setGalleryOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryOpen, images.length]);

  // Swipe support for mobile users in gallery modal
  const touchStartRef = React.useRef<number | null>(null);
  const touchEndRef = React.useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartRef.current !== null && touchEndRef.current !== null) {
      const diff = touchStartRef.current - touchEndRef.current;
      if (Math.abs(diff) > 50) {
        if (diff > 0) setImgIdx(idx => (idx + 1) % images.length); // swipe left
        else setImgIdx(idx => (idx - 1 + images.length) % images.length); // swipe right
      }
    }
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  // --- Reviews Pagination/Edit/Delete ---
  const REVIEWS_PER_PAGE = 3;
  const [reviewsPage, setReviewsPage] = React.useState(1);
  const [editingIdx, setEditingIdx] = React.useState<number | null>(null);
  const [editForm, setEditForm] = React.useState({ rating: 5, comment: '' });
  // Calculate average rating
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length).toFixed(1) : null;
  const paginatedReviews = reviews.slice(0, reviewsPage * REVIEWS_PER_PAGE);

  // Load reviews from Firestore on mount (real-time)
  React.useEffect(() => {
    if (!hotel) return;
    setReviewsLoading(true);
    setReviewsError(null);
    const unsubscribe = onHotelReviewsSnapshot(hotel.name, (newReviews) => {
      setReviews(newReviews);
      setReviewsLoading(false);
    });
    return () => unsubscribe();
  }, [hotel?.name]);

  // Edit review handlers
  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditForm({ rating: reviews[idx].rating, comment: reviews[idx].comment });
  };
  const cancelEdit = () => setEditingIdx(null);
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const saveEdit = async (idx: number) => {
    if (!hotel) return;
    try {
      await updateHotelReview(hotel.name, idx, { ...reviews[idx], rating: Number(editForm.rating), comment: editForm.comment });
      setReviews(revs => {
        const updated = [...revs];
        updated[idx] = { ...updated[idx], rating: Number(editForm.rating), comment: editForm.comment };
        return updated;
      });
      setEditingIdx(null);
      toast({ title: "Review Updated", description: "Your review has been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to update review.", variant: "destructive" });
    }
  };
  const deleteReview = async (idx: number) => {
    if (!hotel) return;
    try {
      await deleteHotelReview(hotel.name, idx);
      setReviews(revs => revs.filter((_, i) => i !== idx));
      toast({ title: "Review Deleted", description: "Your review has been deleted." });
    } catch {
      toast({ title: "Error", description: "Failed to delete review.", variant: "destructive" });
    }
  };

  // Check if user has already reviewed
  const userReviewIdx = user && user.displayName ? reviews.findIndex(r => r.username === user.displayName) : -1;
  const userHasReview = userReviewIdx !== -1;

  // Default avatar
  const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff';

  if (!hotel) {
    return <div className="p-8 text-center">No hotel data found. <button className="underline text-blue-600" onClick={() => navigate(-1)}>Go Back</button></div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <div className="max-w-xl mx-auto p-4">
        <button onClick={() => navigate(-1)} className="mb-4 text-blue-400 underline">&larr; Back</button>
        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          className={`mb-4 flex items-center gap-2 px-3 py-1 rounded-full border border-pink-500 ${isFavorite ? 'bg-pink-500 text-white' : 'bg-black text-pink-500'} hover:bg-pink-600 hover:text-white transition`}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21C12 21 4 13.5 4 8.5C4 5.42 6.42 3 9.5 3C11.24 3 12.91 3.81 14 5.08C15.09 3.81 16.76 3 18.5 3C21.58 3 24 5.42 24 8.5C24 13.5 16 21 16 21H12Z" />
          </svg>
          {isFavorite ? 'Favorited' : 'Add to Favorites'}
        </button>
        {hasGallery ? (
          <div className="relative mb-4">
            <img
              src={images[imgIdx]}
              alt={hotel.name}
              className={`w-full h-64 object-cover rounded transition-all duration-500 ease-in-out ${imgAnim ? 'opacity-0 scale-105' : 'opacity-100 scale-100'} cursor-pointer`}
              onAnimationEnd={() => setImgAnim(false)}
              onClick={() => setGalleryOpen(true)}
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
            {/* Gallery Modal */}
            <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
              <DialogContent className="max-w-2xl p-0 bg-black">
                <div
                  className="relative flex flex-col items-center justify-center"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <img
                    src={images[imgIdx]}
                    alt={hotel.name}
                    className="w-full max-h-[80vh] object-contain bg-black rounded"
                  />
                  {/* Caption if available */}
                  <div className="text-white text-center mt-2 mb-1 text-sm opacity-80">
                    {hotel.rooms && hotel.rooms[imgIdx]?.type ? (
                      <span>{hotel.rooms[imgIdx].type}</span>
                    ) : hotel.description ? (
                      <span>{hotel.description}</span>
                    ) : (
                      <span>Image {imgIdx + 1} of {images.length}</span>
                    )}
                  </div>
                  {images.length > 1 && (
                    <>
                      <button
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 rounded-full px-3 py-2 text-2xl"
                        onClick={() => setImgIdx((imgIdx - 1 + images.length) % images.length)}
                        aria-label="Previous image"
                      >&larr;</button>
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 rounded-full px-3 py-2 text-2xl"
                        onClick={() => setImgIdx((imgIdx + 1) % images.length)}
                        aria-label="Next image"
                      >&rarr;</button>
                    </>
                  )}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, i) => (
                      <span key={i} className={`inline-block w-3 h-3 rounded-full border-2 ${i === imgIdx ? 'bg-blue-400 border-blue-400' : 'bg-gray-600 border-gray-400'}`}></span>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
          {reviewsLoading ? (
            <div className="text-gray-400">Loading reviews...</div>
          ) : reviewsError ? (
            <div className="text-red-400">{reviewsError}</div>
          ) : reviews && reviews.length > 0 && (
            <div className="mb-4 animate-fade-in-up">
              <h2 className="text-xl font-semibold mb-1 text-white">Guest Reviews</h2>
              <div className="flex items-center gap-3 mb-2">
                {avgRating && <span className="text-yellow-300 font-bold text-lg">{avgRating} ★</span>}
                <span className="text-gray-400 text-sm">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {paginatedReviews.map((review, i) => (
                  <div
                    key={i}
                    className={`border border-gray-700 rounded p-2 bg-gray-900 transition-all duration-700 ${i === newReviewIdx ? 'animate-fade-in-up shadow-lg ring-2 ring-blue-400' : ''}`}
                    aria-live={i === 0 && newReviewIdx === 0 ? 'polite' : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={review.avatarUrl || defaultAvatar}
                          alt={review.username}
                          className="w-8 h-8 rounded-full object-cover border border-gray-700"
                        />
                        <div className="font-semibold text-sm text-yellow-300">{review.username} <span className="text-yellow-400">{'★'.repeat(review.rating)}</span></div>
                      </div>
                      {user && user.displayName && review.username === user.displayName && (
                        <div className="flex gap-2">
                          {editingIdx === i ? (
                            <>
                              <button className="text-green-400 text-xs underline" onClick={() => saveEdit(i)}>Save</button>
                              <button className="text-gray-400 text-xs underline" onClick={cancelEdit}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button className="text-blue-400 text-xs underline" onClick={() => startEdit(i)}>Edit</button>
                              <button className="text-red-400 text-xs underline" onClick={() => deleteReview(i)}>Delete</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 mb-1">
                      {review.timestamp && (
                        <span className="text-xs text-gray-400">{new Date(review.timestamp).toLocaleDateString()} {new Date(review.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                    {editingIdx === i ? (
                      <>
                        <select
                          name="rating"
                          value={editForm.rating}
                          onChange={handleEditChange}
                          className="w-full px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition mt-1 mb-1"
                        >
                          {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
                        </select>
                        <textarea
                          name="comment"
                          value={editForm.comment}
                          onChange={handleEditChange}
                          className="w-full px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition mb-1"
                          rows={2}
                        />
                      </>
                    ) : (
                      <div className="text-gray-200 text-sm mt-1">{review.comment}</div>
                    )}
                  </div>
                ))}
                {reviews.length > paginatedReviews.length && (
                  <button
                    className="mt-2 px-4 py-1 rounded bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition"
                    onClick={() => setReviewsPage(p => p + 1)}
                  >Load More</button>
                )}
              </div>
            </div>
          )}
          {/* Review Submission Form */}
          <div className="mb-8 animate-fade-in-up" ref={reviewFormRef}>
            {user && user.displayName && userHasReview ? (
              <div className="bg-gray-900 p-4 rounded text-yellow-300 text-center">
                <span>You have already reviewed this hotel. You can edit or delete your review above.</span>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-2 text-white">Add Your Review</h2>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="text-xl font-semibold text-white">Write a Review</h3>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                      <div className="flex flex-col gap-2">
                        {[5, 4, 3, 2, 1].map((stars) => (
                          <label
                            key={stars}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                              Number(reviewForm.rating) === stars
                                ? 'bg-white/20 border border-white/30'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <input
                              type="radio"
                              name="rating"
                              value={stars}
                              checked={Number(reviewForm.rating) === stars}
                              onChange={handleReviewChange}
                              className="sr-only"
                            />
                            <div className="flex items-center gap-1">
                              {Array.from({ length: stars }).map((_, i) => (
                                <span key={i} className="text-yellow-400 text-xl">★</span>
                              ))}
                              {Array.from({ length: 5 - stars }).map((_, i) => (
                                <span key={i} className="text-gray-500 text-xl">★</span>
                              ))}
                            </div>
                            <span className="text-white text-sm">
                              {stars === 5 && "Excellent - Highly Recommended"}
                              {stars === 4 && "Very Good - Great Experience"}
                              {stars === 3 && "Good - Satisfactory"}
                              {stars === 2 && "Fair - Some Issues"}
                              {stars === 1 && "Poor - Not Recommended"}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Your Review</label>
                      <textarea
                        name="comment"
                        value={reviewForm.comment}
                        onChange={handleReviewChange}
                        rows={4}
                        className="mt-1 block w-full rounded-lg bg-white/10 border border-white/20 text-white shadow-sm focus:border-white focus:ring focus:ring-white/30 focus:ring-opacity-50 p-3"
                        placeholder="Share your experience with this hotel..."
                      ></textarea>
                    </div>
                    {reviewError && (
                      <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/30 rounded-lg p-3">
                        {reviewError}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-white text-black hover:bg-gray-100 rounded-lg px-4 py-3 shadow-md transition-all duration-200 font-semibold flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Submitting...
                        </>
                      ) : 'Submit Review'}
                    </button>
                  </form>
                </div>
              </>
            )}
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