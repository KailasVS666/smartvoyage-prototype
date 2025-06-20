
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Filter, MapPin, Clock, DollarSign } from "lucide-react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";

const Tours = () => {
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [vibeFilter, setVibeFilter] = useState("all");
  const [destinationType, setDestinationType] = useState("all");

  const tours = [
    {
      id: 1,
      name: "Paris Essentials",
      image: "https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&h=400&fit=crop",
      location: "Paris, France",
      duration: "7 days",
      price: "From $1,299",
      budget: "luxury",
      vibe: "romantic",
      type: "international",
      description: "Explore the City of Light with curated experiences"
    },
    {
      id: 2,
      name: "Kyoto Temple Trail",
      image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&h=400&fit=crop",
      location: "Kyoto, Japan",
      duration: "5 days",
      price: "From $899",
      budget: "mid",
      vibe: "relaxing",
      type: "international",
      description: "Discover zen temples and traditional culture"
    },
    {
      id: 3,
      name: "Ladakh Adventure",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
      location: "Ladakh, India",
      duration: "6 days",
      price: "From $699",
      budget: "mid",
      vibe: "adventurous",
      type: "domestic",
      description: "Epic mountain landscapes and high-altitude adventures"
    },
    {
      id: 4,
      name: "Goa Beach Vibes",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop",
      location: "Goa, India",
      duration: "4 days",
      price: "From $399",
      budget: "low",
      vibe: "relaxing",
      type: "domestic",
      description: "Relax by pristine beaches with vibrant nightlife"
    },
    {
      id: 5,
      name: "Swiss Alps Explorer",
      image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop",
      location: "Swiss Alps",
      duration: "8 days",
      price: "From $1,899",
      budget: "luxury",
      vibe: "adventurous",
      type: "international",
      description: "Mountain peaks, luxury resorts, and pristine nature"
    },
    {
      id: 6,
      name: "Rajasthan Royal",
      image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&h=400&fit=crop",
      location: "Rajasthan, India",
      duration: "10 days",
      price: "From $899",
      budget: "mid",
      vibe: "group",
      type: "domestic",
      description: "Palaces, deserts, and royal heritage experiences"
    }
  ];

  const filteredTours = tours.filter(tour => {
    return (budgetFilter === "all" || tour.budget === budgetFilter) &&
           (vibeFilter === "all" || tour.vibe === vibeFilter) &&
           (destinationType === "all" || tour.type === destinationType);
  });

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <main className="pt-20">
        {/* Header Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-b from-gray-900 to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Explore <span className="text-teal-400 glow-text">Tours</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto">
              Discover handpicked destinations and experiences curated by our AI travel planner
            </p>
          </div>
        </section>

        {/* Filters Section */}
        <section className="py-6 sm:py-8 bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-teal-400" />
                <span className="text-white font-medium">Filters:</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <select
                  value={budgetFilter}
                  onChange={(e) => setBudgetFilter(e.target.value)}
                  className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-teal-400 focus:outline-none min-w-0 sm:min-w-[150px]"
                >
                  <option value="all">All Budgets</option>
                  <option value="low">Budget ($300-600)</option>
                  <option value="mid">Mid-range ($600-1200)</option>
                  <option value="luxury">Luxury ($1200+)</option>
                </select>

                <select
                  value={vibeFilter}
                  onChange={(e) => setVibeFilter(e.target.value)}
                  className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-teal-400 focus:outline-none min-w-0 sm:min-w-[150px]"
                >
                  <option value="all">All Vibes</option>
                  <option value="adventurous">Adventurous</option>
                  <option value="relaxing">Relaxing</option>
                  <option value="romantic">Romantic</option>
                  <option value="group">Group</option>
                  <option value="solo">Solo</option>
                </select>

                <select
                  value={destinationType}
                  onChange={(e) => setDestinationType(e.target.value)}
                  className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-teal-400 focus:outline-none min-w-0 sm:min-w-[150px]"
                >
                  <option value="all">All Destinations</option>
                  <option value="domestic">Domestic</option>
                  <option value="international">International</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Tours Grid */}
        <section className="py-12 sm:py-16 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredTours.map((tour) => (
                <Card
                  key={tour.id}
                  className="group bg-gray-900 border-gray-800 hover:border-teal-500/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-teal-500/10 overflow-hidden"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={tour.image}
                      alt={tour.name}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white group-hover:text-teal-400 transition-colors text-lg">
                      {tour.name}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-gray-400 text-sm">{tour.description}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{tour.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{tour.duration}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4">
                      <div className="flex items-center gap-1 text-teal-400 font-semibold">
                        <DollarSign className="h-4 w-4" />
                        <span>{tour.price}</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-teal-500 hover:bg-teal-400 text-black font-semibold"
                      >
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredTours.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 text-xl">No tours match your current filters.</p>
                <Button 
                  onClick={() => {
                    setBudgetFilter("all");
                    setVibeFilter("all");
                    setDestinationType("all");
                  }}
                  className="mt-4 bg-teal-500 hover:bg-teal-400 text-black"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Static Map Preview Section */}
        <section className="py-16 sm:py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Explore <span className="text-teal-400 glow-text">Destinations</span>
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Discover amazing locations around the world with our curated tour experiences
              </p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              <div className="relative overflow-hidden rounded-2xl border-2 border-teal-500/30 hover:border-teal-400/50 transition-colors duration-300">
                <img
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop"
                  alt="World Map"
                  className="w-full h-64 sm:h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                
                {/* Map Markers */}
                <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-teal-400 rounded-full border-2 border-white shadow-lg animate-pulse">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap border border-teal-400/30">
                    Paris, France
                  </div>
                </div>
                <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-teal-400 rounded-full border-2 border-white shadow-lg animate-pulse">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap border border-teal-400/30">
                    Kyoto, Japan
                  </div>
                </div>
                <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-teal-400 rounded-full border-2 border-white shadow-lg animate-pulse">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap border border-teal-400/30">
                    Goa, India
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Tours;
