import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  getDoc,
  addDoc,
  onSnapshot,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from "firebase/auth";
import { normalizeMembersToArray, getUserRole } from '@/lib/groupUtils';

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
    // Initialize memberIds with the trip owner
    let memberIds = [userId];

    // If this is a group trip, add all group members to memberIds
    if (tripData.groupId) {
      const groupDoc = await getGroupById(tripData.groupId);
      if (groupDoc && groupDoc.members) {
        // Extract UIDs from all group members and ensure uniqueness
        const groupMemberIds = groupDoc.members.map((member: GroupMember) => member.uid);
        memberIds = [...new Set([...memberIds, ...groupMemberIds])];
      }
    }

    // Ensure createdBy is set
    const tripDocRaw = {
      tripId,
      userId, // Owner of the trip
      createdBy: userId, // Explicitly set createdBy
      memberIds, // Array of UIDs that can access this trip
      groupId: tripData.groupId, // Group reference if it's a group trip
      // Store trip data at root level
      destination: tripData.destination,
      duration: tripData.duration,
      budget: tripData.budget,
      travelers: tripData.travelers,
      preferences: tripData.preferences,
      itinerary: tripData.itinerary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Utility to remove undefined fields
    function omitUndefined<T extends object>(obj: T): T {
      return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined)
      ) as T;
    }
    const tripDoc = omitUndefined(tripDocRaw);

    console.log("[saveTrip] Writing trip:", tripDoc);
    await setDoc(doc(db, 'trips', tripId), tripDoc);
    console.log("[saveTrip] Trip write complete");
  } catch (error) {
    console.error("[saveTrip] Trip write failed:", error);
    throw new Error('Failed to save trip');
  }
};

// Get all trips for a user
export const getUserTrips = async (user: { uid?: string } | null) => {
  try {
    if (!user || !user.uid) {
      throw new Error("User is not authenticated or missing UID");
    }
    // Debug: log user
    console.log("getUserTrips called with user:", user);

    // Query for trips where user is owner
    const ownedTripsQuery = query(
      collection(db, "trips"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    // Query for trips where user is a member
    const memberTripsQuery = query(
      collection(db, "trips"),
      where("memberIds", "array-contains", user.uid),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    // Debug: log queries
    console.log("Owned trips query:", ownedTripsQuery);
    console.log("Member trips query:", memberTripsQuery);

    // Run both queries in parallel
    const [ownedSnap, memberSnap] = await Promise.all([
      getDocs(ownedTripsQuery),
      getDocs(memberTripsQuery)
    ]);

    // Merge and deduplicate trips
    const tripsMap = new Map();
    ownedSnap.forEach(doc => tripsMap.set(doc.id, doc.data()));
    memberSnap.forEach(doc => tripsMap.set(doc.id, doc.data()));

    return Array.from(tripsMap.values());
  } catch (error) {
    console.error("Error in getUserTrips. User:", user, "Error:", error);
    throw error;
  }
};

// Get a specific trip by ID
export const getTripById = async (tripId: string): Promise<TripData | null> => {
  try {
    const tripDoc = await getDoc(doc(db, 'trips', tripId));
    if (tripDoc.exists()) {
      const data = tripDoc.data();
      return {
        tripId: data.tripId,
        userId: data.userId,
        destination: data.destination,
        duration: data.duration,
        budget: data.budget,
        travelers: data.travelers,
        preferences: data.preferences,
        itinerary: data.itinerary,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        groupId: data.groupId,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting trip:', error);
    throw new Error('Failed to get trip');
  }
};

// Delete a trip
export const deleteTrip = async (tripId: string, idToken?: string): Promise<void> => {
  try {
    // Call backend endpoint for cascading delete
    const response = await fetch(`http://localhost:5000/trips/${tripId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete trip');
    }
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
    // Initialize memberIds with the trip owner
    let memberIds = [userId];

    // If this is a group trip, add all group members to memberIds
    if (tripData.groupId) {
      const groupDoc = await getDoc(doc(db, 'groups', tripData.groupId));
      if (groupDoc.exists()) {
        const groupData = groupDoc.data();
        if (groupData?.members) {
          // Extract UIDs from all group members and ensure uniqueness
          const membersArray = normalizeMembersToArray(groupData.members as Record<string, GroupRole> | GroupMember[]);
          const groupMemberIds = membersArray.map((member) => member.uid);
          memberIds = [...new Set([...memberIds, ...groupMemberIds])];
        }
      }
    }

    const tripDoc = {
      tripId,
      userId,
      memberIds, // Add memberIds array for access control
      ...(tripData.groupId ? { groupId: tripData.groupId } : {}), // Only include groupId if non-empty
      tripData: JSON.stringify({
        ...tripData,
        updatedAt: new Date().toISOString(),
      }),
      updatedAt: new Date().toISOString(),
    };

    console.log('[updateTrip] About to write tripDoc:', tripDoc);
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

// Fetch a group by groupId with retry logic to handle Firestore propagation delay
export const getGroupById = async (groupId: string, maxRetries = 6, delayMs = 1000): Promise<Group | null> => {
  // First check if user is authenticated
  const { auth } = await import("@/lib/firebase");
  const currentUser = auth.currentUser;
  console.log("[getGroupById] Current user:", currentUser?.uid);

  if (!currentUser) {
    console.warn("[getGroupById] No authenticated user found");
    return null;
  }

  // Firestore may take time to propagate new documents and update security rule evaluation.
  // This retry logic helps avoid race conditions immediately after group creation.
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[getGroupById] Attempt ${attempt}/${maxRetries} for group ${groupId}`);
      const groupDoc = await import("@/lib/firebase").then(({ db }) => 
        import("firebase/firestore").then(firestore => 
          firestore.getDoc(firestore.doc(db, 'groups', groupId))
        )
      );

      if (!groupDoc.exists()) {
        console.warn(`[getGroupById] Attempt ${attempt}: Group ${groupId} not found.`);
      } else {
        const data = groupDoc.data();
        const membersArray = normalizeMembersToArray(data.members);
        const isMember = getUserRole(data.members, currentUser.uid) !== null;

        // Log group data for debugging
        console.log("[getGroupById] Group data:", {
          groupId: groupDoc.id,
          createdBy: data.createdBy,
          memberCount: membersArray.length,
          currentUserIsCreator: data.createdBy === currentUser.uid,
          currentUserIsMember: isMember
        });
        
        // Return the group data with members normalized to an array
        return {
          groupId: groupDoc.id,
          name: data.name,
          createdBy: data.createdBy,
          members: membersArray, // Return normalized array
          tripId: data.tripId
        };
      }
    } catch (error) {
      console.warn(`[getGroupById] Attempt ${attempt}: Error getting group:`, error);
    }
    if (attempt < maxRetries) {
      console.log(`[getGroupById] Waiting ${delayMs}ms before next attempt...`);
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
  return null;
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

export interface TripComment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  timestamp: number;
}

// Listen to comments in real time
export const listenToTripComments = (
  tripId: string,
  callback: (comments: TripComment[]) => void
): (() => void) => {
  const commentsRef = collection(db, 'trips', tripId, 'comments');
  const q = query(commentsRef, orderBy('timestamp', 'asc'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const comments: TripComment[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      comments.push({
        id: docSnap.id,
        text: data.text,
        authorId: data.authorId,
        authorName: data.authorName,
        timestamp: data.timestamp,
      });
    });
    callback(comments);
  });
  return unsubscribe;
};

// Add a new comment to a trip
export const addTripComment = async (
  tripId: string,
  text: string,
  authorId: string,
  authorName: string
): Promise<void> => {
  const commentsRef = collection(db, 'trips', tripId, 'comments');
  await addDoc(commentsRef, {
    text,
    authorId,
    authorName,
    timestamp: Date.now(),
  });
};

export const deleteGroupById = async (groupId: string, idToken: string): Promise<void> => {
  const response = await fetch(`http://localhost:5000/groups/${groupId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete group');
  }
}; 