"use client"

import React from 'react'
import Link from 'next/link'
import { Search as SearchIcon, Plus } from 'lucide-react'

const Product = () => {
  return (
    <div className='flex flex-col items-center'>
      <div className=''>
        <div className=" mx-auto">
          <h1 className="text-4xl text-center font-bold text-gray-900 mt-8">Inventory</h1>

          <div className='border mt-10 border-gray-600 py-6 px-8 w-fit gap-3 flex flex-col rounded-md'>
            <p className='font-semibold text-3xl'>PRODUCTS</p>
            <div className='flex flex-col gap-3'>

              <Link
                href="/inventory/search"
                className='bg-[#3480fb] border-1 py-3 px-6 text-white text-center border-gray-700 rounded-xl'>
                <div className='flex gap-2'>
                  <SearchIcon />
                  <p>Search Products</p>
                </div>
              </Link>

              <Link
                href="/inventory/add"
                className='border-2 py-3 px-6  text-center rounded-xl border-[#3480fb] text-[#3571d2] font-semibold'>
                <div className='flex gap-2'>
                  <Plus />
                  <p>Add Product</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Product