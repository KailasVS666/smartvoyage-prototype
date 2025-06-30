import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export async function getUserFavorites(uid: string): Promise<string[]> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    return Array.isArray(data.favorites) ? data.favorites : [];
  }
  return [];
}

export async function setUserFavorites(uid: string, favorites: string[]): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { favorites }, { merge: true });
}

export async function addFavorite(uid: string, hotelName: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { favorites: arrayUnion(hotelName) });
}

export async function removeFavorite(uid: string, hotelName: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { favorites: arrayRemove(hotelName) });
} 