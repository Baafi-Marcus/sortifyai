import React from 'react';
import { 
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

  const handlePrint = () => {
    onClose();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-md bg-slate-900 border border-slate-700 p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-white">Export Cohort Rosters</h3>
            <p className="text-xs text-slate-400">Select target format for spreadsheet or printed distribution</p>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close export dialog"
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-standard"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {/* Format 1: All Groups in One CSV */}
          <button
            onClick={downloadCombinedCSV}
            className="w-full p-4 rounded-md bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-standard hover-subtle text-left flex items-start gap-3.5 group"
          >
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary shrink-0">
              <TableCellsIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-standard">
                Unified Workbook (Single CSV / Excel)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                Combines all students into a master sheet with an added "Group Name" column.
              </p>
            </div>
          </button>

          {/* Format 2: Separate CSVs */}
          <button
            onClick={downloadSeparateCSVs}
            className="w-full p-4 rounded-md bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-standard hover-subtle text-left flex items-start gap-3.5 group"
          >
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary shrink-0">
              <DocumentTextIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-standard">
                Separate File per Cohort
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                Generates an individual CSV file for each group for independent distribution.
              </p>
            </div>
          </button>

          {/* Format 3: Printable Group Lists */}
          <button
            onClick={handlePrint}
            className="w-full p-4 rounded-md bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-standard hover-subtle text-left flex items-start gap-3.5 group"
          >
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary shrink-0">
              <PrinterIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-standard">
                Print-Ready Rosters (PDF / Physical Notice)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                Structured black-and-white table layout formatted for classroom notice boards.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
