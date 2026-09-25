import React, { useState } from 'react';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  TableCellsIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  SparklesIcon,
  ArrowRightIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const FileInspector = ({ 
  fileData, 
  onFileLoaded, 
  onProceed, 
  onReset,
  serverStatus,
  onLoadSample
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file) => {
    setErrorMsg(null);
    setUploading(true);
    setProgress(15);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setProgress(percent);
        }
      });

      if (response.data) {
        onFileLoaded(response.data);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMsg(err.response?.data?.detail || err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Upload Zone (shown if no file is loaded yet) */}
      {!fileData && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Step 1: Upload your student data</h2>
            <p className="text-slate-400 text-sm">
              Upload class registers, score sheets, or cohort lists in Excel, CSV, or PDF format.
            </p>
          </div>

          <div
            className={`relative group cursor-pointer transition-all duration-300 rounded-3xl border-2 border-dashed p-10 sm:p-14 text-center ${
              dragActive 
                ? "border-brand-primary bg-brand-primary/10 scale-[1.01]" 
                : "border-white/15 bg-white/[0.02] hover:border-brand-primary/50 hover:bg-white/[0.04]"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="student-file-upload"
              className="hidden"
              onChange={handleChange}
              accept=".csv,.xlsx,.xls,.pdf"
            />

            <label htmlFor="student-file-upload" className="cursor-pointer block">
              <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mx-auto mb-4 text-brand-primary group-hover:scale-110 transition-transform">
                {uploading ? (
                  <CloudArrowUpIcon className="w-8 h-8 animate-bounce" />
                ) : (
                  <DocumentTextIcon className="w-8 h-8" />
                )}
              </div>

              <div className="space-y-2">
                <p className="text-lg font-bold text-white">
                  {uploading ? (
                    serverStatus === 'warming' ? (
                      <span className="text-amber-300">⚡ Waking backend on Render... (~30s)</span>
                    ) : (
                      "Reading and analyzing student records..."
                    )
                  ) : dragActive ? (
                    "Drop your student file here"
                  ) : (
                    "Drop your file here"
                  )}
                </p>
                <p className="text-sm text-slate-400">or click to <span className="text-brand-primary underline font-semibold">Browse files</span></p>
              </div>

              {uploading && (
                <div className="max-w-xs mx-auto mt-6">
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div className="bg-brand-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-brand-primary mt-2 font-mono">{progress}%</p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2 justify-center items-center">
                {['.xlsx', '.xls', '.csv', '.pdf'].map(ext => (
                  <span key={ext} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-slate-400">
                    {ext}
                  </span>
                ))}
              </div>
            </label>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Sample Button */}
          <div className="p-5 rounded-2xl bg-brand-secondary/15 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center text-brand-primary">
                <SparklesIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Don't have a spreadsheet on hand?</p>
                <p className="text-xs text-slate-400">Test SortifyAI immediately with 120 sample Ghanaian student records.</p>
              </div>
            </div>
            <button
              onClick={onLoadSample}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              Load Sample Student Data
            </button>
          </div>
        </div>
      )}

      {/* File Detected Card & Data Preview (shown once file is loaded) */}
      {fileData && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-6 rounded-2xl bg-brand-secondary/20 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
                <TableCellsIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{fileData.filename || "Students_2026.xlsx"}</h3>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    File Loaded
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  <strong className="text-white font-semibold">{fileData.total_rows || (fileData.preview?.length || 0)} records detected</strong> · <span className="text-cyan-300 font-semibold">{fileData.columns?.length || 0} columns detected</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={onReset}
                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition-colors"
                title="Remove and upload different file"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
              <button
                onClick={onProceed}
                className="px-5 py-2.5 bg-brand-primary text-brand-dark rounded-xl font-bold text-sm hover:bg-brand-accent transition-all flex items-center gap-2 shadow-lg shadow-brand-primary/20"
              >
                <span>Continue to Grouping Goals</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Health & Issue Scanner (Point 15) */}
          {fileData.issues && fileData.issues.length > 0 && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                <span>Dataset Health Scan</span>
              </div>
              <div className="space-y-1">
                {fileData.issues.map((issue, idx) => (
                  <p key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    {issue}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Data Preview Table (Point 2) */}
          <div className="p-6 rounded-2xl bg-brand-secondary/15 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Student Data Preview</h4>
                <p className="text-xs text-slate-400">Verifying columns and detected records before grouping.</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Showing first {Math.min(fileData.preview?.length || 0, 8)} records
              </span>
            </div>

            {fileData.preview && fileData.preview.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-full divide-y divide-white/10 text-left text-xs font-sans">
                  <thead className="bg-brand-secondary/40 text-slate-300 font-semibold uppercase tracking-wider">
                    <tr>
                      {fileData.columns?.map((col, idx) => (
                        <th key={idx} className="px-4 py-3 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-brand-dark/40 text-slate-300">
                    {fileData.preview.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                        {fileData.columns?.map((col, cIdx) => (
                          <td key={cIdx} className="px-4 py-2.5 whitespace-nowrap text-slate-200">
                            {row[col] !== undefined && row[col] !== null ? String(row[col]) : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                Preview loading or file format requires full parsing.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileInspector;
