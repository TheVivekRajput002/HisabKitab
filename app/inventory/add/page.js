"use client"

import React, { useState, useEffect } from 'react';
import { Plus, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';

const AddProduct = () => {
    const [formData, setFormData] = useState({
        product_name: '',
        vehicle_model: '',
        hsn_code: '',
        brand: '',
        part_number: '',
        purchase_rate: '',
        selling_rate: '',
        gst_percentage: '18',
        discount: '0',
        current_stock: '0',
        minimum_stock: '0'
    });

    const [brandSuggestions, setBrandSuggestions] = useState([]);
    const [vehicleSuggestions, setVehicleSuggestions] = useState([]);
    const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
    const [showVehicleSuggestions, setShowVehicleSuggestions] = useState(false);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const fetchSuggestions = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('brand, vehicle_model');

            if (error) throw error;

            const brands = [...new Set(data.map(p => p.brand).filter(Boolean))];
            const vehicles = [...new Set(data.map(p => p.vehicle_model).filter(Boolean))];

            setBrandSuggestions(brands);
            setVehicleSuggestions(vehicles);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'brand') setShowBrandSuggestions(value.length > 0);
        if (name === 'vehicle_model') setShowVehicleSuggestions(value.length > 0);

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const selectBrandSuggestion = (brand) => {
        setFormData(prev => ({ ...prev, brand }));
        setShowBrandSuggestions(false);
    };

    const selectVehicleSuggestion = (vehicle) => {
        setFormData(prev => ({ ...prev, vehicle_model: vehicle }));
        setShowVehicleSuggestions(false);
    };

    const validateForm = () => {
        const required = ['product_name', 'hsn_code', 'purchase_rate'];
        for (let field of required) {
            if (!formData[field]) {
                setMessage({ type: 'error', text: `${field.replace('_', ' ')} is required` });
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const { data, error } = await supabase
                .from('products')
                .insert([{
                    product_name: formData.product_name,
                    vehicle_model: formData.vehicle_model || null,
                    hsn_code: formData.hsn_code,
                    brand: formData.brand || null,
                    part_number: formData.part_number || null,
                    purchase_rate: parseFloat(formData.purchase_rate) || 0,
                    selling_rate: parseFloat(formData.selling_rate) || null,
                    gst_percentage: parseFloat(formData.gst_percentage) || 0,
                    discount: parseFloat(formData.discount) || 0,
                    current_stock: parseInt(formData.current_stock) || 0,
                    minimum_stock: parseInt(formData.minimum_stock) || 0
                }]);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Product added successfully!' });
            alert("Product Added Successfully ✅");

            // Reset form
            setFormData({
                product_name: '',
                vehicle_model: '',
                hsn_code: '',
                brand: '',
                part_number: '',
                purchase_rate: '',
                selling_rate: '',
                gst_percentage: '18',
                discount: '0',
                current_stock: '0',
                minimum_stock: '0'
            });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to add product: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    // Calculate selling price with GST
    const calculateSellingWithGST = () => {
        const selling = parseFloat(formData.selling_rate) || 0;
        const gst = parseFloat(formData.gst_percentage) || 0;
        const discount = parseFloat(formData.discount) || 0;
        const afterDiscount = selling * (1 - discount / 100);
        const withGST = afterDiscount * (1 + gst / 100);
        return withGST.toFixed(2);
    };

    // Calculate profit margin
    const profitMargin = () => {
        const purchase = parseFloat(formData.purchase_rate) || 0;
        const selling = parseFloat(formData.selling_rate) || 0;
        if (purchase && selling) {
            const profit = selling - purchase;
            const percentage = ((profit / purchase) * 100).toFixed(1);
            return { profit, percentage };
        }
        return { profit: 0, percentage: 0 };
    };

    const { profit, percentage } = profitMargin();

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Back Button */}
            <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back</span>
            </button>

            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Package className="text-purple-600" size={28} />
                        Add New Product
                    </h1>
                    <p className="text-gray-600 mt-1 text-sm">Add products to your inventory</p>
                </div>

                {/* Message Alert */}
                {message.text && (
                    <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        <p>{message.text}</p>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md p-6">
                    {/* Basic Info Section */}
                    <div className="mb-6">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="product_name"
                                    value={formData.product_name}
                                    onChange={handleChange}
                                    placeholder="e.g., Brake Pad Set"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                />
                            </div>

                            {/* Part Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Part Number
                                </label>
                                <input
                                    type="text"
                                    name="part_number"
                                    value={formData.part_number}
                                    onChange={handleChange}
                                    placeholder="e.g., BP-1234-A"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                />
                            </div>

                            {/* Brand */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    onFocus={() => setShowBrandSuggestions(formData.brand.length > 0)}
                                    onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)}
                                    placeholder="e.g., Bosch, TVS"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                    autoComplete="off"
                                />
                                {showBrandSuggestions && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                        {brandSuggestions.filter(b => b.toLowerCase().includes(formData.brand.toLowerCase())).map((brand, i) => (
                                            <div key={i} onClick={() => selectBrandSuggestion(brand)} className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm">{brand}</div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Vehicle Model */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
                                <input
                                    type="text"
                                    name="vehicle_model"
                                    value={formData.vehicle_model}
                                    onChange={handleChange}
                                    onFocus={() => setShowVehicleSuggestions(formData.vehicle_model.length > 0)}
                                    onBlur={() => setTimeout(() => setShowVehicleSuggestions(false), 200)}
                                    placeholder="e.g., Maruti Swift"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                    autoComplete="off"
                                />
                                {showVehicleSuggestions && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                        {vehicleSuggestions.filter(v => v.toLowerCase().includes(formData.vehicle_model.toLowerCase())).map((v, i) => (
                                            <div key={i} onClick={() => selectVehicleSuggestion(v)} className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm">{v}</div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* HSN Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    HSN Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="hsn_code"
                                    value={formData.hsn_code}
                                    onChange={handleChange}
                                    placeholder="e.g., 8708"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing Section */}
                    <div className="mb-6">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Pricing & Tax</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Purchase Rate */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Purchase Rate (₹) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="purchase_rate"
                                    value={formData.purchase_rate}
                                    onChange={handleChange}
                                    placeholder="Cost price"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                />
                            </div>

                            {/* Selling Rate */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Selling Rate (₹)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="selling_rate"
                                    value={formData.selling_rate}
                                    onChange={handleChange}
                                    placeholder="Base MRP"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                />
                            </div>

                            {/* GST */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    GST (%)
                                </label>
                                <select
                                    name="gst_percentage"
                                    value={formData.gst_percentage}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                >
                                    <option value="0">0%</option>
                                    <option value="5">5%</option>
                                    <option value="12">12%</option>
                                    <option value="18">18%</option>
                                    <option value="28">28%</option>
                                </select>
                            </div>

                            {/* Discount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Discount (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="discount"
                                    value={formData.discount}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                />
                            </div>
                        </div>

                        {/* Price Summary */}
                        {formData.selling_rate && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg flex flex-wrap gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Final Price (with GST):</span>
                                    <span className="ml-2 font-bold text-purple-600">₹{calculateSellingWithGST()}</span>
                                </div>
                                {profit > 0 && (
                                    <div>
                                        <span className="text-gray-500">Profit Margin:</span>
                                        <span className="ml-2 font-bold text-green-600">₹{profit.toFixed(2)} ({percentage}%)</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Stock Section */}
                    <div className="mb-6">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Stock</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                                <input
                                    type="number"
                                    name="current_stock"
                                    value={formData.current_stock}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Alert</label>
                                <input
                                    type="number"
                                    name="minimum_stock"
                                    value={formData.minimum_stock}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Adding...
                            </>
                        ) : (
                            <>
                                <Plus size={20} />
                                Add Product
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddProduct;