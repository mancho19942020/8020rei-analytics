'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/AuthContext';

/**
 * Login Page with Firebase Authentication
 *
 * Modern dark-mode login with glassmorphism effects.
 * Only @8020rei.com Google accounts are permitted.
 */

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen login-bg flex items-center justify-center">
        {/* Background elements */}
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-grid-pattern" />
        <div className="login-vignette" />

        <div className="text-center relative z-10">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
            <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-neutral-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen login-bg flex items-center justify-center px-4">
      {/* Animated background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      {/* Subtle grid overlay */}
      <div className="login-grid-pattern" />

      {/* Vignette effect */}
      <div className="login-vignette" />

      <div className="max-w-md w-full relative z-10">
        {/* Glass Card */}
        <div className="glass-card glass-card-hover rounded-2xl p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-10 pt-2">
            <img
              src="/logo/logo-dark.svg"
              alt="8020 Metrics Hub"
              className="h-5 md:h-6 mx-auto mb-8"
            />
            <p className="text-neutral-500 text-xs">
              Sign in with your company Google account
            </p>
          </div>

          {/* Company Access Notice */}
          <div className="mb-6 p-4 glass-badge rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-blue-400 font-medium text-sm mb-1">
                  Company Access Only
                </p>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Only @8020rei.com email addresses are allowed to access this dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={signInWithGoogle}
            className="w-full glass-google-btn rounded-xl px-6 py-3.5 flex items-center justify-center gap-3 text-white font-medium"
          >
            {/* Google Logo */}
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
            Continue with Google
          </button>

          {/* Terms Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-neutral-500">
              By signing in, you agree to access the 8020REI Analytics platform.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-600">
            Need help? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
