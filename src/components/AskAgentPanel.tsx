import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Wrench, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Server,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface ToolCall {
  name: string;
  args: Record<string, any>;
  failed?: boolean;
}

interface UnavailableServer {
  address: string;
  reason: string;
}

interface AskResponse {
  answer: string;
  tool_calls: ToolCall[];
  unavailable: UnavailableServer[];
  model: string;
  answered_at: string;
}

export const AskAgentPanel: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleQueries = [
    'What is the median HDB resale price in Toa Payoh?',
    'Show me recent inflation or CPI figures for Singapore',
    'What is the median income in Singapore?',
    'What is the HDB affordability ratio?'
  ];

  const handleAsk = async (textToAsk?: string) => {
    const q = (textToAsk !== undefined ? textToAsk : question).trim();
    if (!q || loading) return;

    if (q.length > 500) {
      setError('Question cannot exceed 500 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    if (textToAsk) {
      setQuestion(textToAsk);
    }

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.reason || `Request failed with status ${res.status}`);
        setResponse(null);
      } else {
        setResponse(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Network error communicating with /api/ask');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md rounded-xl border border-cyan-500/40 shadow-2xl p-3 flex flex-col gap-2.5 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-md">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold font-mono tracking-wide text-cyan-300">
                ASK AGENT
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                Gemini 3.8 Flash + MCP
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Answers strictly from remote MCP servers (HDB, SingStat Sandra, etc.)
            </p>
          </div>
        </div>
      </div>

      {/* Input & Ask Button */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex flex-col gap-1.5"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question (e.g. median HDB resale price or SingStat CPI)..."
            maxLength={500}
            className="w-full bg-slate-950/80 border border-slate-700 focus:border-cyan-400 rounded-lg pl-3 pr-20 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-1 px-3 py-1 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold text-xs rounded-md shadow flex items-center gap-1 transition-all"
          >
            {loading ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Ask</span>
                <Send className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {/* Quick query chips */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
          <span className="text-[9px] text-slate-500 uppercase font-mono shrink-0">Sample:</span>
          {sampleQueries.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAsk(sample)}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700/60 whitespace-nowrap shrink-0 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs flex items-start gap-2 shadow">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold">Agent Error: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Answer & Telemetry */}
      {response && (
        <div className="flex flex-col gap-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 animate-in fade-in duration-200">
          {/* Main Answer */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-cyan-400 font-bold">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                ANSWER
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {response.answered_at ? new Date(response.answered_at).toLocaleTimeString() : ''}
              </span>
            </div>
            <p className="text-xs text-slate-100 leading-relaxed font-sans select-text whitespace-pre-wrap">
              {response.answer || 'No direct answer returned from the model.'}
            </p>
          </div>

          {/* Tools Called in Order */}
          <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800/80">
            <span className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
              <Wrench className="w-3 h-3 text-amber-400" />
              TOOLS CALLED ({response.tool_calls?.length || 0})
            </span>

            {response.tool_calls && response.tool_calls.length > 0 ? (
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                {response.tool_calls.map((tool, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-300 font-bold flex items-center gap-1">
                        <span className="text-slate-500">#{idx + 1}</span>
                        {tool.name}
                      </span>
                      {tool.failed ? (
                        <span className="text-rose-400 flex items-center gap-1 text-[9px] font-semibold">
                          <XCircle className="w-3 h-3 text-rose-500" /> Failed
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1 text-[9px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Executed
                        </span>
                      )}
                    </div>
                    {tool.args && Object.keys(tool.args).length > 0 && (
                      <pre className="text-[9px] text-slate-400 bg-slate-950 p-1 rounded overflow-x-auto">
                        {JSON.stringify(tool.args, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 italic">
                No external MCP tool calls were executed for this query.
              </div>
            )}
          </div>

          {/* Unavailable Servers (in grey) */}
          {response.unavailable && response.unavailable.length > 0 && (
            <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800/80">
              <span className="text-[10px] font-mono font-bold text-slate-500 flex items-center gap-1">
                <Server className="w-3 h-3 text-slate-500" />
                UNAVAILABLE MCP SERVERS ({response.unavailable.length})
              </span>
              <div className="flex flex-col gap-1">
                {response.unavailable.map((srv, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded bg-slate-900/60 border border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between"
                  >
                    <span className="truncate max-w-[220px]" title={srv.address}>
                      {srv.address}
                    </span>
                    <span className="text-slate-500 text-[9px] shrink-0 ml-2">
                      {srv.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
