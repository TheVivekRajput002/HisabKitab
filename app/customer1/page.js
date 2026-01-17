"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import {
    Search as SearchIcon, User, Phone, AlertCircle, Car, X, Filter,
    DollarSign, TrendingUp, TrendingDown, MapPin, FileText, Calendar,
    CheckCircle, XCircle, Package, Clock, Edit2, Trash2, UserPlus
} from 'lucide-react';

const Customer1Page = () => {
    const router = useRouter();
    // Customer Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [customerStats, setCustomerStats] = useState({});
    const [activeFilters, setActiveFilters] = useState({
        name: '',
        phoneNumber: '',
        vehicle: '',
        sortBy: 'recent',
    });

    // Customer Details State
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [analytics, setAnalytics] = useState({
        totalPurchases: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        totalInvoices: 0,
        lastPurchaseDate: null,
        memberSince: null,
        daysSinceMember: 0
    });

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        phone_number: '',
        vehicle: '',
        address: ''
    });

    // Add Customer State
    const [isAdding, setIsAdding] = useState(false);
    const [addForm, setAddForm] = useState({
        name: '',
        phone_number: '',
        vehicle: '',
        address: ''
    });

    // Toast Notification State
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    // Load customer list on mount
    useEffect(() => {
        fetchInitialData();
    }, []);

    // Apply filters when search/filter changes
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, activeFilters, customers]);

    // Load customer details when selected
    useEffect(() => {
        if (selectedCustomerId) {
            fetchCustomerDetails(selectedCustomerId);
        }
    }, [selectedCustomerId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const { data: customersData } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false });

            setCustomers(customersData || []);

            if (customersData && customersData.length > 0) {
                const { data: invoicesData } = await supabase
                    .from('invoices')
                    .select('customer_id, total_amount, mode_of_payment');

                if (invoicesData) {
                    const stats = {};
                    invoicesData.forEach(inv => {
                        if (!stats[inv.customer_id]) {
                            stats[inv.customer_id] = { total: 0, unpaid: 0 };
                        }
                        stats[inv.customer_id].total += parseFloat(inv.total_amount);
                        if (inv.mode_of_payment === 'unpaid') {
                            stats[inv.customer_id].unpaid += parseFloat(inv.total_amount);
                        }
                    });
                    setCustomerStats(stats);
                }

                // Auto-select first customer
                if (customersData[0]) {
                    setSelectedCustomerId(customersData[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerDetails = async (customerId) => {
        try {
            const { data: customerData } = await supabase
                .from('customers')
                .select('*')
                .eq('id', customerId)
                .single();

            setSelectedCustomer(customerData);

            const { data: invoicesData } = await supabase
                .from('invoices')
                .select('*')
                .eq('customer_id', customerId)
                .order('bill_date', { ascending: false });

            setInvoices(invoicesData || []);

            if (invoicesData && invoicesData.length > 0) {
                const totalPurchases = invoicesData.reduce((sum, inv) =>
                    sum + parseFloat(inv.total_amount), 0
                );

                const totalPaid = invoicesData
                    .filter(inv => inv.mode_of_payment === 'cash' || inv.mode_of_payment === 'online')
                    .reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);

                const totalUnpaid = invoicesData
                    .filter(inv => inv.mode_of_payment === 'unpaid')
                    .reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);

                const lastPurchase = invoicesData[0]?.bill_date;
                const memberSince = customerData.created_at;
                const daysSince = Math.floor(
                    (new Date() - new Date(memberSince)) / (1000 * 60 * 60 * 24)
                );

                setAnalytics({
                    totalPurchases,
                    totalPaid,
                    totalUnpaid,
                    totalInvoices: invoicesData.length,
                    lastPurchaseDate: lastPurchase,
                    memberSince: new Date(memberSince).toLocaleDateString('en-IN'),
                    daysSinceMember: daysSince
                });
            }
        } catch (error) {
            console.error('Error fetching customer details:', error);
        }
    };

    const applyFilters = () => {
        let filtered = [...customers];

        if (searchQuery.trim()) {
            filtered = filtered.filter(customer =>
                customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.phone_number.includes(searchQuery)
            );
        }

        if (activeFilters.name.trim()) {
            filtered = filtered.filter(customer =>
                customer.name.toLowerCase().includes(activeFilters.name.toLowerCase())
            );
        }

        if (activeFilters.phoneNumber.trim()) {
            filtered = filtered.filter(customer =>
                customer.phone_number.includes(activeFilters.phoneNumber)
            );
        }

        if (activeFilters.vehicle.trim()) {
            filtered = filtered.filter(customer =>
                customer.vehicle?.toLowerCase().includes(activeFilters.vehicle.toLowerCase())
            );
        }

        switch (activeFilters.sortBy) {
            case 'unpaid-asc':
                filtered.sort((a, b) => {
                    const aUnpaid = customerStats[a.id]?.unpaid || 0;
                    const bUnpaid = customerStats[b.id]?.unpaid || 0;
                    return aUnpaid - bUnpaid;
                });
                break;
            case 'unpaid-desc':
                filtered.sort((a, b) => {
                    const aUnpaid = customerStats[a.id]?.unpaid || 0;
                    const bUnpaid = customerStats[b.id]?.unpaid || 0;
                    return bUnpaid - aUnpaid;
                });
                break;
            case 'name-asc':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                filtered.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'recent':
            default:
                filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
        }

        setFilteredCustomers(filtered);
    };

    const updateFilter = (key, value) => {
        setActiveFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearAllFilters = () => {
        setActiveFilters({
            name: '',
            phoneNumber: '',
            vehicle: '',
            sortBy: 'recent'
        });
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'} text-white`}>
                    {toast.type === 'success' && <CheckCircle size={20} />}
                    {toast.type === 'error' && <XCircle size={20} />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* LEFT PANEL - Customer Search */}
            <div className="w-[320px] bg-white border-r border-gray-200 flex flex-col">
                {/* Search Header */}
                <div className="p-4 border-b border-gray-200">
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setAddForm({ name: '', phone_number: '', vehicle: '', address: '' });
                        }}
                        className="w-full mb-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold"
                    >
                        <UserPlus size={18} />
                        Add Customer
                    </button>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search Party Name"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                    </div>
                </div>

                {/* Filter Section */}
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                    <div className="space-y-2">
                        {/* Phone Filter */}
                        <div>
                            <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 mb-1">
                                <Phone size={12} />
                                Phone Number
                            </label>
                            <input
                                type="text"
                                placeholder="Filter by phone"
                                value={activeFilters.phoneNumber}
                                onChange={(e) => updateFilter('phoneNumber', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        {/* Vehicle Filter */}
                        <div>
                            <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 mb-1">
                                <Car size={12} />
                                Vehicle
                            </label>
                            <input
                                type="text"
                                placeholder="Filter by vehicle"
                                value={activeFilters.vehicle}
                                onChange={(e) => updateFilter('vehicle', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 mb-1">
                                <Filter size={12} />
                                Sort By
                            </label>
                            <select
                                value={activeFilters.sortBy}
                                onChange={(e) => updateFilter('sortBy', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="recent">Recent</option>
                                <option value="unpaid-desc">Unpaid: High to Low</option>
                                <option value="unpaid-asc">Unpaid: Low to High</option>
                                <option value="name-asc">Name: A to Z</option>
                                <option value="name-desc">Name: Z to A</option>
                            </select>
                        </div>

                        {/* Clear Filters Button */}
                        {(activeFilters.phoneNumber || activeFilters.vehicle || activeFilters.sortBy !== 'recent') && (
                            <button
                                onClick={clearAllFilters}
                                className="w-full text-xs text-red-600 hover:text-red-800 font-semibold py-1"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Customer List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredCustomers.map(customer => {
                                const stats = customerStats[customer.id] || { total: 0, unpaid: 0 };
                                const isSelected = selectedCustomerId === customer.id;

                                return (
                                    <div
                                        key={customer.id}
                                        onClick={() => setSelectedCustomerId(customer.id)}
                                        className={`p-3 cursor-pointer transition-colors ${isSelected
                                            ? 'bg-blue-50 border-l-4 border-blue-500'
                                            : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-sm text-gray-900">
                                                    {customer.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                    <Phone size={10} />
                                                    {customer.phone_number}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-semibold ${stats.unpaid > 0 ? 'text-green-600' : 'text-gray-400'
                                            }`}>
                                            {stats.unpaid > 0
                                                ? `₹ ${stats.unpaid.toFixed(2)}`
                                                : '₹ 0.00'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            {/* RIGHT PANEL - Customer Details */}
            <div className="flex-1 overflow-y-auto">
                {selectedCustomer ? (
                    <div className="p-6">
                        {/* Customer Header */}
                        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {selectedCustomer.name}
                                    </h1>
                                    <button
                                        onClick={() => {
                                            setIsEditing(true);
                                            setEditForm({
                                                name: selectedCustomer.name,
                                                phone_number: selectedCustomer.phone_number,
                                                vehicle: selectedCustomer.vehicle || '',
                                                address: selectedCustomer.address || ''
                                            });
                                        }}
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                </div>
                                <div className="flex gap-3">
                                    <button className="p-2 bg-yellow-50 rounded-lg hover:bg-yellow-100">
                                        <AlertCircle className="text-yellow-600" size={20} />
                                    </button>
                                    <a
                                        href={`tel:${selectedCustomer.phone_number}`}
                                        className="p-2 bg-green-50 rounded-lg hover:bg-green-100"
                                    >
                                        <Phone className="text-green-600" size={20} />
                                    </a>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm(`Are you sure you want to delete ${selectedCustomer.name}? This will also delete all their invoices. This action cannot be undone.`)) {
                                                try {
                                                    const { error } = await supabase
                                                        .from('customers')
                                                        .delete()
                                                        .eq('id', selectedCustomer.id);

                                                    if (error) throw error;

                                                    alert('Customer deleted successfully!');
                                                    // Refresh the customer list and clear selection
                                                    fetchInitialData();
                                                    setSelectedCustomer(null);
                                                    setSelectedCustomerId(null);
                                                } catch (error) {
                                                    console.error('Error deleting customer:', error);
                                                    alert('Failed to delete customer');
                                                }
                                            }
                                        }}
                                        className="p-2 bg-red-50 rounded-lg hover:bg-red-100"
                                    >
                                        <Trash2 className="text-red-600" size={20} />
                                    </button>
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="mt-3 space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-gray-600 block mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-600 block mb-1">Phone Number</label>
                                            <input
                                                type="text"
                                                value={editForm.phone_number}
                                                onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-gray-600 block mb-1">Vehicle</label>
                                            <input
                                                type="text"
                                                value={editForm.vehicle}
                                                onChange={(e) => setEditForm({ ...editForm, vehicle: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-600 block mb-1">Address</label>
                                            <input
                                                type="text"
                                                value={editForm.address}
                                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const { error } = await supabase
                                                        .from('customers')
                                                        .update({
                                                            name: editForm.name,
                                                            phone_number: editForm.phone_number,
                                                            vehicle: editForm.vehicle,
                                                            address: editForm.address
                                                        })
                                                        .eq('id', selectedCustomer.id);

                                                    if (error) throw error;

                                                    alert('Customer updated successfully!');
                                                    setIsEditing(false);
                                                    fetchCustomerDetails(selectedCustomer.id);
                                                    fetchInitialData();
                                                } catch (error) {
                                                    console.error('Error updating customer:', error);
                                                    alert('Failed to update customer');
                                                }
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-3 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Phone Number</p>
                                        <p className="font-semibold flex items-center gap-1">
                                            <Phone size={14} />
                                            {selectedCustomer.phone_number}
                                        </p>
                                    </div>
                                    {selectedCustomer.vehicle && (
                                        <div>
                                            <p className="text-sm text-gray-600">Vehicle</p>
                                            <p className="font-semibold flex items-center gap-1">
                                                <Car size={14} />
                                                {selectedCustomer.vehicle}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-4 my-4">
                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                                <div className="flex items-center justify-between mb-2">
                                    <Package className="text-purple-600" size={24} />
                                    <TrendingUp className="text-purple-400" size={18} />
                                </div>
                                <h3 className="text-xs text-purple-700 mb-1">Total Purchases</h3>
                                <p className="text-2xl font-bold text-purple-900">₹{analytics.totalPurchases.toLocaleString()}</p>
                                <p className="text-xs text-purple-600 mt-1">{analytics.totalInvoices} invoices</p>
                            </div>

                            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                <div className="flex items-center justify-between mb-2">
                                    <CheckCircle className="text-green-600" size={24} />
                                    <DollarSign className="text-green-400" size={18} />
                                </div>
                                <h3 className="text-xs text-green-700 mb-1">Total Paid</h3>
                                <p className="text-2xl font-bold text-green-900">₹{analytics.totalPaid.toLocaleString()}</p>
                                <p className="text-xs text-green-600 mt-1">
                                    {((analytics.totalPaid / analytics.totalPurchases) * 100 || 0).toFixed(1)}% of total
                                </p>
                            </div>

                            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                                <div className="flex items-center justify-between mb-2">
                                    <XCircle className="text-red-600" size={24} />
                                    <AlertCircle className="text-red-400" size={18} />
                                </div>
                                <h3 className="text-xs text-red-700 mb-1">Total Unpaid</h3>
                                <p className="text-2xl font-bold text-red-900">₹{analytics.totalUnpaid.toLocaleString()}</p>
                                <p className="text-xs text-red-600 mt-1">
                                    {((analytics.totalUnpaid / analytics.totalPurchases) * 100 || 0).toFixed(1)}% pending
                                </p>
                            </div>
                        </div>

                        {/* Transactions Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900">Transactions</h2>
                                    <div className="flex gap-2">
                                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                                            <SearchIcon size={18} className="text-gray-600" />
                                        </button>
                                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                                            <FileText size={18} className="text-gray-600" />
                                        </button>
                                        <button className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                            XLS
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Table Header */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                                #
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    Invoice Number
                                                    <Filter size={12} className="text-gray-400" />
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    Date
                                                    <Filter size={12} className="text-gray-400" />
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                                                <div className="flex items-center justify-end gap-1">
                                                    Total
                                                    <Filter size={12} className="text-gray-400" />
                                                </div>
                                            </th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {invoices.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                                    No transactions found
                                                </td>
                                            </tr>
                                        ) : (
                                            invoices.map((invoice, index) => (
                                                <tr
                                                    key={invoice.id}
                                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                    onClick={() => router.push(`/billing/invoice/${invoice.id}`)}
                                                >
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                                                        {invoice.invoice_number || invoice.id}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{invoice.bill_date}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {invoice.mode_of_payment === 'unpaid' ? (
                                                            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                                                                UNPAID
                                                            </span>
                                                        ) : (
                                                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                                PAID
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-semibold">
                                                        ₹ {parseFloat(invoice.total_amount).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            className="text-gray-400 hover:text-gray-600"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <span className="text-lg">⋮</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>


                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Select a customer to view details</p>
                    </div>
                )}
            </div>

            {/* Add Customer Modal */}
            {isAdding && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New Customer</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={addForm.name}
                                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Phone Number *</label>
                                <input
                                    type="text"
                                    value={addForm.phone_number}
                                    onChange={(e) => setAddForm({ ...addForm, phone_number: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Vehicle</label>
                                <input
                                    type="text"
                                    value={addForm.vehicle}
                                    onChange={(e) => setAddForm({ ...addForm, vehicle: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Address</label>
                                <input
                                    type="text"
                                    value={addForm.address}
                                    onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-4">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!addForm.name || !addForm.phone_number) {
                                        showToast('Name and phone number are required', 'error');
                                        return;
                                    }
                                    try {
                                        const { data, error } = await supabase
                                            .from('customers')
                                            .insert([{
                                                name: addForm.name,
                                                phone_number: addForm.phone_number,
                                                vehicle: addForm.vehicle,
                                                address: addForm.address
                                            }])
                                            .select();

                                        if (error) throw error;

                                        showToast('Customer added successfully!', 'success');
                                        setIsAdding(false);
                                        fetchInitialData();
                                        if (data && data[0]) {
                                            setSelectedCustomerId(data[0].id);
                                        }
                                    } catch (error) {
                                        console.error('Error adding customer:', error);
                                        showToast('Failed to add customer', 'error');
                                    }
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Add Customer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customer1Page;
