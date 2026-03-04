"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, CreditCard, Loader2, DollarSign, Building, FileText, CheckCircle2, Camera, Upload, X, ScanLine } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

// ============================================================================
// CHECK SCANNER MODAL
// ============================================================================

function CheckScannerModal({ onExtracted, onClose }) {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) {
            setError('Invalid file type. Please upload JPG, PNG, or WEBP.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('File size exceeds 5MB limit.');
            return;
        }

        setError(null);
        setImageFile(file);

        // Preview
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleScan = async () => {
        if (!imageFile) return;
        setScanning(true);
        setError(null);

        try {
            // Convert to base64
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(imageFile);
            });

            // Call API
            const response = await fetch('/api/scan-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64 })
            });

            if (!response.ok) {
                const { error: apiError } = await response.json();
                throw new Error(apiError || 'Failed to scan check');
            }

            const { rawText } = await response.json();
            if (!rawText) throw new Error('No response from AI');

            // Parse JSON from response
            const start = rawText.indexOf('{');
            const end = rawText.lastIndexOf('}');
            if (start === -1 || end === -1 || end <= start) {
                throw new Error('Could not parse AI response');
            }

            let jsonStr = rawText.substring(start, end + 1);
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

            const data = JSON.parse(jsonStr);
            onExtracted(data);
            onClose();
        } catch (err) {
            console.error('Check scan error:', err);
            setError(err.message || 'Failed to scan check. Please try again.');
        } finally {
            setScanning(false);
        }
    };

    const handleReset = () => {
        setImageFile(null);
        setImagePreview(null);
        setError(null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ScanLine className="text-blue-600" size={22} />
                        <h2 className="text-lg font-bold text-gray-800">Scan Check</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                        disabled={scanning}
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}

                    {!imagePreview ? (
                        <div className="space-y-3">
                            {/* File upload area */}
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all">
                                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">
                                    <span className="font-semibold text-blue-600">Click to upload</span> a check image
                                </p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (MAX. 5MB)</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    disabled={scanning}
                                />
                            </label>

                            {/* Camera button */}
                            <button
                                onClick={() => cameraInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                disabled={scanning}
                            >
                                <Camera size={20} />
                                Take Photo of Check
                            </button>
                            <input
                                ref={cameraInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleFileChange}
                                disabled={scanning}
                            />

                            <p className="text-xs text-gray-400 text-center">
                                Upload or photograph the filled check. AI will extract the details automatically.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Image preview */}
                            <div className="relative rounded-lg overflow-hidden border border-gray-200">
                                <img
                                    src={imagePreview}
                                    alt="Check preview"
                                    className="w-full max-h-64 object-contain bg-gray-50"
                                />
                                {!scanning && (
                                    <button
                                        onClick={handleReset}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                                        title="Remove image"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {scanning && (
                                <div className="flex flex-col items-center py-4">
                                    <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                                    <p className="text-sm text-gray-600 font-medium">Extracting check details...</p>
                                    <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {imagePreview && !scanning && (
                    <div className="p-4 border-t bg-gray-50 flex gap-3">
                        <button
                            onClick={handleReset}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
                        >
                            Re-upload
                        </button>
                        <button
                            onClick={handleScan}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <ScanLine size={18} />
                            Extract Details
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// MAIN PAY PAGE
// ============================================================================

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
    const [showScanner, setShowScanner] = useState(false);
    const [scanFilled, setScanFilled] = useState(false);

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

    // Handle extracted check data from the scanner modal
    const handleCheckExtracted = (data) => {
        setFormData(prev => ({
            ...prev,
            amount: data.amount || prev.amount,
            cheque_number: data.cheque_number || prev.cheque_number,
            cheque_bank: data.cheque_bank || prev.cheque_bank,
            cheque_date: data.cheque_date || prev.cheque_date,
            payment_date: data.cheque_date || prev.payment_date,
            notes: data.notes || prev.notes
        }));
        setScanFilled(true);
        // Auto-dismiss the success badge after 5 seconds
        setTimeout(() => setScanFilled(false), 5000);
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
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 mb-2">Record Payment</h1>
                                <p className="text-gray-600">
                                    Payment for <span className="font-semibold">{vendor?.name}</span>
                                    {bill && ` • Bill #${bill.bill_number}`}
                                </p>
                            </div>

                            {/* Scan Check Button — only for CHEQUE method */}
                            {formData.payment_method === 'CHEQUE' && (
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
                                >
                                    <ScanLine size={18} />
                                    Scan Check
                                </button>
                            )}
                        </div>

                        {/* Scan success indicator */}
                        {scanFilled && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                <CheckCircle2 size={16} />
                                Check details auto-filled! Review and edit below before submitting.
                            </div>
                        )}
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

            {/* Check Scanner Modal */}
            {showScanner && (
                <CheckScannerModal
                    onExtracted={handleCheckExtracted}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}
