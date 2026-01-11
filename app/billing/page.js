"use client"
import Link from 'next/link'
import React, { useState } from 'react'
import { Search as SearchIcon, Plus, Home } from 'lucide-react'

const Billing = () => {

    return (
        <div className='flex flex-col items-center'>
            <div className=''>

                <div className=" mx-auto">
                    <h1 className="text-4xl text-center font-bold text-gray-900 mt-8">Billing</h1>

                    <div className='flex gap-8'>

                        {/* invoice box  */}
                        <div className='border mt-10 border-gray-600 py-6 px-8 w-fit gap-3 flex flex-col rounded-md'>
                            <p className='font-semibold text-3xl'>INVOICE</p>
                            <div className='flex flex-col gap-3'>

                                <Link
                                    href={"/billing/invoice_search"}
                                    className='bg-[#3480fb] border-1 py-3 px-6 text-white text-center border-gray-700 rounded-xl'>
                                    <div className='flex gap-2'>
                                        <SearchIcon />
                                        <p>Search Invoice</p>
                                    </div>
                                </Link>

                                <Link
                                    href={"/billing/add/invoice"}
                                    className='border-2 py-3 px-6  text-center rounded-xl border-[#3480fb] text-[#3571d2] font-semibold'>
                                    <div className='flex gap-2'>
                                        <Plus />
                                        <p>
                                            New Invoice
                                        </p>
                                    </div>
                                </Link>

                            </div>
                        </div>

                        {/* estimate box  */}

                        <div className='border mt-10 border-gray-600 py-6 px-8 w-fit gap-3 flex flex-col rounded-md'>
                            <p className='font-semibold text-3xl'>ESTIMATE</p>
                            <div className='flex flex-col gap-3'>

                                <Link
                                    href={"/billing/estimate_search"}
                                    className='bg-[#3480fb] border-1 py-3 px-6 text-white text-center border-gray-700 rounded-xl'>
                                    <div className='flex gap-2'>
                                        <SearchIcon />
                                        <p>Search Estimate</p>
                                    </div>
                                </Link>
                                <Link
                                    href={"/billing/add/estimate"}
                                    className='border-2 py-3 px-6  text-center rounded-xl border-[#3480fb] text-[#3571d2] font-semibold'>
                                    <div className='flex gap-2'>
                                        <Plus />
                                        <p>
                                            New Estimate
                                        </p>
                                    </div>
                                </Link>


                            </div>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    )
}

export default Billing