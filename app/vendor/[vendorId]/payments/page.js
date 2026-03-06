"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, CheckCircle, Search, Edit2, AlertCircle, Loader2, CreditCard, Building, Building2, Ticket, DollarSign, FileText, ChevronRight } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

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
                                                <button
                                                    onClick={() => router.push(`/vendor/${vendorId}/payments/${payment.id}`)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                                                    title="View Details"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
