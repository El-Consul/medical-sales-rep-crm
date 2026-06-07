import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (open) {
      // scroll to bottom when open
      setTimeout(() => containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
    }
  }, [open, messages]);

  const clearChat = () => setMessages([]);

  const sendAI = async (text) => {
    try {
      setLoading(true);
      // fetch CRM data to inject
      const [docsRes, visitsRes] = await Promise.all([axios.get('/doctors'), axios.get('/visits')]);
      const doctors_json = JSON.stringify(docsRes.data || []);
      const visits_json = JSON.stringify(visitsRes.data || []);

      const systemPrompt = `أنت مساعد ذكي لمندوب المبيعات الطبي.\nعندك البيانات دي:\n- الدكاتره: ${doctors_json}\n- الزيارات: ${visits_json}\nأجاوب على أسئلة المندوب بالعربي بشكل مختصر ومفيد.`;

      const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'assistant', text: 'مفتاح Claude غير مضبوط. تواصل مع الأدمن.' }]);
        setLoading(false);
        return;
      }

      const payload = {
        model: 'claude-sonnet-4-20250514',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ]
      };

      const res = await fetch(CLAUDE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Claude request failed');
      }

      const data = await res.json();
      // Claude response shape: choose assistant reply
      const aiText = data?.completion || data?.choices?.[0]?.message?.content || JSON.stringify(data);

      setMessages(prev => [...prev, { role: 'assistant', text: aiText }]);
    } catch (err) {
      console.error('Claude error', err);
      setMessages(prev => [...prev, { role: 'assistant', text: 'حدث خطأ في استدعاء المساعد AI.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    const text = input;
    setInput('');
    await sendAI(text);
  };

  return (
    <>
      {/* Floating button bottom-left */}
      <button onClick={() => setOpen(o => !o)} className="fixed bottom-28 left-4 z-50 bg-indigo-600 text-white p-3 rounded-full shadow-lg">
        🤖
      </button>

      {open && (
        <div className="fixed inset-x-4 bottom-4 z-50 md:inset-x-auto md:right-6 md:bottom-6 md:w-96 max-w-md">
          <div className="bg-white rounded-t-2xl shadow-2xl overflow-hidden text-right">
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <div className="font-bold">مساعد CRM</div>
              <div className="flex items-center gap-2">
                <button onClick={clearChat} className="text-xs text-slate-500">مسح</button>
                <button onClick={() => setOpen(false)} className="text-xs text-slate-500">إغلاق</button>
              </div>
            </div>
            <div className="h-64 overflow-y-auto p-3 space-y-3" style={{direction: 'rtl'}}>
              {messages.length === 0 && <div className="text-xs text-slate-400">اطرح سؤالاً عن بياناتك، مثال: "كام زيارة عملت الأسبوع ده؟"</div>}
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`${m.role === 'user' ? 'bg-slate-100 text-right' : 'bg-indigo-50 text-right'} p-3 rounded-xl max-w-[80%]`}>
                    <div className="text-sm">{m.text}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-end">
                  <div className="bg-indigo-50 p-2 rounded-xl">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"/> <div className="text-xs">جاري التحميل...</div></div>
                  </div>
                </div>
              )}
              <div ref={containerRef} />
            </div>
            <div className="p-3 border-t flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="اكتب سؤالك..." className="flex-1 p-2 rounded-xl border text-right" />
              <button onClick={handleSend} className="bg-indigo-600 text-white px-4 py-2 rounded-xl">إرسال</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
