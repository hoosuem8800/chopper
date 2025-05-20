import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Crown } from 'lucide-react';
import { buildApiUrl } from '@/config/api';

const PremiumConfirmationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleConfirmPremium = async () => {
    try {
      const response = await fetch(buildApiUrl('users/upgrade_subscription/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Dispatch event to refresh user data
        window.dispatchEvent(new Event('refresh-user'));
        navigate('/welcome-premium');
      } else {
        console.error('Failed to upgrade subscription');
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-primary/10 filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 h-64 w-64 rounded-full bg-amber-500/10 filter blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-16 flex-grow flex flex-col items-center justify-center">
        <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all duration-500 animate-fade-in">
          {/* Premium badge */}
          <div className="absolute -top-2 -right-2">
            <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400 text-white text-xs font-extrabold tracking-widest px-4 py-1.5 rounded-lg shadow-xl border border-amber-200 flex items-center transform translate-y-3 rotate-3">
              <span className="mr-1.5 bg-white/90 rounded-full p-0.5 flex items-center justify-center shadow-inner">
                <Crown className="h-3 w-3 text-amber-500" />
              </span>
              PREMIUM
            </div>
          </div>

          <div className="p-8">
            <h1 className="text-2xl font-bold text-center mb-6">Confirm Premium Upgrade</h1>
            
            <div className="bg-gradient-to-r from-blue-50 to-primary/5 p-6 rounded-lg border border-primary/10 mb-6">
              <p className="text-gray-700 text-center">
                You are about to upgrade to our Premium plan for $49/month. 
                This will unlock all premium features and provide you with enhanced scanning capabilities.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleConfirmPremium}
                className="w-full relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-white hover:text-transparent hover:bg-clip-text hover:from-cyan-500 hover:to-blue-500 text-white shadow-sm hover:shadow-md transition-all duration-300 text-sm px-4 py-2.5 rounded-lg hover:-translate-y-0.5 active:translate-y-0 border border-transparent hover:border-cyan-300 hover:border-2 group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Crown className="text-white hover-button-icon transition-colors duration-300" />
                  Complete Purchase
                  <ArrowRight className="h-4 w-4 transform transition-all duration-300 hover-button-icon group-hover:translate-x-1" />
                </span>
              </Button>

              <Button 
                variant="outline"
                onClick={() => navigate('/pricing')}
                className="w-full border-primary text-primary hover:bg-primary/5"
              >
                Back to Pricing
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumConfirmationPage; 