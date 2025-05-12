
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const AIScanModels = () => {
  const freeFeatures = [
    "Basic AI-powered scan analysis",
    "General health insights",
    "Limited scan history storage",
    "Standard support",
    "Monthly health reports"
  ];

  const premiumFeatures = [
    "Advanced AI-powered scan analysis",
    "Detailed health insights and recommendations",
    "Unlimited scan history storage",
    "Priority support",
    "Weekly personalized health reports",
    "Expert medical consultations",
    "Advanced trend analysis",
    "Predictive health analytics"
  ];

  return (
    <section className="py-16 bg-white" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">AI Scanning Models</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the AI model that best fits your health monitoring needs.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl hover:border-primary/20">
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-2">Free Model</h3>
              <p className="text-gray-600 mb-4">Access basic AI-powered scans for general health insights.</p>
              <div className="text-4xl font-bold mb-6">$0 <span className="text-base font-normal text-gray-500">/month</span></div>
              
              <Link to="/signup">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white mb-6">Sign Up Free</Button>
              </Link>
              
              <ul className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Premium Plan */}
          <div className="flex-1 bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
              RECOMMENDED
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-2">Premium Model</h3>
              <p className="text-gray-600 mb-4">Unlock advanced scanning features and detailed reports.</p>
              <div className="text-4xl font-bold mb-6">$29 <span className="text-base font-normal text-gray-500">/month</span></div>
              
              <Link to="/signup?plan=premium">
                <Button className="w-full bg-gradient-primary hover:opacity-90 text-white mb-6">
                  Upgrade to Premium
                </Button>
              </Link>
              
              <ul className="space-y-3">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIScanModels;
