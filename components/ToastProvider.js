"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

// Global listener for imperative toast calls (even outside React lifecycle)
let toastSubscriber = null;

export const toast = {
    success: (message, options = {}) => {
        if (toastSubscriber) toastSubscriber({ type: 'success', message, ...options });
    },
    error: (message, options = {}) => {
        if (toastSubscriber) toastSubscriber({ type: 'error', message, ...options });
    },
    info: (message, options = {}) => {
        if (toastSubscriber) toastSubscriber({ type: 'info', message, ...options });
    },
    warning: (message, options = {}) => {
        if (toastSubscriber) toastSubscriber({ type: 'warning', message, ...options });
    },
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((toastData) => {
        const id = Date.now() + Math.random().toString(36).substring(2, 9);
        const newToast = {
            id,
            type: toastData.type || 'info',
            message: toastData.message || '',
            title: toastData.title,
            duration: toastData.duration !== undefined ? toastData.duration : 4500,
        };

        setToasts((prev) => [...prev, newToast]);

        if (newToast.duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, newToast.duration);
        }

        return id;
    }, [removeToast]);

    useEffect(() => {
        toastSubscriber = addToast;
        return () => {
            if (toastSubscriber === addToast) {
                toastSubscriber = null;
            }
        };
    }, [addToast]);

    const contextValue = {
        toast,
        addToast,
        removeToast,
        success: toast.success,
        error: toast.error,
        info: toast.info,
        warning: toast.warning,
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    return context || toast;
}

function ToastContainer({ toasts, removeToast }) {
    if (!toasts || toasts.length === 0) return null;

    return (
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
            ))}
        </div>
    );
}

function ToastItem({ toast: t, onDismiss }) {
    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
        error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
        info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
    };

    const borders = {
        success: 'border-emerald-200 bg-white/95 text-emerald-950 shadow-emerald-500/10',
        error: 'border-rose-200 bg-white/95 text-rose-950 shadow-rose-500/10',
        warning: 'border-amber-200 bg-white/95 text-amber-950 shadow-amber-500/10',
        info: 'border-blue-200 bg-white/95 text-blue-950 shadow-blue-500/10',
    };

    const sideBar = {
        success: 'bg-emerald-500',
        error: 'bg-rose-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500',
    };

    return (
        <div
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 transform translate-y-0 opacity-100 ${borders[t.type] || borders.info} overflow-hidden relative`}
            role="alert"
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${sideBar[t.type] || sideBar.info}`} />
            <div className="mt-0.5 ml-1">{icons[t.type] || icons.info}</div>
            <div className="flex-1 min-w-0 pr-1">
                {t.title && <p className="text-xs font-bold uppercase tracking-wider mb-0.5 text-gray-700">{t.title}</p>}
                <p className="text-sm font-medium text-gray-800 break-words whitespace-pre-line">{t.message}</p>
            </div>
            <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100/80 cursor-pointer"
                title="Dismiss"
            >
                <X size={15} />
            </button>
        </div>
    );
}

export default ToastProvider;

