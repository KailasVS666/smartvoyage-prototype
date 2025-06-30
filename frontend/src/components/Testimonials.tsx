import { Star } from "lucide-react";
import { useScrollReveal } from '../hooks/useScrollReveal';

const Testimonials = () => {
  const testimonials = [
    {
      name: "Alex Johnson",
      role: "Remote Worker",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      quote: "SmartVoyage planned my trip to Japan flawlessly! Every detail was perfect, from temple visits to local restaurants.",
      rating: 5
    },
    {
      name: "Sarah Chen",
      role: "Travel Blogger",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      quote: "The AI recommendations were spot-on. I discovered hidden gems I would never have found on my own.",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Family Traveler",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      quote: "Planning our family vacation was stress-free. The budget optimization helped us do more with less.",
      rating: 5
    }
  ];

  // Scroll reveal wrapper for testimonial cards
  const ScrollRevealCard: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
    const ref = useScrollReveal('animate-fade-in-up', delay) as React.RefObject<HTMLDivElement>;
    return (
      <div ref={ref}>{children}</div>
    );
  };

  return (
    <section id="testimonials" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            What Travelers <span className="text-teal-400 glow-text">Say</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Join thousands of satisfied travelers who trust SmartVoyage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <ScrollRevealCard key={idx} delay={idx * 80}>
              <div
                className="bg-gray-900 p-8 rounded-lg border border-gray-800 hover:border-teal-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/10"
              >
                {/* Rating Stars */}
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                <blockquote className="text-gray-300 mb-6 text-lg leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>

                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4 border-2 border-teal-500/30"
                    loading="lazy"
                  />
                  <div>
                    <div className="text-white font-semibold">{testimonial.name}</div>
                    <div className="text-teal-400 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </ScrollRevealCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
