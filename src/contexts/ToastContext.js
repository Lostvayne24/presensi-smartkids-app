import React, { createContext, useState, useContext, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback((message) => addToast(message, 'success'), [addToast]);
    const error = useCallback((message) => addToast(message, 'error'), [addToast]);
    const info = useCallback((message) => addToast(message, 'info'), [addToast]);
    const warning = useCallback((message) => addToast(message, 'warning'), [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
            {children}
        </ToastContext.Provider>
    );
};
