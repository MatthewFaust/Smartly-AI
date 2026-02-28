// Mail/Chat page — AI assistant with lead-based conversation sidebar
import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import api from '@/lib/api';

function Avatar({ name }) {
  const letter = (name || 'A').charAt(0).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-[#E8E4FF] flex items-center justify-center flex-shrink-0">
      <span className="text-[#6B4EFF] text-sm font-semibold">{letter}</span>
    </div>
  );
}

function PurpleCheck() {
  return (
    <div className="w-5 h-5 bg-[#6B4EFF] rounded-sm flex items-center justify-center flex-shrink-0">
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
        <path d="M1 3.5L3.5 6L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function MailPage() {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/leads')
      .then(r => setLeads(r.data.leads))
      .catch(err => console.error('Mail: fetch leads error:', err.message));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const contextMsg = selectedLead
        ? `[Context: client is ${selectedLead.name}]\n${text}`
        : text;
      const res = await api.post('/chat', {
        message: contextMsg,
        chatHistory: updated.slice(0, -1),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      console.error('Mail: chat error:', err.message);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error — could not reach backend.' }]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = leads.filter(l =>
    !search || (l.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Left sidebar — 320px, matches Figma chat list */}
      <div className="w-80 flex-shrink-0 bg-white flex flex-col border-r border-gray-100">
        {/* New Chat button */}
        <button
          onClick={() => { setSelectedLead(null); setMessages([]); }}
          className="flex items-center justify-between px-5 py-4 text-sm font-medium text-[#1A1A2E] hover:bg-[#F0EEF8] transition-colors border-b border-gray-100"
        >
          <span>New Chat</span>
          <ChevronRight size={16} className="text-gray-400" />
        </button>

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-sm text-gray-400 mb-1">Search</p>
          <div className="border-b border-gray-200 pb-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter clients..."
              className="w-full text-sm outline-none text-gray-600 placeholder-gray-300 bg-transparent"
            />
          </div>
        </div>

        {/* Lead list */}
        <div className="flex-1 overflow-y-auto pt-1">
          {filtered.map(lead => (
            <button
              key={lead.id}
              onClick={() => { setSelectedLead(lead); setMessages([]); }}
              className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                selectedLead?.id === lead.id ? 'bg-[#F0EEF8]' : 'hover:bg-gray-50'
              }`}
            >
              <Avatar name={lead.name} />
              <span className="flex-1 text-sm text-[#1A1A2E] truncate">{lead.name || 'Unknown'}</span>
              <PurpleCheck />
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Conversation scroll area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 relative">
          {messages.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              {/* Faint ghost shapes — matches Figma empty state */}
              <div className="absolute w-80 h-80 rounded-full bg-[#F0EEF8] opacity-60 -translate-x-16 -translate-y-16" />
              <div className="absolute w-56 h-56 rounded-full bg-[#E8E4FF] opacity-40 translate-x-24 translate-y-20" />
            </div>
          )}

          <div className="space-y-4 max-w-2xl mx-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#6B4EFF] text-white'
                    : 'bg-[#EEEAF6] text-[#1A1A2E]'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#EEEAF6] rounded-2xl px-4 py-3 text-sm text-gray-400">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Bottom input bar — matches Figma exactly */}
        <div className="bg-[#F5F5F8] border-t border-gray-100 px-6 py-3 flex items-center gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder="What on your mind ?"
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="text-gray-400 hover:text-[#6B4EFF] disabled:opacity-30 transition-colors"
          >
            <Search size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
