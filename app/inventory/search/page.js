"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Package, Filter, X, AlertTriangle, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';
import '@/app/inventory/search/animations.css';

// Debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// Skeleton Loader Component
const ProductSkeleton = () => (
    <div className="p-3 border rounded-lg border-gray-200 animate-pulse">
        <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
        </div>
    </div>
);

const ITEMS_PER_PAGE = 10;

const ProductSearch = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const router = useRouter();

    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const [filters, setFilters] = useState({
        searchQuery: '',
        partNumber: '',
        brand: '',
        vehicle: '',
        hsn: ''
    });

    const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);
    const debouncedPartNumber = useDebounce(filters.partNumber, 300);

    const [filterOptions, setFilterOptions] = useState({
        brands: [],
        vehicles: [],
        hsnCodes: []
    });

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [debouncedSearchQuery, debouncedPartNumber, filters.brand, filters.vehicle, filters.hsn, showLowStockOnly, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchQuery, debouncedPartNumber, filters.brand, filters.vehicle, filters.hsn, showLowStockOnly]);

    const fetchFilterOptions = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('brand, vehicle_model, hsn_code');

            if (error) throw error;

            if (data) {
                const brands = [...new Set(data.map(p => p.brand).filter(Boolean))];
                const vehicles = [...new Set(data.map(p => p.vehicle_model).filter(Boolean))];
                const hsnCodes = [...new Set(data.map(p => p.hsn_code).filter(Boolean))];
                setFilterOptions({ brands, vehicles, hsnCodes });
            }
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('products')
                .select('*', { count: 'exact' });

            // Search by name, brand, vehicle, or part number
            if (debouncedSearchQuery) {
                query = query.or(`product_name.ilike.%${debouncedSearchQuery}%,brand.ilike.%${debouncedSearchQuery}%,vehicle_model.ilike.%${debouncedSearchQuery}%,part_number.ilike.%${debouncedSearchQuery}%`);
            }

            // Search by part number specifically
            if (debouncedPartNumber) {
                query = query.ilike('part_number', `%${debouncedPartNumber}%`);
            }

            if (filters.brand) {
                query = query.eq('brand', filters.brand);
            }

            if (filters.vehicle) {
                query = query.eq('vehicle_model', filters.vehicle);
            }

            if (filters.hsn) {
                query = query.ilike('hsn_code', `%${filters.hsn}%`);
            }

            if (showLowStockOnly) {
                query = query.order('created_at', { ascending: false });
            } else {
                const from = (currentPage - 1) * ITEMS_PER_PAGE;
                const to = from + ITEMS_PER_PAGE - 1;
                query = query.order('created_at', { ascending: false }).range(from, to);
            }

            const { data, error, count } = await query;
            if (error) throw error;

            let filteredData = data || [];

            if (showLowStockOnly) {
                filteredData = filteredData.filter(p => p.current_stock <= p.minimum_stock);
                setTotalCount(filteredData.length);
                const from = (currentPage - 1) * ITEMS_PER_PAGE;
                filteredData = filteredData.slice(from, from + ITEMS_PER_PAGE);
            } else {
                setTotalCount(count || 0);
            }

            setProducts(filteredData);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ searchQuery: '', partNumber: '', brand: '', vehicle: '', hsn: '' });
        setShowLowStockOnly(false);
        setCurrentPage(1);
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== '') || showLowStockOnly;

    const handleProductClick = (product) => {
        router.push(`/inventory/${product.id}`);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...'); pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1); pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1); pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...'); pages.push(totalPages);
            }
        }
        return pages;
    };

    // Calculate final price helper
    const getFinalPrice = (product) => {
        const selling = parseFloat(product.selling_rate) || 0;
        const gst = parseFloat(product.gst_percentage) || 0;
        const discount = parseFloat(product.discount) || 0;
        const afterDiscount = selling * (1 - discount / 100);
        return (afterDiscount * (1 + gst / 100)).toFixed(0);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Back Button */}
            <button onClick={() => router.push("/inventory")} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back</span>
            </button>

            <div className="max-w-7xl mx-auto">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="text-purple-600" size={28} />
                        Product Search
                    </h1>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                    {/* Main Search */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search name, brand, vehicle..."
                                value={filters.searchQuery}
                                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                            />
                        </div>
                        <div className="relative">
                            <Hash className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by Part Number..."
                                value={filters.partNumber}
                                onChange={(e) => handleFilterChange('partNumber', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <select value={filters.brand} onChange={(e) => handleFilterChange('brand', e.target.value)} className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
                            <option value="">All Brands</option>
                            {filterOptions.brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                        </select>

                        <select value={filters.vehicle} onChange={(e) => handleFilterChange('vehicle', e.target.value)} className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
                            <option value="">All Vehicles</option>
                            {filterOptions.vehicles.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>

                        <button
                            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                            className={`px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 ${showLowStockOnly ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700'}`}
                        >
                            <AlertTriangle size={16} />
                            Low Stock
                        </button>

                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="px-3 py-2 bg-gray-100 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-gray-200">
                                <X size={16} /> Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Filter className="text-purple-600" size={20} />
                            Products ({totalCount})
                        </h2>
                        {totalPages > 0 && (
                            <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
                        )}
                    </div>

                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, idx) => <ProductSkeleton key={idx} />)}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="mx-auto text-gray-400 mb-3" size={48} />
                            <p className="text-gray-500">No products found</p>
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="mt-4 text-purple-600 hover:text-purple-700 font-medium">
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {products.map((product) => {
                                    const isLowStock = product.current_stock <= product.minimum_stock;

                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => handleProductClick(product)}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-purple-300 hover:shadow-sm ${isLowStock ? 'border-l-4 border-l-orange-500 bg-orange-50/30' : 'border-gray-200'}`}
                                        >
                                            {/* Row 1: Name & Part Number */}
                                            <div className="flex items-start justify-between mb-1">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 text-sm">{product.product_name}</h3>
                                                    <div className="flex gap-3 text-xs text-gray-500">
                                                        {product.part_number && <span className="font-mono bg-gray-100 px-1 rounded">#{product.part_number}</span>}
                                                        <span>{product.brand || 'No brand'}</span>
                                                        <span>{product.vehicle_model || 'Any vehicle'}</span>
                                                    </div>
                                                </div>
                                                {isLowStock && <AlertTriangle className="text-orange-500 flex-shrink-0" size={18} />}
                                            </div>

                                            {/* Row 2: Details */}
                                            <div className="flex flex-wrap items-center gap-4 text-xs mt-2 pt-2 border-t border-gray-100">
                                                <span className="text-gray-600">
                                                    Stock: <strong className={isLowStock ? 'text-orange-600' : 'text-green-600'}>{product.current_stock}</strong>
                                                </span>
                                                <span className="text-gray-600">
                                                    Purchase: <strong className="text-gray-800">₹{product.purchase_rate?.toLocaleString() || 0}</strong>
                                                </span>
                                                {product.selling_rate && (
                                                    <span className="text-gray-600">
                                                        Selling: <strong className="text-blue-600">₹{product.selling_rate?.toLocaleString()}</strong>
                                                    </span>
                                                )}
                                                {product.gst_percentage > 0 && (
                                                    <span className="text-gray-600">
                                                        GST: <strong>{product.gst_percentage}%</strong>
                                                    </span>
                                                )}
                                                {product.discount > 0 && (
                                                    <span className="text-gray-600">
                                                        Disc: <strong className="text-orange-600">{product.discount}%</strong>
                                                    </span>
                                                )}
                                                {product.selling_rate && (
                                                    <span className="text-purple-600 font-semibold ml-auto">
                                                        Final: ₹{getFinalPrice(product)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                                    <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50">
                                        <ChevronLeft size={18} />
                                    </button>

                                    {getPageNumbers().map((page, idx) => (
                                        page === '...' ? (
                                            <span key={`e-${idx}`} className="px-2 text-gray-500">...</span>
                                        ) : (
                                            <button key={page} onClick={() => goToPage(page)} className={`px-3 py-1 rounded-lg text-sm ${currentPage === page ? 'bg-purple-600 text-white' : 'border hover:bg-gray-100'}`}>
                                                {page}
                                            </button>
                                        )
                                    ))}

                                    <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50">
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductSearch;