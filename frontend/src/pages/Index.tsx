import Navigation from "../components/Navigation";
import Hero from "../components/Hero";
import WhySmartVoyage from "../components/WhySmartVoyage";
import FeaturedTours from "../components/FeaturedTours";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import Testimonials from "../components/Testimonials";
import CallToAction from "../components/CallToAction";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";
  import HotelSearch from "../components/HotelSearch";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <main>
        <Hero />
        <HotelSearch />
        <WhySmartVoyage />
        <FeaturedTours />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CallToAction />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;
