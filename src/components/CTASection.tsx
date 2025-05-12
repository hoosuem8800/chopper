
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Start your journey to better health with MedScan AI today!
        </h2>
        <p className="text-white/80 max-w-2xl mx-auto mb-8 text-lg">
          Take the first step towards proactive health monitoring with our AI-powered scanning technology.
          Sign up for free and experience the future of healthcare.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup">
            <Button className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg rounded-lg">
              Sign Up Free
            </Button>
          </Link>
          <Link to="/signup?plan=premium">
            <Button variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10 px-8 py-6 text-lg rounded-lg">
              Upgrade to Premium
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
