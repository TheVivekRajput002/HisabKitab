import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

export const useCustomerSearch = (phoneNumber, companyId) => {
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
                let query = supabase
                    .from('customers')
                    .select('id, name, phone_number, address, gstin, vehicles(id, vehicle_number)')
                    .ilike('phone_number', `${phoneNumber}%`)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (companyId) {
                    query = query.eq('company_id', companyId);
                }

                const { data, error } = await query;

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
                console.error('Error searching customers:', error?.message || error);
                setSearchResults([]);
                setFound(false);
                setCustomerData(null);
            } finally {
                setSearching(false);
            }
        };

        const timer = setTimeout(searchCustomers, 300);
        return () => clearTimeout(timer);
    }, [phoneNumber, companyId]);

    return { searching, found, customerData, searchResults };
};