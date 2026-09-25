import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Volume2, 
  Sparkles, 
  ChevronUp, 
  ChevronDown, 
  MessageSquare
} from 'lucide-react';
import { CopilotIntelResponse, PreSurgeOpportunity } from '../types/surge';
import { speakDispatchAlert } from '../utils/audioDispatch';

interface AICopilotChatProps {
  driverLocation: string;
  selectedOpportunity: PreSurgeOpportunity | null;
  intel: CopilotIntelResponse | null;
  isLoadingIntel: boolean;
  onRefreshIntel: () => void;
  voiceEnabled: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
}

export const AICopilotChat: React.FC<AICopilotChatProps> = ({
  driverLocation,
  selectedOpportunity,
  intel,
  isLoadingIntel,
  onRefreshIntel,
  voiceEnabled
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: 'copilot',
      text: `SurgeSG Co-Pilot online. Currently monitoring Singapore LTA incident stream, Doppler rain radar, and CAG airport arrivals. National Stadium concert egress and Buona Vista MRT breakdown are top pre-surge targets.`,
      timestamp: 'Just now'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          driverLocation,
          currentOpportunityId: selectedOpportunity?.zoneName
        })
      });
      const data = await res.json();
      const replyText = data.reply || 'Dispatch advises staging at Old Airport Road.';

      const copilotMsg: ChatMessage = {
        id: 'copilot_' + Date.now(),
        sender: 'copilot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, copilotMsg]);

      if (voiceEnabled) {
        speakDispatchAlert(replyText, true);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'copilot',
          text: 'Connection to dispatch server delayed. Please check network.',
          timestamp: 'Now'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleReadIntelAloud = () => {
    if (!intel) return;
    const text = `${intel.briefingHeadline}. ${intel.strategicSummary}. Top advice: ${intel.tacticalAdvice.join('. ')}`;
    speakDispatchAlert(text, true);
  };

  const PRESET_QUERIES = [
    `Best move from ${driverLocation}?`,
    `Avoid Stadium Way choke?`,
    `Changi vs Marina Bay yield?`
  ];

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg overflow-hidden shrink-0 flex flex-col">
      {/* Strategic AI Dispatch Briefing Banner */}
      <div className="p-2.5 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-rose-950/30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Sparkles className="w-3 h-3" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-cyan-400">
                  GEMINI 3.8 FLASH DISPATCH
                </span>
                {intel && (
                  <span className="text-[9px] bg-slate-800 text-slate-300 font-mono px-1 py-0.2 rounded">
                    {intel.mcpSignalsProcessed} Signals
                  </span>
                )}
              </div>
              <h2 className="text-xs font-bold text-white truncate">
                {intel?.briefingHeadline || 'Analyzing Singapore transport grid...'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleReadIntelAloud}
              title="Speak Briefing"
              className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-all"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1 py-1 px-2 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700 transition-all"
            >
              <MessageSquare className="w-3 h-3 text-cyan-400" />
              <span>{isOpen ? 'Close' : 'Dispatch'}</span>
              {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Compact Tactical Advice */}
        {intel && (
          <div className="mt-1.5 text-[11px] text-slate-300 leading-tight bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80 flex items-start gap-1.5">
            <span className="text-cyan-400 font-bold shrink-0">▶</span>
            <span className="line-clamp-2">{intel.strategicSummary}</span>
          </div>
        )}
      </div>

      {/* Expandable Chat Drawer (compact & fitted) */}
      {isOpen && (
        <div className="p-2 bg-slate-950/90 border-t border-slate-800 flex flex-col space-y-1.5">
          {/* Quick Query Preset Chips */}
          <div className="flex flex-wrap gap-1">
            {PRESET_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 hover:bg-cyan-900/50 hover:text-cyan-200 border border-slate-700 text-slate-300 transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="max-h-28 overflow-y-auto space-y-1.5 p-1.5 bg-slate-900/70 rounded-lg border border-slate-800/80 text-[11px]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-2.5 py-1 leading-snug ${
                    m.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[8px] text-slate-500 font-mono px-1">
                  {m.timestamp}
                </span>
              </div>
            ))}
            {isSending && (
              <div className="flex items-center gap-1 text-[10px] text-cyan-400 italic">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>Computing dispatch advice...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask dispatch co-pilot..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isSending || !inputMessage.trim()}
              className="p-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold transition-all shadow"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
