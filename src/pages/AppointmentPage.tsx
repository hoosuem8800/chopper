import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Clock, Calendar, ArrowLeft, ArrowRight, CheckCircle, User, Mail, Phone, AlertCircle, X, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api, API_BASE_URL, timeUtils, appointmentService } from '@/services/api';
import { customToast } from '@/lib/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const AppointmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    date: '',
    time: ''
  });
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [takenSlots, setTakenSlots] = useState([]);

  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];
  
  // Check authentication and redirect to login if needed
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    
    // Fetch user profile to pre-fill form fields
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/profiles/');
        const profile = response.data[0];
        setProfileData(profile);
        
        // Pre-fill form fields from user data
        if (user) {
          setFirstName(user.first_name || '');
          setLastName(user.last_name || '');
          setEmail(user.email || '');
        }
        
        if (profile) {
          setPhone(profile.phone_number || '');
        }
        
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [isAuthenticated, user, navigate, location]);

  // Enhanced function to create a timezone-aware date object
  const createTimezoneAwareDate = (dateString: string, timeString: string): Date => {
    console.log('Creating timezone-aware date with:', { dateString, timeString });
    
    // Use the common timeUtils implementation for consistent behavior
    return timeUtils.createTimezoneAwareDate(dateString, timeString);
  };

  // Enhanced function to fetch taken slots with better format handling
  const fetchTakenSlots = async (date) => {
    try {
      console.log(`Fetching taken slots for date: ${date}`);
      
      // Call the appointmentService directly (fixed)
      const takenSlotsResponse = await appointmentService.getTakenSlots(date);
      console.log('Processed taken slots with both formats:', takenSlotsResponse.data);
      
      // Set the taken slots from the response data property
      setTakenSlots(takenSlotsResponse.data || []);
      return takenSlotsResponse.data || [];
    } catch (error) {
      console.error('Error fetching taken slots:', error);
      customToast.error('Failed to fetch availability. Using default slots.');
      return [];
    }
  };

  // Update when date changes
  useEffect(() => {
    if (appointmentDate) {
      fetchTakenSlots(appointmentDate);
    }
  }, [appointmentDate]);

  // Check if a slot is available - improved to handle different time formats
  const isSlotAvailable = (time) => {
    // If time is in 12-hour format with AM/PM, also check 24-hour format
    if (time.includes('AM') || time.includes('PM')) {
      const time24h = timeUtils.to24Hour(time);
      return !takenSlots.includes(time) && !takenSlots.includes(time24h);
    }
    
    // If time is in 24-hour format, also check 12-hour format
    const time12h = timeUtils.to12Hour(time);
    return !takenSlots.includes(time) && !takenSlots.includes(time12h);
  };

  // Handle date selection
  const handleDateSelection = async (e) => {
    const newDate = e.target.value;
    setAppointmentDate(newDate);
    setErrors({...errors, date: ''});
    
    // Immediately fetch taken slots and check availability
    if (newDate) {
      const newTakenSlots = await fetchTakenSlots(newDate);
      if (selectedTimeSlot && newTakenSlots.includes(selectedTimeSlot)) {
        setSelectedTimeSlot('');
        customToast.warning('This time slot is not available on the selected date');
      }
    }
  };

  // Update time slot selection to prevent selecting unavailable slots
  const handleTimeSlotSelection = (time) => {
    if (!isSlotAvailable(time)) return;
    setSelectedTimeSlot(time);
    setErrors({...errors, time: ''});
  };

  const validateStep = (step) => {
    let isValid = true;
    const newErrors = {...errors};

    if (step === 0) {
      if (!firstName.trim()) {
        newErrors.firstName = 'Please enter your first name';
        isValid = false;
      } else {
        newErrors.firstName = '';
      }

      if (!lastName.trim()) {
        newErrors.lastName = 'Please enter your last name';
        isValid = false;
      } else {
        newErrors.lastName = '';
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please enter a valid email address';
        isValid = false;
      } else {
        newErrors.email = '';
      }

      // Allow phone format to be more flexible
      if (!phone || phone.trim().length < 10) {
        newErrors.phone = 'Please enter a valid phone number';
        isValid = false;
      } else {
        newErrors.phone = '';
      }
    }

    if (step === 1) {
      if (!appointmentDate) {
        newErrors.date = 'Please select a date';
        isValid = false;
      } else {
        newErrors.date = '';
      }

      if (!selectedTimeSlot) {
        newErrors.time = 'Please select a time slot';
        isValid = false;
      } else {
        newErrors.time = '';
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      // Check authentication
      if (!isAuthenticated || !user) {
        customToast.error('Please log in to book an appointment');
        navigate('/login', { state: { returnPath: location.pathname } });
        setLoading(false);
        return;
      }
      
      // Validate date and time are selected
      if (!appointmentDate || !selectedTimeSlot) {
        customToast.error('Please select a date and time');
        setLoading(false);
        return;
      }
      
      // Format date and time to ISO format for backend
      try {
        // Use createTimezoneAwareDate function to ensure consistent timezone handling
        const dateTime = createTimezoneAwareDate(appointmentDate, selectedTimeSlot);
        
        // Check if valid date
        if (isNaN(dateTime.getTime())) {
          customToast.error('Invalid date or time');
          setLoading(false);
          return;
        }
        
        // Ensure we're sending the time in ISO format with 'Z' indicating UTC timezone
        const isoDateTime = dateTime.toISOString();
        
        // Log the conversion for debugging
        console.log('Original time slot:', selectedTimeSlot);
        console.log('ISO date time:', isoDateTime);
        
        // Prepare appointment data - simplified without doctor
        const appointmentData = {
          date_time: isoDateTime,
          status: 'confirmed',
          notes: `Appointment booked by ${firstName} ${lastName} (${email}, ${phone})`
        };
        
        console.log('Submitting appointment data:', appointmentData);
        console.log('Current auth token:', localStorage.getItem('token'));
        
        // Submit to API with complete error handling
        try {
          // Ensure headers are properly set before the request
          const token = localStorage.getItem('token');
          if (token) {
            api.defaults.headers.common['Authorization'] = `Token ${token}`;
          }
          
          const response = await api.post('/appointments/', appointmentData);
          console.log('Appointment created successfully:', response.data);
          
          // Redirect to success page with appointment details
          navigate('/appointment/success', { 
            state: { 
              appointment: response.data,
              firstName,
              lastName,
              email,
              phone,
              appointmentDate,
              selectedTimeSlot
            }
          });
        } catch (apiError) {
          console.error('API Error Details:', apiError.response?.data || apiError.message);
          if (apiError.response?.status === 400) {
            customToast.error(apiError.response.data?.detail || 'Invalid appointment data');
          } else if (apiError.response?.status === 401) {
            customToast.error('Please log in again to continue');
            navigate('/login', { state: { returnPath: location.pathname } });
          } else if (apiError.response?.status === 500) {
            customToast.error('Server error. Please try again later.');
          } else {
            customToast.error('Failed to book appointment. Please try again.');
          }
        }
      } catch (dateError) {
        console.error('Date formatting error:', dateError);
        customToast.error('Invalid date format');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      customToast.error('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };
  
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="background-pattern"></div>
      
      <main className="flex-grow pt-20 pb-20 px-6">
        <div className="max-w-4xl mx-auto my-12">
          <div className="neuro-card p-8 md:p-12 shadow-xl rounded-2xl">
            {/* Progress Bar */}
            <div className="flex justify-between mb-10 relative">
              {[1, 2, 3].map((step, index) => (
                <div 
                  key={index} 
                  className={`flex flex-col items-center z-10 relative ${index <= currentStep ? 'text-primary' : 'text-gray-400'}`}
                >
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
                    ${index <= currentStep ? 'bg-primary text-white' : 'bg-white text-gray-400 border-2 border-gray-200'}`}
                  >
                    {step}
                  </div>
                  <div className="text-xs">
                    {index === 0 ? 'Details' : index === 1 ? 'Timing' : 'Confirm'}
                  </div>
                </div>
              ))}
              
              {/* Progress line */}
              <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-0"></div>
              <div 
                className="absolute top-5 left-0 h-0.5 bg-primary -z-0 transition-all duration-300"
                style={{ width: `${currentStep === 0 ? '0%' : currentStep === 1 ? '50%' : '100%'}` }}
              ></div>
            </div>

            {/* Step 1: Personal Details */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-1">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        setErrors({...errors, firstName: ''});
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        setErrors({...errors, lastName: ''});
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors({...errors, email: ''});
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter your email"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setErrors({...errors, phone: ''});
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <Button onClick={handleNextStep} className="px-6">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Select Time */}
            {currentStep === 1 && (
              <div className="animate-fade-in">
                <h3 className="text-2xl font-bold gradient-text mb-6 flex items-center">
                  <Clock className="mr-2 h-6 w-6" />Select Appointment Time
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      id="appointmentDate"
                      min={getTodayDate()}
                      className={`w-full p-3 border ${errors.date ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
                      value={appointmentDate}
                      onChange={handleDateSelection}
                    />
                    {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Time Slot</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          className={cn(
                            "relative p-3 rounded-lg text-sm border transition-all duration-200 font-medium",
                            isSlotAvailable(time) 
                              ? selectedTimeSlot === time 
                                ? "border-primary bg-primary text-white shadow-md" 
                                : "border-gray-200 hover:border-primary/50"
                              : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                          )}
                          onClick={() => handleTimeSlotSelection(time)}
                          disabled={!isSlotAvailable(time)}
                        >
                          {time}
                          {!isSlotAvailable(time) && (
                            <Lock className="absolute top-1 right-1 h-3 w-3 text-gray-400" />
                          )}
                          {selectedTimeSlot === time && (
                            <Check className="absolute top-1 right-1 h-3 w-3 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                    {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <Button variant="outline" onClick={handlePrevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={handleNextStep} className="px-6">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 2 && (
              <div className="animate-fade-in">
                <h3 className="text-2xl font-bold gradient-text mb-6 flex items-center">
                  <CheckCircle className="mr-2 h-6 w-6" />Confirm Appointment
                </h3>
                
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1 flex items-center">
                        <User className="h-4 w-4 mr-2" />Patient Name
                      </p>
                      <p className="font-medium">{firstName} {lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1 flex items-center">
                        <Mail className="h-4 w-4 mr-2" />Email
                      </p>
                      <p className="font-medium">{email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1 flex items-center">
                        <Phone className="h-4 w-4 mr-2" />Phone
                      </p>
                      <p className="font-medium">{phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />Date
                      </p>
                      <p className="font-medium">
                        {appointmentDate ? new Date(appointmentDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'No date selected'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />Time
                      </p>
                      <p className="font-medium">{selectedTimeSlot}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button variant="outline" onClick={handlePrevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    onClick={handleConfirmBooking} 
                    disabled={loading}
                    className="px-6"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">
                          <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <circle 
                              className="opacity-25" 
                              cx="12" 
                              cy="12" 
                              r="10" 
                              stroke="currentColor" 
                              strokeWidth="4"
                              fill="none"
                            ></circle>
                            <path 
                              className="opacity-75" 
                              fill="currentColor" 
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </span>
                        Processing...
                      </>
                    ) : (
                      <>
                        Confirm Booking <Check className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Information</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Please note that all appointments are subject to availability and confirmation.
            </p>
            <p className="text-gray-700">
              After booking, you'll receive a confirmation email with details about your appointment.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowInfoDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentPage;
