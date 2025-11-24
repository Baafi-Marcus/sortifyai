import React from 'react';
import { UserGroupIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const GroupDisplay = ({ groups, dataSummary }) => {
    if (!groups || groups.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-secondary/20 flex items-center justify-center mb-4">
                    <UserGroupIcon className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-lg font-medium text-slate-400">No groups created yet</p>
                <p className="text-sm mt-2 max-w-xs">Upload a file and ask SortifyAI to organize it for you.</p>
            </div>
        );
    }

    const downloadGroupAsCSV = (group) => {
        if (!group.items || group.items.length === 0) return;

        // Get column headers from first item
        const headers = Object.keys(group.items[0]);

        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        group.items.forEach(item => {
            const row = headers.map(header => {
                const value = item[header];
                // Escape commas and quotes
                return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                    ? `"${value.replace(/"/g, '""')}"`
                    : value;
            });
            csvContent += row.join(',') + '\n';
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${group.name.replace(/\s+/g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadAllGroupsAsCSV = () => {
        groups.forEach(group => downloadGroupAsCSV(group));
    };

    return (
        <div className="h-full overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-brand-secondary/50 scrollbar-track-transparent">
            {dataSummary && (
                <div className="p-4 rounded-xl bg-brand-primary/10 border border-brand-primary/20">
                    <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider mb-2">
                        Data Summary
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{dataSummary}</p>
                </div>
            )}

            {/* Distribution Summary */}
            {groups.length > 0 && (
                <div className="p-4 rounded-xl bg-brand-secondary/20 border border-white/10">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                        Distribution Summary
                    </h3>
                    <div className="space-y-2">
                        {groups.map((group, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-slate-300">{group.name}</span>
                                <span className="font-semibold text-brand-primary">{group.items?.length || 0} rows</span>
                            </div>
                        ))}
                        <div className="pt-2 mt-2 border-t border-white/10 flex justify-between items-center font-bold">
                            <span className="text-white">Total</span>
                            <span className="text-brand-primary">{groups.reduce((sum, g) => sum + (g.items?.length || 0), 0)} rows</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Groups ({groups.length})</h3>
                <button
                    onClick={downloadAllGroupsAsCSV}
                    className="flex items-center gap-2 px-3 py-2 bg-brand-primary text-brand-dark rounded-lg hover:bg-brand-accent transition-colors text-sm font-medium"
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Download All
                </button>
            </div>

            <div className="space-y-6">
                {groups.map((group, index) => {
                    const hasTableData = group.items && group.items.length > 0 && typeof group.items[0] === 'object';
                    const columns = hasTableData ? Object.keys(group.items[0]) : [];

                    return (
                        <div key={index} className="bg-brand-secondary/20 rounded-xl border border-white/5 overflow-hidden hover:border-brand-primary/30 transition-all">
                            <div className="p-4 border-b border-white/5 bg-brand-secondary/30 flex justify-between items-center">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-brand-primary/20 text-brand-primary flex items-center justify-center text-xs">
                                            {index + 1}
                                        </span>
                                        <h3 className="font-bold text-white">{group.name}</h3>
                                        <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary text-xs font-semibold rounded-full">
                                            {group.items?.length || 0} rows
                                        </span>
                                    </div>
                                    {group.description && (
                                        <p className="text-sm text-slate-400 mt-1 italic ml-8">{group.description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => downloadGroupAsCSV(group)}
                                    className="flex items-center gap-1 px-2 py-1 bg-brand-dark/50 hover:bg-brand-primary/20 rounded text-xs text-brand-primary transition-colors"
                                >
                                    <ArrowDownTrayIcon className="w-3 h-3" />
                                    CSV
                                </button>
                            </div>

                            <div className="p-4">
                                {hasTableData ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    {columns.map((col, i) => (
                                                        <th key={i} className="text-left py-2 px-3 text-brand-primary font-semibold">
                                                            {col}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {group.items.map((item, i) => (
                                                    <tr key={i} className="border-b border-white/5 hover:bg-brand-dark/30 transition-colors">
                                                        {columns.map((col, j) => (
                                                            <td key={j} className="py-2 px-3 text-slate-300">
                                                                {item[col]}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {group.items && group.items.map((item, i) => (
                                            <div key={i} className="p-2 rounded-lg bg-brand-dark/30 border border-white/5 text-sm text-slate-300">
                                                {typeof item === 'string' ? item : JSON.stringify(item)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GroupDisplay;
