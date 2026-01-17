"use client"

import React from 'react'
import Link from 'next/link'
import { Search as SearchIcon, Plus, Package } from 'lucide-react'

const Product = () => {
  return (
    <div className='min-h-screen bg-gray-50 py-16 px-4'>
      <div className='max-w-3xl mx-auto'>
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Inventory</h1>
          <p className="text-gray-600">Manage your products and stock</p>
        </div>

        {/* Products Card */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
              <Package className='text-green-600' size={24} />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>Products</h2>
              <p className='text-sm text-gray-500'>Inventory items</p>
            </div>
          </div>

          <div className='space-y-3'>
            <Link
              href="/inventory/search"
              className='block w-full bg-green-600 py-3 px-4 text-white text-center rounded-lg font-medium hover:bg-green-700 transition-colors'>
              <div className='flex items-center justify-center gap-2'>
                <SearchIcon size={18} />
                <span>Search Products</span>
              </div>
            </Link>

            <Link
              href="/inventory/add"
              className='block w-full border-2 border-gray-300 py-3 px-4 text-gray-700 text-center rounded-lg font-medium hover:border-green-600 hover:text-green-600 transition-colors'>
              <div className='flex items-center justify-center gap-2'>
                <Plus size={18} />
                <span>Add Product</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Product