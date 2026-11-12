"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, CheckCircle, Search, Edit2, AlertCircle, Loader2, CreditCard, Building, Building2, Ticket, DollarSign, FileText, ChevronRight, Trash2, X } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { toast } from '@/components/ToastProvider';

function Badge({ children, variant = 'default', className = '' }) {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        PENDING: 'bg-yellow-100 text-yellow-800',
        CLEARED: 'bg-green-100 text-green-800',
        FAILED: 'bg-red-100 text-red-800'
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.default} ${className}`}>{children}</span>;
}

const MethodIcon = ({ method, size = 16, className = "" }) => {
    switch (method) {
        case 'CHEQUE': return <FileText size={size} className={className} />;
        case 'RTGS': return <Building size={size} className={className} />;
        case 'RECEIPT': return <DollarSign size={size} className={className} />;
        case 'CREDIT_NOTE': return <Ticket size={size} className={className} />;
        default: return <CreditCard size={size} className={className} />;
    }
}

export default function VendorPaymentsPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const vendorId = params.vendorId || params.id;
    const billId = searchParams.get('billId');

    const [loading, setLoading] = useState(true);
    const [vendor, setVendor] = useState(null);
    const [bill, setBill] = useState(null);
    const [payments, setPayments] = useState([]);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ total: 0, amount: 0 });
    const [paymentToDelete, setPaymentToDelete] = useState(null);
    const [deletingPaymentId, setDeletingPaymentId] = useState(null);

    useEffect(() => {
        if (vendorId) {
            fetchVendorAndPayments();
        }
    }, [vendorId, billId]);

    const fetchVendorAndPayments = async () => {
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

            // Fetch bill info if billId is present
            if (billId) {
                const { data: billData } = await supabase
                    .from('vendor_bills')
                    .select('id, bill_number, total_amount, payment_status')
                    .eq('id', billId)
                    .single();
                if (billData) setBill(billData);
            }

            // Fetch Payments — filtered by bill if billId present
            let query = supabase
                .from('payments')
                .select(`
                    id, 
                    payment_number, 
                    amount, 
                    remaining_amount,
                    payment_method, 
                    payment_date, 
                    status,
                    created_at,
                    vendor_bill_id,
                    payment_details (*),
                    vendor_bills (bill_number)
                `)
                .eq('customer_id', vendorId)
                .order('created_at', { ascending: false });

            if (billId) {
                query = query.eq('vendor_bill_id', billId);
            }

            const { data: paymentsData, error: paymentsError } = await query;

            if (paymentsError) throw paymentsError;
            setPayments(paymentsData || []);

            setStats({
                total: paymentsData?.length || 0,
                amount: paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePayment = async (paymentId, paymentNumber) => {
        if (!paymentId) return;
        setDeletingPaymentId(paymentId);
        try {
            // 1. Fetch details to delete photo if exists
            const { data: detailsData } = await supabase
                .from('payment_details')
                .select('id, cheque_photo_url')
                .eq('payment_id', paymentId);

            if (detailsData && detailsData.length > 0) {
                for (const d of detailsData) {
                    if (d.cheque_photo_url) {
                        try {
                            await supabase.storage
                                .from('cheque-photos')
                                .remove([d.cheque_photo_url]);
                        } catch (storageErr) {
                            console.warn('Could not remove photo from storage:', storageErr);
                        }
                    }
                }
            }

            // 2. Fetch payment row to check linked vendor_bill_id
            const { data: paymentRow } = await supabase
                .from('payments')
                .select('vendor_bill_id')
                .eq('id', paymentId)
                .single();

            // 3. Delete from payment_details first
            const { error: detailsErr } = await supabase
                .from('payment_details')
                .delete()
                .eq('payment_id', paymentId);

            if (detailsErr) throw detailsErr;

            // 4. Delete payment from payments table
            const { error: payErr } = await supabase
                .from('payments')
                .delete()
                .eq('id', paymentId);

            if (payErr) throw payErr;

            // 5. Update bill status if settled
            if (paymentRow?.vendor_bill_id) {
                const { data: remainingPayments } = await supabase
                    .from('payments')
                    .select('amount')
                    .eq('vendor_bill_id', paymentRow.vendor_bill_id);

                const { data: billRow } = await supabase
                    .from('vendor_bills')
                    .select('id, total_amount')
                    .eq('id', paymentRow.vendor_bill_id)
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
                        .eq('id', paymentRow.vendor_bill_id);
                }
            }

            toast.success(`Payment #${paymentNumber || ''} deleted successfully`);
            setPaymentToDelete(null);
            await fetchVendorAndPayments();
        } catch (err) {
            console.error('Error deleting payment:', err);
            toast.error(`Failed to delete payment: ${err.message || 'Unknown error'}`);
        } finally {
            setDeletingPaymentId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    if (error || !vendor) {
        return (
            <div className="min-h-screen bg-gray-100 p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error || 'Vendor not found'}
                    </div>
                    <button
                        onClick={() => router.push('/vendor')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        Back to Vendors
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <button
                        onClick={() => router.push(billId ? `/vendor/${vendorId}/bills` : '/vendor')}
                        className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                    >
                        <ArrowLeft size={18} />
                        {billId ? 'Back to Bills' : 'Back to Vendors'}
                    </button>
                    <button
                        onClick={() => router.push(`/vendor/${vendorId}/pay${billId ? `?billId=${billId}` : ''}`)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm font-medium"
                    >
                        <CreditCard size={18} />
                        New Payment
                    </button>
                </div>

                {/* Header Profile */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex flex-wrap items-center justify-between gap-4 border-b-4 border-blue-600">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                            <Building2 className="text-blue-600" size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{vendor.name}</h1>
                            <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                <span>Vendors /</span>
                                {bill ? (
                                    <>
                                        <span className="font-medium text-blue-600">Bill #{bill.bill_number}</span>
                                        <span>/</span>
                                        <span className="font-medium text-blue-600">Payments</span>
                                    </>
                                ) : (
                                    <span className="font-medium text-blue-600">All Payments</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        {bill && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center min-w-[120px]">
                                <p className="text-xs text-blue-700 mb-1">Bill Amount</p>
                                <p className="text-xl font-bold text-blue-700">₹{Number(bill.total_amount).toLocaleString('en-IN')}</p>
                            </div>
                        )}
                        <div className="bg-gray-50 p-3 rounded-lg border text-center min-w-[120px]">
                            <p className="text-xs text-gray-500 mb-1">Total Payments</p>
                            <p className="text-xl font-bold text-gray-800">{stats.total}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center min-w-[120px]">
                            <p className="text-xs text-green-700 mb-1">Total Amount Paid</p>
                            <p className="text-xl font-bold text-green-700">₹{stats.amount.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>

                {/* Payments Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-5 border-b flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Transaction History</h2>
                    </div>

                    {payments.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <CreditCard size={48} className="mx-auto mb-3 opacity-20" />
                            <p className="text-lg font-medium text-gray-700">No payments found</p>
                            <p className="text-sm mt-1">Record a payment to see it here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 border-b text-sm">
                                        <th className="p-4 font-semibold">Payment No.</th>
                                        <th className="p-4 font-semibold">Bill</th>
                                        <th className="p-4 font-semibold">Date</th>
                                        <th className="p-4 font-semibold">Method</th>
                                        <th className="p-4 font-semibold">Amount</th>
                                        <th className="p-4 font-semibold">Remaining</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map(payment => (
                                        <tr key={payment.id} className="border-b hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-blue-600">{payment.payment_number}</div>
                                            </td>
                                            <td className="p-4">
                                                {payment.vendor_bills?.bill_number ? (
                                                    <span className="text-sm font-medium text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                                                        #{payment.vendor_bills.bill_number}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="opacity-50" />
                                                    {new Date(payment.payment_date).toLocaleDateString('en-GB')}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <MethodIcon method={payment.payment_method} className="text-gray-400" />
                                                    <span className="text-sm font-medium">{payment.payment_method.replace('_', ' ')}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 font-bold text-gray-800">
                                                ₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4">
                                                {payment.remaining_amount > 0 ? (
                                                    <span className="text-sm font-semibold text-orange-600">
                                                        ₹{Number(payment.remaining_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-green-600 font-medium">Fully Paid</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={payment.status}>{payment.status}</Badge>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => router.push(`/vendor/${vendorId}/payments/${payment.id}`)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block cursor-pointer"
                                                        title="View Details"
                                                    >
                                                        <ChevronRight size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => setPaymentToDelete(payment)}
                                                        disabled={deletingPaymentId === payment.id}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block cursor-pointer disabled:opacity-50"
                                                        title="Delete Payment"
                                                    >
                                                        {deletingPaymentId === payment.id ? (
                                                            <Loader2 size={18} className="animate-spin text-red-500" />
                                                        ) : (
                                                            <Trash2 size={18} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Delete Payment Confirmation Modal */}
                {paymentToDelete && (
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
                                        onClick={() => !deletingPaymentId && setPaymentToDelete(null)}
                                        disabled={deletingPaymentId !== null}
                                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <p className="text-sm text-gray-600">
                                        Are you sure you want to delete this payment voucher? It will be permanently removed from this vendor&#39;s records and any linked bill balance will be updated.
                                    </p>

                                    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 space-y-1.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Payment No:</span>
                                            <span className="font-mono font-bold text-gray-900">#{paymentToDelete.payment_number || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Payment Date:</span>
                                            <span className="font-mono text-gray-700">
                                                {new Date(paymentToDelete.payment_date).toLocaleDateString('en-GB')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Method:</span>
                                            <span className="font-bold text-gray-800 uppercase">{paymentToDelete.payment_method?.replace('_', ' ') || 'RECEIPT'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Amount:</span>
                                            <span className="font-mono font-bold text-emerald-600">
                                                ₹{Number(paymentToDelete.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        {paymentToDelete.status && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 font-medium">Status:</span>
                                                <span className="uppercase font-bold tracking-wider text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                                                    {paymentToDelete.status}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentToDelete(null)}
                                        disabled={deletingPaymentId !== null}
                                        className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-300 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeletePayment(paymentToDelete.id, paymentToDelete.payment_number)}
                                        disabled={deletingPaymentId !== null}
                                        className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {deletingPaymentId === paymentToDelete.id ? (
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
