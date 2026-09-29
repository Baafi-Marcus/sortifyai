import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShieldCheckIcon,
  CpuChipIcon,
  EnvelopeIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ClipboardDocumentCheckIcon,
  ArrowLeftIcon,
  SparklesIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const PROVIDER_METADATA = {
  gemini: {
    name: 'Google Gemini',
    badge: 'Fast & Generous Free Tier',
    defaultModel: 'gemini-1.5-flash',
    modelSuggestions: ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    placeholder: 'AIzaSy...',
    docsHelp: 'Get key from Google AI Studio (aistudio.google.com)'
  },
  openai: {
    name: 'OpenAI (ChatGPT)',
    badge: 'Industry Standard',
    defaultModel: 'gpt-4o-mini',
    modelSuggestions: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
    defaultBaseUrl: 'https://api.openai.com/v1',
    placeholder: 'sk-proj-...',
    docsHelp: 'Get key from platform.openai.com'
  },
  github: {
    name: 'GitHub Models',
    badge: 'Azure AI Powered',
    defaultModel: 'gpt-4o-mini',
    modelSuggestions: ['gpt-4o-mini', 'gpt-4o', 'Phi-3.5-mini-instruct'],
    defaultBaseUrl: 'https://models.inference.ai.azure.com',
    placeholder: 'ghp_... or gho_...',
    docsHelp: 'Use GitHub Personal Access Token with Models access'
  },
  openrouter: {
    name: 'OpenRouter',
    badge: 'Multi-Model Fallback',
    defaultModel: 'openai/gpt-4o-mini',
    modelSuggestions: ['openai/gpt-4o-mini', 'anthropic/claude-3-haiku', 'google/gemini-flash-1.5'],
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    placeholder: 'sk-or-v1-...',
    docsHelp: 'Get key from openrouter.ai/keys'
  }
};

const AdminPage = ({ onBack }) => {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('sortifyai_admin_key') || '');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState(null);

  // Data states
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'users'
  const [configs, setConfigs] = useState([]);
  const [usersData, setUsersData] = useState({ total_users: 0, total_emails_collected: 0, users: [], comma_separated_emails: '' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Loading & notification states
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [testingProvider, setTestingProvider] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [showKeyMap, setShowKeyMap] = useState({});
  const [editForms, setEditForms] = useState({});

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Verify Admin Key
  const handleUnlock = async (e) => {
    e.preventDefault();
    setPasscodeError(null);
    const keyToTest = passcodeInput.trim() || adminKey;
    try {
      const res = await axios.post(`${apiUrl}/admin/verify`, { admin_key: keyToTest });
      if (res.data?.status === 'success') {
        sessionStorage.setItem('sortifyai_admin_key', keyToTest);
        setAdminKey(keyToTest);
        setIsUnlocked(true);
      }
    } catch (err) {
      console.error(err);
      setPasscodeError('Invalid Admin Passcode. Please try again.');
    }
  };

  // Auto-verify if key already in session
  useEffect(() => {
    if (adminKey && !isUnlocked) {
      axios.post(`${apiUrl}/admin/verify`, { admin_key: adminKey })
        .then(() => setIsUnlocked(true))
        .catch(() => {
          sessionStorage.removeItem('sortifyai_admin_key');
          setAdminKey('');
        });
    }
  }, [adminKey, isUnlocked, apiUrl]);

  // Load Admin Data
  const fetchAdminData = async () => {
    if (!isUnlocked) return;
    setLoading(true);
    try {
      const [cfgRes, usersRes] = await Promise.all([
        axios.get(`${apiUrl}/admin/ai-configs?admin_key=${encodeURIComponent(adminKey)}`),
        axios.get(`${apiUrl}/admin/users?admin_key=${encodeURIComponent(adminKey)}`)
      ]);

      if (cfgRes.data?.configs) {
        setConfigs(cfgRes.data.configs);
        // Pre-fill edit forms
        const initialEdits = {};
        cfgRes.data.configs.forEach(c => {
          initialEdits[c.provider] = {
            api_key: '',
            model: c.model || PROVIDER_METADATA[c.provider]?.defaultModel || '',
            base_url: c.base_url || PROVIDER_METADATA[c.provider]?.defaultBaseUrl || '',
            is_active: c.is_active
          };
        });
        setEditForms(initialEdits);
      }

      if (usersRes.data) {
        setUsersData(usersRes.data);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showToast('Error loading configuration or user data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchAdminData();
    }
  }, [isUnlocked]);

  // Save AI Config
  const handleSaveConfig = async (provider, makeActive = false) => {
    const form = editForms[provider] || {};
    try {
      const payload = {
        provider,
        api_key: form.api_key || '',
        model: form.model || PROVIDER_METADATA[provider]?.defaultModel,
        base_url: form.base_url || PROVIDER_METADATA[provider]?.defaultBaseUrl,
        is_active: makeActive ? true : form.is_active
      };

      const res = await axios.post(`${apiUrl}/admin/ai-configs?admin_key=${encodeURIComponent(adminKey)}`, payload);
      showToast(res.data?.message || `Configuration saved for ${provider.toUpperCase()}`);
      fetchAdminData();
    } catch (err) {
      console.error('Failed to save config:', err);
      showToast(err.response?.data?.detail || 'Failed to save configuration.');
    }
  };

  // Test Connection
  const handleTestConnection = async (provider) => {
    const form = editForms[provider] || {};
    const keyToTest = form.api_key;

    if (!keyToTest) {
      alert(`Please enter an API Key for ${provider.toUpperCase()} before testing.`);
      return;
    }

    setTestingProvider(provider);
    setTestResults(prev => ({ ...prev, [provider]: null }));

    try {
      const res = await axios.post(`${apiUrl}/admin/ai-configs/test?admin_key=${encodeURIComponent(adminKey)}`, {
        provider,
        api_key: keyToTest,
        model: form.model || PROVIDER_METADATA[provider]?.defaultModel,
        base_url: form.base_url || PROVIDER_METADATA[provider]?.defaultBaseUrl
      });
      setTestResults(prev => ({ ...prev, [provider]: res.data }));
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [provider]: { success: false, error: err.response?.data?.detail || err.message }
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  // Copy All Emails to Clipboard
  const handleCopyEmails = () => {
    if (!usersData.comma_separated_emails) {
      showToast('No emails collected yet.');
      return;
    }
    navigator.clipboard.writeText(usersData.comma_separated_emails);
    showToast(`✓ Copied ${usersData.total_emails_collected} emails to clipboard!`);
  };

  // Export Users CSV
  const handleDownloadCSV = () => {
    if (!usersData.users || usersData.users.length === 0) {
      showToast('No user records to download.');
      return;
    }
    const headers = ['ID', 'Username', 'Email', 'Display Name', 'Role', 'Created At', 'Saved Projects'];
    const rows = usersData.users.map(u => [
      u.id,
      `"${u.username}"`,
      `"${u.email}"`,
      `"${u.name}"`,
      u.role,
      u.created_at || '',
      u.saved_projects_count
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sortifyai_registered_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Users
  const filteredUsers = (usersData.users || []).filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.name && u.name.toLowerCase().includes(q))
    );
  });

  const activeProviderRecord = configs.find(c => c.is_active);

  // -------------------------------------------------------------
  // GATED VIEW (If not unlocked)
  // -------------------------------------------------------------
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-700/80 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <LockClosedIcon className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white">SortifyAI Admin Portal</h2>
            <p className="text-xs text-slate-400">
              Enter the administrator passcode to configure AI providers and view registered emails.
            </p>
          </div>

          {passcodeError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {passcodeError}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="block text-slate-300 font-medium">Administrator Passcode</label>
              <input
                type="password"
                required
                placeholder="Enter admin passcode"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-brand-primary hover:bg-brand-accent text-slate-900 font-semibold text-xs transition-standard"
            >
              Access Admin Panel
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={onBack}
              className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Return to Application</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // UNLOCKED ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-brand-dark text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 p-3.5 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-xs shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircleIcon className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-standard"
              title="Return to Studio"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">
                Sortify<span className="text-brand-primary">AI</span> Admin
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Control Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-standard"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem('sortifyai_admin_key');
                setIsUnlocked(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium border border-slate-700 transition-standard"
            >
              Lock Admin
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Metric Overview Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active AI Engine</span>
              <CpuChipIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-white uppercase tracking-tight">
              {activeProviderRecord ? activeProviderRecord.display_name : 'Default Fallback'}
            </div>
            <p className="text-[11px] text-cyan-400 font-mono">
              Model: {activeProviderRecord?.model || 'gpt-4o-mini'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Registered Users</span>
              <UserGroupIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {usersData.total_users || 0}
            </div>
            <p className="text-[11px] text-slate-400">
              Users with username & password
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Future Migration Emails</span>
              <EnvelopeIcon className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {usersData.total_emails_collected || 0}
            </div>
            <p className="text-[11px] text-slate-400">
              Ready for Google OAuth whitelist
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 space-x-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-standard ${
              activeTab === 'ai'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CpuChipIcon className="w-4 h-4" />
            <span>AI Model & Key Providers ({configs.length || 4})</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-standard ${
              activeTab === 'users'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <EnvelopeIcon className="w-4 h-4" />
            <span>Collected Emails & Users Directory ({usersData.total_users})</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: AI MODEL PROVIDERS (Gemini, OpenAI, GitHub Models, etc.) */}
        {/* ============================================================== */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <h4 className="font-semibold text-white">AI Provider Management</h4>
                <p className="text-slate-400 text-[11px]">
                  Configure your API keys for Google Gemini, OpenAI, GitHub Models, or OpenRouter. The active provider runs live groupings for users.
                </p>
              </div>
            </div>

            {/* Provider Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {['gemini', 'openai', 'github', 'openrouter'].map((providerKey) => {
                const meta = PROVIDER_METADATA[providerKey];
                const savedConfig = configs.find(c => c.provider === providerKey) || {};
                const form = editForms[providerKey] || {
                  api_key: '',
                  model: meta.defaultModel,
                  base_url: meta.defaultBaseUrl,
                  is_active: false
                };
                const isCurrentActive = savedConfig.is_active;
                const testResult = testResults[providerKey];
                const isTesting = testingProvider === providerKey;
                const showKey = showKeyMap[providerKey];

                return (
                  <div
                    key={providerKey}
                    className={`rounded-xl border p-5 space-y-4 transition-all duration-200 ${
                      isCurrentActive
                        ? 'bg-slate-900/90 border-cyan-500/50 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/20'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white text-sm">{meta.name}</h3>
                          {isCurrentActive && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Active Engine
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{meta.badge} • {meta.docsHelp}</p>
                      </div>

                      {!isCurrentActive && (
                        <button
                          onClick={() => handleSaveConfig(providerKey, true)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-standard"
                        >
                          Make Active
                        </button>
                      )}
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3 text-xs">
                      {/* API Key */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-slate-300 font-medium">API Key / Secret Token</label>
                          {savedConfig.has_key && (
                            <span className="text-[10px] font-mono text-emerald-400">
                              Configured: {savedConfig.masked_key}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type={showKey ? 'text' : 'password'}
                            placeholder={savedConfig.has_key ? 'Enter new key to replace existing' : meta.placeholder}
                            value={form.api_key || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditForms(prev => ({
                                ...prev,
                                [providerKey]: { ...prev[providerKey], api_key: val }
                              }));
                            }}
                            className="w-full px-3 py-2 pr-10 rounded-lg bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKeyMap(prev => ({ ...prev, [providerKey]: !prev[providerKey] }))}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                          >
                            {showKey ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Model & Suggestions */}
                      <div className="space-y-1">
                        <label className="text-slate-300 font-medium">Target Model</label>
                        <input
                          type="text"
                          value={form.model || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditForms(prev => ({
                              ...prev,
                              [providerKey]: { ...prev[providerKey], model: val }
                            }));
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono text-xs"
                        />
                        <div className="flex flex-wrap gap-1 pt-1">
                          {meta.modelSuggestions.map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setEditForms(prev => ({
                                  ...prev,
                                  [providerKey]: { ...prev[providerKey], model: m }
                                }));
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-standard ${
                                form.model === m
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Base URL (Collapsible/Editable) */}
                      <div className="space-y-1">
                        <label className="text-slate-400 text-[11px]">API Base URL Endpoint</label>
                        <input
                          type="text"
                          value={form.base_url || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditForms(prev => ({
                              ...prev,
                              [providerKey]: { ...prev[providerKey], base_url: val }
                            }));
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300 focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    {/* Test Results Display */}
                    {testResult && (
                      <div className={`p-3 rounded-lg border text-xs ${
                        testResult.success
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}>
                        <div className="flex items-center gap-1.5 font-medium">
                          {testResult.success ? <CheckCircleIcon className="w-4 h-4 text-emerald-400" /> : <ExclamationTriangleIcon className="w-4 h-4 text-rose-400" />}
                          <span>{testResult.message || testResult.error}</span>
                        </div>
                        {testResult.response_sample && (
                          <pre className="mt-1 text-[10px] text-slate-400 font-mono overflow-x-auto bg-slate-950/40 p-1.5 rounded">
                            {testResult.response_sample}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => handleTestConnection(providerKey)}
                        disabled={isTesting}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-medium text-xs flex items-center gap-1.5 transition-standard disabled:opacity-50"
                      >
                        {isTesting ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> : <SparklesIcon className="w-3.5 h-3.5 text-cyan-400" />}
                        <span>Test Key</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveConfig(providerKey, false)}
                        className="px-4 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-accent text-slate-900 font-semibold text-xs transition-standard hover-subtle"
                      >
                        Save Configuration
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: REGISTERED USERS & FUTURE GOOGLE MIGRATION DIRECTORY    */}
        {/* ============================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            {/* Action Bar */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by username, email, or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              {/* Bulk Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyEmails}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-standard"
                  title="Copy all comma-separated emails"
                >
                  <ClipboardDocumentCheckIcon className="w-4 h-4" />
                  <span>Copy All Emails ({usersData.total_emails_collected})</span>
                </button>

                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-standard"
                  title="Export user directory as CSV"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Quick Preview Box of Comma-Separated Emails */}
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Quick Copy-Paste for Google OAuth Whitelist</span>
                <span className="text-[11px] font-mono text-cyan-400">{usersData.total_emails_collected} addresses</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 break-all select-all">
                {usersData.comma_separated_emails || 'No emails registered yet.'}
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/70 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Email (Future Google Sync)</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Security</th>
                    <th className="py-3 px-4 font-semibold">Registered On</th>
                    <th className="py-3 px-4 font-semibold text-right">Saved Projects</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-standard">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-[11px] font-mono text-cyan-400">@{u.username}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-200">
                          {u.email}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            u.role === 'admin'
                              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.has_password ? (
                            <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                              <span>Strong Hash</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Google OAuth</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-cyan-300">
                          {u.saved_projects_count}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        {searchQuery ? 'No matching users found.' : 'No registered users yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
