
import { Instagram, Twitter } from "lucide-react";
import { MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-black border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-teal-400 glow-text mb-4">SmartVoyage</h3>
            <p className="text-gray-400 max-w-md">
              AI-powered travel planning that creates personalized itineraries for unforgettable journeys around the world.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#home" className="text-gray-400 hover:text-teal-400 transition-colors">Home</a></li>
              <li><a href="#features" className="text-gray-400 hover:text-teal-400 transition-colors">Features</a></li>
              <li><a href="#tours" className="text-gray-400 hover:text-teal-400 transition-colors">Tours</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-teal-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-teal-400 transition-colors">About</a></li>
              <li><a href="#" className="text-gray-400 hover:text-teal-400 transition-colors">Terms</a></li>
              <li><a href="#" className="text-gray-400 hover:text-teal-400 transition-colors">Privacy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-teal-400 transition-colors">Support</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 SmartVoyage. All rights reserved.
          </p>
          
          {/* Social Icons */}
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a 
              href="#" 
              className="text-gray-400 hover:text-teal-400 transition-colors p-2 hover:bg-teal-500/10 rounded-full"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a 
              href="#" 
              className="text-gray-400 hover:text-teal-400 transition-colors p-2 hover:bg-teal-500/10 rounded-full"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a 
              href="#" 
              className="text-gray-400 hover:text-teal-400 transition-colors p-2 hover:bg-teal-500/10 rounded-full"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
