// hooks/useProductAutoSave.js
import { useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabaseClient';

export const useProductAutoSave = (products, productsFromDB, onProductSaved) => {
    const saveTimeouts = useRef({});

    useEffect(() => {
        products.forEach(product => {
            console.log('Checking product:', product.productName, 'In DB?', productsFromDB.has(product.id));

            if (productsFromDB.has(product.id)) return;
            if (!product.productName || !product.rate) return;

            if (saveTimeouts.current[product.id]) {
                clearTimeout(saveTimeouts.current[product.id]);
            }

            saveTimeouts.current[product.id] = setTimeout(async () => {
                try {
                    console.log('🔍 Checking if product exists in DB:', product.productName);

                    const { data: existingProduct } = await supabase
                        .from('products')
                        .select('id')
                        .eq('product_name', product.productName)
                        .eq('hsn_code', product.hsnCode)
                        .maybeSingle();

                    console.log('Existing product check result:', existingProduct);

                    if (!existingProduct) {
                        console.log('💾 Saving new product to DB:', product.productName);

                        const { data: newProduct, error } = await supabase
                            .from('products')
                            .insert([{
                                product_name: product.productName,
                                hsn_code: product.hsnCode,
                                purchase_rate: product.rate,
                                current_stock: 0,
                                minimum_stock: 5
                            }])
                            .select()
                            .single();

                        if (!error && newProduct) {
                            console.log('✅ Product auto-saved:', newProduct);

                            const productDetails = {
                                name: product.productName,
                                rate: product.rate,
                                hsn: product.hsnCode,
                                gst: product.gstPercentage
                            };

                            console.log('🚀 Calling onProductSaved with:', productDetails);

                            if (onProductSaved) {
                                onProductSaved(productDetails);
                            } else {
                                console.error('❌ onProductSaved callback is not defined!');
                            }
                        } else if (error) {
                            console.error('❌ Error saving product:', error);
                        }
                    } else {
                        console.log('⏭️ Product already exists, skipping:', product.productName);
                    }
                } catch (error) {
                    console.error('❌ Error auto-saving product:', error);
                }
            }, 4000);
        });

        return () => {
            Object.values(saveTimeouts.current).forEach(timeout => clearTimeout(timeout));
        };
    }, [products, productsFromDB, onProductSaved]);
};