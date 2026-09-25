import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  XMarkIcon, 
  DocumentDuplicateIcon, 
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  CpuChipIcon,
  UserGroupIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const DeveloperApiModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('curl'); // 'curl' | 'python' | 'js' | 'testers'
  const [copied, setCopied] = useState(false);
  const [testersData, setTestersData] = useState({ count: 0, comma_separated_emails: '', testers: [] });
  const [loadingTesters, setLoadingTesters] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (isOpen && activeTab === 'testers') {
      fetchTesters();
    }
  }, [isOpen, activeTab]);

  const fetchTesters = async () => {
    setLoadingTesters(true);
    try {
      const res = await axios.get(`${apiUrl}/auth/testers`);
      setTestersData(res.data || { count: 0, comma_separated_emails: '', testers: [] });
    } catch (err) {
      console.warn('Failed to load testers:', err);
    } finally {
      setLoadingTesters(false);
    }
  };

  if (!isOpen) return null;

  const codeSnippets = {
    curl: `# Direct Allocation via SortifyAI Core V2 Engine
curl -X POST https://sortifyai-backend.onrender.com/v2/optimize \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_live_your_key_here" \\
  -d '{
    "data": [
      {"name": "Ama Mensah", "gender": "Female", "score": 85},
      {"name": "Kofi Owusu", "gender": "Male", "score": 72},
      {"name": "Kwame Asante", "gender": "Male", "score": 64},
      {"name": "Akosua Serwaa", "gender": "Female", "score": 91}
    ],
    "num_groups": 2,
    "instructions": "Divide into 2 equal groups balanced by gender and score",
    "constraints": {
      "min_size": 2,
      "max_size": 2
    }
  }'

# Response contains: GROUPS + STATISTICS + VALIDATION + EXPLANATION`,

    python: `import requests

API_URL = "https://sortifyai-backend.onrender.com"

# Direct JSON allocation via SortifyAI Core Engine V2
payload = {
    "num_groups": 10,
    "instructions": "Balance cohorts by academic score and gender parity",
    "constraints": {
        "keep_together": [["Ama Mensah", "Kofi Owusu"]],
        "separate": [["Kwame Asante", "Yaw Boateng"]]
    },
    "file_id": "3f9e2b10..." 
}

response = requests.post(f"{API_URL}/v2/optimize", json=payload).json()

# Access balanced groups, balance score, and validation
print("Balance Score:", response["statistics"]["balance_score"])
print("Constraint Validation:", response["validation"]["is_valid"])

for group in response["groups"]:
    print(f"{group['name']} ({group['size']} students) - Avg Score: {group['analytics']['avg_score']}")`,

    js: `// SortifyAI TypeScript / Node.js Engine Client
const API_URL = "https://sortifyai-backend.onrender.com";

// Call the SortifyAI Allocation & Optimization Engine
const response = await fetch(\`\${API_URL}/v2/optimize\`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "sk_live_your_key_here"
  },
  body: JSON.stringify({
    data: studentRecords, // Array of structured objects
    num_groups: 10,
    instructions: "Divide into 10 groups, balanced by gender and score",
    constraints: {
      min_size: 48,
      max_size: 52
    }
  })
});

const { groups, statistics, validation, explanation } = await response.json();
console.log(\`Overall Balance Score: \${statistics.balance_score}%\`);`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEmails = () => {
    if (!testersData.comma_separated_emails) return;
    navigator.clipboard.writeText(testersData.comma_separated_emails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-md bg-slate-900 border border-slate-700 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary">
              <CpuChipIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">SortifyAI Engine & Admin Console</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  v2.0 REST
                </span>
              </div>
              <p className="text-xs text-slate-400">Manage integrations, API keys, and Google OAuth tester whitelist queue</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close API documentation modal"
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-standard"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: 'curl', label: 'cURL' },
                { id: 'python', label: 'Python' },
                { id: 'js', label: 'Node / TypeScript' },
                { id: 'testers', label: `Tester Whitelist Queue (${testersData.count || 0})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-standard ${
                    activeTab === tab.id 
                      ? "bg-brand-primary text-slate-900" 
                      : "bg-slate-800 text-slate-300 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab !== 'testers' && (
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-standard"
              >
                {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <DocumentDuplicateIcon className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy Code"}</span>
              </button>
            )}
          </div>

          {/* Code Snippets View */}
          {activeTab !== 'testers' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded bg-slate-800/40 border border-slate-800 space-y-1 text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Platform Architecture</span>
                <p className="text-slate-300 leading-normal">
                  External platforms transmit tabular rosters and natural instructions to receive mathematically balanced cohorts, variance statistics, and constraint validation reports.
                </p>
              </div>

              <div className="rounded bg-black/60 border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
                <pre>{codeSnippets[activeTab]}</pre>
              </div>
            </div>
          )}

          {/* Tester Whitelist Queue View */}
          {activeTab === 'testers' && (
            <div className="space-y-4">
              <div className="p-4 rounded bg-slate-800/40 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Google OAuth Test Users Queue</h4>
                    <p className="text-xs text-slate-400">
                      Copy these emails and paste them into the Google Cloud Console "Add Users" dialog.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={fetchTesters}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-standard border border-slate-700"
                      title="Refresh tester list"
                    >
                      <ArrowPathIcon className={`w-4 h-4 ${loadingTesters ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={handleCopyEmails}
                      disabled={!testersData.comma_separated_emails}
                      className="px-3 py-1.5 bg-brand-primary hover:bg-brand-accent text-slate-900 rounded font-semibold text-xs transition-standard hover-subtle flex items-center gap-1.5 disabled:opacity-40"
                    >
                      {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <DocumentDuplicateIcon className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied to Clipboard!" : "Copy All for Google Console"}</span>
                    </button>
                  </div>
                </div>

                {testersData.comma_separated_emails && (
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-400 select-all break-all">
                    {testersData.comma_separated_emails}
                  </div>
                )}
              </div>

              {/* Table of requested testers */}
              <div className="overflow-x-auto rounded border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
                  <thead className="bg-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-3.5 py-2">Email</th>
                      <th className="px-3.5 py-2">Name</th>
                      <th className="px-3.5 py-2">Organization</th>
                      <th className="px-3.5 py-2">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950 text-slate-300">
                    {testersData.testers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3.5 py-6 text-center text-slate-500">
                          No tester requests submitted yet. Visitors can submit their Gmail in the Sign-In dialog.
                        </td>
                      </tr>
                    ) : (
                      testersData.testers.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-900 transition-standard">
                          <td className="px-3.5 py-2 font-mono text-cyan-300">{t.email}</td>
                          <td className="px-3.5 py-2 text-white">{t.name || "-"}</td>
                          <td className="px-3.5 py-2 text-slate-400">{t.organization || "-"}</td>
                          <td className="px-3.5 py-2 font-mono text-[11px] text-slate-500">
                            {t.created_at ? new Date(t.created_at).toLocaleDateString() : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs">
                <span className="text-slate-400">Quick link to Google Cloud Console:</span>
                <a
                  href="https://console.cloud.google.com/apis/credentials/consent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Open OAuth Consent Screen (Add Users)</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Target Integrations:</span>
            <span className="text-slate-300 font-medium">Google Sheets • SIS Importer • Custom Webhooks</span>
          </div>

          <a
            href="https://sortifyai-backend.onrender.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-brand-primary hover:bg-brand-accent text-slate-900 rounded font-semibold flex items-center gap-1.5 transition-standard hover-subtle shrink-0"
          >
            <span>Interactive OpenAPI Documentation</span>
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default DeveloperApiModal;
