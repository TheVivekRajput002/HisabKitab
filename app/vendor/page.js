"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Building2,
    Plus,
    Edit2,
    Trash2,
    FileText,
    Calendar,
    DollarSign,
    AlertCircle,
    Loader2,
    ScanLine,
    CreditCard,
    Filter,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ArrowDownAZ,
    ArrowUpZA,
    X
} from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { useCompany } from '@/hooks/useCompany';
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

// ============================================================================
// VENDOR TABLE ROW COMPONENT
// ============================================================================

function VendorTableRow({ index, vendor, stats, loading, onEdit, onDelete, onViewBills, onViewPayments, onViewLedger }) {
    const billStats = stats || { total: 0, unpaid: 0, totalAmount: 0 };

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
                {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString('en-GB') : '-'}
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

            toast.success(vendor ? 'Vendor updated successfully' : 'Vendor created successfully');
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

const ALPHABETS = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '#'];

export default function VendorPage() {
    const router = useRouter();
    const { companyId } = useCompany();
    const [vendors, setVendors] = useState([]);
    const [vendorStats, setVendorStats] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLetter, setSelectedLetter] = useState('ALL');
    const [sortBy, setSortBy] = useState('name-asc');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);

    useEffect(() => {
        if (companyId) fetchVendors();
    }, [companyId]);

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('vendors')
                .select('*')
                .eq('company_id', companyId)
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;

            const vendorList = data || [];
            setVendors(vendorList);

            // Fetch bill stats in bulk for sorting & summary
            if (vendorList.length > 0) {
                const vendorIds = vendorList.map(v => v.id);
                const { data: bills, error: billsErr } = await supabase
                    .from('vendor_bills')
                    .select('vendor_id, payment_status, total_amount')
                    .in('vendor_id', vendorIds);

                if (!billsErr && bills) {
                    const stats = {};
                    bills.forEach(b => {
                        if (!stats[b.vendor_id]) {
                            stats[b.vendor_id] = { total: 0, unpaid: 0, totalAmount: 0 };
                        }
                        stats[b.vendor_id].total += 1;
                        if (b.payment_status === 'unpaid') {
                            stats[b.vendor_id].unpaid += 1;
                        }
                        stats[b.vendor_id].totalAmount += Number(b.total_amount || 0);
                    });
                    setVendorStats(stats);
                }
            } else {
                setVendorStats({});
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Calculate letter distribution counts for quick navigation
    const letterCounts = useMemo(() => {
        const counts = {};
        vendors.forEach(v => {
            const firstChar = (v.name || '').trim().charAt(0).toUpperCase();
            if (/^[A-Z]$/.test(firstChar)) {
                counts[firstChar] = (counts[firstChar] || 0) + 1;
            } else if (firstChar) {
                counts['#'] = (counts['#'] || 0) + 1;
            }
        });
        return counts;
    }, [vendors]);

    // Filter and sort vendors (alphabetical A to Z by default)
    const filteredVendors = useMemo(() => {
        let result = [...vendors];

        // 1. Text search (Name or GSTIN)
        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            result = result.filter(v =>
                (v.name && v.name.toLowerCase().includes(query)) ||
                (v.gstin && v.gstin.toLowerCase().includes(query))
            );
        }

        // 2. Alphabet filter
        if (selectedLetter !== 'ALL') {
            if (selectedLetter === '#') {
                result = result.filter(v => {
                    const firstChar = (v.name || '').trim().charAt(0).toUpperCase();
                    return firstChar && !/^[A-Z]$/.test(firstChar);
                });
            } else {
                result = result.filter(v =>
                    (v.name || '').trim().toUpperCase().startsWith(selectedLetter)
                );
            }
        }

        // 3. Sorting (A to Z by default)
        result.sort((a, b) => {
            switch (sortBy) {
                case 'name-desc':
                    return (b.name || '').localeCompare(a.name || '', undefined, { sensitivity: 'base' });
                case 'date-desc':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'date-asc':
                    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                case 'bills-desc':
                    return (vendorStats[b.id]?.total || 0) - (vendorStats[a.id]?.total || 0);
                case 'bills-asc':
                    return (vendorStats[a.id]?.total || 0) - (vendorStats[b.id]?.total || 0);
                case 'unpaid-desc':
                    return (vendorStats[b.id]?.unpaid || 0) - (vendorStats[a.id]?.unpaid || 0);
                case 'unpaid-asc':
                    return (vendorStats[a.id]?.unpaid || 0) - (vendorStats[b.id]?.unpaid || 0);
                case 'amount-desc':
                    return (vendorStats[b.id]?.totalAmount || 0) - (vendorStats[a.id]?.totalAmount || 0);
                case 'amount-asc':
                    return (vendorStats[a.id]?.totalAmount || 0) - (vendorStats[b.id]?.totalAmount || 0);
                case 'name-asc':
                default:
                    return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
            }
        });

        return result;
    }, [vendors, vendorStats, searchQuery, selectedLetter, sortBy]);

    // Column header sort toggle handler
    const handleSort = (field) => {
        if (field === 'name') {
            setSortBy(prev => prev === 'name-asc' ? 'name-desc' : 'name-asc');
        } else if (field === 'date') {
            setSortBy(prev => prev === 'date-desc' ? 'date-asc' : 'date-desc');
        } else if (field === 'bills') {
            setSortBy(prev => prev === 'bills-desc' ? 'bills-asc' : 'bills-desc');
        } else if (field === 'unpaid') {
            setSortBy(prev => prev === 'unpaid-desc' ? 'unpaid-asc' : 'unpaid-desc');
        } else if (field === 'amount') {
            setSortBy(prev => prev === 'amount-desc' ? 'amount-asc' : 'amount-desc');
        }
    };

    const clearAllFilters = () => {
        setSearchQuery('');
        setSelectedLetter('ALL');
        setSortBy('name-asc');
    };

    const hasActiveFilters = searchQuery.trim() !== '' || selectedLetter !== 'ALL' || sortBy !== 'name-asc';

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
            toast.success('Vendor deleted successfully');
        } catch (err) {
            toast.error(`Error deleting vendor: ${err.message}`);
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
                    <p className="text-gray-600">Manage your vendors, sort alphabetically, and track their bills</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert variant="error" className="mb-4">
                        <AlertCircle className="inline mr-2" size={16} />
                        {error}
                    </Alert>
                )}

                {/* Search & Actions Bar */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search vendors by name or GSTIN..."
                                className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    title="Clear search"
                                >
                                    <X size={18} />
                                </button>
                            )}
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

                {/* Alphabetical Filter Strip (A-Z) */}
                <div className="bg-white rounded-lg shadow-md p-3 mb-6 border border-gray-200">
                    <div className="flex items-center justify-between gap-2 mb-2 px-1">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600">
                            <ArrowDownAZ size={16} className="text-blue-600" />
                            <span>Alphabetical Filter:</span>
                        </div>
                        {selectedLetter !== 'ALL' && (
                            <button
                                onClick={() => {
                                    setSelectedLetter('ALL');
                                    setSortBy('name-asc');
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                                <span>Reset to All (A → Z)</span>
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                        {ALPHABETS.map((letter) => {
                            const count = letter === 'ALL' ? vendors.length : (letterCounts[letter] || 0);
                            const isSelected = selectedLetter === letter;
                            const hasVendors = count > 0;

                            return (
                                <button
                                    key={letter}
                                    onClick={() => {
                                        setSelectedLetter(letter);
                                        setSortBy('name-asc');
                                    }}
                                    disabled={letter !== 'ALL' && !hasVendors}
                                    className={`px-2.5 py-1 text-xs rounded-md transition-all font-medium flex items-center gap-1 cursor-pointer ${
                                        isSelected
                                            ? 'bg-blue-600 text-white font-bold shadow-sm'
                                            : hasVendors
                                            ? 'bg-gray-100 text-gray-800 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
                                            : 'bg-gray-50 text-gray-300 border border-transparent cursor-not-allowed opacity-40'
                                    }`}
                                    title={letter === 'ALL' ? `All Vendors (A → Z by default) (${vendors.length})` : `${letter}: ${count} vendor(s)`}
                                >
                                    <span>{letter === 'ALL' ? 'ALL (A → Z)' : letter}</span>
                                    {hasVendors && letter !== 'ALL' && (
                                        <span className={`text-[10px] px-1 py-0.2 rounded-full ${
                                            isSelected ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'
                                        }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Filter Tags */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 items-center pt-2.5 mt-2.5 border-t border-gray-100">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Filter size={13} />
                                Active Filters:
                            </span>

                            {searchQuery && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Search: "{searchQuery}"
                                    <button onClick={() => setSearchQuery('')} className="hover:bg-blue-200 rounded-full p-0.5 cursor-pointer">
                                        <X size={12} />
                                    </button>
                                </span>
                            )}

                            {selectedLetter !== 'ALL' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    Letter: {selectedLetter}
                                    <button
                                        onClick={() => {
                                            setSelectedLetter('ALL');
                                            setSortBy('name-asc');
                                        }}
                                        className="hover:bg-indigo-200 rounded-full p-0.5 cursor-pointer"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            )}

                            {sortBy !== 'name-asc' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                    Sort: {
                                        sortBy === 'name-desc' ? 'Name (Z to A)' :
                                        sortBy === 'date-desc' ? 'Newest Added' :
                                        sortBy === 'date-asc' ? 'Oldest Added' :
                                        sortBy === 'amount-desc' ? 'Total Amount (High to Low)' :
                                        sortBy === 'amount-asc' ? 'Total Amount (Low to High)' :
                                        sortBy === 'unpaid-desc' ? 'Unpaid Bills (High to Low)' :
                                        sortBy === 'bills-desc' ? 'Total Bills (High to Low)' : sortBy
                                    }
                                    <button onClick={() => setSortBy('name-asc')} className="hover:bg-amber-200 rounded-full p-0.5 cursor-pointer">
                                        <X size={12} />
                                    </button>
                                </span>
                            )}

                            <button
                                onClick={clearAllFilters}
                                className="text-xs text-red-600 hover:text-red-800 font-semibold underline ml-1 cursor-pointer"
                            >
                                Clear All
                            </button>
                        </div>
                    )}
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
                                <ArrowDownAZ className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">
                                    {selectedLetter === 'ALL' ? 'A → Z' : `Letter ${selectedLetter}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {selectedLetter === 'ALL' ? 'Alphabetical (Default)' : 'Letter Filter'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vendors Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow-md">
                        <Loader2 className="animate-spin text-blue-600" size={48} />
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <Building2 size={64} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            {hasActiveFilters ? 'No vendors match your filters' : 'No vendors yet'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {hasActiveFilters
                                ? 'Try adjusting your search query, alphabet letter, or filter settings'
                                : 'Get started by adding your first vendor'}
                        </p>
                        {hasActiveFilters ? (
                            <button
                                onClick={clearAllFilters}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 cursor-pointer"
                            >
                                <X size={18} />
                                Clear All Filters
                            </button>
                        ) : (
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
                                    <tr className="bg-gray-800 text-white text-xs sm:text-sm font-semibold uppercase tracking-wider select-none">
                                        <th className="py-3.5 px-4 text-center w-12">#</th>
                                        <th
                                            onClick={() => handleSort('name')}
                                            className="py-3.5 px-4 cursor-pointer hover:bg-gray-700 transition-colors group"
                                            title="Click to sort by Vendor Name (A-Z / Z-A)"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span>Vendor Details</span>
                                                {sortBy === 'name-asc' ? (
                                                    <ArrowUp size={14} className="text-blue-400" />
                                                ) : sortBy === 'name-desc' ? (
                                                    <ArrowDown size={14} className="text-blue-400" />
                                                ) : (
                                                    <ArrowUpDown size={14} className="text-gray-400 opacity-60 group-hover:opacity-100" />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('bills')}
                                            className="py-3.5 px-4 text-center cursor-pointer hover:bg-gray-700 transition-colors group"
                                            title="Click to sort by Total Bills"
                                        >
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span>Total Bills</span>
                                                {sortBy === 'bills-desc' ? (
                                                    <ArrowDown size={14} className="text-blue-400" />
                                                ) : sortBy === 'bills-asc' ? (
                                                    <ArrowUp size={14} className="text-blue-400" />
                                                ) : (
                                                    <ArrowUpDown size={14} className="text-gray-400 opacity-60 group-hover:opacity-100" />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('unpaid')}
                                            className="py-3.5 px-4 text-center cursor-pointer hover:bg-gray-700 transition-colors group"
                                            title="Click to sort by Unpaid Bills"
                                        >
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span>Unpaid</span>
                                                {sortBy === 'unpaid-desc' ? (
                                                    <ArrowDown size={14} className="text-blue-400" />
                                                ) : sortBy === 'unpaid-asc' ? (
                                                    <ArrowUp size={14} className="text-blue-400" />
                                                ) : (
                                                    <ArrowUpDown size={14} className="text-gray-400 opacity-60 group-hover:opacity-100" />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('amount')}
                                            className="py-3.5 px-4 text-right cursor-pointer hover:bg-gray-700 transition-colors group"
                                            title="Click to sort by Total Amount"
                                        >
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span>Total Amount</span>
                                                {sortBy === 'amount-desc' ? (
                                                    <ArrowDown size={14} className="text-blue-400" />
                                                ) : sortBy === 'amount-asc' ? (
                                                    <ArrowUp size={14} className="text-blue-400" />
                                                ) : (
                                                    <ArrowUpDown size={14} className="text-gray-400 opacity-60 group-hover:opacity-100" />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('date')}
                                            className="py-3.5 px-4 text-center cursor-pointer hover:bg-gray-700 transition-colors group"
                                            title="Click to sort by Added Date"
                                        >
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span>Added Date</span>
                                                {sortBy === 'date-desc' ? (
                                                    <ArrowDown size={14} className="text-blue-400" />
                                                ) : sortBy === 'date-asc' ? (
                                                    <ArrowUp size={14} className="text-blue-400" />
                                                ) : (
                                                    <ArrowUpDown size={14} className="text-gray-400 opacity-60 group-hover:opacity-100" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="py-3.5 px-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-sm">
                                    {filteredVendors.map((vendor, index) => (
                                        <VendorTableRow
                                            key={vendor.id}
                                            index={index}
                                            vendor={vendor}
                                            stats={vendorStats[vendor.id]}
                                            loading={loading}
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
