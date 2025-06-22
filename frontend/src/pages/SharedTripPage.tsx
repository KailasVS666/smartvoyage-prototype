import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useReactToPrint } from 'react-to-print';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTripById, AIItinerary } from "@/services/tripService";
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TripData {
  itinerary: string;
  destination: string;
  duration: number;
  budget: string;
  travelers: number;
  preferences: string[];
  createdAt: string;
}

const SharedTripPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const componentRef = useRef<HTMLDivElement | null>(null);

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const handlePrintClick = () => {
    toast({ title: "Preparing PDF", description: "Getting your itinerary ready for export..." });
    handlePrint();
  };

  // Load trip data from localStorage or Firestore
  useEffect(() => {
    const loadTrip = async () => {
      if (!tripId) {
        setError("No trip ID provided");
        setLoading(false);
        return;
      }

      try {
        // First try to load from localStorage
        const localTrip = localStorage.getItem(`trip_${tripId}`);
        
        if (localTrip) {
          setTripData(JSON.parse(localTrip) as TripData);
          setLoading(false);
          return;
        }

        // If not in localStorage, try to load from Firestore
        const firestoreTrip = await getTripById(tripId);
        
        if (firestoreTrip) {
          setTripData(firestoreTrip as TripData);
          setLoading(false);
          return;
        }

        // If not found in either place
        setError("Trip not found");
        setLoading(false);
      } catch (err) {
        console.error('Error loading trip:', err);
        setError("Failed to load trip");
        setLoading(false);
      }
    };

    loadTrip();
  }, [tripId]);

  // Real-time collaborative editing support
  useEffect(() => {
    let isInitial = true;
    if (!tripId) return;
    const tripDocRef = doc(db, 'trips', tripId);
    const unsubscribe = onSnapshot(tripDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (typeof data.tripData === 'string') {
          try {
            const parsed = JSON.parse(data.tripData);
            setTripData(parsed);
            if (!isInitial) {
              toast({ title: 'Trip updated', description: 'This trip was updated by another group member.' });
            }
          } catch { /* ignore parse errors */ }
        }
      }
      isInitial = false;
    });
    return () => unsubscribe();
  }, [tripId]);

  // Utility: Parse itinerary string into structured sections
  const parseItinerary = (itinerary: string) => {
    const lines = itinerary.split(/\r?\n/);
    const days: { title: string; activities: string[] }[] = [];
    const budgetSection: string[] = [];
    const tipsSection: string[] = [];
    const costSection: string[] = [];
    let currentDay: { title: string; activities: string[] } | null = null;
    let section: 'days' | 'budget' | 'tips' | 'cost' = 'days';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^(\*\*)?Day \d+:?/i.test(line)) {
        if (currentDay) days.push(currentDay);
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
      } else if (/Cost|Total|Per person|₹|\$|€|£/i.test(line)) {
        const cleanLine = line.replace(/^\*+\s*/, '').replace(/^[-•]\s*/, '');
        if (cleanLine && /Cost|Total|Per person|₹|\$|€|£/i.test(cleanLine)) {
          costSection.push(cleanLine);
        }
      } else if (line) {
        if (section === 'days' && currentDay) {
          currentDay.activities.push(line.replace(/^\*+\s*/, '').replace(/^[-•]\s*/, ''));
        } else if (section === 'budget') {
          budgetSection.push(line.replace(/^\*+\s*/, '').replace(/^[-•]\s*/, ''));
        } else if (section === 'tips') {
          tipsSection.push(line.replace(/^\*+\s*/, '').replace(/^[-•]\s*/, ''));
        }
      }
    }
    if (currentDay) days.push(currentDay);
    return { days, budgetSection, tipsSection, costSection };
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Trip Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || "The trip you're looking for doesn't exist or has been removed."}
          </p>
          <Link 
            to="/itinerary-generator"
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Create New Trip
          </Link>
        </div>
      </div>
    );
  }

  // Parse itinerary if it's a string
  let parsedItinerary: AIItinerary | null = null;
  if (typeof tripData.itinerary === 'string') {
    try {
      parsedItinerary = JSON.parse(tripData.itinerary) as AIItinerary;
    } catch (e) {
      parsedItinerary = null;
    }
  } else if (tripData.itinerary && typeof tripData.itinerary === 'object') {
    parsedItinerary = tripData.itinerary as AIItinerary;
  }

  const { days, budgetSection, tipsSection, costSection } = parseItinerary(tripData.itinerary);
  const createdDate = new Date(tripData.createdAt).toLocaleDateString();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/itinerary-generator"
                className="flex items-center text-gray-600 hover:text-teal-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Generator
              </Link>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Shared on {createdDate}</p>
            </div>
            <Button 
              onClick={handlePrintClick}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Trip Info */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Shared Itinerary</h1>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-teal-600 mr-2" />
              <span className="text-gray-600">{tripData.destination}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-teal-600 mr-2" />
              <span className="text-gray-600">{tripData.duration} Days</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 text-teal-600 mr-2" />
              <span className="text-gray-600">{tripData.travelers} {tripData.travelers === 1 ? 'Traveler' : 'Travelers'}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-teal-600 mr-2" />
              <span className="text-gray-600">{tripData.budget} Budget</span>
            </div>
          </div>
        </div>

        {/* Printable Content */}
        <div ref={componentRef} className="bg-white text-black p-6 rounded-lg shadow-md print:p-0 print:shadow-none">
          {/* Header for PDF */}
          <div className="text-center mb-6 print:mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 print:text-xl">SmartVoyage Itinerary</h2>
            <p className="text-gray-600 print:text-sm">{tripData.destination} • {tripData.duration} Days • {tripData.travelers} {tripData.travelers === 1 ? 'Traveler' : 'Travelers'}</p>
            <p className="text-gray-600 print:text-sm">Budget: {tripData.budget} • Shared on {createdDate}</p>
          </div>
          
          {/* Cost Breakdown */}
          {costSection.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h4 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
                💰 Cost Breakdown
              </h4>
              <div className="space-y-2">
                {costSection.map((line, i) => (
                  <div key={i} className="text-gray-700 font-medium">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Days */}
          <div className="space-y-4">
            {parsedItinerary && parsedItinerary.days && parsedItinerary.days.map((day, idx) => (
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
          
          {/* Budget Breakdown */}
          {budgetSection.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <h4 className="text-lg font-semibold mb-3 text-gray-800">Budget Breakdown</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {budgetSection.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Tips */}
          {tipsSection.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="text-lg font-semibold mb-3 text-yellow-800">Travel Tips</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {tipsSection.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Footer for PDF */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-gray-600">
            <p>Generated by SmartVoyage AI • Your AI-powered travel companion</p>
            <p className="text-sm mt-1">Visit smartvoyage.com for more travel inspiration</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedTripPage; 