"use client"

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Search as SearchIcon, User, Phone, AlertCircle, FileText, Car, X, Filter, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CustomerSearch = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [activeFilters, setActiveFilters] = useState({
        name: '',
        phoneNumber: '',
        vehicle: '',
        sortBy: 'recent', // 'recent', 'unpaid-asc', 'unpaid-desc', 'name-asc', 'name-desc'
    });

    // Customer stats for sorting
    const [customerStats, setCustomerStats] = useState({});

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, activeFilters, customers]);

    const fetchInitialData = async () => {
        setLoading(true);

        try {
            // Fetch customers
            const { data: customersData } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false });

            setCustomers(customersData || []);

            // Fetch invoices for all customers to calculate unpaid amounts
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
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...customers];

        // Main search query (searches across all fields)
        if (searchQuery.trim()) {
            filtered = filtered.filter(customer =>
                customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.phone_number.includes(searchQuery) ||
                customer.vehicle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.address?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Name filter
        if (activeFilters.name.trim()) {
            filtered = filtered.filter(customer =>
                customer.name.toLowerCase().includes(activeFilters.name.toLowerCase())
            );
        }

        // Phone number filter
        if (activeFilters.phoneNumber.trim()) {
            filtered = filtered.filter(customer =>
                customer.phone_number.includes(activeFilters.phoneNumber)
            );
        }

        // Vehicle filter
        if (activeFilters.vehicle.trim()) {
            filtered = filtered.filter(customer =>
                customer.vehicle?.toLowerCase().includes(activeFilters.vehicle.toLowerCase())
            );
        }

        // Sorting
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

    const getActiveFilterTags = () => {
        const tags = [];

        if (activeFilters.name) {
            tags.push({
                key: 'name',
                label: `Name: ${activeFilters.name}`,
                color: 'bg-blue-100 text-blue-800'
            });
        }

        if (activeFilters.phoneNumber) {
            tags.push({
                key: 'phoneNumber',
                label: `Phone: ${activeFilters.phoneNumber}`,
                color: 'bg-green-100 text-green-800'
            });
        }

        if (activeFilters.vehicle) {
            tags.push({
                key: 'vehicle',
                label: `Vehicle: ${activeFilters.vehicle}`,
                color: 'bg-purple-100 text-purple-800'
            });
        }

        if (activeFilters.sortBy !== 'recent') {
            const sortLabels = {
                'unpaid-asc': 'Sort: Unpaid (Low to High)',
                'unpaid-desc': 'Sort: Unpaid (High to Low)',
                'name-asc': 'Sort: Name (A to Z)',
                'name-desc': 'Sort: Name (Z to A)'
            };
            tags.push({
                key: 'sortBy',
                label: sortLabels[activeFilters.sortBy],
                color: 'bg-orange-100 text-orange-800'
            });
        }

        return tags;
    };

    const activeTags = getActiveFilterTags();

    return (

        <div className="bg-gray-50 p-4 md:p-6 min-h-screen">
            {/* Back Button */}
            {/* Back Button */}
            <button
                onClick={() => router.push('/customer')}
                className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
                <span className="font-medium">Back</span>
            </button>
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Customer Search</h1>

                {/* Search Bar and Filters */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    {/* Main Search */}
                    <div className="relative mb-4">
                        <SearchIcon className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, phone, vehicle, or address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        />
                    </div>

                    {/* Filter Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Name Filter */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <User size={16} />
                                Customer Name
                            </label>
                            <input
                                type="text"
                                placeholder="Filter by name"
                                value={activeFilters.name}
                                onChange={(e) => updateFilter('name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Phone Number Filter */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Phone size={16} />
                                Phone Number
                            </label>
                            <input
                                type="text"
                                placeholder="Filter by phone"
                                value={activeFilters.phoneNumber}
                                onChange={(e) => updateFilter('phoneNumber', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Vehicle Filter */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Car size={16} />
                                Vehicle
                            </label>
                            <input
                                type="text"
                                placeholder="Filter by vehicle"
                                value={activeFilters.vehicle}
                                onChange={(e) => updateFilter('vehicle', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Filter size={16} />
                                Sort By
                            </label>
                            <select
                                value={activeFilters.sortBy}
                                onChange={(e) => updateFilter('sortBy', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="recent">Recent (Default)</option>
                                <option value="unpaid-desc">Unpaid: High to Low</option>
                                <option value="unpaid-asc">Unpaid: Low to High</option>
                                <option value="name-asc">Name: A to Z</option>
                                <option value="name-desc">Name: Z to A</option>
                            </select>
                        </div>
                    </div>

                    {/* Active Filter Tags */}
                    {activeTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center pt-4 border-t border-gray-200">
                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                <Filter size={16} />
                                Active Filters:
                            </span>
                            {activeTags.map(tag => (
                                <span
                                    key={tag.key}
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${tag.color}`}
                                >
                                    {tag.label}
                                    <button
                                        onClick={() => updateFilter(tag.key, tag.key === 'sortBy' ? 'recent' : '')}
                                        className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                            <button
                                onClick={clearAllFilters}
                                className="text-xs text-red-600 hover:text-red-800 font-semibold underline"
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>

                {/* Customer List */}
                {loading ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 text-lg">Loading customers...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <User className="text-blue-600" size={24} />
                                Customers ({filteredCustomers.length})
                            </h2>
                            {activeFilters.sortBy.startsWith('unpaid') && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    {activeFilters.sortBy === 'unpaid-desc' ? (
                                        <>
                                            <TrendingDown className="text-red-600" size={18} />
                                            <span>Sorted by unpaid: High to Low</span>
                                        </>
                                    ) : (
                                        <>
                                            <TrendingUp className="text-green-600" size={18} />
                                            <span>Sorted by unpaid: Low to High</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="space-y-3 max-h-[700px] overflow-y-auto">
                            {filteredCustomers.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No customers found</p>
                            ) : (
                                filteredCustomers.map(customer => {
                                    const stats = customerStats[customer.id] || { total: 0, unpaid: 0 };
                                    const hasUnpaid = stats.unpaid > 0;

                                    return (
                                        <div
                                            key={customer.id}
                                            className={`p-4 border-2 rounded-lg hover:shadow-md transition-all ${hasUnpaid
                                                ? 'border-red-200 bg-red-50 hover:border-red-400'
                                                : 'border-gray-200 hover:border-blue-500'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div
                                                    onClick={() => router.push(`/customer/${customer.id}`)}
                                                    className="flex-1 cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-bold text-lg text-gray-900">{customer.name}</h3>
                                                        {hasUnpaid && (
                                                            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                                                <AlertCircle size={12} />
                                                                UNPAID
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <Phone size={14} />
                                                            {customer.phone_number}
                                                        </span>
                                                        {customer.vehicle && (
                                                            <span className="flex items-center gap-1">
                                                                <Car size={14} />
                                                                {customer.vehicle}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {customer.address && (
                                                        <p className="text-sm text-gray-500 mt-1">{customer.address}</p>
                                                    )}

                                                    {/* Customer Stats */}
                                                    {stats.total > 0 && (
                                                        <div className="mt-3 flex items-center gap-4 text-sm">
                                                            <span className="text-gray-700">
                                                                Total: <span className="font-bold">₹{stats.total.toLocaleString()}</span>
                                                            </span>
                                                            {hasUnpaid && (
                                                                <span className="text-red-600 font-semibold flex items-center gap-1">
                                                                    <DollarSign size={14} />
                                                                    Unpaid: ₹{stats.unpaid.toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerSearch;