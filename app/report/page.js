"use client"

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, DollarSign, Users, FileText, TrendingUp, Package, Filter, BarChart3 } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';


const Data = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'daywise'
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidRevenue: 0,
    unpaidRevenue: 0,
    totalInvoices: 0,
    uniqueCustomers: 0,
    topProducts: [],
    topCustomers: [],
    paymentBreakdown: { cash: 0, online: 0, unpaid: 0 },
    dailyRevenue: [],
    paymentModeData: [],
    totalStockValue: 0
  });

  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAnalytics();
    }
  }, [startDate, endDate]);

  const fetchAnalytics = async () => {
    setLoading(true);

    try {
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(id, name, phone_number)
        `)
        .gte('bill_date', startDate)
        .lte('bill_date', endDate)
        .order('bill_date', { ascending: false });

      if (invoiceError) throw invoiceError;

      const invoiceIds = invoices.map(inv => inv.id);
      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .in('invoice_id', invoiceIds);

      if (itemsError) throw itemsError;

      // Fetch products for stock value calculation
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('current_stock, purchase_rate');

      if (productsError) throw productsError;

      // Calculate total stock value (quantity × price for all products)
      const totalStockValue = products.reduce((sum, product) => {
        const stock = parseFloat(product.current_stock) || 0;
        const rate = parseFloat(product.purchase_rate) || 0;
        return sum + (stock * rate);
      }, 0);

      calculateStats(invoices, items, totalStockValue);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoices, items, totalStockValue = 0) => {
    let totalRevenue = 0;
    let paidRevenue = 0;
    let unpaidRevenue = 0;
    let cashCount = 0;
    let onlineCount = 0;
    let unpaidCount = 0;

    // Daily revenue tracking
    const dailyRevenueMap = {};

    invoices.forEach(inv => {
      const amount = parseFloat(inv.total_amount);
      totalRevenue += amount;

      // Track daily revenue
      const date = inv.bill_date;
      if (!dailyRevenueMap[date]) {
        dailyRevenueMap[date] = { date, revenue: 0, invoices: 0 };
      }
      dailyRevenueMap[date].revenue += amount;
      dailyRevenueMap[date].invoices += 1;

      if (inv.mode_of_payment === 'cash') {
        paidRevenue += amount;
        cashCount += amount;
      } else if (inv.mode_of_payment === 'online') {
        paidRevenue += amount;
        onlineCount += amount;
      } else if (inv.mode_of_payment === 'unpaid') {
        unpaidRevenue += amount;
        unpaidCount += amount;
      }
    });

    // Convert daily revenue map to sorted array
    const dailyRevenue = Object.values(dailyRevenueMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(day => ({
        ...day,
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));

    const uniqueCustomerIds = new Set(invoices.map(inv => inv.customer_id));
    const uniqueCustomers = uniqueCustomerIds.size;

    const productStats = {};
    items.forEach(item => {
      const productName = item.product_name;
      if (!productStats[productName]) {
        productStats[productName] = {
          name: productName,
          quantity: 0,
          revenue: 0
        };
      }
      productStats[productName].quantity += parseFloat(item.quantity);
      productStats[productName].revenue += parseFloat(item.total_product);
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const customerStats = {};
    invoices.forEach(inv => {
      const customerId = inv.customer_id;
      const customerName = inv.customer?.name || 'Unknown';

      if (!customerStats[customerId]) {
        customerStats[customerId] = {
          name: customerName,
          invoiceCount: 0,
          totalSpent: 0
        };
      }
      customerStats[customerId].invoiceCount += 1;
      customerStats[customerId].totalSpent += parseFloat(inv.total_amount);
    });

    const topCustomers = Object.values(customerStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // Payment mode data for pie chart
    const paymentModeData = [
      { name: 'Cash', value: cashCount, color: '#10b981' },
      { name: 'Online', value: onlineCount, color: '#3b82f6' },
      { name: 'Unpaid', value: unpaidCount, color: '#f59e0b' }
    ].filter(item => item.value > 0);

    setStats({
      totalRevenue,
      paidRevenue,
      unpaidRevenue,
      totalInvoices: invoices.length,
      uniqueCustomers,
      topProducts,
      topCustomers,
      paymentBreakdown: {
        cash: cashCount,
        online: onlineCount,
        unpaid: unpaidCount
      },
      dailyRevenue,
      paymentModeData,
      totalStockValue
    });
  };

  const handleQuickFilter = (days) => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - days);

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(pastDate.toISOString().split('T')[0]);
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

  return (
    <div className="bg-gray-50 p-4 md:p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Sales Analytics</h1>

        {/* Date Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold">Date Range Filter</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickFilter(7)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handleQuickFilter(30)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handleQuickFilter(90)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Last 90 Days
            </button>
            <button
              onClick={() => handleQuickFilter(365)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Last Year
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${viewMode === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <TrendingUp size={20} />
              Overview
            </button>
            <button
              onClick={() => setViewMode('daywise')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${viewMode === 'daywise'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <BarChart3 size={20} />
              Day-wise Analytics
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics Cards */}
            <div className="flex flex-wrap gap-6 mb-6" style={{ display: 'flex' }}>
              <div className="flex-1 min-w-[180px] bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign size={32} />
                  <TrendingUp size={20} className="opacity-70" />
                </div>
                <p className="text-sm opacity-90 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>

              <div className="flex-1 min-w-[180px] bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign size={32} />
                  <span className="text-xs opacity-90">PAID</span>
                </div>
                <p className="text-sm opacity-90 mb-1">Paid Revenue</p>
                <p className="text-3xl font-bold">₹{stats.paidRevenue.toLocaleString()}</p>
              </div>

              <div className="flex-1 min-w-[180px] bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-md p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign size={32} />
                  <span className="text-xs opacity-90">PENDING</span>
                </div>
                <p className="text-sm opacity-90 mb-1">Unpaid Revenue</p>
                <p className="text-3xl font-bold">₹{stats.unpaidRevenue.toLocaleString()}</p>
              </div>

              <div className="flex-1 min-w-[180px] bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <Users size={32} />
                  <FileText size={20} className="opacity-70" />
                </div>
                <p className="text-sm opacity-90 mb-1">Customers Attended</p>
                <p className="text-3xl font-bold">{stats.uniqueCustomers}</p>
                <p className="text-xs opacity-80 mt-1">{stats.totalInvoices} invoices</p>
              </div>

              <div className="flex-1 min-w-[180px] bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-md p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <Package size={32} />
                  <span className="text-xs opacity-90">STOCK</span>
                </div>
                <p className="text-sm opacity-90 mb-1">Total Stock Value</p>
                <p className="text-3xl font-bold">₹{stats.totalStockValue.toLocaleString()}</p>
              </div>
            </div>

            {viewMode === 'overview' ? (
              <>
                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Payment Breakdown Pie Chart */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="text-blue-600" size={24} />
                      Payment Breakdown
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.paymentModeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {stats.paymentModeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="text-xs text-gray-600">Cash</p>
                        <p className="font-bold text-green-600">₹{stats.paymentBreakdown.cash.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="text-xs text-gray-600">Online</p>
                        <p className="font-bold text-blue-600">₹{stats.paymentBreakdown.online.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 rounded">
                        <p className="text-xs text-gray-600">Unpaid</p>
                        <p className="font-bold text-yellow-600">₹{stats.paymentBreakdown.unpaid.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Top Products Bar Chart */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Package className="text-purple-600" size={24} />
                      Top Products by Revenue
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.topProducts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                        <Bar dataKey="revenue" fill="#9333ea" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Customers */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Users className="text-blue-600" size={24} />
                    Top 5 Customers by Revenue
                  </h2>
                  <div className="space-y-3">
                    {stats.topCustomers.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No customers in this period</p>
                    ) : (
                      stats.topCustomers.map((customer, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                            <span className="text-lg font-bold text-blue-600">
                              ₹{customer.totalSpent.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {customer.invoiceCount} {customer.invoiceCount === 1 ? 'invoice' : 'invoices'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Day-wise Revenue Chart */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="text-blue-600" size={24} />
                    Daily Revenue Trend
                  </h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={stats.dailyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === 'revenue') return [`₹${value.toLocaleString()}`, 'Revenue'];
                          return [value, 'Invoices'];
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
                      <Line type="monotone" dataKey="invoices" stroke="#10b981" strokeWidth={2} name="Invoices" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Day-wise Table */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Day-wise Breakdown</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Invoices</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Revenue</th>

                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {stats.dailyRevenue.map((day, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{day.date}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{day.invoices}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">
                              ₹{day.revenue.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Data;