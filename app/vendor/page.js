"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, Plus, Edit2, Trash2, FileText, Calendar, DollarSign, AlertCircle, Loader2, ScanLine, CreditCard } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { useCompany } from '@/hooks/useCompany';

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

// ============================================================================
// VENDOR TABLE ROW COMPONENT
// ============================================================================

function VendorTableRow({ index, vendor, onEdit, onDelete, onViewBills, onViewPayments, onViewLedger }) {
    const [billStats, setBillStats] = useState({ total: 0, unpaid: 0, totalAmount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBillStats();
    }, [vendor.id]);

    const fetchBillStats = async () => {
        try {
            const { data: bills, error } = await supabase
                .from('vendor_bills')
                .select('payment_status, total_amount')
                .eq('vendor_id', vendor.id);

            if (error) throw error;

            const stats = {
                total: bills?.length || 0,
                unpaid: bills?.filter(b => b.payment_status === 'unpaid').length || 0,
                totalAmount: bills?.reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0
            };

            setBillStats(stats);
        } catch (error) {
            console.error('Error fetching bill stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <tr className="hover:bg-blue-50/50 transition-colors">
            <td className="py-3.5 px-4 text-center text-gray-500 font-medium">{index + 1}</td>
            <td className="py-3.5 px-4 cursor-pointer group" onClick={() => onViewLedger(vendor)}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 shrink-0 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Building2 size={18} />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                            {vendor.name}
                        </p>
                        {vendor.gstin ? (
                            <p className="text-xs text-gray-500 font-mono">GSTIN: {vendor.gstin}</p>
                        ) : (
                            <p className="text-xs text-gray-400">No GSTIN</p>
                        )}
                    </div>
                </div>
            </td>
            <td className="py-3.5 px-4 text-center">
                {loading ? (
                    <Loader2 className="animate-spin text-gray-400 mx-auto" size={16} />
                ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        {billStats.total} bills
                    </span>
                )}
            </td>
            <td className="py-3.5 px-4 text-center">
                {loading ? (
                    <Loader2 className="animate-spin text-gray-400 mx-auto" size={16} />
                ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        billStats.unpaid > 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                        {billStats.unpaid} unpaid
                    </span>
                )}
            </td>
            <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                {loading ? (
                    <Loader2 className="animate-spin text-gray-400 ml-auto" size={16} />
                ) : (
                    `₹${billStats.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                )}
            </td>
            <td className="py-3.5 px-4 text-center text-xs text-gray-500">
                {new Date(vendor.created_at).toLocaleDateString('en-GB')}
            </td>
            <td className="py-3.5 px-4 text-center">
                <div className="flex items-center justify-center gap-1.5">
                    <button
                        onClick={() => onViewLedger(vendor)}
                        className="px-2.5 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                        title="View Vendor Statement Ledger"
                    >
                        <FileText size={13} />
                        <span>Ledger</span>
                    </button>
                    <button
                        onClick={() => onViewPayments(vendor)}
                        className="px-2.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 border border-green-200 cursor-pointer"
                        title="View Payments"
                    >
                        <CreditCard size={13} />
                        <span className="max-sm:hidden">Payments</span>
                    </button>
                    <button
                        onClick={() => onViewBills(vendor)}
                        className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 border border-blue-200 cursor-pointer"
                        title="View Bills"
                    >
                        <FileText size={13} />
                        <span className="max-sm:hidden">Bills</span>
                    </button>
                    <button
                        onClick={() => onEdit(vendor)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Vendor"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(vendor.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Vendor"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ============================================================================
// VENDOR FORM MODAL
// ============================================================================

function VendorFormModal({ vendor, onClose, onSave, companyId }) {
    const [formData, setFormData] = useState({
        name: vendor?.name || '',
        gstin: vendor?.gstin || ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Vendor name is required');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            if (vendor) {
                // Update existing vendor
                const { error: updateError } = await supabase
                    .from('vendors')
                    .update({
                        name: formData.name,
                        gstin: formData.gstin || null
                    })
                    .eq('id', vendor.id);

                if (updateError) throw updateError;
            } else {
                // Create new vendor
                const { error: insertError } = await supabase
                    .from('vendors')
                    .insert({
                        name: formData.name,
                        gstin: formData.gstin || null,
                        company_id: companyId
                    });

                if (insertError) throw insertError;
            }

            onSave();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {vendor ? 'Edit Vendor' : 'Add New Vendor'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <Alert variant="error">
                            <AlertCircle className="inline mr-2" size={16} />
                            {error}
                        </Alert>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vendor Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter vendor name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            GSTIN (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.gstin}
                            onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter GSTIN"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Saving...
                                </>
                            ) : (
                                vendor ? 'Update' : 'Create'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN VENDOR PAGE
// ============================================================================

export default function VendorPage() {
    const router = useRouter();
    const { companyId } = useCompany();
    const [vendors, setVendors] = useState([]);
    const [filteredVendors, setFilteredVendors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);

    useEffect(() => {
        if (companyId) fetchVendors();
    }, [companyId]);

    useEffect(() => {
        filterVendors();
    }, [searchQuery, vendors]);

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('vendors')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setVendors(data || []);
            setFilteredVendors(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filterVendors = () => {
        if (!searchQuery.trim()) {
            setFilteredVendors(vendors);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = vendors.filter(
            (v) =>
                v.name.toLowerCase().includes(query) ||
                (v.gstin && v.gstin.toLowerCase().includes(query))
        );
        setFilteredVendors(filtered);
    };

    const handleEdit = (vendor) => {
        setEditingVendor(vendor);
        setShowForm(true);
    };

    const handleDelete = async (vendorId) => {
        if (!confirm('Are you sure you want to delete this vendor? This will also delete all associated bills and bill items.')) {
            return;
        }

        try {
            const { error: deleteError } = await supabase
                .from('vendors')
                .delete()
                .eq('id', vendorId);

            if (deleteError) throw deleteError;

            await fetchVendors();
        } catch (err) {
            alert(`Error deleting vendor: ${err.message}`);
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingVendor(null);
    };

    const handleFormSave = async () => {
        await fetchVendors();
        handleFormClose();
    };

    const handleViewBills = (vendor) => {
        router.push(`/vendor/${vendor.id}/bills`);
    };

    const handleViewPayments = (vendor) => {
        router.push(`/vendor/${vendor.id}/payments`);
    };

    const handleViewLedger = (vendor) => {
        router.push(`/vendor/${vendor.id}`);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Vendor Management</h1>
                    <p className="text-gray-600">Manage your vendors and track their bills</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert variant="error" className="mb-4">
                        <AlertCircle className="inline mr-2" size={16} />
                        {error}
                    </Alert>
                )}

                {/* Search and Add */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search vendors by name or GSTIN..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <button
                            onClick={() => router.push('/vendor/scanner')}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 justify-center cursor-pointer"
                        >
                            <ScanLine size={20} />
                            Register Vendor Bill
                        </button>
                        <button
                            onClick={() => router.push('/vendor/pay')}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 justify-center cursor-pointer"
                        >
                            <CreditCard size={20} />
                            Pay to Vendor
                        </button>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center cursor-pointer"
                        >
                            <Plus size={20} />
                            Add Vendor
                        </button>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Building2 className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{vendors.length}</p>
                                <p className="text-sm text-gray-600">Total Vendors</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <FileText className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{filteredVendors.length}</p>
                                <p className="text-sm text-gray-600">Showing Results</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <Search className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{searchQuery ? 'Active' : 'None'}</p>
                                <p className="text-sm text-gray-600">Search Filter</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vendors Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-blue-600" size={48} />
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <Building2 size={64} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            {searchQuery ? 'No vendors found' : 'No vendors yet'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : 'Get started by adding your first vendor'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 cursor-pointer"
                            >
                                <Plus size={20} />
                                Add Your First Vendor
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[850px]">
                                <thead>
                                    <tr className="bg-gray-800 text-white text-xs sm:text-sm font-semibold uppercase tracking-wider">
                                        <th className="py-3.5 px-4 text-center w-12">#</th>
                                        <th className="py-3.5 px-4">Vendor Details</th>
                                        <th className="py-3.5 px-4 text-center">Total Bills</th>
                                        <th className="py-3.5 px-4 text-center">Unpaid</th>
                                        <th className="py-3.5 px-4 text-right">Total Amount</th>
                                        <th className="py-3.5 px-4 text-center">Added Date</th>
                                        <th className="py-3.5 px-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-sm">
                                    {filteredVendors.map((vendor, index) => (
                                        <VendorTableRow
                                            key={vendor.id}
                                            index={index}
                                            vendor={vendor}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onViewBills={handleViewBills}
                                            onViewPayments={handleViewPayments}
                                            onViewLedger={handleViewLedger}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Form Modal */}
                {showForm && (
                    <VendorFormModal
                        vendor={editingVendor}
                        onClose={handleFormClose}
                        onSave={handleFormSave}
                        companyId={companyId}
                    />
                )}
            </div>
        </div>
    );
}
