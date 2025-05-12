import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import FloatingIcons from '@/components/FloatingIcons';
import { useAuth } from '@/contexts/AuthContext';
import { cn, chopperButton } from '@/lib/utils';

const PricingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetPremium = () => {
    if (isAuthenticated) {
      navigate('/payment');
    } else {
      navigate('/signup?plan=premium');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <FloatingIcons />
      
      <main className="flex-grow pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h1 className="text-4xl font-bold mb-6 gradient-text">Simple, Transparent Pricing</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that works best for your health monitoring needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Basic Plan */}
            <Card className="border-2 border-gray-200 hover:border-primary transition-all duration-300 neuro-card hover:shadow-lg">
              <CardHeader className="space-y-4">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold">Basic Scan</CardTitle>
                  <CardDescription className="text-base">For individuals getting started</CardDescription>
                </div>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-primary">Free</span>
                </div>
              </CardHeader>
              <CardContent className="py-6">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-700">1 Result for Every Scan</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-700">Basic Detection</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">✕</span>
                    <span className="text-gray-700">Expert Review</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-700">Mobile app access</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-6 pb-8">
                <Link to="/scan" className="w-full">
                  <Button className={cn("w-full py-6 text-lg", chopperButton)}>
                    Start Free Analysis
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            
            {/* Premium Plan */}
            <Card className="border-2 border-primary shadow-lg relative neuro-card hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-2 text-sm font-medium rounded-bl-lg rounded-tr-lg">
                Recommended
              </div>
              <CardHeader className="space-y-4">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold">Premium Care</CardTitle>
                  <CardDescription className="text-base">For health-conscious individuals</CardDescription>
                </div>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-primary">$49</span>
                  <span className="text-lg text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent className="py-6">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-700">Unlimited Scans</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-700">Expert Radiologist Review</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-700">Priority Support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-700">Personalized Health Reports</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-6 pb-8">
                <Button 
                  className={cn("w-full py-6 text-lg", chopperButton)}
                  onClick={handleGetPremium}
                >
                  Get Premium
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="mt-24 max-w-4xl mx-auto bg-gray-50 p-10 rounded-xl border border-gray-200 neuro-card">
            <h2 className="text-3xl font-bold mb-8 gradient-text text-center">Frequently Asked Questions</h2>
            <div className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">Can I cancel my subscription anytime?</h3>
                <p className="text-gray-600 text-lg">Yes, you can cancel your subscription at any time. If you cancel, you'll be able to use your plan until the end of your billing period.</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">Do you offer a free trial?</h3>
                <p className="text-gray-600 text-lg">We offer a 7-day free trial on all plans. No credit card required to try it out.</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">What payment methods do you accept?</h3>
                <p className="text-gray-600 text-lg">We accept all major credit cards, including Visa, Mastercard, and American Express. Enterprise plans can also be paid via invoice.</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">Is my data secure?</h3>
                <p className="text-gray-600 text-lg">Yes, all your health data is encrypted and stored securely. We comply with HIPAA and other healthcare data regulations.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
          </div>
  );
};

export default PricingPage;
