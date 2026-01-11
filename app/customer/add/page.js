"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { ArrowLeft, User, Phone, MapPin, Car, Wrench, Save, AlertCircle } from 'lucide-react';

const AddCustomer = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        address: '',
        vehicle: '',
        mechanic: ''
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Customer name is required';
        }

        // Phone number validation
        if (!formData.phone_number.trim()) {
            newErrors.phone_number = 'Phone number is required';
        } else if (!/^\d{10}$/.test(formData.phone_number.replace(/\s/g, ''))) {
            newErrors.phone_number = 'Please enter a valid 10-digit phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Check if customer with same phone number already exists
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id, name')
                .eq('phone_number', formData.phone_number)
                .single();

            if (existingCustomer) {
                alert(`A customer with this phone number already exists: ${existingCustomer.name}`);
                setLoading(false);
                return;
            }

            // Insert new customer
            const { data, error } = await supabase
                .from('customers')
                .insert([{
                    name: formData.name.trim(),
                    phone_number: formData.phone_number.trim(),
                    address: formData.address.trim() || null,
                    vehicle: formData.vehicle.trim() || null,
                    mechanic: formData.mechanic.trim() || null
                }])
                .select()
                .single();

            if (error) throw error;

            alert('Customer added successfully!');
            router.push(`/customer/${data.id}`); // Navigate to customer details page
        } catch (error) {
            console.error('Error adding customer:', error);
            alert('Failed to add customer. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (formData.name || formData.phone_number || formData.address || formData.vehicle || formData.mechanic) {
            if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
                router.push('/customer/search');
            }
        } else {
            router.push('/customer/search');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/customer')}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Back to Customers</span>
                </button>

                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="text-blue-600" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Add New Customer</h1>
                            <p className="text-gray-600 mt-1">Enter customer details below</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
                    <div className="space-y-6">
                        {/* Customer Name - Required */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <User size={18} />
                                Customer Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Enter customer name"
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} />
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Phone Number - Required */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Phone size={18} />
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.phone_number}
                                onChange={(e) => handleChange('phone_number', e.target.value)}
                                placeholder="Enter 10-digit phone number"
                                maxLength="10"
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.phone_number ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.phone_number && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} />
                                    {errors.phone_number}
                                </p>
                            )}
                        </div>

                        {/* Address - Optional */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <MapPin size={18} />
                                Address <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                placeholder="Enter customer address"
                                rows="3"
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                            />
                        </div>

                        {/* Vehicle - Optional */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Car size={18} />
                                Vehicle <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.vehicle}
                                onChange={(e) => handleChange('vehicle', e.target.value)}
                                placeholder="Enter vehicle model/type"
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            />
                        </div>

                        {/* Mechanic - Optional */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Wrench size={18} />
                                Mechanic <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.mechanic}
                                onChange={(e) => handleChange('mechanic', e.target.value)}
                                placeholder="Enter mechanic name"
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            />
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                            <div>
                                <p className="text-sm text-blue-900 font-semibold">Required Fields</p>
                                <p className="text-sm text-blue-800 mt-1">
                                    Customer name and phone number are required. All other fields are optional and can be added later.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 ${loading
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-blue-700'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Adding Customer...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Add Customer
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={loading}
                            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-bold text-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCustomer;