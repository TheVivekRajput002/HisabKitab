"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, Plus, Edit2, Trash2, FileText, Calendar, DollarSign, AlertCircle, Loader2, ScanLine } from 'lucide-react';
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
        info: 'bg-blue-100 text-blue-800'
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>{children}</span>;
}

// ============================================================================
// VENDOR CARD COMPONENT
// ============================================================================

function VendorCard({ vendor, onEdit, onDelete, onViewBills }) {
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
                total: bills.length,
                unpaid: bills.filter(b => b.payment_status === 'unpaid').length,
                totalAmount: bills.reduce((sum, b) => sum + Number(b.total_amount), 0)
            };

            setBillStats(stats);
        } catch (error) {
            console.error('Error fetching bill stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">{vendor.name}</h3>
                        {vendor.gstin && (
                            <p className="text-sm text-gray-500 font-mono">GSTIN: {vendor.gstin}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(vendor)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Vendor"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => onDelete(vendor.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Vendor"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            {loading ? (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="animate-spin text-gray-400" size={20} />
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <FileText className="mx-auto mb-1 text-blue-600" size={20} />
                        <p className="text-2xl font-bold text-blue-900">{billStats.total}</p>
                        <p className="text-xs text-blue-600">Total Bills</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                        <AlertCircle className="mx-auto mb-1 text-yellow-600" size={20} />
                        <p className="text-2xl font-bold text-yellow-900">{billStats.unpaid}</p>
                        <p className="text-xs text-yellow-600">Unpaid</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                        <DollarSign className="mx-auto mb-1 text-green-600" size={20} />
                        <p className="text-lg font-bold text-green-900">₹{billStats.totalAmount.toFixed(0)}</p>
                        <p className="text-xs text-green-600">Total Amount</p>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t">
                <p className="text-xs text-gray-500">
                    <Calendar size={12} className="inline mr-1" />
                    Added: {new Date(vendor.created_at).toLocaleDateString()}
                </p>
                <button
                    onClick={() => onViewBills(vendor)}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                    View Bills
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// VENDOR FORM MODAL
// ============================================================================

function VendorFormModal({ vendor, onClose, onSave }) {
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
                        gstin: formData.gstin || null
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
    const [vendors, setVendors] = useState([]);
    const [filteredVendors, setFilteredVendors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);

    useEffect(() => {
        fetchVendors();
    }, []);

    useEffect(() => {
        filterVendors();
    }, [searchQuery, vendors]);

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('vendors')
                .select('*')
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
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 justify-center"
                        >
                            <ScanLine size={20} />
                            Register Vendor Bill
                        </button>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center"
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

                {/* Vendors Grid */}
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
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                            >
                                <Plus size={20} />
                                Add Your First Vendor
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVendors.map((vendor) => (
                            <VendorCard
                                key={vendor.id}
                                vendor={vendor}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onViewBills={handleViewBills}
                            />
                        ))}
                    </div>
                )}

                {/* Form Modal */}
                {showForm && (
                    <VendorFormModal
                        vendor={editingVendor}
                        onClose={handleFormClose}
                        onSave={handleFormSave}
                    />
                )}
            </div>
        </div>
    );
}
