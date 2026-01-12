"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { ArrowLeft, Printer } from 'lucide-react';

function SalarySlipContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const staffId = searchParams.get('id');
    const month = parseInt(searchParams.get('month')) || new Date().getMonth() + 1;
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();

    const [staff, setStaff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [monthlyStats, setMonthlyStats] = useState(null);
    const [advances, setAdvances] = useState([]);

    useEffect(() => {
        if (staffId) fetchData();
    }, [staffId, month, year]);

    const fetchData = async () => {
        setLoading(true);
        const { data: staffData } = await supabase.from('staff').select('*').eq('id', staffId).single();

        if (staffData) {
            setStaff(staffData);
            const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

            const { data: attendanceData } = await supabase.from('attendance').select('*').eq('staff_id', staffId).gte('date', firstDay).lte('date', lastDay);
            const { data: advancesData } = await supabase.from('salary_advances').select('*').eq('staff_id', staffId).gte('advance_date', firstDay).lte('advance_date', lastDay);

            setAdvances(advancesData || []);

            const totalDays = new Date(year, month, 0).getDate();
            const presentDays = attendanceData?.filter(a => a.status === 'present').length || 0;
            const halfDays = attendanceData?.filter(a => a.status === 'half_day').length || 0;
            const absentDays = attendanceData?.filter(a => a.status === 'absent').length || 0;

            const perDaySalary = staffData.monthly_salary / totalDays;
            const halfDayDeduction = halfDays * (perDaySalary * 0.5);
            const absentDeduction = absentDays * perDaySalary;
            const totalAdvances = advancesData?.reduce((sum, adv) => sum + parseFloat(adv.amount), 0) || 0;
            const netSalary = staffData.monthly_salary - halfDayDeduction - absentDeduction - totalAdvances;

            setMonthlyStats({
                totalDays, presentDays, halfDays, absentDays,
                baseSalary: staffData.monthly_salary, perDaySalary, halfDayDeduction,
                absentDeduction, totalAdvances,
                totalDeductions: halfDayDeduction + absentDeduction + totalAdvances,
                netSalary
            });
        }
        setLoading(false);
    };

    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-purple-600"></div>
            </div>
        );
    }

    if (!staff) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Staff not found</p>
                    <button onClick={() => router.back()} className="text-purple-600 hover:underline">← Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-2">
            {/* Actions - Hidden on Print */}
            <div className="max-w-2xl mx-auto mb-2 flex justify-between items-center print:hidden">
                <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm">
                    <ArrowLeft size={16} /> Back
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm">
                    <Printer size={14} /> Print / Save PDF
                </button>
            </div>

            {/* Salary Slip */}
            <div className="max-w-2xl mx-auto bg-white rounded shadow overflow-hidden print:shadow-none">
                {/* Header */}
                <div className="bg-purple-600 text-white p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold">SALARY SLIP</h1>
                            <p className="text-purple-200 text-sm">{monthName}</p>
                        </div>
                        <div className="text-right text-sm text-purple-200">
                            <p>Your Company Name</p>
                        </div>
                    </div>
                </div>

                {/* Employee Info */}
                <div className="p-4 border-b">
                    <h2 className="font-semibold text-gray-800 mb-2 text-sm">Employee Details</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{staff.full_name}</p></div>
                        <div><p className="text-xs text-gray-500">Designation</p><p className="font-medium">{staff.designation || 'Staff'}</p></div>
                        <div><p className="text-xs text-gray-500">Employee ID</p><p className="font-medium">EMP-{staff.id}</p></div>
                        <div><p className="text-xs text-gray-500">Joined</p><p className="font-medium">{new Date(staff.date_of_joining).toLocaleDateString('en-IN')}</p></div>
                    </div>
                </div>

                {/* Attendance */}
                <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-semibold text-gray-800 mb-2 text-sm">Attendance Summary</h2>
                    <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-white p-2 rounded border">
                            <p className="text-lg font-bold text-green-600">{monthlyStats?.presentDays || 0}</p>
                            <p className="text-xs text-gray-500">Present</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                            <p className="text-lg font-bold text-yellow-600">{monthlyStats?.halfDays || 0}</p>
                            <p className="text-xs text-gray-500">Half</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                            <p className="text-lg font-bold text-red-600">{monthlyStats?.absentDays || 0}</p>
                            <p className="text-xs text-gray-500">Absent</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                            <p className="text-lg font-bold text-gray-600">{monthlyStats?.totalDays || 0}</p>
                            <p className="text-xs text-gray-500">Total</p>
                        </div>
                    </div>
                </div>

                {/* Earnings & Deductions */}
                <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                    {/* Earnings */}
                    <div>
                        <h2 className="font-semibold text-gray-800 mb-2 border-b pb-1">Earnings</h2>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Basic Salary</span>
                                <span className="font-medium">₹{monthlyStats?.baseSalary?.toLocaleString() || 0}</span>
                            </div>
                        </div>
                        <div className="mt-2 pt-2 border-t flex justify-between font-semibold">
                            <span>Total</span>
                            <span className="text-green-600">₹{monthlyStats?.baseSalary?.toLocaleString() || 0}</span>
                        </div>
                    </div>

                    {/* Deductions */}
                    <div>
                        <h2 className="font-semibold text-gray-800 mb-2 border-b pb-1">Deductions</h2>
                        <div className="space-y-1">
                            {monthlyStats?.halfDayDeduction > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Half Days</span>
                                    <span>₹{monthlyStats?.halfDayDeduction?.toFixed(0)}</span>
                                </div>
                            )}
                            {monthlyStats?.absentDeduction > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Absent</span>
                                    <span>₹{monthlyStats?.absentDeduction?.toFixed(0)}</span>
                                </div>
                            )}
                            {monthlyStats?.totalAdvances > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Advances</span>
                                    <span>₹{monthlyStats?.totalAdvances?.toFixed(0)}</span>
                                </div>
                            )}
                            {(monthlyStats?.totalDeductions || 0) === 0 && (
                                <p className="text-gray-400 text-xs">No deductions</p>
                            )}
                        </div>
                        <div className="mt-2 pt-2 border-t flex justify-between font-semibold">
                            <span>Total</span>
                            <span className="text-red-600">₹{monthlyStats?.totalDeductions?.toFixed(0) || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Net Salary */}
                <div className="bg-purple-600 text-white p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-purple-200 text-xs">Net Payable</p>
                            <p className="text-2xl font-bold">₹{monthlyStats?.netSalary?.toFixed(0) || 0}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-purple-200 text-xs">Status</p>
                            <p className="font-semibold">Pending</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 text-center text-gray-400 text-xs border-t">
                    Computer generated • {new Date().toLocaleDateString('en-IN')}
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                }
            `}</style>
        </div>
    );
}

export default function SalarySlipPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-4 border-purple-600"></div></div>}>
            <SalarySlipContent />
        </Suspense>
    );
}
