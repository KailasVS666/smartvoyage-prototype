
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Download, ArrowLeft, Clock, Camera, Utensils, Train, Plane } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";

const BaliItinerary = () => {
  const itineraryDays = [
    {
      day: 1,
      title: "Arrival & Beach Day",
      activities: [
        { time: "11:00 AM", activity: "Arrive at Denpasar Airport", icon: Plane, type: "transport" },
        { time: "1:00 PM", activity: "Check-in at Family Resort in Seminyak", icon: MapPin, type: "accommodation" },
        { time: "3:00 PM", activity: "Family beach time at Seminyak Beach", icon: Camera, type: "leisure" },
        { time: "7:00 PM", activity: "Welcome dinner with sunset views", icon: Utensils, type: "food" }
      ]
    },
    {
      day: 2,
      title: "Cultural Exploration",
      activities: [
        { time: "9:00 AM", activity: "Visit Tanah Lot Temple", icon: Camera, type: "sightseeing" },
        { time: "11:30 AM", activity: "Traditional Balinese cooking class", icon: Utensils, type: "food" },
        { time: "2:00 PM", activity: "Rice terrace walk in Jatiluwih", icon: Camera, type: "sightseeing" },
        { time: "6:00 PM", activity: "Family spa session", icon: Camera, type: "leisure" }
      ]
    },
    {
      day: 3,
      title: "Adventure Day",
      activities: [
        { time: "8:00 AM", activity: "Family-friendly volcano hike", icon: Camera, type: "sightseeing" },
        { time: "12:00 PM", activity: "Picnic lunch with mountain views", icon: Utensils, type: "food" },
        { time: "3:00 PM", activity: "Visit monkey forest sanctuary", icon: Camera, type: "sightseeing" },
        { time: "6:00 PM", activity: "Traditional Balinese dance show", icon: Camera, type: "leisure" }
      ]
    },
    {
      day: 4,
      title: "Water Activities",
      activities: [
        { time: "9:00 AM", activity: "Snorkeling trip to Blue Lagoon", icon: Camera, type: "sightseeing" },
        { time: "12:00 PM", activity: "Beachside seafood lunch", icon: Utensils, type: "food" },
        { time: "3:00 PM", activity: "Kids' surf lessons", icon: Camera, type: "leisure" },
        { time: "6:00 PM", activity: "Beach bonfire and BBQ dinner", ion: Utensils, type: "food" }
      ]
    },
    {
      day: 5,
      title: "Ubud Cultural Day",
      activities: [
        { time: "9:00 AM", activity: "Transfer to Ubud", icon: Train, type: "transport" },
        { time: "11:00 AM", activity: "Elephant park family experience", icon: Camera, type: "sightseeing" },
        { time: "2:00 PM", activity: "Traditional Balinese lunch", icon: Utensils, type: "food" },
        { time: "4:00 PM", activity: "Art market shopping", icon: Camera, type: "leisure" }
      ]
    },
    {
      day: 6,
      title: "Relaxation Day",
      activities: [
        { time: "10:00 AM", activity: "Family yoga session", icon: Camera, type: "leisure" },
        { time: "12:00 PM", activity: "Healthy brunch at resort", icon: Utensils, type: "food" },
        { time: "3:00 PM", activity: "Pool games and relaxation", icon: Camera, type: "leisure" },
        { time: "7:00 PM", activity: "Family dinner with live music", icon: Utensils, type: "food" }
      ]
    },
    {
      day: 7,
      title: "Departure",
      activities: [
        { time: "10:00 AM", activity: "Last beach walk and photos", icon: Camera, type: "leisure" },
        { time: "12:00 PM", activity: "Farewell lunch at resort", icon: Utensils, type: "food" },
        { time: "3:00 PM", activity: "Transfer to Denpasar Airport", icon: Plane, type: "transport" },
        { time: "6:00 PM", activity: "Departure from Bali", icon: Plane, type: "transport" }
      ]
    }
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'food': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'sightseeing': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'transport': return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      case 'accommodation': return 'bg-green-500/10 border-green-500/30 text-green-400';
      default: return 'bg-teal-500/10 border-teal-500/30 text-teal-400';
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <main className="pt-20">
        {/* Header */}
        <section className="py-12 sm:py-16 bg-gradient-to-b from-gray-900 to-black">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
                Your SmartVoyage Itinerary: <span className="text-teal-400 glow-text">7 Days in Bali</span> 🏝️ (Family Vacation)
              </h1>
              <p className="text-lg sm:text-xl text-gray-400 mb-6">
                Relaxation, nature & bonding for the whole family
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/plan">
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:border-teal-400 hover:text-teal-400">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Plan Another Trip
                  </Button>
                </Link>
                <Button className="bg-teal-500 hover:bg-teal-400 text-black font-semibold">
                  <Download className="h-4 w-4 mr-2" />
                  Download Itinerary as PDF
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Itinerary Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Day-by-Day Itinerary</h2>
              
              {itineraryDays.map((day, dayIndex) => (
                <Card key={day.day} className="bg-gray-900 border-gray-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white flex items-center gap-2">
                      <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                        {day.day}
                      </div>
                      Day {day.day}: {day.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {day.activities.map((activity, actIndex) => (
                        <div
                          key={actIndex}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${getActivityColor(activity.type)}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${getActivityColor(activity.type)}`}>
                            <activity.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-3 w-3 text-gray-500" />
                              <span className="text-teal-400 text-sm font-medium">{activity.time}</span>
                            </div>
                            <span className="text-gray-300 text-sm">{activity.activity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Map and Trip Summary */}
            <div className="space-y-6">
              {/* Bali Route Map */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-teal-400" />
                    Your Route Through Bali
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-64 bg-gray-800 rounded-lg overflow-hidden border border-teal-500/30">
                    <img
                      src="https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400&h=300&fit=crop"
                      alt="Bali Beach Map"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                    
                    {/* Route Markers */}
                    <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                    <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                    <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                    
                    <div className="absolute bottom-3 left-3 text-white text-xs bg-black/60 px-2 py-1 rounded">
                      Seminyak → Ubud → Beaches
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trip Summary */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Trip Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white font-medium">7 Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Regions:</span>
                    <span className="text-white font-medium">3 Areas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Travel Type:</span>
                    <span className="text-white font-medium">Family</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vibe:</span>
                    <span className="text-white font-medium">Nature, Relaxation</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Est. Budget:</span>
                    <span className="text-teal-400 font-medium">$2,500</span>
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

export default BaliItinerary;
