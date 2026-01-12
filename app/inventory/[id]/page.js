"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Minus, Edit2, Trash2, Save, X, Package, AlertTriangle } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';

const ProductDetails = () => {
    const params = useParams();
    const productId = params.id;
    const router = useRouter();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedProduct, setEditedProduct] = useState(null);
    const [stockInput, setStockInput] = useState('');
    const [showStockModal, setShowStockModal] = useState(false);
    const [stockOperation, setStockOperation] = useState('add');
    const [message, setMessage] = useState({ type: '', text: '' });

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const fetchProductDetails = useCallback(async () => {
        if (!productId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (error) throw error;
            setProduct(data);
            setEditedProduct({ ...data });
        } catch (error) {
            console.error('Error fetching product:', error);
            showMessage('error', 'Failed to load product');
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchProductDetails();
    }, [fetchProductDetails]);

    const handleStockUpdate = async () => {
        const amount = parseInt(stockInput);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid quantity');
            return;
        }

        let newStock = stockOperation === 'add'
            ? product.current_stock + amount
            : Math.max(0, product.current_stock - amount);

        setSaving(true);
        try {
            const { error } = await supabase
                .from('products')
                .update({ current_stock: newStock })
                .eq('id', productId);

            if (error) throw error;
            setProduct(prev => ({ ...prev, current_stock: newStock }));
            setStockInput('');
            setShowStockModal(false);
            showMessage('success', `Stock ${stockOperation === 'add' ? 'added' : 'removed'} successfully!`);
        } catch (error) {
            console.error('Error updating stock:', error);
            alert('Failed to update stock');
        } finally {
            setSaving(false);
        }
    };

    const saveProductChanges = async () => {
        if (!editedProduct.product_name?.trim()) {
            alert('Product name is required');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('products')
                .update({
                    product_name: editedProduct.product_name.trim(),
                    brand: editedProduct.brand?.trim() || null,
                    vehicle_model: editedProduct.vehicle_model?.trim() || null,
                    hsn_code: editedProduct.hsn_code?.trim() || '',
                    part_number: editedProduct.part_number?.trim() || null,
                    purchase_rate: parseFloat(editedProduct.purchase_rate) || 0,
                    selling_rate: parseFloat(editedProduct.selling_rate) || null,
                    gst_percentage: parseFloat(editedProduct.gst_percentage) || 0,
                    discount: parseFloat(editedProduct.discount) || 0,
                    minimum_stock: parseInt(editedProduct.minimum_stock) || 0
                })
                .eq('id', productId);

            if (error) throw error;
            setProduct({ ...editedProduct });
            setIsEditing(false);
            showMessage('success', 'Product updated successfully!');
        } catch (error) {
            console.error('Error updating product:', error);
            alert('Failed to update product');
        } finally {
            setSaving(false);
        }
    };

    const handleEditChange = (field, value) => {
        setEditedProduct(prev => ({ ...prev, [field]: value }));
    };

    const cancelEdit = () => {
        setEditedProduct({ ...product });
        setIsEditing(false);
    };

    const deleteProduct = async () => {
        if (!window.confirm('Delete this product? This cannot be undone.')) return;

        setSaving(true);
        try {
            const { error } = await supabase.from('products').delete().eq('id', productId);
            if (error) throw error;
            alert('Product deleted!');
            router.push('/inventory/search');
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product');
            setSaving(false);
        }
    };

    // Calculate final price with GST
    const calculateFinalPrice = () => {
        const selling = parseFloat(product?.selling_rate) || 0;
        const gst = parseFloat(product?.gst_percentage) || 0;
        const discount = parseFloat(product?.discount) || 0;
        const afterDiscount = selling * (1 - discount / 100);
        return (afterDiscount * (1 + gst / 100)).toFixed(2);
    };

    // Calculate profit margin
    const getProfitInfo = () => {
        const purchase = parseFloat(product?.purchase_rate) || 0;
        const selling = parseFloat(product?.selling_rate) || 0;
        if (purchase && selling) {
            const profit = selling - purchase;
            const percentage = ((profit / purchase) * 100).toFixed(1);
            return { profit, percentage };
        }
        return null;
    };

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading product...</p>
                </div>
            </div>
        );
    }

    // Not Found State
    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Package className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 mb-4">Product not found</p>
                    <Link href="/inventory/search" className="text-purple-600 hover:underline">
                        ← Back to Products
                    </Link>
                </div>
            </div>
        );
    }

    const isLowStock = product.current_stock <= product.minimum_stock;
    const profitInfo = getProfitInfo();

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-3xl mx-auto">

                {/* Back Button */}
                <button onClick={() => router.push('/inventory/search')} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <ArrowLeft size={20} />
                    <span className="font-medium">Back to Products</span>
                </button>

                {/* Success/Error Message */}
                {message.text && (
                    <div className={`mb-4 p-3 rounded-lg text-center text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">

                    {/* Header */}
                    <div className="bg-purple-600 text-white p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedProduct.product_name}
                                        onChange={(e) => handleEditChange('product_name', e.target.value)}
                                        className="text-xl font-bold bg-purple-700 rounded px-2 py-1 w-full"
                                    />
                                ) : (
                                    <h1 className="text-xl font-bold">{product.product_name}</h1>
                                )}
                                <div className="flex gap-3 mt-1 text-purple-200 text-sm">
                                    <span>ID: {product.id.substring(0, 8)}...</span>
                                    {product.part_number && <span>Part#: {product.part_number}</span>}
                                </div>
                            </div>
                            {isLowStock && (
                                <div className="bg-orange-500 px-3 py-1 rounded-full flex items-center gap-1 text-sm">
                                    <AlertTriangle size={16} />
                                    <span>Low Stock</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">

                        {/* Basic Info Section */}
                        <div>
                            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">Basic Info</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Part Number</p>
                                    {isEditing ? (
                                        <input type="text" value={editedProduct.part_number || ''} onChange={(e) => handleEditChange('part_number', e.target.value)} className="w-full p-1 border rounded text-sm" placeholder="Enter part#" />
                                    ) : (
                                        <p className="font-semibold text-sm">{product.part_number || 'N/A'}</p>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Brand</p>
                                    {isEditing ? (
                                        <input type="text" value={editedProduct.brand || ''} onChange={(e) => handleEditChange('brand', e.target.value)} className="w-full p-1 border rounded text-sm" />
                                    ) : (
                                        <p className="font-semibold text-sm">{product.brand || 'N/A'}</p>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Vehicle Model</p>
                                    {isEditing ? (
                                        <input type="text" value={editedProduct.vehicle_model || ''} onChange={(e) => handleEditChange('vehicle_model', e.target.value)} className="w-full p-1 border rounded text-sm" />
                                    ) : (
                                        <p className="font-semibold text-sm">{product.vehicle_model || 'N/A'}</p>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">HSN Code</p>
                                    {isEditing ? (
                                        <input type="text" value={editedProduct.hsn_code || ''} onChange={(e) => handleEditChange('hsn_code', e.target.value)} className="w-full p-1 border rounded text-sm" />
                                    ) : (
                                        <p className="font-semibold text-sm">{product.hsn_code || 'N/A'}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Pricing Section */}
                        <div>
                            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">Pricing & Tax</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Purchase Rate</p>
                                    {isEditing ? (
                                        <input type="number" value={editedProduct.purchase_rate || ''} onChange={(e) => handleEditChange('purchase_rate', e.target.value)} className="w-full p-1 border rounded text-sm" />
                                    ) : (
                                        <p className="font-semibold text-sm text-purple-600">₹{product.purchase_rate?.toLocaleString() || 0}</p>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Selling Rate</p>
                                    {isEditing ? (
                                        <input type="number" value={editedProduct.selling_rate || ''} onChange={(e) => handleEditChange('selling_rate', e.target.value)} className="w-full p-1 border rounded text-sm" />
                                    ) : (
                                        <p className="font-semibold text-sm text-blue-600">₹{product.selling_rate?.toLocaleString() || 'N/A'}</p>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">GST %</p>
                                    {isEditing ? (
                                        <select value={editedProduct.gst_percentage || 0} onChange={(e) => handleEditChange('gst_percentage', e.target.value)} className="w-full p-1 border rounded text-sm">
                                            <option value="0">0%</option>
                                            <option value="5">5%</option>
                                            <option value="12">12%</option>
                                            <option value="18">18%</option>
                                            <option value="28">28%</option>
                                        </select>
                                    ) : (
                                        <p className="font-semibold text-sm">{product.gst_percentage || 0}%</p>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Discount %</p>
                                    {isEditing ? (
                                        <input type="number" value={editedProduct.discount || ''} onChange={(e) => handleEditChange('discount', e.target.value)} className="w-full p-1 border rounded text-sm" />
                                    ) : (
                                        <p className="font-semibold text-sm text-orange-600">{product.discount || 0}%</p>
                                    )}
                                </div>
                            </div>

                            {/* Price Summary */}
                            {product.selling_rate && (
                                <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg flex flex-wrap gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Final Price (with GST):</span>
                                        <span className="ml-2 font-bold text-purple-600">₹{calculateFinalPrice()}</span>
                                    </div>
                                    {profitInfo && (
                                        <div>
                                            <span className="text-gray-500">Profit:</span>
                                            <span className="ml-2 font-bold text-green-600">₹{profitInfo.profit.toFixed(2)} ({profitInfo.percentage}%)</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Stock Section */}
                        <div className={`p-4 rounded-lg border-2 ${isLowStock ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-xs text-gray-600">Current Stock</p>
                                    <p className={`text-3xl font-bold ${isLowStock ? 'text-red-600' : 'text-blue-600'}`}>
                                        {product.current_stock}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-600">Min. Stock Level</p>
                                    {isEditing ? (
                                        <input type="number" value={editedProduct.minimum_stock || 0} onChange={(e) => handleEditChange('minimum_stock', e.target.value)} className="w-16 p-1 border rounded text-right text-sm" />
                                    ) : (
                                        <p className="text-xl font-bold text-orange-500">{product.minimum_stock}</p>
                                    )}
                                </div>
                            </div>

                            {/* Stock Buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => { setStockOperation('add'); setShowStockModal(true); }} className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm">
                                    <Plus size={18} /> Add Stock
                                </button>
                                <button onClick={() => { setStockOperation('remove'); setShowStockModal(true); }} className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm">
                                    <Minus size={18} /> Remove Stock
                                </button>
                            </div>
                        </div>

                        {/* Low Stock Warning */}
                        {isLowStock && (
                            <div className="bg-orange-100 border border-orange-300 text-orange-800 p-3 rounded-lg flex items-center gap-2 text-sm">
                                <AlertTriangle size={20} />
                                <div>
                                    <p className="font-semibold">Low Stock Warning</p>
                                    <p className="text-xs">Stock is at or below minimum level. Reorder soon.</p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-3 border-t">
                            {isEditing ? (
                                <>
                                    <button onClick={saveProductChanges} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm">
                                        {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                                    </button>
                                    <button onClick={cancelEdit} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm">
                                        <X size={16} /> Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setIsEditing(true)} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm">
                                        <Edit2 size={16} /> Edit Product
                                    </button>
                                    <button onClick={deleteProduct} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm">
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stock Modal */}
            {showStockModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm p-5 shadow-xl">
                        <h3 className="text-lg font-bold mb-3">
                            {stockOperation === 'add' ? '➕ Add Stock' : '➖ Remove Stock'}
                        </h3>

                        <p className="text-gray-600 text-sm mb-3">Current stock: <strong>{product.current_stock}</strong></p>

                        <input
                            type="number"
                            min="1"
                            value={stockInput}
                            onChange={(e) => setStockInput(e.target.value)}
                            placeholder="Enter quantity"
                            className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg mb-2 focus:border-purple-500 focus:outline-none"
                            autoFocus
                            onKeyPress={(e) => e.key === 'Enter' && handleStockUpdate()}
                        />

                        {stockInput && (
                            <p className="text-sm text-gray-500 mb-3">
                                New stock: <strong>
                                    {stockOperation === 'add'
                                        ? product.current_stock + parseInt(stockInput || 0)
                                        : Math.max(0, product.current_stock - parseInt(stockInput || 0))}
                                </strong>
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleStockUpdate}
                                disabled={saving || !stockInput}
                                className={`flex-1 py-2.5 rounded-lg font-bold text-white ${stockOperation === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}
                            >
                                {saving ? 'Updating...' : 'Confirm'}
                            </button>
                            <button
                                onClick={() => { setShowStockModal(false); setStockInput(''); }}
                                className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;