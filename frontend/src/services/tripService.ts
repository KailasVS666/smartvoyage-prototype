import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Add AIItinerary type
export type AIItinerary = {
  days: {
    day: number;
    summary: string;
    activities: {
      time: string;
      title: string;
      description: string;
    }[];
  }[];
};

export interface TripData {
  tripId: string;
  userId: string;
  destination: string;
  duration: number;
  budget: string;
  travelers: number;
  preferences: string[];
  itinerary: string | AIItinerary;
  createdAt: string;
  updatedAt: string;
  groupId?: string; // Optional group link
}

export interface SaveTripData {
  destination: string;
  duration: number;
  budget: string;
  travelers: number;
  preferences: string[];
  itinerary: string | AIItinerary;
  groupId?: string; // Optional group link
}

// Save a new trip to Firestore
export const saveTrip = async (userId: string, tripId: string, tripData: SaveTripData): Promise<void> => {
  try {
    const tripDoc = {
      tripId,
      userId,
      // Save the entire tripData as a string
      tripData: JSON.stringify({
        ...tripData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'trips', tripId), tripDoc);
  } catch (error) {
    console.error('Error saving trip:', error);
    throw new Error('Failed to save trip');
  }
};

// Get all trips for a user
export const getUserTrips = async (userId: string): Promise<TripData[]> => {
  try {
    const tripsQuery = query(
      collection(db, 'trips'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(tripsQuery);
    const trips: TripData[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (typeof data.tripData === 'string') {
        try {
          const parsed = JSON.parse(data.tripData) as TripData;
          trips.push({ ...parsed, tripId: data.tripId, userId: data.userId });
        } catch (e) {
          // fallback: skip or handle error
        }
      }
    });

    return trips;
  } catch (error) {
    console.error('Error getting user trips:', error);
    throw new Error('Failed to get user trips');
  }
};

// Get a specific trip by ID
export const getTripById = async (tripId: string): Promise<TripData | null> => {
  try {
    const tripDoc = await getDoc(doc(db, 'trips', tripId));
    if (tripDoc.exists()) {
      const data = tripDoc.data();
      if (typeof data.tripData === 'string') {
        try {
          const parsed = JSON.parse(data.tripData) as TripData;
          return { ...parsed, tripId: data.tripId, userId: data.userId };
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting trip:', error);
    throw new Error('Failed to get trip');
  }
};

// Delete a trip
export const deleteTrip = async (tripId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'trips', tripId));
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw new Error('Failed to delete trip');
  }
}; 