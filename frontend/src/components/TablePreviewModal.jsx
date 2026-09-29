import React from 'react';
import { XMarkIcon, TableCellsIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const TablePreviewModal = ({ isOpen, onClose, fileData }) => {
  if (!isOpen || !fileData) return null;

  const previewRows = fileData.preview || [];
  const columns = fileData.columns || (previewRows[0] ? Object.keys(previewRows[0]) : []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <TableCellsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {fileData.filename || 'Spreadsheet Preview'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {fileData.total_rows || 0} total records • {columns.length} columns detected
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-standard"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-hide">
          {/* Data Cleanliness Highlights */}
          {fileData.issues && fileData.issues.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                <span>Health & Validation</span>
              </div>
              <div className="space-y-1 pl-5 text-xs text-slate-300">
                {fileData.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="text-cyan-400 text-xs">•</span>
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table Preview */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-400">
              First {previewRows.length} Rows Sample
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
              {previewRows.length > 0 ? (
                <table className="min-w-full divide-y divide-slate-800 text-xs">
                  <thead className="bg-slate-900 text-slate-300">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-mono text-[10px] text-slate-500 uppercase">#</th>
                      {columns.map((col, idx) => (
                        <th key={idx} className="px-3 py-2.5 text-left font-semibold text-cyan-300">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {previewRows.map((row, rIdx) => (
                      <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-slate-900/30' : 'bg-transparent'}>
                        <td className="px-3 py-2 font-mono text-[10px] text-slate-500">{rIdx + 1}</td>
                        {columns.map((col, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 whitespace-nowrap">
                            {row[col] !== undefined && row[col] !== null ? String(row[col]) : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  No preview rows available for this file.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-standard"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablePreviewModal;
