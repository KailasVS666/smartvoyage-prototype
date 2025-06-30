import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoginButton from "./LoginButton";
import { getAuth } from 'firebase/auth';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  type NavLink = {
    name: string;
    href: string;
    icon?: React.ElementType;
  };

  const navLinks: NavLink[] = [
    { name: "Home", href: "/" },
    { name: "Explore", href: "/tours" },
    { name: "Planner", href: "/plan" },
    { name: "Itinerary Generator", href: "/itinerary-generator" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  // Add My Trips link if user is authenticated
  if (user) {
    navLinks.splice(4, 0, { name: "My Trips", href: "/my-trips" });
    navLinks.splice(5, 0, { name: "My Favorites", href: "/my-favorites", icon: Heart });
  } else {
    navLinks.splice(3, 0, { name: "My Favorites", href: "/my-favorites", icon: Heart });
  }

  const isActive = (href: string) => location.pathname === href;

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/">
              <img src="/SmartVoyage-logo.png" alt="SmartVoyage logo" className="h-10 w-10" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-baseline space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive(link.href)
                      ? "text-teal-400 border-b-2 border-teal-400"
                      : "text-gray-300 hover:text-teal-400"
                  }`}
                >
                  {link.icon && <link.icon className="inline h-4 w-4 mr-1 mb-0.5 text-pink-400" />}
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-300">
                    Hi, {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleLogout}
                    className="border-gray-600 text-gray-300 hover:border-teal-400 hover:text-teal-400"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <LoginButton />
              )}
              <Link to="/plan">
                <Button className="bg-teal-500 hover:bg-teal-400 text-black font-semibold">
                  Plan Trip
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-teal-400"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-sm border-t border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`block px-3 py-2 text-base font-medium transition-colors duration-200 ${
                  isActive(link.href)
                    ? "text-teal-400 bg-teal-500/10"
                    : "text-gray-300 hover:text-teal-400 hover:bg-teal-500/10"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.icon && <link.icon className="inline h-5 w-5 mr-2 mb-1 text-pink-400" />}
                {link.name}
              </Link>
            ))}
            <div className="px-3 py-2 space-y-2">
              {user ? (
                <>
                  <div className="text-sm text-gray-400 px-3 py-1">
                    Hi, {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleLogout}
                    className="w-full border-gray-600 text-gray-300 hover:border-teal-400 hover:text-teal-400"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <div className="px-3">
                  <LoginButton />
                </div>
              )}
              <Link to="/plan" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-teal-500 hover:bg-teal-400 text-black font-semibold">
                  Plan Trip
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {process.env.NODE_ENV !== 'production' && (
        <button
          style={{ marginLeft: '1rem', padding: '0.5rem 1rem', background: '#eee', borderRadius: '4px', fontSize: '0.9rem' }}
          onClick={async () => {
            const user = getAuth().currentUser;
            if (user) {
              const token = await user.getIdToken();
              console.log('Your Firebase ID token:', token);
              alert(token);
            } else {
              alert('Not logged in');
            }
          }}
        >
          Show Token
        </button>
      )}
    </nav>
  );
};

export default Navigation;
