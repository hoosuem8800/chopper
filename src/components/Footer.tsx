import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Twitter, Linkedin, Github, Youtube, UserPlus, LogIn, Heart, Shield, FileText, Users, Code, BookOpen, Facebook, Instagram } from 'lucide-react';
import './Footer.css'; // Import CSS file for keyframes animation

// Create inline LungsIcon component
const LungsIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="14" 
    height="14" 
    fill="currentColor" 
    viewBox="0 0 16 16"
    className={className}
  >
    <path d="M8.5 1.5a.5.5 0 1 0-1 0v5.243L7 7.1V4.72C7 3.77 6.23 3 5.28 3c-.524 0-1.023.27-1.443.592-.431.332-.847.773-1.216 1.229-.736.908-1.347 1.946-1.58 2.48-.176.405-.393 1.16-.556 2.011-.165.857-.283 1.857-.241 2.759.04.867.233 1.79.838 2.33.67.6 1.622.556 2.741-.004l1.795-.897A2.5 2.5 0 0 0 7 11.264V10.5a.5.5 0 0 0-1 0v.764a1.5 1.5 0 0 1-.83 1.342l-1.794.897c-.978.489-1.415.343-1.628.152-.28-.25-.467-.801-.505-1.63-.037-.795.068-1.71.224-2.525.157-.82.357-1.491.491-1.8.19-.438.75-1.4 1.44-2.25.342-.422.703-.799 1.049-1.065.358-.276.639-.385.833-.385a.72.72 0 0 1 .72.72v3.094l-1.79 1.28a.5.5 0 0 0 .58.813L8 7.614l3.21 2.293a.5.5 0 1 0 .58-.814L10 7.814V4.72a.72.72 0 0 1 .72-.72c.194 0 .475.11.833.385.346.266.706.643 1.05 1.066.688.85 1.248 1.811 1.439 2.249.134.309.334.98.491 1.8.156.814.26 1.73.224 2.525-.038.829-.224 1.38-.505 1.63-.213.19-.65.337-1.628-.152l-1.795-.897A1.5 1.5 0 0 1 10 11.264V10.5a.5.5 0 0 0-1 0v.764a2.5 2.5 0 0 0 1.382 2.236l1.795.897c1.12.56 2.07.603 2.741.004.605-.54.798-1.463.838-2.33.042-.902-.076-1.902-.24-2.759-.164-.852-.38-1.606-.558-2.012-.232-.533-.843-1.571-1.579-2.479-.37-.456-.785-.897-1.216-1.229C11.743 3.27 11.244 3 10.72 3 9.77 3 9 3.77 9 4.72V7.1l-.5-.357z"/>
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 w-screen overflow-x-hidden relative z-20">
      <div className="w-full mx-auto pt-4 sm:pt-8 flex flex-col items-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-12 w-full justify-items-center px-4 sm:px-0">
          {/* Get in touch section */}
          <div className="space-y-2 sm:space-y-4 flex flex-col items-center text-center">
            <h3 className="text-xs sm:text-sm font-bold text-gray-800 pb-1 border-b-2 animated-border w-28 sm:w-36 text-center">
              Get in touch
            </h3>
            <ul className="text-gray-600 text-xs sm:text-sm w-full max-w-xs">
              <li className="flex items-center gap-2 sm:gap-3 transition-all duration-300 p-1.5 sm:p-2.5 rounded-lg hover:text-cyan-500 hover:shadow-md group contact-item-hover">
                <div className="p-1.5 sm:p-2 rounded-full bg-cyan-500 text-white group-hover:bg-white group-hover:text-cyan-500 group-hover:shadow-md transition-all duration-300 animated-icon-container">
                  <MapPin className="h-3.5 w-3.5 sm:h-5 sm:w-5 map-pin-icon" />
                </div>
                <span className="font-medium">Université Abdelhamid Mehri</span>
              </li>
              <li className="flex items-center gap-2 sm:gap-3 transition-all duration-300 p-1.5 sm:p-2.5 rounded-lg hover:text-cyan-500 hover:shadow-md group contact-item-hover">
                <div className="p-1.5 sm:p-2 rounded-full bg-cyan-500 text-white group-hover:bg-white group-hover:text-cyan-500 group-hover:shadow-md transition-all duration-300 animated-icon-container">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
                <span className="font-medium">+213 797705487</span>
              </li>
              <li className="flex items-center gap-2 sm:gap-3 transition-all duration-300 p-1.5 sm:p-2.5 rounded-lg hover:text-cyan-500 hover:shadow-md group contact-item-hover">
                <div className="p-1.5 sm:p-2 rounded-full bg-cyan-500 text-white group-hover:bg-white group-hover:text-cyan-500 group-hover:shadow-md transition-all duration-300 animated-icon-container">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
                <span className="font-medium">support@chopper.ai</span>
              </li>
            </ul>
          </div>
          
          {/* CHOPPER section */}
          <div className="space-y-2 sm:space-y-3 flex flex-col items-center text-center">
            <h3 className="text-xs sm:text-sm font-bold text-gray-800 pb-1 border-b-2 animated-border w-28 sm:w-36 flex items-center justify-center gap-1">
              CHOPPER
              <LungsIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-500" />
            </h3>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-400 max-w-sm mx-auto text-xs sm:text-base font-medium italic leading-relaxed tracking-wide">
              "This website uses AI to analyze health data, connects you with trusted medical experts, and offers a supportive community—all built with love to help you find the care you need."
            </p>
          </div>
          
          {/* Social media section */}
          <div className="space-y-2 sm:space-y-3 flex flex-col items-center text-center">
            <h3 className="text-xs sm:text-sm font-bold text-gray-800 pb-1 border-b-2 animated-border w-28 sm:w-36 text-center">
              Social media
            </h3>
            <div className="flex gap-3 sm:gap-4 justify-center mt-1 sm:mt-2">
              <a href="https://www.instagram.com/hoosuem/" className="social-icon-link group">
                <div className="social-icon-container w-7 h-7 sm:w-8 sm:h-8">
                  <Facebook size={16} className="social-icon sm:text-lg" />
                </div>
                <span className="sr-only">Facebook</span>
              </a>
              <a href="https://www.instagram.com/hoosuem/" className="social-icon-link group">
                <div className="social-icon-container w-7 h-7 sm:w-8 sm:h-8">
                  <Twitter size={16} className="social-icon sm:text-lg" />
                </div>
                <span className="sr-only">Twitter</span>
              </a>
              <a href="https://www.instagram.com/hoosuem/" className="social-icon-link group">
                <div className="social-icon-container w-7 h-7 sm:w-8 sm:h-8">
                  <Instagram size={16} className="social-icon sm:text-lg" />
                </div>
                <span className="sr-only">Instagram</span>
              </a>
              <a href="https://www.instagram.com/hoosuem/" className="social-icon-link group">
                <div className="social-icon-container w-7 h-7 sm:w-8 sm:h-8">
                  <Linkedin size={16} className="social-icon sm:text-lg" />
                </div>
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 w-full mt-4">
          <div className="text-center text-white text-[10px] sm:text-xs bg-cyan-500 py-1.5 sm:py-2 w-full font-bold">
            &copy; {new Date().getFullYear()} Chopper. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
