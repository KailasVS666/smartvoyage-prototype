
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FeaturedTours = () => {
  const tours = [
    {
      id: 1,
      name: "Paris Essentials",
      image: "https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&h=400&fit=crop",
      description: "7 days exploring the City of Light",
      price: "From $1,299"
    },
    {
      id: 2,
      name: "Kyoto Temple Trail",
      image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&h=400&fit=crop",
      description: "5 days of zen and culture",
      price: "From $899"
    },
    {
      id: 3,
      name: "Ladakh Adventure",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
      description: "Epic mountain landscapes",
      price: "From $699"
    },
    {
      id: 4,
      name: "Goa Beach Vibes",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop",
      description: "Relax by pristine beaches",
      price: "From $399"
    }
  ];

  return (
    <section id="tours" className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Featured <span className="text-teal-400 glow-text">Tours</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Discover handpicked destinations curated by our AI travel planner
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tours.map((tour) => (
            <div
              key={tour.id}
              className="group relative bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/10"
            >
              <div className="relative overflow-hidden">
                <img
                  src={tour.image}
                  alt={tour.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2">{tour.name}</h3>
                <p className="text-gray-400 mb-4">{tour.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-teal-400 font-semibold">{tour.price}</span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 p-2"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedTours;
