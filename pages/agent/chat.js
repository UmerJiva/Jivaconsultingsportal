// pages/agent/chat.js — Agent live chat with admin
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { Spinner } from '../../components/ui/index';
import { MessageSquare, Send, Loader2, CheckCircle, RefreshCw, Check, CheckCheck } from 'lucide-react';

export default function AgentChat() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage]   = useState('');
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [agentId, setAgentId]   = useState(null);
  const [user, setUser]         = useState(null);
  const bottomRef = useRef(null);

  // Step 1: get agent's own roleId from /api/auth/me or /api/agent/me
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        setUser(d.user);
        // roleId is the agents table ID
        if (d.user?.roleId) {
          setAgentId(d.user.roleId);
        } else {
          // Fallback: fetch from dedicated endpoint
          fetch('/api/agent/me').then(r=>r.json()).then(a=>{
            if (a.agent_id) setAgentId(a.agent_id);
          });
        }
      });
  }, []);

  // Step 2: load messages once we have agentId
  async function loadMessages() {
    if (!agentId) return;
    try {
      const d = await fetch(`/api/chat/${agentId}`).then(r => r.json());
      setMessages(d.messages || []);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (agentId) { setLoading(true); loadMessages(); }
  }, [agentId]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll every 5 seconds
  useEffect(() => {
    if (!agentId) return;
    const t = setInterval(loadMessages, 5000);
    return () => clearInterval(t);
  }, [agentId]);

  async function handleSend() {
    if (!message.trim() || !agentId) return;
    setSending(true);
    const text = message.trim();
    setMessage('');
    try {
      await fetch(`/api/chat/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      await loadMessages();
    } catch {}
    finally { setSending(false); }
  }

  const firstName = user?.name?.split(' ')[0] || 'Agent';

  return (
    <AdminLayout title="Chat with Admin">
      <div className="max-w-3xl mx-auto">

        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-700 rounded-xl flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-white"/>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg" style={{fontFamily:'Georgia,serif'}}>Chat with Admin</h2>
              <p className="text-sm text-slate-500">Direct communication with your account manager</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
              <span className="text-xs font-semibold text-emerald-700">Online</span>
            </div>
            <button onClick={loadMessages}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors">
              <RefreshCw className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {/* Chat window */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
          style={{height:'calc(100vh - 200px)', minHeight:'500px'}}>

          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-brand-800 to-brand-600 shrink-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <div className="font-bold text-white">EduPortal Admin</div>
              <div className="text-brand-200 text-xs flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"/>
                Available · Typically replies within an hour
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
            {loading ? (
              <div className="flex justify-center py-10"><Spinner size="lg"/></div>
            ) : !agentId ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-40"/>
                <p className="text-sm">Connecting to chat…</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-brand-300"/>
                </div>
                <h3 className="font-bold text-slate-500 mb-1">Start a conversation</h3>
                <p className="text-sm max-w-sm">Send a message to admin. They'll respond as soon as possible.</p>
              </div>
            ) : messages.map((msg, i) => {
              const isMe  = msg.sender_role === 'agent';
              const date  = new Date(msg.created_at);
              const time  = date.toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'});
              const showDate = i===0 || new Date(messages[i-1].created_at).toDateString() !== date.toDateString();
              return (
                <div key={msg.id || i}>
                  {showDate && (
                    <div className="flex items-center gap-2 my-3">
                      <div className="flex-1 h-px bg-slate-200"/>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {date.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'})}
                      </span>
                      <div className="flex-1 h-px bg-slate-200"/>
                    </div>
                  )}
                  <div className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm ${isMe ? 'bg-brand-600' : 'bg-slate-600'}`}>
                      {isMe ? firstName[0] : 'A'}
                    </div>
                    {/* Bubble */}
                    <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : ''}`}>
                      <div className={`text-[10px] text-slate-400 mb-1 ${isMe ? 'text-right' : ''}`}>
                        {isMe ? 'You' : (msg.sender_name || 'Admin')} · {time}
                      </div>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
                        ${isMe
                          ? 'bg-brand-600 text-white rounded-tr-sm'
                          : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'}`}>
                        {msg.message}
                      </div>
                      {isMe && (
                        <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400">
                          {msg.is_read
                            ? <><CheckCheck className="w-3 h-3 text-brand-500"/>Read</>
                            : <><Check className="w-3 h-3"/>Delivered</>
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-slate-200 bg-white shrink-0">
            <div className="flex gap-3">
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={agentId ? "Type your message to admin… (Enter to send)" : "Connecting…"}
                disabled={!agentId}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white transition-colors disabled:opacity-50"/>
              <button onClick={handleSend} disabled={sending || !message.trim() || !agentId}
                className="px-5 py-3 bg-brand-700 hover:bg-brand-800 text-white rounded-2xl transition-colors disabled:opacity-50 shadow-sm font-bold flex items-center gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                Send
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Press Enter to send · Auto-refreshes every 5 seconds
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}