import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from '../hooks/useScrollReveal';

const CallToAction = () => {
  const contentRef = useScrollReveal('animate-fade-in-up', 0) as React.RefObject<HTMLDivElement>;

  return (
    <section className="py-20 bg-gradient-to-r from-teal-600 to-teal-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
        <div ref={contentRef}>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Start planning your perfect trip —{" "}
            <span className="text-black">powered by AI</span>
          </h2>
          
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who trust SmartVoyage to create unforgettable experiences
          </p>

          <Link to="/plan">
            <Button 
              size="lg" 
              className="bg-black hover:bg-gray-900 text-white font-semibold px-12 py-4 text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              Plan My Trip
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
