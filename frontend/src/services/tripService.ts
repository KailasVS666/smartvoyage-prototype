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

// Expense type for group expense splitter
export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  timestamp: number;
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

// Create a group via backend API
export const createGroup = async (
  name: string,
  memberEmails: string[],
  tripId: string | null,
  idToken: string
): Promise<{ groupId: string }> => {
  try {
    const response = await fetch("http://localhost:5000/groups/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ name, memberEmails, tripId }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to create group");
    }
    return { groupId: data.groupId };
  } catch (error: unknown) {
    console.error("Error creating group:", error);
    let message = "Failed to create group";
    if (error instanceof Error) {
      message = error.message;
    }
    throw new Error(message);
  }
};

// Update an existing trip in Firestore
export const updateTrip = async (userId: string, tripId: string, tripData: SaveTripData): Promise<void> => {
  try {
    const tripDoc = {
      tripId,
      userId,
      tripData: JSON.stringify({
        ...tripData,
        updatedAt: new Date().toISOString(),
      }),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'trips', tripId), tripDoc, { merge: true });
  } catch (error) {
    console.error('Error updating trip:', error);
    throw new Error('Failed to update trip');
  }
};

// Add an expense to a trip's expenses array
export const addExpenseToTrip = async (tripId: string, expense: Expense): Promise<void> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);
    let expenses: Expense[] = [];
    if (tripSnap.exists()) {
      const data = tripSnap.data();
      if (Array.isArray(data.expenses)) {
        expenses = data.expenses;
      }
    }
    expenses.push(expense);
    await setDoc(tripRef, { expenses }, { merge: true });
  } catch (error) {
    console.error('Error adding expense:', error);
    throw new Error('Failed to add expense');
  }
};

// Update an expense in a trip's expenses array
export const updateExpenseInTrip = async (tripId: string, updatedExpense: Expense): Promise<void> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);
    let expenses: Expense[] = [];
    if (tripSnap.exists()) {
      const data = tripSnap.data();
      if (Array.isArray(data.expenses)) {
        expenses = data.expenses;
      }
    }
    expenses = expenses.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp);
    await setDoc(tripRef, { expenses }, { merge: true });
  } catch (error) {
    console.error('Error updating expense:', error);
    throw new Error('Failed to update expense');
  }
};

// Delete an expense from a trip's expenses array
export const deleteExpenseFromTrip = async (tripId: string, expenseId: string): Promise<void> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);
    let expenses: Expense[] = [];
    if (tripSnap.exists()) {
      const data = tripSnap.data();
      if (Array.isArray(data.expenses)) {
        expenses = data.expenses;
      }
    }
    expenses = expenses.filter(exp => exp.id !== expenseId);
    await setDoc(tripRef, { expenses }, { merge: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw new Error('Failed to delete expense');
  }
};

export type GroupRole = 'admin' | 'editor' | 'viewer';

export interface GroupMember {
  uid: string;
  role: GroupRole;
}

export interface Group {
  groupId: string;
  name: string;
  createdBy: string;
  members: GroupMember[];
  tripId?: string;
}

// Fetch a group by groupId
export const getGroupById = async (groupId: string): Promise<Group | null> => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (groupDoc.exists()) {
      return groupDoc.data() as Group;
    }
    return null;
  } catch (error) {
    console.error('Error getting group:', error);
    throw new Error('Failed to get group');
  }
};

export const generatePackingList = async (
  destination: string,
  duration: number,
  activities: string[],
  travelers: number
): Promise<{ packingList?: string; error?: string }> => {
  try {
    const response = await fetch("http://localhost:5000/itinerary/packing-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination, duration, activities, travelers }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to generate packing list");
    }
    return data;
  } catch (error: unknown) {
    console.error('Error generating packing list:', error);
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return { error: message };
  }
}; 