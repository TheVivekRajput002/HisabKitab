import React from 'react';
import { Building2 } from 'lucide-react';

const InvoiceHeader = ({ pageHead,displayNumber,invoiceNumber,invoiceDate, onInvoiceDateChange }) => {
    return (
        <div className="border-y-4 border-gray-800">
            <h2 className="text-xl font-bold text-gray-800 my-6 text-center">{pageHead}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Left - Company Details */}
                <div className="p-6 border-r-2 border-t-2 border-gray-300 ml-1">
                    <div className="flex items-start gap-4">
                        <div className="w-18 h-18 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 size={34} className="text-gray-800" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Shiv Shakti Automobile</h1>
                            <p className="text-sm text-gray-600 mt-1">Near new Bus Stand, Vidisha, M.P.</p>
                            <p className="text-sm text-gray-600">Mobile No. - 9993646020</p>
                            <p className="text-sm text-gray-600 mt-1">GST: 23AYKPR3166N1ZV</p>
                        </div>
                    </div>
                </div>

                {/* Right - Invoice Details */}
                <div className="p-6 bg-gray-50 border-t-2 border-gray-300">
                    <div className="space-y-2 mt-6">
                        <div className="flex justify-between">
                            <span className="text-sm font-semibold text-gray-700">Date:</span>
                            <input
                                type="date"
                                value={invoiceDate}
                                onChange={(e) => onInvoiceDateChange(e.target.value)}
                                className="text-sm px-2 py-1 border border-gray-300 rounded"
                            />
                        </div>
                        <div className="flex justify-between mt-3">
                            <span className="text-sm font-semibold text-gray-700">{invoiceNumber}</span>
                            <span className="text-sm text-gray-900 font-mono">{displayNumber || 'Loading...'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceHeader;