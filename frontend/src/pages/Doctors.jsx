import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Phone, MapPin, Building, Clock, Calendar, MessageSquare, AlertCircle, Edit, Trash2, X, Loader2 } from 'lucide-react';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    phone: '',
    address: '',
    hospital1: '',
    hospital2: '',
    doctorSchedule: '',
    nextVisitDate: '',
    reminderNote: '',
    lastFeedback: '',
  });

  const showToast = (msg, type = 'success') => {
    setToastMsg({ text: msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/doctors?search=${searchQuery}`);
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors', error);
      showToast('خطأ في تحميل قائمة الدكاتره', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchDoctors();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleOpenAdd = () => {
    setEditingDoc(null);
    setFormData({
      name: '',
      specialty: '',
      phone: '',
      address: '',
      hospital1: '',
      hospital2: '',
      doctorSchedule: '',
      nextVisitDate: '',
      reminderNote: '',
      lastFeedback: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setEditingDoc(doc);
    setFormData({
      name: doc.name || '',
      specialty: doc.specialty || '',
      phone: doc.phone || '',
      address: doc.address || '',
      hospital1: doc.hospital1 || '',
      hospital2: doc.hospital2 || '',
      doctorSchedule: doc.doctorSchedule || '',
      nextVisitDate: doc.nextVisitDate ? doc.nextVisitDate.slice(0, 16) : '',
      reminderNote: doc.reminderNote || '',
      lastFeedback: doc.lastFeedback || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطبيب؟ سيتم حذف جميع زياراته أيضاً.')) return;
    try {
      await axios.delete(`/doctors/${id}`);
      showToast('تم حذف الدكتور بنجاح');
      setDoctors(doctors.filter((d) => d.id !== id));
    } catch (error) {
      console.error('Error deleting doctor', error);
      showToast('فشل في حذف الدكتور', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('اسم الدكتور مطلوب', 'error');
      return;
    }

    try {
      const payload = {
        ...formData,
        nextVisitDate: formData.nextVisitDate ? new Date(formData.nextVisitDate).toISOString() : null,
      };

      if (editingDoc) {
        const response = await axios.put(`/doctors/${editingDoc.id}`, payload);
        setDoctors(doctors.map((d) => (d.id === editingDoc.id ? response.data : d)));
        showToast('تم تعديل بيانات الدكتور بنجاح');
      } else {
        const response = await axios.post('/doctors', payload);
        setDoctors([response.data, ...doctors]);
        showToast('تم إضافة الدكتور بنجاح');
      }
      setModalOpen(false);
    } catch (error) {
      console.error('Error saving doctor', error);
      showToast('حدث خطأ أثناء الحفظ', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800">
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl transition-all duration-300 flex items-center gap-2 ${
          toastMsg.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Search Bar */}
      <div className="bg-white sticky top-0 z-40 border-b border-slate-100 px-4 py-4 md:max-w-md md:mx-auto md:rounded-t-2xl md:mt-4">
        <div className="relative">
          <input
            type="text"
            className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-right"
            placeholder="ابحث باسم الدكتور أو التخصص..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>
      </div>

      {/* Main List */}
      <main className="max-w-md mx-auto px-4 mt-4">
        {loading && doctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="mt-2 text-xs text-slate-400 font-bold">جاري تحميل قائمة الدكاتره...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <div className="text-4xl mb-2">👨‍⚕️</div>
            <h3 className="text-sm font-extrabold text-slate-700 mb-1">مفيش دكاتره لسه</h3>
            <p className="text-xs text-slate-400">اضغط على الزر العائم في الأسفل لإضافة أول دكتور.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col gap-4 relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-lg font-black shadow-md">
                      {doc.name ? doc.name[2] || '👨‍⚕️' : '👨‍⚕️'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">{doc.name}</h3>
                      <p className="text-xs text-blue-600 font-semibold">{doc.specialty || 'تخصص غير محدد'}</p>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEdit(doc)}
                      className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Grid Info */}
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-50 pt-4">
                  {doc.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{doc.phone}</span>
                    </div>
                  )}
                  {doc.address && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{doc.address}</span>
                    </div>
                  )}
                  {doc.hospital1 && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{doc.hospital1}</span>
                    </div>
                  )}
                  {doc.hospital2 && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{doc.hospital2}</span>
                    </div>
                  )}
                  {doc.doctorSchedule && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{doc.doctorSchedule}</span>
                    </div>
                  )}
                  {doc.nextVisitDate && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate font-semibold">{formatDate(doc.nextVisitDate)}</span>
                    </div>
                  )}
                </div>

                {/* Feedback & Reminders */}
                {doc.lastFeedback && (
                  <div className="bg-slate-50/80 rounded-2xl p-3 border-r-4 border-r-blue-500 text-xs text-slate-700 mt-1">
                    <span className="font-extrabold block mb-1 text-blue-900">💬 آخر فيدباك:</span>
                    <p className="leading-relaxed">{doc.lastFeedback}</p>
                  </div>
                )}
                {doc.reminderNote && (
                  <div className="bg-amber-50/80 rounded-2xl p-3 border-r-4 border-r-amber-500 text-xs text-slate-700 mt-1">
                    <span className="font-extrabold block mb-1 text-amber-900">🗒️ ملاحظة تذكير:</span>
                    <p className="leading-relaxed">{doc.reminderNote}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={handleOpenAdd}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-sm py-3.5 px-6 rounded-full shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all z-40 flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        <span>إضافة دكتور جديد</span>
      </button>

      {/* Slide-Up Bottom Sheet Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center md:items-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md rounded-t-[2rem] md:rounded-[2rem] max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-slide-up text-right">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-slate-900">
                {editingDoc ? '✏️ تعديل بيانات الدكتور' : '➕ إضافة دكتور جديد'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-all text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">اسم الدكتور *</label>
                <input
                  type="text"
                  required
                  placeholder="د. أحمد محمد"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-right"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">التخصص</label>
                  <input
                    type="text"
                    placeholder="باطنة، أطفال..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-right"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">التليفون</label>
                  <input
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-left"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">العنوان</label>
                <input
                  type="text"
                  placeholder="العنوان بالتفصيل"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-right"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">المستشفى الأساسي</label>
                  <input
                    type="text"
                    placeholder="مستشفى عين شمس"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-right"
                    value={formData.hospital1}
                    onChange={(e) => setFormData({ ...formData, hospital1: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">مستشفى ثاني / قسم</label>
                  <input
                    type="text"
                    placeholder="مستشفى السلام"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-right"
                    value={formData.hospital2}
                    onChange={(e) => setFormData({ ...formData, hospital2: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">معاد تواجد الدكتور</label>
                  <input
                    type="text"
                    placeholder="السبت 2 - 6م"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-right"
                    value={formData.doctorSchedule}
                    onChange={(e) => setFormData({ ...formData, doctorSchedule: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">موعد زيارتك القادمة</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-left"
                    value={formData.nextVisitDate}
                    onChange={(e) => setFormData({ ...formData, nextVisitDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">ريمايندر / ملاحظة هامة</label>
                <textarea
                  placeholder="ملاحظات للتذكير بها قبل الزيارة..."
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-right"
                  value={formData.reminderNote}
                  onChange={(e) => setFormData({ ...formData, reminderNote: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">آخر فيدباك</label>
                <textarea
                  placeholder="رد الدكتور أو انطباعه الأخير..."
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-right"
                  value={formData.lastFeedback}
                  onChange={(e) => setFormData({ ...formData, lastFeedback: e.target.value })}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-md transition-all active:scale-[0.98]"
                >
                  💾 حفظ البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-2xl transition-all active:scale-[0.98]"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;
