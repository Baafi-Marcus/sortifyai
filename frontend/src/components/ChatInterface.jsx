import React, { useState } from 'react';
import { PaperAirplaneIcon, UserCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

const ChatInterface = ({ fileId, onGroupData, onMessage, totalRows }) => {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        {
            role: "system",
            content: totalRows === 0
                ? "I'm currently analyzing your file in the background. You can start typing your grouping instructions now, and I'll apply them once processing is complete.\n\n**Example prompts:**\n• \"Group into A, B, C where A has Math ≥ 50 and English 10-49\"\n• \"Divide by score ranges: High (80+), Medium (50-79), Low (<50)\"\n• \"Group by status: Active, Pending, Completed\""
                : `I've analyzed your file${totalRows ? ` containing ${totalRows} rows` : ''}. Tell me how you'd like to group the data.\n\n**Example prompts:**\n• \"Group into A, B, C where A has Math ≥ 50 and English 10-49\"\n• \"Divide by score ranges: High (80+), Medium (50-79), Low (<50)\"\n• \"Group by status: Active, Pending, Completed\"`
        }
    ]);
    const [isProcessing, setIsProcessing] = useState(totalRows === 0);
    const [loading, setLoading] = useState(false);
    const textareaRef = React.useRef(null);

    // Poll for file status if processing
    React.useEffect(() => {
        if (!isProcessing) return;

        const interval = setInterval(async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await fetch(`${apiUrl}/files`);
                const data = await response.json();
                const file = data.files.find(f => f.file_id === fileId);

                if (file && file.processed) {
                    setIsProcessing(false);
                    // Update the system message
                    setMessages(prev => [
                        ...prev,
                        { role: "system", content: `✅ Analysis complete! I found ${file.total_rows} rows. I'm ready to group your data now.` }
                    ]);
                    // Notify parent to update data summary
                    if (onMessage) {
                        onMessage({ type: 'processing_complete', totalRows: file.total_rows });
                    }
                    clearInterval(interval);
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [isProcessing, fileId, onMessage]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: "user", content: input };
        setMessages([...messages, userMsg]);
        setInput("");

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        setLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/group`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ file_id: fileId, instructions: input }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.status === "processing") {
                    setMessages(prev => [...prev, { role: "system", content: "⏳ Still analyzing your file... I'll apply your grouping as soon as I'm done!" }]);
                } else {
                    // Build response message with data summary
                    let responseText = data.explanation || "Done!";

                    // Add per-group breakdown
                    if (data.groups && data.groups.length > 0) {
                        responseText += "\n\n📊 **Group Distribution:**";
                        data.groups.forEach((group, idx) => {
                            const count = group.items?.length || 0;
                            responseText += `\n• ${group.name}: ${count} rows`;
                        });
                    }

                    if (data.total_rows && data.grouped_rows !== undefined) {
                        responseText += `\n\n**Summary:**\n- Total rows in file: ${data.total_rows}\n- Rows grouped: ${data.grouped_rows}`;

                        if (data.grouped_rows < data.total_rows) {
                            responseText += `\n- Ungrouped: ${data.total_rows - data.grouped_rows} rows`;
                        }
                    }

                    const aiMsg = { role: "assistant", content: responseText };
                    setMessages(prev => [...prev, aiMsg]);
                    if (data.groups) {
                        onGroupData(data.groups);
                    }
                }
            } else {
                setMessages(prev => [...prev, { role: "error", content: "Error: " + data.detail }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: "error", content: "Network Error: " + error.message }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative max-w-3xl mx-auto w-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 scrollbar-hide">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role !== "user" && (
                            <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20">
                                <SparklesIcon className="w-5 h-5 text-brand-primary" />
                            </div>
                        )}

                        <div className={`max-w-[80%] space-y-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                            <div className={`text-sm font-medium ${msg.role === "user" ? "text-slate-300" : "text-brand-primary"}`}>
                                {msg.role === "user" ? "You" : "SortifyAI"}
                            </div>
                            <div className={`text-base leading-relaxed text-slate-200 whitespace-pre-line ${msg.role === "error" ? "text-red-400" : ""
                                }`}>
                                {msg.content}
                            </div>
                        </div>

                        {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-brand-secondary/50 flex items-center justify-center shrink-0 border border-white/10">
                                <UserCircleIcon className="w-5 h-5 text-slate-300" />
                            </div>
                        )}
                    </div>
                ))}
                {(loading || isProcessing) && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20">
                            <SparklesIcon className="w-5 h-5 text-brand-primary" />
                        </div>
                        <div className="flex items-center gap-2 h-8 text-slate-400 text-sm">
                            {isProcessing ? "Analyzing file structure..." : "Grouping data..."}
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-brand-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-brand-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-brand-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Input Area */}
            <div className="absolute bottom-6 left-0 right-0 px-4">
                <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto bg-brand-secondary/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden focus-within:border-brand-primary/50 focus-within:ring-1 focus-within:ring-brand-primary/50 transition-all">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            // Auto-resize textarea
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder={isProcessing ? "Type your grouping instructions (file is still analyzing)..." : "Message SortifyAI... (Shift+Enter for new line)"}
                        className="w-full pl-4 pr-12 py-4 bg-transparent text-white placeholder-slate-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none min-h-[56px] max-h-[200px]"
                        disabled={!fileId}
                        rows={1}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || !fileId}
                        className="absolute right-2 bottom-4 p-2 bg-brand-primary text-brand-dark rounded-lg disabled:bg-brand-secondary/50 disabled:text-slate-500 transition-all hover:opacity-90"
                    >
                        <PaperAirplaneIcon className="w-4 h-4" />
                    </button>
                </form>
                <div className="text-center mt-2">
                    <p className="text-xs text-slate-500">SortifyAI provides accurate, rule-based grouping. Verify results for critical data.</p>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
