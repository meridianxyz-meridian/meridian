import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Trash2 } from 'lucide-react';
import { DEMO_AI_RESULT, DEMO_PATIENT } from '../data/demoData';
import { useAuth } from '../hooks/useAuth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const API = '';

const PATIENT_CONTEXT = `
Patient: ${DEMO_PATIENT.name}, DOB: ${DEMO_PATIENT.dob}
Conditions: ${DEMO_PATIENT.conditions.join(', ')}
Current medications: ${DEMO_PATIENT.currentMedications.join(', ')}
AI Summary: ${DEMO_AI_RESULT.summary}
Urgent flags: ${DEMO_AI_RESULT.urgentFlags.join('; ')}
`.trim();

const STARTER_QUESTIONS = [
  'What are my most urgent health concerns?',
  'Explain my medication interactions in simple terms',
  'Should I be worried about my kidney function trend?',
  'Prepare a briefing for my new doctor',
];

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: `Hi ${DEMO_PATIENT.name.split(' ')[0]}! I'm your Meridian health advocate. I've reviewed your 12 years of medical records. I found **3 medication interactions** you should know about — including a serious one between Ibuprofen and Lisinopril that could be affecting your kidneys. What would you like to discuss?`,
  timestamp: 0,
};

function getHistoryKey(address: string) {
  return `meridian_chat_${address}`;
}

export function AgentChat() {
  const { address } = useAuth();
  const storageKey = getHistoryKey(address ?? 'demo');

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved) as Message[];
    } catch {}
    return [INITIAL_MESSAGE];
  });

  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Persist history to localStorage on every change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearHistory = () => {
    localStorage.removeItem(storageKey);
    setMessages([INITIAL_MESSAGE]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setStreaming(true);

    const assistantMsg: Message = { role: 'assistant', content: '', timestamp: Date.now() };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      // Send only actual conversation (skip initial greeting, only user/assistant pairs)
      const history = updatedMessages
        .slice(1)
        .filter(m => m.content)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, patientContext: PATIENT_CONTEXT }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(`${res.status}: ${errData.error ?? res.statusText}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const { text: chunk } = JSON.parse(data);
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: updated[updated.length - 1].content + chunk,
              };
              return updated;
            });
          } catch {}
        }
      }
    } catch (err: any) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: `Error: ${err?.message ?? String(err)}`,
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col max-w-3xl" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">AI Health Advocate</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Powered by Gemini · {messages.length - 1} messages in history
            {address && <span className="ml-2 text-slate-600">· {address.slice(0, 8)}...</span>}
          </p>
        </div>
        <button
          onClick={clearHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-lg text-xs text-slate-400 hover:text-red-400 transition-colors"
          title="Clear chat history"
        >
          <Trash2 size={13} /> Clear history
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center
              ${msg.role === 'assistant' ? 'bg-teal-500/20' : 'bg-slate-700'}`}>
              {msg.role === 'assistant'
                ? <Bot className="text-teal-400" size={16} />
                : <User className="text-slate-400" size={16} />}
            </div>
            <div className={`glass rounded-xl px-4 py-3 max-w-[80%] text-sm leading-relaxed
              ${msg.role === 'user' ? 'bg-teal-500/10 border-teal-500/20' : ''}`}>
              {msg.content
                ? msg.content
                : (streaming && i === messages.length - 1
                  ? <Loader2 className="animate-spin text-teal-400" size={16} />
                  : null)}
              {msg.timestamp > 0 && (
                <div className="text-xs text-slate-600 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Starter questions — show when only initial message */}
      {messages.length === 1 && (
        <div className="flex gap-2 flex-wrap my-3">
          {STARTER_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs px-3 py-1.5 glass rounded-full text-slate-400 hover:text-teal-400 hover:border-teal-500/30 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3 mt-4">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ask about your health..."
          disabled={streaming}
          className="flex-1 bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || streaming}
          className="px-4 py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-xl transition-colors disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
