import { createContext, useContext, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

function ToastProvider({ children }) {
  const addToast = useCallback((message, type = 'success') => {
    if (window.Toastify) {
      window.Toastify({
        text: message,
        duration: 3000,
        gravity: 'top',
        position: 'right',
        style: {
          background: type === 'success'
            ? 'linear-gradient(to right, #00b09b, #96c93d)'
            : 'linear-gradient(to right, #ff5f6d, #ffc371)',
        },
      }).showToast();
    }
  }, []);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/toastify-js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
      delete window.Toastify;
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
export { useToast };
