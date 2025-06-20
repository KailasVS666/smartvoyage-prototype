import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const BUDGET_OPTIONS = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
];

const PREFERENCE_OPTIONS = [
  "Romantic",
  "Adventure",
  "Family",
  "Culture",
  "Relaxation",
];

/**
 * ItineraryGenerator
 * A simple form to collect travel preferences and display the AI-generated itinerary.
 */
const ItineraryGenerator: React.FC = () => {
  // Form state
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState(5);
  const [budget, setBudget] = useState("Medium");
  const [preferences, setPreferences] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Toast
  const { toast } = useToast();

  // Ref for auto-scroll
  const itineraryRef = useRef<HTMLDivElement | null>(null);

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
    if (!destination.trim() || duration <= 0) {
      setError("Please enter a valid destination and duration.");
      toast({ title: "Error", description: "Please enter a valid destination and duration.", variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          days: duration,
          budget,
          preferences,
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

  // Utility: Parse itinerary string into structured sections
  const parseItinerary = (itinerary: string) => {
    const lines = itinerary.split(/\r?\n/);
    const days: { title: string; activities: string[] }[] = [];
    const budgetSection: string[] = [];
    const tipsSection: string[] = [];
    let currentDay: { title: string; activities: string[] } | null = null;
    let section: 'days' | 'budget' | 'tips' = 'days';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Match "**Day 1: ...**" or "Day 1: ..." (with or without markdown)
      if (/^(\*\*)?Day \d+:?/i.test(line)) {
        if (currentDay) days.push(currentDay);
        // Remove markdown and keep the title
        const title = line.replace(/^\*\*|\*\*$/g, '').replace(/^\*+/, '').trim();
        currentDay = { title, activities: [] };
        section = 'days';
      } else if (/Budget Breakdown/i.test(line)) {
        if (currentDay) days.push(currentDay);
        currentDay = null;
        section = 'budget';
      } else if (/Tips/i.test(line)) {
        if (currentDay) days.push(currentDay);
        currentDay = null;
        section = 'tips';
      } else if (line) {
        if (section === 'days' && currentDay) {
          // Remove markdown bullets and asterisks
          currentDay.activities.push(line.replace(/^\*+\s*/, '').replace(/^[-•]\s*/, ''));
        } else if (section === 'budget') {
          budgetSection.push(line.replace(/^\*+\s*/, '').replace(/^[-•]\s*/, ''));
        } else if (section === 'tips') {
          tipsSection.push(line.replace(/^\*+\s*/, '').replace(/^[-•]\s*/, ''));
        }
      }
    }
    if (currentDay) days.push(currentDay);
    return { days, budgetSection, tipsSection };
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
      {itinerary && (() => {
        const { days, budgetSection, tipsSection } = parseItinerary(itinerary);
        return (
          <div ref={itineraryRef} className="mt-6 space-y-6">
            <h3 className="text-lg font-bold mb-4">Your Itinerary</h3>
            {/* Days */}
            <div className="space-y-4">
              {days.map((day, idx) => (
                <div
                  key={day.title}
                  className="bg-white rounded-lg shadow border border-gray-200 p-4 md:p-6"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-teal-500 font-bold text-base md:text-lg">{day.title}</span>
                  </div>
                  <ul className="list-none pl-0 space-y-2">
                    {day.activities.map((act, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-800">
                        <span className="text-xl leading-5 select-none">{activityIcon(act)}</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {/* Budget Breakdown */}
            {budgetSection.length > 0 && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg shadow p-4 md:p-6">
                <h4 className="text-teal-700 font-semibold mb-2">Budget Breakdown</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  {budgetSection.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Tips */}
            {tipsSection.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-4 md:p-6">
                <h4 className="text-yellow-700 font-semibold mb-2">Tips</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  {tipsSection.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default ItineraryGenerator; 