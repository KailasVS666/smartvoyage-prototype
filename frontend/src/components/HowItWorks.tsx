import { MapPin, Heart, Calendar, Plane } from "lucide-react";
import { useScrollReveal } from '../hooks/useScrollReveal';

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
      title: "Customize Your Vibe",
      description: "Let our AI understand your preferences, budget, and travel goals"
    },
    {
      number: "03",
      icon: Calendar,
      title: "Get Smart Itinerary",
      description: "Receive a detailed day-by-day plan with maps, timings, and recommendations"
    },
    {
      number: "04",
      icon: Plane,
      title: "Book & Travel",
      description: "Fine-tune your itinerary and start your amazing journey"
    }
  ];

  // Scroll reveal wrapper for step cards
  const ScrollRevealCard: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
    const ref = useScrollReveal('animate-fade-in-up', delay) as React.RefObject<HTMLDivElement>;
    return (
      <div ref={ref}>{children}</div>
    );
  };

  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            How It <span className="text-teal-400 glow-text">Works</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Get your perfect travel itinerary in just four simple steps
          </p>
        </div>

        <div className="relative">
          {/* Timeline line for desktop */}
          <div className="hidden lg:block absolute top-10 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, idx) => (
              <ScrollRevealCard key={idx} delay={idx * 80}>
                <div key={idx} className="relative text-center group">
                  {/* Mobile timeline line */}
                  {idx < steps.length - 1 && (
                    <div className="block lg:hidden absolute left-1/2 top-20 w-0.5 h-16 bg-gradient-to-b from-teal-500/50 to-transparent transform -translate-x-1/2"></div>
                  )}

                  {/* Step Number Circle */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-full flex items-center justify-center border-2 border-teal-500/30 group-hover:border-teal-400 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-teal-500/25">
                      <span className="text-2xl font-bold text-teal-400 glow-text">
                        {step.number}
                      </span>
                    </div>
                    
                    {/* Icon */}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center border-2 border-gray-800 group-hover:border-teal-500/50 transition-colors duration-300">
                      <step.icon className="h-5 w-5 text-teal-400" />
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-teal-400 transition-colors duration-300">
                    {step.title}
                  </h3>
                  
                  <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                    {step.description}
                  </p>

                  {/* Desktop connecting arrows */}
                  {idx < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 -right-3 text-teal-500/50">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </ScrollRevealCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
