"use client";

import React, { useMemo, useRef, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, ScanLine, Loader2, Search, CreditCard, Upload, X, Building2, Crop, PenSquare, Camera, CheckCircle2, AlertCircle, FileText, Check, DollarSign, Calendar } from "lucide-react";
import "react-image-crop/dist/ReactCrop.css";
import { supabase } from "@/utils/supabaseClient";
import { useCompany } from "@/hooks/useCompany";

const ReactCrop = dynamic(() => import("react-image-crop"), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" size={28} /></div>
});

function ImageCropper({ imageSrc, onCropComplete, onCancel }) {
    const [crop, setCrop] = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);

    const getCroppedImage = (image, cropData, fileName) => new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = cropData.width * scaleX;
        canvas.height = cropData.height * scaleY;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(
            image,
            cropData.x * scaleX, cropData.y * scaleY,
            cropData.width * scaleX, cropData.height * scaleY,
            0, 0, cropData.width * scaleX, cropData.height * scaleY
        );
        canvas.toBlob((blob) => {
            if (!blob) return reject(new Error("Crop failed"));
            resolve(new File([blob], fileName || "cropped-check.jpg", { type: "image/jpeg" }));
        }, "image/jpeg", 0.95);
    });

    const handleApply = async () => {
        if (!completedCrop || !imgRef.current) return onCancel();
        try {
            const cropped = await getCroppedImage(imgRef.current, completedCrop, "cropped-check.jpg");
            onCropComplete(cropped);
        } catch {
            onCancel();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl overflow-hidden">
                <div className="p-4 border-b font-semibold">Crop Check Image</div>
                <div className="p-4 max-h-[70vh] overflow-auto bg-gray-100 flex items-center justify-center">
                    <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)}>
                        <img ref={imgRef} src={imageSrc} alt="Crop preview" className="max-h-[65vh] max-w-full" />
                    </ReactCrop>
                </div>
                <div className="p-4 border-t flex gap-2">
                    <button onClick={onCancel} className="flex-1 border rounded-lg py-2 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleApply} className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700">Apply Crop</button>
                </div>
            </div>
        </div>
    );
}

function ImageMarker({ imageSrc, onDone, onCancel }) {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const [drawing, setDrawing] = useState(false);
    const [lines, setLines] = useState([]);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        return { x, y };
    };

    const redraw = (currentLines) => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        currentLines.forEach((line) => {
            if (!line.length) return;
            ctx.beginPath();
            ctx.moveTo(line[0].x, line[0].y);
            line.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
            ctx.stroke();
        });
    };

    const handleImageLoad = () => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;
        const maxW = 900;
        const ratio = Math.min(1, maxW / img.naturalWidth);
        canvas.width = img.naturalWidth * ratio;
        canvas.height = img.naturalHeight * ratio;
        redraw(lines);
    };

    const start = (e) => {
        e.preventDefault();
        const p = getPos(e);
        setDrawing(true);
        setLines((prev) => [...prev, [p]]);
    };

    const move = (e) => {
        if (!drawing) return;
        e.preventDefault();
        const p = getPos(e);
        setLines((prev) => {
            const next = [...prev];
            next[next.length - 1] = [...next[next.length - 1], p];
            redraw(next);
            return next;
        });
    };

    const end = () => setDrawing(false);

    const handleDone = () => {
        const canvas = canvasRef.current;
        canvas.toBlob((blob) => {
            if (!blob) return;
            onDone(new File([blob], "marked-check.jpg", { type: "image/jpeg" }));
        }, "image/jpeg", 0.95);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-5xl overflow-hidden">
                <div className="p-4 border-b font-semibold">Mark Check Image</div>
                <div className="p-4 bg-gray-100 max-h-[70vh] overflow-auto flex justify-center">
                    <div className="relative">
                        <img ref={imgRef} src={imageSrc} alt="Mark" onLoad={handleImageLoad} className="hidden" />
                        <canvas
                            ref={canvasRef}
                            className="border rounded bg-white touch-none"
                            onMouseDown={start}
                            onMouseMove={move}
                            onMouseUp={end}
                            onMouseLeave={end}
                            onTouchStart={start}
                            onTouchMove={move}
                            onTouchEnd={end}
                        />
                    </div>
                </div>
                <div className="p-4 border-t flex gap-2">
                    <button onClick={onCancel} className="flex-1 border rounded-lg py-2 hover:bg-gray-50">Cancel</button>
                    <button onClick={() => { setLines([]); redraw([]); }} className="flex-1 border rounded-lg py-2 hover:bg-gray-50">Clear</button>
                    <button onClick={handleDone} className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700">Apply Marks</button>
                </div>
            </div>
        </div>
    );
}

function CheckScannerModal({ vendors, onExtracted, onClose }) {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [showMarker, setShowMarker] = useState(false);
    const cameraInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowed.includes(file.type)) {
            setError("Invalid file type. Use JPG, PNG, WEBP.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("File size exceeds 5MB.");
            return;
        }

        setError(null);
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleScan = async () => {
        if (!imageFile) return;
        setScanning(true);
        setError(null);

        try {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(",")[1]);
                reader.onerror = reject;
                reader.readAsDataURL(imageFile);
            });

            const vendorPayload = Array.isArray(vendors) && vendors.length > 0
                ? vendors.map((v) => ({ id: v.id, name: v.name, gstin: v.gstin }))
                : undefined;

            const response = await fetch("/api/scan-check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: base64,
                    vendors: vendorPayload
                }),
            });

            if (!response.ok) {
                const { error: apiError } = await response.json();
                throw new Error(apiError || "Failed to scan payment document");
            }

            const resJson = await response.json();
            let data = resJson.data;

            if (!data && resJson.rawText) {
                const start = resJson.rawText.indexOf("{");
                const end = resJson.rawText.lastIndexOf("}");
                if (start !== -1 && end !== -1 && end > start) {
                    let jsonStr = resJson.rawText.substring(start, end + 1);
                    jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
                    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1");
                    data = JSON.parse(jsonStr);
                }
            }

            if (!data) {
                throw new Error("Could not parse AI response");
            }

            onExtracted(data, base64);
            onClose();
        } catch (err) {
            setError(err.message || "Failed to scan document.");
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ScanLine className="text-blue-600" size={22} />
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Scan Cheque / RTGS / Receipt</h2>
                            <p className="text-xs text-gray-500">AI extracts details and automatically matches the vendor</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors" disabled={scanning}>
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

                    {!imagePreview ? (
                        <div className="space-y-3">
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all">
                                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600 font-medium text-center px-4">
                                    Upload Cheque, RTGS Statement, or Receipt
                                </p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (MAX 5MB)</p>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={scanning} />
                            </label>
                            <button
                                onClick={() => cameraInputRef.current?.click()}
                                className="w-full px-4 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 font-medium"
                                disabled={scanning}
                            >
                                <Camera size={18} />
                                Take Photo of Cheque / RTGS / Receipt
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
                                Supports bank cheques, RTGS/NEFT slips, and printed or handwritten Money Receipts (रसीद).
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="relative">
                                <img src={imagePreview} alt="Document preview" className="w-full max-h-72 object-contain bg-gray-50 rounded-lg border" />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button onClick={() => setShowCropper(true)} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600" title="Crop">
                                        <Crop size={16} />
                                    </button>
                                    <button onClick={() => setShowMarker(true)} className="p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600" title="Mark">
                                        <PenSquare size={16} />
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleScan}
                                disabled={scanning}
                                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2 font-medium"
                            >
                                {scanning ? <Loader2 className="animate-spin" size={18} /> : <ScanLine size={18} />}
                                {scanning ? "AI Scanning & Matching..." : "Extract Details & Match Vendor"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showCropper && imagePreview && (
                <ImageCropper
                    imageSrc={imagePreview}
                    onCancel={() => setShowCropper(false)}
                    onCropComplete={(file) => {
                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onload = (ev) => setImagePreview(ev.target.result);
                        reader.readAsDataURL(file);
                        setShowCropper(false);
                    }}
                />
            )}

            {showMarker && imagePreview && (
                <ImageMarker
                    imageSrc={imagePreview}
                    onCancel={() => setShowMarker(false)}
                    onDone={(file) => {
                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onload = (ev) => setImagePreview(ev.target.result);
                        reader.readAsDataURL(file);
                        setShowMarker(false);
                    }}
                />
            )}
        </div>
    );
}

// ============================================================================
// HELPER FUNCTIONS FOR FUZZY & NORMALIZED VENDOR MATCHING
// ============================================================================

function cleanString(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .replace(/\b(m\/s\.?|messrs\.?|shree|shri|pay\s+to|pay|or\s+bearer|a\/c\s+payee|m\/s|ms)\b/gi, " ")
        .replace(/\b(pvt\.?|private|ltd\.?|limited|llp|corp\.?|co\.?|company)\b/gi, " ")
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function wordMatch(qw, vw) {
    if (qw === vw) return true;
    if (qw.length > 2 && vw.length > 2) {
        if (vw.startsWith(qw) || qw.startsWith(vw)) return true;
    }
    return false;
}

function matchScore(query, vendor) {
    if (!query || !vendor?.name) return 0;

    // Check GSTIN exact match
    if (vendor.gstin && query.trim().toUpperCase() === vendor.gstin.toUpperCase()) {
        return 100;
    }

    const cleanQ = cleanString(query);
    const cleanV = cleanString(vendor.name);
    if (!cleanQ || !cleanV) return 0;

    // 1. Exact cleaned match
    if (cleanQ === cleanV) return 100;

    // 2. Compact match (ignoring all spaces e.g. "hm enterprises" vs "h m enterprises")
    const compactQ = cleanQ.replace(/\s+/g, "");
    const compactV = cleanV.replace(/\s+/g, "");
    if (compactQ === compactV) return 98;

    // 3. Prefix match for initials / abbreviations (e.g. "hm" starts "hmenterprises")
    if (compactQ.length >= 2 && compactV.startsWith(compactQ)) {
        return 85;
    }

    // 4. Substring inclusion match with ratio weighting
    if (compactV.includes(compactQ) || compactQ.includes(compactV)) {
        const ratio = Math.min(compactQ.length, compactV.length) / Math.max(compactQ.length, compactV.length);
        if (ratio > 0.35) return 75 + Math.round(ratio * 20);
        if (compactQ.length >= 3) return 65;
    }

    // 5. Word token matching
    const qWords = cleanQ.split(" ").filter(Boolean);
    const vWords = cleanV.split(" ").filter(Boolean);
    let matchedWords = 0;
    for (const qw of qWords) {
        if (vWords.some(vw => wordMatch(qw, vw))) {
            matchedWords++;
        }
    }
    if (matchedWords === qWords.length && qWords.length > 0) {
        return 70 + Math.round((matchedWords / vWords.length) * 25);
    }
    if (matchedWords > 0) {
        return Math.round((matchedWords / Math.max(qWords.length, vWords.length)) * 60);
    }

    return 0;
}

function VendorPayPickerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { companyId } = useCompany();

    const [allVendors, setAllVendors] = useState([]);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [payeeName, setPayeeName] = useState("");
    const [matchedVendors, setMatchedVendors] = useState([]);
    const [selectedVendorId, setSelectedVendorId] = useState("");
    const [aiMatchedVendor, setAiMatchedVendor] = useState(null);
    const [loadingMatch, setLoadingMatch] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [matchFailed, setMatchFailed] = useState(false);
    const [matchFailedReason, setMatchFailedReason] = useState("");
    const [error, setError] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [extractedCheckData, setExtractedCheckData] = useState(null);
    const [scannedImageBase64, setScannedImageBase64] = useState(null);
    const [vendorSearchFilter, setVendorSearchFilter] = useState("");

    // Load all vendors on mount and when companyId is available
    useEffect(() => {
        const fetchVendors = async () => {
            setLoadingVendors(true);
            try {
                let query = supabase.from("vendors").select("id, name, gstin");
                if (companyId) {
                    query = query.eq("company_id", companyId);
                }
                const { data, error: fetchErr } = await query.order("name", { ascending: true });
                if (fetchErr) throw fetchErr;
                setAllVendors(data || []);
            } catch (err) {
                console.error("Error loading vendors:", err);
            } finally {
                setLoadingVendors(false);
            }
        };

        fetchVendors();
    }, [companyId]);

    // Pre-select vendor if passed in URL query param
    useEffect(() => {
        const queryVendorId = searchParams?.get("vendorId");
        if (queryVendorId) {
            setSelectedVendorId(queryVendorId);
        }
    }, [searchParams]);

    const handleExtracted = async (data, base64) => {
        setExtractedCheckData(data || null);
        if (base64) {
            setScannedImageBase64(base64);
        }
        setError(null);
        setHasSearched(true);

        const extractedPayee = (data?.receipt_issued_by || data?.payee_name || data?.pay_name || "").trim();
        setPayeeName(extractedPayee);

        let vendorList = allVendors;
        if (!vendorList || vendorList.length === 0) {
            try {
                let q = supabase.from("vendors").select("id, name, gstin");
                if (companyId) q = q.eq("company_id", companyId);
                const { data: vData } = await q.order("name", { ascending: true });
                if (vData) {
                    vendorList = vData;
                    setAllVendors(vData);
                }
            } catch (e) {
                console.error("Failed to load vendors during extraction:", e);
            }
        }

        // 1. Direct AI match by matched_vendor_id
        let directMatch = null;
        if (data?.matched_vendor_id) {
            directMatch = (vendorList || []).find((v) => String(v.id) === String(data.matched_vendor_id));
        }

        // 2. Direct AI match by matched_vendor_name
        if (!directMatch && data?.matched_vendor_name) {
            const mName = data.matched_vendor_name.toLowerCase().trim();
            directMatch = (vendorList || []).find((v) => v.name.toLowerCase().trim() === mName);
        }

        // 3. Fallback client-side fuzzy scoring against payee/vendor name
        const scored = (vendorList || [])
            .map((v) => ({ ...v, score: matchScore(extractedPayee, v) }))
            .filter((v) => v.score >= 50)
            .sort((a, b) => b.score - a.score);

        setMatchedVendors(scored);

        if (directMatch) {
            const conf = Number(data?.vendor_match_confidence) || (scored[0]?.id === directMatch.id ? scored[0].score : 95);
            setSelectedVendorId(String(directMatch.id));
            setAiMatchedVendor({ ...directMatch, confidence: conf });
            setMatchFailed(false);
            setMatchFailedReason("");
        } else if (scored.length > 0 && scored[0].score >= 70) {
            setSelectedVendorId(String(scored[0].id));
            setAiMatchedVendor({ ...scored[0], confidence: scored[0].score });
            setMatchFailed(false);
            setMatchFailedReason("");
        } else {
            // AI match failed! Show vendor picker so user can choose.
            setSelectedVendorId("");
            setAiMatchedVendor(null);
            setMatchFailed(true);
            setMatchFailedReason(
                extractedPayee
                    ? `AI scanned the document (${data?.document_type || "Receipt / Cheque"}) but could not find a confident vendor match for "${extractedPayee}".`
                    : `AI scanned the document successfully, but could not detect an identifiable vendor name.`
            );
        }
    };

    const handleSearchManual = async () => {
        const query = (payeeName || "").trim();
        if (!query) return;

        setLoadingMatch(true);
        setHasSearched(true);
        setError(null);

        try {
            let vendorList = allVendors;
            if (!vendorList || vendorList.length === 0) {
                let q = supabase.from("vendors").select("id, name, gstin");
                if (companyId) q = q.eq("company_id", companyId);
                const { data: vData } = await q.order("name", { ascending: true });
                vendorList = vData || [];
                setAllVendors(vendorList);
            }

            const scored = vendorList
                .map((v) => ({ ...v, score: matchScore(query, v) }))
                .filter((v) => v.score >= 50)
                .sort((a, b) => b.score - a.score);

            setMatchedVendors(scored);

            if (scored.length > 0 && scored[0].score >= 70) {
                setSelectedVendorId(String(scored[0].id));
                setAiMatchedVendor({ ...scored[0], confidence: scored[0].score });
                setMatchFailed(false);
                setMatchFailedReason("");
            } else if (scored.length > 0) {
                setSelectedVendorId(String(scored[0].id));
                setAiMatchedVendor(null);
                setMatchFailed(false);
            } else {
                setSelectedVendorId("");
                setAiMatchedVendor(null);
                setMatchFailed(true);
                setMatchFailedReason(`No vendor found matching "${query}".`);
            }
        } catch (err) {
            setError(err.message || "Failed to search vendors");
            setMatchFailed(true);
        } finally {
            setLoadingMatch(false);
        }
    };

    const handleContinue = () => {
        if (!selectedVendorId) return;

        if (extractedCheckData) {
            const prefillObj = {
                vendorId: String(selectedVendorId),
                data: extractedCheckData,
            };
            if (scannedImageBase64 && scannedImageBase64.length < 3 * 1024 * 1024) {
                prefillObj.imageBase64 = scannedImageBase64;
            }
            try {
                sessionStorage.setItem("vendor_pay_prefill", JSON.stringify(prefillObj));
            } catch {
                delete prefillObj.imageBase64;
                sessionStorage.setItem("vendor_pay_prefill", JSON.stringify(prefillObj));
            }
        }
        router.push(`/vendor/${selectedVendorId}/pay`);
    };

    // Selected vendor entity
    const selectedVendor = useMemo(() => {
        return (
            allVendors.find((v) => String(v.id) === String(selectedVendorId)) ||
            matchedVendors.find((v) => String(v.id) === String(selectedVendorId)) ||
            null
        );
    }, [allVendors, matchedVendors, selectedVendorId]);

    // Filtered vendor list for manual picker
    const filteredAllVendors = useMemo(() => {
        if (!vendorSearchFilter.trim()) return allVendors;
        const q = vendorSearchFilter.toLowerCase();
        return allVendors.filter(
            (v) =>
                v.name.toLowerCase().includes(q) ||
                (v.gstin && v.gstin.toLowerCase().includes(q))
        );
    }, [allVendors, vendorSearchFilter]);

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => router.push("/vendor")}
                    className="mb-6 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                >
                    <ArrowLeft size={18} />
                    Back to Vendors
                </button>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 border-b bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50">
                        <h1 className="text-2xl font-bold text-gray-800 mb-1">Pay to Vendor</h1>
                        <p className="text-gray-600 text-sm">
                            Scan a Cheque, RTGS statement, or Receipt to let AI automatically choose the vendor and fill in payment details.
                        </p>
                    </div>

                    <div className="p-6 space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-center gap-2">
                                <AlertCircle size={18} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Extracted Cheque / RTGS / Receipt Details Card */}
                        {extractedCheckData && (
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-3 border-b border-emerald-200 pb-2">
                                    <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                                        <CheckCircle2 size={18} className="text-emerald-600" />
                                        <span>
                                            {extractedCheckData.document_type === "RECEIPT"
                                                ? "Receipt Scanned Successfully"
                                                : extractedCheckData.document_type === "RTGS"
                                                ? "RTGS Slip Scanned Successfully"
                                                : "Cheque Scanned Successfully"}
                                        </span>
                                    </div>
                                    {extractedCheckData.amount > 0 && (
                                        <span className="text-base font-bold text-emerald-900 bg-white px-3 py-0.5 rounded-full border border-emerald-300 shadow-xs">
                                            ₹{Number(extractedCheckData.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                                    {extractedCheckData.document_type === "RECEIPT" ? (
                                        <>
                                            <div>
                                                <span className="text-gray-500 block">Issued By (Vendor):</span>
                                                <span className="font-semibold text-gray-800">
                                                    {extractedCheckData.receipt_issued_by || extractedCheckData.payee_name || extractedCheckData.pay_name || "N/A"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">Receipt No:</span>
                                                <span className="font-semibold text-gray-800 font-mono">
                                                    {extractedCheckData.receipt_number || "N/A"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">Date:</span>
                                                <span className="font-semibold text-gray-800">
                                                    {extractedCheckData.date || extractedCheckData.cheque_date || "N/A"}
                                                </span>
                                            </div>
                                            {extractedCheckData.received_from && (
                                                <div>
                                                    <span className="text-gray-500 block">Received From:</span>
                                                    <span className="font-semibold text-gray-800">{extractedCheckData.received_from}</span>
                                                </div>
                                            )}
                                            {(extractedCheckData.cheque_number || extractedCheckData.rtgs_transaction_id) && (
                                                <div>
                                                    <span className="text-gray-500 block">Ref / Chq / UTR:</span>
                                                    <span className="font-semibold text-gray-800 font-mono">
                                                        {extractedCheckData.cheque_number || extractedCheckData.rtgs_transaction_id}
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <span className="text-gray-500 block">Extracted Payee:</span>
                                                <span className="font-semibold text-gray-800">{extractedCheckData.payee_name || extractedCheckData.pay_name || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">Cheque / Ref No:</span>
                                                <span className="font-semibold text-gray-800">{extractedCheckData.cheque_number || extractedCheckData.rtgs_transaction_id || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">Bank Name:</span>
                                                <span className="font-semibold text-gray-800">{extractedCheckData.cheque_bank || extractedCheckData.rtgs_bank || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">Date:</span>
                                                <span className="font-semibold text-gray-800">{extractedCheckData.cheque_date || extractedCheckData.date || "N/A"}</span>
                                            </div>
                                        </>
                                    )}
                                    {extractedCheckData.notes && (
                                        <div className="col-span-2 sm:col-span-3">
                                            <span className="text-gray-500 block">Notes / Particulars:</span>
                                            <span className="text-gray-700 truncate block">{extractedCheckData.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Scanner & Payee Match Search */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="flex-1 px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 flex items-center justify-center gap-2 font-semibold shadow-sm transition-all"
                                >
                                    <ScanLine size={20} />
                                    Scan Cheque / RTGS / Receipt
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Payee / Vendor Name (from Cheque / RTGS / Receipt)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={payeeName}
                                        onChange={(e) => setPayeeName(e.target.value)}
                                        onKeyDown={(e) => {
                                             if (e.key === "Enter") handleSearchManual();
                                        }}
                                        placeholder="e.g. Tractor House, Pritam Auto, Trade Links..."
                                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                                    />
                                    <button
                                        onClick={handleSearchManual}
                                        disabled={!payeeName.trim() || loadingMatch}
                                        className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black disabled:opacity-50 flex items-center gap-2 font-medium transition-colors shadow-xs"
                                    >
                                        {loadingMatch ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                                        Match
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* AI Matched Vendor Card */}
                        {selectedVendor && !matchFailed && (
                            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                                        {selectedVendor.name?.charAt(0)?.toUpperCase() || "V"}
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-bold text-gray-900 text-base">{selectedVendor.name}</span>
                                            {aiMatchedVendor ? (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                                    <Check size={12} className="text-emerald-600" /> AI Matched ({aiMatchedVendor.confidence || 95}%)
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                                    Selected
                                                </span>
                                            )}
                                        </div>
                                        {selectedVendor.gstin && (
                                            <span className="text-xs text-gray-500 font-mono block">GSTIN: {selectedVendor.gstin}</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedVendorId("");
                                        setAiMatchedVendor(null);
                                        setMatchFailed(true);
                                        setMatchFailedReason("Please select a vendor below:");
                                    }}
                                    className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold underline self-end sm:self-center px-2 py-1"
                                >
                                    Change Vendor
                                </button>
                            </div>
                        )}

                        {/* Matched Vendors Results (Multiple Candidates) */}
                        {loadingMatch && (
                            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-center gap-3 text-indigo-700 text-sm">
                                <Loader2 className="animate-spin" size={18} />
                                <span>Searching and scoring vendors for &ldquo;{payeeName}&rdquo;...</span>
                            </div>
                        )}

                        {!loadingMatch && matchedVendors.length > 1 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                                        <CheckCircle2 size={16} className="text-indigo-600" />
                                        Candidate Matches ({matchedVendors.length})
                                    </label>
                                    <span className="text-xs text-gray-500">Sorted by match score</span>
                                </div>
                                <div className="space-y-2">
                                    {matchedVendors.slice(0, 4).map((vendor) => {
                                        const isSelected = selectedVendorId === String(vendor.id);
                                        return (
                                            <label
                                                key={vendor.id}
                                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                                    isSelected
                                                        ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-600"
                                                        : "border-gray-200 hover:border-gray-300 bg-white"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="selectedVendor"
                                                        value={vendor.id}
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            setSelectedVendorId(e.target.value);
                                                            setAiMatchedVendor(vendor);
                                                            setMatchFailed(false);
                                                        }}
                                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <div>
                                                        <span className="font-semibold text-gray-900 block text-sm">{vendor.name}</span>
                                                        {vendor.gstin && (
                                                            <span className="text-xs text-gray-500 font-mono">GSTIN: {vendor.gstin}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                                        {vendor.score}% Match
                                                    </span>
                                                    {isSelected && <Check size={16} className="text-indigo-600" />}
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Fallback Vendor Selection: ONLY shown if AI match or search fails */}
                        {matchFailed && (
                            <div className="space-y-3 pt-2">
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
                                    <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-semibold text-amber-950">AI could not automatically match a vendor</p>
                                        <p className="text-xs text-amber-800">
                                            {matchFailedReason || "We couldn't automatically find a matching vendor from this document."}
                                        </p>
                                        <p className="text-xs font-semibold text-amber-900 pt-0.5">
                                            Please choose the vendor below:
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 border-t pt-3">
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            value={vendorSearchFilter}
                                            onChange={(e) => setVendorSearchFilter(e.target.value)}
                                            placeholder="Search vendor by name or GSTIN..."
                                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm shadow-xs"
                                        />
                                    </div>

                                    <div className="max-h-56 overflow-y-auto space-y-1.5 border rounded-xl p-2 bg-gray-50/50">
                                        {loadingVendors ? (
                                            <div className="py-6 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                                                <Loader2 className="animate-spin" size={16} />
                                                Loading vendors...
                                            </div>
                                        ) : filteredAllVendors.length === 0 ? (
                                            <div className="py-4 text-center text-gray-500 text-xs">
                                                No vendors found matching &ldquo;{vendorSearchFilter}&rdquo;
                                            </div>
                                        ) : (
                                            filteredAllVendors.map((vendor) => {
                                                const isSelected = selectedVendorId === String(vendor.id);
                                                return (
                                                    <div
                                                        key={vendor.id}
                                                        onClick={() => {
                                                            setSelectedVendorId(String(vendor.id));
                                                            setAiMatchedVendor(null);
                                                            setMatchFailed(false);
                                                        }}
                                                        className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                                                            isSelected
                                                                ? "bg-indigo-600 text-white font-semibold"
                                                                : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-100"
                                                        }`}
                                                    >
                                                        <div className="flex flex-col text-sm">
                                                            <span>{vendor.name}</span>
                                                            {vendor.gstin && (
                                                                <span className={`text-xs ${isSelected ? "text-indigo-200" : "text-gray-400"}`}>
                                                                    GSTIN: {vendor.gstin}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isSelected && <Check size={16} />}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Continue Button */}
                        <div className="pt-2">
                            <button
                                onClick={handleContinue}
                                disabled={!selectedVendorId}
                                className="w-full px-4 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 font-semibold shadow-md transition-all text-base"
                            >
                                <CreditCard size={18} />
                                {selectedVendor ? `Continue to Pay ${selectedVendor.name}` : "Select a Vendor to Continue"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-4 bg-white rounded-xl shadow-xs p-3 text-xs text-gray-600 flex items-center gap-2 border border-gray-200">
                    <Building2 size={16} className="text-gray-400 shrink-0" />
                    <span>Proceeding will open the vendor payment form with all scanned cheque, RTGS, or receipt fields automatically prefilled.</span>
                </div>
            </div>

            {showScanner && (
                <CheckScannerModal
                    vendors={allVendors}
                    onExtracted={handleExtracted}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}

export default function VendorPayPickerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>}>
            <VendorPayPickerContent />
        </Suspense>
    );
}
