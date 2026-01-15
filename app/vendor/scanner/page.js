"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Camera, Upload, X, Check, AlertCircle, Trash2, Edit2, Save, ChevronDown, ChevronUp, Crop, RotateCcw, Loader2, QrCode, ArrowLeft } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';
import { supabase } from '@/utils/supabaseClient';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

// Lazy load ReactCrop for faster initial page load
const ReactCrop = dynamic(() => import('react-image-crop'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" size={32} /></div>
});

// ============================================================================
// UI COMPONENTS
// ============================================================================

function Alert({ children, variant = 'info', className = '' }) {
  const variants = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };
  return <div className={`border rounded-lg p-4 ${variants[variant]} ${className}`}>{children}</div>;
}

function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>{children}</span>;
}

// Progress Steps Component
function ProgressSteps({ currentStep }) {
  const steps = [
    { id: 1, name: 'Upload', icon: Upload },
    { id: 2, name: 'Scanning', icon: Camera },
    { id: 3, name: 'Review', icon: Edit2 },
    { id: 4, name: 'Done', icon: Check }
  ];

  return (
    <div className="flex items-center justify-between mb-6 bg-white rounded-lg shadow p-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-green-500 text-white' :
                isActive ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                {isCompleted ? <Check size={20} /> : <Icon size={20} />}
              </div>
              <span className={`text-xs mt-1 ${isActive ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>{step.name}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS & CONSTANTS
// ============================================================================

const constants = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  GEMINI_MODEL: 'gemini-2.5-flash',
  API_KEY_STORAGE_KEY: 'gemini_api_key'
};

const imageUtils = {
  validateImage: (file) => {
    if (!file) return { valid: false, error: 'No file selected' };
    if (!constants.ALLOWED_IMAGE_TYPES.includes(file.type)) return { valid: false, error: 'Invalid file type. Please upload JPG, PNG, or WEBP.' };
    if (file.size > constants.MAX_IMAGE_SIZE) return { valid: false, error: 'File size exceeds 5MB limit.' };
    return { valid: true };
  },

  convertToBase64: (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  }),

  compressImage: async (file, maxWidth = 1920) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: file.type })), file.type, 0.9);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }),

  getCroppedImage: (image, crop, fileName) => new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    canvas.getContext('2d').drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width * scaleX, crop.height * scaleY);
    canvas.toBlob((blob) => blob ? resolve(new File([blob], fileName || 'cropped-image.jpg', { type: 'image/jpeg' })) : reject(new Error('Canvas is empty')), 'image/jpeg', 0.95);
  })
};

// ============================================================================
// IMAGE UPLOAD WITH CAMERA CAPTURE
// ============================================================================

function ImageUpload({ onImageSelect, isProcessing, imagePreview, onCropClick }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = imageUtils.validateImage(file);
    if (!validation.valid) { alert(validation.error); return; }
    const compressedFile = await imageUtils.compressImage(file);
    onImageSelect(compressedFile);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      {!imagePreview ? (
        <div className="space-y-4">
          {/* Drag & Drop / File Upload */}
          <label className="flex flex-col items-center justify-center w-full h-120 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
            <Upload className="w-10 h-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-gray-400">PNG, JPG, WEBP (MAX. 5MB)</p>
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isProcessing} />
          </label>

          {/* Camera Capture Button (Mobile) */}
          <div className="flex gap-2">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isProcessing}
            >
              <Camera size={20} />
              Take Photo
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
          </div>
        </div>
      ) : (
        <div className="relative">
          <img
            src={imagePreview}
            alt="Invoice preview"
            className="w-full rounded-lg max-h-120 object-contain"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button onClick={onCropClick} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-lg" disabled={isProcessing} title="Crop Image">
              <Crop size={20} />
            </button>
            <button onClick={() => onImageSelect(null)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg" disabled={isProcessing} title="Remove Image">
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// IMAGE CROPPER
// ============================================================================

function ImageCropper({ imageSrc, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) { onCancel(); return; }
    try {
      const croppedFile = await imageUtils.getCroppedImage(imgRef.current, completedCrop, 'cropped-invoice.jpg');
      onCropComplete(croppedFile);
    } catch { onCancel(); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <Crop className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Crop Image</h2>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center">
          <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)} className="max-h-[70vh]">
            <img ref={imgRef} src={imageSrc} alt="Crop preview" style={{ maxHeight: '70vh', maxWidth: '100%' }} onLoad={(e) => {
              const { width, height } = e.currentTarget;
              setCrop({ unit: 'px', width: width * 0.9, height: height * 0.9, x: width * 0.05, y: height * 0.05 });
            }} />
          </ReactCrop>
        </div>
        <div className="p-4 border-t flex gap-3 bg-gray-50">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2">
            <RotateCcw size={18} /> Cancel
          </button>
          <button onClick={handleCropComplete} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
            <Check size={18} /> Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SERVICES
// ============================================================================

const geminiService = {
  extractProductsFromImage: async (imageBase64) => {
    const response = await fetch('/api/scan-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 })
    });

    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error || 'Failed to scan invoice');
    }

    const { rawText } = await response.json();

    if (!rawText) throw new Error('No response from AI');
    // Helper to extract and clean JSON

    const extractJsonArray = (text) => {
      if (!text) return null;

      // Look for OBJECT not array
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1 || end <= start) return null;

      let jsonStr = text.substring(start, end + 1);

      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

      // Fix escaped quotes and newlines
      jsonStr = jsonStr.replace(/\\"/g, '"').replace(/\\n/g, '');

      return jsonStr;
    };

    // REPLACE the parsing logic (around line 290-320)
    let jsonData = null;
    let jsonString = extractJsonArray(rawText); // Now gets the full object


    if (jsonString) {
      try {
        jsonData = JSON.parse(jsonString);
      } catch (e) {
        console.warn('Direct parse failed:', e.message);
        try {
          const fixedString = jsonString.replace(/,\s*([\]}])/g, '$1');
          jsonData = JSON.parse(fixedString);
        } catch (e2) {
          console.error('Fixed parse failed:', e2.message);
        }
      }
    }

    // Check if we got valid data
    if (!jsonData || !jsonData.products || !Array.isArray(jsonData.products)) {
      console.error('Failed to parse response. Raw:', rawText);
      throw new Error('Failed to parse AI response. Check console for details.');
    }

    // Extract vendor and invoice data
    const vendorData = jsonData.vendor || {};
    const invoiceData = jsonData.invoice || {};

    console.log('Extracted Vendor:', vendorData);
    console.log('Extracted Invoice:', invoiceData);

    // Map products (this part stays mostly the same)
    const products = jsonData.products.map((p, index) => ({
      id: `product_${Date.now()}_${index}`,
      name: p.name || p.product_name || 'Unknown Product',
      part_number: p.part_number || '',
      quantity: Number(p.quantity) || Number(p.qty) || 1,
      hsn_code: p.hsn_code || p.hsn || '0000',
      price: Number(p.price) || Number(p.rate) || Number(p.unit_price) || 0,
      selling_rate: Number(p.selling_rate) || Number(p.mrp) || 0,
      gst_percentage: Number(p.gst_percentage) || Number(p.tax) || 0,
      discount: Number(p.discount) || 0,
      unit: p.unit || 'pcs',
      confidence: Number(p.confidence) || 0.7,
      edited: false
    }));

    // Return both products and metadata
    return {
      products,
      vendor: vendorData,
      invoice: invoiceData
    };
  }
};

const validationService = {
  validateProduct: (product) => {
    const errors = [];
    if (!product.name?.trim()) errors.push('Name required');
    if (product.quantity <= 0) errors.push('Quantity must be > 0');
    if (product.price < 0) errors.push('Price must be >= 0');
    return { valid: errors.length === 0, errors };
  },
  validateBatch: (products) => {
    const results = products.map(p => ({ id: p.id, ...validationService.validateProduct(p) }));
    return { allValid: results.every(r => r.valid), totalErrors: results.reduce((s, r) => s + r.errors.length, 0), results };
  }
};

const productService = {
  // Check if products already exist in database
  checkDuplicates: async (products) => {

    // Fetch all matching products in ONE query
    const productNames = products.map(p => p.name.trim());
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id, product_name, current_stock, purchase_rate')
      .in('product_name', productNames); // Single query!

    // Map results
    const productMap = new Map(
      existingProducts.map(p => [p.product_name.toLowerCase(), p])
    );

    return products.map(p => {
      const existing = productMap.get(p.name.toLowerCase());
      return existing
        ? { ...p, isDuplicate: true, existingId: existing.id, existingStock: existing.current_stock }
        : { ...p, isDuplicate: false };
    });

  },

  createPurchaseTransaction: async (products, vendorData, invoiceData) => {
    const results = {
      created: 0,
      updated: 0,
      errors: [],
      details: [],
      vendorCreated: false,
      billCreated: false,
      vendorName: null,
      billNumber: null
    };

    try {
      // ========================================================================
      // STEP 1: Handle Vendor (Create or Find)
      // ========================================================================
      let vendorId = null;

      if (vendorData && vendorData.name) {
        // First, try to find existing vendor by GSTIN (if provided)
        if (vendorData.gstin) {
          const { data: existingVendor } = await supabase
            .from('vendors')
            .select('id, name')
            .eq('gstin', vendorData.gstin)
            .single();

          if (existingVendor) {
            vendorId = existingVendor.id;
            results.vendorName = existingVendor.name;
          }
        }

        // If not found by GSTIN, try by name
        if (!vendorId) {
          const { data: existingVendor } = await supabase
            .from('vendors')
            .select('id, name')
            .ilike('name', vendorData.name)
            .single();

          if (existingVendor) {
            vendorId = existingVendor.id;
            results.vendorName = existingVendor.name;
          }
        }

        // If still not found, create new vendor
        if (!vendorId) {
          const { data: newVendor, error: vendorError } = await supabase
            .from('vendors')
            .insert({
              name: vendorData.name,
              gstin: vendorData.gstin || null
            })
            .select('id, name')
            .single();

          if (vendorError) throw new Error(`Vendor creation failed: ${vendorError.message}`);

          vendorId = newVendor.id;
          results.vendorCreated = true;
          results.vendorName = newVendor.name;
        }
      }

      // ========================================================================
      // STEP 2: Create Vendor Bill (if vendor exists and invoice data provided)
      // ========================================================================
      let billId = null;

      if (vendorId && invoiceData && invoiceData['bill number']) {
        const { data: newBill, error: billError } = await supabase
          .from('vendor_bills')
          .insert({
            vendor_id: vendorId,
            bill_number: invoiceData['bill number'],
            bill_date: invoiceData['bill date'] || new Date().toISOString().split('T')[0],
            total_amount: invoiceData['total amount'] || 0,
            payment_status: 'unpaid',
            notes: 'Created from invoice scanner'
          })
          .select('id, bill_number')
          .single();

        if (billError) {
          // Check if it's a duplicate bill error
          if (billError.code === '23505') {
            throw new Error(`Duplicate bill: Bill number "${invoiceData['bill number']}" already exists for this vendor`);
          }
          throw new Error(`Bill creation failed: ${billError.message}`);
        }

        billId = newBill.id;
        results.billCreated = true;
        results.billNumber = newBill.bill_number;
      }

      // ========================================================================
      // STEP 3: Process Products (Create New / Update Existing)
      // ========================================================================
      const newProducts = products.filter(p => !p.isDuplicate);
      const updates = products.filter(p => p.isDuplicate);
      const productIdMap = new Map(); // Map product names to IDs for bill items

      // Insert new products
      if (newProducts.length > 0) {
        const { data: insertedProducts, error: insertError } = await supabase
          .from('products')
          .insert(
            newProducts.map(p => ({
              product_name: p.name,
              part_number: p.part_number || null,
              purchase_rate: p.price,
              selling_rate: p.selling_rate || null,
              gst_percentage: p.gst_percentage || 0,
              discount: p.discount || 0,
              current_stock: p.quantity,
              hsn_code: p.hsn_code || '0000',
              brand: '',
              vehicle_model: '',
              minimum_stock: 0
            }))
          )
          .select('id, product_name');

        if (insertError) throw new Error(`Product creation failed: ${insertError.message}`);

        results.created = insertedProducts.length;
        insertedProducts.forEach((product, index) => {
          productIdMap.set(product.product_name, product.id);
          results.details.push({
            name: product.product_name,
            action: 'created',
            stock: newProducts[index].quantity
          });
        });
      }

      // Update existing products
      if (updates.length > 0) {
        await Promise.all(
          updates.map(async (p) => {
            const newStock = (p.existingStock || 0) + p.quantity;

            const { error: updateError } = await supabase
              .from('products')
              .update({
                current_stock: newStock,
                purchase_rate: p.price
              })
              .eq('id', p.existingId);

            if (updateError) throw new Error(`Product update failed: ${updateError.message}`);

            productIdMap.set(p.name, p.existingId);
            results.updated++;
            results.details.push({
              name: p.name,
              action: 'updated',
              oldStock: p.existingStock,
              added: p.quantity,
              newStock: newStock
            });
          })
        );
      }

      // ========================================================================
      // STEP 4: Create Bill Items (if bill was created)
      // ========================================================================
      if (billId) {
        const billItems = products.map(p => {
          const productId = productIdMap.get(p.name);
          const totalAmount = p.quantity * p.price * (1 + (p.gst_percentage || 0) / 100);

          return {
            vendor_bill_id: billId,
            product_id: productId || null,
            quantity: p.quantity,
            purchase_rate: p.price,
            gst_percentage: p.gst_percentage || 0,
            total_amount: totalAmount
          };
        });

        const { error: billItemsError } = await supabase
          .from('vendor_bill_items')
          .insert(billItems);

        if (billItemsError) throw new Error(`Bill items creation failed: ${billItemsError.message}`);
      }

      // ========================================================================
      // STEP 5: Upload Invoice Photo (if bill was created and photo exists)
      // ========================================================================
      if (billId && invoiceData.photoFile) {
        try {
          // Generate unique filename
          const fileExt = invoiceData.photoFile.name.split('.').pop();
          const fileName = `vendor_${vendorId}_bill_${billId}_${Date.now()}.${fileExt}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('vendor-photos')
            .upload(fileName, invoiceData.photoFile);

          if (uploadError) throw uploadError;

          // Update vendor_bills with photo_url
          const { error: photoError } = await supabase
            .from('vendor_bills')
            .update({ photo_url: fileName })
            .eq('id', billId);

          if (photoError) throw photoError;

          results.photoUploaded = true;
        } catch (photoErr) {
          console.error('Photo upload error:', photoErr);
          // Don't fail the entire transaction if photo upload fails
          results.photoError = photoErr.message;
        }
      }

      return results;

    } catch (error) {
      // If any error occurs, log it and return error in results
      console.error('Transaction error:', error);
      results.errors.push({
        name: 'Transaction',
        error: error.message
      });
      return results;
    }
  }
};

// ============================================================================
// QR CODE GENERATION SERVICE
// ============================================================================

const qrCodeService = {
  // Generate QR code payload for a product
  generateProductPayload: (product, vendorName, partNumber) => {
    return JSON.stringify({
      SKU: partNumber || product.part_number || `SKU-${Date.now()}`,
      Name: product.name,
      PurchaseRate: product.price,
      Vendor: vendorName || 'Unknown Vendor',
    });
  },

  // Generate QR code data URL from payload
  generateQRCodeDataURL: async (payload) => {
    try {
      const dataURL = await QRCode.toDataURL(payload, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return dataURL;
    } catch (error) {
      console.error('QR Code generation error:', error);
      throw error;
    }
  },

  // Generate PDF with QR codes for all products
  generateQRCodesPDF: async (products, vendorName) => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const qrSize = 40; // QR code size in mm
      const labelHeight = 15; // Height for product label
      const itemHeight = qrSize + labelHeight;
      const itemsPerRow = 4;
      const itemWidth = (pageWidth - (margin * 2)) / itemsPerRow;

      let currentX = margin;
      let currentY = margin;
      let itemCount = 0;

      // Generate QR codes for each product (repeated by quantity)
      for (const product of products) {
        const quantity = Math.floor(product.quantity);

        for (let i = 0; i < quantity; i++) {
          // Check if we need a new page
          if (currentY + itemHeight > pageHeight - margin) {
            pdf.addPage();
            currentY = margin;
            currentX = margin;
            itemCount = 0;
          }

          // Check if we need a new row
          if (itemCount > 0 && itemCount % itemsPerRow === 0) {
            currentY += itemHeight + 5;
            currentX = margin;
          }

          // Generate QR code payload
          const payload = qrCodeService.generateProductPayload(
            product,
            vendorName,
            product.part_number
          );

          // Generate QR code data URL
          const qrDataURL = await qrCodeService.generateQRCodeDataURL(payload);

          // Add QR code to PDF
          pdf.addImage(qrDataURL, 'PNG', currentX + (itemWidth - qrSize) / 2, currentY, qrSize, qrSize);

          // Add product name below QR code
          pdf.setFontSize(8);
          pdf.setFont(undefined, 'bold');
          const productName = product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name;
          pdf.text(productName, currentX + itemWidth / 2, currentY + qrSize + 4, { align: 'center' });

          // Add price
          pdf.setFont(undefined, 'normal');
          pdf.text(`₹${product.price.toFixed(2)}`, currentX + itemWidth / 2, currentY + qrSize + 8, { align: 'center' });

          // Add item number (e.g., "1 of 3")
          pdf.setFontSize(6);
          pdf.text(`${i + 1}/${quantity}`, currentX + itemWidth / 2, currentY + qrSize + 11, { align: 'center' });

          currentX += itemWidth;
          itemCount++;
        }
      }

      // Save PDF
      const fileName = `QR_Codes_${vendorName || 'Products'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }
};

// ============================================================================
// VENDOR & INVOICE DETAILS CARD
// ============================================================================

const VendorInvoiceCard = React.memo(({ vendorData, invoiceData, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ vendor: vendorData || {}, invoice: invoiceData || {} });

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  // If no data, don't render
  if (!vendorData && !invoiceData) return null;

  return (
    <div className="rounded-lg shadow-md p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="info">📄 Invoice Details</Badge>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
              <Save size={18} />
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
              <Edit2 size={18} />
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {/* Vendor Section */}
          <div className="bg-white rounded-lg p-3">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Vendor Name</label>
                <input
                  type="text"
                  value={editData.vendor.name || ''}
                  onChange={(e) => setEditData({ ...editData, vendor: { ...editData.vendor, name: e.target.value } })}
                  placeholder="Vendor Name"
                  className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">GSTIN</label>
                <input
                  type="text"
                  value={editData.vendor.gstin || ''}
                  onChange={(e) => setEditData({ ...editData, vendor: { ...editData.vendor, gstin: e.target.value } })}
                  placeholder="GSTIN"
                  className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Invoice Section */}
          <div className="bg-white rounded-lg p-3">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500">Bill Number</label>
                <input
                  type="text"
                  value={editData.invoice['bill number'] || ''}
                  onChange={(e) => setEditData({ ...editData, invoice: { ...editData.invoice, 'bill number': e.target.value } })}
                  placeholder="Bill Number"
                  className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Bill Date</label>
                <input
                  type="date"
                  value={editData.invoice['bill date'] || ''}
                  onChange={(e) => setEditData({ ...editData, invoice: { ...editData.invoice, 'bill date': e.target.value } })}
                  className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Total Amount</label>
                <input
                  type="number"
                  value={editData.invoice['total amount'] || ''}
                  onChange={(e) => setEditData({ ...editData, invoice: { ...editData.invoice, 'total amount': parseFloat(e.target.value) } })}
                  placeholder="Total Amount"
                  className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Vendor Display */}
          {vendorData && Object.keys(vendorData).length > 0 && (
            <div className="bg-white rounded-lg p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {vendorData.name && (
                  <div className="flex justify-around">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900">{vendorData.name}</span>
                  </div>
                )}
                {vendorData.gstin && (
                  <div className="flex justify-around">
                    <span className="text-gray-600">GSTIN:</span>
                    <span className="font-medium text-gray-900 font-mono">{vendorData.gstin}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invoice Display */}
          {invoiceData && Object.keys(invoiceData).length > 0 && (
            <div className="bg-white rounded-lg p-3">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                {invoiceData['bill number'] && (
                  <div className="flex justify-around">
                    <span className="text-gray-600">Bill No:</span>
                    <span className="font-medium text-gray-900">{invoiceData['bill number']}</span>
                  </div>
                )}
                {invoiceData['bill date'] && (
                  <div className="flex justify-around">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">{invoiceData['bill date']}</span>
                  </div>
                )}
                {invoiceData['total amount'] && (
                  <div className="flex justify-around">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-green-600">₹{Number(invoiceData['total amount']).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ============================================================================
// PRODUCT CARD
// ============================================================================

const ProductCard = React.memo(({ product, onUpdate, onDelete, isSelected, onToggleSelect }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(product);

  const handleSave = () => { onUpdate(product.id, editData); setIsEditing(false); };
  const validation = validationService.validateProduct(editData);
  const confidenceColor = product.confidence >= 0.8 ? 'success' : product.confidence >= 0.6 ? 'warning' : 'error';

  return (
    <div className={`rounded-lg shadow p-4 ${isSelected ? 'ring-2 ring-blue-500' : ''} ${product.isDuplicate ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-green-50 border-2 border-green-300'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <input type="checkbox" checked={isSelected} onChange={(e) => onToggleSelect(product.id, e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
          {/* Duplicate Status Badge */}
          {product.isDuplicate ? (
            <Badge variant="warning">🔄 EXISTS</Badge>
          ) : (
            <Badge variant="success">✨ NEW</Badge>
          )}
          <Badge variant={confidenceColor}>{Math.round(product.confidence * 100)}%</Badge>
          {product.edited && <Badge variant="info">Edited</Badge>}
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <button onClick={handleSave} disabled={!validation.valid} className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"><Save size={18} /></button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={18} /></button>
          )}
          <button onClick={() => onDelete(product.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} placeholder="Product name" className="w-full px-3 py-2 border rounded-lg bg-white" />
            <input type="text" value={editData.part_number || ''} onChange={(e) => setEditData({ ...editData, part_number: e.target.value })} placeholder="Part Number" className="w-full px-3 py-2 border rounded-lg bg-white" />
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <div className="col-span-1">
              <label className="text-xs text-gray-500">Qty</label>
              <input type="number" value={editData.quantity} onChange={(e) => setEditData({ ...editData, quantity: parseFloat(e.target.value) })} placeholder="Qty" className="w-full px-2 py-1 border rounded bg-white" />
            </div>
            <div className="col-span-1">
              <label className="text-xs text-gray-500">Buy Rate</label>
              <input type="number" value={editData.price} onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })} placeholder="Rate" className="w-full px-2 py-1 border rounded bg-white" />
            </div>
            <div className="col-span-1">
              <label className="text-xs text-gray-500">Sell Rate</label>
              <input type="number" value={editData.selling_rate || ''} onChange={(e) => setEditData({ ...editData, selling_rate: parseFloat(e.target.value) })} placeholder="MRP" className="w-full px-2 py-1 border rounded bg-white" />
            </div>
            <div className="col-span-1">
              <label className="text-xs text-gray-500">GST %</label>
              <select value={editData.gst_percentage || 0} onChange={(e) => setEditData({ ...editData, gst_percentage: parseFloat(e.target.value) })} className="w-full px-2 py-1 border rounded bg-white text-sm">
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="text-xs text-gray-500">Disc %</label>
              <input type="number" value={editData.discount || ''} onChange={(e) => setEditData({ ...editData, discount: parseFloat(e.target.value) })} placeholder="%" className="w-full px-2 py-1 border rounded bg-white" />
            </div>
            <div className="col-span-1">
              <label className="text-xs text-gray-500">HSN</label>
              <input type="text" value={editData.hsn_code || ''} onChange={(e) => setEditData({ ...editData, hsn_code: e.target.value })} placeholder="HSN" className="w-full px-2 py-1 border rounded bg-white" />
            </div>
          </div>
          {!validation.valid && <Alert variant="error" className="text-xs">{validation.errors.join(', ')}</Alert>}
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-semibold text-gray-800">{product.name}</h3>
            {product.part_number && <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded text-gray-600">#{product.part_number}</span>}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Qty:</span> <span className="font-medium text-gray-900">{product.quantity} {product.unit}</span>
            </div>
            <div className="flex justify-between">
              <span>Buy Rate:</span> <span className="font-medium text-gray-900">₹{product.price.toFixed(2)}</span>
            </div>
            {product.selling_rate > 0 && (
              <div className="flex justify-between">
                <span>Sell Rate:</span> <span className="font-medium text-blue-600">₹{product.selling_rate.toFixed(2)}</span>
              </div>
            )}
            {(product.gst_percentage > 0 || product.discount > 0) && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Tax/Disc:</span>
                <span>
                  {product.gst_percentage > 0 && `GST ${product.gst_percentage}%`}
                  {product.gst_percentage > 0 && product.discount > 0 && ' | '}
                  {product.discount > 0 && `Disc ${product.discount}%`}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 mt-1 pt-1 col-span-2">
              <span>Total Value:</span>
              <span className="font-bold text-gray-900">₹{(product.quantity * product.price).toFixed(2)}</span>
            </div>
          </div>


          {/* Stock Update Preview */}
          {product.isDuplicate && (
            <div className="mt-3 p-2 bg-yellow-100 rounded-lg text-sm">
              <div className="flex justify-between items-center">
                <span className="text-yellow-800">📦 Current Stock:</span>
                <span className="font-bold text-yellow-900">{product.existingStock}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-yellow-800">➕ Adding:</span>
                <span className="font-bold text-green-700">+{product.quantity}</span>
              </div>
              <div className="flex justify-between items-center mt-1 pt-1 border-t border-yellow-300">
                <span className="text-yellow-800 font-semibold">📊 New Stock:</span>
                <span className="font-bold text-blue-700">{product.existingStock + product.quantity}</span>
              </div>
            </div>
          )}

          {!product.isDuplicate && (
            <div className="mt-3 p-2 bg-green-100 rounded-lg text-sm">
              <div className="flex justify-between items-center">
                <span className="text-green-800">🆕 Will be created with stock:</span>
                <span className="font-bold text-green-900">{product.quantity}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id &&
    prevProps.isSelected === nextProps.isSelected;
});

// ============================================================================
// BULK ACTIONS PANEL
// ============================================================================

function BulkActionsPanel({ selectedIds, products, onDeleteSelected, onSelectAll, onDeselectAll }) {
  const [isExpanded, setIsExpanded] = useState(true);
  if (products.length === 0) return null;

  return (
    <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-blue-100 rounded">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <span className="text-sm font-medium text-gray-700">{selectedIds.length} of {products.length} selected</span>
        </div>
        {isExpanded && (
          <div className="flex gap-2">
            <button onClick={onSelectAll} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Select All</button>
            <button onClick={onDeselectAll} className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">Clear</button>
            {selectedIds.length > 0 && (
              <button onClick={onDeleteSelected} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1">
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CONFIRMATION MODAL
// ============================================================================

function ConfirmationModal({ products, onConfirm, onCancel, isProcessing }) {
  const validation = validationService.validateBatch(products);
  const total = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Confirm Products</h2>
          <p className="text-gray-600 text-sm">Review before adding to inventory</p>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {!validation.allValid && (
            <Alert variant="error" className="mb-4 text-sm">
              <AlertCircle className="inline mr-2" size={16} />
              {validation.totalErrors} error(s) found. Fix before confirming.
            </Alert>
          )}

          <div className="space-y-2 mb-4">
            {products.map((product) => (
              <div key={product.id} className="p-3 rounded-lg bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-800">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.quantity} {product.unit} × ₹{product.price}</p>
                </div>
                <span className="font-bold text-blue-600">₹{(product.quantity * product.price).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
            <span className="font-bold text-lg">Total:</span>
            <span className="font-bold text-lg text-green-600">₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="p-4 border-t flex gap-3">
          <button onClick={onCancel} disabled={isProcessing} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={!validation.allValid || isProcessing} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {isProcessing ? <><Loader2 className="animate-spin" size={18} /> Adding...</> : <><Check size={18} /> Add to Inventory</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN INVOICE SCANNER
// ============================================================================

export default function InvoiceScanner() {
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [products, setProducts] = useState([]);
  const [vendorData, setVendorData] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [error, setError] = useState(null);

  // qr code data 
  const payload = JSON.stringify({
    SKU: "a1b2c3",
    Name: "bosch",
    MRP: "10001",
    Vendor: "BK engineering",
  })

  // const payload = JSON.stringify({
  //   inv: invoice.invoice_no,
  //   dt: invoice.created_at,
  //   amt: invoice.total_amount,
  //   gst: invoice.gst_rate,
  //   v: 1,
  // })


  const handleImageSelect = useCallback((file) => {
    if (!file) {
      setImage(null);
      setImagePreview(null);
      setProducts([]);
      setVendorData(null);
      setInvoiceData(null);
      setError(null);
      return;
    }
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleUpdateProduct = useCallback((id, data) => {
    setProducts(ps => ps.map(p => p.id === id ? { ...data, id, edited: true } : p));
  }, []);

  const handleDeleteProduct = useCallback((id) => {
    setProducts(ps => ps.filter(p => p.id !== id));
    setSelectedIds(ss => ss.filter(s => s !== id));
  }, []);

  const handleToggleSelect = useCallback((id, checked) => {
    setSelectedIds(ss => checked ? [...ss, id] : ss.filter(s => s !== id));
  }, []);

  const handleScan = async () => {
    if (!image) { setError('Please upload an image'); return; }

    setIsProcessing(true);
    setError(null);

    try {
      const base64 = await imageUtils.convertToBase64(image);
      const extractedData = await geminiService.extractProductsFromImage(base64);

      if (extractedData.products.length === 0) {
        setError('No products found. Try a clearer image.');
      } else {
        const enrichedProducts = await productService.checkDuplicates(extractedData.products);
        setProducts(enrichedProducts);
        setVendorData(extractedData.vendor);
        setInvoiceData(extractedData.invoice);
      }
    } catch (err) {
      console.error('Scan error:', err);

      if (err.message.includes('API key')) {
        setError('⚠️ API key invalid. Check server configuration.');
      } else if (err.message.includes('Network')) {
        setError('🌐 Network error. Check your connection.');
      } else if (err.message.includes('parse')) {
        setError('📄 Failed to read invoice. Try a clearer image.');
      } else {
        setError(`❌ Error: ${err.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      // Add photo file to invoice data
      const invoiceDataWithPhoto = {
        ...invoiceData,
        photoFile: image // Add the scanned image file
      };

      const results = await productService.createPurchaseTransaction(products, vendorData, invoiceDataWithPhoto);

      // Check for errors first
      if (results.errors.length > 0) {
        const errorMessage = results.errors.map(e => `❌ ${e.name}: ${e.error}`).join('\n');
        alert(errorMessage);
        setIsProcessing(false);
        return;
      }

      // Build success message
      let message = '✅ Purchase Transaction Completed!\n\n';

      // Vendor info
      if (results.vendorName) {
        if (results.vendorCreated) {
          message += `🆕 New Vendor Created: ${results.vendorName}\n`;
        } else {
          message += `🏢 Vendor: ${results.vendorName}\n`;
        }
      }

      // Bill info
      if (results.billCreated && results.billNumber) {
        message += `📄 Bill Created: ${results.billNumber}\n`;
      }

      message += '\n';

      // Product info
      if (results.created > 0) message += `✅ ${results.created} new product(s) added\n`;
      if (results.updated > 0) message += `🔄 ${results.updated} existing product(s) stock updated\n`;

      if (results.details.length > 0) {
        message += '\nProduct Details:\n';
        results.details.forEach(d => {
          if (d.action === 'updated') {
            message += `• ${d.name}: ${d.oldStock} → ${d.newStock} (+${d.added})\n`;
          } else {
            message += `• ${d.name}: Created with stock ${d.stock}\n`;
          }
        });
      }

      alert(message || 'Operation completed!');
      setProducts([]);
      setVendorData(null);
      setInvoiceData(null);
      setImage(null);
      setImagePreview(null);
      setShowConfirmation(false);
    } catch (err) {
      setError(err.message || 'Failed to add products');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateQRCodes = async () => {
    if (products.length === 0) {
      alert('No products to generate QR codes for');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await qrCodeService.generateQRCodesPDF(products, vendorData?.name);
      alert(`✅ QR Codes PDF generated successfully!\nFile: ${result.fileName}`);
    } catch (error) {
      alert(`❌ Failed to generate QR codes: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/vendor')}
          className="mb-4 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={18} />
          Back to Vendors
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">Invoice Scanner</h1>

        {/* <InvoiceQR payload={payload} /> */}

        {error && <Alert variant="error" className="mb-4"><AlertCircle className="inline mr-2" size={16} />{error}</Alert>}

        {/* Side-by-side layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT: Image Upload Section */}
          <div className="space-y-4">
            <ImageUpload
              onImageSelect={handleImageSelect}
              isProcessing={isProcessing}
              imagePreview={imagePreview}
              onCropClick={() => setShowCropper(true)}
            />

            {imagePreview && products.length === 0 && (
              <button
                onClick={handleScan}
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Scanning...</> : <><Camera size={20} /> Scan Invoice</>}
              </button>
            )}
          </div>

          {/* RIGHT: Products List Section */}
          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                <Camera size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No products scanned yet</p>
                <p className="text-sm mt-1">Upload an invoice and click "Scan Invoice" to extract products</p>
              </div>
            ) : (
              <>
                {/* Vendor & Invoice Details Card */}
                <VendorInvoiceCard
                  vendorData={vendorData}
                  invoiceData={invoiceData}
                  onUpdate={(data) => {
                    setVendorData(data.vendor);
                    setInvoiceData(data.invoice);
                  }}
                />

                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Scanned Products ({products.length})</h2>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      ✨ {products.filter(p => !p.isDuplicate).length} New
                    </span>
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                      🔄 {products.filter(p => p.isDuplicate).length} Existing
                    </span>
                  </div>
                </div>

                <BulkActionsPanel
                  selectedIds={selectedIds}
                  products={products}
                  onDeleteSelected={() => { setProducts(ps => ps.filter(p => !selectedIds.includes(p.id))); setSelectedIds([]); }}
                  onSelectAll={() => setSelectedIds(products.map(p => p.id))}
                  onDeselectAll={() => setSelectedIds([])}
                />

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onUpdate={handleUpdateProduct}
                      onDelete={handleDeleteProduct}
                      isSelected={selectedIds.includes(product.id)}
                      onToggleSelect={handleToggleSelect}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setShowConfirmation(true)}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                >
                  <Check size={20} /> Add {products.length} Products to Inventory
                </button>
                <button
                  onClick={handleGenerateQRCodes}
                  disabled={isProcessing}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode size={20} /> Generate QR Codes PDF
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {showConfirmation && <ConfirmationModal products={products} onConfirm={handleConfirm} onCancel={() => setShowConfirmation(false)} isProcessing={isProcessing} />}
        {showCropper && imagePreview && <ImageCropper imageSrc={imagePreview} onCropComplete={(f) => { handleImageSelect(f); setShowCropper(false); }} onCancel={() => setShowCropper(false)} />}
      </div>
    </div>
  );
}