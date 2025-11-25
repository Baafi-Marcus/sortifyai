import React, { useState } from 'react';
import { CloudArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const FileUpload = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

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
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    setUploading(true);
    setProgress(0);

    try {
      // Upload all files
      const uploadPromises = Array.from(files).map(file => handleFile(file));
      await Promise.all(uploadPromises);
      // alert(`Successfully uploaded ${files.length} file(s)!`); // Removed alert for smoother UX
    } catch (error) {
      alert("Error uploading files: " + error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const response = await axios.post(`${apiUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      if (response.data) {
        onUploadSuccess(response.data);
        return response.data;
      }
    } catch (error) {
      throw new Error(error.response?.data?.detail || error.message || "Upload failed");
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        className="hidden"
        id="file-upload"
        onChange={handleChange}
        accept=".csv,.xlsx,.xls,.pdf"
        multiple
      />

      <div
        className={`relative group cursor-pointer transition-all duration-300 ${dragActive ? "scale-[1.02]" : "hover:scale-[1.01]"
          }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <label htmlFor="file-upload" className="block cursor-pointer">
          <div className={`p-12 rounded-2xl border border-white/10 bg-brand-secondary/10 backdrop-blur-sm transition-all ${dragActive ? "border-brand-primary bg-brand-primary/5" : "hover:bg-brand-secondary/20 hover:border-white/20"
            }`}>
            <div className="flex flex-col items-center gap-6 text-center">
              {/* Logo */}
              <img src="/logo.png" alt="SortifyAI" className="h-20 w-auto mb-2" />

              <div className="space-y-2 mb-4">
                <h2 className="text-3xl font-bold text-white">How can I help you organize today?</h2>
              </div>

              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${dragActive ? "bg-brand-primary/20 text-brand-primary" : "bg-brand-secondary/30 text-slate-400 group-hover:text-white"
                }`}>
                {uploading ? (
                  <CloudArrowUpIcon className="w-8 h-8 animate-bounce" />
                ) : (
                  <DocumentTextIcon className="w-8 h-8" />
                )}
              </div>

              <div className="space-y-2 w-full max-w-md mx-auto">
                <p className="text-lg text-white font-medium">
                  {uploading ? "Uploading files..." : dragActive ? "Drop your files here" : "Upload your files to get started"}
                </p>

                {uploading && (
                  <div className="w-full bg-brand-secondary/30 rounded-full h-2.5 mt-4 overflow-hidden">
                    <div
                      className="bg-brand-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                    <p className="text-xs text-brand-primary mt-2 font-mono">{progress}%</p>
                  </div>
                )}

                {!uploading && (
                  <>
                    <p className="text-sm text-slate-400">
                      Drag & drop files here, or click to browse
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Supports CSV, Excel, PDF • Multiple files allowed
                    </p>
                  </>
                )}
              </div>

              {!uploading && (
                <div className="mt-4 flex gap-3">
                  <span className="px-3 py-1.5 rounded-lg bg-brand-dark/50 border border-white/5 text-xs text-slate-500 font-mono">.csv</span>
                  <span className="px-3 py-1.5 rounded-lg bg-brand-dark/50 border border-white/5 text-xs text-slate-500 font-mono">.xlsx</span>
                  <span className="px-3 py-1.5 rounded-lg bg-brand-dark/50 border border-white/5 text-xs text-slate-500 font-mono">.pdf</span>
                </div>
              )}
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};

export default FileUpload;
