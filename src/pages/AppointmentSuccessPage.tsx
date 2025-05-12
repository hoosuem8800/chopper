import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Clock, User, Phone, Mail, Home, List, AlertCircle } from 'lucide-react';

const AppointmentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;

  // Format date for display
  const formatDisplayDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // If no appointment data was passed, redirect to home
  if (!state || (!state.appointmentDate && !state.appointment?.date_time)) {
    // Use setTimeout to allow the component to render before navigation
    setTimeout(() => navigate('/'), 0);
    return null;
  }

  // Use appointment data from API response if available, otherwise use from state
  const appointmentDate = state.appointment?.date_time || state.appointmentDate;
  const selectedTimeSlot = state.selectedTimeSlot || new Date(appointmentDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const firstName = state.firstName || state.appointment?.user?.first_name || '';
  const lastName = state.lastName || state.appointment?.user?.last_name || '';
  const email = state.email || state.appointment?.user?.email || '';
  const phone = state.phone || '';
  const status = state.appointment?.status || 'pending';

  return (
    <div className="min-h-screen flex flex-col">
      <div className="background-pattern"></div>
      
      <main className="flex-grow pt-10 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="neuro-card p-6 md:p-8">
            {/* Success Header */}
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold gradient-text">Appointment Confirmed!</h1>
              <p className="text-gray-600 mt-2">
                Your appointment has been successfully scheduled.
              </p>
            </div>
            
            {/* Appointment Details */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Appointment Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{formatDisplayDate(appointmentDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{selectedTimeSlot}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Appointment Type</p>
                    <p className="font-medium">General Appointment</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium text-primary">Confirmed</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <User className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{firstName} {lastName}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{phone}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Information */}
            <div className="bg-primary/5 p-5 rounded-xl mb-8">
              <h3 className="font-semibold text-primary mb-2">Important Information</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {status === 'pending' ? (
                  <>
                    <li>• Your appointment request is being reviewed by our staff.</li>
                    <li>• You'll receive a confirmation email once approved.</li>
                    <li>• Appointments are typically approved within 24 hours.</li>
                    <li>• You can check the status in your profile's appointment section.</li>
                  </>
                ) : (
                  <>
                    <li>• Please arrive 15 minutes before your scheduled appointment time.</li>
                    <li>• Bring your ID and any relevant medical records or test results.</li>
                    <li>• If you need to reschedule, please do so at least 24 hours in advance.</li>
                    <li>• You'll receive a confirmation email with these details.</li>
                  </>
                )}
              </ul>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <Button 
                variant="outline" 
                className="flex items-center justify-center border-primary text-primary hover:bg-primary/10"
                onClick={() => navigate('/profile?tab=appointments')}
              >
                <List className="mr-2 h-4 w-4" />
                View My Appointments
              </Button>
              
              <Button 
                className="disappear-button"
                onClick={() => navigate('/')}
              >
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Button>
            </div>
          </div>
        </div>
      </main>
      
          </div>
  );
};

export default AppointmentSuccessPage; 