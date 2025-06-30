import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface Review {
  username: string;
  rating: number;
  comment: string;
  avatarUrl?: string;
  timestamp?: number;
}

const getHotelDoc = (hotelName: string) => doc(db, 'hotels', hotelName);

export async function getHotelReviews(hotelName: string): Promise<Review[]> {
  const hotelRef = getHotelDoc(hotelName);
  const snap = await getDoc(hotelRef);
  if (snap.exists()) {
    const data = snap.data();
    return Array.isArray(data.reviews) ? data.reviews : [];
  }
  return [];
}

export async function addHotelReview(hotelName: string, review: Review): Promise<void> {
  const hotelRef = getHotelDoc(hotelName);
  const snap = await getDoc(hotelRef);
  let reviews: Review[] = [];
  if (snap.exists()) {
    const data = snap.data();
    reviews = Array.isArray(data.reviews) ? data.reviews : [];
  }
  reviews.unshift(review);
  await setDoc(hotelRef, { reviews }, { merge: true });
}

export async function updateHotelReview(hotelName: string, reviewIdx: number, review: Review): Promise<void> {
  const hotelRef = getHotelDoc(hotelName);
  const snap = await getDoc(hotelRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const reviews: Review[] = Array.isArray(data.reviews) ? data.reviews : [];
  if (reviewIdx < 0 || reviewIdx >= reviews.length) return;
  reviews[reviewIdx] = review;
  await setDoc(hotelRef, { reviews }, { merge: true });
}

export async function deleteHotelReview(hotelName: string, reviewIdx: number): Promise<void> {
  const hotelRef = getHotelDoc(hotelName);
  const snap = await getDoc(hotelRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const reviews: Review[] = Array.isArray(data.reviews) ? data.reviews : [];
  if (reviewIdx < 0 || reviewIdx >= reviews.length) return;
  reviews.splice(reviewIdx, 1);
  await setDoc(hotelRef, { reviews }, { merge: true });
}

export function onHotelReviewsSnapshot(hotelName: string, callback: (reviews: Review[]) => void) {
  const hotelRef = getHotelDoc(hotelName);
  return onSnapshot(hotelRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      callback(Array.isArray(data.reviews) ? data.reviews : []);
    } else {
      callback([]);
    }
  });
} 