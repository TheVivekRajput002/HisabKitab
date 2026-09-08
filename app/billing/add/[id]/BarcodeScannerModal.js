"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  X, 
  RefreshCw, 
  Zap, 
  ZapOff, 
  Upload, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Barcode, 
  Plus, 
  Volume2, 
  VolumeX,
  FlipHorizontal,
  History,
  Check
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

// Audio feedback helper using Web Audio API
const playBeep = (type = 'success') => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 tone
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(250, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    }
  } catch {
    // Audio context error or not allowed before interaction
  }
};

const BarcodeScannerModal = ({
  isOpen,
  onClose,
  onScanSuccess,
  searchProductByCode
}) => {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanHistory, setScanHistory] = useState([]);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success'|'error'|'info', text: string }
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const scannerRef = useRef(null);
  const lastScannedCodeRef = useRef({ code: '', time: 0 });
  const containerId = 'barcode-scanner-viewport';
  const isOperatingRef = useRef(false);

  // Keep fresh references for handlers so callbacks don't trigger scanner re-initialization
  const propsRef = useRef({
    onScanSuccess,
    searchProductByCode,
    soundEnabled,
    isProcessing
  });

  useEffect(() => {
    propsRef.current = {
      onScanSuccess,
      searchProductByCode,
      soundEnabled,
      isProcessing
    };
  }, [onScanSuccess, searchProductByCode, soundEnabled, isProcessing]);

  // Stop scanner safely
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const instance = scannerRef.current;
        scannerRef.current = null;
        if (instance.isScanning) {
          await instance.stop();
        }
        await instance.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        setIsScanning(false);
        setTorchOn(false);
      }
    }
  }, []);

  // Handle barcode result
  const handleCodeFound = useCallback(async (decodedText) => {
    if (!decodedText || propsRef.current.isProcessing) return;

    const trimmedCode = decodedText.trim();
    const now = Date.now();

    // Prevent burst duplicates within 1.5s
    if (
      lastScannedCodeRef.current.code === trimmedCode &&
      now - lastScannedCodeRef.current.time < 1500
    ) {
      return;
    }

    lastScannedCodeRef.current = { code: trimmedCode, time: now };
    setIsProcessing(true);

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(80);
      }

      const product = await propsRef.current.searchProductByCode(trimmedCode);

      if (product) {
        if (propsRef.current.soundEnabled) playBeep('success');
        const result = propsRef.current.onScanSuccess(product);
        
        const historyItem = {
          id: Date.now(),
          code: trimmedCode,
          productName: product.product_name,
          partNumber: product.part_number || product.item_code || trimmedCode,
          rate: product.selling_rate || product.purchase_rate || 0,
          status: 'success',
          action: result?.action || 'added',
          timestamp: new Date().toLocaleTimeString()
        };

        setScanHistory(prev => [historyItem, ...prev.slice(0, 9)]);
        setStatusMessage({
          type: 'success',
          text: `Added: ${product.product_name} (${result?.action === 'incremented' ? 'Qty +1' : 'Added to bill'})`
        });
      } else {
        if (propsRef.current.soundEnabled) playBeep('error');
        const historyItem = {
          id: Date.now(),
          code: trimmedCode,
          productName: null,
          partNumber: trimmedCode,
          status: 'not_found',
          timestamp: new Date().toLocaleTimeString()
        };

        setScanHistory(prev => [historyItem, ...prev.slice(0, 9)]);
        setStatusMessage({
          type: 'error',
          text: `Product with part number "${trimmedCode}" not found in inventory`
        });
      }
    } catch (err) {
      console.error('Error handling scanned barcode:', err);
      setStatusMessage({ type: 'error', text: 'Error searching product: ' + err.message });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Start camera scanner with robust fallbacks
  const startScanner = useCallback(async (targetCameraId = null) => {
    if (isOperatingRef.current) return;
    isOperatingRef.current = true;

    try {
      setCameraError(null);
      await stopScanner();

      // Ensure viewport element exists in DOM
      const element = document.getElementById(containerId);
      if (!element) {
        isOperatingRef.current = false;
        return;
      }

      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR
        ],
        verbose: false
      });

      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          return {
            width: Math.floor(minEdge * 0.85),
            height: Math.floor(minEdge * 0.55)
          };
        },
        aspectRatio: 1.333333
      };

      // Determine camera constraint strategy
      let cameraConstraint;
      if (targetCameraId) {
        cameraConstraint = { deviceId: targetCameraId };
      } else {
        cameraConstraint = { facingMode: 'environment' };
      }

      // Try starting scanner
      let startedSuccessfully = false;
      try {
        await html5QrCode.start(
          cameraConstraint,
          config,
          (decodedText) => handleCodeFound(decodedText),
          () => {}
        );
        startedSuccessfully = true;
      } catch (firstErr) {
        console.warn('First camera start attempt failed, trying fallback constraint:', firstErr);
        // Fallback to user facing camera or general constraint if back camera constraint failed
        try {
          await html5QrCode.start(
            { facingMode: 'user' },
            config,
            (decodedText) => handleCodeFound(decodedText),
            () => {}
          );
          startedSuccessfully = true;
        } catch (secondErr) {
          throw firstErr; // Throw original error for parsing
        }
      }

      if (startedSuccessfully) {
        setIsScanning(true);

        // Fetch camera list asynchronously after permission is granted
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setCameras(devices);
            if (!targetCameraId && devices.length > 0) {
              setSelectedCameraId(devices[0].id);
            }
          }
        } catch (camErr) {
          console.warn('Could not enumerate cameras list:', camErr);
        }

        // Check torch support
        try {
          const capabilities = html5QrCode.getRunningTrackCapabilities();
          if (capabilities && 'torch' in capabilities) {
            setTorchSupported(true);
          } else {
            setTorchSupported(false);
          }
        } catch {
          setTorchSupported(false);
        }
      }
    } catch (err) {
      console.error('Failed to start camera barcode scanner:', err);
      let userErrorMsg = 'Unable to access camera. Please check permissions.';
      
      const errStr = (err?.message || err?.toString() || '').toLowerCase();
      if (errStr.includes('permission') || errStr.includes('notallowed')) {
        userErrorMsg = 'Camera access was denied. Please allow camera permissions in your browser URL bar and click Retry.';
      } else if (errStr.includes('notreadable') || errStr.includes('in use') || errStr.includes('could not start')) {
        userErrorMsg = 'Camera is currently in use by another app or browser tab. Please close it and click Retry.';
      } else if (errStr.includes('notfound') || errStr.includes('no camera')) {
        userErrorMsg = 'No active camera found on your device.';
      } else if (err?.message) {
        userErrorMsg = err.message;
      }

      setCameraError(userErrorMsg);
      setIsScanning(false);
    } finally {
      isOperatingRef.current = false;
    }
  }, [handleCodeFound, stopScanner]);

  // Handle modal open/close and tab switching cleanly
  useEffect(() => {
    let timer;
    if (isOpen && activeTab === 'camera') {
      setStatusMessage({ type: 'info', text: 'Point camera at any barcode or part number' });
      timer = setTimeout(() => {
        startScanner();
      }, 150);
    } else {
      stopScanner();
      if (!isOpen) {
        setStatusMessage(null);
        setCameraError(null);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, activeTab, startScanner, stopScanner]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!scannerRef.current || !isScanning) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setTorchOn(nextState);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Switch Camera
  const handleSwitchCamera = async (e) => {
    const newCameraId = e.target.value;
    setSelectedCameraId(newCameraId);
    await startScanner(newCameraId);
  };

  // File Upload scanning
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage({ type: 'info', text: 'Scanning image for barcode...' });

    try {
      const html5QrCode = new Html5Qrcode('barcode-file-hidden-canvas', false);
      const decodedText = await html5QrCode.scanFile(file, true);
      await html5QrCode.clear();

      if (decodedText) {
        await handleCodeFound(decodedText);
      }
    } catch (err) {
      console.error('Image scan failed:', err);
      if (propsRef.current.soundEnabled) playBeep('error');
      setStatusMessage({
        type: 'error',
        text: 'No clear barcode could be detected in this image. Try taking a closer photo or enter part number manually.'
      });
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  // Manual search submit
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await handleCodeFound(manualCode.trim());
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Hidden container for file scans */}
      <div id="barcode-file-hidden-canvas" style={{ display: 'none' }}></div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-blue-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Barcode Scanner</h2>
              <p className="text-xs text-gray-300">Scan product part numbers to auto-add to bill</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled ? 'text-blue-300 hover:bg-white/10' : 'text-gray-400 hover:bg-white/10'
              }`}
              title={soundEnabled ? 'Mute Scan Beep' : 'Unmute Scan Beep'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-3 pt-2">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'camera'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'manual'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Manual Entry</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          
          {/* CAMERA TAB */}
          {activeTab === 'camera' && (
            <div className="flex flex-col items-center">
              {/* Camera Controls Bar */}
              <div className="w-full flex items-center justify-between mb-2 text-xs text-gray-600">
                {cameras.length > 1 ? (
                  <div className="flex items-center gap-1.5">
                    <FlipHorizontal className="w-3.5 h-3.5 text-gray-500" />
                    <select
                      value={selectedCameraId}
                      onChange={handleSwitchCamera}
                      className="bg-gray-100 border border-gray-300 text-gray-700 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      {cameras.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.label || `Camera ${c.id.slice(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-gray-500">Camera active</span>
                )}

                <div className="flex items-center gap-2">
                  {torchSupported && (
                    <button
                      onClick={toggleTorch}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        torchOn
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {torchOn ? <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" /> : <ZapOff className="w-3.5 h-3.5" />}
                      <span>{torchOn ? 'Flash On' : 'Flash'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => startScanner(selectedCameraId)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-colors"
                    title="Restart Camera"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? '' : 'animate-spin'}`} />
                    <span>Reload</span>
                  </button>
                </div>
              </div>

              {/* Viewport Frame */}
              <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-gray-800">
                <div id={containerId} className="w-full h-full object-cover"></div>

                {/* Laser animation overlay */}
                {isScanning && !cameraError && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Bounding box */}
                    <div className="relative w-[78%] h-[55%] border-2 border-blue-400/80 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                      {/* Corner marks */}
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-blue-500 rounded-tl"></div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-blue-500 rounded-tr"></div>
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-blue-500 rounded-bl"></div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-blue-500 rounded-br"></div>

                      {/* Moving laser beam */}
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-scannerLaser"></div>
                    </div>
                  </div>
                )}

                {/* Error Fallback */}
                {cameraError && (
                  <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center p-6 text-center text-white">
                    <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
                    <p className="font-semibold text-sm mb-1">Camera Access Issue</p>
                    <p className="text-xs text-gray-300 mb-4 max-w-xs">{cameraError}</p>
                    <button
                      onClick={() => startScanner(selectedCameraId)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Camera</span>
                    </button>
                  </div>
                )}

                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-white/95 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold text-gray-800">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Looking up product...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* UPLOAD IMAGE TAB */}
          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl bg-gray-50/50 hover:bg-blue-50/20 transition-all text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">Upload Photo with Barcode</h3>
              <p className="text-xs text-gray-500 mb-4 max-w-xs">
                Take a photo or choose an existing image containing a barcode or part number.
              </p>
              <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md transition-colors">
                <Camera className="w-4 h-4" />
                <span>Select Image File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* MANUAL ENTRY TAB */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
              <label className="text-xs font-bold text-gray-700">
                Enter Part Number or Item Code:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. PN-10492 or 890123456..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    autoFocus
                  />
                  <Barcode className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
                <button
                  type="submit"
                  disabled={!manualCode.trim() || isProcessing}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Searches your company inventory by exact Part Number, Item Code, or Product Name.
              </p>
            </form>
          )}

          {/* Status Message Banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <Barcode className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-tight">{statusMessage.text}</span>
            </div>
          )}

          {/* Scan Session History */}
          {scanHistory.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
              <div className="px-3 py-2 bg-gray-100/80 border-b border-gray-200 flex items-center justify-between text-xs font-semibold text-gray-700">
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-gray-500" />
                  <span>Items Scanned This Session ({scanHistory.length})</span>
                </span>
                <button
                  onClick={() => setScanHistory([])}
                  className="text-gray-500 hover:text-gray-800 text-[11px]"
                >
                  Clear
                </button>
              </div>
              <div className="max-h-36 overflow-y-auto divide-y divide-gray-200 text-xs">
                {scanHistory.map((item) => (
                  <div key={item.id} className="p-2.5 flex items-center justify-between bg-white hover:bg-gray-50">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.status === 'success' ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                          <X className="w-3 h-3" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {item.productName || 'Product Not Found'}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          Part #: <span className="font-mono font-medium">{item.partNumber}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      {item.status === 'success' ? (
                        <>
                          <span className="font-bold text-gray-900">₹{item.rate}</span>
                          <span className="block text-[10px] text-emerald-600 font-semibold">
                            {item.action === 'incremented' ? 'Qty +1' : 'Added'}
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] text-red-600 font-medium">Not in DB</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Ready to scan continuous barcodes</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>

      {/* Laser CSS animation */}
      <style jsx global>{`
        @keyframes scannerLaser {
          0% { top: 5%; opacity: 0.8; }
          50% { top: 90%; opacity: 1; }
          100% { top: 5%; opacity: 0.8; }
        }
        .animate-scannerLaser {
          animation: scannerLaser 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default BarcodeScannerModal;
