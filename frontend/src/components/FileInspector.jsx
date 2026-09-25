import React, { useState } from 'react';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  TableCellsIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
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
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Upload Zone */}
      {!fileData && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold text-white">Step 1: Upload Roster</h2>
            <p className="text-slate-400 text-xs">
              Upload class registers, score sheets, or cohort rosters in Excel, CSV, or PDF format.
            </p>
          </div>

          <div
            className={`relative cursor-pointer transition-standard rounded-md border-2 border-dashed p-8 sm:p-12 text-center ${
              dragActive 
                ? "border-brand-primary bg-cyan-500/10" 
                : "border-slate-700 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900"
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
              <div className="w-12 h-12 rounded bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-brand-primary">
                {uploading ? (
                  <CloudArrowUpIcon className="w-6 h-6 text-brand-primary" />
                ) : (
                  <DocumentTextIcon className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  {uploading ? (
                    serverStatus === 'warming' ? (
                      <span className="text-amber-300">Waking backend server (~30s)...</span>
                    ) : (
                      "Reading and analyzing student records..."
                    )
                  ) : dragActive ? (
                    "Drop roster file here"
                  ) : (
                    "Drag and drop file here, or click to browse"
                  )}
                </p>
                <p className="text-xs text-slate-400">Supported formats: .xlsx, .xls, .csv, .pdf</p>
              </div>

              {uploading && (
                <div className="max-w-xs mx-auto mt-4">
                  <div className="w-full bg-slate-800 rounded h-1.5 overflow-hidden">
                    <div className="bg-brand-primary h-1.5 rounded transition-all duration-150" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-cyan-400 mt-1.5 font-mono">{progress}%</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-1.5 justify-center items-center">
                {['.xlsx', '.xls', '.csv', '.pdf'].map(ext => (
                  <span key={ext} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300">
                    {ext}
                  </span>
                ))}
              </div>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Sample Button */}
          <div className="p-4 rounded-md bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary shrink-0">
                <TableCellsIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Load Benchmark Sample Roster</p>
                <p className="text-xs text-slate-400">Test immediately with 120 verified Ghanaian student cohort records.</p>
              </div>
            </div>
            <button
              onClick={onLoadSample}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-standard border border-slate-700 shrink-0"
            >
              Load Sample Roster
            </button>
          </div>
        </div>
      )}

      {/* File Detected Card & Data Preview */}
      {fileData && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-5 rounded-md bg-slate-900 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary shrink-0">
                <TableCellsIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{fileData.filename || "Students_2026.xlsx"}</h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    File Loaded
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  <strong className="text-white font-medium">{fileData.total_rows || (fileData.preview?.length || 0)} records</strong> · <span className="text-cyan-400">{fileData.columns?.length || 0} columns</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={onReset}
                aria-label="Remove uploaded file"
                className="p-2 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-standard border border-slate-700"
                title="Remove and upload different file"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
              <button
                onClick={onProceed}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-accent text-slate-900 rounded font-semibold text-xs transition-standard hover-subtle flex items-center gap-1.5"
              >
                <span>Continue to Grouping Goals</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Health & Issue Scanner */}
          {fileData.issues && fileData.issues.length > 0 && (
            <div className="p-4 rounded-md bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                <span>Dataset Schema Scan</span>
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

          {/* Data Preview Table */}
          <div className="p-5 rounded-md bg-slate-900 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Student Roster Preview</h4>
                <p className="text-xs text-slate-400">Verifying columns and parsed data types prior to grouping.</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Showing first {Math.min(fileData.preview?.length || 0, 8)} records
              </span>
            </div>

            {fileData.preview && fileData.preview.length > 0 ? (
              <div className="overflow-x-auto rounded border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-sans">
                  <thead className="bg-slate-800/80 text-slate-300 font-semibold uppercase tracking-wider">
                    <tr>
                      {fileData.columns?.map((col, idx) => (
                        <th key={idx} className="px-3.5 py-2.5 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950 text-slate-300">
                    {fileData.preview.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-900 transition-standard">
                        {fileData.columns?.map((col, cIdx) => (
                          <td key={cIdx} className="px-3.5 py-2 whitespace-nowrap text-slate-200">
                            {row[col] !== undefined && row[col] !== null ? String(row[col]) : "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
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
