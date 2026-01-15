"use client"

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Search as SearchIcon, FileText, Phone, Calendar, DollarSign, X, User, AlertCircle, ChevronLeft, ChevronRight, Download, Printer, MessageCircle, CheckSquare, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { sendInvoiceToWhatsApp } from '@/utils/sendWhatsApp';

// Debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// Skeleton Loader
const EstimateSkeleton = () => (
    <div className="p-4 border rounded-lg border-gray-200 animate-pulse">
        <div className="flex justify-between items-start">
            <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
        </div>
    </div>
);

const ITEMS_PER_PAGE = 10;

const EstimateSearch = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [estimates, setEstimates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedEstimates, setSelectedEstimates] = useState([]);
    const [sortBy, setSortBy] = useState('date-desc');

    const [filters, setFilters] = useState({
        paymentStatus: '',
        dateFrom: '',
        dateTo: ''
    });

    const [unpaidAmount, setUnpaidAmount] = useState(0);

    const debouncedSearch = useDebounce(searchQuery, 300);
    const debouncedCustomer = useDebounce(customerName, 300);
    const debouncedPhone = useDebounce(phoneNumber, 300);

    useEffect(() => {
        fetchEstimates();
    }, [debouncedSearch, debouncedCustomer, debouncedPhone, filters.paymentStatus, filters.dateFrom, filters.dateTo, currentPage, sortBy]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, debouncedCustomer, debouncedPhone, filters.paymentStatus, filters.dateFrom, filters.dateTo, sortBy]);

    useEffect(() => {
        fetchUnpaidAmount();
    }, []);

    const fetchEstimates = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('estimate')
                .select(`*, customer:customers(name, phone_number, address)`, { count: 'exact' });

            if (debouncedSearch) {
                query = query.ilike('estimate_number', `%${debouncedSearch}%`);
            }

            if (filters.paymentStatus === 'paid') {
                query = query.in('mode_of_payment', ['cash', 'online']);
            } else if (filters.paymentStatus === 'unpaid') {
                query = query.eq('mode_of_payment', 'unpaid');
            }

            if (filters.dateFrom) {
                query = query.gte('bill_date', filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.lte('bill_date', filters.dateTo);
            }

            // Sorting
            if (sortBy === 'date-desc') {
                query = query.order('bill_date', { ascending: false });
            } else if (sortBy === 'date-asc') {
                query = query.order('bill_date', { ascending: true });
            } else if (sortBy === 'amount-desc') {
                query = query.order('total_amount', { ascending: false });
            } else if (sortBy === 'amount-asc') {
                query = query.order('total_amount', { ascending: true });
            } else {
                query = query.order('bill_date', { ascending: false });
            }

            const from = (currentPage - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;
            if (error) throw error;

            let filtered = data || [];
            if (debouncedCustomer) {
                filtered = filtered.filter(est =>
                    est.customer?.name?.toLowerCase().includes(debouncedCustomer.toLowerCase())
                );
            }
            if (debouncedPhone) {
                filtered = filtered.filter(est =>
                    est.customer?.phone_number?.includes(debouncedPhone)
                );
            }

            if (sortBy === 'customer') {
                filtered.sort((a, b) => {
                    const nameA = a.customer?.name || '';
                    const nameB = b.customer?.name || '';
                    return nameA.localeCompare(nameB);
                });
            }

            setEstimates(filtered);
            setTotalCount(filtered.length);
        } catch (error) {
            console.error('Error fetching estimates:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnpaidAmount = async () => {
        try {
            const { data } = await supabase
                .from('estimate')
                .select('total_amount, mode_of_payment')
                .eq('mode_of_payment', 'unpaid');

            if (data) {
                const unpaid = data.reduce((sum, est) => sum + parseFloat(est.total_amount), 0);
                setUnpaidAmount(unpaid);
            }
        } catch (error) {
            console.error('Error fetching unpaid amount:', error);
        }
    };

    const clearAllFilters = () => {
        setFilters({ paymentStatus: '', dateFrom: '', dateTo: '' });
        setSearchQuery('');
        setCustomerName('');
        setPhoneNumber('');
        setSortBy('date-desc');
    };

    const toggleSelectAll = () => {
        if (selectedEstimates.length === estimates.length) {
            setSelectedEstimates([]);
        } else {
            setSelectedEstimates(estimates.map(est => est.id));
        }
    };

    const toggleSelectEstimate = (id) => {
        setSelectedEstimates(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const exportToCSV = () => {
        const selectedData = estimates.filter(est => selectedEstimates.includes(est.id));
        const dataToExport = selectedData.length > 0 ? selectedData : estimates;

        const csvContent = [
            ['Estimate Number', 'Customer Name', 'Phone', 'Date', 'Amount', 'Status'],
            ...dataToExport.map(est => [
                est.estimate_number,
                est.customer?.name || 'N/A',
                est.customer?.phone_number || '-',
                est.bill_date,
                est.total_amount,
                est.mode_of_payment
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `estimates_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const printSelected = () => {
        const selectedData = estimates.filter(est => selectedEstimates.includes(est.id));
        const dataToPrint = selectedData.length > 0 ? selectedData : estimates;

        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Estimates</title>');
        printWindow.document.write('<style>body{font-family:Arial,sans-serif}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#4CAF50;color:white}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h2>Estimates Report</h2>');
        printWindow.document.write('<table><thead><tr><th>Estimate #</th><th>Customer</th><th>Phone</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>');
        dataToPrint.forEach(est => {
            printWindow.document.write(`<tr><td>${est.estimate_number}</td><td>${est.customer?.name || 'N/A'}</td><td>${est.customer?.phone_number || '-'}</td><td>${est.bill_date}</td><td>₹${est.total_amount}</td><td>${est.mode_of_payment}</td></tr>`);
        });
        printWindow.document.write('</tbody></table></body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    const sendBulkWhatsApp = () => {
        const selectedData = estimates.filter(est => selectedEstimates.includes(est.id));
        if (selectedData.length === 0) {
            alert('Please select estimates to send');
            return;
        }

        selectedData.forEach(est => {
            if (est.customer?.phone_number) {
                setTimeout(() => {
                    sendInvoiceToWhatsApp(
                        est.customer.phone_number,
                        `Estimate link pending`,
                        est.estimate_number,
                        est.total_amount
                    );
                }, 500);
            }
        });
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    const hasFilters = searchQuery || customerName || phoneNumber || filters.paymentStatus || filters.dateFrom || filters.dateTo;

    return (
        <div className="bg-gray-50 p-4 md:p-6 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => router.push('/billing')}
                    className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">Back</span>
                </button>

                <h1 className="text-3xl font-bold text-gray-900 mb-6">Estimate Search</h1>

                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="text-red-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">₹{unpaidAmount.toLocaleString('en-IN')}</p>
                            <p className="text-sm text-gray-600">Total Unpaid Amount</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search estimate number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Customer name..."
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Phone number..."
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <select
                            value={filters.paymentStatus}
                            onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                        </select>

                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />

                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="date-desc">Date (Newest)</option>
                            <option value="date-asc">Date (Oldest)</option>
                            <option value="amount-desc">Amount (High)</option>
                            <option value="amount-asc">Amount (Low)</option>
                            <option value="customer">Customer (A-Z)</option>
                        </select>
                    </div>

                    {hasFilters && (
                        <button
                            onClick={clearAllFilters}
                            className="mt-3 text-sm text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
                        >
                            <X size={16} /> Clear All Filters
                        </button>
                    )}
                </div>

                {selectedEstimates.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                        <span className="font-semibold text-blue-800">{selectedEstimates.length} estimate(s) selected</span>
                        <div className="flex gap-2">
                            <button
                                onClick={exportToCSV}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                            >
                                <Download size={16} /> Export CSV
                            </button>
                            <button
                                onClick={printSelected}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm"
                            >
                                <Printer size={16} /> Print
                            </button>
                            <button
                                onClick={sendBulkWhatsApp}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 text-sm"
                            >
                                <MessageCircle size={16} /> WhatsApp
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleSelectAll}
                                className="p-2 hover:bg-gray-100 rounded"
                            >
                                {selectedEstimates.length === estimates.length && estimates.length > 0 ? (
                                    <CheckSquare className="text-blue-600" size={20} />
                                ) : (
                                    <Square className="text-gray-400" size={20} />
                                )}
                            </button>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <FileText className="text-blue-600" size={24} />
                                Estimates ({estimates.length})
                            </h2>
                        </div>
                        {totalPages > 0 && (
                            <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
                        )}
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, idx) => <EstimateSkeleton key={idx} />)}
                        </div>
                    ) : estimates.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="mx-auto text-gray-400 mb-3" size={48} />
                            <p className="text-gray-500">No estimates found</p>
                            {hasFilters && (
                                <button onClick={clearAllFilters} className="mt-4 text-blue-600 hover:text-blue-700 font-medium">
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {estimates.map(estimate => (
                                    <div
                                        key={estimate.id}
                                        className={`p-4 border-2 rounded-lg transition-all ${selectedEstimates.includes(estimate.id)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300 bg-white hover:shadow-lg'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSelectEstimate(estimate.id);
                                                }}
                                                className="mt-1"
                                            >
                                                {selectedEstimates.includes(estimate.id) ? (
                                                    <CheckSquare className="text-blue-600" size={20} />
                                                ) : (
                                                    <Square className="text-gray-400" size={20} />
                                                )}
                                            </button>

                                            <div
                                                className="flex-1 cursor-pointer"
                                                onClick={() => router.push(`/billing/estimate/${estimate.id}`)}
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-bold text-gray-900">{estimate.estimate_number}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estimate.mode_of_payment === 'cash' || estimate.mode_of_payment === 'online'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {estimate.mode_of_payment.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <User size={16} className="text-blue-500" />
                                                        <span className="font-medium">{estimate.customer?.name || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Phone size={16} className="text-purple-500" />
                                                        <span>{estimate.customer?.phone_number || '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Calendar size={16} className="text-orange-500" />
                                                        <span>{estimate.bill_date}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 font-semibold text-blue-600">
                                                        <DollarSign size={16} />
                                                        <span>₹{parseFloat(estimate.total_amount).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {estimate.customer?.phone_number && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        sendInvoiceToWhatsApp(
                                                            estimate.customer.phone_number,
                                                            'PDF link pending',
                                                            estimate.estimate_number,
                                                            estimate.total_amount
                                                        );
                                                    }}
                                                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 text-sm"
                                                >
                                                    <MessageCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>

                                    {getPageNumbers().map((page, idx) => (
                                        page === '...' ? (
                                            <span key={`e-${idx}`} className="px-2 text-gray-500">...</span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() => goToPage(page)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium ${currentPage === page
                                                        ? 'bg-blue-600 text-white'
                                                        : 'border hover:bg-gray-100'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    ))}

                                    <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EstimateSearch;