import { toast } from 'sonner';

interface ToastOptions {
  description?: string;
}

/**
 * Custom toast functions with simplified interface and consistent styling
 */
export const customToast = {
  /**
   * Show a success toast notification
   */
  success: (message: string) => {
    toast.success(message, {
      duration: 1000,
      dismissible: true,
    });
  },

  /**
   * Show an error toast notification
   */
  error: (message: string) => {
    toast.error(message, {
      duration: 1000,
      dismissible: true,
    });
  },

  /**
   * Show an info toast notification
   */
  info: (message: string) => {
    toast.info(message, {
      duration: 1000,
      dismissible: true,
    });
  },

  /**
   * Show a warning toast notification
   */
  warning: (message: string) => {
    toast.warning(message, {
      duration: 1000,
      dismissible: true,
    });
  }
}; 