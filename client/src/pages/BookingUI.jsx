import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaWheelchair, 
  FaHands, 
  FaPalette, 
  FaUsers,
  FaClock,
  FaCalendarAlt,
  FaCheckCircle,
  FaSpinner,
  FaTimesCircle,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMoneyBillWave
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { 
  fetchPackages, 
  checkPackageAvailability,
  selectPackage 
} from '../actions/packageActions';
import { 
  createBooking,
  checkAvailability 
} from '../actions/bookingActions';
import { fetchStudioStatus } from '../actions/studioActions';

const BookingUI = () => {
  const dispatch = useDispatch();
  
  // Get state from Redux
  const { packages, loading: packagesLoading, availability } = useSelector(state => state.packages);
  const { studioStatus } = useSelector(state => state.studio);
  const { loading: bookingLoading, currentBooking } = useSelector(state => state.bookings);
  
  // State for booking flow
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [step, setStep] = useState(1); // 1: Your Details, 2: Choose Package, 3: Date & Time, 4: Confirm & Pay
  const [bookingData, setBookingData] = useState({
    package: null,
    number_of_people: 1,
    booked_date: '',
    session_start: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    special_requests: '',
    payment_reference: '' // For M-Pesa transaction code
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [errors, setErrors] = useState({});
  
  // Fetch packages and status on mount
  useEffect(() => {
    dispatch(fetchPackages());
    dispatch(fetchStudioStatus());
  }, [dispatch]);
  
  // Fetch availability when package or date changes
  useEffect(() => {
    if (selectedPackage && selectedDate && step === 3) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      dispatch(checkPackageAvailability(selectedPackage.id, dateStr, bookingData.number_of_people));
    }
  }, [selectedPackage, selectedDate, bookingData.number_of_people, dispatch, step]);
  
  // Update available slots
  useEffect(() => {
    if (availability && availability.available_slots) {
      setAvailableSlots(availability.available_slots);
    }
  }, [availability]);
  
  // Validate form fields
  const validateFields = (fields) => {
    const newErrors = {};
    if (fields.includes('customer_name') && !bookingData.customer_name.trim()) {
      newErrors.customer_name = 'Name is required';
    }
    if (fields.includes('customer_phone')) {
      if (!bookingData.customer_phone.trim()) {
        newErrors.customer_phone = 'Phone is required';
      } else if (!/^\+254\d{9}$/.test(bookingData.customer_phone)) {
        newErrors.customer_phone = 'Phone should be in +254 format (e.g., +254712345678)';
      }
    }
    if (fields.includes('customer_email')) {
      if (!bookingData.customer_email.trim()) {
        newErrors.customer_email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.customer_email)) {
        newErrors.customer_email = 'Invalid email format';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    setErrors(prev => ({ ...prev, [name]: '' }));
  };
  
  // Handle package selection
  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setBookingData(prev => ({
      ...prev,
      package: pkg.id,
      number_of_people: 1
    }));
  };
  
  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    setBookingData(prev => ({ ...prev, booked_date: dateStr }));
    setSelectedTime('');
    setAvailableSlots([]);
  };
  
  // Handle time slot selection
  const handleTimeSelect = (slot) => {
    setSelectedTime(slot.start_time);
    setBookingData(prev => ({
      ...prev,
      session_start: slot.start_time,
      session_end: slot.end_time
    }));
  };
  
  // Handle people count change
  const handlePeopleChange = (delta) => {
    const newCount = Math.max(1, Math.min(selectedPackage?.max_participants || 8, bookingData.number_of_people + delta));
    setBookingData(prev => ({ ...prev, number_of_people: newCount }));
    setSelectedTime('');
  };
  
  // Format time
  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
  // Calculate totals
  const calculateBookingFee = () => 1000 * bookingData.number_of_people;
  const calculatePackagePrice = () => (selectedPackage?.price || 0) * bookingData.number_of_people;
  const calculateTotal = () => calculatePackagePrice() + calculateBookingFee();
  
  // Check step validity
  const isStepValid = () => {
    switch (step) {
      case 1:
        return validateFields(['customer_name', 'customer_phone', 'customer_email']);
      case 2:
        return selectedPackage !== null;
      case 3:
        return bookingData.booked_date && bookingData.session_start;
      case 4:
        return true;
      default:
        return false;
    }
  };
  
  // Handle next step
  const handleNextStep = () => {
    if (isStepValid()) {
      setStep(step + 1);
    } else {
      toast.error('Please fill all required fields correctly');
    }
  };
  
  // Handle booking submission after payment
  const handleConfirmPayment = async () => {
    if (!bookingData.payment_reference.trim()) {
      setErrors({ payment_reference: 'Please enter your M-Pesa confirmation code' });
      return;
    }
    
    try {
      const result = await dispatch(createBooking({
        ...bookingData,
        payment_reference: bookingData.payment_reference,
        payment_status: 'pending' // Assuming backend handles as pending until verified
      }));
      toast.success('Booking submitted! We will confirm your payment shortly.');
      // Reset form
      setStep(1);
      setSelectedPackage(null);
      setBookingData({
        package: null,
        number_of_people: 1,
        booked_date: '',
        session_start: '',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        special_requests: '',
        payment_reference: ''
      });
      setSelectedDate(new Date());
      setAvailableSlots([]);
      setSelectedTime('');
    } catch (error) {
      toast.error(error.message || 'Failed to submit booking');
    }
  };
  
  // Loading state
  if (packagesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-ceramic-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8 mt-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-ceramic-800 mb-4">
            Book Your Ceramic Experience
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Provide your details, choose a package, select time, and pay booking fee to reserve.
          </p>
          
          {/* Studio Status */}
          {studioStatus && (
            <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
              <div className={`w-2 h-2 rounded-full ${studioStatus.studio?.is_open ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-gray-700">
                {studioStatus.studio?.is_open ? 'Studio Open' : 'Studio Closed'} • 
                {studioStatus.today?.available_wheels} wheels available
              </span>
            </div>
          )}
        </motion.div>
        
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-8">
            {['Your Details', 'Choose Package', 'Date & Time', 'Confirm & Pay'].map((label, index) => (
              <div key={label} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step > index + 1 ? 'bg-ceramic-600 border-ceramic-600 text-white' :
                  step === index + 1 ? 'bg-white border-ceramic-600 text-ceramic-600' :
                  'bg-gray-100 border-gray-300 text-gray-400'
                } font-semibold`}>
                  {step > index + 1 ? <FaCheckCircle /> : index + 1}
                </div>
                <div className={`ml-2 text-sm font-medium ${
                  step >= index + 1 ? 'text-ceramic-700' : 'text-gray-500'
                }`}>
                  {label}
                </div>
                {index < 3 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    step > index + 1 ? 'bg-ceramic-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 1: Customer Details */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-2xl shadow-lg p-8"
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Details</h2>
                  <p className="text-gray-600 mb-6">
                    Provide your information first. We'll use this to reserve your slot and send confirmation.
                  </p>
                  <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaUser className="inline mr-2" />
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="customer_name"
                          value={bookingData.customer_name}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ceramic-500 focus:border-transparent ${
                            errors.customer_name ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter your full name"
                        />
                        {errors.customer_name && <p className="text-red-500 text-sm mt-1">{errors.customer_name}</p>}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FaPhone className="inline mr-2" />
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            name="customer_phone"
                            value={bookingData.customer_phone}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ceramic-500 focus:border-transparent ${
                              errors.customer_phone ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="+254712345678"
                          />
                          {errors.customer_phone && <p className="text-red-500 text-sm mt-1">{errors.customer_phone}</p>}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FaEnvelope className="inline mr-2" />
                            Email Address *
                          </label>
                          <input
                            type="email"
                            name="customer_email"
                            value={bookingData.customer_email}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ceramic-500 focus:border-transparent ${
                              errors.customer_email ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="your@email.com"
                          />
                          {errors.customer_email && <p className="text-red-500 text-sm mt-1">{errors.customer_email}</p>}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Special Requests
                        </label>
                        <textarea
                          name="special_requests"
                          value={bookingData.special_requests}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ceramic-500 focus:border-transparent"
                          placeholder="Any special requirements..."
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                      <button
                        type="submit"
                        className="px-8 py-3 bg-ceramic-600 text-white font-medium rounded-lg hover:bg-ceramic-700 transition-colors"
                      >
                        Continue to Package
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
              
              {/* Step 2: Package Selection */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-2xl shadow-lg p-8"
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Choose Your Package</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {packages.map((pkg) => (
                      <motion.div
                        key={pkg.id}
                        whileHover={{ y: -4 }}
                        className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                          selectedPackage?.id === pkg.id 
                            ? 'border-ceramic-500 bg-ceramic-50' 
                            : 'border-gray-200 hover:border-ceramic-300'
                        }`}
                        onClick={() => handlePackageSelect(pkg)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">{pkg.name}</h3>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="flex items-center gap-1 text-sm text-gray-600">
                                <FaClock className="text-ceramic-500" />
                                {pkg.duration_display}
                              </span>
                              {pkg.requires_wheel && (
                                <span className="flex items-center gap-1 text-sm text-gray-600">
                                  <FaWheelchair className="text-ceramic-500" />
                                  Wheel included
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-ceramic-600">
                            KES {pkg.price}
                          </div>
                        </div>
                        <p className="text-gray-600 mb-4">{pkg.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FaUsers className="text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Max {pkg.max_participants} people
                            </span>
                          </div>
                          {selectedPackage?.id === pkg.id && (
                            <FaCheckCircle className="text-ceramic-500 text-xl" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNextStep}
                      disabled={!selectedPackage}
                      className="px-8 py-3 bg-ceramic-600 text-white font-medium rounded-lg hover:bg-ceramic-700 disabled:opacity-50 transition-colors"
                    >
                      Continue to Date & Time
                    </button>
                  </div>
                </motion.div>
              )}
              
              {/* Step 3: Date & Time */}
              {step === 3 && selectedPackage && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-2xl shadow-lg p-8"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Select Date & Time</h2>
                      <p className="text-gray-600">For {selectedPackage.name}</p>
                    </div>
                    <button
                      onClick={() => setStep(2)}
                      className="text-ceramic-600 hover:text-ceramic-700 font-medium"
                    >
                      Change Package
                    </button>
                  </div>
                  
                  {/* People Counter if applicable */}
                  {selectedPackage.max_participants > 1 && (
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-700">Number of People</h3>
                          <p className="text-sm text-gray-500">
                            Max {selectedPackage.max_participants}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handlePeopleChange(-1)}
                            disabled={bookingData.number_of_people <= 1}
                            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="text-2xl font-bold text-gray-800 w-8 text-center">
                            {bookingData.number_of_people}
                          </span>
                          <button
                            onClick={() => handlePeopleChange(1)}
                            disabled={bookingData.number_of_people >= selectedPackage.max_participants}
                            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Date Picker */}
                  <div className="mb-8">
                    <h3 className="font-medium text-gray-700 mb-4">Select Date</h3>
                    <div className="border border-gray-300 rounded-lg p-4">
                      <DatePicker
                        selected={selectedDate}
                        onChange={handleDateSelect}
                        minDate={new Date()}
                        inline
                      />
                    </div>
                  </div>
                  
                  {/* Time Slots */}
                  <div>
                    <h3 className="font-medium text-gray-700 mb-4">Available Times</h3>
                    {availability?.loading ? (
                      <div className="text-center py-8">
                        <FaSpinner className="animate-spin text-2xl text-ceramic-600 mx-auto mb-2" />
                        <p className="text-gray-600">Checking...</p>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {availableSlots.map((slot, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-lg border-2 text-center ${
                              selectedTime === slot.start_time
                                ? 'border-ceramic-500 bg-ceramic-50 text-ceramic-700'
                                : 'border-gray-200 hover:border-ceramic-300 hover:bg-gray-50'
                            }`}
                            onClick={() => handleTimeSelect(slot)}
                          >
                            <div className="font-semibold">{formatTime(slot.start_time)}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {slot.duration_display}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <FaCalendarAlt className="text-3xl text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No slots available</p>
                        <p className="text-sm text-gray-500 mt-1">Choose another date</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setStep(2)}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNextStep}
                      disabled={!isStepValid()}
                      className="px-8 py-3 bg-ceramic-600 text-white font-medium rounded-lg hover:bg-ceramic-700 disabled:opacity-50 transition-colors"
                    >
                      Review & Pay
                    </button>
                  </div>
                </motion.div>
              )}
              
              {/* Step 4: Confirm & Pay */}
              {step === 4 && selectedPackage && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-2xl shadow-lg p-8"
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Confirm & Pay Booking Fee</h2>
                  <p className="text-gray-600 mb-8">Review details and pay the booking fee to reserve your slot.</p>
                  
                  {/* Summary Sections */}
                  <div className="space-y-6 mb-8">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="font-bold text-gray-700 mb-4">Your Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Name</div>
                          <div>{bookingData.customer_name}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Phone</div>
                          <div>{bookingData.customer_phone}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Email</div>
                          <div>{bookingData.customer_email}</div>
                        </div>
                      </div>
                      {bookingData.special_requests && (
                        <div className="mt-4">
                          <div className="text-sm text-gray-500">Requests</div>
                          <div>{bookingData.special_requests}</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="font-bold text-gray-700 mb-4">Package & Time</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Package</span>
                          <span>{selectedPackage.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>People</span>
                          <span>{bookingData.number_of_people}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date</span>
                          <span>{new Date(bookingData.booked_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time</span>
                          <span>{formatTime(bookingData.session_start)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-ceramic-50 rounded-xl p-6">
                      <h3 className="font-bold text-gray-700 mb-4">Payment Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Package Price (pay later)</span>
                          <span>KES {calculatePackagePrice()}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Booking Fee (pay now)</span>
                          <span>KES {calculateBookingFee()}</span>
                        </div>
                        <div className="flex justify-between text-lg pt-2 border-t">
                          <span>Total</span>
                          <span>KES {calculateTotal()}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-4">* Booking fee is deductible from total bill</p>
                    </div>
                  </div>
                  
                  {/* Payment Instructions */}
                  <div className="bg-yellow-50 rounded-xl p-6 mb-8">
                    <h3 className="font-bold text-yellow-800 mb-4">Pay via M-Pesa</h3>
                    <div className="space-y-2 text-center">
                      <p><strong>Paybill:</strong> 542542</p>
                      <p><strong>Account:</strong> 886688</p>
                      <p><strong>Amount:</strong> KES {calculateBookingFee()}</p>
                    </div>
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        M-Pesa Confirmation Code *
                      </label>
                      <input
                        type="text"
                        name="payment_reference"
                        value={bookingData.payment_reference}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ceramic-500 focus:border-transparent ${
                          errors.payment_reference ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter code (e.g., ABC123DEF4)"
                      />
                      {errors.payment_reference && <p className="text-red-500 text-sm mt-1">{errors.payment_reference}</p>}
                    </div>
                  </div>
                  
                  {/* Buttons */}
                  <div className="flex justify-between pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setStep(3)}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirmPayment}
                      disabled={bookingLoading}
                      className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {bookingLoading ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FaCheckCircle />
                          Submit Booking
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Right Column - Help */}
          <div className="space-y-6">
            {/* Help Card */}
            <div className="bg-ceramic-50 border border-ceramic-200 rounded-2xl p-6">
              <h3 className="font-bold text-ceramic-800 mb-4">Need Help?</h3>
              <div className="space-y-3 text-sm text-ceramic-600">
                <p><strong>WhatsApp:</strong> +254 762 196 696</p>
                <p><strong>Phone:</strong> +254 718 280 980</p>
                <p><strong>Hours:</strong> 8:00 AM - 6:00 PM Daily</p>
                <p><strong>Location:</strong> Nairobi, Kenya</p>
              </div>
              <p className="mt-6 text-sm italic">"Stay Calm and Potter With Imani Ceramic"</p>
            </div>
            
            {/* Booking Status if confirmed */}
            {currentBooking && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <FaCheckCircle className="text-2xl text-green-600" />
                  <h3 className="font-bold text-green-800">Submitted!</h3>
                </div>
                <p className="text-sm text-green-700">Reference: {currentBooking.booking_reference}</p>
                <p className="text-sm text-green-600 mt-1">We'll confirm via email soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingUI;