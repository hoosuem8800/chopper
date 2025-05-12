
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const DiagnosticPlans = () => {
  const plans = [
    {
      title: "Basic Scan",
      price: "Free",
      period: "",
      features: [
        "1 Scan/Month",
        "Basic Detection",
        "Expert Review"
      ],
      buttonText: "Start Free Analysis",
      buttonLink: "/signup",
      highlighted: false
    },
    {
      title: "Premium Care",
      price: "$49",
      period: "/month",
      features: [
        "Unlimited Scans",
        "Detailed Diagnosis",
        "Priority Consult"
      ],
      buttonText: "Get Premium",
      buttonLink: "/pricing",
      highlighted: true
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Diagnostic Plans
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`bg-white rounded-xl shadow-md overflow-hidden border ${
                plan.highlighted ? 'border-primary' : 'border-gray-100'
              }`}
            >
              <div className="p-8">
                <h3 className="text-xl font-bold text-center mb-6 text-primary">
                  {plan.title}
                </h3>
                
                <div className="text-center mb-8">
                  <span className="text-4xl md:text-5xl font-bold">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full py-6 ${
                    plan.highlighted 
                      ? 'bg-primary hover:bg-primary/90 text-white' 
                      : 'bg-white border-2 border-primary text-primary hover:bg-primary/10'
                  }`}
                  asChild
                >
                  <Link to={plan.buttonLink}>
                    {plan.buttonText}
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DiagnosticPlans;
