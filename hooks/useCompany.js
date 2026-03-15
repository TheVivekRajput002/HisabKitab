'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/utils/supabaseClient';

/**
 * Custom hook that returns the current user's company_id.
 * Must be used inside a <ClerkProvider> and after CompanyProvider has confirmed membership.
 * 
 * @returns {{ companyId: string | null, loading: boolean }}
 */
export function useCompany() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [companyId, setCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    const fetchCompany = async () => {
      try {
        const { data, error } = await supabase
          .from('company_members')
          .select('company_id, companies(name)')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (error) throw error;
        setCompanyId(data?.company_id || null);
        setCompanyName(data?.companies?.name || '');
      } catch (e) {
        console.error('useCompany: Error fetching company:', e);
        setCompanyId(null);
        setCompanyName('');
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [isLoaded, isSignedIn, user?.id]);

  return { companyId, companyName, loading };
}
