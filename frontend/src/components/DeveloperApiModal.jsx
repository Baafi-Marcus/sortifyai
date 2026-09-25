import React, { useState } from 'react';
import { 
  CodeBracketIcon, 
  XMarkIcon, 
  CommandLineIcon, 
  DocumentDuplicateIcon, 
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

const DeveloperApiModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('curl'); // 'curl' | 'python' | 'js'
  const [copied, setCopied] = useState(false);

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
    # Pass either file_id or raw records array
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

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl bg-brand-dark border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
              <CpuChipIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">SortifyAI Engine API</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v2.0 REST
                </span>
              </div>
              <p className="text-xs text-slate-400">Integrate intelligent allocation & grouping into your app or school system</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Architecture Highlight */}
        <div className="p-4 rounded-2xl bg-brand-secondary/20 border border-white/10 space-y-2 text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-wider">Platform Architecture</span>
          <p className="text-slate-300 leading-relaxed">
            SortifyAI operates as a standalone allocation and optimization engine. Third-party applications, SIS platforms, and custom software send tabular datasets and natural-language instructions to receive mathematically balanced cohorts.
          </p>
        </div>

        {/* Code Snippet Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[
                { id: 'curl', label: 'cURL' },
                { id: 'python', label: 'Python' },
                { id: 'js', label: 'Node / TypeScript' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === tab.id 
                      ? "bg-brand-primary text-brand-dark" 
                      : "bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors"
            >
              {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <DocumentDuplicateIcon className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Code"}</span>
            </button>
          </div>

          <div className="rounded-2xl bg-black/60 border border-white/10 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
            <pre>{codeSnippets[activeTab]}</pre>
          </div>
        </div>

        {/* Interactive Docs & Ecosystem Links */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Planned Integrations:</span>
            <span className="text-white font-medium">Chrome Extension • Google Sheets • ChatGPT Plugin • SIS</span>
          </div>

          <a
            href="https://sortifyai-backend.onrender.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-brand-primary text-brand-dark rounded-xl font-bold flex items-center gap-1.5 hover:bg-brand-accent transition-all shrink-0"
          >
            <span>Interactive Swagger API Docs</span>
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default DeveloperApiModal;
