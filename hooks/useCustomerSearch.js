import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

export const useCustomerSearch = (phoneNumber) => {
    const [searching, setSearching] = useState(false);
    const [found, setFound] = useState(false);
    const [customerData, setCustomerData] = useState(null);
    const [searchResults, setSearchResults] = useState([]); // 🆕 Live search results

    useEffect(() => {
        const searchCustomers = async () => {
            // Clear results if input is empty
            if (!phoneNumber || phoneNumber.length === 0) {
                setFound(false);
                setCustomerData(null);
                setSearchResults([]);
                return;
            }

            setSearching(true);
            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('id, name, phone_number, address, vehicle, gstin')
                    .ilike('phone_number', `${phoneNumber}%`) // 🆕 Search by prefix
                    .order('created_at', { ascending: false })
                    .limit(10); // 🆕 Show top 10 results

                if (error) throw error;

                setSearchResults(data || []);

                // Auto-select if exact match
                const exactMatch = data?.find(c => c.phone_number === phoneNumber);
                if (exactMatch) {
                    setCustomerData(exactMatch);
                    setFound(true);
                } else {
                    setFound(false);
                    setCustomerData(null);
                }
            } catch (error) {
                console.error('Error searching customers:', error);
                setSearchResults([]);
                setFound(false);
                setCustomerData(null);
            } finally {
                setSearching(false);
            }
        };

        const timer = setTimeout(searchCustomers, 300); // 🆕 Debounce for better performance
        return () => clearTimeout(timer);
    }, [phoneNumber]);

    return { searching, found, customerData, searchResults }; // 🆕 Return searchResults
};