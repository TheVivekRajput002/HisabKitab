'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/utils/supabaseClient';

export default function CompanyProvider({ children }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [hasCompany, setHasCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [companyCode, setCompanyCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setHasCompany(null);
      setLoading(false);
      return;
    }

    checkCompany();
  }, [isLoaded, isSignedIn]);

  const checkCompany = async () => {
    try {
      const { data, error } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;
      setHasCompany(data && data.length > 0);
    } catch (e) {
      console.error('Error checking company:', e);
    } finally {
      setLoading(false);
    }
  };

  const joinCompany = async (e) => {
    e.preventDefault();
    setJoining(true);
    setError('');

    try {
      // 1. Find the company by its code
      const { data: company, error: findError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('company_code', companyCode.toUpperCase())
        .single();

      if (findError || !company) {
        setError('No company found with this code. Please check and try again.');
        setJoining(false);
        return;
      }

      // 2. Add the user as a member of that company
      const { error: memberError } = await supabase
        .from('company_members')
        .insert([{
          company_id: company.id,
          user_id: user.id,
          role: 'admin'
        }]);

      if (memberError) throw memberError;

      // 3. Refresh the check
      await checkCompany();
    } catch (e) {
      console.error('Error joining company:', e);
      if (e.code === '23505') {
        setError('You are already a member of this company. Try refreshing the page.');
      } else {
        setError(e.message || 'Failed to join company.');
      }
    } finally {
      setJoining(false);
    }
  };

  // 1. Still loading
  if (isLoaded && isSignedIn && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 2. Authenticated but not linked to any company — show Join form
  if (isSignedIn && hasCompany === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to HisabKitab!</h1>
            <p className="text-gray-600">Enter your Company Code to join your business workspace.</p>
          </div>

          <form onSubmit={joinCompany} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Company Code</label>
              <input
                required
                type="text"
                autoFocus
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none uppercase text-center text-lg tracking-widest font-mono"
                placeholder="e.g. SSAM-01"
              />
              <p className="text-xs text-gray-500 mt-2 font-medium text-center">Ask your business admin for the code.</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium border border-red-100 flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={joining}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {joining ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Joining...</span>
                </>
              ) : (
                "Join Company"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. User has a company OR is not signed in → render app
  return children;
}
