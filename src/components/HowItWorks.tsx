
import { MapPin, Heart, Calendar, Share } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      icon: MapPin,
      title: "Choose Destination",
      description: "Tell us where you want to go and we'll help you discover the best experiences"
    },
    {
      number: "02",
      icon: Heart,
      title: "Share Your Travel Style & Budget",
      description: "Let our AI understand your preferences, budget, and travel goals"
    },
    {
      number: "03",
      icon: Calendar,
      title: "Get Full Itinerary with Map + Timings",
      description: "Receive a detailed day-by-day plan with maps, timings, and recommendations"
    },
    {
      number: "04",
      icon: Share,
      title: "Customize or Share with Group",
      description: "Fine-tune your itinerary and easily share it with your travel companions"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How It <span className="text-teal-400 glow-text">Works</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Get your perfect travel itinerary in just four simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center group">
              {/* Step Number */}
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto bg-teal-500/10 rounded-full flex items-center justify-center border-2 border-teal-500/30 group-hover:border-teal-400 transition-colors duration-300">
                  <span className="text-2xl font-bold text-teal-400 glow-text">
                    {step.number}
                  </span>
                </div>
                
                {/* Icon */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                  <step.icon className="h-4 w-4 text-teal-400" />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-teal-400 transition-colors duration-300">
                {step.title}
              </h3>
              
              <p className="text-gray-400 leading-relaxed">
                {step.description}
              </p>

              {/* Connecting Line (hidden on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-teal-500/50 to-transparent transform -translate-y-1/2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
