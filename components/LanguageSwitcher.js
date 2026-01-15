"use client"

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const changeLanguage = (newLocale) => {
        // Remove current locale from pathname if present
        const currentPath = pathname.replace(`/${locale}`, '');

        // Navigate to new locale
        if (newLocale === 'en') {
            // For default locale, don't add prefix
            router.push(currentPath || '/');
        } else {
            router.push(`/${newLocale}${currentPath}`);
        }
    };

    return (
        <div className="relative inline-block">
            <div className="flex items-center gap-2">
                <Globe size={18} className="text-gray-600" />
                <select
                    value={locale}
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
                >
                    <option value="en">English</option>
                    <option value="hi">हिंदी</option>
                </select>
            </div>
        </div>
    );
}
