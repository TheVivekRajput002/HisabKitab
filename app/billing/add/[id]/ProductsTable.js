import React, { useState, useEffect } from 'react';
import { Plus, Camera, LayoutGrid, Table as TableIcon } from 'lucide-react';
import ProductRow from './ProductRow';

const ProductsTable = ({
    products,
    gstIncluded,
    onGstToggle,
    onProductChange,
    onAddProduct,
    onRemoveProduct,
    onProductSelect,
    inputRefs,
    onKeyDown,
    productSearchResults,
    showProductDropdown,
    searchingProduct,
    onDropdownToggle,
    productsFromDB,
    newlyAddedProducts,
    onOpenBarcodeScanner
}) => {
    // 'auto' | 'card' | 'table'
    const [viewMode, setViewMode] = useState('auto');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const effectiveViewMode = viewMode === 'auto' ? (isMobile ? 'card' : 'table') : viewMode;

    return (
        <div className="p-6 max-md:p-3">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-800">ITEMS</h3>
                    <button
                        type="button"
                        onClick={onOpenBarcodeScanner}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded-lg text-xs md:text-sm font-semibold transition-all shadow-sm group cursor-pointer"
                        title="Scan Barcode / Part Number with Camera"
                    >
                        <Camera className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span>Scan Barcode</span>
                    </button>
                </div>

                {/* View Switcher Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
                    <button
                        type="button"
                        onClick={() => setViewMode('card')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            effectiveViewMode === 'card'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                        }`}
                        title="Card View (Spacious responsive layout)"
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Cards</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('table')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            effectiveViewMode === 'table'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                        }`}
                        title="Table View (Classic compact table)"
                    >
                        <TableIcon className="w-3.5 h-3.5" />
                        <span>Table</span>
                    </button>
                </div>
            </div>

            <div>
                <div className={`rounded-lg ${
                    effectiveViewMode === 'table' 
                        ? 'border-2 border-gray-300 overflow-x-auto' 
                        : 'border-0'
                }`} style={{ overflowY: 'visible' }}>
                    <table className={`w-full ${effectiveViewMode === 'table' ? 'min-w-[700px]' : ''}`} style={{ overflowY: 'visible' }}>
                        {effectiveViewMode === 'table' && (
                            <thead>
                                <tr className="bg-gray-800 text-white">
                                    <th className="px-3 py-3 text-left text-sm font-semibold w-10">S.No</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold min-w-[200px]">
                                        Product Name
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold w-32">HSN</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold w-24">Qty</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold w-32">
                                        <div className="flex flex-col items-end gap-1">
                                            <span>Rate</span>
                                            <button
                                                onClick={onGstToggle}
                                                className={`text-xs px-2 py-1 rounded transition-colors ${
                                                    gstIncluded
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-gray-600 text-white'
                                                }`}
                                            >
                                                {gstIncluded ? 'With GST' : 'Without GST'}
                                            </button>
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold w-24">GST %</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold w-32">Amount</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold w-12"></th>
                                </tr>
                            </thead>
                        )}

                        <tbody className="w-full">
                            {products.map((product, index) => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                    index={index}
                                    viewMode={effectiveViewMode}
                                    onProductChange={onProductChange}
                                    onRemove={onRemoveProduct}
                                    gstIncluded={gstIncluded}
                                    inputRefs={inputRefs}
                                    onKeyDown={onKeyDown}
                                    showDropdown={showProductDropdown[product.id]}
                                    searchResults={productSearchResults[product.id]}
                                    searching={searchingProduct[product.id]}
                                    onProductSelect={onProductSelect}
                                    onDropdownToggle={onDropdownToggle}
                                    canRemove={products.length > 1}
                                    productsFromDB={productsFromDB}
                                    newlyAdded={newlyAddedProducts.has(product.productName)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <button
                onClick={onAddProduct}
                className="mt-4 flex items-center justify-center w-full md:w-auto px-4 py-2.5 text-blue-600 border-2 border-blue-600 rounded-xl hover:bg-blue-50 font-bold transition-colors shadow-sm cursor-pointer"
            >
                <Plus className="w-5 h-5 mr-2" /> Add Item
            </button>
        </div>
    );
};

export default ProductsTable;