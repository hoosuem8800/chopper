import React from 'react';
import { 
  Stethoscope, 
  FileText, 
  Heart, 
  HeartPulse, 
  Activity, 
  Pill, 
  Syringe, 
  Thermometer, 
  Shield, 
  Microscope, 
  Radiation 
} from 'lucide-react';

// Custom Lungs icon component
export const LungsIcon = ({ className, size = 16 }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    fill="currentColor" 
    viewBox="0 0 16 16"
    className={className}
  >
    <path d="M8.5 1.5a.5.5 0 1 0-1 0v5.243L7 7.1V4.72C7 3.77 6.23 3 5.28 3c-.524 0-1.023.27-1.443.592-.431.332-.847.773-1.216 1.229-.736.908-1.347 1.946-1.58 2.48-.176.405-.393 1.16-.556 2.011-.165.857-.283 1.857-.241 2.759.04.867.233 1.79.838 2.33.67.6 1.622.556 2.741-.004l1.795-.897A2.5 2.5 0 0 0 7 11.264V10.5a.5.5 0 0 0-1 0v.764a1.5 1.5 0 0 1-.83 1.342l-1.794.897c-.978.489-1.415.343-1.628.152-.28-.25-.467-.801-.505-1.63-.037-.795.068-1.71.224-2.525.157-.82.357-1.491.491-1.8.19-.438.75-1.4 1.44-2.25.342-.422.703-.799 1.049-1.065.358-.276.639-.385.833-.385a.72.72 0 0 1 .72.72v3.094l-1.79 1.28a.5.5 0 0 0 .58.813L8 7.614l3.21 2.293a.5.5 0 1 0 .58-.814L10 7.814V4.72a.72.72 0 0 1 .72-.72c.194 0 .475.11.833.385.346.266.706.643 1.05 1.066.688.85 1.248 1.811 1.439 2.249.134.309.334.98.491 1.8.156.814.26 1.73.224 2.525-.038.829-.224 1.38-.505 1.63-.213.19-.65.337-1.628-.152l-1.795-.897A1.5 1.5 0 0 1 10 11.264V10.5a.5.5 0 0 0-1 0v.764a2.5 2.5 0 0 0 1.382 2.236l1.795.897c1.12.56 2.07.603 2.741.004.605-.54.798-1.463.838-2.33.042-.902-.076-1.902-.24-2.759-.164-.852-.38-1.606-.558-2.012-.232-.533-.843-1.571-1.579-2.479-.37-.456-.785-.897-1.216-1.229C11.743 3.27 11.244 3 10.72 3 9.77 3 9 3.77 9 4.72V7.1l-.5-.357z"/>
  </svg>
);

// Export the stethoscope icon with a consistent interface
export const StethoscopeIcon = ({ className, size = 16 }: { className?: string, size?: number }) => (
  <Stethoscope className={className} size={size} />
);

// Export other medical icons with a consistent interface
export const MedicalIcons = {
  Stethoscope: StethoscopeIcon,
  Lungs: LungsIcon,
  FileText: ({ className, size = 16 }: { className?: string, size?: number }) => (
    <FileText className={className} size={size} />
  ),
  Heart: ({ className, size = 16 }: { className?: string, size?: number }) => (
    <Heart className={className} size={size} />
  ),
  HeartPulse: ({ className, size = 16 }: { className?: string, size?: number }) => (
    <HeartPulse className={className} size={size} />
  ),
  Activity: ({ className, size = 16 }: { className?: string, size?: number }) => (
    <Activity className={className} size={size} />
  ),
  Pill: ({ className, size = 16 }: { className?: string, size?: number }) => (
    <Pill className={className} size={size} />
  ),
  Syringe: ({ className, size = 16 }: { className?: string, size?: number }) => (
    <Syringe className={className} size={size} />
  ),
  Thermometer: ({ className, size = 16 }: { className?: string, size?: number }) => (
    <Thermometer className={className} size={size} />
  ),
  Shield: ({ className, size = 16 }: { className?: string, size?: number }) => (
    <Shield className={className} size={size} />
  ),
  Microscope: ({ className, size = 16 }: { className?: string, size?: number }) => (
    <Microscope className={className} size={size} />
  ),
  Radiation: ({ className, size = 16 }: { className?: string, size?: number }) => (
    <Radiation className={className} size={size} />
  )
};

export default MedicalIcons; 