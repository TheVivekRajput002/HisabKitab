import React from 'react';
import { Plus } from 'lucide-react';
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
    newlyAddedProducts
}) => {
    return (
        <div className="p-6 max-md:py-3 max-md:px-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">ITEMS</h3>

            <div>
                <div className="border-2 border-gray-300 rounded-lg" style={{ overflow: 'visible' }}>
                    <table className="w-full" style={{ overflow: 'visible' }}>
                        <thead>
                            <tr className="bg-gray-800 text-white">
                                <th className="px-3 py-3 text-left text-sm font-semibold w-10">S.No</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold min-w-[200px] max-md:min-w-[150px]">
                                    Product Name
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold w-32">HSN</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold w-24">Qty</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold w-32 max-md:w-30">
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

                        <tbody>
                            {products.map((product, index) => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                    index={index}
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
                className="mt-4 flex items-center px-4 py-2 text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 font-semibold"
            >
                <Plus className="w-5 h-5 mr-2" /> Add Item
            </button>
        </div>
    );
};

export default ProductsTable;