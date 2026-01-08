import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FaWheelchair, 
  FaHands, 
  FaPalette, 
  FaClock,
  FaCalendarAlt,
  FaTools,
  FaUserFriends,
  FaRegClock,
  FaExclamationTriangle
} from 'react-icons/fa';
import { TbRotateDot } from "react-icons/tb";
import { fetchStudioConfig, fetchStudioStatus } from '../actions/studioActions';
import Studio from '../components/Studio';

const Home = () => {
  const dispatch = useDispatch();
  const { studioConfig, studioStatus, loading, error } = useSelector((state) => state.studio);
  console.log('Studio Config:', studioConfig);
  console.log('Studio Status:', studioStatus);

  const studioInfo = studioStatus?.studio || {};
  const todayInfo = studioStatus?.today || {};

  const isStudioOpen = studioInfo.is_open;  // Not studioStatus.is_open
  const availableWheels = todayInfo.available_wheels;  // Not studioStatus.available_wheels
  const bookingsCount = todayInfo.bookings_count;
  const totalWheelsToday = todayInfo.total_wheels;

  useEffect(() => {
    // Fetch studio configuration and status on component mount
    dispatch(fetchStudioConfig());
    dispatch(fetchStudioStatus());
  }, [dispatch]);

  const packages = [
    {
      id: 1,
      name: "Wheel Throwing",
      icon: <TbRotateDot className="text-3xl" />,
      duration: `${studioConfig?.wheel_session_duration || 60} minutes per session`,
      price: `From KES ${studioConfig?.booking_fee_per_person || '2,000'}`,
      description: "Create on the pottery wheel with expert guidance",
      color: "from-blue-500 to-teal-400",
      features: [
        `Session duration: ${studioConfig?.wheel_session_duration || 60} minutes`,
        `${studioConfig?.total_wheels || 8} wheels available`,
        `Buffer time: ${studioConfig?.buffer_minutes_between_sessions || 15} minutes`
      ]
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

  // Format time from HH:MM:SS to HH:MM AM/PM
  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Get available wheels - FIXED
const getAvailableWheels = () => {
  if (!studioConfig || !studioStatus?.today) return 'Loading...';
  return `${studioStatus.today.available_wheels} of ${studioConfig.total_wheels}`;
};

// Calculate available slots - FIXED
const calculateAvailableSlots = () => {
  if (!studioConfig || !studioStatus?.today) return 'Loading...';
  
  const maxSessions = studioConfig.max_daily_sessions;
  const bookedSessions = studioStatus.today.bookings_count || 0;
  const availableSessions = maxSessions - bookedSessions;
  
  return `${availableSessions} of ${maxSessions}`;
};

  // Maintenance mode banner
  const MaintenanceBanner = () => {
    if (!studioConfig?.is_maintenance_mode) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-500 text-white py-3 px-4 text-center"
      >
        <div className="container mx-auto max-w-6xl flex items-center justify-center gap-3">
          <FaExclamationTriangle className="text-xl" />
          <div>
            <p className="font-bold">Studio Under Maintenance</p>
            {studioConfig.maintenance_message && (
              <p className="text-sm opacity-90">{studioConfig.maintenance_message}</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // Loading component
  const LoadingSpinner = () => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-ceramic-200 border-t-ceramic-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-ceramic-700">Loading studio information...</p>
      </div>
    </div>
  );

  // Error component
  const ErrorDisplay = () => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center max-w-md">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-ceramic-800 mb-2">Unable to Load Studio Data</h3>
        <p className="text-ceramic-600 mb-4">{error?.message || 'Please check your connection'}</p>
        <button
          onClick={() => {
            dispatch(fetchStudioConfig());
            dispatch(fetchStudioStatus());
          }}
          className="px-6 py-2 bg-ceramic-600 text-white rounded-full hover:bg-ceramic-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-ceramic-50 to-white">
      {/* Maintenance Banner */}
      <MaintenanceBanner />

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
                className="px-8 py-4 bg-gradient-to-r from-[rgb(var(--color-ceramic-600))] to-[rgb(var(--color-ceramic-700))] text-white font-semibold rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300"
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
              className="inline-flex flex-col md:flex-row items-center gap-6 bg-white/80 backdrop-blur-sm px-8 py-6 rounded-2xl shadow-lg"
            >
              {/* Main Status */}
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${studioStatus?.studio?.is_open ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  <div className={`w-4 h-4 rounded-full ${studioStatus?.studio?.is_open ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg text-ceramic-800">
                    {studioConfig?.is_maintenance_mode ? 'Maintenance Mode' : 
                    studioStatus?.studio?.is_open === true ? 'Studio Open' : 'Studio Closed'}
                  </p>
                  <p className="text-ceramic-600">
                    {getAvailableWheels()} wheels available
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-10 bg-ceramic-200" />

              {/* Operating Hours */}
              <div className="flex items-center gap-3">
                <FaRegClock className="text-ceramic-500" />
                <div>
                  <p className="font-semibold text-ceramic-800">Operating Hours</p>
                  <p className="text-sm text-ceramic-600">
                    {formatTime(studioConfig?.operating_time)} - {formatTime(studioConfig?.closing_time)}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-10 bg-ceramic-200" />

              {/* Daily Slots */}
              <div className="flex items-center gap-3">
                <FaCalendarAlt className="text-ceramic-500" />
                <div>
                  <p className="font-semibold text-ceramic-800">Daily Slots</p>
                  <p className="text-sm text-ceramic-600">{calculateAvailableSlots()} slots available</p>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-10 bg-ceramic-200" />

              {/* Booking Fee */}
              <div className="flex items-center gap-3">
                <FaUserFriends className="text-ceramic-500" />
                <div>
                  <p className="font-semibold text-ceramic-800">Booking Fee</p>
                  <p className="text-sm text-ceramic-600">
                    KES {studioConfig?.booking_fee_per_person || '1,000'}/person
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Studio Configuration Details (Collapsible) */}
            {studioConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-left max-w-2xl mx-auto"
              >
                <details className="bg-white/50 backdrop-blur-sm rounded-xl p-4 shadow">
                  <summary className="cursor-pointer font-semibold text-ceramic-700 flex items-center gap-2">
                    <FaTools /> Studio Configuration Details
                  </summary>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-ceramic-600">Session Duration:</span>
                        <span className="font-semibold">{studioConfig.wheel_session_duration} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ceramic-600">Buffer Time:</span>
                        <span className="font-semibold">{studioConfig.buffer_minutes_between_sessions} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ceramic-600">Max Daily Sessions:</span>
                        <span className="font-semibold">{studioConfig.max_daily_sessions}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-ceramic-600">Opening Time:</span>
                        <span className="font-semibold">{formatTime(studioConfig.operating_time)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ceramic-600">Closing Time:</span>
                        <span className="font-semibold">{formatTime(studioConfig.closing_time)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ceramic-600">Total Wheels:</span>
                        <span className="font-semibold">{studioConfig.total_wheels}</span>
                      </div>
                    </div>
                  </div>
                </details>
              </motion.div>
            )}
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
                  
                  {/* Package-specific features */}
                  {pkg.features && (
                    <div className="mb-6 space-y-2">
                      {pkg.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-ceramic-600">
                          <div className="w-1 h-1 rounded-full bg-ceramic-400" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  )}
                  
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
              { 
                step: 1, 
                title: "Choose Package", 
                desc: "Select your preferred ceramic experience", 
                icon: "📋",
                detail: studioConfig?.booking_fee_per_person ? 
                  `Booking fee: KES ${studioConfig.booking_fee_per_person}/person` : null
              },
              { 
                step: 2, 
                title: "Pick Date & Time", 
                desc: "Check availability and book your slot", 
                icon: "📅",
                detail: `Operating hours: ${formatTime(studioConfig?.operating_time)} - ${formatTime(studioConfig?.closing_time)}`
              },
              { 
                step: 3, 
                title: "Pay Booking Fee", 
                desc: "Secure your spot", 
                icon: "💳",
                detail: `${studioConfig?.max_daily_sessions || 20} sessions available daily`
              },
              { 
                step: 4, 
                title: "Create & Enjoy", 
                desc: "Arrive and craft your masterpiece", 
                icon: "🎨",
                detail: `Session: ${studioConfig?.wheel_session_duration || 60} minutes`
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="relative inline-block mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-ceramic-100 to-ceramic-200 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-ceramic-600 text-white rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-ceramic-800 mb-2">{item.title}</h3>
                <p className="text-ceramic-600 mb-2">{item.desc}</p>
                {item.detail && (
                  <p className="text-sm text-ceramic-500 bg-ceramic-50 px-3 py-1 rounded-full inline-block">
                    {item.detail}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Studio Component */}
      <Studio />

      {/* Testimonials Section */}
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

      
    </div>
  );
};

export default Home;