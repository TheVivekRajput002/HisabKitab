import React, { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';

const ProductRow = ({
    product,
    index,
    onProductChange,
    onRemove,
    gstIncluded,
    inputRefs,
    onKeyDown,
    showDropdown,
    searchResults,
    searching,
    onProductSelect,
    onDropdownToggle,
    canRemove,
    productsFromDB,
    newlyAdded
}) => {
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const dropdownItemRefs = useRef([]);

    // Reset highlighted index when dropdown closes or results change
    useEffect(() => {
        if (!showDropdown || !searchResults?.length) {
            setHighlightedIndex(-1);
        }
    }, [showDropdown, searchResults]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && dropdownItemRefs.current[highlightedIndex]) {
            dropdownItemRefs.current[highlightedIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [highlightedIndex]);

    const handleProductNameKeyDown = (e) => {
        // If dropdown is showing and has results
        if (showDropdown && searchResults?.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < searchResults.length - 1 ? prev + 1 : 0
                );
                return;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : searchResults.length - 1
                );
                return;
            }

            if (e.key === 'Enter' && highlightedIndex >= 0) {
                e.preventDefault();
                onProductSelect(product.id, searchResults[highlightedIndex]);
                return;
            }

            if (e.key === 'Escape') {
                e.preventDefault();
                onDropdownToggle(product.id, false);
                return;
            }
        }

        // Default keyboard navigation for other cases
        onKeyDown(e, `${product.id}-productName`, product.id);
    };

    return (
        <tr className="border-b border-gray-300 hover:bg-gray-50">
            <td className="px-2 py-3 text-sm text-center max-md:px-1">{index + 1}</td>

            {/* Product Name */}
            <td className="px-2 py-3 max-md:px-1" style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                    <input
                        ref={(el) => inputRefs.current[`${product.id}-productName`] = el}
                        type="text"
                        value={product.productName}
                        onChange={(e) => {
                            onProductChange(product.id, 'productName', e.target.value);
                            setHighlightedIndex(-1); // Reset highlight when typing
                        }}
                        onKeyDown={handleProductNameKeyDown}
                        onBlur={() => {
                            setTimeout(() => onDropdownToggle(product.id, false), 200);
                        }}
                        onFocus={() => {
                            if (product.productName.length >= 2) {
                                onDropdownToggle(product.id, true);
                            }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Start typing product name..."
                    />

                    {/* Dropdown */}
                    {showDropdown && searchResults?.length > 0 && (
                        <div
                            className="absolute bg-white border-2 border-gray-300 rounded-lg shadow-2xl max-h-60 overflow-y-auto"
                            style={{
                                width: '100%',
                                top: 'calc(100% + 4px)',
                                left: 0,
                                zIndex: 9999
                            }}
                        >
                            {searchResults.map((item, idx) => (
                                <div
                                    key={item.id}
                                    ref={(el) => dropdownItemRefs.current[idx] = el}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        onProductSelect(product.id, item);
                                    }}
                                    onMouseEnter={() => setHighlightedIndex(idx)}
                                    className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-0 transition-colors ${highlightedIndex === idx
                                        ? 'bg-blue-100 border-l-4 border-l-blue-600'
                                        : 'hover:bg-blue-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className={`font-semibold text-sm ${highlightedIndex === idx ? 'text-blue-900' : 'text-gray-900'
                                                }`}>
                                                {item.product_name}
                                            </p>
                                            <div className="flex gap-3 mt-1">
                                                <span className={`text-xs font-medium ${item.current_stock <= item.minimum_stock
                                                    ? 'text-orange-600'
                                                    : 'text-green-600'
                                                    }`}>
                                                    Stock: {item.current_stock}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-bold ${highlightedIndex === idx ? 'text-blue-700' : 'text-blue-600'
                                            }`}>
                                            ₹{item.purchase_rate}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Loading indicator */}
                    {searching && (
                        <div className="absolute right-3 top-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    {productsFromDB.has(product.id) && (
                        <div className="absolute right-3 top-3 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            From DB
                        </div>
                    )}

                </div>
            </td>

            {/* HSN Code */}
            <td className="px-2 py-3 max-md:px-1">
                <input
                    ref={(el) => inputRefs.current[`${product.id}-hsnCode`] = el}
                    type="text"
                    value={product.hsnCode}
                    onChange={(e) => onProductChange(product.id, 'hsnCode', e.target.value)}
                    onKeyDown={(e) => onKeyDown(e, `${product.id}-hsnCode`, product.id)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="HSN"
                />
            </td>

            {/* Quantity */}
            <td className="px-2 py-3 max-md:px-1">
                <input
                    ref={(el) => inputRefs.current[`${product.id}-quantity`] = el}
                    type="number"
                    value={product.quantity}
                    onChange={(e) => onProductChange(product.id, 'quantity', parseFloat(e.target.value) || 0)}
                    onKeyDown={(e) => onKeyDown(e, `${product.id}-quantity`, product.id)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm text-center"
                />
            </td>

            {/* Rate */}
            <td className="px-2 py-3 max-md:px-1">
                <input
                    ref={(el) => inputRefs.current[`${product.id}-rate`] = el}
                    type="number"
                    value={product.rate}
                    onChange={(e) => onProductChange(product.id, 'rate', parseFloat(e.target.value) || 0)}
                    onKeyDown={(e) => onKeyDown(e, `${product.id}-rate`, product.id)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm text-right"
                />
            </td>

            {/* GST Percentage */}
            {/* <td className="px-2 py-3 max-md:px-1">
                <input
                    ref={(el) => inputRefs.current[`${product.id}-gstPercentage`] = el}
                    type="number"
                    value={product.gstPercentage}
                    onChange={(e) => onProductChange(product.id, 'gstPercentage', parseFloat(e.target.value) || 0)}
                    onKeyDown={(e) => onKeyDown(e, `${product.id}-gstPercentage`, product.id)}
                    disabled={gstIncluded}
                    className={`w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm text-center ${gstIncluded ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
                        }`}
                />
            </td> */}
            <td className="px-2 py-3 max-md:px-1">
                <select
                    ref={(el) => inputRefs.current[`${product.id}-gstPercentage`] = el}
                    value={product.gstPercentage}
                    onChange={(e) => onProductChange(product.id, 'gstPercentage', parseFloat(e.target.value))}
                    onKeyDown={(e) => onKeyDown(e, `${product.id}-gstPercentage`, product.id)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm text-center `}
                >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={18}>18%</option>
                </select>
            </td>

            {/* Total Amount */}
            <td className="px-2 py-3 text-sm font-semibold text-right max-md:px-1">
                ₹{product.totalAmount.toFixed(2)}
            </td>

            {/* Remove Button */}
            <td className="px-2 py-3 text-center max-md:px-1">
                <button
                    onClick={() => onRemove(product.id)}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                    disabled={!canRemove}
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </td>
        </tr>
    );
};

export default ProductRow;