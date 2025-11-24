import React, { useState } from 'react';
import { CloudArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const FileUpload = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

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

    try {
      // Upload all files
      const uploadPromises = Array.from(files).map(file => handleFile(file));
      await Promise.all(uploadPromises);
      alert(`Successfully uploaded ${files.length} file(s)!`);
    } catch (error) {
      alert("Error uploading files: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        onUploadSuccess(data);
        return data;
      } else {
        throw new Error(data.detail || "Upload failed");
      }
    } catch (error) {
      throw error;
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

              <div className="space-y-2">
                <p className="text-lg text-white font-medium">
                  {uploading ? "Uploading files..." : dragActive ? "Drop your files here" : "Upload your files to get started"}
                </p>
                <p className="text-sm text-slate-400">
                  Drag & drop files here, or click to browse
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Supports CSV, Excel, PDF • Multiple files allowed
                </p>
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
