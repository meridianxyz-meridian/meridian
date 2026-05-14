import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { DEMO_AI_RESULT, DEMO_PATIENT } from '../data/demoData';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

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

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi ${DEMO_PATIENT.name.split(' ')[0]}! I'm your Meridian health advocate. I've reviewed your 12 years of medical records. I found **3 medication interactions** you should know about — including a serious one between Ibuprofen and Lisinopril that could be affecting your kidneys. What would you like to discuss?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const res = await fetch(`${API}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages,
          patientContext: PATIENT_CONTEXT,
        }),
      });

      if (!res.ok) throw new Error('Agent unavailable');

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
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "I'm having trouble connecting to the AI service. Please check your API configuration.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl" style={{ height: 'calc(100vh - 4rem)' }}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">AI Health Advocate</h1>
        <p className="text-slate-400 text-sm mt-1">Powered by Claude • Full access to your health history</p>
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
              {msg.content || (streaming && i === messages.length - 1
                ? <Loader2 className="animate-spin text-teal-400" size={16} />
                : null)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Starter questions */}
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
