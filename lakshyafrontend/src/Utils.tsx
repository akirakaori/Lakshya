import { toast, type ToastOptions } from 'react-toastify';

// Default toast configuration
const defaultToastConfig: ToastOptions = {
  position: "top-center",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
  draggable: true,
  progress: undefined,
  theme: "light",
};

// Enhanced toast helper functions
export const handleSuccess = (msg: string | number) => {
  toast.success(msg, {
    ...defaultToastConfig,
  });
};

export const handleError = (msg: string | number) => {
  toast.error(msg, {
    ...defaultToastConfig,
  });
};

export const handleInfo = (msg: string | number) => {
  toast.info(msg, {
    ...defaultToastConfig,
  });
};

export const handleWarning = (msg: string | number) => {
  toast.warning(msg, {
    ...defaultToastConfig,
  });
};

// Generic toast helper with custom type
export const showToast = (
  type: 'success' | 'error' | 'info' | 'warning',
  message: string | number,
  options?: ToastOptions
) => {
  const config = { ...defaultToastConfig, ...options };
  
  switch (type) {
    case 'success':
      toast.success(message, config);
      break;
    case 'error':
      toast.error(message, config);
      break;
    case 'info':
      toast.info(message, config);
      break;
    case 'warning':
      toast.warning(message, config);
      break;
    default:
      toast(message, config);
  }
};

// Re-export image utilities
export { getFileUrl, getInitials } from './utils/image-utils';

// Re-export currency utilities
export { formatCurrencyNPR, formatCurrencyShort } from './utils/currency';