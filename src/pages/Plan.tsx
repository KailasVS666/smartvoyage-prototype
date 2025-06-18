
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, Users, DollarSign, Download, Plus, Clock, Camera, Utensils } from "lucide-react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";

const Plan = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [tripData, setTripData] = useState({
    destination: "",
    days: 5,
    budget: "mid",
    travelType: "solo",
    preferences: ""
  });

  const [itinerary, setItinerary] = useState([
    { 
      day: 1, 
      activities: [
        { time: "9:00 AM", activity: "Arrival & Hotel Check-in", icon: MapPin },
        { time: "2:00 PM", activity: "City Walking Tour", icon: Camera },
        { time: "7:00 PM", activity: "Welcome Dinner at Local Restaurant", icon: Utensils }
      ]
    },
    { 
      day: 2, 
      activities: [
        { time: "10:00 AM", activity: "Museum Visit", icon: Camera },
        { time: "1:00 PM", activity: "Traditional Lunch", icon: Utensils },
        { time: "3:00 PM", activity: "Local Market Exploration", icon: MapPin }
      ]
    },
    { 
      day: 3, 
      activities: [
        { time: "8:00 AM", activity: "Adventure Activity", icon: Camera },
        { time: "12:00 PM", activity: "Scenic Viewpoint", icon: MapPin },
        { time: "6:00 PM", activity: "Cultural Show", icon: Users }
      ]
    },
    { 
      day: 4, 
      activities: [
        { time: "10:00 AM", activity: "Spa Treatment", icon: Users },
        { time: "2:00 PM", activity: "Relaxation Day", icon: Clock },
        { time: "6:00 PM", activity: "Sunset Photography", icon: Camera }
      ]
    },
    { 
      day: 5, 
      activities: [
        { time: "9:00 AM", activity: "Souvenir Shopping", icon: MapPin },
        { time: "12:00 PM", activity: "Final Sightseeing", icon: Camera },
        { time: "4:00 PM", activity: "Departure", icon: Clock }
      ]
    }
  ]);

  const handleInputChange = (field: string, value: string | number) => {
    setTripData(prev => ({ ...prev, [field]: value }));
  };

  const addActivity = (dayIndex: number) => {
    setItinerary(prev => prev.map((day, index) => 
      index === dayIndex 
        ? { 
            ...day, 
            activities: [...day.activities, { time: "12:00 PM", activity: "New Activity", icon: Clock }] 
          }
        : day
    ));
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <main className="pt-20">
        {/* Header */}
        <section className="py-12 sm:py-16 bg-gradient-to-b from-gray-900 to-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Trip <span className="text-teal-400 glow-text">Planner</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400">
              Create your perfect itinerary with AI-powered suggestions
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Planning Form */}
            <div className="space-y-8">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-teal-400" />
                    Trip Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-gray-400 mb-2">Destination</label>
                    <input
                      type="text"
                      value={tripData.destination}
                      onChange={(e) => handleInputChange("destination", e.target.value)}
                      placeholder="Where do you want to go?"
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:border-teal-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2">Duration (Days)</label>
                    <input
                      type="number"
                      value={tripData.days}
                      onChange={(e) => handleInputChange("days", parseInt(e.target.value))}
                      min="1"
                      max="30"
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:border-teal-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2">Budget Range</label>
                    <select
                      value={tripData.budget}
                      onChange={(e) => handleInputChange("budget", e.target.value)}
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:border-teal-400 focus:outline-none"
                    >
                      <option value="low">Budget ($300-600)</option>
                      <option value="mid">Mid-range ($600-1200)</option>
                      <option value="luxury">Luxury ($1200+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2">Travel Type</label>
                    <select
                      value={tripData.travelType}
                      onChange={(e) => handleInputChange("travelType", e.target.value)}
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:border-teal-400 focus:outline-none"
                    >
                      <option value="solo">Solo Travel</option>
                      <option value="couple">Couple</option>
                      <option value="family">Family</option>
                      <option value="group">Group</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2">Preferences & Interests</label>
                    <textarea
                      value={tripData.preferences}
                      onChange={(e) => handleInputChange("preferences", e.target.value)}
                      placeholder="Tell us about your interests, preferred activities, food preferences..."
                      rows={4}
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:border-teal-400 focus:outline-none resize-none"
                    />
                  </div>

                  <Button className="w-full bg-teal-500 hover:bg-teal-400 text-black font-semibold py-3">
                    Generate AI Itinerary
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Itinerary Display */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white">Your Itinerary</h2>
                <Button 
                  size="sm" 
                  className="bg-gray-800 hover:bg-gray-700 text-teal-400 border border-teal-400 w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>

              {/* Day-by-Day Itinerary */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {itinerary.map((day, index) => (
                  <Card key={day.day} className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-teal-400" />
                          Day {day.day}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addActivity(index)}
                          className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {day.activities.map((item, actIndex) => (
                          <div
                            key={actIndex}
                            className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 bg-teal-500/10 rounded-full flex items-center justify-center border border-teal-500/30">
                                <item.icon className="h-4 w-4 text-teal-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="h-3 w-3 text-gray-500" />
                                  <span className="text-teal-400 text-sm font-medium">{item.time}</span>
                                </div>
                                <span className="text-gray-300 text-sm">{item.activity}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Static Map Preview */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-teal-400" />
                    Route Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-48 sm:h-64 bg-gray-800 rounded-lg overflow-hidden border border-teal-500/30">
                    <img
                      src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop"
                      alt="Route Map"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                    
                    {/* Map Markers */}
                    <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-teal-400 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                    <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-teal-400 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                    <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-teal-400 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                    
                    <div className="absolute bottom-4 left-4 text-white text-sm bg-black/60 px-2 py-1 rounded">
                      <p>Interactive map showing your route and key locations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Plan;
