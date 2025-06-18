
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, Users, DollarSign, Download, Plus } from "lucide-react";
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
    { day: 1, activities: ["Arrival & Check-in", "City Walking Tour", "Welcome Dinner"] },
    { day: 2, activities: ["Museum Visit", "Local Market Exploration", "Traditional Lunch"] },
    { day: 3, activities: ["Adventure Activity", "Scenic Viewpoint", "Cultural Show"] },
    { day: 4, activities: ["Relaxation Day", "Spa Treatment", "Sunset Photography"] },
    { day: 5, activities: ["Souvenir Shopping", "Final Sightseeing", "Departure"] }
  ]);

  const handleInputChange = (field: string, value: string | number) => {
    setTripData(prev => ({ ...prev, [field]: value }));
  };

  const addActivity = (dayIndex: number) => {
    setItinerary(prev => prev.map((day, index) => 
      index === dayIndex 
        ? { ...day, activities: [...day.activities, "New Activity"] }
        : day
    ));
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <main className="pt-20">
        {/* Header */}
        <section className="py-16 bg-gradient-to-b from-gray-900 to-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Trip <span className="text-teal-400 glow-text">Planner</span>
            </h1>
            <p className="text-xl text-gray-400">
              Create your perfect itinerary with AI-powered suggestions
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
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
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Your Itinerary</h2>
                <Button 
                  size="sm" 
                  className="bg-gray-800 hover:bg-gray-700 text-teal-400 border border-teal-400"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>

              <div className="space-y-4">
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
                        {day.activities.map((activity, actIndex) => (
                          <div
                            key={actIndex}
                            className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                            <span className="text-gray-300">{activity}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Map Placeholder */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Interactive Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <MapPin className="h-12 w-12 mx-auto mb-2 text-teal-400" />
                      <p>Interactive map will appear here</p>
                      <p className="text-sm">Showing route and locations</p>
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
