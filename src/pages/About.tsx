
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Users, Globe, Award } from "lucide-react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";

const About = () => {
  const values = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Our advanced algorithms learn from millions of travel experiences to create perfect itineraries."
    },
    {
      icon: Users,
      title: "Community-Driven",
      description: "Built by travelers, for travelers. Every feature is designed based on real user needs."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "From hidden local gems to world-famous destinations, we cover every corner of the globe."
    },
    {
      icon: Award,
      title: "Excellence First",
      description: "We're committed to delivering the highest quality travel planning experience."
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              About <span className="text-teal-400 glow-text">SmartVoyage</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              We're revolutionizing travel planning with artificial intelligence, making it easier than ever 
              to discover amazing destinations and create unforgettable experiences.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 sm:py-20 bg-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                  Our <span className="text-teal-400 glow-text">Story</span>
                </h2>
                <div className="space-y-6 text-gray-400 leading-relaxed">
                  <p>
                    SmartVoyage was born from a simple frustration: travel planning was too complicated, 
                    time-consuming, and often resulted in missed opportunities to discover amazing experiences.
                  </p>
                  <p>
                    We believed there had to be a better way. By combining the power of artificial intelligence 
                    with deep travel expertise, we created a platform that understands your preferences, 
                    budget, and travel style to craft personalized itineraries in minutes, not hours.
                  </p>
                  <p>
                    Today, thousands of travelers trust SmartVoyage to plan their perfect trips, from 
                    weekend getaways to once-in-a-lifetime adventures. Every journey is unique, just like you.
                  </p>
                </div>
              </div>
              
              <div className="relative order-first lg:order-last">
                <img
                  src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop"
                  alt="Travel planning"
                  className="rounded-lg border border-gray-800 shadow-2xl w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-lg"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 sm:py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                What We <span className="text-teal-400 glow-text">Believe</span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
                Our core values guide everything we do, from product development to customer support
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {values.map((value, index) => (
                <Card
                  key={index}
                  className="bg-gray-800 border-gray-700 hover:border-teal-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/10"
                >
                  <CardContent className="p-6 sm:p-8 text-center">
                    <div className="w-16 h-16 bg-teal-500/10 rounded-lg flex items-center justify-center mx-auto mb-6">
                      <value.icon className="h-8 w-8 text-teal-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">{value.title}</h3>
                    <p className="text-gray-400 leading-relaxed text-sm sm:text-base">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 sm:py-20 bg-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Meet the <span className="text-teal-400 glow-text">Creator</span>
            </h2>
            
            <Card className="bg-gray-900 border-gray-800 max-w-2xl mx-auto">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col items-center">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
                    alt="Creator"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-teal-500/30 mb-6"
                  />
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Alex Rivera</h3>
                  <p className="text-teal-400 mb-4">Founder & CEO</p>
                  <p className="text-gray-400 leading-relaxed max-w-lg text-sm sm:text-base">
                    A passionate traveler and tech enthusiast with over 50 countries visited. 
                    Alex combines a love for exploration with expertise in AI to make travel 
                    planning effortless for everyone.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 bg-gradient-to-r from-teal-600 to-teal-800">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to start your <span className="text-black">next adventure?</span>
            </h2>
            <p className="text-lg sm:text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
              Join thousands of travelers who trust SmartVoyage to create their perfect trips
            </p>
            <Button 
              size="lg" 
              className="bg-black hover:bg-gray-900 text-white font-semibold px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg"
            >
              Start Planning Today
            </Button>
          </div>
        </section>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default About;
