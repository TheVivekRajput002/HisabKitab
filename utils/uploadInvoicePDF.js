import { pdf } from '@react-pdf/renderer';
import { supabase } from './supabaseClient';

export const uploadInvoicePDF = async (invoicePDFComponent, invoiceNumber) => {
  try {
    // Validate component
    if (!invoicePDFComponent) {
      throw new Error('PDF component is null or undefined');
    }

    // Generate PDF blob from React component
    const blob = await pdf(invoicePDFComponent).toBlob();

    // Create filename
    const fileName = `${invoiceNumber}_${Date.now()}.pdf`;
    const filePath = `invoices/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(filePath, blob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
};