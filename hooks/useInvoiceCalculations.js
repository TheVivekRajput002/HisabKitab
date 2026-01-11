
import { useMemo, useCallback } from 'react';

export const useInvoiceCalculations = (products, gstIncluded) => {
    const calculateProductTotal = useCallback((quantity, rate, gstPercentage) => {
        if (gstIncluded) {
            const basePrice = rate / (1 + gstPercentage / 100);
            return quantity * basePrice;
        } else {
            const baseAmount = quantity * rate;
            const gstAmount = (baseAmount * gstPercentage) / 100;
            return baseAmount + gstAmount;
        }
    }, [gstIncluded]);

    const subtotal = useMemo(() => {
        return products.reduce((sum, product) => {
            if (gstIncluded) {
                // Subtotal is base price (rate without GST)
                const basePrice = product.rate / (1 + product.gstPercentage / 100);
                return sum + (product.quantity * basePrice);
            } else {
                // Subtotal is just quantity × rate
                return sum + (product.quantity * product.rate);
            }
        }, 0);
    }, [products, gstIncluded]);

    const totalGST = useMemo(() => {
        return products.reduce((sum, product) => {
            if (gstIncluded) {
                // Extract GST from the rate
                const basePrice = product.rate / (1 + product.gstPercentage / 100);
                const gstAmount = product.rate - basePrice;
                return sum + (product.quantity * gstAmount);
            } else {
                // Calculate GST on base amount
                const base = product.quantity * product.rate;
                const gst = (base * product.gstPercentage) / 100;
                return sum + gst;
            }
        }, 0);
    }, [products, gstIncluded]);

    // ✅ FIX: Grand total should ALWAYS be subtotal + totalGST
    const grandTotal = useMemo(() => {
        return subtotal + totalGST;
    }, [subtotal, totalGST]);

    return {
        calculateProductTotal,
        subtotal,
        totalGST,
        grandTotal
    };
};