"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FileText, Calendar, DollarSign, AlertCircle, Loader2, Package, ChevronDown, ChevronUp, Download, Eye } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

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

// ============================================================================
// BILL CARD COMPONENT
// ============================================================================

function BillCard({ bill, onViewDetails }) {
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
          *,
          products (
            product_name,
            hsn_code
          )
        `)
                .eq('vendor_bill_id', bill.id);

            if (error) throw error;
            setItems(data || []);
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

                {/* View Photo Button */}
                {bill.photo_url && (
                    <div className="mt-3">
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
                    </div>
                )}
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
                                                    <span className="text-sm font-medium text-gray-800">{item.gst_percentage}%</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="text-sm font-medium text-orange-600">{item.discount || 0}%</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-sm font-bold text-green-600">
                                                        ₹{Number(item.total_amount).toFixed(2)}
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
                                        ₹{items.reduce((sum, item) => sum + Number(item.total_amount), 0).toFixed(2)}
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
    const [stats, setStats] = useState({
        total: 0,
        paid: 0,
        unpaid: 0,
        partial: 0,
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
                .select('*')
                .eq('vendor_id', vendorId)
                .order('bill_date', { ascending: false });

            if (billsError) throw billsError;
            setBills(billsData || []);

            // Calculate stats
            const billStats = {
                total: billsData.length,
                paid: billsData.filter(b => b.payment_status === 'paid').length,
                unpaid: billsData.filter(b => b.payment_status === 'unpaid').length,
                partial: billsData.filter(b => b.payment_status === 'partial').length,
                totalAmount: billsData.reduce((sum, b) => sum + Number(b.total_amount), 0)
            };
            setStats(billStats);

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
                                <p className="text-2xl font-bold text-gray-800">{stats.paid}</p>
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
                                <p className="text-2xl font-bold text-gray-800">{stats.unpaid}</p>
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
                            This vendor doesn't have any bills registered yet.
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
                            <BillCard key={bill.id} bill={bill} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
