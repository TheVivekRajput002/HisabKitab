"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, CreditCard, Loader2, DollarSign, Building, FileText, CheckCircle2, Camera, Upload, X, ScanLine, Pen, Undo2, Trash2, Minus, Plus, Crop, RotateCcw, Check, AlertCircle } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';
import { supabase } from '@/utils/supabaseClient';

// Lazy load ReactCrop
const ReactCrop = dynamic(() => import('react-image-crop'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" size={32} /></div>
});

// ============================================================================
// IMAGE MARKER / ANNOTATION COMPONENT
// ============================================================================

function ImageMarker({ imageSrc, onDone, onCancel }) {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(3);
    const [brushColor, setBrushColor] = useState('#FF0000');
    const [strokes, setStrokes] = useState([]); // Array of stroke arrays for undo
    const [currentStroke, setCurrentStroke] = useState([]);
    const [canvasReady, setCanvasReady] = useState(false);

    const colors = [
        { color: '#FF0000', label: 'Red' },
        { color: '#00CC00', label: 'Green' },
        { color: '#0066FF', label: 'Blue' },
        { color: '#FF9900', label: 'Orange' },
        { color: '#000000', label: 'Black' },
    ];

    // Initialize canvas when image loads
    const handleImageLoad = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        setCanvasReady(true);
        redrawAll([]);
    }, []);

    // Redraw all strokes on the canvas
    const redrawAll = useCallback((allStrokes) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        allStrokes.forEach((stroke) => {
            if (stroke.points.length < 2) return;
            ctx.beginPath();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        });
    }, []);

    // Get coordinates relative to the canvas (accounting for display scaling)
    const getCoords = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }, []);

    const startDrawing = useCallback((e) => {
        e.preventDefault();
        const coords = getCoords(e);
        setIsDrawing(true);
        setCurrentStroke([coords]);
    }, [getCoords]);

    const draw = useCallback((e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const coords = getCoords(e);
        setCurrentStroke(prev => {
            const updated = [...prev, coords];

            // Draw live stroke
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                redrawAll(strokes);
                if (updated.length >= 2) {
                    ctx.beginPath();
                    ctx.strokeStyle = brushColor;
                    ctx.lineWidth = brushSize;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.moveTo(updated[0].x, updated[0].y);
                    for (let i = 1; i < updated.length; i++) {
                        ctx.lineTo(updated[i].x, updated[i].y);
                    }
                    ctx.stroke();
                }
            }
            return updated;
        });
    }, [isDrawing, getCoords, brushColor, brushSize, strokes, redrawAll]);

    const stopDrawing = useCallback(() => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (currentStroke.length >= 2) {
            const newStroke = { points: currentStroke, color: brushColor, size: brushSize };
            const newStrokes = [...strokes, newStroke];
            setStrokes(newStrokes);
            redrawAll(newStrokes);
        }
        setCurrentStroke([]);
    }, [isDrawing, currentStroke, brushColor, brushSize, strokes, redrawAll]);

    const handleUndo = () => {
        const newStrokes = strokes.slice(0, -1);
        setStrokes(newStrokes);
        redrawAll(newStrokes);
    };

    const handleClear = () => {
        setStrokes([]);
        redrawAll([]);
    };

    // Composite image + annotations and return as File
    const handleDone = async () => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) { onCancel(); return; }

        // Create a composite canvas
        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = img.naturalWidth;
        compositeCanvas.height = img.naturalHeight;
        const ctx = compositeCanvas.getContext('2d');

        // Draw the original image
        ctx.drawImage(img, 0, 0);

        // Draw the annotations on top
        ctx.drawImage(canvas, 0, 0);

        // Export as blob/file
        compositeCanvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], 'annotated-check.jpg', { type: 'image/jpeg' });
                onDone(file);
            } else {
                onCancel();
            }
        }, 'image/jpeg', 0.95);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-3 border-b bg-gradient-to-r from-orange-50 to-red-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Pen className="text-red-600" size={20} />
                        <h2 className="text-base font-bold text-gray-800">Mark on Check</h2>
                    </div>
                    <span className="text-xs text-gray-500">Draw to highlight important areas</span>
                </div>

                {/* Toolbar */}
                <div className="p-2 border-b bg-gray-50 flex items-center gap-3 flex-wrap">
                    {/* Color Picker */}
                    <div className="flex items-center gap-1.5">
                        {colors.map((c) => (
                            <button
                                key={c.color}
                                onClick={() => setBrushColor(c.color)}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${brushColor === c.color ? 'border-gray-800 scale-110 shadow-md' : 'border-gray-300'}`}
                                style={{ backgroundColor: c.color }}
                                title={c.label}
                            />
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-300" />

                    {/* Brush Size */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setBrushSize(Math.max(1, brushSize - 1))}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Smaller brush"
                        >
                            <Minus size={14} />
                        </button>
                        <span className="text-xs font-mono w-6 text-center text-gray-600">{brushSize}</span>
                        <button
                            onClick={() => setBrushSize(Math.min(20, brushSize + 1))}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Larger brush"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-300" />

                    {/* Undo & Clear */}
                    <button
                        onClick={handleUndo}
                        disabled={strokes.length === 0}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Undo last stroke"
                    >
                        <Undo2 size={14} /> Undo
                    </button>
                    <button
                        onClick={handleClear}
                        disabled={strokes.length === 0}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded hover:bg-red-100 text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Clear all drawings"
                    >
                        <Trash2 size={14} /> Clear
                    </button>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 overflow-auto p-3 bg-gray-100 flex items-center justify-center">
                    <div className="relative inline-block" style={{ touchAction: 'none' }}>
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            alt="Check to annotate"
                            onLoad={handleImageLoad}
                            className="max-w-full max-h-[55vh] rounded-lg"
                            style={{ display: 'block' }}
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                            style={{ cursor: 'crosshair' }}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t bg-gray-50 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDone}
                        className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={18} />
                        Apply Marks
                    </button>
                </div>
            </div>
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

    const getCroppedImage = (image, cropData, fileName) => new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = cropData.width * scaleX;
        canvas.height = cropData.height * scaleY;
        canvas.getContext('2d').drawImage(
            image,
            cropData.x * scaleX, cropData.y * scaleY,
            cropData.width * scaleX, cropData.height * scaleY,
            0, 0, cropData.width * scaleX, cropData.height * scaleY
        );
        canvas.toBlob(
            (blob) => blob ? resolve(new File([blob], fileName, { type: 'image/jpeg' })) : reject(new Error('Canvas is empty')),
            'image/jpeg', 0.95
        );
    });

    const handleCropComplete = async () => {
        if (!completedCrop || !imgRef.current) { onCancel(); return; }
        try {
            const croppedFile = await getCroppedImage(imgRef.current, completedCrop, 'cropped-check.jpg');
            onCropComplete(croppedFile);
        } catch { onCancel(); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                <div className="p-3 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50">
                    <div className="flex items-center gap-2">
                        <Crop className="text-blue-600" size={20} />
                        <h2 className="text-base font-bold text-gray-800">Crop Check Image</h2>
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
                <div className="p-3 border-t flex gap-3 bg-gray-50">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 text-gray-700 font-medium">
                        <RotateCcw size={18} /> Cancel
                    </button>
                    <button onClick={handleCropComplete} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium">
                        <Check size={18} /> Apply Crop
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// CHECK SCANNER MODAL
// ============================================================================

function CheckScannerModal({ onExtracted, onClose }) {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);
    const [showMarker, setShowMarker] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) {
            setError('Invalid file type. Please upload JPG, PNG, or WEBP.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('File size exceeds 5MB limit.');
            return;
        }

        setError(null);
        setImageFile(file);

        // Preview
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleMarkerDone = (annotatedFile) => {
        setImageFile(annotatedFile);
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(annotatedFile);
        setShowMarker(false);
    };

    const handleCropDone = (croppedFile) => {
        setImageFile(croppedFile);
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(croppedFile);
        setShowCropper(false);
    };

    const handleScan = async () => {
        if (!imageFile) return;
        setScanning(true);
        setError(null);

        try {
            // Convert to base64
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(imageFile);
            });

            // Call API
            const response = await fetch('/api/scan-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64 })
            });

            if (!response.ok) {
                const { error: apiError } = await response.json();
                throw new Error(apiError || 'Failed to scan check');
            }

            const { rawText } = await response.json();
            if (!rawText) throw new Error('No response from AI');

            // Parse JSON from response
            const start = rawText.indexOf('{');
            const end = rawText.lastIndexOf('}');
            if (start === -1 || end === -1 || end <= start) {
                throw new Error('Could not parse AI response');
            }

            let jsonStr = rawText.substring(start, end + 1);
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

            const data = JSON.parse(jsonStr);
            onExtracted(data, imageFile);
            onClose();
        } catch (err) {
            console.error('Check scan error:', err);
            setError(err.message || 'Failed to scan check. Please try again.');
        } finally {
            setScanning(false);
        }
    };

    const handleReset = () => {
        setImageFile(null);
        setImagePreview(null);
        setError(null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ScanLine className="text-blue-600" size={22} />
                        <h2 className="text-lg font-bold text-gray-800">Scan Check</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                        disabled={scanning}
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}

                    {!imagePreview ? (
                        <div className="space-y-3">
                            {/* File upload area */}
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all">
                                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">
                                    <span className="font-semibold text-blue-600">Click to upload</span> a check image
                                </p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (MAX. 5MB)</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    disabled={scanning}
                                />
                            </label>

                            {/* Camera button */}
                            <button
                                onClick={() => cameraInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                disabled={scanning}
                            >
                                <Camera size={20} />
                                Take Photo of Check
                            </button>
                            <input
                                ref={cameraInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleFileChange}
                                disabled={scanning}
                            />

                            <p className="text-xs text-gray-400 text-center">
                                Upload or photograph the filled check. AI will extract the details automatically.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Image preview */}
                            <div className="relative rounded-lg overflow-hidden border border-gray-200">
                                <img
                                    src={imagePreview}
                                    alt="Check preview"
                                    className="w-full max-h-64 object-contain bg-gray-50"
                                />
                                {!scanning && (
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        {/* Crop button */}
                                        <button
                                            onClick={() => setShowCropper(true)}
                                            className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-lg"
                                            title="Crop image"
                                        >
                                            <Crop size={16} />
                                        </button>
                                        {/* Marker button */}
                                        <button
                                            onClick={() => setShowMarker(true)}
                                            className="p-1.5 bg-orange-500 text-white rounded-full hover:bg-orange-600 shadow-lg"
                                            title="Draw on image"
                                        >
                                            <Pen size={16} />
                                        </button>
                                        {/* Remove button */}
                                        <button
                                            onClick={handleReset}
                                            className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                                            title="Remove image"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {scanning && (
                                <div className="flex flex-col items-center py-4">
                                    <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                                    <p className="text-sm text-gray-600 font-medium">Extracting check details...</p>
                                    <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {imagePreview && !scanning && (
                    <div className="p-4 border-t bg-gray-50 flex gap-3">
                        <button
                            onClick={handleReset}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
                        >
                            Re-upload
                        </button>
                        <button
                            onClick={() => setShowCropper(true)}
                            className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <Crop size={16} />
                            Crop
                        </button>
                        <button
                            onClick={() => setShowMarker(true)}
                            className="px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <Pen size={16} />
                            Mark
                        </button>
                        <button
                            onClick={handleScan}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <ScanLine size={18} />
                            Extract Details
                        </button>
                    </div>
                )}
            </div>

            {/* Cropper Overlay */}
            {showCropper && imagePreview && (
                <ImageCropper
                    imageSrc={imagePreview}
                    onCropComplete={handleCropDone}
                    onCancel={() => setShowCropper(false)}
                />
            )}

            {/* Marker Overlay */}
            {showMarker && imagePreview && (
                <ImageMarker
                    imageSrc={imagePreview}
                    onDone={handleMarkerDone}
                    onCancel={() => setShowMarker(false)}
                />
            )}
        </div>
    );
}

// ============================================================================
// MAIN PAY PAGE
// ============================================================================

export default function VendorPayPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    // Support either [vendorId] or [id] if the folder is named differently
    const vendorId = params.vendorId || params.id;
    const billId = searchParams.get('billId');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [vendor, setVendor] = useState(null);
    const [bill, setBill] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scanFilled, setScanFilled] = useState(false);
    const [chequeImageFile, setChequeImageFile] = useState(null);
    const [previouslyPaid, setPreviouslyPaid] = useState(0);

    const [formData, setFormData] = useState({
        payment_method: 'CHEQUE',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',

        // CHEQUE
        cheque_number: '',
        cheque_bank: '',
        company_name: '',
        cheque_date: new Date().toISOString().split('T')[0],

        // RTGS
        rtgs_transaction_id: '',
        rtgs_bank: '',
        rtgs_transfer_date: new Date().toISOString().split('T')[0],

        // RECEIPT (CASH)
        receipt_number: '',
        receipt_issued_by: '',

        // CREDIT NOTE
        credit_note_number: '',
        reference_invoice: ''
    });

    useEffect(() => {
        if (vendorId) {
            fetchDetails();
        } else {
            setLoading(false);
            setError("Vendor ID is missing");
        }
    }, [vendorId, billId]);

    const fetchDetails = async () => {
        try {
            setLoading(true);

            // Fetch vendor
            const { data: vendorData, error: vendorError } = await supabase
                .from('vendors')
                .select('*')
                .eq('id', vendorId)
                .single();
            if (vendorError) throw vendorError;
            setVendor(vendorData);

            // Fetch bill if billId is present
            if (billId) {
                const { data: billData, error: billError } = await supabase
                    .from('vendor_bills')
                    .select('*')
                    .eq('id', billId)
                    .single();
                if (billError) throw billError;
                setBill(billData);

                // Fetch all previous payments for this bill to calculate already-paid amount
                const { data: existingPayments } = await supabase
                    .from('payments')
                    .select('amount')
                    .eq('vendor_bill_id', billId);

                const totalPaid = (existingPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);
                setPreviouslyPaid(totalPaid);

                const remainingToPay = Math.max(0, Number(billData.total_amount) - totalPaid);

                setFormData(prev => ({
                    ...prev,
                    amount: remainingToPay > 0 ? remainingToPay : billData.total_amount || '',
                    reference_invoice: billData.bill_number || ''
                }));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle extracted check data from the scanner modal
    const handleCheckExtracted = (data, imageFile) => {
        setFormData(prev => ({
            ...prev,
            payment_method: 'CHEQUE',
            amount: data.amount || prev.amount,
            cheque_number: data.cheque_number || prev.cheque_number,
            cheque_bank: data.cheque_bank || prev.cheque_bank,
            company_name: data.pay_name || data.payee_name || prev.company_name,
            cheque_date: data.cheque_date || prev.cheque_date,
            payment_date: data.cheque_date || prev.payment_date,
            notes: data.notes || prev.notes
        }));
        // Store the cheque image file for upload on submit
        if (imageFile) setChequeImageFile(imageFile);
        setScanFilled(true);
        setTimeout(() => setScanFilled(false), 5000);
    };

    useEffect(() => {
        if (!vendorId) return;
        try {
            const raw = sessionStorage.getItem('vendor_pay_prefill');
            if (!raw) return;
            const payload = JSON.parse(raw);
            if (String(payload?.vendorId) !== String(vendorId)) return;
            if (payload?.data) {
                handleCheckExtracted(payload.data);
            }
            sessionStorage.removeItem('vendor_pay_prefill');
        } catch {
            sessionStorage.removeItem('vendor_pay_prefill');
        }
    }, [vendorId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Generate auto-payment number (PAY- + Timestamp + Random)
            const paymentNumber = `PAY-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

            // Compare bill amount vs payment amount (accounting for previous payments)
            const paymentAmount = parseFloat(formData.amount);
            let remainingAmount = 0;
            let paymentStatus = 'paid';
            let clearanceStatus = 'CLEARED';

            if (bill) {
                const billAmount = Number(bill.total_amount);
                const totalPaidAfterThis = previouslyPaid + paymentAmount;
                if (totalPaidAfterThis >= billAmount) {
                    remainingAmount = 0;
                    paymentStatus = 'paid';
                    clearanceStatus = 'CLEARED';
                } else {
                    remainingAmount = billAmount - totalPaidAfterThis;
                    paymentStatus = 'partial';
                    clearanceStatus = 'PENDING';
                }
            }

            // 1. Insert Payment
            const { data: paymentData, error: paymentError } = await supabase
                .from('payments')
                .insert({
                    payment_number: paymentNumber,
                    customer_id: vendorId,
                    vendor_bill_id: billId || null,
                    amount: paymentAmount,
                    remaining_amount: remainingAmount,
                    payment_method: formData.payment_method,
                    payment_date: formData.payment_date,
                    status: clearanceStatus,
                    notes: formData.notes
                })
                .select('id')
                .single();

            if (paymentError) throw paymentError;

            const paymentId = paymentData.id;

            // 2. Insert Payment Details
            let detailsPayload = { payment_id: paymentId };

            if (formData.payment_method === 'CHEQUE') {
                detailsPayload = {
                    ...detailsPayload,
                    cheque_number: formData.cheque_number,
                    cheque_bank: formData.cheque_bank,
                    cheque_date: formData.cheque_date || null
                };
            } else if (formData.payment_method === 'RTGS') {
                detailsPayload = {
                    ...detailsPayload,
                    rtgs_transaction_id: formData.rtgs_transaction_id,
                    rtgs_bank: formData.rtgs_bank,
                    rtgs_transfer_date: formData.rtgs_transfer_date || null
                };
            } else if (formData.payment_method === 'RECEIPT') {
                detailsPayload = {
                    ...detailsPayload,
                    receipt_number: formData.receipt_number,
                    receipt_issued_by: formData.receipt_issued_by
                };
            } else if (formData.payment_method === 'CREDIT_NOTE') {
                detailsPayload = {
                    ...detailsPayload,
                    credit_note_number: formData.credit_note_number,
                    reference_invoice: formData.reference_invoice
                };
            }

            const { error: detailsError } = await supabase
                .from('payment_details')
                .insert(detailsPayload);

            if (detailsError) throw detailsError;

            // 3. Update the vendor_bills payment_status
            if (billId) {
                const { error: updateError } = await supabase
                    .from('vendor_bills')
                    .update({
                        payment_status: paymentStatus
                    })
                    .eq('id', billId);

                if (updateError) throw updateError;
            }

            // 4. Upload cheque image if available
            if (chequeImageFile && formData.payment_method === 'CHEQUE') {
                try {
                    const fileExt = chequeImageFile.name.split('.').pop();
                    const fileName = `cheque_${vendorId}_${paymentId}_${Date.now()}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('cheque-photos')
                        .upload(fileName, chequeImageFile);

                    if (uploadError) {
                        console.error('Cheque image upload error:', uploadError);
                    } else {
                        // Update payment_details with the cheque photo URL
                        await supabase
                            .from('payment_details')
                            .update({ cheque_photo_url: fileName })
                            .eq('payment_id', paymentId);
                    }
                } catch (uploadErr) {
                    console.error('Cheque image upload failed:', uploadErr);
                    // Don't fail the payment if upload fails
                }
            }

            setSuccess(true);
            setTimeout(() => {
                router.push(`/vendor/${vendorId}/bills`);
            }, 2000);
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    if (error && !vendor) {
        return (
            <div className="min-h-screen bg-gray-100 p-4">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                        {error}
                    </div>
                    <button
                        onClick={() => router.push(`/vendor/${vendorId}/bills`)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        Back to Bills
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => router.push(`/vendor/${vendorId}/bills`)}
                    className="mb-6 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                >
                    <ArrowLeft size={18} />
                    Back to Bills
                </button>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 mb-2">Record Payment</h1>
                                <p className="text-gray-600">
                                    Payment for <span className="font-semibold">{vendor?.name}</span>
                                    {bill && ` • Bill #${bill.bill_number}`}
                                </p>
                            </div>

                            {/* Scan Check Button — only for CHEQUE method */}
                            {formData.payment_method === 'CHEQUE' && (
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
                                >
                                    <ScanLine size={18} />
                                    Scan Check
                                </button>
                            )}
                        </div>

                        {/* Scan success indicator */}
                        {scanFilled && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                <CheckCircle2 size={16} />
                                Check details auto-filled! Review and edit below before submitting.
                            </div>
                        )}
                    </div>

                    {/* Bill vs Payment Amount Comparison Banner */}
                    {bill && (
                        <div className="px-6 py-3 border-b bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Bill Amount</span>
                                <span className="text-lg font-bold text-gray-800">₹{Number(bill.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {previouslyPaid > 0 && (
                                <div className="flex items-center justify-between mb-2 text-sm">
                                    <span className="text-gray-500">Previously Paid</span>
                                    <span className="font-semibold text-green-600">₹{previouslyPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {formData.amount && (() => {
                                const payAmt = parseFloat(formData.amount) || 0;
                                const billAmt = Number(bill.total_amount);
                                const totalPaidAfterThis = previouslyPaid + payAmt;
                                const diff = billAmt - totalPaidAfterThis;
                                if (diff <= 0) {
                                    return (
                                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                            <CheckCircle2 size={16} />
                                            <span className="font-medium">
                                                {diff === 0
                                                    ? <>Amount completes the bill — will be marked as <strong>PAID</strong></>
                                                    : <>Overpayment by ₹{Math.abs(diff).toLocaleString('en-IN', { minimumFractionDigits: 2 })} — will be marked as <strong>CLEARED</strong></>
                                                }
                                            </span>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div className="flex items-center justify-between text-sm bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                                            <div className="flex items-center gap-2 text-yellow-800">
                                                <AlertCircle size={16} />
                                                <span className="font-medium">Partial payment — will be marked as <strong>PENDING</strong></span>
                                            </div>
                                            <span className="font-bold text-orange-600">Remaining: ₹{diff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                    )}

                    {success ? (
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="text-green-600" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Recorded</h2>
                            <p className="text-gray-600">The payment has been successfully recorded in the payment tables.</p>
                            <p className="text-sm text-gray-500 mt-4">Redirecting back to bills...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                                    {error}
                                </div>
                            )}

                            {/* Payment Options */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        { id: 'CHEQUE', label: 'Bank Cheque', icon: FileText },
                                        { id: 'RECEIPT', label: 'Receipt (Cash)', icon: DollarSign },
                                        { id: 'CREDIT_NOTE', label: 'Credit Note', icon: FileText },
                                        { id: 'RTGS', label: 'RTGS (Bank Transfer)', icon: Building }
                                    ].map((method) => {
                                        const Icon = method.icon;
                                        return (
                                            <label
                                                key={method.id}
                                                className={`
                                                    flex items-center p-4 border rounded-lg cursor-pointer transition-all
                                                    ${formData.payment_method === method.id
                                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                    }
                                                `}
                                            >
                                                <input
                                                    type="radio"
                                                    name="payment_method"
                                                    value={method.id}
                                                    checked={formData.payment_method === method.id}
                                                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                />
                                                <span className="ml-3 flex items-center gap-2">
                                                    <Icon size={18} className={formData.payment_method === method.id ? 'text-blue-600' : 'text-gray-500'} />
                                                    <span className={`font-medium ${formData.payment_method === method.id ? 'text-blue-900' : 'text-gray-700'}`}>
                                                        {method.label}
                                                    </span>
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Common Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.payment_date}
                                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Dynamically Rendered Detailed Fields */}
                            <div className="space-y-4">
                                {formData.payment_method === 'CHEQUE' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Number</label>
                                            <input type="text" value={formData.cheque_number} onChange={(e) => setFormData({ ...formData, cheque_number: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required placeholder="CHQ-000000" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                            <input type="text" value={formData.cheque_bank} onChange={(e) => setFormData({ ...formData, cheque_bank: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required placeholder="State Bank of India" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name (Pay To)</label>
                                            <input type="text" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Payee company name" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Date</label>
                                            <input type="date" value={formData.cheque_date} onChange={(e) => setFormData({ ...formData, cheque_date: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                )}

                                {formData.payment_method === 'RTGS' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID / UTR</label>
                                            <input type="text" value={formData.rtgs_transaction_id} onChange={(e) => setFormData({ ...formData, rtgs_transaction_id: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required placeholder="UTR12345678" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                            <input type="text" value={formData.rtgs_bank} onChange={(e) => setFormData({ ...formData, rtgs_bank: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required placeholder="HDFC Bank" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Date</label>
                                            <input type="date" value={formData.rtgs_transfer_date} onChange={(e) => setFormData({ ...formData, rtgs_transfer_date: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                )}

                                {formData.payment_method === 'RECEIPT' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
                                            <input type="text" value={formData.receipt_number} onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required placeholder="REC-1002" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Issued By</label>
                                            <input type="text" value={formData.receipt_issued_by} onChange={(e) => setFormData({ ...formData, receipt_issued_by: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required placeholder="Cashier Name" />
                                        </div>
                                    </div>
                                )}

                                {formData.payment_method === 'CREDIT_NOTE' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Credit Note Number</label>
                                            <input type="text" value={formData.credit_note_number} onChange={(e) => setFormData({ ...formData, credit_note_number: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required placeholder="CN-501" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Invoice</label>
                                            <input type="text" value={formData.reference_invoice} onChange={(e) => setFormData({ ...formData, reference_invoice: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="INV-2023" />
                                        </div>
                                    </div>
                                )}

                                {/* Notes is common */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">
                                        Notes / Remarks
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Add any additional details here..."
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-lg"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={20} />
                                            Record Payment
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Check Scanner Modal */}
            {showScanner && (
                <CheckScannerModal
                    onExtracted={handleCheckExtracted}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}
