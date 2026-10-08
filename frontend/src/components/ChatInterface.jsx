import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  UserCircleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowDownTrayIcon,
  TableCellsIcon,
  Bars3Icon,
  LightBulbIcon,
  ArrowPathIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import FormattedMessage from './FormattedMessage';

const ChatInterface = ({
  file,
  onViewResults,
  onExportGroups,
  onGroupsUpdated,
  onToggleSidebar,
  sidebarOpen,
  onInspectFile
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Scroll to bottom smoothly on message updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load chat history when file changes
  useEffect(() => {
    if (!file?.file_id) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${apiUrl}/chat-history/${file.file_id}`);
        if (res.data?.chat_history && res.data.chat_history.length > 0) {
          const loadedMsgs = [];
          res.data.chat_history.forEach((item) => {
            loadedMsgs.push({
              id: `u-${item.id}`,
              role: 'user',
              content: item.user_message
            });
            loadedMsgs.push({
              id: `a-${item.id}`,
              role: 'assistant',
              content: item.ai_response
            });
          });
          setMessages(loadedMsgs);
        } else {
          // Default welcoming message
          setMessages([
            {
              id: 'init-greeting',
              role: 'assistant',
              content: `Hello! I have loaded **${file.filename || 'your file'}** (${file.total_rows || 0} records).\n\nYou can ask me any question about the dataset (e.g. statistics, counts, summaries, filtering) or tell me how to group the students/records into balanced cohorts.`
            }
          ]);
        }
      } catch (err) {
        console.warn('Could not load chat history:', err);
        setMessages([
          {
            id: 'init-fallback',
            role: 'assistant',
            content: `Hello! I have loaded **${file.filename || 'your file'}** (${file.total_rows || 0} records).\n\nAsk me anything about this file or tell me how you would like to sort or group it!`
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [file?.file_id, file?.filename, file?.total_rows, apiUrl]);

  // Suggestion prompt handler
  const handleQuickPrompt = (promptText) => {
    setInput(promptText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const isGroupingRequest = (prompt) => {
    const p = prompt.toLowerCase();
    const keywords = ["group", "divide", "allocate", "split", "cohort", "house", "teams", "cluster", "categorize", "sort into", "make groups", "create groups", "partition", "distribute"];
    return keywords.some(k => p.includes(k));
  };

  // Submit message to /chat or /interpret
  const handleSendMessage = async (e, forcedInstruction = null, planJson = null) => {
    if (e) e.preventDefault();
    const trimmed = forcedInstruction || input.trim();
    if (!trimmed || loading || !file?.file_id) return;

    if (!forcedInstruction) {
      const userMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
    
    setLoading(true);

    try {
      if (isGroupingRequest(trimmed) && !forcedInstruction) {
        // Step 1: Interpret instruction and ask for confirmation
        const res = await axios.post(`${apiUrl}/interpret`, {
          file_id: file.file_id,
          instructions: trimmed
        });
        
        const data = res.data;
        const assistantMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: 'I understand you want to organize the students. Here is my plan:\n\n' +
                   data.interpreted_as.map(p => `• ${p}`).join('\n') +
                   '\n\nWould you like me to proceed with this grouping?',
          is_grouping_plan: true,
          original_instruction: trimmed,
          plan_json: data.plan_json
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Regular chat or executing confirmed grouping
        const endpoint = forcedInstruction ? '/group' : '/chat';
        const payload = forcedInstruction 
          ? { file_id: file.file_id, instructions: trimmed, plan_json: planJson }
          : { file_id: file.file_id, message: trimmed };
          
        const res = await axios.post(`${apiUrl}${endpoint}`, payload);
        const data = res.data;
        
        if (data?.status === 'success' || data?.groups) {
          const assistantMessage = {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: data.reply || data.explanation || 'Groups successfully generated.',
            is_grouping: (data.is_grouping || !!data.groups),
            groups: data.groups,
            total_rows: data.total_rows,
            grouped_rows: data.grouped_rows
          };
          setMessages((prev) => [...prev, assistantMessage]);
          
          // If groups were created, sync with parent application
          if ((data.is_grouping || data.groups) && data.groups && data.groups.length > 0 && onGroupsUpdated) {
            onGroupsUpdated(data.groups, trimmed, data.report_title);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: 'assistant',
              content: `⚠️ ${data?.detail || 'Could not process your request. Please try again.'}`
            }
          ]);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = err.response?.data?.detail || err.message || 'An error occurred while communicating with SortifyAI.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Error**: ${errMsg}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 relative">
      {/* Chat Navigation Header */}
      <header className="h-14 border-b border-slate-800/80 px-4 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-standard ${sidebarOpen ? 'md:hidden' : ''}`}
            title="Open Sidebar"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-xs sm:text-sm text-white truncate">
              {file?.filename || 'Roster Chat'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] shrink-0">
              {file?.total_rows || 0} records
            </span>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-2 shrink-0">
          {onInspectFile && (
            <button
              onClick={onInspectFile}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-standard"
              title="Preview raw spreadsheet table"
            >
              <TableCellsIcon className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Inspect Table</span>
            </button>
          )}

          {onViewResults && (
            <button
              onClick={onViewResults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-standard"
              title="Open full interactive Results Studio"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Results Studio</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 scrollbar-hide max-w-4xl mx-auto w-full pb-36">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Assistant Avatar */}
            {msg.role !== 'user' && (
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5 text-cyan-400">
                <SparklesIcon className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-[85%] sm:max-w-[78%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`text-[11px] font-medium px-1 ${msg.role === 'user' ? 'text-slate-400 text-right' : 'text-cyan-400 text-left'}`}>
                {msg.role === 'user' ? 'You' : 'SortifyAI'}
              </div>

              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl text-sm transition-all shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-none shadow-cyan-900/20'
                    : 'bg-slate-900/90 border border-slate-800/90 text-slate-200 rounded-tl-none'
                }`}
              >
                <FormattedMessage content={msg.content} />

                {/* Inline Grouping Result Card (if this turn generated groups) */}
                {msg.is_grouping && msg.groups && msg.groups.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold text-xs text-white">
                          {msg.groups.length} Cohorts Generated
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {msg.grouped_rows || 0} / {msg.total_rows || 0} allocated (
                        {Math.round(((msg.grouped_rows || 0) / (msg.total_rows || 1)) * 100)}%)
                      </span>
                    </div>

                    {/* Group Badges Preview */}
                    <div className="flex flex-wrap gap-1.5">
                      {msg.groups.map((grp, gIdx) => (
                        <div
                          key={gIdx}
                          className="px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-[11px] flex items-center gap-1.5 text-slate-300"
                        >
                          <span className="font-medium text-cyan-300">{grp.name}:</span>
                          <span className="font-mono text-slate-400">{grp.items?.length || 0}</span>
                        </div>
                      ))}
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      {onViewResults && (
                        <button
                          onClick={onViewResults}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-standard shadow-sm"
                        >
                          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                          <span>Inspect in Results Studio</span>
                        </button>
                      )}

                      {onExportGroups && (
                        <button
                          onClick={onExportGroups}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-standard"
                        >
                          <ArrowDownTrayIcon className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Export Groups</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Inline Grouping Plan Card (if this turn is a plan requiring confirmation) */}
                {msg.is_grouping_plan && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => handleSendMessage(null, msg.original_instruction, msg.plan_json)}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-standard shadow-sm"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Yes, proceed</span>
                      </button>
                      <button
                        onClick={() => {
                          setInput(msg.original_instruction + ' ');
                          if (textareaRef.current) {
                            textareaRef.current.focus();
                          }
                          setMessages(prev => [
                            ...prev, 
                            { id: `u-refine-${Date.now()}`, role: 'user', content: 'Actually, let me refine that.' }
                          ]);
                        }}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-standard"
                      >
                        <span>No, I meant...</span>
                      </button>
                      <button
                        onClick={() => {
                          setMessages(prev => [
                            ...prev, 
                            { id: `u-cancel-${Date.now()}`, role: 'user', content: 'Cancel' }, 
                            { id: `a-cancel-${Date.now()}`, role: 'assistant', content: 'Grouping action cancelled.' }
                          ]);
                        }}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-transparent text-slate-400 hover:text-slate-300 text-xs font-medium transition-standard"
                      >
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User Avatar */}
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-slate-300">
                <UserCircleIcon className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3.5 justify-start items-center">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
              <SparklesIcon className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 rounded-tl-none flex items-center gap-2 text-xs text-slate-400">
              <span>SortifyAI is analyzing your file...</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Input Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent backdrop-blur-sm">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Quick Suggestions Chips (shown when few messages) */}
          {messages.length <= 2 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs">
              <span className="text-slate-500 text-[11px] shrink-0 flex items-center gap-1">
                <LightBulbIcon className="w-3.5 h-3.5 text-amber-400" />
                Suggestions:
              </span>
              <button
                onClick={() => handleQuickPrompt('Give me a detailed summary of this dataset, including key statistics and columns.')}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-standard"
              >
                📊 Summarize dataset
              </button>
              <button
                onClick={() => handleQuickPrompt('Group these students into 4 balanced cohorts with equal scores and gender.')}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-standard"
              >
                👥 Group into 4 balanced cohorts
              </button>
              <button
                onClick={() => handleQuickPrompt('What is the average score and how many students passed above 50?')}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-standard"
              >
                📈 Score & pass analysis
              </button>
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={handleSendMessage}
            className="relative bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Ask anything about ${file?.filename || 'your file'} or type grouping rules... (Enter to send)`}
              rows={1}
              className="w-full pl-4 pr-12 py-3.5 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none resize-none min-h-[50px] max-h-[180px]"
              disabled={loading || !file?.file_id}
            />

            <button
              type="submit"
              disabled={!input.trim() || loading || !file?.file_id}
              className="absolute right-2.5 bottom-2.5 p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:bg-slate-800 disabled:text-slate-600 transition-standard shadow-sm"
              title="Send message"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>Conversations are automatically saved to your session history.</span>
            <span>Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
