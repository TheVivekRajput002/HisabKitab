"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, CreditCard, Loader2, DollarSign, Building, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

export default function VendorPayPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    // Support either [vendorId] or [id] if the folder is named differently
    const vendorId = params.vendorId || params.id;
    const billId = searchParams.get('billId');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [vendor, setVendor] = useState(null);
    const [bill, setBill] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        payment_method: 'CHEQUE',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',

        // CHEQUE
        cheque_number: '',
        cheque_bank: '',
        cheque_date: new Date().toISOString().split('T')[0],

        // RTGS
        rtgs_transaction_id: '',
        rtgs_bank: '',
        rtgs_transfer_date: new Date().toISOString().split('T')[0],

        // RECEIPT (CASH)
        receipt_number: '',
        receipt_issued_by: '',

        // CREDIT NOTE
        credit_note_number: '',
        reference_invoice: ''
    });

    useEffect(() => {
        if (vendorId) {
            fetchDetails();
        } else {
            setLoading(false);
            setError("Vendor ID is missing");
        }
    }, [vendorId, billId]);

    const fetchDetails = async () => {
        try {
            setLoading(true);

            // Fetch vendor
            const { data: vendorData, error: vendorError } = await supabase
                .from('vendors')
                .select('*')
                .eq('id', vendorId)
                .single();
            if (vendorError) throw vendorError;
            setVendor(vendorData);

            // Fetch bill if billId is present
            if (billId) {
                const { data: billData, error: billError } = await supabase
                    .from('vendor_bills')
                    .select('*')
                    .eq('id', billId)
                    .single();
                if (billError) throw billError;
                setBill(billData);
                setFormData(prev => ({
                    ...prev,
                    amount: billData.total_amount || '',
                    reference_invoice: billData.bill_number || ''
                }));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Generate auto-payment number (PAY- + Timestamp + Random)
            const paymentNumber = `PAY-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

            // 1. Insert Payment
            const { data: paymentData, error: paymentError } = await supabase
                .from('payments')
                .insert({
                    payment_number: paymentNumber,
                    customer_id: vendorId, // Using vendorId as customer_id based on schema mapping
                    vendor_bill_id: billId || null,
                    amount: parseFloat(formData.amount),
                    payment_method: formData.payment_method,
                    payment_date: formData.payment_date,
                    status: 'CLEARED',
                    notes: formData.notes
                })
                .select('id')
                .single();

            if (paymentError) throw paymentError;

            const paymentId = paymentData.id;

            // 2. Insert Payment Details
            let detailsPayload = { payment_id: paymentId };

            if (formData.payment_method === 'CHEQUE') {
                detailsPayload = {
                    ...detailsPayload,
                    cheque_number: formData.cheque_number,
                    cheque_bank: formData.cheque_bank,
                    cheque_date: formData.cheque_date || null
                };
            } else if (formData.payment_method === 'RTGS') {
                detailsPayload = {
                    ...detailsPayload,
                    rtgs_transaction_id: formData.rtgs_transaction_id,
                    rtgs_bank: formData.rtgs_bank,
                    rtgs_transfer_date: formData.rtgs_transfer_date || null
                };
            } else if (formData.payment_method === 'RECEIPT') {
                detailsPayload = {
                    ...detailsPayload,
                    receipt_number: formData.receipt_number,
                    receipt_issued_by: formData.receipt_issued_by
                };
            } else if (formData.payment_method === 'CREDIT_NOTE') {
                detailsPayload = {
                    ...detailsPayload,
                    credit_note_number: formData.credit_note_number,
                    reference_invoice: formData.reference_invoice
                };
            }

            const { error: detailsError } = await supabase
                .from('payment_details')
                .insert(detailsPayload);

            if (detailsError) throw detailsError;

            // 3. Update the vendor_bills payment_status and link the payment
            if (billId) {
                const { error: updateError } = await supabase
                    .from('vendor_bills')
                    .update({
                        payment_status: 'paid'
                    })
                    .eq('id', billId);

                if (updateError) throw updateError;
            }

            setSuccess(true);
            setTimeout(() => {
                router.push(`/vendor/${vendorId}/bills`);
            }, 2000);
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    if (error && !vendor) {
        return (
            <div className="min-h-screen bg-gray-100 p-4">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                        {error}
                    </div>
                    <button
                        onClick={() => router.push(`/vendor/${vendorId}/bills`)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        Back to Bills
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => router.push(`/vendor/${vendorId}/bills`)}
                    className="mb-6 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                >
                    <ArrowLeft size={18} />
                    Back to Bills
                </button>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Record Payment</h1>
                        <p className="text-gray-600">
                            Payment for <span className="font-semibold">{vendor?.name}</span>
                            {bill && ` • Bill #${bill.bill_number}`}
                        </p>
                    </div>

                    {success ? (
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="text-green-600" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Recorded</h2>
                            <p className="text-gray-600">The payment has been successfully recorded in the payment tables.</p>
                            <p className="text-sm text-gray-500 mt-4">Redirecting back to bills...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                                    {error}
                                </div>
                            )}

                            {/* Payment Options */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        { id: 'CHEQUE', label: 'Bank Cheque', icon: FileText },
                                        { id: 'RECEIPT', label: 'Receipt (Cash)', icon: DollarSign },
                                        { id: 'CREDIT_NOTE', label: 'Credit Note', icon: FileText },
                                        { id: 'RTGS', label: 'RTGS (Bank Transfer)', icon: Building }
                                    ].map((method) => {
                                        const Icon = method.icon;
                                        return (
                                            <label
                                                key={method.id}
                                                className={`
                                                    flex items-center p-4 border rounded-lg cursor-pointer transition-all
                                                    ${formData.payment_method === method.id
                                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                    }
                                                `}
                                            >
                                                <input
                                                    type="radio"
                                                    name="payment_method"
                                                    value={method.id}
                                                    checked={formData.payment_method === method.id}
                                                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                />
                                                <span className="ml-3 flex items-center gap-2">
                                                    <Icon size={18} className={formData.payment_method === method.id ? 'text-blue-600' : 'text-gray-500'} />
                                                    <span className={`font-medium ${formData.payment_method === method.id ? 'text-blue-900' : 'text-gray-700'}`}>
                                                        {method.label}
                                                    </span>
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Common Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.payment_date}
                                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Dynamically Rendered Detailed Fields */}
                            <div className="space-y-4">
                                {formData.payment_method === 'CHEQUE' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Number</label>
                                            <input type="text" value={formData.cheque_number} onChange={(e) => setFormData({ ...formData, cheque_number: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required placeholder="CHQ-000000" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                            <input type="text" value={formData.cheque_bank} onChange={(e) => setFormData({ ...formData, cheque_bank: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required placeholder="State Bank of India" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Date</label>
                                            <input type="date" value={formData.cheque_date} onChange={(e) => setFormData({ ...formData, cheque_date: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                )}

                                {formData.payment_method === 'RTGS' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID / UTR</label>
                                            <input type="text" value={formData.rtgs_transaction_id} onChange={(e) => setFormData({ ...formData, rtgs_transaction_id: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required placeholder="UTR12345678" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                            <input type="text" value={formData.rtgs_bank} onChange={(e) => setFormData({ ...formData, rtgs_bank: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required placeholder="HDFC Bank" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Date</label>
                                            <input type="date" value={formData.rtgs_transfer_date} onChange={(e) => setFormData({ ...formData, rtgs_transfer_date: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                )}

                                {formData.payment_method === 'RECEIPT' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
                                            <input type="text" value={formData.receipt_number} onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required placeholder="REC-1002" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Issued By</label>
                                            <input type="text" value={formData.receipt_issued_by} onChange={(e) => setFormData({ ...formData, receipt_issued_by: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required placeholder="Cashier Name" />
                                        </div>
                                    </div>
                                )}

                                {formData.payment_method === 'CREDIT_NOTE' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Credit Note Number</label>
                                            <input type="text" value={formData.credit_note_number} onChange={(e) => setFormData({ ...formData, credit_note_number: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required placeholder="CN-501" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Invoice</label>
                                            <input type="text" value={formData.reference_invoice} onChange={(e) => setFormData({ ...formData, reference_invoice: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="INV-2023" />
                                        </div>
                                    </div>
                                )}

                                {/* Notes is common */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">
                                        Notes / Remarks
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Add any additional details here..."
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-lg"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={20} />
                                            Record Payment
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
