
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, FileCheck, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const AppointmentsSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Appointment Booking</h2>
            <p className="text-gray-600 mb-6">
              Schedule your AI scan appointment today and take a proactive step towards better health monitoring.
            </p>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4 mt-1">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Easy Scheduling</h3>
                  <p className="text-gray-600">Select your preferred date and time for your scan appointment.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4 mt-1">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Flexible Rescheduling</h3>
                  <p className="text-gray-600">Easily reschedule or cancel your appointment without any penalties.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4 mt-1">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Timely Reminders</h3>
                  <p className="text-gray-600">Receive notifications and reminders for upcoming appointments.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4 mt-1">
                  <FileCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Post-Scan Reports</h3>
                  <p className="text-gray-600">Get detailed reports after your scan is completed.</p>
                </div>
              </li>
            </ul>
            
            <Link to="/appointment">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                Schedule Appointment
              </Button>
            </Link>
          </div>
          
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold mb-4 text-center">Schedule your AI scan appointment today!</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Date
                  </label>
                  <input 
                    type="date" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Time
                  </label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary">
                    <option value="">Select a time slot</option>
                    <option value="9:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Scanning Model
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                      <h4 className="font-medium">Free Model</h4>
                      <p className="text-sm text-gray-500">Basic health insights</p>
                    </div>
                    <div className="border border-primary bg-primary/5 rounded-lg p-4 cursor-pointer hover:bg-primary/10 transition-all">
                      <h4 className="font-medium">Premium Model</h4>
                      <p className="text-sm text-gray-500">Advanced analysis</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Link to="/appointment">
                <Button className="w-full bg-gradient-primary hover:opacity-90 text-white py-6">
                  Confirm Appointment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppointmentsSection;
