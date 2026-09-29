"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { useCompany } from '@/hooks/useCompany';

// Import custom hooks
import { useCustomerSearch } from '@/hooks/useCustomerSearch';
import { useInvoiceCalculations } from '@/hooks/useInvoiceCalculations';
import { useProductAutoSave } from '@/hooks/useProductAutoSave';

// Import components (same folder)
import InvoiceHeader from './InvoiceHeader';
import CustomerDetailsForm from './CustomerDetailsForm';
import ProductsTable from './ProductsTable';
import InvoiceSummary from './InvoiceSummary';
import BarcodeScannerModal from './BarcodeScannerModal';

// pdf send
import { uploadInvoicePDF } from '@/utils/uploadInvoicePDF';
import InvoicePDF from './InvoicePDF';

import { ToastContainer } from './Toast';

// photos 
import { uploadPhoto } from '@/utils/uploadPhoto';



const InvoiceEstimateAdd = () => {

  const params = useParams();
  const id = params?.id;
  const isInvoice = id === 'invoice';
  const { companyId } = useCompany();

  const router = useRouter();
  const inputRefs = useRef({});
  const [photos, setPhotos] = useState([]);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);

  // Date states
  const [invoiceDate, setInvoiceDate] = useState('');
  const [gstIncluded, setGstIncluded] = useState(false);
  const [paymentMode, setPaymentMode] = useState('unpaid');
  const [gstin, setGstin] = useState('');
  const [saving, setSaving] = useState(false);
  const [invoiceSaved, setInvoiceSaved] = useState(false);
  const [savedInvoiceData, setSavedInvoiceData] = useState(null);
  const [estimateNumber, setEstimateNumber] = useState('Loading...');

  // toast 
  const [toasts, setToasts] = useState([]);
  const [newlyAddedProducts, setNewlyAddedProducts] = useState(new Set());

  const handlePhotoCapture = async (file) => {
    const uploadId = Date.now();

    try {
      // Add uploading placeholder with progress
      setPhotos(prev => [...prev, {
        id: uploadId,
        url: null,
        uploading: true,
        name: file.name
      }]);

      // uploadPhoto now returns just the filename
      const photoFileName = await uploadPhoto(
        file,
        isInvoice ? savedInvoiceData.invoice.invoice_number : savedInvoiceData.invoice.estimate_number
      );

      // Save to database immediately - store just the filename
      const { error } = await supabase
        .from('invoice_photos')
        .insert([{
          ...(isInvoice
            ? { invoice_id: savedInvoiceData.invoice.id }
            : { estimate_id: savedInvoiceData.invoice.id }),
          photo_url: photoFileName  // Store filename, not full URL
        }]);

      if (error) throw error;

      // Replace placeholder with filename
      setPhotos(prev => prev.map(p =>
        p.id === uploadId
          ? { id: uploadId, url: photoFileName, uploading: false }
          : p
      ));

      alert('Photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo: ' + error.message);
      // Remove failed placeholder
      setPhotos(prev => prev.filter(p => p.id !== uploadId));
    }
  };

  const handleRemovePhoto = async (index) => {
    const photoToRemove = photos[index];

    // Don't allow removing while uploading
    if (photoToRemove.uploading) {
      alert('Please wait for upload to complete');
      return;
    }

    setPhotos(prev => prev.filter((_, i) => i !== index));
  };



  // In InvoiceGenerator component, update the addToast function:
  const addToast = (productDetails) => {
    console.log('📢 addToast called with:', productDetails);
    const newToast = {
      id: Date.now(),
      productDetails: productDetails
    };
    console.log('📦 Creating toast:', newToast);
    setToasts(prev => {
      console.log('Previous toasts:', prev);
      const updated = [...prev, newToast];
      console.log('Updated toasts:', updated);
      return updated;
    });
  };

  // In InvoiceGenerator, add this useEffect after the addToast function:
  useEffect(() => {
    if (toasts.length > 0) {
      console.log('🎉 Toast created:', toasts);
    }
  }, [toasts]);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };


  // Customer states
  const [customerDetails, setCustomerDetails] = useState({
    customerName: '',
    customerAddress: '',
    vehicle: '',
    phoneNumber: '',
    vehicles: []
  });
  const [phoneError, setPhoneError] = useState('');

  // Product states
  const [products, setProducts] = useState([{
    id: 1,
    serialNumber: 1,
    productName: '',
    hsnCode: '',
    quantity: '',
    rate: '',
    gstPercentage: 0,
    totalAmount: 0
  }]);
  const [productsFromDB, setProductsFromDB] = useState(new Set());
  const [productSearchResults, setProductSearchResults] = useState({});
  const [showProductDropdown, setShowProductDropdown] = useState({});
  const [searchingProduct, setSearchingProduct] = useState({});
  const [invoiceNumber, setInvoiceNumber] = useState('Loading...');

  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Custom hooks
  const { searching: searchingCustomer, found: customerFound, customerData, searchResults: customerSearchResults } = useCustomerSearch(customerDetails.phoneNumber, companyId);
  const { calculateProductTotal, subtotal, totalGST, grandTotal } = useInvoiceCalculations(products, gstIncluded);
  useProductAutoSave(products, productsFromDB, (productDetails) => {
    addToast(productDetails);
    setNewlyAddedProducts(prev => new Set([...prev, productDetails.name]));
  }, companyId);

  const calculateGSTDistribution = () => {
    const distribution = {};

    products.forEach(product => {
      let baseAmount;
      let gstAmount;

      if (gstIncluded) {
        // When GST is included in rate
        const basePrice = product.rate / (1 + product.gstPercentage / 100);
        baseAmount = product.quantity * basePrice;
        gstAmount = (product.quantity * product.rate) - baseAmount;
      } else {
        // When GST is not included
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

  // Helper function for IST date
  const getISTDate = (daysOffset = 0) => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    if (daysOffset !== 0) {
      istTime.setDate(istTime.getDate() + daysOffset);
    }
    return istTime.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!companyId) return;

    const fetchNextInvoiceNumber = async () => {
      try {

        if (isInvoice) {
          // Get the current counter value
          const { data, error } = await supabase
            .from('invoice_counter')
            .select('current_number')
            .eq('id', 1)
            .single();

          if (error) throw error;

          const nextNumber = (data.current_number || 0) + 1;
          setInvoiceNumber(`INV${String(nextNumber).padStart(3, '0')}`);


        } else {

          // Get the last estimate number from the database for this company
          const { data, error } = await supabase
            .from('estimate')
            .select('estimate_number')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(1);

          if (error) throw error;

          if (data && data.length > 0) {
            // Extract number from last estimate (e.g., "EST001" -> 1)
            const lastNumber = parseInt(data[0].estimate_number.replace('EST', ''));
            const nextNumber = lastNumber + 1;
            setEstimateNumber(`EST${String(nextNumber).padStart(3, '0')}`);
          } else {
            // First estimate
            setEstimateNumber('EST001');
          }
          // Fetch from estimate table (existing code from EstimateAdd.js)
        }


      } catch (error) {
        console.error('Error fetching invoice number:', error);
        if (isInvoice) {
          setInvoiceNumber('INV001');
        } else {
          setEstimateNumber('EST001');
        }
      }
    };

    fetchNextInvoiceNumber();
  }, [isInvoice, companyId]);

  // Initialize date
  useEffect(() => {
    setInvoiceDate(getISTDate(0));
  }, []);

  // Auto-fill customer details when found
  useEffect(() => {
    if (customerData) {
      setCustomerDetails({
        customerName: customerData.name || '',
        customerAddress: customerData.address || '',
        vehicle: customerData.vehicles && customerData.vehicles.length > 0 
          ? customerData.vehicles[0].vehicle_number 
          : '',
        phoneNumber: customerData.phone_number,
        vehicles: customerData.vehicles || []
      });
    }
  }, [customerData]);

  // Recalculate totals when GST toggle changes
  // Recalculate totals when GST toggle changes
  useEffect(() => {
    setProducts(prev => prev.map(product => ({
      ...product,
      gstPercentage: product.gstPercentage,
      totalAmount: calculateProductTotal(
        product.quantity,
        product.rate,
        product.gstPercentage
      )
    })));
  }, [gstIncluded]);

  // Product search
  useEffect(() => {
    const searchProductsFromDB = async (searchQuery, productId) => {
      if (!searchQuery || searchQuery.length < 2) {
        setProductSearchResults(prev => ({ ...prev, [productId]: [] }));
        return;
      }

      setSearchingProduct(prev => ({ ...prev, [productId]: true }));

      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, product_name, hsn_code, purchase_rate, gst_percentage, current_stock, minimum_stock, brand')
          .eq('company_id', companyId)
          .or(`product_name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) throw error;

        setProductSearchResults(prev => ({ ...prev, [productId]: data || [] }));
      } catch (error) {
        console.error('Error searching products:', error);
        setProductSearchResults(prev => ({ ...prev, [productId]: [] }));
      } finally {
        setSearchingProduct(prev => ({ ...prev, [productId]: false }));
      }
    };

    const timers = {};
    products.forEach(product => {
      if (product.productName && product.productName.length >= 2) {
        timers[product.id] = setTimeout(() => {
          searchProductsFromDB(product.productName, product.id);
        }, 500);
      }
    });

    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, [products]);

  // Customer change handler
  const handleCustomerChange = (field, value) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }));

    if (field === 'phoneNumber') {
      setShowCustomerDropdown(value.length > 0);

      if (value.length === 0) {
        setPhoneError('');
      } else if (value.length < 10) {
        setPhoneError('Phone number must be 10 digits');
      } else if (value.length > 10) {
        setPhoneError('Phone number cannot exceed 10 digits');
      } else {
        setPhoneError(''); // ✅ Clear error when exactly 10 digits
      }
    }
  };

  // Customer select from dropdown
  const handleCustomerSelect = (selectedCustomer) => {
    setCustomerDetails({
      customerName: selectedCustomer.name || '',
      customerAddress: selectedCustomer.address || '',
      vehicle: selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0 
        ? selectedCustomer.vehicles[0].vehicle_number 
        : '',
      phoneNumber: selectedCustomer.phone_number,
      vehicles: selectedCustomer.vehicles || []
    });
    setGstin(selectedCustomer.gstin || '');
    setShowCustomerDropdown(false);
    setPhoneError('');
  };



  // Product change handler
  const handleProductChange = (id, field, value) => {
    setProducts(prev => prev.map(product => {
      if (product.id === id) {
        const updated = { ...product, [field]: value };

        if (field === 'productName') {
          setShowProductDropdown(prev => ({ ...prev, [id]: value.length >= 2 }));
        }

        if (['quantity', 'rate', 'gstPercentage'].includes(field)) {
          updated.totalAmount = calculateProductTotal(
            field === 'quantity' ? value : updated.quantity,
            field === 'rate' ? value : updated.rate,
            field === 'gstPercentage' ? value : updated.gstPercentage
          );
        }

        return updated;
      }
      return product;
    }));
  };

  // Product select from dropdown
  const handleProductSelect = (productId, selectedProduct) => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        const updated = {
          ...product,
          productName: selectedProduct.product_name,
          hsnCode: selectedProduct.hsn_code,
          rate: selectedProduct.purchase_rate,
          gstPercentage: selectedProduct.gst_percentage || 0
        };

        updated.totalAmount = calculateProductTotal(
          updated.quantity,
          updated.rate,
          updated.gstPercentage
        );

        return updated;
      }
      return product;
    }));

    setProductsFromDB(prev => new Set([...prev, productId]));
    setShowProductDropdown(prev => ({ ...prev, [productId]: false }));
  };

  const addProduct = () => {
    const newProduct = {
      id: Date.now(),
      serialNumber: products.length + 1,
      productName: '',
      hsnCode: '',
      quantity: '',
      rate: '',
      gstPercentage: 0,
      totalAmount: 0
    };
    setProducts([...products, newProduct]);
  };

  const removeProduct = (id) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  // Search product by barcode (part_number, item_code, or product_name)
  const searchProductByCode = async (scannedCode) => {
    if (!scannedCode || !companyId) return null;
    const cleanCode = scannedCode.trim();

    try {
      // 1. Try matching part_number
      let { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', companyId)
        .ilike('part_number', cleanCode)
        .limit(1);

      if (!error && data && data.length > 0) {
        return data[0];
      }

      // 2. Try matching item_code
      const resCode = await supabase
        .from('products')
        .select('*')
        .eq('company_id', companyId)
        .ilike('item_code', cleanCode)
        .limit(1);

      if (!resCode.error && resCode.data && resCode.data.length > 0) {
        return resCode.data[0];
      }

      // 3. Fallback: Try matching product_name
      const resName = await supabase
        .from('products')
        .select('*')
        .eq('company_id', companyId)
        .ilike('product_name', `%${cleanCode}%`)
        .limit(1);

      if (!resName.error && resName.data && resName.data.length > 0) {
        return resName.data[0];
      }

      return null;
    } catch (err) {
      console.error('Error searching product by barcode:', err);
      return null;
    }
  };

  // Add scanned product from barcode scanner to bill
  const handleAddProductFromBarcode = (foundProduct) => {
    const rate = Number(foundProduct.selling_rate || foundProduct.purchase_rate || 0);
    const gst = Number(foundProduct.gst_percentage || 0);

    let action = 'added';

    // Check if product already exists in current table
    const existingIndex = products.findIndex(
      p => p.productName && p.productName.trim().toLowerCase() === foundProduct.product_name.trim().toLowerCase()
    );

    if (existingIndex !== -1) {
      setProducts(prev => prev.map((p, idx) => {
        if (idx === existingIndex) {
          const newQty = (Number(p.quantity) || 0) + 1;
          const newTotal = calculateProductTotal(
            newQty,
            p.rate || rate,
            p.gstPercentage !== undefined ? p.gstPercentage : gst
          );
          return {
            ...p,
            quantity: newQty,
            rate: p.rate || rate,
            gstPercentage: p.gstPercentage !== undefined ? p.gstPercentage : gst,
            totalAmount: newTotal
          };
        }
        return p;
      }));
      action = 'incremented';
    } else {
      // Check for first empty row
      const emptyIndex = products.findIndex(
        p => (!p.productName || p.productName.trim() === '') && (!p.rate || p.rate === '' || p.rate === 0)
      );

      const newRowData = {
        productName: foundProduct.product_name,
        hsnCode: foundProduct.hsn_code || '',
        quantity: 1,
        rate: rate,
        gstPercentage: gst,
        totalAmount: calculateProductTotal(1, rate, gst)
      };

      if (emptyIndex !== -1) {
        const targetId = products[emptyIndex].id;
        setProducts(prev => prev.map((p, idx) => {
          if (idx === emptyIndex) {
            return {
              ...p,
              ...newRowData
            };
          }
          return p;
        }));
        setProductsFromDB(prev => new Set([...prev, targetId]));
      } else {
        const newId = Date.now();
        setProducts(prev => [
          ...prev,
          {
            id: newId,
            serialNumber: prev.length + 1,
            ...newRowData
          }
        ]);
        setProductsFromDB(prev => new Set([...prev, newId]));
      }
      action = 'added';
    }

    return { product: foundProduct, action };
  };

  const getNextInvoiceNumber = async () => {
    try {
      const { data, error } = await supabase.rpc('get_next_invoice_number');
      if (error) throw error;
      return `${data}`; // Format as INV001, INV002, etc.
    } catch (error) {
      console.error('Error generating invoice number:', error);
      throw error;
    }
  };

  // Deduct stock
  const deductStockForProducts = async (productsToDeduct) => {
    try {
      for (const product of productsToDeduct) {
        if (!product.productName || !product.hsnCode || !product.rate) continue;

        const { data: existingProduct, error: fetchError } = await supabase
          .from('products')
          .select('id, current_stock')
          .eq('product_name', product.productName)
          .eq('hsn_code', product.hsnCode)
          .maybeSingle();

        if (fetchError || !existingProduct) continue;

        const newStock = Math.max(0, existingProduct.current_stock - product.quantity);

        await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('id', existingProduct.id);
      }
    } catch (error) {
      console.error('Error in stock deduction:', error);
    }
  };

  // Handle Next Invoice - Reset form and prepare for new invoice
  const handleNextInvoice = async () => {
    // Reset form
    setCustomerDetails({ customerName: '', customerAddress: '', vehicle: '', phoneNumber: '', vehicles: [] });
    setProducts([{ id: 1, serialNumber: 1, productName: '', hsnCode: '', quantity: '', rate: '', gstPercentage: 0, totalAmount: 0 }]);
    setPaymentMode('unpaid');
    setGstin('');
    setPhotos([]);
    setInvoiceSaved(false);
    setSavedInvoiceData(null);
    setNewlyAddedProducts(new Set());

    // Fetch next invoice/estimate number
    if (isInvoice) {
      try {
        const { data: counterData, error: counterError } = await supabase
          .from('invoice_counter')
          .select('current_number')
          .eq('id', 1)
          .single();

        if (!counterError && counterData) {
          const nextNumber = (counterData.current_number || 0) + 1;
          setInvoiceNumber(`INV${String(nextNumber).padStart(3, '0')}`);
        }
      } catch (fetchError) {
        console.error('Error fetching updated invoice number:', fetchError);
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('estimate')
          .select('estimate_number')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const lastNumber = parseInt(data[0].estimate_number.replace('EST', ''));
          const nextNumber = lastNumber + 1;
          setEstimateNumber(`EST${String(nextNumber).padStart(3, '0')}`);
        } else {
          setEstimateNumber('EST001');
        }
      } catch (fetchError) {
        console.error('Error fetching updated estimate number:', fetchError);
      }
    }
  };

  const saveInvoice = async () => {
    setSaving(true);

    try {
      let customerId;

      const { data: existingCustomers } = await supabase
        .from('customers')
        .select('id')
        .eq('phone_number', customerDetails.phoneNumber)
        .eq('company_id', companyId);

      if (existingCustomers && existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([{
            name: customerDetails.customerName,
            phone_number: customerDetails.phoneNumber,
            address: customerDetails.customerAddress,
            vehicle: null,
            company_id: companyId
          }])
          .select()
          .single();

        if (customerError) {
          throw new Error('Failed to create customer: ' + customerError.message);
        }
        customerId = newCustomer.id;
      }

      // Manage vehicle record in vehicles table
      let vehicleId = null;
      const selectedVehicleText = customerDetails.vehicle?.trim();
      if (selectedVehicleText) {
        const { data: existingVehicles } = await supabase
          .from('vehicles')
          .select('id')
          .eq('customer_id', customerId)
          .ilike('vehicle_number', selectedVehicleText);

        if (existingVehicles && existingVehicles.length > 0) {
          vehicleId = existingVehicles[0].id;
        } else {
          const { data: newVehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .insert([{
              customer_id: customerId,
              vehicle_number: selectedVehicleText.toUpperCase(),
              company_id: companyId
            }])
            .select()
            .single();

          if (!vehicleError && newVehicle) {
            vehicleId = newVehicle.id;
          }
        }
      }

      const { data: invoiceData, error: invoiceError } = await supabase
        .from(isInvoice ? 'invoices' : 'estimate')
        .insert([{
          ...(isInvoice
            ? { invoice_number: await getNextInvoiceNumber() }
            : { estimate_number: estimateNumber }),
          customer_id: customerId,
          bill_date: invoiceDate,
          generated_by: 'system',
          total_amount: grandTotal,
          mode_of_payment: paymentMode,
          gstin: gstin,
          gst_included: gstIncluded,
          company_id: companyId,
          vehicle_id: vehicleId,
          vehicle_number: selectedVehicleText || null
        }])
        .select()
        .single();

      if (invoiceError) {
        throw new Error('Failed to save invoice: ' + invoiceError.message);
      }


      const itemsToInsert = products.map(product => ({
        ...(isInvoice
          ? { invoice_id: invoiceData.id }
          : { estimate_id: invoiceData.id }),
        serial_number: product.serialNumber,
        product_name: product.productName,
        hsn_code: product.hsnCode,
        quantity: parseFloat(product.quantity) || 0,
        rate: parseFloat(product.rate) || 0,
        gst_percentage: parseFloat(product.gstPercentage) || 0,
        total_product: parseFloat(product.totalAmount) || 0
      }));

      const { error: itemsInsertError } = await supabase
        .from(isInvoice ? 'invoice_items' : 'estimate_items')
        .insert(itemsToInsert);

      if (itemsInsertError) {
        console.error('Error inserting items:', itemsInsertError);
        throw new Error('Failed to save invoice items: ' + itemsInsertError.message);
      }
      await deductStockForProducts(products);


      // 🆕 Generate PDF component
      const pdfComponent = (
        <InvoicePDF
          pageHead={isInvoice ? "Tax Invoice" : "Estimate"}
          isInvoice={isInvoice}
          gstIncluded={gstIncluded}
          invoice={invoiceData}
          customer={{
            name: customerDetails.customerName,
            phone_number: customerDetails.phoneNumber,
            address: customerDetails.customerAddress,
            vehicle: customerDetails.vehicle
          }}
          products={products}
        />
      );

      // 🆕 Upload PDF and get URL with error handling
      let pdfUrl = null;
      try {
        pdfUrl = await uploadInvoicePDF(pdfComponent, isInvoice ? invoiceData.invoice_number : invoiceData.estimate_number);
        console.log('PDF URL:', pdfUrl); // Debug log

        if (pdfUrl) {
          // 🆕 Send to WhatsApp only if PDF was generated successfully
          // await sendInvoiceToWhatsApp(
          //     customerDetails.phoneNumber,
          //     pdfUrl,
          //     isInvoice ? invoiceData.invoice_number : invoiceData.estimate_number,
          //     grandTotal.toFixed(2)
          // );
          console.log('PDF generated successfully:', pdfUrl);
        } else {
          console.warn('PDF URL is null, skipping WhatsApp send');
        }
      } catch (pdfError) {
        console.error('PDF generation/upload error:', pdfError);
        alert('Invoice saved but PDF generation failed: ' + pdfError.message);
      }

      if (photos.length > 0) {
        const photoRecords = photos.map(photoUrl => ({
          ...(isInvoice
            ? { invoice_id: invoiceData.id }
            : { estimate_id: invoiceData.id }),
          photo_url: photoUrl
        }));

        const { error: photosError } = await supabase
          .from('invoice_photos')
          .insert(photoRecords);

        if (photosError) {
          console.error('Error saving photos:', photosError);
        }
      }


      setSavedInvoiceData({
        invoice: invoiceData,
        gstIncluded: gstIncluded,
        customer: {
          name: customerDetails.customerName,
          phone_number: customerDetails.phoneNumber,
          address: customerDetails.customerAddress,
          vehicle: customerDetails.vehicle
        },
        products: products,
        pdfUrl: pdfUrl // 🆕 Store PDF URL (may be null if failed)
      });

      setInvoiceSaved(true);
      alert(`${isInvoice ? 'Invoice' : 'Estimate'} saved successfully!`);
      setNewlyAddedProducts(new Set());

      // Note: Form reset moved to handleNextInvoice function


    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error saving invoice: ' + error.message);
    } finally {
      setSaving(false);
    }


  };

  // Keyboard navigation
  const handleKeyDown = (e, currentKey, productId = null) => {
    const isNumberField = currentKey.includes('quantity') || currentKey.includes('rate') || currentKey.includes('gstPercentage');

    if (isNumberField && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const input = inputRefs.current[currentKey];
      const currentValue = parseFloat(input.value) || 0;
      const step = currentKey.includes('gstPercentage') ? 1 : (currentKey.includes('quantity') ? 1 : 10);

      if (e.key === 'ArrowUp') {
        input.value = currentValue + step;
      } else {
        input.value = Math.max(0, currentValue - step);
      }

      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
      return;
    }

    if (e.key === 'Enter' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const keys = Object.keys(inputRefs.current);
      const currentIndex = keys.indexOf(currentKey);

      let nextIndex = e.key === 'ArrowLeft' ? currentIndex - 1 : currentIndex + 1;

      if (nextIndex >= 0 && nextIndex < keys.length) {
        inputRefs.current[keys[nextIndex]]?.focus();
      } else if (e.key === 'Enter' && nextIndex >= keys.length) {
        addProduct();
      }
    }
  };

  const canSave = customerDetails.customerName && customerDetails.phoneNumber && !phoneError && customerDetails.phoneNumber.length === 10;

  // Refs to always hold the latest values — prevents stale closures in the keyboard shortcut listener
  const saveInvoiceRef = useRef(null);
  const canSaveRef = useRef(canSave);
  const savingRef = useRef(saving);
  const invoiceSavedRef = useRef(invoiceSaved);
  const savedInvoiceDataRef = useRef(savedInvoiceData);
  const isInvoiceRef = useRef(isInvoice);

  // Keep refs in sync with the latest render values
  saveInvoiceRef.current = saveInvoice;
  canSaveRef.current = canSave;
  savingRef.current = saving;
  invoiceSavedRef.current = invoiceSaved;
  savedInvoiceDataRef.current = savedInvoiceData;
  isInvoiceRef.current = isInvoice;

  // Keyboard shortcuts: Ctrl+S (save), Ctrl+P (print), Ctrl+E (edit)
  // Empty deps — the listener is registered once; all values are read via refs so they're always fresh
  useEffect(() => {
    const handleShortcuts = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;

      switch (e.key.toLowerCase()) {
        case 's':
          // Ctrl+S → Save bill
          e.preventDefault();
          if (canSaveRef.current && !savingRef.current) {
            saveInvoiceRef.current?.();
          }
          break;

        case 'p':
          // Ctrl+P → Download/print PDF if saved, else browser print
          e.preventDefault();
          if (invoiceSavedRef.current) {
            const pdfLink = document.getElementById('pdf-download-link');
            if (pdfLink) {
              pdfLink.click();
            }
          } else {
            window.print();
          }
          break;

        case 'e':
          // Ctrl+E → Edit: if bill is saved, navigate to edit page;
          // otherwise focus the first editable field (customer name)
          e.preventDefault();
          if (invoiceSavedRef.current && savedInvoiceDataRef.current) {
            const invoiceId = savedInvoiceDataRef.current.invoice.id;
            router.push(`/billing/${isInvoiceRef.current ? 'invoice' : 'estimate'}/edit/${invoiceId}`);
          } else {
            const firstInput = inputRefs.current['customerName'];
            if (firstInput) firstInput.focus();
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.push('/billing')} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back</span>
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <InvoiceHeader pageHead={isInvoice ? "INVOICE" : "ESTIMATE"} invoiceNumber={isInvoice ? "Invoice No." : "Estimate No."} displayNumber={isInvoice ? invoiceNumber : estimateNumber} invoiceDate={invoiceDate} onInvoiceDateChange={setInvoiceDate} />

          <CustomerDetailsForm
            customerDetails={customerDetails}
            onCustomerChange={handleCustomerChange}
            phoneError={phoneError}
            searching={searchingCustomer}
            found={customerFound}
            gstin={gstin}
            onGstinChange={setGstin}
            inputRefs={inputRefs}
            onKeyDown={handleKeyDown}
            customerSearchResults={customerSearchResults}
            showCustomerDropdown={showCustomerDropdown}
            onCustomerSelect={handleCustomerSelect}
            onDropdownToggle={setShowCustomerDropdown}
          />

          <ProductsTable
            products={products}
            gstIncluded={gstIncluded}
            onGstToggle={() => setGstIncluded(!gstIncluded)}
            onProductChange={handleProductChange}
            onAddProduct={addProduct}
            onRemoveProduct={removeProduct}
            onProductSelect={handleProductSelect}
            inputRefs={inputRefs}
            onKeyDown={handleKeyDown}
            productSearchResults={productSearchResults}
            showProductDropdown={showProductDropdown}
            searchingProduct={searchingProduct}
            onDropdownToggle={(id, show) => setShowProductDropdown(prev => ({ ...prev, [id]: show }))}
            productsFromDB={productsFromDB}
            newlyAddedProducts={newlyAddedProducts}
            onOpenBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
          />

          <InvoiceSummary
            isInvoice={isInvoice}
            gstDistribution={calculateGSTDistribution()}
            subtotal={subtotal}
            totalGST={totalGST}
            grandTotal={grandTotal}
            paymentMode={paymentMode}
            onPaymentModeChange={setPaymentMode}
            onSaveInvoice={saveInvoice}
            onNextInvoice={handleNextInvoice}
            saving={saving}
            canSave={canSave}
            invoiceSaved={invoiceSaved}
            savedInvoiceData={savedInvoiceData}
            onPhotoCapture={handlePhotoCapture}
            photos={photos}
            onRemovePhoto={handleRemovePhoto}
          />
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onScanSuccess={handleAddProductFromBarcode}
        searchProductByCode={searchProductByCode}
      />
    </div>
  );
};

export default InvoiceEstimateAdd;