'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/utils/supabaseClient';
import { useCompany } from '@/hooks/useCompany';
import { useRouter } from 'next/navigation';
import { Building2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ChangeCompanyPage() {
  const { user } = useUser();
  const { companyName, companyId } = useCompany();
  const router = useRouter();

  const [companyCode, setCompanyCode] = useState('');
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangeCompany = async (e) => {
    e.preventDefault();
    setSwitching(true);
    setError('');
    setSuccess('');

    try {
      // 1. Find the new company by its code
      const { data: newCompany, error: findError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('company_code', companyCode.toUpperCase())
        .single();

      if (findError || !newCompany) {
        setError('No company found with this code. Please check and try again.');
        setSwitching(false);
        return;
      }

      // 2. Check if it's the same company
      if (newCompany.id === companyId) {
        setError('You are already a member of this company.');
        setSwitching(false);
        return;
      }

      // 3. Delete the current membership
      const { error: deleteError } = await supabase
        .from('company_members')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // 4. Insert the new membership
      const { error: insertError } = await supabase
        .from('company_members')
        .insert([{
          company_id: newCompany.id,
          user_id: user.id,
          role: 'admin',
        }]);

      if (insertError) throw insertError;

      // 5. Success — redirect to home after a brief message
      setSuccess(`Switched to "${newCompany.name}" successfully! Redirecting...`);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (e) {
      console.error('Error changing company:', e);
      setError(e.message || 'Failed to change company. Please try again.');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Change Company</h1>
          {companyName && (
            <p className="text-gray-500 text-sm">
              Current company: <span className="font-semibold text-gray-700">{companyName}</span>
            </p>
          )}
          <p className="text-gray-600 mt-2">Enter a new Company Code to switch your business workspace.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleChangeCompany} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">New Company Code</label>
            <input
              required
              type="text"
              autoFocus
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none uppercase text-center text-lg tracking-widest font-mono"
              placeholder="e.g. SSAM-01"
            />
            <p className="text-xs text-gray-500 mt-2 font-medium text-center">Ask the business admin for the code.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium border border-red-100 flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm font-medium border border-green-100 flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={switching}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {switching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Switching...</span>
              </>
            ) : (
              'Switch Company'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
