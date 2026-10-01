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
  MagnifyingGlassIcon,
  XMarkIcon
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
  const [keyForm, setKeyForm] = useState({
    id: null,
    provider: 'openai',
    key_name: '',
    api_key: '',
    model: 'gpt-4o-mini',
    base_url: 'https://api.openai.com/v1',
    is_active: false
  });
  const [showKey, setShowKey] = useState(false);

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
  const handleTestConnection = async (config) => {
    const keyToTest = config.api_key;
    const provider = config.provider;

    if (!keyToTest && !config.has_key) {
      alert(`Please enter an API Key for ${provider.toUpperCase()} before testing.`);
      return;
    }

    setTestingProvider(config.id || 'new');
    setTestResults(prev => ({ ...prev, [config.id || 'new']: null }));

    try {
      const res = await axios.post(`${apiUrl}/admin/ai-configs/test?admin_key=${encodeURIComponent(adminKey)}`, {
        provider,
        api_key: keyToTest || 'dummy', // Backend will use stored key if masked? Actually backend test_ai_provider requires full key. We'll pass it if available.
        model: config.model || PROVIDER_METADATA[provider]?.defaultModel,
        base_url: config.base_url || PROVIDER_METADATA[provider]?.defaultBaseUrl
      });
      setTestResults(prev => ({ ...prev, [config.id || 'new']: res.data }));
      fetchAdminData(); // Refresh to update is_working state if we add it later
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [config.id || 'new']: { success: false, error: err.response?.data?.detail || err.message }
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleDeleteConfig = async (id) => {
    if (!window.confirm("Are you sure you want to delete this key?")) return;
    try {
      await axios.delete(`${apiUrl}/admin/ai-configs/${id}?admin_key=${encodeURIComponent(adminKey)}`);
      showToast('Key deleted successfully.');
      fetchAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete key.');
    }
  };

  const handleSaveKeyForm = async () => {
    try {
      const payload = { ...keyForm };
      const res = await axios.post(`${apiUrl}/admin/ai-configs?admin_key=${encodeURIComponent(adminKey)}`, payload);
      showToast(res.data?.message || `Configuration saved.`);
      setKeyForm({
        id: null,
        provider: 'openai',
        key_name: '',
        api_key: '',
        model: 'gpt-4o-mini',
        base_url: 'https://api.openai.com/v1',
        is_active: false
      });
      fetchAdminData();
    } catch (err) {
      console.error('Failed to save config:', err);
      showToast(err.response?.data?.detail || 'Failed to save configuration.');
    }
  };

  const handleEditConfig = (cfg) => {
    setKeyForm({
      id: cfg.id,
      provider: cfg.provider,
      key_name: cfg.key_name || '',
      api_key: '', // require re-entry or leave blank to keep
      model: cfg.model,
      base_url: cfg.base_url,
      is_active: cfg.is_active
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        {/* TAB 1: AI MODEL PROVIDERS (Key Rotation & Management) */}
        {/* ============================================================== */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <h4 className="font-semibold text-white">AI Provider & Key Rotation</h4>
                <p className="text-slate-400 text-[11px]">
                  Add multiple keys for the same provider to enable automatic rotation. Only keys belonging to the Active Provider will be used.
                </p>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-5 rounded-xl border border-slate-700 bg-slate-900/90 shadow-lg space-y-4">
              <h3 className="font-semibold text-white text-sm">
                {keyForm.id ? "Edit API Key" : "Add New API Key"}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Provider Select */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Provider</label>
                  <select
                    value={keyForm.provider}
                    onChange={(e) => {
                      const p = e.target.value;
                      const meta = PROVIDER_METADATA[p];
                      setKeyForm(prev => ({
                        ...prev,
                        provider: p,
                        model: meta.defaultModel,
                        base_url: meta.defaultBaseUrl
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  >
                    {Object.keys(PROVIDER_METADATA).map(p => (
                      <option key={p} value={p}>{PROVIDER_METADATA[p].name}</option>
                    ))}
                  </select>
                </div>

                {/* Key Name */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Key Alias / Name</label>
                  <input
                    type="text"
                    placeholder="e.g. OpenAI Prod Key 1"
                    value={keyForm.key_name}
                    onChange={(e) => setKeyForm(prev => ({ ...prev, key_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* API Key */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-slate-300 font-medium">API Key</label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      placeholder={keyForm.id ? 'Enter new key to replace existing (or leave blank to keep)' : PROVIDER_METADATA[keyForm.provider]?.placeholder}
                      value={keyForm.api_key}
                      onChange={(e) => setKeyForm(prev => ({ ...prev, api_key: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showKey ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Model */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Model</label>
                  <input
                    type="text"
                    value={keyForm.model}
                    onChange={(e) => setKeyForm(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {PROVIDER_METADATA[keyForm.provider]?.modelSuggestions.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setKeyForm(prev => ({ ...prev, model: m }))}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                      >
                        {m}
                    </button>
                    ))}
                  </div>
                </div>

                {/* Base URL */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Base URL</label>
                  <input
                    type="text"
                    value={keyForm.base_url}
                    onChange={(e) => setKeyForm(prev => ({ ...prev, base_url: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keyForm.is_active}
                    onChange={(e) => setKeyForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="form-checkbox bg-slate-800 border-slate-700 text-cyan-500 rounded"
                  />
                  <span className="text-slate-300 font-medium">Enable this Key (Make Active)</span>
                </label>
                
                <div className="flex gap-2">
                  {keyForm.id && (
                    <button
                      onClick={() => setKeyForm({
                        id: null, provider: 'openai', key_name: '', api_key: '', model: 'gpt-4o-mini', base_url: 'https://api.openai.com/v1', is_active: false
                      })}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-standard"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    onClick={handleSaveKeyForm}
                    className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-accent text-slate-900 font-semibold transition-standard shadow-lg shadow-brand-primary/20"
                  >
                    {keyForm.id ? "Update Key" : "Add Key"}
                  </button>
                </div>
              </div>
            </div>

            {/* List of Configured Keys */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Provider / Name</th>
                    <th className="py-3 px-4 font-semibold">API Key</th>
                    <th className="py-3 px-4 font-semibold">Model</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {configs.length > 0 ? (
                    configs.map((c) => {
                      const testResult = testResults[c.id];
                      return (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition-standard">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            {PROVIDER_METADATA[c.provider]?.name || c.provider}
                            {c.is_active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
                          </div>
                          <div className="text-[11px] text-slate-400">{c.key_name}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {c.has_key ? c.masked_key : <span className="text-rose-400">No Key</span>}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {c.model}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            {c.is_active ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 self-start">
                                Active Rotation
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 self-start">
                                Inactive
                              </span>
                            )}
                            {testResult && (
                              <span className={`text-[10px] flex items-center gap-1 ${testResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {testResult.success ? <CheckCircleIcon className="w-3 h-3" /> : <ExclamationTriangleIcon className="w-3 h-3" />}
                                {testResult.success ? 'Working' : 'Error'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleTestConnection(c)}
                              disabled={testingProvider === c.id}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-standard"
                              title="Test Connection"
                            >
                              {testingProvider === c.id ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> : <SparklesIcon className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleEditConfig(c)}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-standard"
                              title="Edit Key"
                            >
                              Edit
                            </button>
                            {!c.is_active && (
                              <button
                                onClick={async () => {
                                  try {
                                    await axios.post(`${apiUrl}/admin/ai-configs?admin_key=${encodeURIComponent(adminKey)}`, {
                                      id: c.id,
                                      provider: c.provider,
                                      api_key: "••", // Leave untouched
                                      is_active: true
                                    });
                                    fetchAdminData();
                                  } catch(e) {}
                                }}
                                className="p-1.5 rounded bg-slate-800 hover:bg-emerald-900/30 text-emerald-400 transition-standard"
                                title="Make Active"
                              >
                                Activate
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteConfig(c.id)}
                              className="p-1.5 rounded bg-slate-800 hover:bg-rose-900/30 text-rose-400 transition-standard"
                              title="Delete Key"
                            >
                              <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No AI keys configured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
