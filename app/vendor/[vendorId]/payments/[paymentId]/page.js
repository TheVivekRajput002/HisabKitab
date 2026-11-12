"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, Search, Edit2, AlertCircle, Loader2, CreditCard, Building, Building2, Ticket, DollarSign, FileText, CheckCircle2, Eye, Trash2, X } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { toast } from '@/components/ToastProvider';

function Badge({ children, variant = 'default', className = '' }) {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        PENDING: 'bg-yellow-100 text-yellow-800',
        CLEARED: 'bg-green-100 text-green-800',
        FAILED: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800'
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.default} ${className}`}>{children}</span>;
}

const MethodIcon = ({ method, size = 20, className = "" }) => {
    switch (method) {
        case 'CHEQUE': return <FileText size={size} className={className} />;
        case 'RTGS': return <Building size={size} className={className} />;
        case 'RECEIPT': return <DollarSign size={size} className={className} />;
        case 'CREDIT_NOTE': return <Ticket size={size} className={className} />;
        default: return <CreditCard size={size} className={className} />;
    }
}

export default function VendorPaymentDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const vendorId = params.vendorId || params.id;
    const paymentId = params.paymentId;

    const [loading, setLoading] = useState(true);
    const [vendor, setVendor] = useState(null);
    const [payment, setPayment] = useState(null);
    const [linkedBill, setLinkedBill] = useState(null);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (vendorId && paymentId) {
            fetchPaymentDetails();
        }
    }, [vendorId, paymentId]);

    const fetchPaymentDetails = async () => {
        try {
            setLoading(true);

            // Fetch Vendor
            const { data: vendorData, error: vendorError } = await supabase
                .from('vendors')
                .select('*')
                .eq('id', vendorId)
                .single();

            if (vendorError) throw vendorError;
            setVendor(vendorData);

            // Fetch Payment with Details (Joined)
            const { data: paymentData, error: paymentError } = await supabase
                .from('payments')
                .select(`
                    id, 
                    payment_number, 
                    amount, 
                    remaining_amount,
                    payment_method, 
                    payment_date, 
                    status,
                    notes,
                    created_at,
                    vendor_bill_id,
                    payment_details (*)
                `)
                .eq('id', paymentId)
                .single();

            if (paymentError) throw paymentError;

            // Format joined details properly for easy access
            const processedPayment = {
                ...paymentData,
                details: paymentData.payment_details?.[0] || paymentData.payment_details || {}
            };

            setPayment(processedPayment);

            // Fetch linked bill if vendor_bill_id exists
            if (paymentData.vendor_bill_id) {
                const { data: billData } = await supabase
                    .from('vendor_bills')
                    .select('id, bill_number, total_amount, payment_status, bill_date')
                    .eq('id', paymentData.vendor_bill_id)
                    .single();
                if (billData) setLinkedBill(billData);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePayment = async () => {
        if (!paymentId) return;
        setDeleting(true);
        try {
            // 1. Remove photo from storage if exists
            if (payment?.details?.cheque_photo_url) {
                try {
                    await supabase.storage
                        .from('cheque-photos')
                        .remove([payment.details.cheque_photo_url]);
                } catch (storageErr) {
                    console.warn('Could not remove photo from storage:', storageErr);
                }
            }

            // 2. Delete from payment_details
            const { error: detailsErr } = await supabase
                .from('payment_details')
                .delete()
                .eq('payment_id', paymentId);

            if (detailsErr) throw detailsErr;

            // 3. Delete from payments
            const { error: payErr } = await supabase
                .from('payments')
                .delete()
                .eq('id', paymentId);

            if (payErr) throw payErr;

            // 4. Update linked bill payment_status if exists
            if (payment?.vendor_bill_id) {
                const { data: remainingPayments } = await supabase
                    .from('payments')
                    .select('amount')
                    .eq('vendor_bill_id', payment.vendor_bill_id);

                const { data: billRow } = await supabase
                    .from('vendor_bills')
                    .select('id, total_amount')
                    .eq('id', payment.vendor_bill_id)
                    .single();

                if (billRow) {
                    const totalPaidOther = (remainingPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);
                    const billTotal = Number(billRow.total_amount) || 0;
                    let newStatus = 'unpaid';
                    if (totalPaidOther >= billTotal && billTotal > 0) {
                        newStatus = 'paid';
                    } else if (totalPaidOther > 0) {
                        newStatus = 'partial';
                    }
                    await supabase
                        .from('vendor_bills')
                        .update({ payment_status: newStatus })
                        .eq('id', payment.vendor_bill_id);
                }
            }

            toast.success(`Payment #${payment?.payment_number || ''} deleted successfully`);
            router.push(`/vendor/${vendorId}/payments`);
        } catch (err) {
            console.error('Error deleting payment:', err);
            toast.error(`Failed to delete payment: ${err.message || 'Unknown error'}`);
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    if (error || !vendor || !payment) {
        return (
            <div className="min-h-screen bg-gray-100 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error || 'Payment not found'}
                    </div>
                    <button
                        onClick={() => router.push(`/vendor/${vendorId}/payments`)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        Back to Payments
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <button
                        onClick={() => router.push(`/vendor/${vendorId}/payments`)}
                        className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                        <ArrowLeft size={18} />
                        Back to Payments
                    </button>

                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={deleting}
                        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-2 shadow-sm font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <Trash2 size={16} />
                        Delete Payment
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex flex-wrap justify-between items-start gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <MethodIcon method={payment.payment_method} className="text-blue-600" size={28} />
                                <h1 className="text-2xl font-bold text-gray-800">{payment.payment_number}</h1>
                            </div>
                            <p className="text-gray-600 flex items-center gap-2">
                                <Building2 size={16} className="text-gray-400" />
                                <span className="font-semibold">{vendor.name}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-green-600 shrink-0">
                                ₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            <div className="mt-2 text-sm">
                                <Badge variant={payment.status} className="px-3 py-1 uppercase text-sm">{payment.status}</Badge>
                            </div>
                        </div>
                    </div>

                    {/* Linked Bill Info */}
                    {linkedBill && (
                        <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment for Bill</p>
                                    <p className="text-lg font-bold text-gray-800">Bill #{linkedBill.bill_number}</p>
                                    <p className="text-sm text-gray-600 mt-0.5">
                                        Bill Amount: <strong>₹{Number(linkedBill.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                                        {payment.remaining_amount > 0 && (
                                            <span className="ml-3 text-orange-600">
                                                Remaining: <strong>₹{Number(payment.remaining_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push(`/vendor/${vendorId}/bills`)}
                                    className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded-lg hover:bg-gray-50 border shadow-sm flex items-center gap-1"
                                >
                                    <FileText size={14} />
                                    View Bill
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* General Details Section */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                    <Clock size={18} className="text-gray-500" />
                                    General Information
                                </h3>
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Payment Date</span>
                                        <span className="font-medium text-gray-800">
                                            {new Date(payment.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Method</span>
                                        <span className="font-medium text-gray-800 uppercase bg-gray-100 px-2 rounded">
                                            {payment.payment_method.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Created On</span>
                                        <span className="text-gray-800">
                                            {new Date(payment.created_at).toLocaleString('en-GB')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Method Specific Details Section */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                    <CreditCard size={18} className="text-gray-500" />
                                    Payment Details
                                </h3>
                                <div className="space-y-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">

                                    {payment.payment_method === 'CHEQUE' && (
                                        <>
                                            <div className="flex flex-col mb-2">
                                                <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Cheque Number</span>
                                                <span className="font-bold text-gray-800">{payment.details.cheque_number || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col mb-2">
                                                <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Bank Name</span>
                                                <span className="font-medium text-gray-800">{payment.details.cheque_bank || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Cheque Date</span>
                                                <span className="text-gray-800">
                                                    {payment.details.cheque_date ? new Date(payment.details.cheque_date).toLocaleDateString('en-GB') : 'N/A'}
                                                </span>
                                            </div>
                                            {payment.details.cheque_photo_url && (
                                                <div className="pt-3 mt-2 border-t border-gray-200">
                                                    <button
                                                        onClick={() => {
                                                            const { data } = supabase.storage
                                                                .from('cheque-photos')
                                                                .getPublicUrl(payment.details.cheque_photo_url);
                                                            window.open(data.publicUrl, '_blank');
                                                        }}
                                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-sm"
                                                    >
                                                        <Eye size={16} />
                                                        View Cheque Image
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {payment.payment_method === 'RTGS' && (
                                        <>
                                            <div className="flex flex-col mb-2">
                                                <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Transaction Ref / UTR</span>
                                                <span className="font-bold text-gray-800 font-mono">{payment.details.rtgs_transaction_id || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col mb-2">
                                                <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Bank Name</span>
                                                <span className="font-medium text-gray-800">{payment.details.rtgs_bank || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Transfer Date</span>
                                                <span className="text-gray-800">
                                                    {payment.details.rtgs_transfer_date ? new Date(payment.details.rtgs_transfer_date).toLocaleDateString('en-GB') : 'N/A'}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {payment.payment_method === 'RECEIPT' && (
                                        <>
                                            <div className="flex flex-col mb-2">
                                                <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Receipt Number</span>
                                                <span className="font-bold text-gray-800">{payment.details.receipt_number || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Issued By</span>
                                                <span className="font-medium text-gray-800">{payment.details.receipt_issued_by || 'N/A'}</span>
                                            </div>
                                            {payment.details.cheque_photo_url && (
                                                <div className="pt-3 mt-2 border-t border-gray-200">
                                                    <button
                                                        onClick={() => {
                                                            const { data } = supabase.storage
                                                                .from('cheque-photos')
                                                                .getPublicUrl(payment.details.cheque_photo_url);
                                                            window.open(data.publicUrl, '_blank');
                                                        }}
                                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
                                                    >
                                                        <Eye size={16} />
                                                        View Receipt Image
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {payment.payment_method === 'CREDIT_NOTE' && (
                                        <>
                                            <div className="flex flex-col mb-2">
                                                <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Credit Note Number</span>
                                                <span className="font-bold text-gray-800">{payment.details.credit_note_number || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Reference Invoice</span>
                                                <span className="font-medium text-gray-800">{payment.details.reference_invoice || 'N/A'}</span>
                                            </div>
                                        </>
                                    )}

                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        {payment.notes && (
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                                    <FileText size={18} className="text-gray-500" />
                                    Notes / Remarks
                                </h3>
                                <div className="bg-yellow-50 text-gray-800 p-4 rounded-lg border border-yellow-100 italic">
                                    &ldquo;{payment.notes}&rdquo;
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Delete Payment Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden transform transition-all">
                            <div className="p-6">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                                            <Trash2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Delete Payment</h3>
                                            <p className="text-xs text-gray-500">This action cannot be undone</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => !deleting && setShowDeleteConfirm(false)}
                                        disabled={deleting}
                                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <p className="text-sm text-gray-600">
                                        Are you sure you want to delete payment <strong>{payment.payment_number}</strong>? It will be permanently removed from this vendor&#39;s ledger and any linked bill balance will be updated.
                                    </p>

                                    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 space-y-1.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Payment No:</span>
                                            <span className="font-mono font-bold text-gray-900">#{payment.payment_number || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Payment Date:</span>
                                            <span className="font-mono text-gray-700">
                                                {new Date(payment.payment_date).toLocaleDateString('en-GB')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Method:</span>
                                            <span className="font-bold text-gray-800 uppercase">{payment.payment_method?.replace('_', ' ') || 'RECEIPT'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Amount:</span>
                                            <span className="font-mono font-bold text-emerald-600">
                                                ₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        {linkedBill && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 font-medium">Linked Bill:</span>
                                                <span className="font-semibold text-gray-800">#{linkedBill.bill_number}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={deleting}
                                        className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-300 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeletePayment}
                                        disabled={deleting}
                                        className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {deleting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Deleting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                <span>Delete Payment</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
