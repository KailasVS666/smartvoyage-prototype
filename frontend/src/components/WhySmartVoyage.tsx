
import { DollarSign, Users, MapPin, Brain } from "lucide-react";

const WhySmartVoyage = () => {
  const features = [
    {
      icon: DollarSign,
      title: "Budget-Friendly Planning",
      description: "Get the most value from your travel budget with smart cost optimization."
    },
    {
      icon: Users,
      title: "Group Trip Support",
      description: "Coordinate seamlessly with friends and family for memorable group adventures."
    },
    {
      icon: MapPin,
      title: "Curated Itineraries",
      description: "Handpicked destinations and experiences tailored to your travel style."
    },
    {
      icon: Brain,
      title: "AI-Powered Suggestions",
      description: "Smart recommendations based on your preferences and travel history."
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Why <span className="text-teal-400 glow-text">SmartVoyage</span>?
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Experience the future of travel planning with our innovative features
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 sm:p-8 bg-gray-800 rounded-xl border border-gray-700 hover:border-teal-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20 hover:transform hover:scale-105"
            >
              <div className="mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-teal-500/10 rounded-lg flex items-center justify-center group-hover:bg-teal-500/20 transition-colors duration-300 border border-teal-500/20 group-hover:border-teal-400/40">
                  <feature.icon className="h-7 w-7 sm:h-8 sm:w-8 text-teal-400 group-hover:text-teal-300 transition-colors duration-300" />
                </div>
              </div>
              
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 group-hover:text-teal-400 transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhySmartVoyage;
