export const sendInvoiceToWhatsApp = (phoneNumber, pdfUrl, invoiceNumber, amount) => {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  const message = `
Invoice No: ${invoiceNumber}
Amount: ₹${amount}

Download your invoice:
${pdfUrl}

Thank you for your business!`;
  
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};