import React, { useState } from 'react';
import { Sparkles, Send, Bot, RefreshCw, AlertCircle } from 'lucide-react';
import { queryStockSenseAI } from '../../api/aiApi';
import { useInventory } from '../../context/InventoryContext';

export const NaturalLanguageQueryBox = () => {
  const { products, ledger } = useInventory();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [isThinking, setIsThinking] = useState(false);

  const sampleQueries = [
    "How many steel rods do we have?",
    "Which items are at risk of stockout this week?",
    "What products need reordering?",
    "Warehouse 2 inventory status"
  ];

  const handleAsk = async (textToAsk) => {
    const q = textToAsk || query;
    if (!q.trim()) return;

    setIsThinking(true);
    setResponse(null);
    try {
      const answer = await queryStockSenseAI(q, products, ledger);
      setResponse(answer);
    } catch (err) {
      setResponse("⚠️ Unable to process query at this time. Please try again.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/40 via-white to-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Natural Language Stock Intelligence
              <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded border border-indigo-200">
                AI Powered
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Ask any operational question in plain English against live ledger and telemetry
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {sampleQueries.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(item);
              handleAsk(item);
            }}
            className="text-[11px] font-medium px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 hover:border-indigo-200 rounded-full transition-all text-left"
          >
            "{item}"
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question (e.g., 'How many steel rods do we have in Warehouse 2?')..."
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-4 pr-24 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
        />
        <button
          type="button"
          onClick={() => handleAsk()}
          disabled={isThinking || !query.trim()}
          className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
        >
          {isThinking ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Query</span>
            </>
          )}
        </button>
      </div>

      {/* Thinking state animation */}
      {isThinking && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 animate-pulse">
          <Bot className="w-5 h-5 text-indigo-600 animate-bounce" />
          <span className="text-xs font-medium text-slate-600">
            StockSense AI is scanning stock ledger events, depletion velocities, and warehouse locations...
          </span>
        </div>
      )}

      {/* Response Box */}
      {response && !isThinking && (
        <div className="mt-4 p-4 rounded-xl bg-white border border-indigo-100 shadow-sm text-xs leading-relaxed text-slate-700">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 text-indigo-700 font-semibold">
            <Bot className="w-4 h-4" />
            <span>AI Response</span>
          </div>
          <div className="whitespace-pre-line space-y-1 font-normal text-slate-800">
            {response}
          </div>
        </div>
      )}
    </div>
  );
};
