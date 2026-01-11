import React from 'react';
import { Save } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';
import { sendInvoiceToWhatsApp } from '@/utils/sendWhatsApp';


const InvoiceSummary = ({
    isInvoice,
    gstDistribution,
    subtotal,
    totalGST,
    grandTotal,
    paymentMode,
    onPaymentModeChange,
    onSaveInvoice,
    saving,
    canSave,
    invoiceSaved,
    savedInvoiceData,
    gstIncluded,
    onPhotoCapture,
    photos,
    onRemovePhoto
}) => {


    return (

        <>
            {/* Total Section */}
            <div className="p-6 bg-gray-50 border-t-2 border-gray-300">
                <div className="space-y-6 flex flex-col items-end">
                    {/* Totals */}
                    <div className="space-y-2 w-full md:w-[70%]">
                        {/* Subtotal */}
                        <div className="flex justify-between items-center py-2 border-b border-gray-300">
                            <span className="text-sm font-semibold text-gray-700">Subtotal:</span>
                            <span className="text-base font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
                        </div>

                        {/* GST Distribution */}
                        {gstDistribution && gstDistribution.length > 0 && (
                            <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">

                                {gstDistribution.map((gst, index) => (
                                    <div key={index} className="mb-3 last:mb-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-semibold text-gray-600">
                                                GST @ {gst.rate}%
                                            </span>
                                            <span className="text-xs font-semibold text-blue-600">
                                                ₹{gst.totalGst.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div className="bg-white rounded px-2 py-1">
                                                <div className="text-gray-500 text-[10px]">Taxable</div>
                                                <div className="font-medium text-gray-700">₹{gst.taxableAmount.toFixed(2)}</div>
                                            </div>
                                            <div className="bg-white rounded px-2 py-1">
                                                <div className="text-gray-500 text-[10px]">CGST</div>
                                                <div className="font-medium text-green-600">₹{gst.cgst.toFixed(2)}</div>
                                            </div>
                                            <div className="bg-white rounded px-2 py-1">
                                                <div className="text-gray-500 text-[10px]">SGST</div>
                                                <div className="font-medium text-green-600">₹{gst.sgst.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Total GST Summary */}
                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-300">
                                    <span className="text-xs font-bold text-gray-700">Total GST:</span>
                                    <span className="text-sm font-bold text-blue-600">₹{totalGST.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {/* Grand Total */}
                        <div className="flex justify-between items-center py-3 bg-gray-800 text-white px-4 rounded-lg mt-2">
                            <span className="text-lg font-bold">GRAND TOTAL:</span>
                            <span className="text-2xl font-bold">₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Payment Mode */}
                    {isInvoice ? (
                        <div className="w-[70%]">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode</label>
                            <select
                                value={paymentMode}
                                onChange={(e) => onPaymentModeChange(e.target.value)}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 font-medium transition-colors ${paymentMode === 'unpaid'
                                    ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-500'
                                    : paymentMode === 'cash'
                                        ? 'border-green-300 bg-green-50 text-green-700 focus:ring-green-500'
                                        : 'border-blue-300 bg-blue-50 text-blue-700 focus:ring-blue-500'
                                    }`}
                            >
                                <option value="unpaid">Unpaid</option>
                                <option value="cash">Cash</option>
                                <option value="online">Online</option>
                            </select>
                        </div>
                    ) : ""}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 bg-white border-t-2 border-gray-300">
                <div className="flex justify-end">
                    <div className="flex gap-3">
                        <button
                            onClick={onSaveInvoice}
                            disabled={!canSave || saving}
                            className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg shadow-lg"
                        >
                            <Save className="mr-2 w-5 h-5" />
                            {saving ? 'Saving Invoice...' : 'Save Invoice'}
                        </button>

                        {invoiceSaved && savedInvoiceData && (
                            <PDFDownloadLink
                                document={
                                    <InvoicePDF
                                        isInvoice={isInvoice}
                                        pageHead={isInvoice ? "Tax Invoice" : "Estimate"}
                                        invoice={savedInvoiceData.invoice}
                                        customer={savedInvoiceData.customer}
                                        products={savedInvoiceData.products}
                                        gstIncluded={savedInvoiceData.gstIncluded}
                                    />
                                }
                                fileName={`Invoice-${savedInvoiceData.invoice.invoice_number}.pdf`}
                                className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg shadow-lg"
                            >
                                {({ loading }) =>
                                    loading ? (
                                        <span className="flex items-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Generating PDF...
                                        </span>
                                    ) : (
                                        <span className="flex items-center">
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download PDF
                                        </span>
                                    )
                                }
                            </PDFDownloadLink>
                        )}

                        {invoiceSaved && savedInvoiceData && savedInvoiceData.pdfUrl && (
                            <button
                                onClick={() => sendInvoiceToWhatsApp(
                                    savedInvoiceData.customer.phone_number,
                                    savedInvoiceData.pdfUrl,
                                    savedInvoiceData.invoice.invoice_number,
                                    savedInvoiceData.invoice.total_amount.toFixed(2)
                                )}
                                className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg shadow-lg"
                            >
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                Send to WhatsApp
                            </button>
                        )}

                        {/* ADD PHOTO BUTTON HERE */}
                        {invoiceSaved && savedInvoiceData && (
                            <>
                                <button
                                    onClick={() => document.getElementById('photo-input').click()}
                                    disabled={photos.some(p => p.uploading)}
                                    className="flex items-center px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg shadow-lg"
                                >
                                    {photos.some(p => p.uploading) ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Add Photo
                                        </>
                                    )}
                                </button>

                                {/* Show uploading photos count */}
                                {photos.some(p => p.uploading) && (
                                    <span className="flex items-center text-sm text-gray-600">
                                        Compressing & uploading...
                                    </span>
                                )}
                            </>
                        )}

                        {/* Hidden file input */}
                        <input
                            id="photo-input"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    await onPhotoCapture(file);
                                    e.target.value = '';
                                }
                            }}
                            className="hidden"
                        />


                    </div>
                </div>
            </div>


        </>
    );
};

export default InvoiceSummary;