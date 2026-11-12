"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FileText, Calendar, DollarSign, AlertCircle, Loader2, Package, ChevronDown, ChevronUp, Download, Eye, CreditCard, Trash2, X } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { toast } from '@/components/ToastProvider';

// ============================================================================
// UI COMPONENTS
// ============================================================================

function Alert({ children, variant = 'info', className = '' }) {
    const variants = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        success: 'bg-green-50 border-green-200 text-green-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        error: 'bg-red-50 border-red-200 text-red-800'
    };
    return <div className={`border rounded-lg p-4 ${variants[variant]} ${className}`}>{children}</div>;
}

function Badge({ children, variant = 'default', className = '' }) {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
        paid: 'bg-green-100 text-green-800',
        unpaid: 'bg-red-100 text-red-800',
        partial: 'bg-yellow-100 text-yellow-800'
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>{children}</span>;
}

// Always recalculate from live fields: qty × rate × (1 - discount%) × (1 + gst%)
const getBillItemTotal = (item) => {
    const quantity = Number(item.quantity) || 0;
    const rate = Number(item.purchase_rate) || 0;
    const discount = Number(item.discount) || 0;
    const gst = Number(item.gst_percentage) || 0;

    if (quantity > 0 && rate >= 0) {
        const base = quantity * rate;
        const afterDiscount = base * (1 - discount / 100);
        return afterDiscount * (1 + gst / 100);
    }

    return 0;
};

const toNumber = (value) => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    if (value === null || value === undefined) {
        return 0;
    }
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
};

// ============================================================================
// BILL CARD COMPONENT
// ============================================================================

function BillCard({ bill, onViewDetails, onDelete, deletingId }) {
    const params = useParams();
    const router = useRouter();
    const vendorId = params.vendorId || params.id;
    const [expanded, setExpanded] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchBillItems = async () => {
        if (items.length > 0) return; // Already fetched

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('vendor_bill_items')
                .select(`
                    id,
                    vendor_bill_id,
                    product_id,
                    quantity,
                    purchase_rate,
                    gst_percentage,
                    discount,
                    total_amount,
                    products (
                        product_name,
                        hsn_code
                    )
                `)
                .eq('vendor_bill_id', bill.id);

            if (error) throw error;
            setItems((data || []).map((item) => ({
                ...item,
                quantity: toNumber(item.quantity),
                purchase_rate: toNumber(item.purchase_rate),
                gst_percentage: toNumber(item.gst_percentage),
                discount: toNumber(item.discount),
                total_amount: toNumber(item.total_amount)
            })));
        } catch (error) {
            console.error('Error fetching bill items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        if (!expanded) {
            fetchBillItems();
        }
        setExpanded(!expanded);
    };

    const getPaymentStatusVariant = (status) => {
        switch (status) {
            case 'paid': return 'paid';
            case 'unpaid': return 'unpaid';
            case 'partial': return 'partial';
            default: return 'default';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Bill Header */}
            <div className="p-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                            Bill #{bill.bill_number}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={14} />
                            <span>{new Date(bill.bill_date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}</span>
                        </div>
                    </div>
                    <Badge variant={getPaymentStatusVariant(bill.payment_status)}>
                        {bill.payment_status.toUpperCase()}
                    </Badge>
                </div>

                {/* Remaining amount for partial payments */}
                {bill.payment_status === 'partial' && bill.payments?.length > 0 && (() => {
                    const totalPaid = bill.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                    const remaining = Number(bill.total_amount) - totalPaid;
                    return remaining > 0 ? (
                        <div className="mt-2 flex items-center justify-between text-sm bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={14} className="text-yellow-600" />
                                <span className="text-yellow-800">
                                    Paid: <strong>₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                                </span>
                            </div>
                            <span className="text-orange-700 font-bold">
                                Remaining: ₹{remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    ) : null;
                })()}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-green-600">
                            ₹{Number(bill.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    {bill.notes && (
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Notes</p>
                            <p className="text-sm text-gray-700">{bill.notes}</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {bill.photo_url && (
                        <button
                            onClick={() => {
                                const { data } = supabase.storage
                                    .from('vendor-photos')
                                    .getPublicUrl(bill.photo_url);
                                window.open(data.publicUrl, '_blank');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-sm"
                        >
                            <Eye size={16} />
                            View Invoice Photo
                        </button>
                    )}

                    {bill.payment_status !== 'paid' && (
                        <button
                            onClick={() => router.push(`/vendor/${vendorId}/pay?billId=${bill.id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                        >
                            <CreditCard size={16} />
                            {bill.payment_status === 'partial' ? 'Pay Remaining' : 'Pay Now'}
                        </button>
                    )}

                    {bill.payments?.length > 0 && (
                        <button
                            onClick={() => router.push(`/vendor/${vendorId}/payments?billId=${bill.id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                        >
                            <Eye size={16} />
                            View Payment{bill.payments.length > 1 ? 's' : ''}
                        </button>
                    )}

                    {onDelete && (
                        <button
                            onClick={() => onDelete(bill)}
                            disabled={deletingId === bill.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg transition-colors text-sm font-medium shadow-sm ml-auto cursor-pointer disabled:opacity-50"
                        >
                            {deletingId === bill.id ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Trash2 size={16} />
                            )}
                            Delete Bill
                        </button>
                    )}
                </div>
            </div>

            {/* Bill Items Toggle */}
            <div className="p-4 bg-gray-50">
                <button
                    onClick={handleToggle}
                    className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <Package size={16} />
                        View Items ({items.length || '...'})
                    </span>
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>

            {/* Bill Items List */}
            {expanded && (
                <div className="p-4 border-t">
                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="animate-spin text-gray-400" size={24} />
                        </div>
                    ) : items.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No items found</p>
                    ) : (
                        <div className="space-y-3">
                            {/* Items Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-800 text-white">
                                            <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Product Name</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">HSN Code</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold">Quantity</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold">Rate</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold">GST %</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold">Discount</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-medium text-gray-800">
                                                        {item.products?.product_name || 'Unknown Product'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-gray-600 font-mono">
                                                        {item.products?.hsn_code || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="text-sm font-medium text-gray-800">{item.quantity}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-sm font-medium text-gray-800">
                                                        ₹{Number(item.purchase_rate).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="text-sm font-medium text-blue-700">{item.gst_percentage}%</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="text-sm font-medium text-orange-600">{item.discount || 0}%</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-sm font-bold text-green-600">
                                                        ₹{getBillItemTotal(item).toFixed(2)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Items Summary */}
                            <div className="bg-blue-50 rounded-lg p-3 mt-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-700">Total Items:</span>
                                    <span className="font-bold text-blue-900">{items.length}</span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="font-semibold text-gray-700">Grand Total:</span>
                                    <span className="font-bold text-green-600">
                                        ₹{items.reduce((sum, item) => sum + getBillItemTotal(item), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// MAIN VENDOR BILLS PAGE
// ============================================================================

export default function VendorBillsPage() {
    const router = useRouter();
    const params = useParams();
    const vendorId = params.vendorId;

    const [vendor, setVendor] = useState(null);
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingBillId, setDeletingBillId] = useState(null);
    const [billToDelete, setBillToDelete] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        totalAmount: 0
    });

    useEffect(() => {
        if (vendorId) {
            fetchVendorAndBills();
        }
    }, [vendorId]);

    const fetchVendorAndBills = async () => {
        try {
            setLoading(true);

            // Fetch vendor details
            const { data: vendorData, error: vendorError } = await supabase
                .from('vendors')
                .select('*')
                .eq('id', vendorId)
                .single();

            if (vendorError) throw vendorError;
            setVendor(vendorData);

            // Fetch bills
            const { data: billsData, error: billsError } = await supabase
                .from('vendor_bills')
                .select('*, payments(id, amount, remaining_amount)')
                .eq('vendor_id', vendorId)
                .order('bill_date', { ascending: false });

            if (billsError) throw billsError;
            const billRows = billsData || [];
            setBills(billRows);

            // Fetch vendor-level payments (this app stores vendor ref in payments.customer_id)
            const { data: paymentsData, error: paymentsError } = await supabase
                .from('payments')
                .select('amount')
                .eq('customer_id', vendorId);

            if (paymentsError) throw paymentsError;
            const paymentRows = paymentsData || [];

            // Calculate stats
            const totalAmount = billRows.reduce((sum, bill) => {
                return sum + toNumber(bill.total_amount);
            }, 0);

            // Paid amount must come directly from payment ledger for this vendor.
            const paidAmount = paymentRows.reduce((sum, payment) => {
                return sum + toNumber(payment.amount);
            }, 0);

            const billStats = {
                total: billRows.length,
                paidAmount,
                unpaidAmount: Math.max(totalAmount - paidAmount, 0),
                totalAmount
            };
            setStats(billStats);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBill = async (billId, billNumber) => {
        if (!billId) return;
        setDeletingBillId(billId);
        try {
            // 1. Unlink any payments referencing this vendor bill
            const { error: unlinkError } = await supabase
                .from('payments')
                .update({ vendor_bill_id: null })
                .eq('vendor_bill_id', billId);

            if (unlinkError) {
                console.warn('Could not unlink payments from vendor bill:', unlinkError);
            }

            // 2. Fetch bill to check if invoice photo exists in Supabase storage
            const { data: billData } = await supabase
                .from('vendor_bills')
                .select('photo_url')
                .eq('id', billId)
                .single();

            if (billData?.photo_url) {
                try {
                    await supabase.storage
                        .from('vendor-photos')
                        .remove([billData.photo_url]);
                } catch (storageErr) {
                    console.warn('Could not remove photo from storage:', storageErr);
                }
            }

            // 3. Delete vendor bill items first
            const { error: itemsError } = await supabase
                .from('vendor_bill_items')
                .delete()
                .eq('vendor_bill_id', billId);

            if (itemsError) throw itemsError;

            // 4. Delete the vendor bill
            const { error: billError } = await supabase
                .from('vendor_bills')
                .delete()
                .eq('id', billId);

            if (billError) throw billError;

            toast.success(`Bill #${billNumber || ''} deleted successfully`);
            setBillToDelete(null);
            await fetchVendorAndBills();
        } catch (err) {
            console.error('Error deleting bill:', err);
            toast.error(`Failed to delete bill: ${err.message || 'Unknown error'}`);
        } finally {
            setDeletingBillId(null);
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
                    <Alert variant="error">
                        <AlertCircle className="inline mr-2" size={16} />
                        {error || 'Vendor not found'}
                    </Alert>
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
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/vendor')}
                        className="mb-4 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                    >
                        <ArrowLeft size={18} />
                        Back to Vendors
                    </button>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">{vendor.name}</h1>
                                {vendor.gstin && (
                                    <p className="text-gray-600 font-mono">GSTIN: {vendor.gstin}</p>
                                )}
                            </div>
                            <Badge variant="info">
                                {bills.length} Bill{bills.length !== 1 ? 's' : ''}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <FileText className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                                <p className="text-sm text-gray-600">Total Bills</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <DollarSign className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-800">
                                    ₹{stats.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-sm text-gray-600">Paid</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-800">
                                    ₹{stats.unpaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-sm text-gray-600">Unpaid</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <DollarSign className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-800">
                                    ₹{stats.totalAmount.toLocaleString('en-IN')}
                                </p>
                                <p className="text-sm text-gray-600">Total Amount</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bills List */}
                {bills.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <FileText size={64} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No bills yet</h3>
                        <p className="text-gray-600 mb-4">
                            This vendor does not have any bills registered yet.
                        </p>
                        <button
                            onClick={() => router.push('/vendor/scanner')}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                        >
                            <FileText size={20} />
                            Register First Bill
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Bills History</h2>
                        {bills.map((bill) => (
                            <BillCard 
                                key={bill.id} 
                                bill={bill} 
                                onDelete={(b) => setBillToDelete(b)}
                                deletingId={deletingBillId}
                            />
                        ))}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {billToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden transform transition-all">
                            <div className="p-6">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                                            <Trash2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Delete Vendor Bill</h3>
                                            <p className="text-xs text-gray-500">This action cannot be undone</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => !deletingBillId && setBillToDelete(null)}
                                        disabled={deletingBillId !== null}
                                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <p className="text-sm text-gray-600">
                                        Are you sure you want to delete this bill? It will be permanently removed from this vendor&#39;s records and all associated line items will be deleted.
                                    </p>

                                    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 space-y-1.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Bill Number:</span>
                                            <span className="font-mono font-bold text-gray-900">#{billToDelete.bill_number || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Bill Date:</span>
                                            <span className="font-mono text-gray-700">
                                                {new Date(billToDelete.bill_date).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Total Amount:</span>
                                            <span className="font-mono font-bold text-red-600">
                                                ₹{Number(billToDelete.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        {billToDelete.payment_status && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 font-medium">Payment Status:</span>
                                                <span className="uppercase font-bold tracking-wider text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                                                    {billToDelete.payment_status}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setBillToDelete(null)}
                                        disabled={deletingBillId !== null}
                                        className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-300 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteBill(billToDelete.id, billToDelete.bill_number)}
                                        disabled={deletingBillId !== null}
                                        className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {deletingBillId === billToDelete.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Deleting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                <span>Delete Bill</span>
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
