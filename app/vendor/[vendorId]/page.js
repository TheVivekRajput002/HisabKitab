"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
    ArrowLeft, 
    Building2, 
    Calendar, 
    FileText, 
    CreditCard, 
    Printer, 
    Search, 
    Filter, 
    Plus, 
    DollarSign, 
    AlertCircle, 
    Loader2,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2
} from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

// Helper to format date matching statement style: 29-Jun-26
const formatLedgerDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
};

// Helper for Indian Currency formatting: 269,416.08
const formatAmount = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

export default function VendorDetailPage() {
    const params = useParams();
    const router = useRouter();
    const vendorId = params.vendorId || params.id;

    const [vendor, setVendor] = useState(null);
    const [bills, setBills] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all' | 'bill' | 'payment'

    useEffect(() => {
        if (vendorId) {
            fetchVendorLedgerData();
        }
    }, [vendorId]);

    const fetchVendorLedgerData = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Vendor Info
            const { data: vendorData, error: vendorErr } = await supabase
                .from('vendors')
                .select('*')
                .eq('id', vendorId)
                .single();

            if (vendorErr) throw vendorErr;
            setVendor(vendorData);

            // 2. Fetch Vendor Bills
            const { data: billsData, error: billsErr } = await supabase
                .from('vendor_bills')
                .select('*')
                .eq('vendor_id', vendorId)
                .order('bill_date', { ascending: true });

            if (billsErr) throw billsErr;
            setBills(billsData || []);

            // 3. Fetch Vendor Payments
            const { data: paymentsData, error: paymentsErr } = await supabase
                .from('payments')
                .select('*')
                .eq('customer_id', vendorId)
                .order('payment_date', { ascending: true });

            if (paymentsErr) throw paymentsErr;
            setPayments(paymentsData || []);

        } catch (err) {
            console.error('Error fetching vendor ledger:', err);
            setError(err.message || 'Failed to load vendor ledger statement');
        } finally {
            setLoading(false);
        }
    };

    // Combine bills and payments into a unified Ledger Statement array
    const ledgerStatement = useMemo(() => {
        let entries = [];

        // Map Bills -> Debit entries
        bills.forEach(bill => {
            entries.push({
                id: `bill-${bill.id}`,
                rawDate: bill.bill_date || bill.created_at,
                date: formatLedgerDate(bill.bill_date || bill.created_at),
                particulars: `Purchase ( GST ) - Bill #${bill.bill_number}`,
                vchType: 'Sales ( GST )',
                vchNo: bill.bill_number || 'N/A',
                debit: Number(bill.total_amount) || 0,
                credit: 0,
                type: 'bill',
                status: bill.payment_status,
                rawObj: bill
            });
        });

        // Map Payments -> Credit entries
        payments.forEach(pay => {
            const method = pay.payment_method || pay.payment_mode || 'RECEIPT';
            const modeText = method ? `${method}` : 'RECEIPT';
            const notesText = pay.notes ? `, ${pay.notes}` : '';
            entries.push({
                id: `pay-${pay.id}`,
                rawDate: pay.payment_date || pay.created_at,
                date: formatLedgerDate(pay.payment_date || pay.created_at),
                particulars: `Payment (${modeText}${notesText})`,
                vchType: `RECEIPT (${modeText})`,
                vchNo: pay.payment_number || 'RT-' + String(pay.id).slice(0, 4).toUpperCase(),
                debit: 0,
                credit: Number(pay.amount) || 0,
                type: 'payment',
                status: pay.status,
                rawObj: pay
            });
        });

        // Sort chronologically by date
        entries.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

        // Filter by search, type & date range
        return entries.filter(item => {
            if (filterType !== 'all' && item.type !== filterType) return false;
            
            if (fromDate && new Date(item.rawDate) < new Date(fromDate)) return false;
            if (toDate && new Date(item.rawDate) > new Date(toDate + 'T23:59:59')) return false;

            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                return (
                    item.particulars.toLowerCase().includes(query) ||
                    item.vchNo.toLowerCase().includes(query) ||
                    item.vchType.toLowerCase().includes(query)
                );
            }
            return true;
        });
    }, [bills, payments, filterType, fromDate, toDate, searchQuery]);

    // Calculate totals & balances
    const totals = useMemo(() => {
        let totalDebit = 0;
        let totalCredit = 0;

        ledgerStatement.forEach(item => {
            totalDebit += item.debit;
            totalCredit += item.credit;
        });

        const netBalance = Math.abs(totalDebit - totalCredit);
        const balanceSide = totalDebit >= totalCredit ? 'Dr' : 'Cr';
        const grandTotal = Math.max(totalDebit, totalCredit);

        return {
            totalDebit,
            totalCredit,
            netBalance,
            balanceSide,
            grandTotal
        };
    }, [ledgerStatement]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-2xl shadow-md">
                    <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
                    <p className="text-sm font-semibold text-gray-600">Loading Vendor Ledger Statement...</p>
                </div>
            </div>
        );
    }

    if (error || !vendor) {
        return (
            <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => router.push('/vendor')}
                        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Vendors
                    </button>
                    <div className="bg-white p-8 rounded-2xl shadow-md text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <h2 className="text-xl font-bold text-gray-800 mb-1">Vendor Not Found</h2>
                        <p className="text-sm text-gray-600 mb-4">{error || 'Could not load vendor data'}</p>
                        <button
                            onClick={() => router.push('/vendor')}
                            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
                        >
                            Return to Vendor List
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-3 sm:p-6 print:bg-white print:p-0">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Navigation & Header Controls (Hidden during print) */}
                <div className="flex items-center justify-between flex-wrap gap-4 print:hidden">
                    <button
                        onClick={() => router.push('/vendor')}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl shadow-sm transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Vendors
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push(`/vendor/${vendor.id}/bills`)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
                        >
                            <FileText className="w-4 h-4" /> Bills List
                        </button>
                        <button
                            onClick={() => router.push(`/vendor/pay?vendorId=${vendor.id}`)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
                        >
                            <CreditCard className="w-4 h-4" /> Pay Vendor
                        </button>
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-800 text-white hover:bg-gray-900 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
                        >
                            <Printer className="w-4 h-4" /> Print Statement
                        </button>
                    </div>
                </div>

                {/* Vendor Summary Top Bar */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 print:shadow-none print:border-b print:rounded-none">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0">
                                <Building2 className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                                    {vendor.name}
                                </h1>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-medium flex-wrap">
                                    {vendor.gstin && (
                                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                            GSTIN: {vendor.gstin}
                                        </span>
                                    )}
                                    {vendor.phone && (
                                        <span>Phone: {vendor.phone}</span>
                                    )}
                                    {vendor.address && (
                                        <span>Address: {vendor.address}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Net Balance</p>
                                <p className={`text-lg sm:text-xl font-black ${
                                    totals.balanceSide === 'Dr' ? 'text-red-600' : 'text-emerald-600'
                                }`}>
                                    ₹{formatAmount(totals.netBalance)} <span className="text-xs font-bold">{totals.balanceSide}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Overview Cards (Hidden during print) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Purchases (Debit)</span>
                            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                                <ArrowUpRight className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-xl font-extrabold text-gray-900 mt-2">
                            ₹{formatAmount(totals.totalDebit)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{bills.length} Bills Issued</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Payments (Credit)</span>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <ArrowDownLeft className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-xl font-extrabold text-gray-900 mt-2">
                            ₹{formatAmount(totals.totalCredit)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{payments.length} Payments Recorded</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Outstanding Balance</span>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                        <p className={`text-xl font-extrabold mt-2 ${
                            totals.balanceSide === 'Dr' ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                            ₹{formatAmount(totals.netBalance)} {totals.balanceSide}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Current Ledger Status</p>
                    </div>
                </div>

                {/* Filters & Search Toolbar (Hidden during print) */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 print:hidden">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by Voucher No or Particulars..."
                            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                            <span>From:</span>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs outline-none"
                            />
                            <span>To:</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs outline-none"
                            />
                        </div>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Vouchers</option>
                            <option value="bill">Bills Only (Debit)</option>
                            <option value="payment">Payments Only (Credit)</option>
                        </select>
                    </div>
                </div>

                {/* LEDGER STATEMENT TABLE (Exact Tally / Passbook Format Matching Photo) */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-300 overflow-hidden print:shadow-none print:border print:rounded-none">
                    
                    {/* Print Header Header Info */}
                    <div className="hidden print:block p-4 border-b text-center">
                        <h2 className="text-xl font-bold uppercase tracking-wider text-gray-900">{vendor.name}</h2>
                        <p className="text-xs text-gray-600">Ledger Account Statement</p>
                        {(fromDate || toDate) && (
                            <p className="text-xs text-gray-500 font-mono mt-1">
                                Period: {fromDate ? formatLedgerDate(fromDate) : 'Start'} to {toDate ? formatLedgerDate(toDate) : 'Present'}
                            </p>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse font-sans text-xs sm:text-sm">
                            <thead>
                                <tr className="bg-gray-800 text-white font-bold border-b border-gray-800 text-left">
                                    <th className="py-3 px-3.5 w-28 text-left border-r border-gray-700">Date</th>
                                    <th className="py-3 px-4 text-left border-r border-gray-700">Particulars</th>
                                    <th className="py-3 px-3.5 w-32 text-left border-r border-gray-700">Vch Type</th>
                                    <th className="py-3 px-3.5 w-32 text-left border-r border-gray-700">Vch No.</th>
                                    <th className="py-3 px-4 w-32 text-right border-r border-gray-700">Debit (₹)</th>
                                    <th className="py-3 px-4 w-32 text-right">Credit (₹)</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 text-gray-800">
                                {/* Opening Balance Row */}
                                <tr className="bg-gray-50/90 font-semibold border-b border-gray-300">
                                    <td className="py-3 px-3.5 font-mono text-gray-600 border-r border-gray-200">
                                        {ledgerStatement.length > 0 ? ledgerStatement[0].date : formatLedgerDate(vendor.created_at)}
                                    </td>
                                    <td className="py-3 px-4 font-bold text-gray-900 border-r border-gray-200" colSpan={3}>
                                        Opening Balance
                                    </td>
                                    <td className="py-3 px-4 text-right font-bold font-mono text-gray-900 border-r border-gray-200">
                                        {totals.totalDebit > totals.totalCredit ? formatAmount(totals.totalDebit - totals.totalCredit) : ''}
                                    </td>
                                    <td className="py-3 px-4 text-right font-bold font-mono text-gray-900">
                                        {totals.totalCredit > totals.totalDebit ? formatAmount(totals.totalCredit - totals.totalDebit) : ''}
                                    </td>
                                </tr>

                                {/* Transaction Rows */}
                                {ledgerStatement.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-gray-500 font-medium">
                                            No transaction vouchers found for this vendor.
                                        </td>
                                    </tr>
                                ) : (
                                    ledgerStatement.map((item) => (
                                        <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                                            <td className="py-2.5 px-3.5 font-mono text-gray-700 whitespace-nowrap border-r border-gray-200">
                                                {item.date}
                                            </td>
                                            <td className="py-2.5 px-4 font-medium text-gray-900 border-r border-gray-200">
                                                {item.particulars}
                                            </td>
                                            <td className="py-2.5 px-3.5 text-gray-600 font-medium whitespace-nowrap border-r border-gray-200">
                                                {item.vchType}
                                            </td>
                                            <td className="py-2.5 px-3.5 font-mono text-gray-700 whitespace-nowrap border-r border-gray-200">
                                                {item.vchNo}
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-900 border-r border-gray-200">
                                                {item.debit > 0 ? formatAmount(item.debit) : ''}
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-900">
                                                {item.credit > 0 ? formatAmount(item.credit) : ''}
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {/* Summary Total Row */}
                                <tr className="bg-gray-100 font-extrabold border-t-2 border-gray-400 text-gray-900">
                                    <td className="py-3 px-4" colSpan={4}>
                                        Total
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono border-r border-gray-300">
                                        {formatAmount(totals.totalDebit)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono">
                                        {formatAmount(totals.totalCredit)}
                                    </td>
                                </tr>

                                {/* Closing Balance Row */}
                                <tr className="bg-white font-extrabold text-gray-900">
                                    <td className="py-2.5 px-4" colSpan={4}>
                                        <div className="flex items-center gap-2">
                                            <span>{totals.balanceSide === 'Dr' ? 'Dr' : 'Cr'}</span>
                                            <span>Closing Balance</span>
                                        </div>
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-mono border-r border-gray-300">
                                        {totals.balanceSide === 'Dr' ? formatAmount(totals.netBalance) : ''}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-mono">
                                        {totals.balanceSide === 'Cr' ? formatAmount(totals.netBalance) : ''}
                                    </td>
                                </tr>

                                {/* Equalized Grand Total Row (Matching Statement Bottom Line) */}
                                <tr className="bg-gray-900 text-white font-black text-sm border-t-2 border-b-2 border-gray-900">
                                    <td className="py-3 px-4" colSpan={4}>
                                        Grand Total
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono border-r border-gray-700">
                                        ₹{formatAmount(totals.grandTotal)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono">
                                        ₹{formatAmount(totals.grandTotal)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
