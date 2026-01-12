"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Camera, Upload, X, Check, AlertCircle, Trash2, Edit2, Save, ChevronDown, ChevronUp, Crop, RotateCcw, Loader2 } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '@/utils/supabaseClient';

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
// API KEY COMPONENT WITH LOCALSTORAGE
// ============================================================================

function ApiKeyInput({ apiKey, setApiKey }) {
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(constants.API_KEY_STORAGE_KEY);
    if (saved) setApiKey(saved);
  }, []);

  const handleChange = (value) => {
    setApiKey(value);
    localStorage.setItem(constants.API_KEY_STORAGE_KEY, value);
  };

  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem(constants.API_KEY_STORAGE_KEY);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
        <Camera className="mr-2" size={18} />
        Gemini API Key
        {apiKey && <Badge variant="success" className="ml-2">Saved</Badge>}
      </label>
      <div className="flex gap-2">
        <input
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter your Gemini API key"
          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button onClick={() => setShowKey(!showKey)} className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm">
          {showKey ? 'Hide' : 'Show'}
        </button>
        {apiKey && (
          <button onClick={handleClear} className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm">
            Clear
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Your key is stored locally. Get one from{' '}
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          Google AI Studio
        </a>
      </p>
    </div>
  );
}

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
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
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
          <img src={imagePreview} alt="Invoice preview" className="w-full rounded-lg max-h-96 object-contain" />
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
  extractProductsFromImage: async (imageBase64, apiKey) => {
    if (!apiKey) throw new Error('API key is required');

    const prompt = `Analyze this invoice/receipt image and extract all products with their details.

You MUST return ONLY a valid JSON array (no markdown, no explanation) with this structure:
[
  {"name": "Product name", "quantity": 1, "hsn_code": "1234", "price": 100, "unit": "pcs", "confidence": 0.9}
]

Rules:
- Extract ALL visible products from the invoice
- Use the individual unit price (not total)
- Use appropriate units: pcs, kg, liters, box, etc.
- Set confidence between 0.5-1.0 based on text clarity
- Return empty array [] if no products found
- Return ONLY the JSON array, nothing else`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: constants.GEMINI_MODEL,
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }] }],
      config: { temperature: 0.1, maxOutputTokens: 4096 }
    });

    const text = response.text;
    console.log('Gemini raw response:', text); // Debug log

    if (!text) throw new Error('No response from AI');

    // Try multiple patterns to extract JSON
    let jsonData = null;

    // Pattern 1: ```json ... ``` code block
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      try { jsonData = JSON.parse(codeBlockMatch[1]); } catch (e) { console.log('Code block parse failed'); }
    }

    // Pattern 2: Direct array [...] anywhere in text
    if (!jsonData) {
      const arrayMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (arrayMatch) {
        try { jsonData = JSON.parse(arrayMatch[0]); } catch (e) { console.log('Array parse failed'); }
      }
    }

    // Pattern 3: Clean the text and try parsing directly
    if (!jsonData) {
      const cleaned = text.replace(/^[^[\{]*/, '').replace(/[^\]\}]*$/, '').trim();
      try { jsonData = JSON.parse(cleaned); } catch (e) { console.log('Direct parse failed'); }
    }

    // Pattern 4: Empty array response
    if (!jsonData && text.includes('[]')) {
      jsonData = [];
    }

    if (!jsonData || !Array.isArray(jsonData)) {
      console.error('Failed to parse response:', text);
      throw new Error('Could not parse AI response. The AI returned: ' + text.substring(0, 100));
    }

    return jsonData.map((p, index) => ({
      id: `product_${Date.now()}_${index}`,
      name: p.name || p.product_name || 'Unknown Product',
      quantity: Number(p.quantity) || Number(p.qty) || 1,
      hsn_code: p.hsn_code || p.hsn || '0000',
      price: Number(p.price) || Number(p.rate) || Number(p.unit_price) || 0,
      unit: p.unit || 'pcs',
      confidence: Number(p.confidence) || 0.7,
      edited: false
    }));
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
    const enrichedProducts = [];

    for (const p of products) {
      try {
        const { data: existingProducts, error } = await supabase
          .from('products')
          .select('id, product_name, current_stock, purchase_rate')
          .ilike('product_name', p.name.trim());

        if (error) throw error;

        if (existingProducts && existingProducts.length > 0) {
          const existing = existingProducts[0];
          enrichedProducts.push({
            ...p,
            isDuplicate: true,
            existingId: existing.id,
            existingStock: existing.current_stock || 0,
            existingPrice: existing.purchase_rate || 0
          });
        } else {
          enrichedProducts.push({
            ...p,
            isDuplicate: false,
            existingStock: 0
          });
        }
      } catch (error) {
        enrichedProducts.push({ ...p, isDuplicate: false, existingStock: 0 });
      }
    }

    return enrichedProducts;
  },

  createProducts: async (products) => {
    const results = { created: 0, updated: 0, errors: [], details: [] };

    for (const p of products) {
      try {
        if (p.isDuplicate && p.existingId) {
          // Product exists - update stock
          const newStock = (p.existingStock || 0) + p.quantity;

          const { error: updateError } = await supabase
            .from('products')
            .update({
              current_stock: newStock,
              purchase_rate: p.price
            })
            .eq('id', p.existingId);

          if (updateError) throw updateError;

          results.updated++;
          results.details.push({
            name: p.name,
            action: 'updated',
            oldStock: p.existingStock,
            added: p.quantity,
            newStock: newStock
          });
        } else {
          // Product doesn't exist - create new
          const { error: insertError } = await supabase
            .from('products')
            .insert({
              product_name: p.name,
              purchase_rate: p.price,
              current_stock: p.quantity,
              hsn_code: p.hsn_code || '0000',
              brand: '',
              vehicle_model: '',
              minimum_stock: 0
            });

          if (insertError) throw insertError;

          results.created++;
          results.details.push({
            name: p.name,
            action: 'created',
            stock: p.quantity
          });
        }
      } catch (error) {
        results.errors.push({ name: p.name, error: error.message });
      }
    }

    return results;
  }
};

// ============================================================================
// PRODUCT CARD
// ============================================================================

function ProductCard({ product, onUpdate, onDelete, isSelected, onToggleSelect }) {
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
          <input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} placeholder="Product name" className="w-full px-3 py-2 border rounded-lg bg-white" />
          <div className="grid grid-cols-4 gap-2">
            <input type="number" value={editData.quantity} onChange={(e) => setEditData({ ...editData, quantity: parseFloat(e.target.value) })} placeholder="Qty" className="px-3 py-2 border rounded-lg bg-white" />
            <input type="number" value={editData.price} onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })} placeholder="Price" className="px-3 py-2 border rounded-lg bg-white" />
            <input type="text" value={editData.unit} onChange={(e) => setEditData({ ...editData, unit: e.target.value })} placeholder="Unit" className="px-3 py-2 border rounded-lg bg-white" />
            <input type="text" value={editData.hsn_code} onChange={(e) => setEditData({ ...editData, hsn_code: e.target.value })} placeholder="HSN" className="px-3 py-2 border rounded-lg bg-white" />
          </div>
          {!validation.valid && <Alert variant="error" className="text-xs">{validation.errors.join(', ')}</Alert>}
        </div>
      ) : (
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">{product.name}</h3>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{product.quantity} {product.unit}</span>
            <span className="font-semibold">₹{product.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>HSN: {product.hsn_code || 'N/A'}</span>
            <span>Total: ₹{(product.quantity * product.price).toFixed(2)}</span>
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
}

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
  const [apiKey, setApiKey] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [error, setError] = useState(null);

  // Calculate current step for progress indicator
  const currentStep = !imagePreview ? 1 : isProcessing ? 2 : products.length > 0 ? 3 : 1;

  const handleImageSelect = useCallback((file) => {
    if (!file) { setImage(null); setImagePreview(null); setProducts([]); setError(null); return; }
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleScan = async () => {
    if (!apiKey) { setError('Please enter your Gemini API key'); return; }
    if (!image) { setError('Please upload an image'); return; }

    setIsProcessing(true);
    setError(null);

    try {
      const base64 = await imageUtils.convertToBase64(image);
      const extractedProducts = await geminiService.extractProductsFromImage(base64, apiKey);
      if (extractedProducts.length === 0) {
        setError('No products found. Try a clearer image.');
      } else {
        // Check for duplicates and enrich products with existing stock info
        const enrichedProducts = await productService.checkDuplicates(extractedProducts);
        setProducts(enrichedProducts);
      }
    } catch (err) {
      setError(err.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const results = await productService.createProducts(products);

      // Build summary message
      let message = '';
      if (results.created > 0) message += `✅ ${results.created} new product(s) added\n`;
      if (results.updated > 0) message += `🔄 ${results.updated} existing product(s) stock updated\n`;
      if (results.errors.length > 0) message += `❌ ${results.errors.length} error(s)\n`;

      // Show stock update details
      if (results.details.length > 0) {
        message += '\nDetails:\n';
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
      setImage(null);
      setImagePreview(null);
      setShowConfirmation(false);
    } catch (err) {
      setError(err.message || 'Failed to add products');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Invoice Scanner</h1>

        <ProgressSteps currentStep={currentStep} />

        <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />

        {error && <Alert variant="error" className="mb-4"><AlertCircle className="inline mr-2" size={16} />{error}</Alert>}

        <ImageUpload onImageSelect={handleImageSelect} isProcessing={isProcessing} imagePreview={imagePreview} onCropClick={() => setShowCropper(true)} />

        {imagePreview && products.length === 0 && (
          <button onClick={handleScan} disabled={isProcessing || !apiKey} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium mb-4 flex items-center justify-center gap-2">
            {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Scanning...</> : <><Camera size={20} /> Scan Invoice</>}
          </button>
        )}

        {products.length > 0 && (
          <>
            <BulkActionsPanel
              selectedIds={selectedIds}
              products={products}
              onDeleteSelected={() => { setProducts(ps => ps.filter(p => !selectedIds.includes(p.id))); setSelectedIds([]); }}
              onSelectAll={() => setSelectedIds(products.map(p => p.id))}
              onDeselectAll={() => setSelectedIds([])}
            />

            <div className="space-y-3 mb-4">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onUpdate={(id, data) => setProducts(ps => ps.map(p => p.id === id ? { ...data, id, edited: true } : p))}
                  onDelete={(id) => { setProducts(ps => ps.filter(p => p.id !== id)); setSelectedIds(ss => ss.filter(s => s !== id)); }}
                  isSelected={selectedIds.includes(product.id)}
                  onToggleSelect={(id, checked) => setSelectedIds(ss => checked ? [...ss, id] : ss.filter(s => s !== id))}
                />
              ))}
            </div>

            <button onClick={() => setShowConfirmation(true)} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2">
              <Check size={20} /> Add {products.length} Products
            </button>
          </>
        )}

        {showConfirmation && <ConfirmationModal products={products} onConfirm={handleConfirm} onCancel={() => setShowConfirmation(false)} isProcessing={isProcessing} />}
        {showCropper && imagePreview && <ImageCropper imageSrc={imagePreview} onCropComplete={(f) => { handleImageSelect(f); setShowCropper(false); }} onCancel={() => setShowCropper(false)} />}
      </div>
    </div>
  );
}