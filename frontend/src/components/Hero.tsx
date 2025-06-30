import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollReveal } from '../hooks/useScrollReveal';

const Hero = () => {
  const contentRef = useScrollReveal('animate-fade-in-up', 0) as React.RefObject<HTMLDivElement>;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&h=1080&fit=crop"
          alt="Beautiful mountain landscape"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
          Plan <span className="text-teal-400 glow-text">Smarter</span>.
          <br />
          Travel <span className="text-teal-400 glow-text">Better</span>.
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          SmartVoyage uses AI to build custom itineraries with maps, timings, and suggestions 
          based on your budget, vibe, and travel goals.
        </p>

        <Button 
          size="lg" 
          className="bg-teal-500 hover:bg-teal-400 text-black font-semibold px-8 py-4 text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/25"
        >
          Start Planning
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {/* Floating scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-teal-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-teal-400 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
