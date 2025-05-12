import { toast } from 'sonner';

export const customToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
      dismissible: true,
    });
  },
  error: (message: string) => {
    toast.error(message, {
      duration: 3000,
      dismissible: true,
    });
  },
  info: (message: string) => {
    toast.info(message, {
      duration: 3000,
      dismissible: true,
    });
  },
  warning: (message: string) => {
    toast.warning(message, {
      duration: 3000,
      dismissible: true,
    });
  }
}; 