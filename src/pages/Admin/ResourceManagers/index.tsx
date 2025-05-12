import React from 'react';
import UserManager from './UserManager';
import DoctorManager from './DoctorManager';
import ProfileManager from './ProfileManager';
import AppointmentManager from './AppointmentManager';
import { ApiResource, ResourceManagerProps } from './types';

// Import additional managers as they are created
// import PaymentManager from './PaymentManager';
// import ConsultationManager from './ConsultationManager';
// import ScanManager from './ScanManager';

// Factory function to get the appropriate manager component
export const getResourceManager = (resource: string) => {
  switch (resource) {
    case 'users':
      return UserManager;
    case 'doctors':
      return DoctorManager;
    case 'profiles':
      return ProfileManager;
    case 'appointments':
      return AppointmentManager;
    // Uncomment these as they are implemented
    // case 'payments':
    //   return PaymentManager;
    // case 'consultations':
    //   return ConsultationManager;
    // case 'scans':
    //   return ScanManager;
    default:
      return null;
  }
};

/**
 * Generic ResourceManager component that renders the appropriate manager based on resource type
 * Using 'any' here is a compromise to solve type mismatches when manager components have more specific types
 */
const ResourceManager = ({
  resource,
  ...props
}: { resource: string } & any) => {
  const SpecificManager = getResourceManager(resource);
  
  if (!SpecificManager) {
    return null;
  }
  
  // Special handling for users and doctors since they have their own API handling
  if (resource === 'users' || resource === 'doctors' || resource === 'profiles') {
    // We still pass onSave through for compatibility, but the components
    // will override and handle API calls directly
    return <SpecificManager {...props} />;
  }
  
  return <SpecificManager {...props} />;
};

export default ResourceManager;

// Also export individual managers for direct imports
export {
  UserManager,
  DoctorManager,
  ProfileManager,
  AppointmentManager,
}; 