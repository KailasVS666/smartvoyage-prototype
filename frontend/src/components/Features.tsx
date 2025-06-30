import { Brain, DollarSign, Map, Compass, Users, Download } from "lucide-react";
import { useScrollReveal } from '../hooks/useScrollReveal';

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Itinerary Builder",
      description: "Smart algorithms create personalized travel plans tailored to your preferences"
    },
    {
      icon: DollarSign,
      title: "Budget-Aware Trip Planning",
      description: "Get the most value from your travel budget with intelligent cost optimization"
    },
    {
      icon: Map,
      title: "Interactive Map View",
      description: "Visualize your journey with detailed maps and route planning"
    },
    {
      icon: Compass,
      title: "Smart Destination Suggestions",
      description: "Discover hidden gems and popular spots based on your travel style"
    },
    {
      icon: Users,
      title: "Group & Family Planning",
      description: "Coordinate trips for multiple travelers with shared itineraries"
    },
    {
      icon: Download,
      title: "Offline Itinerary Access",
      description: "Access your travel plans even without internet connection"
    }
  ];

  // Scroll reveal wrapper for feature cards
  const ScrollRevealCard: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
    const ref = useScrollReveal('animate-fade-in-up', delay) as React.RefObject<HTMLDivElement>;
    return (
      <div ref={ref}>{children}</div>
    );
  };

  return (
    <section id="features" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Powerful <span className="text-teal-400 glow-text">Features</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to plan the perfect trip, powered by artificial intelligence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <ScrollRevealCard key={idx} delay={idx * 80}>
              <div
                className="group p-8 bg-gray-900 rounded-lg border border-gray-800 hover:border-teal-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/10"
              >
                <div className="mb-6">
                  <div className="w-16 h-16 bg-teal-500/10 rounded-lg flex items-center justify-center group-hover:bg-teal-500/20 transition-colors duration-300">
                    <feature.icon className="h-8 w-8 text-teal-400" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-teal-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </ScrollRevealCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
