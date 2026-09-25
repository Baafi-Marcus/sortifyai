import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  XMarkIcon, 
  FolderIcon, 
  TrashIcon, 
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const SavedProjectsModal = ({ isOpen, onClose, token, onLoadProject }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (!isOpen || !token) return;
    fetchProjects();
  }, [isOpen, token]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${apiUrl}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data?.projects || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Could not load saved projects.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = async (projectId) => {
    try {
      const res = await axios.get(`${apiUrl}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        onLoadProject(res.data);
        onClose();
      }
    } catch (err) {
      alert('Failed to load project details.');
    }
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project permanently from your cloud database?')) return;
    try {
      await axios.delete(`${apiUrl}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      alert('Failed to delete project.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-md bg-slate-900 border border-slate-700 p-6 sm:p-8 space-y-6 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary">
              <FolderIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Cloud Projects</h3>
              <p className="text-xs text-slate-400">Stored in your Neon PostgreSQL database</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close saved projects dialog"
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-standard"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* Content-matched skeleton screens (Async Action Standard) */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-4 rounded-md border border-slate-800 bg-slate-800/40 flex items-center justify-between">
                  <div className="space-y-2 flex-1 max-w-md">
                    <div className="h-4 skeleton-block w-48" />
                    <div className="h-3 skeleton-block w-32" />
                  </div>
                  <div className="h-8 skeleton-block w-16" />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FolderIcon className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm text-slate-300 font-medium">No saved projects found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate student groups in the Results Studio and select "Save to Cloud" to persist cohorts.
              </p>
            </div>
          )}

          {!loading && projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => handleOpenProject(proj.id)}
              className="p-4 rounded-md bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 cursor-pointer transition-standard hover-subtle flex items-center justify-between group"
            >
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-standard">
                  {proj.title}
                </h4>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <UserGroupIcon className="w-3.5 h-3.5 text-cyan-400" />
                    {proj.total_students} students ({proj.groups_count} groups)
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                    {new Date(proj.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDeleteProject(proj.id, e)}
                  aria-label={`Delete project ${proj.title}`}
                  className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-standard"
                  title="Delete Project"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
                <div className="px-2.5 py-1 rounded bg-cyan-500/10 group-hover:bg-brand-primary text-brand-primary group-hover:text-slate-900 text-xs font-semibold flex items-center gap-1 transition-standard">
                  <span>Open</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SavedProjectsModal;
