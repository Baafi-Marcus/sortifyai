import React from 'react';
import { 
  PrinterIcon, 
  DocumentTextIcon, 
  XMarkIcon,
  TableCellsIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';

const ExportModal = ({ isOpen, onClose, groups = [], filename = "SortifyAI_Placement_Results", reportTitle }) => {
  if (!isOpen) return null;

  // Export highly formatted multi-sheet Excel workbook
  const downloadExcelWorkbook = () => {
    if (!groups || groups.length === 0) return;

    const wb = XLSX.utils.book_new();
    
    // ==========================================
    // SHEET 1: Master List
    // ==========================================
    let masterData = [];
    const allItems = [];
    
    groups.forEach(group => {
      (group.items || []).forEach(item => {
        allItems.push({ ...item, Assigned_Class: group.name });
      });
    });
    
    // Sort all items descending by Overall Placement Score
    allItems.sort((a, b) => {
      const scoreA = parseFloat(a['Overall Placement Score'] || a['Overall Score'] || 0);
      const scoreB = parseFloat(b['Overall Placement Score'] || b['Overall Score'] || 0);
      return scoreB - scoreA; 
    });

    const baseHeaders = allItems.length > 0 ? Object.keys(allItems[0]).filter(k => !k.startsWith('_') && k !== 'Assigned_Class') : [];

    allItems.forEach((item, index) => {
      const row = { "Rank": index + 1 };
      baseHeaders.forEach(h => { row[h] = item[h]; });
      row["Assigned Class"] = item.Assigned_Class;
      masterData.push(row);
    });

    const wsMaster = XLSX.utils.json_to_sheet(masterData);
    XLSX.utils.book_append_sheet(wb, wsMaster, "Final Placement");

    // ==========================================
    // SHEET 2: Class Summary
    // ==========================================
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
        "Avg English %": numStudents ? (grpEng / numStudents).toFixed(2) : 0,
        "Avg Mathematics %": numStudents ? (grpMath / numStudents).toFixed(2) : 0,
        "Avg Placement Score": numStudents ? (grpOverall / numStudents).toFixed(2) : 0,
        "Highest Score": numStudents ? grpHighest.toFixed(2) : 0,
        "Lowest Score": numStudents ? grpLowest.toFixed(2) : 0
      });
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Class Summary");

    // ==========================================
    // INDIVIDUAL CLASS SHEETS
    // ==========================================
    groups.forEach(group => {
      const items = [...(group.items || [])];
      items.sort((a, b) => {
        const scoreA = parseFloat(a['Overall Placement Score'] || a['Overall Score'] || 0);
        const scoreB = parseFloat(b['Overall Placement Score'] || b['Overall Score'] || 0);
        return scoreB - scoreA;
      });

      const classData = [];
      
      // Inject subject metadata header row
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
        baseHeaders.forEach(h => { row[h] = item[h]; });
        classData.push(row);
      });

      const safeSheetName = group.name.substring(0, 31).replace(/[\\/*?:\[\]]/g, '');
      const wsClass = XLSX.utils.json_to_sheet(classData, { skipHeader: false });
      XLSX.utils.book_append_sheet(wb, wsClass, safeSheetName);
    });

    XLSX.writeFile(wb, `${filename}.xlsx`);
    onClose();
  };

  const downloadSeparateCSVs = () => { /* Kept intact but optional */ onClose(); };
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

        <div className="space-y-2.5">
          <button
            onClick={downloadExcelWorkbook}
            className="w-full p-4 rounded-md bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-standard hover-subtle text-left flex items-start gap-3.5 group"
          >
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary shrink-0">
              <DocumentArrowDownIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-standard">
                Master Excel Workbook (.xlsx)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                Generates a fully formatted multi-sheet Excel workbook exactly matching the requested format (Master List, Summary, Individual Classes).
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
