import React, { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';


const PhotoCapture = ({ onPhotoCapture, photos, onRemovePhoto }) => {
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploading(true);
            await onPhotoCapture(file);
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="p-6 bg-white border-t-2 border-gray-300">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Attach Photos</h3>

            {/* Upload Buttons */}
            <div className="flex gap-3 mb-4">
                {/* Camera Button */}
                <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold shadow-lg"
                >
                    <Camera className="mr-2 w-5 h-5" />
                    {uploading ? 'Uploading...' : 'Take Photo'}
                </button>

                {/* Gallery Button */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold shadow-lg"
                >
                    <Upload className="mr-2 w-5 h-5" />
                    {uploading ? 'Uploading...' : 'Upload from Gallery'}
                </button>

                {/* Hidden Inputs */}
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Photo Preview Grid */}
            {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={photo}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                            />
                            <button
                                onClick={() => onRemovePhoto(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {photos.length === 0 && (
                <p className="text-gray-500 text-sm">No photos attached yet</p>
            )}
        </div>
    );
};

export default PhotoCapture;