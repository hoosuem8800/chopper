import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const PaymentPageWrapper = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pt-12 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Complete Your Purchase</h1>
            <p className="mt-2">Premium Plan - $49/month</p>
          </div>
          
          <div className="flex justify-center mt-8">
            <Button onClick={() => navigate('/welcome-premium')}>
              Complete Payment
            </Button>
          </div>
        </div>
      </main>
      
          </div>
  );
};

export default PaymentPageWrapper; 