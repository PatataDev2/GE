import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'error', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, toasts }}>
      {children}
      <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-2" style={{ pointerEvents: 'none' }}>
        {toasts.map(toast => (
          <div key={toast.id}
            onClick={() => removeToast(toast.id)}
            className="px-5 py-3 rounded-lg text-white text-sm font-medium shadow-lg cursor-pointer max-w-[380px]"
            style={{
              pointerEvents: 'auto',
              animation: 'toastIn 0.25s ease-out',
              background: toast.type === 'error' ? '#ef4444' :
                          toast.type === 'success' ? '#22c55e' :
                          toast.type === 'warning' ? '#f59e0b' : '#3b82f6',
            }}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
