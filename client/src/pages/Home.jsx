import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaWheelchair, 
  FaHands, 
  FaPalette, 
  FaClock,
  FaCalendarAlt,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaInstagram,
  FaFacebook,
  FaEnvelope
} from 'react-icons/fa';

const HomePage = () => {
  const [studioStatus, setStudioStatus] = useState({
    isOpen: true,
    availableWheels: 4,
    totalWheels: 8,
    todayBookings: 3
  });

  const packages = [
    {
      id: 1,
      name: "Wheel Throwing",
      icon: <FaWheelchair className="text-3xl" />,
      duration: "1-2 hours",
      price: "From KES 2,000",
      description: "Create on the pottery wheel with expert guidance",
      color: "from-blue-500 to-teal-400"
    },
    {
      id: 2,
      name: "Hand Building",
      icon: <FaHands className="text-3xl" />,
      duration: "Unlimited",
      price: "KES 3,000",
      description: "Sculpt freely without time constraints",
      color: "from-amber-500 to-orange-400"
    },
    {
      id: 3,
      name: "Bisque Painting",
      icon: <FaPalette className="text-3xl" />,
      duration: "Unlimited",
      price: "KES 3,000",
      description: "Decorate pre-made ceramic pieces",
      color: "from-purple-500 to-pink-400"
    }
  ];

  const testimonials = [
    {
      name: "Viola",
      text: "My first pottery experience was magical! The instructors were so patient.",
      date: "Jan 3, 2026"
    },
    {
      name: "James",
      text: "Perfect date activity. We made matching mugs!",
      date: "Dec 20, 2025"
    },
    {
      name: "Sarah",
      text: "Therapeutic and creative. I'll definitely be back!",
      date: "Nov 15, 2025"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-ceramic-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-20 h-20 border border-ceramic-300 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: `scale(${Math.random() * 0.5 + 0.5})`
              }}
            />
          ))}
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold text-ceramic-800 mb-6">
              Shape Your <span className="text-ceramic-600">Creativity</span>
            </h1>
            <p className="text-xl md:text-2xl text-ceramic-600 mb-8 max-w-3xl mx-auto">
              Experience the art of pottery at Nairobi's premier ceramic studio. 
              Book your hands-on session today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/packages"
                className="px-8 py-4 bg-gradient-to-r from-ceramic-600 to-ceramic-700 text-white font-semibold rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                View Packages & Book
              </Link>
              <Link
                to="/booking-history"
                className="px-8 py-4 border-2 border-ceramic-600 text-ceramic-700 font-semibold rounded-full hover:bg-ceramic-50 transition-all duration-300"
              >
                Check Booking Status
              </Link>
            </div>

            {/* Studio Status Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${studioStatus.isOpen ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  <div className={`w-3 h-3 rounded-full ${studioStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <div>
                  <p className="font-semibold text-ceramic-800">
                    {studioStatus.isOpen ? 'Studio Open' : 'Studio Closed'}
                  </p>
                  <p className="text-sm text-ceramic-600">
                    {studioStatus.availableWheels} of {studioStatus.totalWheels} wheels available
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Packages Preview Section */}
      <section className="py-16 px-4 bg-ceramic-50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-display font-bold text-ceramic-800 mb-4">
              Our Ceramic Experiences
            </h2>
            <p className="text-ceramic-600 text-lg">
              Choose from our carefully crafted packages
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className={`h-2 bg-gradient-to-r ${pkg.color}`} />
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${pkg.color} text-white`}>
                      {pkg.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-ceramic-800">{pkg.name}</h3>
                      <p className="text-ceramic-500">{pkg.duration}</p>
                    </div>
                  </div>
                  <p className="text-ceramic-600 mb-6">{pkg.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-ceramic-700">{pkg.price}</span>
                    <Link
                      to={`/packages/${pkg.id}`}
                      className="px-6 py-2 bg-ceramic-100 text-ceramic-700 font-semibold rounded-full hover:bg-ceramic-200 transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-ceramic-500 to-ceramic-600 text-white font-semibold rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              View All Packages
              <FaClock className="ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-display font-bold text-ceramic-800 mb-4">
              How to Book Your Session
            </h2>
            <p className="text-ceramic-600 text-lg">
              Simple steps to start your pottery journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Choose Package", desc: "Select your preferred ceramic experience", icon: "📋" },
              { step: 2, title: "Pick Date & Time", desc: "Check availability and book your slot", icon: "📅" },
              { step: 3, title: "Pay Booking Fee", desc: "Secure your spot with KES 1,000 per person", icon: "💳" },
              { step: 4, title: "Create & Enjoy", desc: "Arrive and craft your masterpiece", icon: "🎨" }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="relative inline-block mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-ceramic-100 to-ceramic-200 flex items-center justify-center text-3xl">
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-ceramic-600 text-white rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-ceramic-800 mb-2">{item.title}</h3>
                <p className="text-ceramic-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-gradient-to-b from-white to-ceramic-50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-display font-bold text-ceramic-800 mb-4">
              What Our Potters Say
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-lg"
              >
                <div className="text-ceramic-600 mb-6 text-lg italic">"{testimonial.text}"</div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-ceramic-800">{testimonial.name}</p>
                    <p className="text-sm text-ceramic-500">{testimonial.date}</p>
                  </div>
                  <div className="text-amber-400">★★★★★</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Info Section */}
      <section className="py-16 px-4 bg-ceramic-800 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-2xl font-display font-bold mb-6">Imani Ceramic Studio</h3>
              <p className="text-ceramic-200 mb-6">
                Where creativity meets clay. Book your hands-on pottery experience today.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-ceramic-200 hover:text-white transition-colors">
                  <FaInstagram size={24} />
                </a>
                <a href="#" className="text-ceramic-200 hover:text-white transition-colors">
                  <FaFacebook size={24} />
                </a>
                <a href="#" className="text-ceramic-200 hover:text-white transition-colors">
                  <FaEnvelope size={24} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><Link to="/packages" className="text-ceramic-200 hover:text-white transition-colors">Packages</Link></li>
                <li><Link to="/booking" className="text-ceramic-200 hover:text-white transition-colors">Book Now</Link></li>
                <li><Link to="/booking-history" className="text-ceramic-200 hover:text-white transition-colors">Booking History</Link></li>
                <li><Link to="/pricing" className="text-ceramic-200 hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-6">Contact Info</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-ceramic-200">
                  <FaPhoneAlt />
                  <span>+254 762 196 696 (WhatsApp)</span>
                </div>
                <div className="flex items-center gap-3 text-ceramic-200">
                  <FaMapMarkerAlt />
                  <span>Nairobi, Kenya</span>
                </div>
                <div className="flex items-center gap-3 text-ceramic-200">
                  <FaClock />
                  <span>Mon-Sun: 8AM - 6PM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-ceramic-700 mt-12 pt-8 text-center text-ceramic-400">
            <p>© {new Date().getFullYear()} Imani Ceramic Studio. All rights reserved.</p>
            <p className="text-sm mt-2">Stay Calm and Potter With Imani Ceramic</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;