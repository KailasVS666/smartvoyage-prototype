import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getUserTrips, deleteTrip, TripData, AIItinerary } from "@/services/tripService";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Trash2, 
  Eye,
  Plus,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MyTrips: React.FC = () => {
  const { user, logout } = useAuth();
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserTrips();
    }
  }, [user]);

  const loadUserTrips = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userTrips = await getUserTrips(user.uid);
      setTrips(userTrips);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your trips.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    try {
      await deleteTrip(tripId);
      setTrips(trips.filter(trip => trip.tripId !== tripId));
      toast({
        title: "Trip Deleted",
        description: "Your trip has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete trip.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Sign In Required</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to view your saved trips.
          </p>
          <Link 
            to="/itinerary-generator"
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Trip
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800">My Trips</h1>
              <span className="text-sm text-gray-500">
                Welcome, {user.displayName || user.email}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/itinerary-generator">
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Trip
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your trips...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✈️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Trips Yet</h2>
            <p className="text-gray-600 mb-6">
              Start planning your next adventure by creating a new itinerary.
            </p>
            <Link to="/itinerary-generator">
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Trip
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              // Parse itinerary if it's a string
              let parsedItinerary: AIItinerary | null = null;
              if (typeof trip.itinerary === 'string') {
                try {
                  parsedItinerary = JSON.parse(trip.itinerary) as AIItinerary;
                } catch (e) {
                  parsedItinerary = null;
                }
              } else if (trip.itinerary && typeof trip.itinerary === 'object') {
                parsedItinerary = trip.itinerary as AIItinerary;
              }
              return (
                <Card key={trip.tripId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-800 truncate">
                      {trip.destination}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      Created {new Date(trip.createdAt).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-1 text-teal-600" />
                        {trip.duration} Days
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-1 text-teal-600" />
                        {trip.travelers} {trip.travelers === 1 ? 'Person' : 'People'}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="h-4 w-4 mr-1 text-teal-600" />
                        {trip.budget}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-1 text-teal-600" />
                        {trip.preferences.slice(0, 2).join(', ')}
                        {trip.preferences.length > 2 && '...'}
                      </div>
                    </div>
                    {/* Optionally, display a summary from parsedItinerary if available */}
                    {parsedItinerary && parsedItinerary.days && (
                      <div className="mt-2 text-xs text-gray-500">
                        {parsedItinerary.days.length} days, first day: {parsedItinerary.days[0].summary}
                      </div>
                    )}
                    <Link 
                      to={`/shared/${trip.tripId}`}
                      className="flex-1"
                    >
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-teal-600 text-teal-600 hover:bg-teal-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteTrip(trip.tripId)}
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTrips; 