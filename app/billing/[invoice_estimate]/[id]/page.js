'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { Building2, Edit2, Save, X, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useInvoiceCalculations } from '@/hooks/useInvoiceCalculations';


const InvoiceViewEdit = () => {
    const [gstIncluded, setGstIncluded] = useState(false);
    const params = useParams();
    const id = params?.id;
    const invoice_estimate = params?.invoice_estimate;
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [invoice, setInvoice] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [products, setProducts] = useState([]);
    const { calculateProductTotal, subtotal, totalGST, grandTotal } = useInvoiceCalculations(products, gstIncluded);

    const [photo, setPhoto] = useState(null); // Store photo URL
    const [photoId, setPhotoId] = useState(null); // Store photo record ID
    const [uploadingPhoto, setUploadingPhoto] = useState(false);


    const isInvoice = invoice_estimate === "invoice";

    const calculateGSTDistribution = () => {
        const distribution = {};

        products.forEach(product => {
            let baseAmount;
            let gstAmount;

            if (gstIncluded) {
                const basePrice = product.rate / (1 + product.gstPercentage / 100);
                baseAmount = product.quantity * basePrice;
                gstAmount = (product.quantity * product.rate) - baseAmount;
            } else {
                baseAmount = product.quantity * product.rate;
                gstAmount = (baseAmount * product.gstPercentage) / 100;
            }

            if (product.gstPercentage > 0) {
                const gstKey = `${product.gstPercentage}%`;
                if (!distribution[gstKey]) {
                    distribution[gstKey] = {
                        rate: product.gstPercentage,
                        taxableAmount: 0,
                        cgst: 0,
                        sgst: 0,
                        totalGst: 0
                    };
                }

                distribution[gstKey].taxableAmount += baseAmount;
                distribution[gstKey].cgst += gstAmount / 2;
                distribution[gstKey].sgst += gstAmount / 2;
                distribution[gstKey].totalGst += gstAmount;
            }
        });

        return Object.values(distribution);
    };

    // Store original data for cancel functionality
    const [originalData, setOriginalData] = useState({
        invoice: null,
        products: []
    });

    useEffect(() => {
        fetchInvoiceData();
    }, [id]);

    const fetchInvoiceData = async () => {
        setLoading(true);

        try {
            // Fetch invoice with customer details
            const { data: invoiceData, error: invoiceError } = await supabase
                .from(isInvoice ? 'invoices' : 'estimate')
                .select('*, customer:customers(*)')
                .eq('id', id)
                .single();

            if (invoiceError) throw invoiceError;

            const { data: photoData, error: photoError } = await supabase
                .from('invoice_photos')
                .select('*')
                .eq(isInvoice ? 'invoice_id' : 'estimate_id', id)
                .maybeSingle();

            console.log('🔍 Photo fetch result:', { photoData, photoError, isInvoice, id });

            const photoUrl = photoData?.photo_url || null;

            console.log('📸 Photo URL set to:', photoUrl);

            setPhoto(photoUrl);
            setPhotoId(photoData?.id || null);

            console.log('✅ Photo state updated:', { photo: photoUrl, photoId: photoData?.id });


            setInvoice(invoiceData);
            setCustomer(invoiceData.customer);
            setGstIncluded(invoiceData.gst_included || false);

            // Fetch invoice items
            const { data: itemsData, error: itemsError } = await supabase
                .from(isInvoice ? 'invoice_items' : 'estimate_items')
                .select('*')
                .eq(isInvoice ? 'invoice_id' : 'estimate_id', id)
                .order('serial_number', { ascending: true });

            if (itemsError) throw itemsError;

            const formattedProducts = itemsData.map((item, index) => ({
                id: item.id,
                serialNumber: index + 1,
                productName: item.product_name,
                hsnCode: item.hsn_code,
                quantity: item.quantity,
                rate: item.rate,
                gstPercentage: item.gst_percentage,
                totalAmount: item.total_product
            }));

            setProducts(formattedProducts);

            // Store original data for cancel
            setOriginalData({
                invoice: { ...invoiceData },
                products: JSON.parse(JSON.stringify(formattedProducts))
            });

        } catch (error) {
            console.error('Error loading invoice:', error);
            alert('Error loading invoice: ' + error.message);
            router.push(isInvoice ? '/billing/invoice/search' : '/billing/estimate/search');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (file) => {
        setUploadingPhoto(true);
        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${isInvoice ? 'invoice' : 'estimate'}_${id}_${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('invoice-photos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // If photo already exists, delete old one from storage and DB
            if (photo && photoId) {
                await handlePhotoDelete();
            }

            // Insert new photo record
            const { data: photoRecord, error: insertError } = await supabase
                .from('invoice_photos')
                .insert({
                    [isInvoice ? 'invoice_id' : 'estimate_id']: id,
                    photo_url: fileName
                })
                .select()
                .single();

            if (insertError) throw insertError;

            setPhoto(fileName);
            setPhotoId(photoRecord.id);
            alert('Photo uploaded successfully!');

        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Error uploading photo: ' + error.message);
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handlePhotoDelete = async () => {
        if (!photo || !photoId) return;

        try {
            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('invoice-photos')
                .remove([photo]);

            if (storageError) throw storageError;

            // Delete from database
            const { error: dbError } = await supabase
                .from('invoice_photos')
                .delete()
                .eq('id', photoId);

            if (dbError) throw dbError;

            setPhoto(null);
            setPhotoId(null);
            alert('Photo deleted successfully!');

        } catch (error) {
            console.error('Error deleting photo:', error);
            alert('Error deleting photo: ' + error.message);
        }
    };

    const getPhotoUrl = (path) => {
        console.log('🔗 Getting photo URL for path:', path);
        if (!path) return null;
        const { data } = supabase.storage
            .from('invoice-photos')
            .getPublicUrl(path);
        console.log('🔗 Generated public URL:', data.publicUrl);
        return data.publicUrl;
    };


    const handleProductChange = (productId, field, value) => {
        setProducts(prev => prev.map(product => {
            if (product.id === productId) {
                const updated = { ...product, [field]: value };

                if (['quantity', 'rate', 'gstPercentage'].includes(field)) {
                    const qty = field === 'quantity' ? value : updated.quantity;
                    const rt = field === 'rate' ? value : updated.rate;
                    const gst = field === 'gstPercentage' ? value : updated.gstPercentage;

                    updated.totalAmount = calculateProductTotal(qty, rt, gst);
                }

                return updated;
            }
            return product;
        }));
    };

    const addProduct = () => {
        const newProduct = {
            id: 'new_' + Date.now(),
            serialNumber: products.length + 1,
            productName: '',
            hsnCode: '',
            quantity: 0,
            rate: 0,
            gstPercentage: 18,
            totalAmount: 0,
            isNew: true
        };
        setProducts([...products, newProduct]);
    };

    const removeProduct = (productId) => {
        if (products.length > 1) {
            setProducts(products.filter(p => p.id !== productId));
        } else {
            alert('Invoice must have at least one product');
        }
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            // Update invoice
            const { error: invoiceError } = await supabase
                .from(isInvoice ? 'invoices' : 'estimate')
                .update({
                    bill_date: invoice.bill_date,
                    mode_of_payment: invoice.mode_of_payment,
                    total_amount: grandTotal,
                    gst_included: gstIncluded
                })
                .eq('id', id);

            if (invoiceError) throw invoiceError;

            // Delete all existing invoice items
            const { error: deleteError } = await supabase
                .from(isInvoice ? 'invoice_items' : 'estimate_items')
                .delete()
                .eq(isInvoice ? 'invoice_id' : 'estimate_id', id);

            if (deleteError) throw deleteError;

            // Insert updated products
            const itemsToInsert = products.map((product, index) => ({
                ...(isInvoice
                    ? { invoice_id: id }
                    : { estimate_id: id }
                ),
                serial_number: index + 1,
                product_name: product.productName,
                hsn_code: product.hsnCode,
                quantity: product.quantity,
                rate: product.rate,
                gst_percentage: product.gstPercentage,
                total_product: product.totalAmount
            }));

            const { error: itemsError } = await supabase
                .from(isInvoice ? 'invoice_items' : 'estimate_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            alert(`${isInvoice ? 'Invoice' : 'Estimate'} updated successfully!`);
            setIsEditMode(false);
            fetchInvoiceData(); // Refresh data

        } catch (error) {
            console.error('Error updating invoice:', error);
            alert('Error updating invoice: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        // Restore original data
        setInvoice({ ...originalData.invoice });
        setProducts(JSON.parse(JSON.stringify(originalData.products)));
        setIsEditMode(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading invoice...</p>
                </div>
            </div>
        );
    }

    if (!invoice) return null;

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Action Buttons Bar */}
                <div className="mb-4 flex justify-between items-center">
                    <button
                        onClick={() => router.push(isInvoice ? '/billing/invoice/search' : '/billing/estimate/search')}
                        className="flex items-center px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 shadow"
                    >
                        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Search
                    </button>

                    {!isEditMode ? (
                        <button
                            onClick={() => setIsEditMode(true)}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow"
                        >
                            <Edit2 className="mr-2 w-4 h-4" /> Edit {isInvoice ? 'Invoice' : 'Estimate'}
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleCancel}
                                className="flex items-center px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <X className="mr-2 w-4 h-4" /> Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <Save className="mr-2 w-4 h-4" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Invoice Layout */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header Section */}
                    <div className="border-y-4 border-gray-800">
                        <h2 className="text-xl font-bold text-gray-800 my-6 text-center">{isInvoice ? "TAX INVOICE" : "ESTIMATE"}</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                            {/* Company Details */}
                            <div className="p-6 border-r-2 border-t-2 border-gray-300 ml-1">
                                <div className="flex items-start gap-4">
                                    <div className="w-18 h-18 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Building2 size={34} className="text-gray-800" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-800">Shiv Shakti Automobile</h1>
                                        <p className="text-sm text-gray-600 mt-1">Near new Bus Stand, Vidisha, M.P.</p>
                                        <p className="text-sm text-gray-600">Mobile No. - 9993646020</p>
                                        <p className="text-sm text-gray-600 mt-1">GST: 23AYKPR3166N1ZV</p>
                                    </div>
                                </div>
                            </div>

                            {/* Invoice Details */}
                            <div className="p-6 bg-gray-50 border-t-2 border-gray-300">
                                <div className="space-y-2 mt-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-gray-700">Date:</span>
                                        {isEditMode ? (
                                            <input
                                                type="date"
                                                value={invoice.bill_date}
                                                onChange={(e) => setInvoice({ ...invoice, bill_date: e.target.value })}
                                                className="text-sm px-2 py-1 border border-gray-300 rounded"
                                            />
                                        ) : (
                                            <span className="text-sm text-gray-900">{formatDate(invoice.bill_date)}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between mt-3">
                                        <span className="text-sm font-semibold text-gray-700">
                                            {isInvoice ? "Invoice No:" : "Estimate No:"}
                                        </span>
                                        <span className="text-sm text-gray-900 font-mono">
                                            {isInvoice ? invoice.invoice_number : invoice.estimate_number}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm font-semibold text-gray-700">Created At:</span>
                                        <span className="text-sm text-gray-900">
                                            {new Date(invoice.created_at).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Details Section */}
                    <div className="p-6 border-b-2 border-gray-300 bg-blue-50">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">BILL TO</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                                <div className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-900">
                                    {customer?.phone_number || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name</label>
                                <div className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-900">
                                    {customer?.name || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                                <div className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-900">
                                    {customer?.address || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Number</label>
                                <div className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-900">
                                    {customer?.vehicle || 'N/A'}
                                </div>
                            </div>
                            {invoice.gstin && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">GSTIN</label>
                                    <div className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-900">
                                        {invoice.gstin}
                                    </div>
                                </div>
                            )}
                        </div>
                        {!isEditMode && (
                            <p className="text-xs text-gray-500 mt-3">
                                * Customer details cannot be edited from here
                            </p>
                        )}
                    </div>

                    {/* Products Section */}
                    <div className="p-6 max-md:py-3 max-md:px-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">ITEMS</h3>

                        <div>
                            <div className="border-2 border-gray-300 rounded-lg" style={{ overflow: 'visible' }}>
                                <table className="w-full" style={{ overflow: 'visible' }}>
                                    <thead>
                                        <tr className="bg-gray-800 text-white">
                                            <th className="px-3 py-3 text-left text-sm font-semibold w-10">S.No</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold min-w-[200px] max-md:min-w-[150px]">
                                                Product Name
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold w-32">HSN</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold w-24">Qty</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold w-32 max-md:w-30">Rate</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold w-24">GST %</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold w-32">Amount</th>
                                            {isEditMode && <th className="px-4 py-3 text-center text-sm font-semibold w-12"></th>}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {products.map((product, index) => (
                                            <tr key={product.id} className="border-b border-gray-300 hover:bg-gray-50">
                                                <td className="px-2 py-3 text-sm text-center max-md:px-1">{index + 1}</td>

                                                {/* Product Name */}
                                                <td className="px-2 py-3 max-md:px-1">
                                                    {isEditMode ? (
                                                        <input
                                                            type="text"
                                                            value={product.productName}
                                                            onChange={(e) => handleProductChange(product.id, 'productName', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm">{product.productName}</span>
                                                    )}
                                                </td>

                                                {/* HSN Code */}
                                                <td className="px-2 py-3 max-md:px-1">
                                                    {isEditMode ? (
                                                        <input
                                                            type="text"
                                                            value={product.hsnCode}
                                                            onChange={(e) => handleProductChange(product.id, 'hsnCode', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm">{product.hsnCode}</span>
                                                    )}
                                                </td>

                                                {/* Quantity */}
                                                <td className="px-2 py-3 max-md:px-1">
                                                    {isEditMode ? (
                                                        <input
                                                            type="number"
                                                            value={product.quantity}
                                                            onChange={(e) => handleProductChange(product.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm text-center"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-center block">{product.quantity}</span>
                                                    )}
                                                </td>

                                                {/* Rate */}
                                                <td className="px-2 py-3 max-md:px-1">
                                                    {isEditMode ? (
                                                        <input
                                                            type="number"
                                                            value={product.rate}
                                                            onChange={(e) => handleProductChange(product.id, 'rate', parseFloat(e.target.value) || 0)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm text-right"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-right block">₹{parseFloat(product.rate).toFixed(2)}</span>
                                                    )}
                                                </td>

                                                {/* GST Percentage */}
                                                <td className="px-2 py-3 max-md:px-1">
                                                    {isEditMode ? (
                                                        <select
                                                            value={product.gstPercentage}
                                                            onChange={(e) => handleProductChange(product.id, 'gstPercentage', parseFloat(e.target.value))}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm text-center"
                                                        >
                                                            <option value={0}>0%</option>
                                                            <option value={5}>5%</option>
                                                            <option value={18}>18%</option>
                                                        </select>
                                                    ) : (
                                                        <span className="text-sm text-center block">{product.gstPercentage}%</span>
                                                    )}
                                                </td>

                                                {/* Total Amount */}
                                                <td className="px-2 py-3 text-sm font-semibold text-right max-md:px-1">
                                                    ₹{parseFloat(product.totalAmount).toFixed(2)}
                                                </td>

                                                {/* Remove Button */}
                                                {isEditMode && (
                                                    <td className="px-2 py-3 text-center max-md:px-1">
                                                        <button
                                                            onClick={() => removeProduct(product.id)}
                                                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                                                            disabled={products.length === 1}
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {isEditMode && (
                            <button
                                onClick={addProduct}
                                className="mt-4 flex items-center px-4 py-2 text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 font-semibold"
                            >
                                <Plus className="w-5 h-5 mr-2" /> Add Item
                            </button>
                        )}
                    </div>

                    {/* Total Section */}
                    <div className="p-6 bg-gray-50 border-t-2 border-gray-300">
                        <div className="space-y-6 flex flex-col items-end">


                            {/* Totals */}
                            <div className="space-y-2 w-full md:w-[50%]">
                                <div className="flex justify-between items-center py-2 border-b border-gray-300">
                                    <span className="text-sm font-semibold text-gray-700">Subtotal:</span>
                                    <span className="text-base font-semibold text-gray-900">
                                        ₹{subtotal.toFixed(2)}
                                    </span>
                                </div>

                                {/* GST Distribution */}
                                {calculateGSTDistribution().length > 0 && (
                                    <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">
                                        <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase">GST Breakdown</h4>

                                        {calculateGSTDistribution().map((gst, index) => (
                                            <div key={index} className="mb-3 last:mb-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-semibold text-gray-600">
                                                        GST @ {gst.rate}%
                                                    </span>
                                                    <span className="text-xs font-semibold text-blue-600">
                                                        ₹{gst.totalGst.toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                    <div className="bg-white rounded px-2 py-1">
                                                        <div className="text-gray-500 text-[10px]">Taxable</div>
                                                        <div className="font-medium text-gray-700">₹{gst.taxableAmount.toFixed(2)}</div>
                                                    </div>
                                                    <div className="bg-white rounded px-2 py-1">
                                                        <div className="text-gray-500 text-[10px]">CGST</div>
                                                        <div className="font-medium text-green-600">₹{gst.cgst.toFixed(2)}</div>
                                                    </div>
                                                    <div className="bg-white rounded px-2 py-1">
                                                        <div className="text-gray-500 text-[10px]">SGST</div>
                                                        <div className="font-medium text-green-600">₹{gst.sgst.toFixed(2)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-300">
                                            <span className="text-xs font-bold text-gray-700">Total GST:</span>
                                            <span className="text-sm font-bold text-blue-600">₹{totalGST.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center py-3 bg-gray-800 text-white px-4 rounded-lg">
                                    <span className="text-lg font-bold">GRAND TOTAL:</span>
                                    <span className="text-2xl font-bold">
                                        ₹{grandTotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                        </div>

                        {/* Payment Mode */}
                        {isInvoice && (
                            <div className="w-full md:w-[60%]">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode</label>
                                {isEditMode ? (
                                    <select
                                        value={invoice.mode_of_payment}
                                        onChange={(e) => setInvoice({ ...invoice, mode_of_payment: e.target.value })}
                                        className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 font-medium transition-colors ${invoice.mode_of_payment === 'unpaid'
                                            ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-500'
                                            : invoice.mode_of_payment === 'cash'
                                                ? 'border-green-300 bg-green-50 text-green-700 focus:ring-green-500'
                                                : 'border-blue-300 bg-blue-50 text-blue-700 focus:ring-blue-500'
                                            }`}
                                    >
                                        <option value="unpaid">Unpaid</option>
                                        <option value="cash">Cash</option>
                                        <option value="online">Online</option>
                                    </select>
                                ) : (
                                    <div className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg">
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${invoice.mode_of_payment === 'cash' || invoice.mode_of_payment === 'online'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {invoice.mode_of_payment.toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    {console.log('🎨 Render check:', { photo, isEditMode, condition: (photo || isEditMode) })}


                    {/* Photo Section */}
                    {(photo || isEditMode) && (
                        <div className="p-6 bg-white border-t-2 border-gray-300">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">ATTACHED PHOTO</h3>

                            {photo ? (
                                <div className="space-y-4">
                                    <div className="relative inline-block">
                                        <img
                                            src={getPhotoUrl(photo)}
                                            alt="Invoice attachment"
                                            className="max-w-full h-auto max-h-96 rounded-lg border-2 border-gray-300 shadow-lg"
                                        />
                                        {isEditMode && (
                                            <button
                                                onClick={handlePhotoDelete}
                                                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 shadow-lg"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : isEditMode && (
                                <div className="text-gray-500 text-sm mb-4">No photo attached</div>
                            )}

                            {isEditMode && (
                                <div className="mt-4">
                                    <input
                                        id="photo-upload"
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                handlePhotoUpload(file);
                                                e.target.value = '';
                                            }
                                        }}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => document.getElementById('photo-upload').click()}
                                        disabled={uploadingPhoto}
                                        className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold shadow"
                                    >
                                        {uploadingPhoto ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-5 h-5 mr-2" />
                                                {photo ? 'Replace Photo' : 'Add Photo'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

    );
};

export default InvoiceViewEdit;