import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  XMarkIcon, 
  ShieldCheckIcon, 
  CloudArrowUpIcon,
  ClockIcon,
  UserCircleIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('google'); // 'google' | 'email' | 'request_tester'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Email login form state
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  // Tester whitelist request state
  const [testerEmail, setTesterEmail] = useState('');
  const [testerName, setTesterName] = useState('');
  const [testerOrg, setTesterOrg] = useState('');
  const [testerSubmitted, setTesterSubmitted] = useState(false);

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
            shape: 'rectangular',
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
  }, [isOpen, googleClientId, activeTab]);

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
      setError(err.response?.data?.detail || 'Failed to authenticate with Google. If your account is not yet on the test user list, use Email Sign-In below.');
    } finally {
      setLoading(false);
    }
  };

  // Direct Passwordless Email Sign-In / Account Creation
  const handleEmailLoginSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError('Please provide your email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${apiUrl}/auth/email-login`, {
        email: emailInput.trim(),
        name: nameInput.trim() || emailInput.split('@')[0]
      });
      if (res.data?.status === 'success') {
        onLoginSuccess(res.data.user, res.data.token);
        onClose();
      }
    } catch (err) {
      console.error('Email sign-in failed:', err);
      setError(err.response?.data?.detail || 'Failed to sign in with email.');
    } finally {
      setLoading(false);
    }
  };

  // Submit request to be added to Google OAuth testing whitelist
  const handleRequestTesterSubmit = async (e) => {
    e.preventDefault();
    if (!testerEmail.trim()) {
      setError('Please provide a valid Gmail address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${apiUrl}/auth/request-tester`, {
        email: testerEmail.trim(),
        name: testerName.trim() || undefined,
        organization: testerOrg.trim() || undefined
      });
      if (res.data?.status === 'success') {
        setTesterSubmitted(true);
        setSuccessMsg(res.data.message || 'Your email has been added to the Google OAuth testing whitelist queue.');
      }
    } catch (err) {
      console.error('Tester request failed:', err);
      setError(err.response?.data?.detail || 'Could not submit tester request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-md bg-slate-900 border border-slate-700 p-6 sm:p-8 space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close authentication dialog"
          className="absolute top-4 right-4 p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-standard"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="mx-auto w-9 h-9 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary">
            <UserCircleIcon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white">Sign In to SortifyAI</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-normal">
            Save and access balanced student groups in your secure cloud database.
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex rounded bg-slate-950 border border-slate-800 p-0.5 text-xs font-medium">
          <button
            onClick={() => { setActiveTab('google'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-1.5 rounded transition-standard ${
              activeTab === 'google'
                ? "bg-slate-800 text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Google OAuth
          </button>
          <button
            onClick={() => { setActiveTab('email'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-1.5 rounded transition-standard ${
              activeTab === 'email'
                ? "bg-slate-800 text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Instant Email Sign-In
          </button>
        </div>

        {error && (
          <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Google OAuth */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            <div className="flex justify-center pt-2">
              <div id="google-signin-button-render"></div>
            </div>

            {/* Tester Whitelist Helper Callout */}
            <div className="p-3.5 rounded bg-slate-800/40 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold text-[11px] uppercase tracking-wider">
                  Beta Testing Program
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  100 User Cap
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-normal">
                Google OAuth is currently in testing status. If your Gmail has not been added to the whitelist yet, submit it below or use Instant Email Sign-In.
              </p>

              <button
                type="button"
                onClick={() => { setActiveTab('request_tester'); setError(null); }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline text-xs block"
              >
                + Submit my Gmail to join the tester whitelist
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Direct Passwordless Email Sign-In */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailLoginSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Kofi Mensah"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="teacher@school.edu.gh"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-accent text-slate-900 font-semibold rounded text-xs transition-standard hover-subtle disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-slate-900" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <EnvelopeIcon className="w-3.5 h-3.5" />
                  <span>Sign In & Save to Cloud</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              No password needed. An account will be automatically provisioned in your Neon database.
            </p>
          </form>
        )}

        {/* Tab 3: Request Tester Whitelist Submission */}
        {activeTab === 'request_tester' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-white">Join Google OAuth Tester Whitelist</h4>
              <button
                type="button"
                onClick={() => setActiveTab('google')}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← Back
              </button>
            </div>

            {testerSubmitted ? (
              <div className="p-4 rounded bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircleIcon className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-white">Request Received!</p>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Your Gmail has been submitted to the tester queue. In the meantime, you can immediately sign in via the <strong>Instant Email Sign-In</strong> tab!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('email')}
                  className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium border border-slate-700 transition-standard"
                >
                  Continue to Instant Sign-In →
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestTesterSubmit} className="space-y-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gmail Address *</label>
                  <input
                    type="email"
                    required
                    value={testerEmail}
                    onChange={(e) => setTesterEmail(e.target.value)}
                    placeholder="your.account@gmail.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name (Optional)</label>
                  <input
                    type="text"
                    value={testerName}
                    onChange={(e) => setTesterName(e.target.value)}
                    placeholder="e.g. Kwame Mensah"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">School / Organization (Optional)</label>
                  <input
                    type="text"
                    value={testerOrg}
                    onChange={(e) => setTesterOrg(e.target.value)}
                    placeholder="e.g. Prempeh College / University of Ghana"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-accent text-slate-900 font-semibold rounded text-xs transition-standard hover-subtle disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-slate-900" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Tester Request</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Benefits list */}
        <div className="space-y-1.5 rounded bg-slate-800/40 border border-slate-800 p-3 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <CloudArrowUpIcon className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            <span>Save multiple projects to your Neon cloud database</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Strict educational student data privacy</span>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Access historical cohorts and reassign records anytime</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-center text-slate-400 leading-normal">
          By signing in, you agree to SortifyAI's{' '}
          <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
