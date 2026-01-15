'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HomePage() {
  const [todayStats, setTodayStats] = useState({
    billsCount: 0,
    totalSales: 0
  });
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // 'today', 'week', 'month'

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let startDate, endDate;

      if (timeRange === 'today') {
        startDate = today;
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      } else if (timeRange === 'week') {
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      }

      // Fetch invoices
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Calculate today's stats
      const todayInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.created_at);
        return invDate >= today && invDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      });

      const billsCount = todayInvoices.length;
      const totalAmount = todayInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      setTodayStats({
        billsCount: billsCount,
        totalSales: totalAmount
      });

      // Prepare chart data
      const chartData = prepareChartData(invoices, timeRange);
      setSalesData(chartData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (invoices, range) => {
    if (range === 'today') {
      const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        sales: 0
      }));

      invoices.forEach(inv => {
        const hour = new Date(inv.created_at).getHours();
        hourlyData[hour].sales += inv.total_amount || 0;
      });

      return hourlyData.filter((_, i) => i % 3 === 0 || hourlyData[i].sales > 0);
    } else if (range === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          time: days[date.getDay()],
          sales: 0
        };
      });

      invoices.forEach(inv => {
        const date = new Date(inv.created_at);
        const daysAgo = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
        if (daysAgo >= 0 && daysAgo < 7) {
          dailyData[6 - daysAgo].sales += inv.total_amount || 0;
        }
      });

      return dailyData;
    } else {
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const monthlyData = Array.from({ length: daysInMonth }, (_, i) => ({
        time: `${i + 1} ${new Date(new Date().getFullYear(), new Date().getMonth(), i + 1).toLocaleDateString('en-US', { month: 'short' })}`,
        sales: 0
      }));

      invoices.forEach(inv => {
        const day = new Date(inv.created_at).getDate() - 1;
        if (day >= 0 && day < daysInMonth) {
          monthlyData[day].sales += inv.total_amount || 0;
        }
      });

      return monthlyData.filter((_, i) => i % 3 === 0 || i === monthlyData.length - 1 || monthlyData[i].sales > 0);
    }
  };

  const totalSalesForRange = salesData.reduce((sum, d) => sum + d.sales, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-3"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className='text-2xl font-bold text-gray-800 mb-1'>Home</h1>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {/* Bills Sold */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-red-500 font-medium mb-1">bill selled</p>
                <p className="text-2xl font-bold text-gray-800 mb-1">{todayStats.billsCount}</p>
                <p className="text-xs text-gray-400">From {todayStats.billsCount} {todayStats.billsCount === 1 ? 'Party' : 'Parties'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </div>

          {/* Total Sales */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-red-500 font-medium mb-1">total sales</p>
                <p className="text-2xl font-bold text-gray-800 mb-1">₹ {todayStats.totalSales.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-400">Today</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-base font-semibold text-gray-700">Total Sale</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">₹ {totalSalesForRange.toLocaleString('en-IN')}</p>
            </div>

            {/* Dropdown Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border-2 border-blue-400 text-blue-600 rounded-full bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 font-medium"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Chart */}
          <div className="h-72 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#9ca3af"
                  style={{ fontSize: '11px' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: '11px' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`₹${value}`, 'Sales']}
                />
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  fill="url(#colorSales)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}