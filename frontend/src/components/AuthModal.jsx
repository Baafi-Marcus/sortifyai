import React, { useState, useMemo } from 'react';
import axios from 'axios';
import {
  XMarkIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  ArrowPathIcon,
  LockClosedIcon,
  EnvelopeIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'login'
  
  // Registration form state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Request state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Password Strength Evaluation
  const passwordCriteria = useMemo(() => {
    const pwd = regPassword || '';
    return {
      minLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':",.<>/?\\|`~]/.test(pwd),
    };
  }, [regPassword]);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.minLength) score += 1;
    if (passwordCriteria.hasUpper && passwordCriteria.hasLower) score += 1;
    if (passwordCriteria.hasNumber) score += 1;
    if (passwordCriteria.hasSpecial) score += 1;
    return score;
  }, [passwordCriteria]);

  const isPasswordStrong = strengthScore === 4;
  const passwordsMatch = regPassword && regConfirmPassword && regPassword === regConfirmPassword;
  const isUsernameValid = regUsername.trim().length >= 3 && /^[a-zA-Z0-9_-]+$/.test(regUsername.trim());
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim());

  const canRegister = isUsernameValid && isPasswordStrong && passwordsMatch && isEmailValid;

  if (!isOpen) return null;

  // Handle User Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!canRegister || loading) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await axios.post(`${apiUrl}/auth/register`, {
        username: regUsername.trim(),
        password: regPassword,
        confirm_password: regConfirmPassword,
        email: regEmail.trim(),
        name: regUsername.trim()
      });

      if (res.data?.status === 'success') {
        setSuccessMsg("Account created successfully!");
        setTimeout(() => {
          onLoginSuccess(res.data.user, res.data.token);
          onClose();
        }, 600);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.detail || 'Failed to create account. Please verify input.');
    } finally {
      setLoading(false);
    }
  };

  // Handle User Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${apiUrl}/auth/login`, {
        identifier: loginIdentifier.trim(),
        password: loginPassword
      });

      if (res.data?.status === 'success') {
        onLoginSuccess(res.data.user, res.data.token);
        onClose();
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.detail || 'Invalid username/email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close authentication dialog"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-standard"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-1">
            <LockClosedIcon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">
            {activeTab === 'register' ? 'Create Your SortifyAI Account' : 'Sign In to SortifyAI'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {activeTab === 'register' 
              ? 'Create your account with a username and strong password.' 
              : 'Sign in to access your cloud cohorts and saved allocations.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(null); }}
            className={`py-2 rounded-md transition-standard ${
              activeTab === 'register'
                ? 'bg-brand-primary text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(null); }}
            className={`py-2 rounded-md transition-standard ${
              activeTab === 'login'
                ? 'bg-brand-primary text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckIcon className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: REGISTRATION FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            {/* Username */}
            <div className="space-y-1">
              <label className="block text-slate-300 font-medium">
                Username <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. marcus_lead"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono text-xs"
                />
              </div>
              <p className="text-[10px] text-slate-500">At least 3 characters, letters, numbers, and dashes.</p>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-slate-300 font-medium">
                Email Address <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="your.email@school.edu"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>
            </div>

            {/* Strong Password */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-slate-300 font-medium">
                  Strong Password <span className="text-cyan-400">*</span>
                </label>
                <span className={`text-[10px] font-semibold ${
                  strengthScore === 4 ? 'text-emerald-400' :
                  strengthScore === 3 ? 'text-cyan-400' :
                  strengthScore === 2 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {regPassword ? (
                    strengthScore === 4 ? 'Very Strong' :
                    strengthScore === 3 ? 'Strong' :
                    strengthScore === 2 ? 'Moderate' : 'Weak'
                  ) : 'Required'}
                </span>
              </div>

              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter strong password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-lg bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showRegPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Visual Bar */}
              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                <div className={`h-1 rounded-full transition-all duration-300 ${
                  strengthScore >= 1 ? 'bg-rose-500' : 'bg-slate-700'
                }`} />
                <div className={`h-1 rounded-full transition-all duration-300 ${
                  strengthScore >= 2 ? 'bg-amber-500' : 'bg-slate-700'
                }`} />
                <div className={`h-1 rounded-full transition-all duration-300 ${
                  strengthScore >= 3 ? 'bg-cyan-500' : 'bg-slate-700'
                }`} />
                <div className={`h-1 rounded-full transition-all duration-300 ${
                  strengthScore === 4 ? 'bg-emerald-500' : 'bg-slate-700'
                }`} />
              </div>

              {/* Checklist */}
              <div className="grid grid-cols-2 gap-1 pt-1.5 text-[10px] text-slate-400 bg-slate-800/40 p-2 rounded-lg border border-slate-800">
                <div className={`flex items-center gap-1.5 ${passwordCriteria.minLength ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                  <span>{passwordCriteria.minLength ? '✓' : '•'}</span>
                  <span>Min 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                  <span>{passwordCriteria.hasUpper ? '✓' : '•'}</span>
                  <span>1 Uppercase (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                  <span>{passwordCriteria.hasNumber ? '✓' : '•'}</span>
                  <span>1 Number (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                  <span>{passwordCriteria.hasSpecial ? '✓' : '•'}</span>
                  <span>1 Symbol (!@#$...)</span>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-slate-300 font-medium">
                  Confirm Password <span className="text-cyan-400">*</span>
                </label>
                {regConfirmPassword && (
                  <span className={`text-[10px] font-medium ${passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {passwordsMatch ? '✓ Matches' : '✗ Does not match'}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showRegConfirm ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 pr-10 rounded-lg bg-slate-800/90 border text-white placeholder-slate-500 focus:outline-none text-xs ${
                    regConfirmPassword && !passwordsMatch
                      ? 'border-rose-500/80 focus:border-rose-400'
                      : 'border-slate-700 focus:border-cyan-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirm(!showRegConfirm)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showRegConfirm ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Register Button */}
            <button
              type="submit"
              disabled={!canRegister || loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-brand-primary hover:bg-brand-accent text-slate-900 font-semibold text-xs transition-standard disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin text-slate-900" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="w-4 h-4 text-slate-900" />
                  <span>Complete Registration</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: SIGN IN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Username or Email */}
            <div className="space-y-1">
              <label className="block text-slate-300 font-medium">
                Username or Email
              </label>
              <input
                type="text"
                required
                placeholder="Enter username or email address"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-slate-300 font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-lg bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showLoginPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Sign In Button */}
            <button
              type="submit"
              disabled={!loginIdentifier || !loginPassword || loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-brand-primary hover:bg-brand-accent text-slate-900 font-semibold text-xs transition-standard disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin text-slate-900" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to Account</span>
              )}
            </button>
          </form>
        )}

        {/* Footer Note */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500">
            {activeTab === 'register' ? (
              <span>
                Already have an account?{' '}
                <button 
                  onClick={() => { setActiveTab('login'); setError(null); }}
                  className="text-cyan-400 hover:underline font-medium"
                >
                  Sign in here
                </button>
              </span>
            ) : (
              <span>
                Need an account?{' '}
                <button 
                  onClick={() => { setActiveTab('register'); setError(null); }}
                  className="text-cyan-400 hover:underline font-medium"
                >
                  Register in 30 seconds
                </button>
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
