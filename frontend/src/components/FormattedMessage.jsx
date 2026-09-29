import React from 'react';

// Lightweight, resilient Markdown & Table parser for Chat messages
const FormattedMessage = ({ content }) => {
  if (!content) return null;

  // Split into blocks by double newlines or table/code markers
  const lines = content.split('\n');
  const blocks = [];
  let currentTable = null;
  let currentList = null;
  let currentParagraph = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'paragraph', text: currentParagraph.join(' ') });
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }
  };

  const flushTable = () => {
    if (currentTable) {
      blocks.push(currentTable);
      currentTable = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Check for empty line
    if (!line) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }

    // Check for Table Row: starts and ends with '|'
    if (line.startsWith('|') && line.endsWith('|')) {
      flushParagraph();
      flushList();

      // Check if it's separator row like | --- | --- |
      if (/^\|[\s\-:|]+\|$/.test(line)) {
        continue;
      }

      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      if (!currentTable) {
        currentTable = { type: 'table', headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    // Check for Headings
    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h3', text: line.replace('### ', '') });
      continue;
    }
    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h2', text: line.replace('## ', '') });
      continue;
    }
    if (line.startsWith('# ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h1', text: line.replace('# ', '') });
      continue;
    }

    // Check for Bullet Lists
    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
      flushParagraph();
      const itemText = line.replace(/^[•\-\*]\s+/, '');
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      continue;
    }

    // Check for Numbered Lists
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      flushParagraph();
      const itemText = numberedMatch[2];
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      continue;
    }

    // Check for Blockquote
    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'quote', text: line.replace('> ', '') });
      continue;
    }

    // Regular line inside paragraph
    currentParagraph.push(rawLine);
  }

  flushParagraph();
  flushList();
  flushTable();

  // Helper to format inline markdown: **bold**, `code`, *italic*
  const renderInline = (str) => {
    if (!str) return '';

    // Split by inline code: `code`
    const codeParts = str.split(/(`[^`]+`)/g);

    return codeParts.map((part, pIdx) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={pIdx}
            className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-cyan-300 mx-0.5"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Split by bold: **bold**
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**')) {
          return (
            <strong key={`${pIdx}-${bIdx}`} className="font-semibold text-white">
              {bPart.slice(2, -2)}
            </strong>
          );
        }
        return bPart;
      });
    });
  };

  return (
    <div className="space-y-3 text-slate-200 text-sm leading-relaxed">
      {blocks.map((block, idx) => {
        if (block.type === 'h1') {
          return (
            <h2 key={idx} className="text-base font-bold text-white border-b border-slate-800 pb-1 pt-2">
              {renderInline(block.text)}
            </h2>
          );
        }
        if (block.type === 'h2') {
          return (
            <h3 key={idx} className="text-sm font-bold text-cyan-300 pt-2">
              {renderInline(block.text)}
            </h3>
          );
        }
        if (block.type === 'h3') {
          return (
            <h4 key={idx} className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-1">
              {renderInline(block.text)}
            </h4>
          );
        }
        if (block.type === 'paragraph') {
          return (
            <p key={idx} className="whitespace-pre-line text-slate-200">
              {renderInline(block.text)}
            </p>
          );
        }
        if (block.type === 'ul') {
          return (
            <ul key={idx} className="space-y-1.5 my-2 pl-2">
              {block.items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1 text-xs">•</span>
                  <span className="flex-1 text-slate-300">{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'ol') {
          return (
            <ol key={idx} className="space-y-1.5 my-2 pl-2">
              {block.items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400 text-xs mt-0.5">{iIdx + 1}.</span>
                  <span className="flex-1 text-slate-300">{renderInline(item)}</span>
                </li>
              ))}
            </ol>
          );
        }
        if (block.type === 'quote') {
          return (
            <div
              key={idx}
              className="border-l-2 border-cyan-500/60 bg-cyan-950/20 px-3 py-1.5 rounded-r text-xs text-slate-300 italic"
            >
              {renderInline(block.text)}
            </div>
          );
        }
        if (block.type === 'table') {
          return (
            <div key={idx} className="my-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/60">
              <table className="min-w-full divide-y divide-slate-800 text-xs">
                {block.headers && block.headers.length > 0 && (
                  <thead className="bg-slate-950/80 text-slate-300">
                    <tr>
                      {block.headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-3 py-2 text-left font-semibold text-cyan-300">
                          {renderInline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {block.rows.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-slate-900/30' : 'bg-transparent'}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-1.5">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default FormattedMessage;
