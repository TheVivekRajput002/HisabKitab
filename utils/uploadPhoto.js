import { supabase } from './supabaseClient';

// Compress image using Canvas API
const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => reject(new Error('Image load failed'));
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
    });
};

export const uploadPhoto = async (file, invoiceNumber) => {
    try {
        console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');

        // Compress image
        const compressedBlob = await compressImage(file, 1200, 0.8);
        console.log('Compressed file size:', (compressedBlob.size / 1024 / 1024).toFixed(2), 'MB');

        // Generate unique filename
        const fileName = `${invoiceNumber}-${Date.now()}.jpg`;
        const filePath = `${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('invoice-photos')
            .upload(filePath, compressedBlob, {
                cacheControl: '3600',
                upsert: false,
                contentType: 'image/jpeg'
            });

        if (error) throw error;

        // Return just the filename, not the full URL
        // This matches what InvoiceViewEdit expects
        return filePath;
    } catch (error) {
        console.error('Error uploading photo:', error);
        throw error;
    }
};