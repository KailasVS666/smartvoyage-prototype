import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, DollarSign, Users, Heart, Sparkles } from "lucide-react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";

const Plan = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    destination: "",
    duration: "",
    budget: "",
    travelers: 1,
    travelType: [] as string[],
    preferences: [] as string[]
  });

  const handleTravelTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        travelType: [...prev.travelType, type]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        travelType: prev.travelType.filter(t => t !== type)
      }));
    }
  };

  const handlePreferencesChange = (preference: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        preferences: [...prev.preferences, preference]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        preferences: prev.preferences.filter(p => p !== preference)
      }));
    }
  };

  const handleGenerateItinerary = () => {
    const params = new URLSearchParams({
      destination: formData.destination,
      duration: formData.duration,
      budget: formData.budget,
      travelers: formData.travelers.toString(),
      travelType: formData.travelType.join(','),
      preferences: formData.preferences.join(',')
    });
    navigate(`/itinerary-generator?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <main className="pt-20">
        {/* Header */}
        <section className="py-12 sm:py-16 bg-gradient-to-b from-gray-900 to-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Plan Your <span className="text-teal-400 glow-text">Dream Trip</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 mb-4">
              Tell us about your dream trip, and we'll create the perfect itinerary for you.
            </p>
            <div className="flex items-center justify-center gap-2 text-teal-400">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">Powered by SmartVoyage AI</span>
            </div>
          </div>
        </section>

        {/* Trip Planning Form */}
        <section className="py-12 sm:py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="bg-gray-900 border-gray-800 border-glow">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
                  <MapPin className="h-6 w-6 text-teal-400" />
                  Trip Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                
                {/* Destination */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-gray-300 font-medium">
                    <MapPin className="h-4 w-4 text-teal-400" />
                    Destination
                  </label>
                  <Input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                    placeholder="Where would you like to go?"
                    className="bg-gray-800 text-white border-gray-700 focus:border-teal-400 h-12"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-gray-300 font-medium">
                    <Calendar className="h-4 w-4 text-teal-400" />
                    Duration
                  </label>
                  <Select value={formData.duration} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}>
                    <SelectTrigger className="bg-gray-800 text-white border-gray-700 focus:border-teal-400 h-12">
                      <SelectValue placeholder="How long is your trip?" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="3days">3 Days</SelectItem>
                      <SelectItem value="5days">5 Days</SelectItem>
                      <SelectItem value="7days">7 Days</SelectItem>
                      <SelectItem value="10days">10 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Number of Travelers */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-gray-300 font-medium">
                    <Users className="h-4 w-4 text-teal-400" />
                    Number of Travelers
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.travelers}
                    onChange={(e) => setFormData(prev => ({ ...prev, travelers: Math.max(1, parseInt(e.target.value) || 1) }))}
                    placeholder="How many people are traveling?"
                    className="bg-gray-800 text-white border-gray-700 focus:border-teal-400 h-12"
                  />
                </div>

                {/* Budget */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-gray-300 font-medium">
                    <DollarSign className="h-4 w-4 text-teal-400" />
                    Budget Range
                  </label>
                  <RadioGroup 
                    value={formData.budget} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                  >
                    {[
                      { value: "budget", label: "Budget", desc: "$500-1000" },
                      { value: "midrange", label: "Mid-range", desc: "$1000-2500" },
                      { value: "luxury", label: "Luxury", desc: "$2500+" }
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-3 p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-teal-500/50 transition-colors">
                        <RadioGroupItem value={option.value} id={option.value} className="border-teal-400 text-teal-400" />
                        <label htmlFor={option.value} className="flex-1 cursor-pointer">
                          <div className="text-white font-medium">{option.label}</div>
                          <div className="text-gray-400 text-sm">{option.desc}</div>
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Travel Type */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-gray-300 font-medium">
                    <Users className="h-4 w-4 text-teal-400" />
                    Travel Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {["Solo", "Couple", "Family", "Group"].map((type) => (
                      <div key={type} className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                        <Checkbox
                          id={type}
                          checked={formData.travelType.includes(type)}
                          onCheckedChange={(checked) => handleTravelTypeChange(type, checked as boolean)}
                          className="border-teal-400 data-[state=checked]:bg-teal-400 data-[state=checked]:border-teal-400"
                        />
                        <label htmlFor={type} className="text-white text-sm cursor-pointer">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preferences */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-gray-300 font-medium">
                    <Heart className="h-4 w-4 text-teal-400" />
                    Preferences
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["Adventure", "Food", "Nature", "Culture", "Relaxation"].map((preference) => (
                      <div key={preference} className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                        <Checkbox
                          id={preference}
                          checked={formData.preferences.includes(preference)}
                          onCheckedChange={(checked) => handlePreferencesChange(preference, checked as boolean)}
                          className="border-teal-400 data-[state=checked]:bg-teal-400 data-[state=checked]:border-teal-400"
                        />
                        <label htmlFor={preference} className="text-white text-sm cursor-pointer">
                          {preference}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="pt-6">
                  <Button 
                    onClick={handleGenerateItinerary}
                    className="w-full h-14 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-black font-bold text-lg border border-teal-400 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all duration-300"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    ✨ Generate Itinerary
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Plan;
