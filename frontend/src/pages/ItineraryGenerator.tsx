import React, { useState } from "react";

/**
 * ItineraryGenerator
 * A simple form to collect travel preferences and display the AI-generated itinerary.
 */
const ItineraryGenerator: React.FC = () => {
  // Form state
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState(5);
  const [budget, setBudget] = useState(1000);

  // UI state
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setItinerary(null);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          days: duration,
          budget,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate itinerary.");
      } else {
        setItinerary(data.itinerary);
      }
    } catch (err: any) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-10">
      <h2 className="text-2xl font-bold mb-4">Travel Itinerary Generator</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Destination */}
        <div>
          <label className="block font-medium mb-1">Destination</label>
          <input
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
          <label className="block font-medium mb-1">Duration (days)</label>
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {/* Budget */}
        <div>
          <label className="block font-medium mb-1">Budget ($)</label>
          <input
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-teal-500 text-white font-semibold py-2 rounded hover:bg-teal-600 transition"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Itinerary"}
        </button>
      </form>

      {/* Loading State */}
      {loading && (
        <div className="mt-4 text-gray-500 text-center">Please wait, generating your itinerary...</div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 text-red-600 text-center">{error}</div>
      )}

      {/* Itinerary Result */}
      {itinerary && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-bold mb-2">Your Itinerary</h3>
          <pre className="whitespace-pre-wrap">{itinerary}</pre>
        </div>
      )}
    </div>
  );
};

export default ItineraryGenerator; 