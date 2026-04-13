"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ScanLine, Loader2, Search, CreditCard, Upload, X, Building2 } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useCompany } from "@/hooks/useCompany";

function CheckScannerModal({ onExtracted, onClose }) {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);

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

            const response = await fetch("/api/scan-check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64: base64 }),
            });

            if (!response.ok) {
                const { error: apiError } = await response.json();
                throw new Error(apiError || "Failed to scan check");
            }

            const { rawText } = await response.json();
            const start = rawText.indexOf("{");
            const end = rawText.lastIndexOf("}");
            if (start === -1 || end === -1 || end <= start) {
                throw new Error("Could not parse AI response");
            }

            let jsonStr = rawText.substring(start, end + 1);
            jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
            jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1");
            const data = JSON.parse(jsonStr);

            onExtracted(data);
            onClose();
        } catch (err) {
            setError(err.message || "Failed to scan check.");
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
                        <h2 className="text-lg font-bold text-gray-800">Scan Check</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors" disabled={scanning}>
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

                    {!imagePreview ? (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all">
                            <Upload className="w-10 h-10 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Upload check image</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (MAX 5MB)</p>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={scanning} />
                        </label>
                    ) : (
                        <div className="space-y-3">
                            <img src={imagePreview} alt="Check preview" className="w-full max-h-72 object-contain bg-gray-50 rounded-lg border" />
                            <button
                                onClick={handleScan}
                                disabled={scanning}
                                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {scanning ? <Loader2 className="animate-spin" size={18} /> : <ScanLine size={18} />}
                                {scanning ? "Extracting..." : "Extract Check Details"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function VendorPayPickerPage() {
    const router = useRouter();
    const { companyId } = useCompany();

    const [vendorIdInput, setVendorIdInput] = useState("");
    const [payeeName, setPayeeName] = useState("");
    const [matchedVendors, setMatchedVendors] = useState([]);
    const [selectedVendorId, setSelectedVendorId] = useState("");
    const [loadingMatch, setLoadingMatch] = useState(false);
    const [error, setError] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [extractedCheckData, setExtractedCheckData] = useState(null);

    const canContinue = useMemo(() => {
        return Boolean(selectedVendorId || vendorIdInput.trim());
    }, [selectedVendorId, vendorIdInput]);

    const findVendorsByPayee = async (name) => {
        if (!name || !companyId) return;
        setLoadingMatch(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from("vendors")
                .select("id, name, gstin")
                .eq("company_id", companyId)
                .ilike("name", `%${name.trim()}%`)
                .order("name", { ascending: true });

            if (fetchError) throw fetchError;
            setMatchedVendors(data || []);
            if (data?.length === 1) {
                setSelectedVendorId(String(data[0].id));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingMatch(false);
        }
    };

    const handleExtracted = async (data) => {
        setExtractedCheckData(data || null);
        const extractedPayee = data?.payee_name || data?.pay_name || "";
        setPayeeName(extractedPayee);
        if (extractedPayee) {
            await findVendorsByPayee(extractedPayee);
        }
    };

    const handleSearchManual = async () => {
        await findVendorsByPayee(payeeName);
    };

    const handleContinue = () => {
        const finalVendorId = selectedVendorId || vendorIdInput.trim();
        if (!finalVendorId) return;
        if (extractedCheckData) {
            sessionStorage.setItem(
                "vendor_pay_prefill",
                JSON.stringify({
                    vendorId: String(finalVendorId),
                    data: extractedCheckData,
                })
            );
        }
        router.push(`/vendor/${finalVendorId}/pay`);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => router.push("/vendor")}
                    className="mb-6 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                >
                    <ArrowLeft size={18} />
                    Back to Vendor
                </button>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Pay to Vendor</h1>
                        <p className="text-gray-600">Scan check to match payee with vendor, or enter vendor ID manually.</p>
                    </div>

                    <div className="p-6 space-y-5">
                        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

                        <div className="space-y-3">
                            <button
                                onClick={() => setShowScanner(true)}
                                className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                            >
                                <ScanLine size={18} />
                                Scan Check and Match Vendor
                            </button>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payee Name (from check)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={payeeName}
                                        onChange={(e) => setPayeeName(e.target.value)}
                                        placeholder="Enter or scan payee name"
                                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        onClick={handleSearchManual}
                                        disabled={!payeeName.trim() || loadingMatch}
                                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black disabled:opacity-60 flex items-center gap-2"
                                    >
                                        {loadingMatch ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                                        Match
                                    </button>
                                </div>
                            </div>
                        </div>

                        {matchedVendors.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Matched Vendors</label>
                                <div className="space-y-2">
                                    {matchedVendors.map((vendor) => (
                                        <label
                                            key={vendor.id}
                                            className={`block p-3 rounded-lg border cursor-pointer ${
                                                selectedVendorId === String(vendor.id) ? "border-indigo-500 bg-indigo-50" : "border-gray-200"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="selectedVendor"
                                                value={vendor.id}
                                                checked={selectedVendorId === String(vendor.id)}
                                                onChange={(e) => setSelectedVendorId(e.target.value)}
                                                className="mr-2"
                                            />
                                            <span className="font-medium text-gray-800">{vendor.name}</span>
                                            <span className="ml-2 text-xs text-gray-500">ID: {vendor.id}</span>
                                            {vendor.gstin && <span className="ml-2 text-xs text-gray-500">GSTIN: {vendor.gstin}</span>}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-2 border-t">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Or enter Vendor ID manually</label>
                            <input
                                type="text"
                                value={vendorIdInput}
                                onChange={(e) => setVendorIdInput(e.target.value)}
                                placeholder="Vendor ID"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Manual ID works if check match is not found.</p>
                        </div>

                        <button
                            onClick={handleContinue}
                            disabled={!canContinue}
                            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 flex items-center justify-center gap-2 font-medium"
                        >
                            <CreditCard size={18} />
                            Continue to Payment Page
                        </button>
                    </div>
                </div>

                <div className="mt-4 bg-white rounded-lg shadow-sm p-3 text-xs text-gray-600 flex items-center gap-2">
                    <Building2 size={14} />
                    This opens the same vendor payment page used in vendor bill flow.
                </div>
            </div>

            {showScanner && <CheckScannerModal onExtracted={handleExtracted} onClose={() => setShowScanner(false)} />}
        </div>
    );
}
