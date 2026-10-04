import React, { useState, useEffect } from 'react';
import { 
  PrinterIcon, 
  DocumentTextIcon, 
  XMarkIcon,
  TableCellsIcon,
  DocumentArrowDownIcon,
  DocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, HeadingLevel } from 'docx';

const ExportModal = ({ isOpen, onClose, groups = [], filename = "SortifyAI_Placement_Results", reportTitle }) => {
  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState({});

  useEffect(() => {
    if (isOpen && groups.length > 0) {
      const sampleItem = groups.find(g => g.items && g.items.length > 0)?.items[0] || {};
      const baseHeaders = Object.keys(sampleItem).filter(k => !k.startsWith('_') && k !== 'Assigned_Class');
      setAvailableColumns(baseHeaders);
      
      const initialSelection = {};
      baseHeaders.forEach(h => initialSelection[h] = true);
      setSelectedColumns(initialSelection);
    }
  }, [isOpen, groups]);

  const toggleColumn = (col) => {
    setSelectedColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const selectAll = () => {
    const newSel = {};
    availableColumns.forEach(h => newSel[h] = true);
    setSelectedColumns(newSel);
  };

  const deselectAll = () => {
    const newSel = {};
    availableColumns.forEach(h => newSel[h] = false);
    // Keep at least the first one selected ideally, but let's just allow empty
    setSelectedColumns(newSel);
  };

  if (!isOpen) return null;

  const getActiveHeaders = () => availableColumns.filter(col => selectedColumns[col]);

  // Helper to format long decimals
  const formatValue = (val) => {
    if (typeof val === 'number' && !Number.isInteger(val)) {
      return Number(val.toFixed(2));
    }
    if (typeof val === 'string' && !isNaN(parseFloat(val)) && val.includes('.')) {
      const num = parseFloat(val);
      // Check if it has more than 2 decimal places
      if (val.split('.')[1]?.length > 2) {
         return num.toFixed(2);
      }
    }
    return val;
  };

  // Export highly formatted multi-sheet Excel workbook
  const downloadExcelWorkbook = () => {
    if (!groups || groups.length === 0) return;
    const activeHeaders = getActiveHeaders();
    if (activeHeaders.length === 0) return;

    const wb = XLSX.utils.book_new();
    let masterData = [];
    const allItems = [];
    groups.forEach(group => {
      (group.items || []).forEach(item => {
        allItems.push({ ...item, Assigned_Class: group.name });
      });
    });
    allItems.sort((a, b) => {
      const scoreA = parseFloat(a['Overall Placement Score'] || a['Overall Score'] || 0);
      const scoreB = parseFloat(b['Overall Placement Score'] || b['Overall Score'] || 0);
      return scoreB - scoreA; 
    });
    
    // Determine column widths for Excel
    const colWidths = [{ wch: 8 }]; // Rank
    activeHeaders.forEach(h => {
      if (h === 'Student Name') colWidths.push({ wch: 30 });
      else if (h.includes('Score') || h.includes('Percentage') || h.includes('Mark')) colWidths.push({ wch: 15 });
      else colWidths.push({ wch: 20 });
    });
    colWidths.push({ wch: 25 }); // Assigned Class

    allItems.forEach((item, index) => {
      const row = { "Rank": index + 1 };
      activeHeaders.forEach(h => { row[h] = formatValue(item[h]); });
      row["Assigned Class"] = item.Assigned_Class;
      masterData.push(row);
    });
    const wsMaster = XLSX.utils.json_to_sheet(masterData);
    wsMaster['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, wsMaster, "Final Placement");

    const summaryData = [];
    groups.forEach(group => {
      const items = group.items || [];
      const numStudents = items.length;
      let grpMath = 0, grpEng = 0, grpOverall = 0;
      let grpHighest = 0, grpLowest = 100;
      items.forEach(item => {
        const math = parseFloat(item['Mathematics Percentage'] || item['Mathematics'] || 0);
        const eng = parseFloat(item['English Percentage'] || item['English'] || 0);
        const overall = parseFloat(item['Overall Placement Score'] || item['Overall'] || 0);
        grpMath += math;
        grpEng += eng;
        grpOverall += overall;
        if (overall > grpHighest) grpHighest = overall;
        if (overall < grpLowest) grpLowest = overall;
      });
      summaryData.push({
        "Class": group.name,
        "Students": numStudents,
        "Avg English %": numStudents ? Number((grpEng / numStudents).toFixed(2)) : 0,
        "Avg Mathematics %": numStudents ? Number((grpMath / numStudents).toFixed(2)) : 0,
        "Avg Placement Score": numStudents ? Number((grpOverall / numStudents).toFixed(2)) : 0,
        "Highest Score": numStudents ? Number(grpHighest.toFixed(2)) : 0,
        "Lowest Score": numStudents ? Number(grpLowest.toFixed(2)) : 0
      });
    });
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [
      { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Class Summary");

    groups.forEach(group => {
      const items = [...(group.items || [])];
      items.sort((a, b) => {
        const scoreA = parseFloat(a['Overall Placement Score'] || a['Overall Score'] || 0);
        const scoreB = parseFloat(b['Overall Placement Score'] || b['Overall Score'] || 0);
        return scoreB - scoreA;
      });
      const classData = [];
      if (group.description) {
         classData.push({ "Class Rank": `${group.name} - ${group.description}` });
         classData.push({});
      }
      items.forEach((item, index) => {
        const overallRank = allItems.findIndex(m => m['Student Name'] === item['Student Name']) + 1;
        const row = {
          "Class Rank": index + 1,
          "Overall Rank": overallRank || "N/A"
        };
        activeHeaders.forEach(h => { row[h] = formatValue(item[h]); });
        classData.push(row);
      });
      const safeSheetName = group.name.substring(0, 31).replace(/[\\/*?:\[\]]/g, '');
      const wsClass = XLSX.utils.json_to_sheet(classData, { skipHeader: false });
      
      const classColWidths = [{ wch: 12 }, { wch: 12 }];
      activeHeaders.forEach(h => {
        if (h === 'Student Name') classColWidths.push({ wch: 30 });
        else if (h.includes('Score') || h.includes('Percentage') || h.includes('Mark')) classColWidths.push({ wch: 15 });
        else classColWidths.push({ wch: 20 });
      });
      wsClass['!cols'] = classColWidths;

      XLSX.utils.book_append_sheet(wb, wsClass, safeSheetName);
    });
    XLSX.writeFile(wb, `${filename}.xlsx`);
    onClose();
  };

  const downloadCombinedCSV = () => {
    if (!groups || groups.length === 0) return;
    const activeHeaders = getActiveHeaders();
    if (activeHeaders.length === 0) return;

    const headers = ["Group Name", "Group Description", ...activeHeaders];
    let csvContent = "";
    if (reportTitle) {
      csvContent += `"${reportTitle.replace(/"/g, '""')}"\n\n`;
    }
    csvContent += headers.join(',') + '\n';
    groups.forEach(group => {
      (group.items || []).forEach(item => {
        const row = [
          `"${group.name.replace(/"/g, '""')}"`,
          `"${(group.description || '').replace(/"/g, '""')}"`,
          ...activeHeaders.map(h => {
            const val = formatValue(item[h]);
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

  const downloadSeparateCSVs = () => {
    const activeHeaders = getActiveHeaders();
    if (activeHeaders.length === 0) return;

    groups.forEach((group, idx) => {
      const items = group.items || [];
      if (items.length === 0) return;
      
      let csvContent = "";
      if (reportTitle) {
        csvContent += `"${reportTitle.replace(/"/g, '""')} - ${group.name}"\n`;
      }
      if (group.description) {
        csvContent += `"${group.description.replace(/"/g, '""')}"\n`;
      }
      csvContent += '\n' + activeHeaders.join(',') + '\n';
      items.forEach(item => {
        const row = activeHeaders.map(h => {
          const val = formatValue(item[h]);
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

  const downloadPDFs = () => {
    const activeHeaders = getActiveHeaders();
    if (activeHeaders.length === 0) return;

    groups.forEach((group, idx) => {
      const doc = new jsPDF();
      const items = group.items || [];
      if (items.length === 0) return;

      doc.setFontSize(16);
      doc.text(group.name, 14, 15);
      
      if (group.description) {
        doc.setFontSize(10);
        doc.text(group.description, 14, 22);
      }
      
      const rows = items.map(item => activeHeaders.map(h => formatValue(item[h]) !== undefined ? String(formatValue(item[h])) : ""));

      const columnStyles = {};
      const nameIdx = activeHeaders.findIndex(h => h === 'Student Name');
      if (nameIdx !== -1) {
        columnStyles[nameIdx] = { cellWidth: 50 }; // Give Student Name column more space
      }

      doc.autoTable({
        head: [activeHeaders],
        body: rows,
        startY: group.description ? 30 : 25,
        styles: { fontSize: 8 },
        columnStyles: columnStyles,
        headStyles: { fillColor: [41, 128, 185] },
      });

      setTimeout(() => {
        doc.save(`${group.name.replace(/\s+/g, '_')}.pdf`);
      }, idx * 500);
    });
    onClose();
  };

  const downloadDOCX = async () => {
    if (!groups || groups.length === 0) return;
    const activeHeaders = getActiveHeaders();
    if (activeHeaders.length === 0) return;
    
    const children = [];
    
    if (reportTitle) {
      children.push(new Paragraph({ text: reportTitle, heading: HeadingLevel.HEADING_1 }));
    }

    groups.forEach((group, index) => {
      const items = group.items || [];
      if (items.length === 0) return;

      children.push(new Paragraph({ text: group.name, heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }));
      if (group.description) {
        children.push(new Paragraph({ text: group.description, spacing: { after: 200 } }));
      }

      const tableRows = [
        new TableRow({
          children: activeHeaders.map(h => new TableCell({ children: [new Paragraph({ text: h, style: "Strong" })], shading: { fill: "D9D9D9" } })),
        })
      ];

      items.forEach(item => {
        tableRows.push(
          new TableRow({
            children: activeHeaders.map(h => new TableCell({ children: [new Paragraph(String(formatValue(item[h]) !== undefined ? formatValue(item[h]) : ""))] })),
          })
        );
      });

      children.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  const handlePrint = () => { onClose(); window.print(); };

  const hasSelectedColumns = getActiveHeaders().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-md bg-slate-900 border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-white">Export Cohort Results</h3>
            <p className="text-xs text-slate-400 mt-1">Select columns and choose your export format.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-standard">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Column Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <TableCellsIcon className="w-4 h-4 text-brand-primary" />
                Select Columns to Export
              </h4>
              <div className="flex items-center gap-3 text-xs">
                <button onClick={selectAll} className="text-cyan-400 hover:text-cyan-300">Select All</button>
                <span className="text-slate-600">|</span>
                <button onClick={deselectAll} className="text-slate-400 hover:text-slate-300">Clear</button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 bg-slate-800/30 p-3 rounded-md border border-slate-800/50">
              {availableColumns.map(col => {
                const isSelected = selectedColumns[col];
                return (
                  <button
                    key={col}
                    onClick={() => toggleColumn(col)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-standard ${
                      isSelected 
                        ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {isSelected && <CheckIcon className="w-3 h-3" />}
                    {col}
                  </button>
                );
              })}
              {availableColumns.length === 0 && (
                <span className="text-xs text-slate-500 py-1">No columns available</span>
              )}
            </div>
          </div>

          <div className="h-px w-full bg-slate-800/60" />

          {/* Formats Section */}
          <div className="space-y-3">
             <h4 className="text-sm font-medium text-white mb-2">Export Formats</h4>
             
             {!hasSelectedColumns && (
               <div className="p-3 mb-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                 Please select at least one column to enable exports.
               </div>
             )}

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button 
                  onClick={downloadExcelWorkbook} 
                  disabled={!hasSelectedColumns}
                  className="w-full p-3.5 rounded-md bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-standard text-left flex gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0"><DocumentArrowDownIcon className="w-4 h-4" /></div>
                  <div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-standard">Master Excel (.xlsx)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Multi-sheet workbook with summary.</p>
                  </div>
                </button>

                <button 
                  onClick={downloadDOCX} 
                  disabled={!hasSelectedColumns}
                  className="w-full p-3.5 rounded-md bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-standard text-left flex gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0"><DocumentIcon className="w-4 h-4" /></div>
                  <div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-blue-400 transition-standard">Master Word (.docx)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Single document with tables.</p>
                  </div>
                </button>

                <button 
                  onClick={downloadPDFs} 
                  disabled={!hasSelectedColumns}
                  className="w-full p-3.5 rounded-md bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-standard text-left flex gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-red-400 shrink-0"><DocumentTextIcon className="w-4 h-4" /></div>
                  <div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-red-400 transition-standard">Separate PDFs (.pdf)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Individual styled PDF per class.</p>
                  </div>
                </button>

                <button 
                  onClick={downloadSeparateCSVs} 
                  disabled={!hasSelectedColumns}
                  className="w-full p-3.5 rounded-md bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-standard text-left flex gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary shrink-0"><DocumentTextIcon className="w-4 h-4" /></div>
                  <div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-standard">Separate CSVs (.csv)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Individual CSV per class.</p>
                  </div>
                </button>

                <button 
                  onClick={downloadCombinedCSV} 
                  disabled={!hasSelectedColumns}
                  className="w-full p-3.5 rounded-md bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-standard text-left flex gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary shrink-0"><TableCellsIcon className="w-4 h-4" /></div>
                  <div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-standard">Unified CSV (.csv)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Generic dump of all data.</p>
                  </div>
                </button>

                <button 
                  onClick={handlePrint} 
                  className="w-full p-3.5 rounded-md bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-standard text-left flex gap-3 group"
                >
                  <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0"><PrinterIcon className="w-4 h-4" /></div>
                  <div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-slate-300 transition-standard">Browser Print</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Standard browser print dialog.</p>
                  </div>
                </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ExportModal;
