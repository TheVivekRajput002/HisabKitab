"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
    const { user, signInWithGoogle, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect if already logged in
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {/* Logo/Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">HisabKitab</h1>
                        <p className="text-gray-600">Business Management System</p>
                    </div>

                    {/* Welcome Text */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome Back</h2>
                        <p className="text-gray-600">Sign in to continue to your account</p>
                    </div>

                    {/* Google Sign In Button */}
                    <button
                        onClick={signInWithGoogle}
                        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-lg px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span>Continue with Google</span>
                    </button>

                    {/* Footer */}
                    <p className="text-center text-sm text-gray-500 mt-8">
                        By signing in, you agree to our Terms and Privacy Policy
                    </p>
                </div>

                {/* Additional Info */}
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        Secure authentication powered by Supabase
                    </p>
                </div>
            </div>
        </div>
    );
}
