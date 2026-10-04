import React from 'react';
import { 
  PrinterIcon, 
  DocumentTextIcon, 
  XMarkIcon,
  TableCellsIcon,
  DocumentArrowDownIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, HeadingLevel } from 'docx';

const ExportModal = ({ isOpen, onClose, groups = [], filename = "SortifyAI_Placement_Results", reportTitle }) => {
  if (!isOpen) return null;

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
    const baseHeaders = allItems.length > 0 ? Object.keys(allItems[0]).filter(k => !k.startsWith('_') && k !== 'Assigned_Class') : [];
    
    // Determine column widths for Excel
    const colWidths = [{ wch: 8 }]; // Rank
    baseHeaders.forEach(h => {
      if (h === 'Student Name') colWidths.push({ wch: 30 });
      else if (h.includes('Score') || h.includes('Percentage') || h.includes('Mark')) colWidths.push({ wch: 15 });
      else colWidths.push({ wch: 20 });
    });
    colWidths.push({ wch: 25 }); // Assigned Class

    allItems.forEach((item, index) => {
      const row = { "Rank": index + 1 };
      baseHeaders.forEach(h => { row[h] = formatValue(item[h]); });
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
        baseHeaders.forEach(h => { row[h] = formatValue(item[h]); });
        classData.push(row);
      });
      const safeSheetName = group.name.substring(0, 31).replace(/[\\/*?:\[\]]/g, '');
      const wsClass = XLSX.utils.json_to_sheet(classData, { skipHeader: false });
      
      const classColWidths = [{ wch: 12 }, { wch: 12 }];
      baseHeaders.forEach(h => {
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
    const sampleItem = groups.find(g => g.items && g.items.length > 0)?.items[0];
    if (!sampleItem) return;
    const baseHeaders = Object.keys(sampleItem).filter(k => !k.startsWith('_'));
    const headers = ["Group Name", "Group Description", ...baseHeaders];
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
          ...baseHeaders.map(h => {
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
    groups.forEach((group, idx) => {
      const items = group.items || [];
      if (items.length === 0) return;
      const baseHeaders = Object.keys(items[0]).filter(k => !k.startsWith('_'));
      let csvContent = "";
      if (reportTitle) {
        csvContent += `"${reportTitle.replace(/"/g, '""')} - ${group.name}"\n`;
      }
      if (group.description) {
        csvContent += `"${group.description.replace(/"/g, '""')}"\n`;
      }
      csvContent += '\n' + baseHeaders.join(',') + '\n';
      items.forEach(item => {
        const row = baseHeaders.map(h => {
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
      
      const headers = Object.keys(items[0]).filter(k => !k.startsWith('_'));
      const rows = items.map(item => headers.map(h => formatValue(item[h]) !== undefined ? String(formatValue(item[h])) : ""));

      const columnStyles = {};
      const nameIdx = headers.findIndex(h => h === 'Student Name');
      if (nameIdx !== -1) {
        columnStyles[nameIdx] = { cellWidth: 50 }; // Give Student Name column more space
      }

      doc.autoTable({
        head: [headers],
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

      const headers = Object.keys(items[0]).filter(k => !k.startsWith('_'));
      
      const tableRows = [
        new TableRow({
          children: headers.map(h => new TableCell({ children: [new Paragraph({ text: h, style: "Strong" })], shading: { fill: "D9D9D9" } })),
        })
      ];

      items.forEach(item => {
        tableRows.push(
          new TableRow({
            children: headers.map(h => new TableCell({ children: [new Paragraph(String(formatValue(item[h]) !== undefined ? formatValue(item[h]) : ""))] })),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-md bg-slate-900 border border-slate-700 p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-white">Export Academic Placement</h3>
            <p className="text-xs text-slate-400">Generate the final customized workbook</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-standard">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          
          <button onClick={downloadExcelWorkbook} className="w-full p-4 rounded-md bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-standard hover-subtle text-left flex items-start gap-3.5 group">
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary shrink-0"><DocumentArrowDownIcon className="w-4 h-4" /></div>
            <div>
              <h4 className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-standard">Master Excel Workbook (.xlsx)</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-normal">Generates a fully formatted multi-sheet Excel workbook exactly matching the requested format.</p>
            </div>
          </button>

          <button onClick={downloadDOCX} className="w-full p-4 rounded-md bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-standard hover-subtle text-left flex items-start gap-3.5 group">
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary shrink-0"><DocumentIcon className="w-4 h-4" /></div>
            <div>
              <h4 className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-standard">Master Word Document (.docx)</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-normal">Generates a single Microsoft Word document with tables for each cohort.</p>
            </div>
          </button>

          <button onClick={downloadPDFs} className="w-full p-4 rounded-md bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-standard hover-subtle text-left flex items-start gap-3.5 group">
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary shrink-0"><DocumentTextIcon className="w-4 h-4" /></div>
            <div>
              <h4 className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-standard">Separate PDF Rosters (.pdf)</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-normal">Generates individual beautifully styled PDF files for each class.</p>
            </div>
          </button>

          <button onClick={downloadCombinedCSV} className="w-full p-4 rounded-md bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-standard hover-subtle text-left flex items-start gap-3.5 group">
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary shrink-0"><TableCellsIcon className="w-4 h-4" /></div>
            <div>
              <h4 className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-standard">Unified CSV Data File (.csv)</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-normal">A generic CSV dump of all data with an added Group Name column.</p>
            </div>
          </button>

          <button onClick={downloadSeparateCSVs} className="w-full p-4 rounded-md bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-standard hover-subtle text-left flex items-start gap-3.5 group">
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary shrink-0"><DocumentTextIcon className="w-4 h-4" /></div>
            <div>
              <h4 className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-standard">Separate Cohort Files (.csv)</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-normal">Generates individual CSV files for each class for easy emailing.</p>
            </div>
          </button>

          <button onClick={handlePrint} className="w-full p-4 rounded-md bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-standard hover-subtle text-left flex items-start gap-3.5 group">
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary shrink-0"><PrinterIcon className="w-4 h-4" /></div>
            <div>
              <h4 className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-standard">Browser Print Window</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-normal">Opens the browser print dialog to print directly to a physical printer.</p>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
};

export default ExportModal;
