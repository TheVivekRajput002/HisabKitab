"use client"
import Link from 'next/link'
import React from 'react'
import { Search as SearchIcon, Plus, FileText, ClipboardList } from 'lucide-react'

const Billing = () => {
    return (
        <div className='min-h-screen bg-gray-50 py-16 px-4'>
            <div className='max-w-5xl mx-auto'>
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Billing</h1>
                    <p className="text-gray-600">Manage your invoices and estimates</p>
                </div>

                {/* Cards Grid */}
                <div className='grid md:grid-cols-2 gap-6'>
                    {/* Invoice Card */}
                    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
                        <div className='flex items-center gap-3 mb-6'>
                            <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                                <FileText className='text-blue-600' size={24} />
                            </div>
                            <div>
                                <h2 className='text-xl font-bold text-gray-900'>Invoice</h2>
                                <p className='text-sm text-gray-500'>Sales invoices</p>
                            </div>
                        </div>

                        <div className='space-y-3'>
                            <Link
                                href={"/billing/invoice/search"}
                                className='block w-full bg-blue-600 py-3 px-4 text-white text-center rounded-lg font-medium hover:bg-blue-700 transition-colors'>
                                <div className='flex items-center justify-center gap-2'>
                                    <SearchIcon size={18} />
                                    <span>Search Invoice</span>
                                </div>
                            </Link>

                            <Link
                                href={"/billing/add/invoice"}
                                className='block w-full border-2 border-gray-300 py-3 px-4 text-gray-700 text-center rounded-lg font-medium hover:border-blue-600 hover:text-blue-600 transition-colors'>
                                <div className='flex items-center justify-center gap-2'>
                                    <Plus size={18} />
                                    <span>New Invoice</span>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Estimate Card */}
                    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
                        <div className='flex items-center gap-3 mb-6'>
                            <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                                <ClipboardList className='text-orange-600' size={24} />
                            </div>
                            <div>
                                <h2 className='text-xl font-bold text-gray-900'>Estimate</h2>
                                <p className='text-sm text-gray-500'>Price quotes</p>
                            </div>
                        </div>

                        <div className='space-y-3'>
                            <Link
                                href={"/billing/estimate/search"}
                                className='block w-full bg-orange-600 py-3 px-4 text-white text-center rounded-lg font-medium hover:bg-orange-700 transition-colors'>
                                <div className='flex items-center justify-center gap-2'>
                                    <SearchIcon size={18} />
                                    <span>Search Estimate</span>
                                </div>
                            </Link>

                            <Link
                                href={"/billing/add/estimate"}
                                className='block w-full border-2 border-gray-300 py-3 px-4 text-gray-700 text-center rounded-lg font-medium hover:border-orange-600 hover:text-orange-600 transition-colors'>
                                <div className='flex items-center justify-center gap-2'>
                                    <Plus size={18} />
                                    <span>New Estimate</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Billing