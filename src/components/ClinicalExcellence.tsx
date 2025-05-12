
import React from 'react';
import { Shield, BarChart } from 'lucide-react';

const ClinicalExcellence = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">
                Clinical Excellence
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-1">NCCN Guidelines</h3>
                    <p className="text-gray-600">
                      Following National Comprehensive Cancer Network standards
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <BarChart className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-1">Daily Quality Checks</h3>
                    <p className="text-gray-600">
                      Certified radiologist verification
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 bg-gradient-to-br from-primary/5 to-primary/10 p-8 flex flex-col items-center justify-center text-center">
              <div className="text-5xl md:text-6xl font-bold text-primary mb-2">
                99.2%
              </div>
              <div className="text-xl font-medium mb-1">
                Clinical Accuracy
              </div>
              <p className="text-gray-600 text-sm">
                in validation trials
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClinicalExcellence;
