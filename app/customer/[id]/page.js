"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import {
    ArrowLeft, User, Phone, MapPin, Car, Wrench, FileText,
    Calendar, DollarSign, TrendingUp, AlertCircle, Edit, Trash2,
    Package, Clock, CheckCircle, XCircle
} from 'lucide-react';

const CustomerDetails = () => {
    const params = useParams();
    const customerId = params?.id;
    const router = useRouter();
    const [customer, setCustomer] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState({
        totalPurchases: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        totalInvoices: 0,
        avgInvoiceValue: 0,
        lastPurchaseDate: null,
        memberSince: null,
        daysSinceMember: 0
    });

    useEffect(() => {
        fetchCustomerData();
    }, [customerId]);

    const fetchCustomerData = async () => {
        setLoading(true);
        try {
            // Fetch customer details
            const { data: customerData, error: customerError } = await supabase
                .from('customers')
                .select('*')
                .eq('id', customerId)
                .single();

            if (customerError) throw customerError;
            setCustomer(customerData);

            // Fetch all invoices for this customer
            const { data: invoicesData, error: invoicesError } = await supabase
                .from('invoices')
                .select('*')
                .eq('customer_id', customerId)
                .order('bill_date', { ascending: false });

            if (invoicesError) throw invoicesError;
            setInvoices(invoicesData || []);

            // Calculate analytics
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
                    avgInvoiceValue: totalPurchases / invoicesData.length,
                    lastPurchaseDate: lastPurchase,
                    memberSince: new Date(memberSince).toLocaleDateString('en-IN'),
                    daysSinceMember: daysSince
                });
            }
        } catch (error) {
            console.error('Error fetching customer data:', error);
            alert('Failed to load customer details');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCustomer = async () => {
        if (!window.confirm('Are you sure you want to delete this customer? This will also delete all their invoices. This action cannot be undone.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', customerId);

            if (error) throw error;

            alert('Customer deleted successfully!');
            router.push('/customer/search');
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert('Failed to delete customer');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading customer details...</p>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Customer not found</p>
                    <button
                        onClick={() => router.push('/customer/search')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Customers
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/customer/search')}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Back to Customers</span>
                </button>

                {/* Customer Header Card */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="text-blue-600" size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
                                <p className="text-gray-600 mt-1">Customer ID: {customer.id}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 max-md:flex-col">
                            <button
                                onClick={() => router.push(`/customer/edit/${customer.id}`)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Edit size={18} />
                                Edit
                            </button>
                            <button
                                onClick={handleDeleteCustomer}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={18} />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Customer Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Contact Information */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Phone className="text-blue-600" size={24} />
                                Contact Information
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                                    <p className="font-semibold text-lg">{customer.phone_number}</p>
                                </div>
                                {customer.address && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                                            <MapPin size={14} />
                                            Address
                                        </p>
                                        <p className="font-semibold">{customer.address}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Vehicle/Mechanic Info */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Car className="text-blue-600" size={24} />
                                Vehicle & Mechanic
                            </h2>

                            <div>
                                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                                    Vehicle
                                </p>
                                <p className="font-semibold">{customer.vehicle}</p>
                            </div>

                        </div>

                        {/* Membership Info */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-6 border-2 border-blue-200">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Clock className="text-blue-600" size={24} />
                                Membership
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Member Since</span>
                                    <span className="font-bold text-blue-600">{analytics.memberSince}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Days Active</span>
                                    <span className="font-bold text-blue-600">{analytics.daysSinceMember} days</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Analytics & Invoices */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Analytics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Total Purchases */}
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <Package size={32} />
                                    <TrendingUp size={24} />
                                </div>
                                <h3 className="text-sm font-medium opacity-90">Total Purchases</h3>
                                <p className="text-3xl font-bold mt-2">₹{analytics.totalPurchases.toLocaleString()}</p>
                                <p className="text-sm mt-2 opacity-80">{analytics.totalInvoices} invoices</p>
                            </div>

                            {/* Total Paid */}
                            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <CheckCircle size={32} />
                                    <DollarSign size={24} />
                                </div>
                                <h3 className="text-sm font-medium opacity-90">Total Paid</h3>
                                <p className="text-3xl font-bold mt-2">₹{analytics.totalPaid.toLocaleString()}</p>
                                <p className="text-sm mt-2 opacity-80">
                                    {((analytics.totalPaid / analytics.totalPurchases) * 100).toFixed(1)}% of total
                                </p>
                            </div>

                            {/* Total Unpaid */}
                            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <XCircle size={32} />
                                    <AlertCircle size={24} />
                                </div>
                                <h3 className="text-sm font-medium opacity-90">Total Unpaid</h3>
                                <p className="text-3xl font-bold mt-2">₹{analytics.totalUnpaid.toLocaleString()}</p>
                                <p className="text-sm mt-2 opacity-80">
                                    {((analytics.totalUnpaid / analytics.totalPurchases) * 100).toFixed(1)}% pending
                                </p>
                            </div>

                            {/* Average Invoice */}
                            {/* <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <FileText size={32} />
                                    <TrendingUp size={24} />
                                </div>
                                <h3 className="text-sm font-medium opacity-90">Average Invoice</h3>
                                <p className="text-3xl font-bold mt-2">₹{analytics.avgInvoiceValue.toLocaleString()}</p>
                                {analytics.lastPurchaseDate && (
                                    <p className="text-sm mt-2 opacity-80">
                                        Last: {analytics.lastPurchaseDate}
                                    </p>
                                )}
                            </div> */}
                        </div>


                        {/* Invoices List */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <FileText className="text-blue-600" size={24} />
                                Invoice History ({invoices.length})
                            </h2>
                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                {invoices.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No invoices found</p>
                                ) : (
                                    invoices.map(invoice => (
                                        <div
                                            key={invoice.id}
                                            onClick={() => router.push(`/billing/invoice/${invoice.id}`)}
                                            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg text-gray-900">{invoice.invoice_number}</h3>
                                                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={14} />
                                                            {invoice.bill_date}
                                                        </span>
                                                        <span className="flex items-center gap-1 font-semibold text-gray-900">
                                                            <DollarSign size={14} />
                                                            ₹{parseFloat(invoice.total_amount).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${invoice.mode_of_payment === 'cash' || invoice.mode_of_payment === 'online'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {invoice.mode_of_payment.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetails;