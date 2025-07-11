import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from 'react-to-print';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/contexts/AuthContext";
import { saveTrip, updateTrip, getTripById, Expense, addExpenseToTrip, getGroupById, Group, GroupMember, updateExpenseInTrip, deleteExpenseFromTrip, GroupRole, generatePackingList, listenToTripComments, addTripComment, TripComment, deleteGroupById, createGroup } from "@/services/tripService";
import { Bookmark, BookmarkCheck, Pencil, Trash2, Clipboard, Package, Briefcase } from "lucide-react";
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import html2pdf from 'html2pdf.js';
import { useGroupRole } from "@/hooks/useGroupRole";
import UserTripAccessStatus from "@/components/UserTripAccessStatus";
import { getUserRole, normalizeMembersToArray } from "@/lib/groupUtils";
import { addPackingListItem, toggleItemPacked, deletePackingListItem, PackingListItem } from "@/services/packingService";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { Terminal, Map as MapIcon, Users as UsersIcon, Settings, Calendar, Share2, Users, Plus, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { TabsContent } from "@/components/ui/tabs";
import ItineraryMap, { MapLocation } from '@/components/ItineraryMap';
import TripViewTabs from '@/components/TripViewTabs';
import WeatherForecast from "@/components/WeatherForecast";
import { geocodePlace } from "@/services/geocodeService";
import { Textarea } from "@/components/ui/textarea";
import { getDailyWeatherForecast } from "@/services/weatherService";

const BUDGET_OPTIONS = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
];

const PREFERENCE_OPTIONS = [
  "Adventure",
  "Food", 
  "Nature",
  "Culture",
  "Relaxation",
];

const REPLAN_REASONS = [
  "Rainy Day",
  "Low Budget",
  "More Leisure",
  "Tired Day",
  "Surprise Me"
];

// 1. Define the AIItinerary type
type AIItinerary = {
  days: Array<{
    day: number;
    summary: string;
    lat?: number;
    lng?: number;
    activities: {
      time: string;
      title: string;
      description: string;
      lat?: number;
      lng?: number;
    }[];
  }>;
};

// Define type for a single activity
interface Activity {
  time: string;
  title: string;
  description: string;
  lat?: number;
  lng?: number;
  _diff?: 'removed' | 'changed' | 'new' | 'unchanged';
}

// Utility to remove undefined fields (define once at the top)
function omitUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as T;
}

// GroupBalanceSummary component (to be implemented below main component)
function GroupBalanceSummary({ expenses, groupMembers, currentUser, userInfoMap }: { expenses: Expense[]; groupMembers: GroupMember[]; currentUser: User | null; userInfoMap: Record<string, { displayName: string; email: string }>; }) {
  // Calculate balances
  const balances: Record<string, number> = {};
  expenses.forEach(exp => {
    const share = exp.amount / exp.splitBetween.length;
    exp.splitBetween.forEach(uid => {
      if (!balances[uid]) balances[uid] = 0;
      balances[uid] -= share;
    });
    if (!balances[exp.paidBy]) balances[exp.paidBy] = 0;
    balances[exp.paidBy] += exp.amount;
  });
  // Render summary
  return (
    <div className="bg-gray-100 rounded p-4 mt-2">
      <h4 className="font-semibold mb-2">Balance Summary</h4>
      {Object.keys(balances).length === 0 ? (
        <div className="text-gray-500">No balances yet.</div>
      ) : (
        <ul className="text-sm">
          {Object.entries(balances).map(([uid, bal]) => (
            <li key={uid} className={uid === currentUser?.uid ? 'font-bold text-teal-700' : ''}>
              {(userInfoMap[uid]?.displayName || userInfoMap[uid]?.email || uid)}: {bal >= 0 ? `is owed $${bal.toFixed(2)}` : `owes $${(-bal).toFixed(2)}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * ItineraryGenerator
 * A simple form to collect travel preferences and display the AI-generated itinerary.
 */
const ItineraryGenerator: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper function to map budget values from Plan page to ItineraryGenerator
  const mapBudgetValue = (budgetParam: string | null) => {
    switch (budgetParam) {
      case "budget": return "Low";
      case "midrange": return "Medium";
      case "luxury": return "High";
      default: return "Medium";
    }
  };

  // Group-related state
  const [group, setGroup] = useState<Group | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [userInfoMap, setUserInfoMap] = useState<Record<string, { displayName: string; email: string }>>({});
  
  // Get groupId and tripId from URL params
  const groupId = searchParams.get('groupId');
  const tripId = searchParams.get('tripId');

  // Form state
  const [destination, setDestination] = useState(searchParams.get("destination") || "");
  const [duration, setDuration] = useState(parseInt(searchParams.get("duration") || "5"));
  const [budget, setBudget] = useState(mapBudgetValue(searchParams.get("budget")));
  const [travelers, setTravelers] = useState(parseInt(searchParams.get("travelers") || "1"));
  const [preferences, setPreferences] = useState<string[]>(
    searchParams.get("preferences") ? searchParams.get("preferences")!.split(",").filter(p => p) : []
  );

  // UI state
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<AIItinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tripOwnerId, setTripOwnerId] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Refs
  const itineraryRef = useRef<HTMLDivElement | null>(null);
  const componentRef = useRef<HTMLDivElement | null>(null);
  const pdfContentRef = useRef<HTMLDivElement | null>(null);

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const handleExportPdf = () => {
    const element = pdfContentRef.current;
    if (element) {
      const opt = {
        margin:       0.5,
        filename:     `${destination}-itinerary.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().from(element).set(opt).save();
    }
  };

  const handlePrintClick = () => {
    toast({ title: "Preparing PDF", description: "Getting your itinerary ready for export..." });
    handlePrint();
  };

  // Share trip handler
  const handleShareTrip = () => {
    if (!itinerary) return;
    const tripId = uuidv4();
    const tripData = {
      itinerary, // now an object
      destination,
      duration,
      budget,
      travelers,
      preferences,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(`trip_${tripId}`, JSON.stringify(tripData));
    const shareUrl = `${window.location.origin}/shared/${tripId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({ 
        title: "Link Copied!", 
        description: "Share this link with friends to show them your itinerary!" 
      });
    }).catch(() => {
      toast({ 
        title: "Share Link", 
        description: `Copy this link: ${shareUrl}`,
        variant: "destructive"
      });
    });
  };

  // Helper to wait for group to exist in Firestore
  const waitForGroup = async (groupId: string, maxRetries = 5, delayMs = 200) => {
    for (let i = 0; i < maxRetries; i++) {
      const groupDoc = await getGroupById(groupId);
      if (groupDoc) return groupDoc;
      await new Promise(res => setTimeout(res, delayMs));
    }
    throw new Error('Group not found after waiting');
  };

  // Save trip to Firestore
  const handleSaveTrip = async () => {
    if (!itinerary || !user) {
      toast({
        title: "Cannot Save Trip",
        description: !user ? "Please sign in to save your trip." : "Please generate an itinerary first.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      let finalGroupId: string | undefined = undefined;

      // If this is a group trip (from URL params)
      const isGroupTrip = searchParams.get("isGroupTrip") === "true";
      if (isGroupTrip) {
        const groupName = searchParams.get("groupName");
        const inviteEmails = searchParams.get("inviteEmails")?.split(",") || [];
        
        if (!groupName) {
          throw new Error("Group name is required for group trips");
        }

        // Create the group first
        const idToken = await user.getIdToken();
        const groupResult = await createGroup(groupName, inviteEmails, null, idToken);
        finalGroupId = groupResult.groupId;

        // Wait for the group to exist in Firestore
        await waitForGroup(finalGroupId);

        toast({
          title: "Group Created",
          description: "Successfully created your travel group!"
        });
      }

      // Now save the trip
      const tripId = uuidv4();
      const rawTripData = {
        destination,
        duration: typeof duration === 'string' ? parseInt(duration) : duration,
        budget,
        travelers,
        preferences,
        itinerary: JSON.stringify(itinerary),
        ...(finalGroupId ? { groupId: finalGroupId } : {})
      };

      // Utility to remove undefined fields
      function omitUndefined<T extends object>(obj: T): T {
        return Object.fromEntries(
          Object.entries(obj).filter(([_, v]) => v !== undefined)
        ) as T;
      }

      const tripData = omitUndefined(rawTripData);

      console.log("[handleSaveTrip] About to save trip:", tripData);
      await saveTrip(user.uid, tripId, tripData);
      console.log("[handleSaveTrip] Trip save complete");
      
      toast({
        title: "Success!",
        description: isGroupTrip 
          ? "Your group and trip have been saved." 
          : "Your trip has been saved to your account.",
      });

      // Redirect to My Trips page after successful save
      navigate("/my-trips");
    } catch (error) {
      console.error("[handleSaveTrip] Trip save failed:", error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save your trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle preference selection (multi-select)
  const handlePreferenceChange = (pref: string) => {
    setPreferences((prev) =>
      prev.includes(pref)
        ? prev.filter((p) => p !== pref)
        : [...prev, pref]
    );
  };

  // Auto-scroll to itinerary on success
  useEffect(() => {
    if (itinerary && itineraryRef.current) {
      itineraryRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [itinerary]);

  // Real-time collaborative editing support
  useEffect(() => {
    let isInitial = true;
    // Get tripId from searchParams (if present after save) or from local state if available
    const tripId = searchParams.get('tripId');
    if (!tripId) return;
    const tripDocRef = doc(db, 'trips', tripId);
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(tripDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (typeof data.tripData === 'string') {
          try {
            const parsed = JSON.parse(data.tripData);
            setItinerary(parsed.itinerary || null);
            // Only show a toast after the initial snapshot
            if (!isInitial) {
              toast({ title: 'Trip updated', description: 'This trip was updated by another group member.' });
            }
          } catch { /* ignore JSON parse errors */ }
        }
      }
      isInitial = false;
    });
    // Cleanup on unmount
    return () => unsubscribe();
  }, [searchParams]);

  // Fetch trip data and set tripOwnerId when tripId is present
  useEffect(() => {
    const tid = searchParams.get('tripId');
    if (!tid) return;
    getTripById(tid).then(trip => {
      if (trip) {
        if (trip.userId) setTripOwnerId(trip.userId);
        // Hydrate all fields from Firestore trip
        setDestination(trip.destination || "");
        setDuration(trip.duration || 1);
        setBudget(trip.budget || "Medium");
        setTravelers(trip.travelers || 1);
        setPreferences(trip.preferences || []);
        let parsedItinerary = null;
        if (typeof trip.itinerary === 'string') {
          try {
            parsedItinerary = JSON.parse(trip.itinerary);
          } catch { /* ignore JSON parse errors */ }
        } else if (trip.itinerary && typeof trip.itinerary === 'object') {
          parsedItinerary = trip.itinerary;
        }
        setItinerary(parsedItinerary);
      }
    });
  }, [searchParams]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setItinerary(null);
    setError(null);

    // Basic validation
    if (!destination.trim() || duration <= 0 || travelers < 1) {
      setError("Please enter a valid destination, duration, and number of travelers.");
      toast({ title: "Error", description: "Please enter a valid destination, duration, and number of travelers.", variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      // Map frontend values to backend expected fields
      const city = destination;
      const days = duration;
      const interests = preferences;
      // Map budget to backend enum
      let budgetLevel: 'low' | 'medium' | 'high' = 'medium';
      if (budget === 'Low') budgetLevel = 'low';
      else if (budget === 'Medium') budgetLevel = 'medium';
      else if (budget === 'High') budgetLevel = 'high';
      // Map travelStyle (try to get from searchParams, else default)
      let travelStyle: 'slow' | 'fast-paced' | 'luxurious' | 'backpacking' = 'fast-paced';
      const travelTypeParam = searchParams.get('travelType');
      if (travelTypeParam) {
        // Use the first selected travelType as a proxy for style
        const type = travelTypeParam.split(',')[0]?.toLowerCase();
        if (type === 'solo') travelStyle = 'backpacking';
        else if (type === 'couple') travelStyle = 'luxurious';
        else if (type === 'family') travelStyle = 'slow';
        else if (type === 'group') travelStyle = 'fast-paced';
      }

      const response = await fetch("/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          days,
          interests,
          budgetLevel,
          travelStyle,
        }),
      });

      const data = await response.json();
      console.log('Itinerary API response:', response, data); // Debug log

      if (data && data.itinerary) {
        // Enhanced geocoding logic for days and activities
        setGeoLoading(true);
        const enhancedDays = await Promise.all(
          data.itinerary.days.map(async (day) => {
            let dayLat: number | undefined = undefined;
            let dayLng: number | undefined = undefined;
            let found = false;
            // Try summary
            if (day.summary) {
              const geo = await geocodePlace(day.summary.split(',')[0]);
              if (geo) {
                dayLat = geo.lat;
                dayLng = geo.lng;
                found = true;
              }
            }
            // Try each activity title if summary failed
            if (!found && Array.isArray(day.activities)) {
              for (const act of day.activities) {
                if (act.title) {
                  const geo = await geocodePlace(act.title);
                  if (geo) {
                    dayLat = geo.lat;
                    dayLng = geo.lng;
                    found = true;
                    break;
                  }
                }
              }
            }
            // Fallback to main destination
            if (!found && destination) {
              const geo = await geocodePlace(destination);
              if (geo) {
                dayLat = geo.lat;
                dayLng = geo.lng;
              }
            }
            // Geocode each activity for map
            const enhancedActivities = await Promise.all(
              (day.activities || []).map(async (act) => {
                if (act.lat !== undefined && act.lng !== undefined) return act;
                if (act.title) {
                  const geo = await geocodePlace(act.title);
                  if (geo) {
                    return { ...act, lat: geo.lat, lng: geo.lng };
                  }
                }
                return act;
              })
            );
            return { ...day, lat: dayLat, lng: dayLng, activities: enhancedActivities };
          })
        );
        setItinerary({ ...data.itinerary, days: enhancedDays });
        setGeoLoading(false);
        toast({ title: "Success", description: "Itinerary generated successfully!" });
        setError(null);
      } else if (!response.ok) {
        setError(data.error || "Failed to generate itinerary.");
        toast({ title: "Error", description: data.error || "Failed to generate itinerary.", variant: "destructive" });
      } else {
        setError("Unexpected error: No itinerary returned.");
        toast({ title: "Error", description: "Unexpected error: No itinerary returned.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Itinerary generation error:", err);
      setError("Network error. Please try again.");
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Icon mapping for activity keywords
  const activityIcon = (activity: string) => {
    if (/museum|gallery|art|history/i.test(activity)) return '🏛️';
    if (/food|lunch|dinner|breakfast|restaurant|cafe|meal|eat/i.test(activity)) return '🍽️';
    if (/romantic|couple|honeymoon|love/i.test(activity)) return '💑';
    if (/adventure|hike|trek|explore|outdoor/i.test(activity)) return '🥾';
    if (/beach|relax|spa|chill|sunset/i.test(activity)) return '🏖️';
    if (/family|kids|children/i.test(activity)) return '👨‍👩‍👧‍👦';
    if (/shopping|market|bazaar/i.test(activity)) return '🛍️';
    if (/nature|park|garden|forest/i.test(activity)) return '🌳';
    if (/transport|train|flight|plane|airport|bus|taxi/i.test(activity)) return '✈️';
    if (/hotel|check-in|accommodation/i.test(activity)) return '🏨';
    if (/culture|temple|church|mosque|cathedral/i.test(activity)) return '🕌';
    return '•';
  };

  // Add state for editing modal and editing fields
  const [editOpen, setEditOpen] = useState(false);
  const [editDestination, setEditDestination] = useState(destination);
  const [editItinerary, setEditItinerary] = useState<AIItinerary | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Get tripId from searchParams (for editing existing trip)
  const isOwner = user && tripOwnerId && user.uid === tripOwnerId;

  // Open edit modal and initialize fields
  const handleEditOpen = () => {
    setEditDestination(destination);
    setEditItinerary(itinerary ? JSON.parse(JSON.stringify(itinerary)) : null);
    setEditError(null);
    setEditOpen(true);
  };

  // Handle itinerary day edits
  const handleEditDayChange = (idx: number, field: 'summary', value: string) => {
    if (!editItinerary) return;
    const newDays = editItinerary.days.map((day, i) =>
      i === idx ? { ...day, [field]: value } : day
    );
    setEditItinerary({ ...editItinerary, days: newDays });
  };

  // Add/remove days
  const handleAddDay = () => {
    if (!editItinerary) return;
    const newDayNum = editItinerary.days.length + 1;
    setEditItinerary({
      ...editItinerary,
      days: [
        ...editItinerary.days,
        { day: newDayNum, summary: '', activities: [] },
      ],
    });
  };
  const handleRemoveDay = (idx: number) => {
    if (!editItinerary) return;
    const newDays = editItinerary.days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 }));
    setEditItinerary({ ...editItinerary, days: newDays });
  };

  // Submit edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    if (!user || !tripId || !editItinerary) {
      setEditError('Missing required data.');
      setEditLoading(false);
      return;
    }
    try {
      await updateTrip(user.uid, tripId, {
        destination: editDestination,
        duration: editItinerary.days.length,
        budget,
        travelers,
        preferences,
        itinerary: editItinerary,
        groupId: searchParams.get('groupId') || undefined,
      });
      toast({ title: 'Trip updated!', description: 'Your changes have been saved.' });
      setEditOpen(false);
    } catch (err: unknown) {
      let message = 'Failed to update trip.';
      if (err instanceof Error) message = err.message;
      setEditError(message);
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    } finally {
      setEditLoading(false);
    }
  };

  // Group Expenses state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', paidBy: '', splitBetween: [] as string[] });
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);

  // Group members and user info state
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  // Packing list state
  const [packingListModalOpen, setPackingListModalOpen] = useState(false);
  const [packingListLoading, setPackingListLoading] = useState(false);
  const [packingListContent, setPackingListContent] = useState('');
  const [packingListError, setPackingListError] = useState<string | null>(null);

  // Use the new hook to get the user's role in the group
  const userRole = useGroupRole(group);

  // State for the collaborative packing list
  const [packingList, setPackingList] = useState<PackingListItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [collabPackingListLoading, setCollabPackingListLoading] = useState(false);

  // Handlers for collaborative packing list
  const handleAddItem = async () => {
    if (!tripId || !newItem.trim()) return;
    setCollabPackingListLoading(true);
    try {
      await addPackingListItem(tripId, newItem.trim());
      setNewItem("");
    } catch (error) {
      console.error("Failed to add packing item:", error);
      toast({ title: "Error", description: "Could not add item.", variant: "destructive" });
    } finally {
      setCollabPackingListLoading(false);
    }
  };

  const handleToggleItem = async (itemId: string) => {
    if (!tripId) return;
    try {
      await toggleItemPacked(tripId, itemId);
    } catch (error) {
      console.error("Failed to toggle item:", error);
      toast({ title: "Error", description: "Could not update item.", variant: "destructive" });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!tripId) return;
    try {
      await deletePackingListItem(tripId, itemId);
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast({ title: "Error", description: "Could not delete item.", variant: "destructive" });
    }
  };

  // Load group data if groupId is present
  useEffect(() => {
    if (!groupId) return; // Only fetch group if groupId is present
    const loadGroupData = async () => {
      setGroupLoading(true);
      try {
        const groupData = await getGroupById(groupId);
        if (groupData) {
          // Debug logs for group membership
          console.log("🔥 Group Members (normalized array):", groupData.members);
          console.log("👤 Current User UID:", user?.uid);
          const role = getUserRole(groupData.members, user?.uid);
          console.log("🔍 Role for current user:", role || "none");

          setGroup(groupData);
          // Load user info for group members
          const memberPromises = groupData.members.map(async (member) => {
            try {
              const userInfo = await getUserInfo(member.uid);
              return [member.uid, userInfo];
            } catch (error) {
              console.warn(`Could not load info for user ${member.uid}:`, error);
              return [member.uid, { displayName: 'Unknown User', email: '' }];
            }
          });
          const userInfoEntries = await Promise.all(memberPromises);
          setUserInfoMap(Object.fromEntries(userInfoEntries));
          setGroupMembers(groupData.members);
        } else {
          toast({
            title: "Group Access Error",
            description: "You don't have access to this group or it doesn't exist.",
            variant: "destructive"
          });
          navigate('/my-trips');
        }
      } catch (error) {
        console.error('Error loading group:', error);
        toast({
          title: "Error",
          description: "Failed to load group information.",
          variant: "destructive"
        });
      } finally {
        setGroupLoading(false);
      }
    };
    loadGroupData();
  }, [groupId, navigate, toast]);

  // For solo trips, set groupMembers to just the current user
  useEffect(() => {
    if (groupId) return; // Only run for solo trips
    if (user) {
      setGroupMembers([{ uid: user.uid, role: 'admin' }]);
      setUserInfoMap({
        [user.uid]: {
          displayName: user.displayName || user.email || 'You',
          email: user.email || '',
        },
      });
    }
  }, [groupId, user]);

  // Listen for expenses in real time if tripId and groupId
  useEffect(() => {
    const tid = searchParams.get('tripId');
    if (!tid) return;
    const tripDocRef = doc(db, 'trips', tid);
    let isInitial = true;
    const unsubscribe = onSnapshot(tripDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.expenses)) {
          setExpenses(data.expenses);
        } else {
          setExpenses([]);
        }
      }
      isInitial = false;
    });
    return () => unsubscribe();
  }, [searchParams]);

  // Listen for real-time packing list updates
  useEffect(() => {
    if (!tripId) return;

    const tripDocRef = doc(db, 'trips', tripId);
    const unsubscribe = onSnapshot(tripDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPackingList(data.packingList || []);
      }
    });

    return () => unsubscribe();
  }, [tripId]);

  // Edit/Delete expense state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit handler: open modal with expense data
  const handleEditExpense = (exp: Expense) => {
    setExpenseForm({
      title: exp.title,
      amount: exp.amount.toString(),
      paidBy: exp.paidBy,
      splitBetween: exp.splitBetween,
    });
    setEditingExpense(exp);
    setExpenseModalOpen(true);
  };

  // Update handleAddExpense to support editing
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseLoading(true);
    setExpenseError(null);
    if (!tripId || !user) {
      setExpenseError('Missing trip or user.');
      setExpenseLoading(false);
      return;
    }
    if (!expenseForm.title.trim() || !expenseForm.amount || !expenseForm.paidBy || expenseForm.splitBetween.length === 0) {
      setExpenseError('All fields are required.');
      setExpenseLoading(false);
      return;
    }
    const expense: Expense = {
      id: editingExpense ? editingExpense.id : `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      title: expenseForm.title,
      amount: parseFloat(expenseForm.amount),
      paidBy: expenseForm.paidBy,
      splitBetween: expenseForm.splitBetween,
      timestamp: editingExpense ? editingExpense.timestamp : Date.now(),
    };
    try {
      if (editingExpense) {
        await updateExpenseInTrip(tripId, expense);
        toast({ title: 'Expense updated!', description: 'Expense was updated.' });
      } else {
        await addExpenseToTrip(tripId, expense);
        toast({ title: 'Expense added!', description: 'Expense was added to the group.' });
      }
      setExpenseModalOpen(false);
      setExpenseForm({ title: '', amount: '', paidBy: user.uid, splitBetween: [] });
      setEditingExpense(null);
    } catch (err: unknown) {
      let message = editingExpense ? 'Failed to update expense.' : 'Failed to add expense.';
      if (err instanceof Error) message = err.message;
      setExpenseError(message);
      toast({ title: editingExpense ? 'Update expense failed' : 'Add expense failed', description: message, variant: 'destructive' });
    } finally {
      setExpenseLoading(false);
    }
  };

  // Delete handler
  const handleDeleteExpense = async () => {
    if (!tripId || !deleteExpenseId) return;
    setDeleteLoading(true);
    try {
      await deleteExpenseFromTrip(tripId, deleteExpenseId);
      toast({ title: 'Expense deleted', description: 'Expense was removed.' });
      setDeleteExpenseId(null);
    } catch (err: unknown) {
      let message = 'Failed to delete expense.';
      if (err instanceof Error) message = err.message;
      toast({ title: 'Delete expense failed', description: message, variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Generate packing list handler
  const handleGeneratePackingList = async () => {
    if (!destination || !duration || !travelers) {
      toast({ title: "Missing Details", description: "Please ensure destination, duration, and travelers are set.", variant: "destructive" });
      return;
    }
    setPackingListModalOpen(true);
    setPackingListLoading(true);
    setPackingListError(null);
    setPackingListContent('');
    
    try {
      const result = await generatePackingList(destination, duration, preferences, travelers);
      if (result.error || !result.packingList) {
        throw new Error(result.error || "Failed to generate packing list.");
      }
      setPackingListContent(result.packingList);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      setPackingListError(message);
      toast({ title: 'Generation Failed', description: message, variant: 'destructive' });
    } finally {
      setPackingListLoading(false);
    }
  };

  // Copy packing list to clipboard
  const handleCopyToClipboard = () => {
    // A quick way to strip markdown for plain text copy
    const plainText = packingListContent.replace(/###\s/g, '\n').replace(/-\s/g, '- ');
    navigator.clipboard.writeText(plainText).then(() => {
      toast({ title: 'Copied!', description: 'Packing list copied to clipboard.' });
    }).catch(() => {
      toast({ title: 'Copy Failed', description: 'Could not copy to clipboard.', variant: 'destructive' });
    });
  };

  // Comments state
  const [comments, setComments] = useState<TripComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Listen for comments in real time
  useEffect(() => {
    if (!tripId) return;
    setCommentsLoading(true);
    const unsubscribe = listenToTripComments(tripId, (comments) => {
      setComments(comments);
      setCommentsLoading(false);
    });
    return () => unsubscribe();
  }, [tripId]);

  // Post a new comment
  const handlePostComment = async () => {
    if (!user || !tripId || !newComment.trim()) return;
    setPostingComment(true);
    try {
      await addTripComment(tripId, newComment.trim(), user.uid, user.displayName || user.email || 'Unknown');
      setNewComment('');
      toast({ title: 'Comment posted!' });
    } catch (err) {
      toast({ title: 'Failed to post comment', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    } finally {
      setPostingComment(false);
    }
  };

  // Helper: time ago
  const timeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  // Add state for group deletion
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
  const [deleteGroupLoading, setDeleteGroupLoading] = useState(false);
  const [deleteGroupError, setDeleteGroupError] = useState<string | null>(null);

  // Add handler for group deletion
  const handleDeleteGroup = async () => {
    const groupId = searchParams.get('groupId');
    if (!groupId || !user) return;
    setDeleteGroupLoading(true);
    setDeleteGroupError(null);
    try {
      const idToken = await user.getIdToken();
      await deleteGroupById(groupId, idToken);
      toast({ title: 'Group deleted', description: 'Group and associated trips deleted successfully.' });
      setDeleteGroupDialogOpen(false);
      navigate('/my-trips');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete group';
      setDeleteGroupError(message);
      toast({ title: 'Delete failed', description: message, variant: 'destructive' });
    } finally {
      setDeleteGroupLoading(false);
    }
  };

  // Helper function to get user info
  const getUserInfo = async (uid: string) => {
    // This is a simplified version - implement proper user info fetching
    return { displayName: uid, email: '' };
  };

  // Replace previous logic for canEdit
  const canEdit = userRole === 'admin' || userRole === 'editor' || (user && user.uid === tripOwnerId);

  // Extract locations for the map from the itinerary
  const mapLocations: MapLocation[] = itinerary?.days.flatMap(day => {
    // Prefer activities with lat/lng
    const activityLocs = (day.activities || [])
      .filter(activity => activity.lat != null && activity.lng != null)
      .map(activity => ({
        name: activity.title,
        description: activity.description,
        lat: activity.lat!,
        lng: activity.lng!,
      }));
    // If no activity locations, use day location
    if (activityLocs.length === 0 && day.lat !== undefined && day.lng !== undefined) {
      return [{
        name: day.summary,
        description: day.summary,
        lat: day.lat,
        lng: day.lng,
      }];
    }
    return activityLocs;
  }) || [];

  // Fallback to main destination if no locations
  const finalMapLocations: MapLocation[] = mapLocations.length > 0
    ? mapLocations
    : destination
      ? [{ name: destination, description: destination, lat: 51.5074, lng: -0.1278 }] // London default
      : [];

  // Clear error when itinerary is set
  useEffect(() => {
    if (itinerary) setError(null);
  }, [itinerary]);

  // Replan state
  const [replanModal, setReplanModal] = useState<{ open: boolean, dayIdx: number | null }>({ open: false, dayIdx: null });
  const [replanReason, setReplanReason] = useState("");
  const [replanCustom, setReplanCustom] = useState("");
  const [replanLoading, setReplanLoading] = useState(false);
  const [replanError, setReplanError] = useState<string | null>(null);
  const [replanDiff, setReplanDiff] = useState<{ original: Activity[]; replanned: Activity[] } | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [acceptingReplan, setAcceptingReplan] = useState(false);
  // Add this new state near other replan states
  const [replanDiffDayIdx, setReplanDiffDayIdx] = useState<number | null>(null);

  // Helper: Build replan prompt
  async function buildReplanPrompt(dayIdx: number) {
    if (!itinerary) return "";
    const day = itinerary.days[dayIdx];
    const dayNumber = day.day;
    const tripDuration = itinerary.days.length;
    const currentDayItinerary = day.activities.map(a => `${a.time} - ${a.title}: ${a.description}`).join("\n");
    const weather = day.lat && day.lng ? await getDailyWeatherForecast(day.lat, day.lng, new Date(Date.now() + (day.day - 1) * 24 * 60 * 60 * 1000)) : null;
    const weatherForecast = weather ? `${weather.condition}, ${weather.temperature}°C` : "N/A";
    const userReason = replanCustom.trim() ? replanCustom : replanReason;
    return `You are a smart travel assistant helping improve existing travel plans.\n\nHere is the current itinerary for Day ${dayNumber} of a ${tripDuration}-day trip to ${destination}:\n${currentDayItinerary}\n\nUser context:\n\nNumber of travelers: ${travelers}\n\nBudget level: ${budget}\n\nTravel style: fast-paced\n\nWeather forecast: ${weatherForecast}\n\nUser requested change:\n${userReason}\n\nPlease regenerate only this day's itinerary with improved activity suggestions.\n\nOnly output the list of activities, one per line, in the format: 08:00 AM - Activity Title: Short description. No commentary, no markdown, no bullet points, no extra text.`;
  }

  // Helper: Parse Gemini response (simple version, expects list of activities)
  function parseReplannedActivities(text: string): Activity[] {
    return text.split(/\n|\r/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Remove leading bullet or markdown characters
        const cleaned = line.replace(/^[-*•]\s*/, "");
        // Match time (with or without AM/PM), dash, title, colon, description
        const match = cleaned.match(/^(\d{1,2}:\d{2}(?:\s*[APMapm]{2})?)\s*-\s*(.*?):\s*(.*)$/);
        if (match) {
          return { time: match[1].trim(), title: match[2].trim(), description: match[3].trim() };
        }
        return null;
      })
      .filter((a): a is Activity => Boolean(a));
  }

  // Helper: Diff activities
  function getDiffActivities(original: Activity[], replanned: Activity[]): (Activity & { _diff: string })[] {
    const origMap = new Map(original.map(a => [a.time + a.title, a]));
    const replannedMap = new Map(replanned.map(a => [a.time + a.title, a]));
    const result: (Activity & { _diff: string })[] = [];
    for (const act of original) {
      if (!replannedMap.has(act.time + act.title)) {
        result.push({ ...act, _diff: 'removed' });
      } else if (JSON.stringify(replannedMap.get(act.time + act.title)) !== JSON.stringify(act)) {
        result.push({ ...replannedMap.get(act.time + act.title)!, _diff: 'changed' });
      } else {
        result.push({ ...act, _diff: 'unchanged' });
      }
    }
    for (const act of replanned) {
      if (!origMap.has(act.time + act.title)) {
        result.push({ ...act, _diff: 'new' });
      }
    }
    return result;
  }

  // Handler: Open replan modal
  const handleOpenReplan = (idx: number) => {
    setReplanModal({ open: true, dayIdx: idx });
    setReplanReason("");
    setReplanCustom("");
    setReplanError(null);
  };

  // Handler: Submit replan
  const handleReplanSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (replanModal.dayIdx == null) return;
    setReplanLoading(true);
    setReplanError(null);
    try {
      const user = getAuth().currentUser;
      if (!user) {
        setReplanError('You must be logged in to replan a day.');
        setReplanLoading(false);
        return;
      }
      const idToken = await user.getIdToken();
      const prompt = await buildReplanPrompt(replanModal.dayIdx);
      // Call Gemini API (replace with your endpoint)
      const response = await fetch("/itinerary/replan-day", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      if (!data || !data.text) throw new Error("No response from AI");
      const replanned = parseReplannedActivities(data.text);
      if (!replanned.length) throw new Error("Could not parse replanned activities");
      const original = itinerary.days[replanModal.dayIdx].activities;
      setReplanDiff({ original, replanned });
      setReplanDiffDayIdx(replanModal.dayIdx); // Save the day index for the diff modal
      setShowDiff(true); // Open diff modal
      setReplanModal({ open: false, dayIdx: null }); // Close replan modal
      // Do NOT navigate or reset page here
    } catch (err: unknown) {
      if (err instanceof Error) {
        setReplanError(err.message);
      } else {
        setReplanError("Failed to replan day");
      }
    } finally {
      setReplanLoading(false);
    }
  };

  // Handler: Accept replanned day
  const handleAcceptReplan = async () => {
    console.log('[handleAcceptReplan] called');
    toast({ title: 'Accept Changes clicked', description: 'Handler started.' });
    if (!replanDiff || replanDiff.original == null || replanDiff.replanned == null) {
      console.log('[handleAcceptReplan] Missing replanDiff');
      return;
    }
    if (!itinerary) {
      console.log('[handleAcceptReplan] No itinerary');
      return;
    }
    // Find the day index by matching the original activities array
    const dayIdx = itinerary.days.findIndex(day => day.activities === replanDiff.original);
    // Fallback: if not found, use the last used dayIdx from replanModal (may be null)
    const updateIdx = dayIdx !== -1 ? dayIdx : replanDiffDayIdx;
    if (updateIdx == null) {
      console.log('[handleAcceptReplan] No valid dayIdx');
      return;
    }
    setAcceptingReplan(true);
    // Deep copy the itinerary and days array to ensure React state updates
    const newItinerary = JSON.parse(JSON.stringify(itinerary));
    newItinerary.days[updateIdx].activities = replanDiff.replanned;
    console.log('[handleAcceptReplan] About to setItinerary', newItinerary);
    setItinerary(newItinerary);
    try {
      if (tripId && user) {
        console.log('[handleAcceptReplan] About to call updateTrip', { tripId, userId: user.uid });
        const groupIdFromParams = searchParams.get('groupId');
        const updateData = {
          destination,
          duration,
          budget,
          travelers,
          preferences,
          itinerary: newItinerary,
          ...(groupIdFromParams ? { groupId: groupIdFromParams } : {}),
        };
        const cleanedUpdateData = omitUndefined(updateData);
        console.log('Final updateData:', cleanedUpdateData);
        await updateTrip(user.uid, tripId, cleanedUpdateData);
        console.log('[handleAcceptReplan] updateTrip success');
        toast({ title: 'Day replanned!', description: 'The replanned day has been saved.' });
      }
    } catch (err) {
      console.error('[handleAcceptReplan] updateTrip error', err);
      toast({ title: 'Failed to save replanned day', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    } finally {
      setAcceptingReplan(false);
      console.log('[handleAcceptReplan] finished');
      setShowDiff(false);
      setReplanDiff(null);
      setReplanDiffDayIdx(null);
    }
  };

  // Handler: Discard replanned day
  const handleDiscardReplan = () => {
    setShowDiff(false);
    setReplanDiff(null);
    setReplanDiffDayIdx(null);
  };

  // Add at the top, after other useState hooks
  const [activityModal, setActivityModal] = useState<{ open: boolean, dayIdx: number | null, activityIdx: number | null }>({ open: false, dayIdx: null, activityIdx: null });
  const [activityForm, setActivityForm] = useState({ time: '', title: '', description: '' });
  const [editingActivity, setEditingActivity] = useState(false);
  const [dayNotes, setDayNotes] = useState<{ [dayIdx: number]: string }>({});

  // Add at the top, after other useState hooks (with other modals)
  const [deleteActivityDialog, setDeleteActivityDialog] = useState<{ open: boolean, dayIdx: number | null, activityIdx: number | null }>({ open: false, dayIdx: null, activityIdx: null });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      {user && group?.members && (
        <UserTripAccessStatus user={user} members={group.members} />
      )}
      <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-10">
        <h2 className="text-2xl font-bold mb-4">Travel Itinerary Generator</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Destination */}
          <div>
            <label className="block font-medium mb-1" htmlFor="destination">Destination</label>
            <input
              id="destination"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="e.g. Paris"
            />
          </div>
          {/* Duration */}
          <div>
            <label className="block font-medium mb-1" htmlFor="duration">Duration (days)</label>
            <input
              id="duration"
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="e.g. 5"
            />
          </div>
          {/* Number of Travelers */}
          <div>
            <label className="block font-medium mb-1" htmlFor="travelers">Number of Travelers</label>
            <input
              id="travelers"
              type="number"
              min={1}
              value={travelers}
              onChange={(e) => setTravelers(Math.max(1, parseInt(e.target.value) || 1))}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="e.g. 2"
            />
          </div>
          {/* Budget */}
          <div>
            <label className="block font-medium mb-1" htmlFor="budget">Budget</label>
            <select
              id="budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {BUDGET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {/* Preferences */}
          <div>
            <label className="block font-medium mb-1">Travel Preferences</label>
            <div className="flex flex-wrap gap-2">
              {PREFERENCE_OPTIONS.map((pref) => (
                <label key={pref} className={`flex items-center px-3 py-1 rounded border cursor-pointer ${preferences.includes(pref) ? "bg-teal-500 text-white border-teal-500" : "bg-gray-100 text-gray-700 border-gray-300"}`}>
                  <input
                    type="checkbox"
                    checked={preferences.includes(pref)}
                    onChange={() => handlePreferenceChange(pref)}
                    className="mr-2 accent-teal-500"
                  />
                  {pref}
                </label>
              ))}
            </div>
          </div>
          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-teal-500 text-white font-semibold py-2 rounded hover:bg-teal-600 transition"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Generating...
              </span>
            ) : "Generate Itinerary"}
          </button>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="mt-4 text-gray-500 text-center flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            Generating your itinerary...
          </div>
        )}

        {/* Error Message */}
        {error && !itinerary && (
          <div className="mt-4 text-red-600 text-center">{error}</div>
        )}

        {/* Itinerary Result */}
        {itinerary && (
          <div ref={itineraryRef} className="mt-6 space-y-6">
            <TripViewTabs
              itineraryContent={
                (
            <div ref={pdfContentRef}>
              <div ref={componentRef} className="bg-white text-black p-6 rounded-lg shadow-md print:p-0 print:shadow-none">
                {/* Header for PDF */}
                <div className="text-center mb-6 print:mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2 print:text-xl">SmartVoyage Itinerary</h2>
                  <p className="text-gray-600 print:text-sm">{destination} • {duration} Days • {travelers} {travelers === 1 ? 'Traveler' : 'Travelers'}</p>
                  <p className="text-gray-600 print:text-sm">Budget: {budget} • Generated on {new Date().toLocaleDateString()}</p>
                </div>
                {/* Days */}
                <div className="space-y-4">
                  {Array.isArray(itinerary?.days) && itinerary.days.length > 0 ? (
                    itinerary.days.map((dayRaw, idx) => {
                      const day = dayRaw as { day: number; summary: string; lat?: number; lng?: number; activities: { time: string; title: string; description: string; lat?: number; lng?: number; }[] };
                      return (
                      <div
                        key={day.day}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-teal-600 font-bold text-lg">Day {day.day}: {day.summary}</span>
                            <Button size="sm" className="ml-2" onClick={() => handleOpenReplan(idx)}>Replan This Day</Button>
                        </div>
                        <ul className="list-none pl-0 space-y-2">
                          {Array.isArray(day.activities) && day.activities.length > 0 ? (
                            day.activities.map((act, i) => (
                              <li key={i} className="flex items-start gap-2 text-gray-800">
                                <span className="font-bold">{act.time}</span>
                                <span className="font-semibold">{act.title}</span>: {act.description}
                                {/* Edit/Delete buttons */}
                                <button className="ml-2 text-blue-500 hover:underline" onClick={() => {
                                  setActivityForm({ time: act.time, title: act.title, description: act.description });
                                  setActivityModal({ open: true, dayIdx: idx, activityIdx: i });
                                  setEditingActivity(true);
                                }}>Edit</button>
                                <button className="ml-1 text-red-500 hover:underline" onClick={() => {
                                  setDeleteActivityDialog({ open: true, dayIdx: idx, activityIdx: i });
                                }}>Delete</button>
                              </li>
                            ))
                          ) : (
                            <li className="text-gray-500">No activities for this day.</li>
                          )}
                        </ul>
                        {/* Add Activity button */}
                        <button className="mt-2 px-3 py-1 bg-green-500 text-white rounded" onClick={() => {
                          setActivityForm({ time: '', title: '', description: '' });
                          setActivityModal({ open: true, dayIdx: idx, activityIdx: null });
                          setEditingActivity(false);
                        }}>Add Activity</button>
                        {/* Day Note section */}
                        <div className="mt-3">
                          <label className="block font-medium mb-1">Day Note</label>
                          <textarea
                            className="w-full border rounded px-2 py-1"
                            placeholder="Add a note for this day..."
                            value={dayNotes[idx] || ''}
                            onChange={e => setDayNotes({ ...dayNotes, [idx]: e.target.value })}
                            rows={2}
                          />
                        </div>
                          {/* Weather Forecast for this day */}
                          {day.lat !== undefined && day.lng !== undefined && (
                            <WeatherForecast
                              lat={day.lat}
                              lng={day.lng}
                              date={new Date(Date.now() + (day.day - 1) * 24 * 60 * 60 * 1000)}
                            />
                          )}
                      </div>
                      );
                    })
                  ) : (
                    <div className="text-gray-500">No itinerary days found.</div>
                  )}
                </div>
                {/* Footer for PDF */}
                <div className="mt-8 pt-4 border-t border-gray-200 text-center text-gray-600">
                  <p>Generated by SmartVoyage AI • Your AI-powered travel companion</p>
                  <p className="text-sm mt-1">Visit smartvoyage.com for more travel inspiration</p>
                </div>
              </div>
            </div>
                )
              }
              dashboardContent={
                (
                        <div>
                    {/* All other components like expenses, packing list, etc. go here */}
                    {/* Group Expenses UI */}
            {searchParams.get('groupId') && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">Group Expenses</h3>
                  <Button onClick={() => setExpenseModalOpen(true)} className="bg-teal-600 text-white" disabled={!canEdit}>Add Expense</Button>
                </div>
                <div className="overflow-x-auto bg-gray-50 rounded-lg p-4 mb-4">
                  {!canEdit && (
                    <div className="text-yellow-700 bg-yellow-100 border border-yellow-300 rounded p-2 mb-4 text-center">
                      You have view-only access to this trip. Only admins and editors can make changes.
                    </div>
                  )}
                  {expenses.length === 0 ? (
                    <div className="text-gray-500">No expenses yet.</div>
                  ) : (
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-700">
                          <th className="py-1 px-2">Title</th>
                          <th className="py-1 px-2">Amount</th>
                          <th className="py-1 px-2">Paid By</th>
                          <th className="py-1 px-2">Split Between</th>
                          <th className="py-1 px-2">Date</th>
                          <th className="py-1 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.sort((a, b) => b.timestamp - a.timestamp).map(exp => (
                          <tr key={exp.id} className="border-t">
                            <td className="py-1 px-2">{exp.title}</td>
                            <td className="py-1 px-2">${exp.amount.toFixed(2)}</td>
                            <td className="py-1 px-2">{userInfoMap[exp.paidBy]?.displayName || userInfoMap[exp.paidBy]?.email || exp.paidBy}</td>
                            <td className="py-1 px-2">{exp.splitBetween.map(uid => userInfoMap[uid]?.displayName || userInfoMap[uid]?.email || uid).join(', ')}</td>
                            <td className="py-1 px-2">{new Date(exp.timestamp).toLocaleString()}</td>
                            <td className="py-1 px-2 flex gap-2">
                              <button onClick={() => canEdit && handleEditExpense(exp)} className={`text-blue-600 hover:text-blue-800 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`} title="Edit" disabled={!canEdit}><Pencil className="h-4 w-4" /></button>
                              <button onClick={() => canEdit && setDeleteExpenseId(exp.id)} className={`text-red-600 hover:text-red-800 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`} title="Delete" disabled={!canEdit}><Trash2 className="h-4 w-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                        {/* Edit Expense Modal */}
                {/* Balance Summary */}
                <GroupBalanceSummary expenses={expenses} groupMembers={groupMembers} currentUser={user} userInfoMap={userInfoMap} />
                {/* Add Expense Modal */}
                <Dialog open={expenseModalOpen} onOpenChange={setExpenseModalOpen}>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Expense</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                      Fill in the details below to add a new group expense. All group members will see this in real time.
                    </DialogDescription>
                    <form onSubmit={handleAddExpense} className="space-y-4">
                      <Input
                        placeholder="Title (e.g. Dinner)"
                        value={expenseForm.title}
                        onChange={e => setExpenseForm(f => ({ ...f, title: e.target.value }))}
                        required
                        disabled={!canEdit}
                      />
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={expenseForm.amount}
                        onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                        required
                        min={0.01}
                        step={0.01}
                        disabled={!canEdit}
                      />
                      {/* Paid By dropdown */}
                      <div className="flex gap-2">
                        <Select
                          value={expenseForm.paidBy}
                          onValueChange={val => setExpenseForm(f => ({ ...f, paidBy: val }))}
                          required
                          disabled={!canEdit}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Paid By" />
                          </SelectTrigger>
                          <SelectContent>
                            {groupMembers.map(m => (
                              <SelectItem key={m.uid} value={m.uid}>
                                {userInfoMap[m.uid]?.displayName || userInfoMap[m.uid]?.email || m.uid}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Split Between multi-select (simple checkboxes for now) */}
                      <div className="flex flex-col gap-1">
                        <div className="font-medium text-sm mb-1">Split Between</div>
                        {groupMembers.map(m => (
                          <label key={m.uid} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={expenseForm.splitBetween.includes(m.uid)}
                              onChange={e => {
                                const checked = e.target.checked;
                                setExpenseForm(f => ({
                                  ...f,
                                  splitBetween: checked
                                    ? [...f.splitBetween, m.uid]
                                    : f.splitBetween.filter(uid => uid !== m.uid)
                                }));
                              }}
                              disabled={!canEdit}
                            />
                            {userInfoMap[m.uid]?.displayName || userInfoMap[m.uid]?.email || m.uid}
                          </label>
                        ))}
                      </div>
                      {expenseError && <div className="text-red-600 text-sm">{expenseError}</div>}
                      <DialogFooter>
                        <Button type="submit" disabled={expenseLoading || !canEdit} className="bg-teal-600 text-white w-full">{expenseLoading ? (editingExpense ? 'Saving...' : 'Adding...') : (editingExpense ? 'Save Changes' : 'Add Expense')}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}

                    {/* Collaborative Packing List */}
                    {groupId && (
                      <Card className="mt-8">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Briefcase className="h-6 w-6" /> Collaborative Packing List
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {packingList.length > 0 ? (
                            <div className="space-y-3">
                              {packingList.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-gray-50">
                                  <Checkbox
                                    id={`item-${item.id}`}
                                    checked={!!item.packedBy}
                                    onCheckedChange={() => handleToggleItem(item.id)}
                                  />
                                  <div className="flex-1">
                                    <label
                                      htmlFor={`item-${item.id}`}
                                      className={cn(
                                        "font-medium cursor-pointer",
                                        item.packedBy && "line-through text-gray-500"
                                      )}
                                    >
                                      {item.item}
                                    </label>
                                    <p className="text-xs text-gray-500">
                                      Added by {userInfoMap[item.addedBy]?.displayName || 'Unknown'}.
                                      {item.packedBy && ` Packed by ${userInfoMap[item.packedBy]?.displayName || 'Unknown'}.`}
                                    </p>
                                  </div>
                                  {(userRole === 'admin' || item.addedBy === user?.uid) && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="h-8 w-8 text-gray-500 hover:text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Delete item</span>
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">No items on the packing list yet. Add one below!</p>
                          )}

                          <form onSubmit={(e) => { e.preventDefault(); handleAddItem(); }} className="mt-4">
                            <div className="flex gap-2">
                              <Input
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="e.g., Sunscreen, Hiking boots..."
                                disabled={collabPackingListLoading}
                              />
                              <Button type="submit" disabled={!newItem.trim() || collabPackingListLoading}>
                                <Plus className="h-4 w-4 mr-2" />
                                {collabPackingListLoading ? 'Adding...' : 'Add'}
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )
              }
              mapContent={
                (
                  <div className="h-[600px] w-full mt-4">
                    <ItineraryMap locations={finalMapLocations} />
                  </div>
                )
              }
            />

            {/* Export and Share Buttons */}
            <div className="text-center print:hidden space-y-3 mt-6">
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={handleExportPdf}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-lg"
                >
                  Export Trip to PDF
                </button>
                <button 
                  onClick={handlePrintClick}
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold shadow-lg"
                >
                  🖨️ Export Itinerary as PDF
                </button>
                <button 
                  onClick={handleShareTrip}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg"
                >
                  📤 Share Trip
                </button>
                {user && (
                  <button 
                    onClick={handleSaveTrip}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-lg flex items-center"
                  >
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save Trip
                  </button>
                )}
                {itinerary && (
                  <button
                    onClick={handleGeneratePackingList}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-lg flex items-center"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Generate Packing List
                  </button>
                )}
              </div>
              {!user && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Sign in to save your trips to your account
                  </p>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      signInWithGoogle(true);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    🔐 Sign in with Google
                  </button>
                </div>
              )}
            </div>
            {/* Edit Trip Button and Modal */}
            {user && itinerary && tripId && isOwner && (
              <div className="mb-4">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={handleEditOpen}
                >
                  Edit Trip
                </button>
                {editOpen && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg">
                      <h3 className="text-xl font-bold mb-4">Edit Trip</h3>
                      <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div>
                          <label className="block font-medium mb-1">Trip Name</label>
                          <input
                            type="text"
                            value={editDestination}
                            onChange={e => setEditDestination(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-medium mb-1">Itinerary Days</label>
                          <div className="space-y-2">
                            {editItinerary?.days.map((day, idx) => (
                              <div key={idx} className="border rounded p-2 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">Day {day.day}:</span>
                                  <input
                                    type="text"
                                    value={day.summary}
                                    onChange={e => handleEditDayChange(idx, 'summary', e.target.value)}
                                    className="flex-1 border rounded px-2 py-1"
                                    placeholder="Summary"
                                    required
                                  />
                                  <button type="button" onClick={() => handleRemoveDay(idx)} className="text-red-500 ml-2">Remove</button>
                                </div>
                              </div>
                            ))}
                            <button type="button" onClick={handleAddDay} className="mt-2 px-3 py-1 bg-teal-500 text-white rounded">Add Day</button>
                          </div>
                        </div>
                        {editError && <div className="text-red-600 text-sm">{editError}</div>}
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={editLoading || !canEdit}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* After groupMembers are loaded and if groupId is present, show group members and their roles */}
            {searchParams.get('groupId') && groupMembers.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Group Members</h4>
                <div className="flex flex-wrap gap-2">
                  {groupMembers.map(m => (
                    <div key={m.uid} className="flex items-center gap-2 bg-gray-100 rounded px-3 py-1">
                      <span>{userInfoMap[m.uid]?.displayName || userInfoMap[m.uid]?.email || m.uid}</span>
                      <Badge variant={
                        m.role === 'admin' ? 'default' : m.role === 'editor' ? 'secondary' : 'outline'
                      }>{m.role.charAt(0).toUpperCase() + m.role.slice(1)}</Badge>
                    </div>
                  ))}
                </div>
                {userRole === 'admin' && (
                  <div className="mt-4">
                    <Button variant="destructive" onClick={() => setDeleteGroupDialogOpen(true)} disabled={deleteGroupLoading}>
                      Delete Group
                    </Button>
                  </div>
                )}
              </div>
            )}
            {/* Packing List Modal */}
            <Dialog open={packingListModalOpen} onOpenChange={setPackingListModalOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Your Personalized Packing List</DialogTitle>
                  <DialogDescription>
                    Here is a suggested packing list for your trip to {destination}.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-4 bg-gray-50 rounded">
                  {packingListLoading && (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-8 w-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      <span className="ml-2">Generating...</span>
                    </div>
                  )}
                  {packingListError && <div className="text-red-600 text-center">{packingListError}</div>}
                  {packingListContent && !packingListLoading && (
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {packingListContent}
                    </pre>
                  )}
                </div>
                <DialogFooter>
                  {packingListContent && !packingListLoading && (
                    <Button variant="outline" onClick={handleCopyToClipboard}>
                      <Clipboard className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </Button>
                  )}
                  <Button onClick={() => setPackingListModalOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
        {tripId && (
          <div className="max-w-xl mx-auto mt-10 mb-16">
            <h3 className="text-lg font-bold mb-2">Comments</h3>
            <div className="bg-white rounded shadow p-4 max-h-64 overflow-y-auto mb-4 border border-gray-100">
              {commentsLoading ? (
                <div className="text-gray-500 text-center">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-gray-400 text-center">No comments yet. Be the first to comment!</div>
              ) : (
                <ul className="space-y-3">
                  {comments.map(c => (
                    <li key={c.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-700 uppercase">
                        {c.authorName?.[0] || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{c.authorName}</span>
                          <span className="text-xs text-gray-400">{timeAgo(c.timestamp)}</span>
                        </div>
                        <div className="text-gray-700 text-sm whitespace-pre-line">{c.text}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex gap-2 items-end">
              <textarea
                className="flex-1 border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400"
                rows={2}
                placeholder="Write a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                disabled={postingComment}
                maxLength={500}
              />
              <Button
                onClick={handlePostComment}
                disabled={postingComment || !newComment.trim()}
                className="h-10 px-5 bg-teal-600 text-white rounded-lg font-semibold"
              >
                {postingComment ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
      {/* Group Deletion Confirmation Dialog */}
      <Dialog open={deleteGroupDialogOpen} onOpenChange={setDeleteGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete this group? This action cannot be undone. All group members will lose access to this group and its trip.
          </DialogDescription>
          {deleteGroupError && <div className="text-red-600 text-sm mb-2">{deleteGroupError}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteGroupDialogOpen(false)} disabled={deleteGroupLoading}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteGroup} disabled={deleteGroupLoading}>
              {deleteGroupLoading ? 'Deleting...' : 'Delete Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Replan Modal */}
      {showDiff && replanDiff ? (
        // Render ONLY the diff modal
        <Dialog open={showDiff} onOpenChange={open => {
          setShowDiff(open);
          if (!open) {
            setReplanDiff(null);
            setReplanModal({ open: false, dayIdx: null });
            setReplanDiffDayIdx(null);
          }
        }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Compare Changes</DialogTitle>
              <DialogDescription>Review the replanned day and accept or discard changes.</DialogDescription>
            </DialogHeader>
            <div className="flex gap-6">
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Original</h4>
                <ul className="space-y-2">
                  {getDiffActivities(replanDiff.original, replanDiff.replanned).filter(a => a._diff !== 'new').map((act, i) => (
                    <li key={i} className={act._diff === 'removed' ? 'text-gray-400 line-through' : act._diff === 'changed' ? 'bg-green-100 text-green-800 rounded px-2' : ''}>
                      <span className="font-bold">{act.time}</span> <span className="font-semibold">{act.title}</span>: {act.description}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Replanned</h4>
                <ul className="space-y-2">
                  {getDiffActivities(replanDiff.original, replanDiff.replanned).filter(a => a._diff !== 'removed').map((act, i) => (
                    <li key={i} className={act._diff === 'new' ? 'bg-blue-100 text-blue-800 rounded px-2' : act._diff === 'changed' ? 'bg-green-100 text-green-800 rounded px-2' : ''}>
                      <span className="font-bold">{act.time}</span> <span className="font-semibold">{act.title}</span>: {act.description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleDiscardReplan} variant="outline">Discard</Button>
              <Button onClick={handleAcceptReplan} className="bg-teal-600 text-white" disabled={!replanDiff || replanDiffDayIdx == null || acceptingReplan}>{acceptingReplan ? 'Saving...' : 'Accept Changes'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        // Otherwise, render the replan modal if open
        <Dialog open={replanModal.open} onOpenChange={open => setReplanModal({ open, dayIdx: open ? replanModal.dayIdx : null })}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Replan Day {replanModal.dayIdx != null ? itinerary?.days[replanModal.dayIdx].day : ""}</DialogTitle>
              <DialogDescription>
                Select a reason or enter a custom prompt to replan this day.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={replanReason} onValueChange={setReplanReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REPLAN_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea
                value={replanCustom}
                onChange={e => setReplanCustom(e.target.value)}
                placeholder="Or enter a custom prompt (optional)"
                className="w-full"
                rows={3}
              />
              {replanError && <div className="text-red-600 text-sm">{replanError}</div>}
            </div>
            <DialogFooter>
              <Button onClick={() => setReplanModal({ open: false, dayIdx: null })} variant="outline">Cancel</Button>
              <Button onClick={handleReplanSubmit} disabled={replanLoading || (!replanReason && !replanCustom)}>
                {replanLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Replanning...
                  </span>
                ) : "Replan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {activityModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-xl font-bold mb-4">{editingActivity ? 'Edit Activity' : 'Add Activity'}</h3>
            <form onSubmit={e => {
              e.preventDefault();
              if (activityModal.dayIdx == null) return;
              const newActivity = { ...activityForm };
              const newDays = itinerary.days.map((d, dIdx) => {
                if (dIdx !== activityModal.dayIdx) return d;
                const newActs = [...d.activities];
                if (editingActivity && activityModal.activityIdx != null) {
                  newActs[activityModal.activityIdx] = newActivity;
                } else {
                  newActs.push(newActivity);
                }
                return { ...d, activities: newActs };
              });
              setItinerary({ ...itinerary, days: newDays });
              setActivityModal({ open: false, dayIdx: null, activityIdx: null });
              setEditingActivity(false);
              // Toast for add/edit
              toast({
                title: editingActivity ? 'Activity updated!' : 'Activity added!',
                description: editingActivity ? 'The activity was updated.' : 'A new activity was added to this day.'
              });
            }} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Time</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={activityForm.time} onChange={e => setActivityForm(f => ({ ...f, time: e.target.value }))} required />
              </div>
              <div>
                <label className="block font-medium mb-1">Title</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={activityForm.title} onChange={e => setActivityForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea className="w-full border rounded px-2 py-1" value={activityForm.description} onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))} required rows={2} />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setActivityModal({ open: false, dayIdx: null, activityIdx: null }); setEditingActivity(false); }} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{editingActivity ? 'Save' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Activity Dialog */}
      <Dialog open={deleteActivityDialog.open} onOpenChange={open => setDeleteActivityDialog(d => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete this activity? This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteActivityDialog({ open: false, dayIdx: null, activityIdx: null })}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (deleteActivityDialog.dayIdx == null || deleteActivityDialog.activityIdx == null) return;
              const newDays = itinerary.days.map((d, dIdx) =>
                dIdx === deleteActivityDialog.dayIdx ? { ...d, activities: d.activities.filter((_, aIdx) => aIdx !== deleteActivityDialog.activityIdx) } : d
              );
              setItinerary({ ...itinerary, days: newDays });
              setDeleteActivityDialog({ open: false, dayIdx: null, activityIdx: null });
              toast({
                title: 'Activity deleted',
                description: 'The activity was removed from this day.'
              });
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItineraryGenerator; 