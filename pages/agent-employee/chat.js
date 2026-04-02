// pages/agent-employee/chat.js
// Agent employee chats with their agent (same chat system, different channel)
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import { Send, Loader2 } from 'lucide-react';

export default function AgentEmployeeChat() {
  const router  = useRouter();
  const [user, setUser]         = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);

  useEffect(() => {
    init();
    return () => clearInterval(pollRef.current);
  }, []);

  async function init() {
    const meRes = await fetch('/api/auth/me');
    if (!meRes.ok) { router.replace('/login'); return; }
    const data = await meRes.json();
    const me = data.user || data;
    if (me.role !== 'agent_employee') { router.replace('/login'); return; }
    setUser(me);
    await fetchMessages();
    setLoading(false);
    // Poll every 5s
    pollRef.current = setInterval(fetchMessages, 5000);
  }

  async function fetchMessages() {
    try {
      const r = await fetch('/api/agent-employee/chat');
      if (r.ok) {
        const d = await r.json();
        setMessages(d.messages || []);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch {}
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await fetch('/api/agent-employee/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      });
      setText('');
      await fetchMessages();
    } catch {}
    setSending(false);
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  // Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const day = new Date(msg.created_at).toDateString();
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  return (
    <AdminLayout title="Chat with Agent">
      <div className="max-w-3xl mx-auto">

        {/* Chat header */}
        <div className="bg-white rounded-t-2xl border border-slate-200 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-bold text-sm">
            {(user?.agentName || 'A').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-800">{user?.agentName || 'Your Agent'}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Available
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-slate-50 border-x border-slate-200 px-5 py-4 overflow-y-auto"
          style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-1">Send a message to start the conversation</p>
            </div>
          ) : (
            Object.entries(grouped).map(([day, msgs]) => (
              <div key={day}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium">{formatDate(msgs[0].created_at)}</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {msgs.map(msg => {
                  // agent_employee is the sender — their messages go right
                  const isMine = msg.sender_role === 'agent_employee';
                  return (
                    <div key={msg.id} className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 mr-2 mt-1">
                          {(msg.sender_name || 'A').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className={`max-w-xs lg:max-w-md ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isMine && (
                          <span className="text-[10px] text-slate-400 mb-1 ml-1">{msg.sender_name}</span>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                          isMine
                            ? 'bg-emerald-600 text-white rounded-br-sm'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                        }`}>
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 mx-1">{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 px-4 py-3">
          <form onSubmit={sendMessage} className="flex items-center gap-3">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 transition-colors"
            />
            <button type="submit" disabled={!text.trim() || sending}
              className="w-10 h-10 flex items-center justify-center bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          <p className="text-[10px] text-slate-400 mt-1.5 text-center">Auto-refreshes every 5 seconds</p>
        </div>
      </div>
    </AdminLayout>
  );
}