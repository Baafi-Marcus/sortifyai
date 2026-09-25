import React from 'react';
import { 
  ArrowDownTrayIcon, 
  PrinterIcon, 
  DocumentTextIcon, 
  XMarkIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

const ExportModal = ({ isOpen, onClose, groups = [], filename = "SortifyAI_Groups" }) => {
  if (!isOpen) return null;

  // Export all groups combined into 1 CSV with "Group Name" column
  const downloadCombinedCSV = () => {
    if (!groups || groups.length === 0) return;

    // Collect all unique headers across groups
    const sampleItem = groups.find(g => g.items && g.items.length > 0)?.items[0];
    if (!sampleItem) return;

    const baseHeaders = Object.keys(sampleItem);
    const headers = ["Group Name", ...baseHeaders];

    let csvContent = headers.join(',') + '\n';

    groups.forEach(group => {
      (group.items || []).forEach(item => {
        const row = [
          `"${group.name.replace(/"/g, '""')}"`,
          ...baseHeaders.map(h => {
            const val = item[h];
            return typeof val === 'string' && (val.includes(',') || val.includes('"'))
              ? `"${val.replace(/"/g, '""')}"`
              : (val !== undefined && val !== null ? val : "");
          })
        ];
        csvContent += row.join(',') + '\n';
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_All_Groups_Combined.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  // Download individual CSV per group
  const downloadSeparateCSVs = () => {
    groups.forEach((group, idx) => {
      const items = group.items || [];
      if (items.length === 0) return;

      const headers = Object.keys(items[0]);
      let csvContent = headers.join(',') + '\n';

      items.forEach(item => {
        const row = headers.map(h => {
          const val = item[h];
          return typeof val === 'string' && (val.includes(',') || val.includes('"'))
            ? `"${val.replace(/"/g, '""')}"`
            : (val !== undefined && val !== null ? val : "");
        });
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${group.name.replace(/\s+/g, '_')}.csv`;
      document.body.appendChild(link);
      setTimeout(() => {
        link.click();
        document.body.removeChild(link);
      }, idx * 200);
    });
    onClose();
  };

  // Printable layout trigger
  const handlePrint = () => {
    onClose();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-brand-dark border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white">Export & Download Groups</h3>
            <p className="text-xs text-slate-400">Choose the format that works best for your school workflow</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Format 1: All Groups in One CSV */}
          <button
            onClick={downloadCombinedCSV}
            className="w-full p-4 rounded-2xl bg-brand-secondary/20 border border-white/10 hover:border-brand-primary/40 hover:bg-brand-secondary/30 transition-all text-left flex items-start gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0 group-hover:scale-105 transition-transform">
              <TableCellsIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                All Groups in One Sheet (CSV / Excel)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Recommended: Combines all students into a single master sheet with an added "Group Name" column.
              </p>
            </div>
          </button>

          {/* Format 2: Separate CSVs */}
          <button
            onClick={downloadSeparateCSVs}
            className="w-full p-4 rounded-2xl bg-brand-secondary/20 border border-white/10 hover:border-brand-primary/40 hover:bg-brand-secondary/30 transition-all text-left flex items-start gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
              <DocumentTextIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                Separate File per Group
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Downloads an individual CSV roster for each group (e.g. Group_1.csv, Group_2.csv).
              </p>
            </div>
          </button>

          {/* Format 3: Printable Group Lists (Point 11) */}
          <button
            onClick={handlePrint}
            className="w-full p-4 rounded-2xl bg-brand-secondary/20 border border-white/10 hover:border-brand-primary/40 hover:bg-brand-secondary/30 transition-all text-left flex items-start gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <PrinterIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Printable Rosters (Notice Board / PDF)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Formatted clean paper view ready to print or save as PDF for classroom display.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
