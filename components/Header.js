"use client"

import Link from 'next/link';
import { useState } from 'react';
import {
    Home,
    ReceiptIndianRupee,
    BookUser,
    PackageSearch,
    PersonStanding,
    ChartNoAxesCombined,
    Camera
} from 'lucide-react';
// import LanguageSwitcher from './LanguageSwitcher'; // Temporarily disabled until i18n is fully implemented

const Header = ({ params }) => {
    const [isHovered, setIsHovered] = useState(false);

    const navItems = [
        { name: 'Home', to: '/', icon: Home },
        { name: 'Sale', to: '/billing', icon: ReceiptIndianRupee },
        { name: 'Customer', to: '/customer', icon: BookUser },
        { name: 'Inventory', to: '/inventory', icon: PackageSearch },
        { name: 'Staff', to: '/staff', icon: PersonStanding },
        { name: 'Reports', to: '/report', icon: ChartNoAxesCombined },
        { name: 'Purchase', to: '/vendor', icon: Camera },
    ];

    const isActive = (path) => params === path;

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <div
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ease-in-out ${isHovered ? 'w-64' : 'w-16'
                        }`}
                >
                    {/* Logo/Header */}
                    <div className="h-16 flex items-center px-4 border-b border-[#2d2d30]">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-sm">SS</span>
                            </div>
                            <span
                                className={`text-gray-600 font-semibold text-sm whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0'
                                    }`}
                            >
                                Shiv Shakti AutoMobile
                            </span>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="py-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.to);

                            return (
                                <Link
                                    key={item.name}
                                    href={item.to}
                                    className={`w-full flex items-center gap-3 px-4 py-3 mb-1 transition-all duration-200 group relative ${active
                                        ? 'bg-[#37373d] text-blue-600'
                                        : 'text-gray-600 hover:bg-blue-500 hover:text-gray-400'
                                        }`}
                                >
                                    {/* Active Indicator */}
                                    {active && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-blue-600" />
                                    )}

                                    {/* Icon */}
                                    <div className="flex-shrink-0 w-5 h-5">
                                        <Icon className="w-5 h-5" />
                                    </div>

                                    {/* Label */}
                                    <span
                                        className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0'
                                            }`}
                                    >
                                        {item.name}
                                    </span>

                                    {/* Tooltip (collapsed state) */}
                                    {!isHovered && (
                                        <div className="absolute left-full ml-2 px-3 py-1.5 bg-[#3c3c3c] text-gray-600 text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-[#454545]">
                                            {item.name}
                                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[#3c3c3c]" />
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-[#2d2d30] z-50 safe-area-inset-bottom">
                <div className="flex justify-around items-center h-16 px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.to);

                        return (
                            <Link
                                key={item.name}
                                href={item.to}
                                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] ${active ? 'text-blue-600' : 'text-gray-600'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-xs font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default Header;