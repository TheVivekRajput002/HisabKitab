"use client"

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Search as SearchIcon, FileText, Phone, AlertCircle, Calendar, DollarSign, X, Tag, User, CreditCard, TrendingUp, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';

const InvoiceSearch = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);

  // Active filters
  const [activeFilters, setActiveFilters] = useState({
    paymentStatus: null, // 'paid', 'unpaid', or null
    customerName: '',
    phoneNumber: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    paymentMethod: null // 'cash', 'online', or null
  });

  // Statistics
  const [stats, setStats] = useState({
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    count: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeFilters, invoices]);

  const fetchInitialData = async () => {
    setLoading(true);

    const { data: invoicesData } = await supabase
      .from('invoices')
      .select(`
                *,
                customer:customers(name, phone_number, address)
            `)
      .order('bill_date', { ascending: false })
      .limit(100);

    setInvoices(invoicesData || []);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    // Text search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(inv =>
        inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customer?.phone_number?.includes(searchQuery) ||
        inv.bill_date.includes(searchQuery)
      );
    }

    // Payment status filter
    if (activeFilters.paymentStatus === 'paid') {
      filtered = filtered.filter(inv =>
        inv.mode_of_payment === 'cash' || inv.mode_of_payment === 'online'
      );
    } else if (activeFilters.paymentStatus === 'unpaid') {
      filtered = filtered.filter(inv => inv.mode_of_payment === 'unpaid');
    }

    // Customer name filter
    if (activeFilters.customerName.trim()) {
      filtered = filtered.filter(inv =>
        inv.customer?.name?.toLowerCase().includes(activeFilters.customerName.toLowerCase())
      );
    }

    // Phone number filter
    if (activeFilters.phoneNumber && activeFilters.phoneNumber.trim()) {
      filtered = filtered.filter(inv =>
        inv.customer?.phone_number?.includes(activeFilters.phoneNumber)
      );
    }

    // Date range filter
    if (activeFilters.dateFrom) {
      filtered = filtered.filter(inv => inv.bill_date >= activeFilters.dateFrom);
    }
    if (activeFilters.dateTo) {
      filtered = filtered.filter(inv => inv.bill_date <= activeFilters.dateTo);
    }

    // Amount range filter
    if (activeFilters.minAmount) {
      filtered = filtered.filter(inv =>
        parseFloat(inv.total_amount) >= parseFloat(activeFilters.minAmount)
      );
    }
    if (activeFilters.maxAmount) {
      filtered = filtered.filter(inv =>
        parseFloat(inv.total_amount) <= parseFloat(activeFilters.maxAmount)
      );
    }

    // Payment method filter
    if (activeFilters.paymentMethod) {
      filtered = filtered.filter(inv => inv.mode_of_payment === activeFilters.paymentMethod);
    }

    // Calculate statistics
    const totalAmount = filtered.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
    const paidAmount = filtered
      .filter(inv => inv.mode_of_payment === 'cash' || inv.mode_of_payment === 'online')
      .reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
    const unpaidAmount = filtered
      .filter(inv => inv.mode_of_payment === 'unpaid')
      .reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);

    setStats({
      totalAmount,
      paidAmount,
      unpaidAmount,
      count: filtered.length
    });

    setFilteredInvoices(filtered);
  };

  const handleInvoiceClick = async (invoice) => {
    setSelectedInvoice(invoice);
    setLoading(true);

    const { data } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id);

    setInvoiceItems(data || []);
    setLoading(false);
  };

  const updateFilter = (key, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const removeFilter = (key) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: key === 'paymentStatus' || key === 'paymentMethod' ? null : ''
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      paymentStatus: null,
      customerName: '',
      phoneNumber: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      paymentMethod: null
    });
    setSearchQuery('');
  };

  const getActiveFilterTags = () => {
    const tags = [];

    if (activeFilters.paymentStatus) {
      tags.push({
        key: 'paymentStatus',
        label: `Status: ${activeFilters.paymentStatus.toUpperCase()}`,
        color: activeFilters.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      });
    }

    if (activeFilters.customerName) {
      tags.push({
        key: 'customerName',
        label: `Customer: ${activeFilters.customerName}`,
        color: 'bg-blue-100 text-blue-800'
      });
    }

    if (activeFilters.phoneNumber) {
      tags.push({
        key: 'phoneNumber',
        label: `Phone: ${activeFilters.phoneNumber}`,
        color: 'bg-cyan-100 text-cyan-800'
      });
    }

    if (activeFilters.dateFrom || activeFilters.dateTo) {
      const dateLabel = activeFilters.dateFrom && activeFilters.dateTo
        ? `${activeFilters.dateFrom} to ${activeFilters.dateTo}`
        : activeFilters.dateFrom
          ? `From: ${activeFilters.dateFrom}`
          : `To: ${activeFilters.dateTo}`;
      tags.push({
        key: 'date',
        label: `Date: ${dateLabel}`,
        color: 'bg-purple-100 text-purple-800'
      });
    }

    if (activeFilters.minAmount || activeFilters.maxAmount) {
      const amountLabel = activeFilters.minAmount && activeFilters.maxAmount
        ? `₹${activeFilters.minAmount} - ₹${activeFilters.maxAmount}`
        : activeFilters.minAmount
          ? `Min: ₹${activeFilters.minAmount}`
          : `Max: ₹${activeFilters.maxAmount}`;
      tags.push({
        key: 'amount',
        label: `Amount: ${amountLabel}`,
        color: 'bg-orange-100 text-orange-800'
      });
    }

    if (activeFilters.paymentMethod) {
      tags.push({
        key: 'paymentMethod',
        label: `Method: ${activeFilters.paymentMethod.toUpperCase()}`,
        color: 'bg-indigo-100 text-indigo-800'
      });
    }

    return tags;
  };

  const activeTags = getActiveFilterTags();

  return (
    <div className="bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Back Button */}
        <button
          onClick={() => router.push('/billing')}
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

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Invoice Search</h1>

        {/* Search Bar and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* Main Search */}
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by invoice number, customer name, or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Payment Status Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Tag size={16} />
                Payment Status
              </label>
              <select
                value={activeFilters.paymentStatus || ''}
                onChange={(e) => updateFilter('paymentStatus', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            {/* Customer Name Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <User size={16} />
                Customer Name
              </label>
              <input
                type="text"
                placeholder="Enter customer name"
                value={activeFilters.customerName}
                onChange={(e) => updateFilter('customerName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            {/* phone number Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Phone size={16} />
                Phone Number
              </label>
              <input
                type="text"
                placeholder="Enter phone number"
                value={activeFilters.phoneNumber}
                onChange={(e) => updateFilter('phoneNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Payment Method Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <CreditCard size={16} />
                Payment Method
              </label>
              <select
                value={activeFilters.paymentMethod || ''}
                onChange={(e) => updateFilter('paymentMethod', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All</option>
                <option value="cash">Cash</option>
                <option value="online">Online</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar size={16} />
                Date From
              </label>
              <input
                type="date"
                value={activeFilters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar size={16} />
                Date To
              </label>
              <input
                type="date"
                value={activeFilters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Amount Range - Min */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <DollarSign size={16} />
                Min Amount
              </label>
              <input
                type="number"
                placeholder="Min ₹"
                value={activeFilters.minAmount}
                onChange={(e) => updateFilter('minAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Amount Range - Max */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <DollarSign size={16} />
                Max Amount
              </label>
              <input
                type="number"
                placeholder="Max ₹"
                value={activeFilters.maxAmount}
                onChange={(e) => updateFilter('maxAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
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
                    onClick={() => {
                      if (tag.key === 'date') {
                        removeFilter('dateFrom');
                        removeFilter('dateTo');
                      } else if (tag.key === 'amount') {
                        removeFilter('minAmount');
                        removeFilter('maxAmount');
                      } else {
                        removeFilter(tag.key);
                      }
                    }}
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


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Invoice List */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Loading...</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="text-green-600" size={24} />
                  Invoices ({filteredInvoices.length})
                </h2>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredInvoices.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No invoices found</p>
                  ) : (
                    filteredInvoices.map(invoice => (
                      <div
                        key={invoice.id}
                        className={`p-4 border-2 rounded-lg hover:shadow-md transition-all cursor-pointer ${selectedInvoice?.id === invoice.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-500'
                          }`}
                        onClick={() => router.push(`/billing/invoice/${invoice.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{invoice.invoice_number}</h3>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600">
                                <User size={14} className="inline mr-1" />
                                {invoice.customer?.name || 'N/A'}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  {invoice.bill_date}
                                </span>
                                <span className="flex items-center gap-1 font-semibold">
                                  <DollarSign size={14} />
                                  ₹{parseFloat(invoice.total_amount).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${invoice.mode_of_payment === 'cash' || invoice.mode_of_payment === 'online'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {invoice.mode_of_payment.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSearch;