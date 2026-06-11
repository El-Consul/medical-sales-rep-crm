import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Plus, CheckSquare, Trash2 } from 'lucide-react';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ doctorId: '', title: '', dueDate: '', notes: '' });

  const fetch = async () => {
    try {
      setLoading(true);
      const [tRes, dRes] = await Promise.all([axios.get('/tasks'), axios.get('/doctors')]);
      setTasks(tRes.data);
      setDoctors(dRes.data);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!form.title || !form.doctorId) return;
    try {
      const res = await axios.post('/tasks', form);
      setTasks([res.data, ...tasks]);
      setForm({ doctorId: '', title: '', dueDate: '', notes: '' });
    } catch (e) { console.error(e); }
  };

  const toggleDone = async (id) => {
    try {
      const res = await axios.put(`/tasks/${id}/done`);
      setTasks(tasks.map(t => t.id === id ? res.data : t));
    } catch (e) { console.error(e); }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;
    try {
      await axios.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen pb-24 text-slate-800 bg-slate-50">
      <div className="max-w-md mx-auto px-4 pt-4">
        <h2 className="text-lg font-black text-slate-900 mb-3">🗒️ المهام</h2>
        <form onSubmit={create} className="bg-white p-4 rounded-2xl shadow border border-slate-100 text-right space-y-3">
          <select required value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })} className="w-full p-3 rounded-xl border text-sm text-right">
            <option value="">اختر دكتور...</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="عنوان المهمة" className="w-full p-3 rounded-xl border text-sm text-right" />
          <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full p-3 rounded-xl border text-sm text-right" />
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="ملاحظات" className="w-full p-3 rounded-xl border text-sm text-right" />
          <div className="flex gap-3">
            <button className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold"> <Plus className="inline w-4 h-4 mr-2"/> اضافة</button>
          </div>
        </form>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></div>
          ) : tasks.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl text-center border">لا توجد مهام</div>
          ) : (
            tasks.map(t => (
              <div key={t.id} className={`bg-white p-4 rounded-2xl border flex items-center justify-between ${!t.isDone && t.dueDate && new Date(t.dueDate) < new Date() ? 'border-red-400' : 'border-slate-100'}`}>
                <div className="text-right flex-1">
                  <div className="font-bold">{t.title}</div>
                  <div className="text-xs text-slate-500">{t.doctor?.name} • {t.dueDate ? new Date(t.dueDate).toLocaleDateString('ar-EG') : 'بدون موعد'}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleDone(t.id)} className={`p-2 rounded-lg ${t.isDone ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'}`}><CheckSquare className="w-5 h-5"/></button>
                  <button onClick={() => deleteTask(t.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"><Trash2 className="w-5 h-5"/></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
