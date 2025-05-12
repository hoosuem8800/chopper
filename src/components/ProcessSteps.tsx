
import React from 'react';
import { Upload, Brain, FileText } from 'lucide-react';

const ProcessSteps = () => {
  const steps = [
    {
      icon: Upload,
      title: 'Upload Scan',
      description: 'Drag and drop or select your chest X-ray/CT scan in DICOM, JPG or PNG format'
    },
    {
      icon: Brain,
      title: 'AI Analysis',
      description: 'Our deep learning model processes your scan using 123 clinical markers'
    },
    {
      icon: FileText,
      title: 'Get Results',
      description: 'Receive detailed report with risk assessment and recommended actions'
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="neuro-card p-8 text-center">
              <div className="flex flex-col items-center">
                <div className="step-number bg-primary mb-4">
                  {index + 1}
                </div>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-xl font-bold mb-4 text-deep-medical">{step.title}</h4>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSteps;
