// Common resource interfaces
export interface ApiResource {
  id: number;
  [key: string]: any;
}

export interface User extends ApiResource {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  subscription_type?: string;
  location?: string;
  is_active?: boolean;
}

export interface Doctor extends ApiResource {
  user?: number | {
    id: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  specialty?: string;
  years_of_experience?: number;
  license_number?: string;
  gender?: string;
  consultation_fee?: number;
  bio?: string;
}

export interface Profile extends ApiResource {
  username?: string;
  phone_number?: string;
  address?: string;
  profile_picture?: string;
  user?: number | {
    id: number;
    username?: string;
    email?: string;
  };
  user_data?: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role?: string;
  };
}

export interface Payment extends ApiResource {
  user?: number | User;
  amount: number;
  status: string;
  payment_method: string;
  transaction_id?: string;
}

export interface Consultation extends ApiResource {
  patient?: number | User;
  doctor?: number | Doctor;
  consultation_type: string;
  status: string;
  scan_id?: number;
  duration?: number;
  notes?: string;
}

export interface Appointment extends ApiResource {
  user?: number | User;
  date_time: string;
  status: string;
  notes?: string;
}

export interface Scan extends ApiResource {
  user?: number | User;
  image: string;
  upload_date?: string;
  status?: string;
  result_status?: string;
  notes?: string;
  requires_consultation?: boolean;
}

// Resource endpoint mapping
export const resourceToEndpoint = {
  users: '/users/',
  doctors: '/doctors/',
  profiles: '/profiles/',
  scans: '/scans/',
  appointments: '/appointments/',
  consultations: '/consultations/',
  payments: '/payments/',
  notifications: '/notifications/',
};

// Common props for manager components
export interface ResourceManagerProps<T extends ApiResource> {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: T | null;
  onSave: (formData: FormData) => Promise<void>;
  isAddMode: boolean;
}

// Utility function to get display name for a resource
export const getResourceDisplayName = (resource?: string) => {
  if (!resource) return 'Resources';
  if (resource === 'profiles') return 'User Profiles';
  return resource.charAt(0).toUpperCase() + resource.slice(1);
}; 