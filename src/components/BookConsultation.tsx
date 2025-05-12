
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Calendar } from 'lucide-react';

const BookConsultation = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                Book Your First Scan Consultation
              </h2>
              <p className="text-gray-600 mb-6">
                Get personalized analysis from our oncology experts within 24 hours
              </p>
              
              <h3 className="font-bold text-lg mb-4">Available Features:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Priority scan analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Direct doctor consultation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Personalized health plan</span>
                </li>
              </ul>
            </div>
            
            <div className="flex-shrink-0 w-full md:w-auto">
              <Button size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white flex items-center gap-2 py-6 px-8">
                <Calendar className="h-5 w-5" />
                Schedule Now
              </Button>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Available Mon-Sat: 9AM - 5PM EST
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookConsultation;
