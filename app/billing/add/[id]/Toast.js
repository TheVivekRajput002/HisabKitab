"use client"

import React, { useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';

export const Toast = ({ productDetails, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-4 right-4 bg-white border-l-4 border-green-500 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in z-50">
            <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm">Product Auto-Saved!</h4>
                    <p className="text-sm text-gray-600 mt-1 truncate">{productDetails?.name}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        {productDetails?.hsn && <span>HSN: {productDetails.hsn}</span>}
                        {productDetails?.rate && <span>Rate: ₹{productDetails.rate}</span>}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    productDetails={toast.productDetails}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};

export default Toast;
