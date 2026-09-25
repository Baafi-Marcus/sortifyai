import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  XMarkIcon, 
  ShieldCheckIcon, 
  ArrowRightOnRectangleIcon, 
  SparklesIcon,
  CloudArrowUpIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (!isOpen) return;

    // Load Google Identity Services SDK dynamically
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && googleClientId) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        });
        const buttonDiv = document.getElementById('google-signin-button-render');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'filled_blue',
            size: 'large',
            shape: 'pill',
            width: 320,
            text: 'continue_with'
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isOpen, googleClientId]);

  if (!isOpen) return null;

  // Handle Google Token Response from SDK
  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${apiUrl}/auth/google`, {
        credential: response.credential
      });
      if (res.data?.status === 'success') {
        onLoginSuccess(res.data.user, res.data.token);
        onClose();
      }
    } catch (err) {
      console.error('Google Sign-in failed:', err);
      setError(err.response?.data?.detail || 'Failed to authenticate with Google.');
    } finally {
      setLoading(false);
    }
  };

  // Demo / Quick Sign-In fallback
  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${apiUrl}/auth/google`, {
        email: 'teacher.demo@sortifyai.com',
        name: 'Ghana Education Teacher',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        google_id: 'goog_demo_' + Date.now()
      });
      if (res.data?.status === 'success') {
        onLoginSuccess(res.data.user, res.data.token);
        onClose();
      }
    } catch (err) {
      console.error('Sign-in failed:', err);
      setError(err.response?.data?.detail || 'Sign-in failed. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-brand-dark border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/25 flex items-center justify-center text-brand-primary">
            <UserCircleIcon className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Sign In to SortifyAI</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Save and access your balanced student groups, export historical rosters, and manage allocations.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Google OAuth Button Container */}
        <div className="space-y-4 pt-2">
          <div className="flex justify-center">
            {googleClientId ? (
              <div id="google-signin-button-render"></div>
            ) : (
              <button
                onClick={handleQuickDemoLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all shadow-lg hover:scale-[1.02] disabled:opacity-50"
              >
                {/* Official Google 'G' Logo SVG */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.28-2.1 3.645-5.2 3.645-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.94H1.28v3.13C3.28 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.32 14.26c-.24-.73-.38-1.5-.38-2.26s.14-1.53.38-2.26V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l4.04-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.36 0 3.28 2.64 1.28 6.61l4.04 3.13c.94-2.84 3.58-4.97 6.68-4.97z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            )}
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
              Secure Cloud Sync
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Benefits list */}
          <div className="space-y-2 rounded-2xl bg-white/[0.03] border border-white/5 p-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CloudArrowUpIcon className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Save multiple projects to your Neon cloud database</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>One-click Google authentication with no passwords</span>
            </div>
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Access historical cohorts and regroup anytime</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-center text-slate-500">
          By signing in, you agree to SortifyAI's Terms of Service and Privacy Policy. Student data remains strictly private.
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
