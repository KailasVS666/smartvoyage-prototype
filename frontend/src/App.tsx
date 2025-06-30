import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import React, { Suspense, lazy } from "react";
import { HotelCardSkeleton, HotelDetailsSkeleton, ItineraryGeneratorSkeleton } from "@/components/ui/skeleton";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useState } from "react";

const Index = lazy(() => import("./pages/Index"));
const Tours = lazy(() => import("./pages/Tours"));
const Plan = lazy(() => import("./pages/Plan"));
const Itinerary = lazy(() => import("./pages/Itinerary"));
const JapanItinerary = lazy(() => import("./pages/JapanItinerary"));
const BaliItinerary = lazy(() => import("./pages/BaliItinerary"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ItineraryGenerator = lazy(() => import("./pages/ItineraryGenerator"));
const SharedTripPage = lazy(() => import("./pages/SharedTripPage"));
const MyTrips = lazy(() => import("./pages/MyTrips"));
const HotelDetails = lazy(() => import("./pages/HotelDetails"));
const MyFavorites = lazy(() => import("./pages/MyFavorites"));

const queryClient = new QueryClient();

function RouteSkeletonFallback() {
  const location = useLocation();
  if (location.pathname.startsWith("/hotel/")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black animate-fade-in">
        <div className="w-full max-w-2xl mx-auto">
          <HotelDetailsSkeleton />
        </div>
      </div>
    );
  }
  if (location.pathname.startsWith("/itinerary-generator")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black animate-fade-in">
        <div className="w-full max-w-2xl mx-auto">
          <ItineraryGeneratorSkeleton />
        </div>
      </div>
    );
  }
  // Add more route-specific skeletons here if desired
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black animate-fade-in">
      <div className="w-full max-w-md mx-auto">
        <HotelCardSkeleton />
      </div>
    </div>
  );
}

const App = () => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", feedback: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFeedbackOpen(false);
      setSubmitted(false);
      setForm({ name: "", email: "", feedback: "" });
    }, 2000);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <Suspense fallback={<RouteSkeletonFallback />}>
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
              {/* Floating Feedback Button with Modal */}
              <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
                <DialogTrigger asChild>
                  <button
                    className="fixed bottom-6 right-6 z-[200] bg-gradient-to-r from-teal-400 to-pink-400 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:scale-105 transition-transform focus:outline-none focus:ring-4 focus:ring-pink-300 animate-bounce"
                    aria-label="Give Feedback"
                  >
                    💬 Give Feedback
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>We value your feedback!</DialogTitle>
                    <DialogDescription>
                      Please let us know your thoughts about SmartVoyage.
                    </DialogDescription>
                  </DialogHeader>
                  {submitted ? (
                    <div className="py-8 text-center text-lg font-semibold text-teal-600">Thank you for your feedback!</div>
                  ) : (
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                          value={form.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                          value={form.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="feedback" className="block text-sm font-medium mb-1">Feedback</label>
                        <textarea
                          id="feedback"
                          name="feedback"
                          className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                          rows={4}
                          value={form.feedback}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <DialogFooter>
                        <button
                          type="submit"
                          className="bg-teal-500 hover:bg-teal-400 text-black font-semibold py-2 px-6 rounded-full shadow"
                        >
                          Submit
                        </button>
                        <DialogClose asChild>
                          <button
                            type="button"
                            className="ml-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-full shadow"
                          >
                            Cancel
                          </button>
                        </DialogClose>
                      </DialogFooter>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </Suspense>
          </HashRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
