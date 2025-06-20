
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send, Instagram, Twitter, MessageCircle } from "lucide-react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
    // Reset form
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <main className="pt-20">
        {/* Header */}
        <section className="py-12 sm:py-16 bg-gradient-to-b from-gray-900 to-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Get in <span className="text-teal-400 glow-text">Touch</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
              Have questions about your next trip? We're here to help you plan the perfect adventure.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Contact Form */}
            <div>
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-xl sm:text-2xl">Send us a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-400 mb-2">Name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          required
                          className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:border-teal-400 focus:outline-none transition-colors"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-2">Email *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required
                          className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:border-teal-400 focus:outline-none transition-colors"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">Subject</label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange("subject", e.target.value)}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:border-teal-400 focus:outline-none transition-colors"
                        placeholder="What's this about?"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">Message *</label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        required
                        rows={6}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:border-teal-400 focus:outline-none transition-colors resize-none"
                        placeholder="Tell us how we can help you..."
                      />
                    </div>

                    <Button 
                      type="submit"
                      className="w-full bg-teal-500 hover:bg-teal-400 text-black font-semibold py-3"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6 sm:space-y-8">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-xl sm:text-2xl">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Email</p>
                      <p className="text-white">hello@smartvoyage.com</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Phone</p>
                      <p className="text-white">+1 (555) 123-4567</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Office</p>
                      <p className="text-white">San Francisco, CA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-xl sm:text-2xl">Follow Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <a
                      href="#"
                      className="w-12 h-12 bg-teal-500/10 rounded-lg flex items-center justify-center hover:bg-teal-500/20 transition-colors group"
                    >
                      <Instagram className="h-6 w-6 text-teal-400 group-hover:text-teal-300" />
                    </a>
                    <a
                      href="#"
                      className="w-12 h-12 bg-teal-500/10 rounded-lg flex items-center justify-center hover:bg-teal-500/20 transition-colors group"
                    >
                      <Twitter className="h-6 w-6 text-teal-400 group-hover:text-teal-300" />
                    </a>
                    <a
                      href="#"
                      className="w-12 h-12 bg-teal-500/10 rounded-lg flex items-center justify-center hover:bg-teal-500/20 transition-colors group"
                    >
                      <MessageCircle className="h-6 w-6 text-teal-400 group-hover:text-teal-300" />
                    </a>
                  </div>
                  <p className="text-gray-400 mt-4 text-sm">
                    Connect with us on social media for travel tips, inspiration, and updates!
                  </p>
                </CardContent>
              </Card>

              {/* FAQ Note */}
              <Card className="bg-gradient-to-r from-teal-600/10 to-teal-800/10 border-teal-500/30">
                <CardContent className="p-6">
                  <h3 className="text-white font-semibold mb-2">Quick Response</h3>
                  <p className="text-gray-300 text-sm">
                    We typically respond to all inquiries within 24 hours. For urgent travel support, 
                    please call us directly.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Contact;
