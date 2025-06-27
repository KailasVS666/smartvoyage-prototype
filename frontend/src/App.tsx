import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Tours from "./pages/Tours";
import Plan from "./pages/Plan";
import Itinerary from "./pages/Itinerary";
import JapanItinerary from "./pages/JapanItinerary";
import BaliItinerary from "./pages/BaliItinerary";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ItineraryGenerator from "./pages/ItineraryGenerator";
import SharedTripPage from "./pages/SharedTripPage";
import MyTrips from "./pages/MyTrips";
import HotelDetails from "./pages/HotelDetails";
import MyFavorites from "./pages/MyFavorites";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tours" element={<Tours />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/itinerary/italy-7days" element={<Itinerary />} />
            <Route path="/itinerary/japan-budget" element={<JapanItinerary />} />
            <Route path="/itinerary/bali-family" element={<BaliItinerary />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/itinerary-generator" element={<ItineraryGenerator />} />
            <Route path="/shared/:tripId" element={<SharedTripPage />} />
            <Route path="/my-trips" element={<MyTrips />} />
            <Route path="/hotel/:name" element={<HotelDetails />} />
            <Route path="/my-favorites" element={<MyFavorites />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
