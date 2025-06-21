import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { useReactToPrint } from 'react-to-print';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/contexts/AuthContext";
import { saveTrip } from "@/services/tripService";
import { Bookmark, BookmarkCheck } from "lucide-react";

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

// 1. Define the AIItinerary type
type AIItinerary = {
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

/**
 * ItineraryGenerator
 * A simple form to collect travel preferences and display the AI-generated itinerary.
 */
const ItineraryGenerator: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, signInWithGoogle } = useAuth();
  
  // Helper function to map budget values from Plan page to ItineraryGenerator
  const mapBudgetValue = (budgetParam: string | null) => {
    switch (budgetParam) {
      case "budget": return "Low";
      case "midrange": return "Medium";
      case "luxury": return "High";
      default: return "Medium";
    }
  };
  
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

  // Toast
  const { toast } = useToast();

  // Refs
  const itineraryRef = useRef<HTMLDivElement | null>(null);
  const componentRef = useRef<HTMLDivElement | null>(null);

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

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

  // Save trip to Firestore
  const handleSaveTrip = async () => {
    if (!itinerary || !user) {
      console.log("SaveTrip: missing itinerary or user", { itinerary, user });
      return;
    }
    try {
      const tripId = uuidv4();
      const tripData = {
        destination,
        duration,
        budget,
        travelers,
        preferences,
        itinerary: JSON.stringify(itinerary), // Save as string
      };
      console.log("Saving trip:", { userId: user.uid, tripId, tripData });
      await saveTrip(user.uid, tripId, tripData);
      toast({
        title: "Trip Saved!",
        description: "Your itinerary has been saved to your account.",
      });
    } catch (error) {
      console.error("SaveTrip error:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save your trip. Please try again.",
        variant: "destructive",
      });
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

      const response = await fetch("http://localhost:5000/itinerary", {
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

      if (!response.ok) {
        setError(data.error || "Failed to generate itinerary.");
        toast({ title: "Error", description: data.error || "Failed to generate itinerary.", variant: "destructive" });
      } else {
        setItinerary(data.itinerary);
        toast({ title: "Success", description: "Itinerary generated successfully!" });
      }
    } catch (err) {
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

  return (
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
      {error && (
        <div className="mt-4 text-red-600 text-center">{error}</div>
      )}

      {/* Itinerary Result */}
      {itinerary && (
        <div ref={itineraryRef} className="mt-6 space-y-6">
          <h3 className="text-lg font-bold mb-4">Your Itinerary</h3>
          {/* Printable Content */}
          <div ref={componentRef} className="bg-white text-black p-6 rounded-lg shadow-md print:p-0 print:shadow-none">
            {/* Header for PDF */}
            <div className="text-center mb-6 print:mb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 print:text-xl">SmartVoyage Itinerary</h2>
              <p className="text-gray-600 print:text-sm">{destination} • {duration} Days • {travelers} {travelers === 1 ? 'Traveler' : 'Travelers'}</p>
              <p className="text-gray-600 print:text-sm">Budget: {budget} • Generated on {new Date().toLocaleDateString()}</p>
            </div>
            {/* Days */}
            <div className="space-y-4">
              {itinerary.days.map((day, idx) => (
                <div
                  key={day.day}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-teal-600 font-bold text-lg">Day {day.day}: {day.summary}</span>
                  </div>
                  <ul className="list-none pl-0 space-y-2">
                    {day.activities.map((act, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-800">
                        <span className="font-bold">{act.time}</span>
                        <span className="font-semibold">{act.title}</span>: {act.description}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {/* Footer for PDF */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-gray-600">
              <p>Generated by SmartVoyage AI • Your AI-powered travel companion</p>
              <p className="text-sm mt-1">Visit smartvoyage.com for more travel inspiration</p>
            </div>
          </div>
          {/* Export and Share Buttons */}
          <div className="text-center print:hidden space-y-3">
            <div className="flex gap-3 justify-center flex-wrap">
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
            </div>
            {!user && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Sign in to save your trips to your account
                </p>
                <button 
                  onClick={signInWithGoogle}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  🔐 Sign in with Google
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryGenerator; 