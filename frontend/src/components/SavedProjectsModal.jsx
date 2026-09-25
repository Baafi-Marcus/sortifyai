import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  XMarkIcon, 
  FolderIcon, 
  TrashIcon, 
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
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
      setError('Could not load your saved projects.');
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
    if (!window.confirm('Are you sure you want to delete this project?')) return;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-brand-dark border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
              <FolderIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">My Cloud Projects</h3>
              <p className="text-xs text-slate-400">Stored in your secure Neon PostgreSQL database</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading && (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <ArrowPathIcon className="w-8 h-8 animate-spin text-brand-primary" />
              <p className="text-sm">Loading projects from Neon...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <FolderIcon className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm text-slate-300 font-medium">No saved projects yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate student groups in the Results Studio and click "Save to Cloud" to store your cohorts here.
              </p>
            </div>
          )}

          {!loading && projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => handleOpenProject(proj.id)}
              className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-brand-primary/40 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white group-hover:text-brand-primary transition-colors">
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
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete Project"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
                <div className="px-3 py-1.5 rounded-xl bg-brand-primary/10 group-hover:bg-brand-primary text-brand-primary group-hover:text-brand-dark text-xs font-semibold flex items-center gap-1 transition-all">
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
