"use client"

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Users, Search, Plus, Edit2, Trash2, DollarSign, X, FileText } from 'lucide-react';
import Link from 'next/link';

// Confirmation Dialog Component
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", danger = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-lg font-semibold text-white transition ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const StaffManagement = () => {
  const getLocalDateString = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Modals
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Add Staff Form
  const [newStaff, setNewStaff] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    designation: '',
    monthly_salary: '',
    date_of_joining: getLocalDateString()
  });

  // Advance Form
  const [advanceForm, setAdvanceForm] = useState({
    amount: '',
    reason: '',
    advance_date: getLocalDateString()
  });

  // Staff Analytics
  const [staffAttendance, setStaffAttendance] = useState([]);
  const [staffAdvances, setStaffAdvances] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthlyStats, setMonthlyStats] = useState(null);

  useEffect(() => {
    fetchAllStaff();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      fetchStaffAnalytics(selectedStaff.id);
    }
  }, [selectedStaff, selectedMonth]);

  const fetchAllStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setStaffList(data);
    setLoading(false);
  };

  const fetchStaffAnalytics = async (staffId) => {
    const firstDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('*')
      .eq('staff_id', staffId)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .order('date', { ascending: true });

    const { data: advancesData } = await supabase
      .from('salary_advances')
      .select('*')
      .eq('staff_id', staffId)
      .gte('advance_date', firstDay)
      .lte('advance_date', lastDay)
      .order('advance_date', { ascending: false });

    setStaffAttendance(attendanceData || []);
    setStaffAdvances(advancesData || []);

    const totalDays = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
    const presentDays = attendanceData?.filter(a => a.status === 'present').length || 0;
    const halfDays = attendanceData?.filter(a => a.status === 'half_day').length || 0;
    const absentDays = attendanceData?.filter(a => a.status === 'absent').length || 0;
    const unmarkedDays = totalDays - presentDays - halfDays - absentDays;

    const staff = staffList.find(s => s.id === staffId);
    if (staff) {
      const perDaySalary = staff.monthly_salary / totalDays;
      const halfDayDeduction = halfDays * (perDaySalary * 0.5);
      const absentDeduction = absentDays * perDaySalary;
      const totalAdvances = advancesData?.reduce((sum, adv) => sum + parseFloat(adv.amount), 0) || 0;
      const netSalary = staff.monthly_salary - halfDayDeduction - absentDeduction - totalAdvances;

      setMonthlyStats({
        totalDays, presentDays, halfDays, absentDays, unmarkedDays,
        baseSalary: staff.monthly_salary, perDaySalary, halfDayDeduction,
        absentDeduction, totalAdvances, netSalary,
        attendancePercentage: ((presentDays + halfDays * 0.5) / totalDays * 100).toFixed(1)
      });
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.full_name || !newStaff.email || !newStaff.password || !newStaff.monthly_salary) {
      alert('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newStaff.email,
        password: newStaff.password,
        options: { data: { full_name: newStaff.full_name } }
      });

      if (authError) throw authError;

      const { error: staffError } = await supabase
        .from('staff')
        .insert({
          user_id: authData.user.id,
          full_name: newStaff.full_name,
          email: newStaff.email,
          phone_number: newStaff.phone_number,
          designation: newStaff.designation,
          monthly_salary: parseFloat(newStaff.monthly_salary),
          date_of_joining: newStaff.date_of_joining
        });

      if (staffError) throw staffError;

      alert('Staff added successfully!');
      setShowAddStaffModal(false);
      setNewStaff({
        full_name: '', email: '', password: '', phone_number: '',
        designation: '', monthly_salary: '', date_of_joining: getLocalDateString()
      });
      fetchAllStaff();
    } catch (error) {
      alert('Error adding staff: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGiveAdvance = async () => {
    if (!advanceForm.amount || parseFloat(advanceForm.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('salary_advances')
      .insert({
        staff_id: selectedStaff.id,
        amount: parseFloat(advanceForm.amount),
        advance_date: advanceForm.advance_date,
        reason: advanceForm.reason
      });

    if (!error) {
      alert('Advance added successfully!');
      setShowAdvanceModal(false);
      setAdvanceForm({ amount: '', reason: '', advance_date: getLocalDateString() });
      fetchStaffAnalytics(selectedStaff.id);
    } else {
      alert('Error adding advance: ' + error.message);
    }
    setSaving(false);
  };

  const handleUpdateStaff = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('staff')
      .update({
        full_name: selectedStaff.full_name,
        phone_number: selectedStaff.phone_number,
        designation: selectedStaff.designation,
        monthly_salary: parseFloat(selectedStaff.monthly_salary),
        date_of_joining: selectedStaff.date_of_joining
      })
      .eq('id', selectedStaff.id);

    if (!error) {
      alert('Staff updated successfully!');
      setShowEditModal(false);
      fetchAllStaff();
    } else {
      alert('Error updating staff: ' + error.message);
    }
    setSaving(false);
  };

  const handleDeleteStaff = (staffId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Staff Member',
      message: 'Are you sure? This will delete all attendance and advance records. This cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        const { error } = await supabase.from('staff').delete().eq('id', staffId);
        if (!error) {
          alert('Staff deleted!');
          setSelectedStaff(null);
          fetchAllStaff();
        } else {
          alert('Error: ' + error.message);
        }
      }
    });
  };

  const filteredStaff = staffList.filter(staff =>
    staff.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.designation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calendar generation
  const generateCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const attendance = staffAttendance.find(a => a.date === dateStr);

      let bgColor = 'bg-gray-100';
      let icon = '';
      if (attendance?.status === 'present') { bgColor = 'bg-green-200'; icon = '✓'; }
      else if (attendance?.status === 'half_day') { bgColor = 'bg-yellow-200'; icon = 'H'; }
      else if (attendance?.status === 'absent') { bgColor = 'bg-red-200'; icon = '✕'; }

      days.push(
        <div key={day} className={`h-10 flex flex-col items-center justify-center rounded ${bgColor}`}>
          <span className="text-sm font-medium">{day}</span>
          {icon && <span className="text-xs">{icon}</span>}
        </div>
      );
    }
    return days;
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        confirmText="Delete"
        danger={true}
      />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="text-purple-600" size={28} />
                Staff Management
              </h1>
              <p className="text-gray-500 text-sm">Manage your team</p>
            </div>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Staff
            </button>
          </div>
        </div>

        {!selectedStaff ? (
          <>
            {/* Search */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{staffList.length}</p>
                <p className="text-xs text-gray-500">Total Staff</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  ₹{(staffList.reduce((sum, s) => sum + parseFloat(s.monthly_salary || 0), 0) / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-gray-500">Monthly Salary</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  ₹{staffList.length > 0 ? Math.round(staffList.reduce((sum, s) => sum + parseFloat(s.monthly_salary || 0), 0) / staffList.length / 1000) : 0}k
                </p>
                <p className="text-xs text-gray-500">Avg Salary</p>
              </div>
            </div>

            {/* Staff List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  onClick={() => setSelectedStaff(staff)}
                  className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {staff.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{staff.full_name}</h3>
                      <p className="text-sm text-gray-500">{staff.designation || 'Staff'}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Salary:</span>
                    <span className="font-semibold">₹{parseFloat(staff.monthly_salary).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {filteredStaff.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="mx-auto mb-2" size={40} />
                <p>No staff found</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Back & Actions */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setSelectedStaff(null)} className="px-3 py-2 bg-gray-200 rounded-lg text-sm">
                ← Back
              </button>
              <button onClick={() => setShowEditModal(true)} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
                <Edit2 size={14} /> Edit
              </button>
              <button onClick={() => setShowAdvanceModal(true)} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1">
                <DollarSign size={14} /> Advance
              </button>
              <Link
                href={`/staff/salary-slip?id=${selectedStaff.id}&month=${selectedMonth.getMonth() + 1}&year=${selectedMonth.getFullYear()}`}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-1"
              >
                <FileText size={14} /> Salary Slip
              </Link>
              <button onClick={() => handleDeleteStaff(selectedStaff.id)} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm flex items-center gap-1">
                <Trash2 size={14} /> Delete
              </button>
            </div>

            {/* Profile */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {selectedStaff.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedStaff.full_name}</h2>
                  <p className="text-gray-500">{selectedStaff.designation || 'Staff'}</p>
                  <p className="text-sm text-gray-500">{selectedStaff.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{selectedStaff.phone_number || 'N/A'}</span></div>
                <div><span className="text-gray-500">Salary:</span> <span className="font-medium">₹{parseFloat(selectedStaff.monthly_salary).toLocaleString()}</span></div>
                <div><span className="text-gray-500">Joined:</span> <span className="font-medium">{new Date(selectedStaff.date_of_joining).toLocaleDateString('en-IN')}</span></div>
              </div>
            </div>

            {/* Month Selector */}
            <div className="flex justify-center items-center gap-3 mb-4">
              <button onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))} className="px-3 py-1 bg-white rounded shadow text-sm">← Prev</button>
              <span className="font-semibold">{selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              <button onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))} className="px-3 py-1 bg-white rounded shadow text-sm">Next →</button>
            </div>

            {monthlyStats && (
              <>
                {/* Attendance Stats */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  <div className="bg-white rounded-lg shadow p-3 text-center">
                    <p className="text-xl font-bold text-green-600">{monthlyStats.presentDays}</p>
                    <p className="text-xs text-gray-500">Present</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-3 text-center">
                    <p className="text-xl font-bold text-yellow-600">{monthlyStats.halfDays}</p>
                    <p className="text-xs text-gray-500">Half</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-3 text-center">
                    <p className="text-xl font-bold text-red-600">{monthlyStats.absentDays}</p>
                    <p className="text-xs text-gray-500">Absent</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-3 text-center">
                    <p className="text-xl font-bold text-gray-500">{monthlyStats.unmarkedDays}</p>
                    <p className="text-xs text-gray-500">Unmarked</p>
                  </div>
                  <div className="bg-purple-600 rounded-lg shadow p-3 text-center text-white">
                    <p className="text-xl font-bold">{monthlyStats.attendancePercentage}%</p>
                    <p className="text-xs">Attendance</p>
                  </div>
                </div>

                {/* Salary Breakdown */}
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                  <h3 className="font-bold text-gray-800 mb-3">Salary Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Base Salary</span>
                      <span className="font-semibold">₹{monthlyStats.baseSalary.toLocaleString()}</span>
                    </div>
                    {monthlyStats.halfDayDeduction > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Half Day Deduction</span>
                        <span>- ₹{monthlyStats.halfDayDeduction.toFixed(0)}</span>
                      </div>
                    )}
                    {monthlyStats.absentDeduction > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Absent Deduction</span>
                        <span>- ₹{monthlyStats.absentDeduction.toFixed(0)}</span>
                      </div>
                    )}
                    {monthlyStats.totalAdvances > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Advances</span>
                        <span>- ₹{monthlyStats.totalAdvances.toFixed(0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold">Net Salary</span>
                      <span className="font-bold text-purple-600 text-lg">₹{monthlyStats.netSalary.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Calendar */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h3 className="font-bold text-gray-800 mb-3">Attendance Calendar</h3>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="py-1 font-semibold">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays()}
              </div>
            </div>

            {/* Advances */}
            {staffAdvances.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-bold text-gray-800 mb-3">Salary Advances</h3>
                <div className="space-y-2">
                  {staffAdvances.map((adv) => (
                    <div key={adv.id} className="flex justify-between p-2 bg-red-50 rounded text-sm">
                      <span>{new Date(adv.advance_date).toLocaleDateString('en-IN')} - {adv.reason || 'Advance'}</span>
                      <span className="text-red-600 font-semibold">₹{parseFloat(adv.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Staff</h2>
              <button onClick={() => setShowAddStaffModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input type="text" value={newStaff.full_name} onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" placeholder="john@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input type="password" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" placeholder="Min. 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input type="tel" value={newStaff.phone_number} onChange={(e) => setNewStaff({ ...newStaff, phone_number: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" placeholder="9876543210" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Designation</label>
                <input type="text" value={newStaff.designation} onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" placeholder="Sales Executive" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Monthly Salary *</label>
                <input type="number" value={newStaff.monthly_salary} onChange={(e) => setNewStaff({ ...newStaff, monthly_salary: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" placeholder="30000" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Joining</label>
                <input type="date" value={newStaff.date_of_joining} onChange={(e) => setNewStaff({ ...newStaff, date_of_joining: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleAddStaff} disabled={saving} className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Staff'}
              </button>
              <button onClick={() => setShowAddStaffModal(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Give Salary Advance</h2>
              <button onClick={() => setShowAdvanceModal(false)} className="text-gray-500"><X size={24} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Amount *</label>
                <input type="number" value={advanceForm.amount} onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="5000" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input type="date" value={advanceForm.advance_date} onChange={(e) => setAdvanceForm({ ...advanceForm, advance_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <input type="text" value={advanceForm.reason} onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Medical, Personal..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleGiveAdvance} disabled={saving} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50">
                {saving ? 'Processing...' : 'Give Advance'}
              </button>
              <button onClick={() => setShowAdvanceModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Staff</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500"><X size={24} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input type="text" value={selectedStaff.full_name} onChange={(e) => setSelectedStaff({ ...selectedStaff, full_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input type="tel" value={selectedStaff.phone_number || ''} onChange={(e) => setSelectedStaff({ ...selectedStaff, phone_number: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Designation</label>
                <input type="text" value={selectedStaff.designation || ''} onChange={(e) => setSelectedStaff({ ...selectedStaff, designation: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Monthly Salary</label>
                <input type="number" value={selectedStaff.monthly_salary} onChange={(e) => setSelectedStaff({ ...selectedStaff, monthly_salary: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Joining</label>
                <input type="date" value={selectedStaff.date_of_joining} onChange={(e) => setSelectedStaff({ ...selectedStaff, date_of_joining: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleUpdateStaff} disabled={saving} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50">
                {saving ? 'Updating...' : 'Update'}
              </button>
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;