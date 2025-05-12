
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, CloudUpload } from 'lucide-react';

const Hero = () => {
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-deep-medical">
              Early Chest Cancer <span className="text-gradient">Detection</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-4">
              Advanced AI analysis of chest x-rays and CT scans with 98.7% clinical accuracy
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mt-6">
              <Link to="/scan">
                <Button className="w-full sm:w-auto disappear-button px-8 py-6 text-lg rounded-lg">
                  Let's Start
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 md:pl-8">
            <div className="scan-visual">
              <div className="scanner-bar"></div>
              <div className="flex flex-col items-center justify-center text-center h-full">
                <div className="drag-drop-instructions w-3/4">
                  <CloudUpload className="w-16 h-16 text-primary mb-4 mx-auto" />
                  <h3 className="text-xl font-medium text-primary mb-2">Drag Image Here to Scan</h3>
                  <p className="text-sm text-gray-500 mb-4">Supports JPG, PNG, DICOM</p>
                  <div className="text-center or-divider">OR</div>
                  <Button variant="outline" className="border-primary text-primary mt-2 hover:bg-primary/10 mx-auto">
                    Browse Files
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
