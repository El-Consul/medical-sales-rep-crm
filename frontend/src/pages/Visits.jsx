import React, { useState, useEffect } from 'react';
import axios from 'axios';
import emailjs from '@emailjs/browser';
import { Search, Plus, Calendar, MapPin, Activity, FileText, MessageSquare, Clock, Trash2, X, ChevronDown, ChevronUp, Loader2, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Default EmailJS keys from mockup, customizable via env
const EJS_SID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_p03czby';
const EJS_TID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_s3o0jw8';
const EJS_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'yYP8EIx-AyYjhs9B7';

const Visits = () => {
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedVisitId, setExpandedVisitId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    doctorId: '',
    visitDate: '',
    visitType: 'زيارة عادية',
    location: '',
    notes: '',
    feedback: '',
    nextVisitDate: '',
    reminderMinutesBefore: 60,
  });

  const showToast = (msg, type = 'success') => {
    setToastMsg({ text: msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchVisitsAndDoctors = async () => {
    try {
      setLoading(true);
      const [visitsRes, docsRes] = await Promise.all([
        axios.get(`/visits?search=${searchQuery}`),
        axios.get('/doctors'),
      ]);
      setVisits(visitsRes.data);
      setDoctors(docsRes.data);
    } catch (error) {
      console.error('Error loading visits data', error);
      showToast('خطأ في تحميل البيانات', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchVisitsAndDoctors();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Request browser notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleOpenAdd = () => {
    const now = new Date();
    // Offset local timezone ISO string
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const defaultDate = now.toISOString().slice(0, 16);

    setFormData({
      doctorId: '',
      visitDate: defaultDate,
      visitType: 'زيارة عادية',
      location: '',
      notes: '',
      feedback: '',
      nextVisitDate: '',
      reminderMinutesBefore: 60,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('هل تريد حذف سجل هذه الزيارة؟')) return;
    try {
      await axios.delete(`/visits/${id}`);
      showToast('تم حذف سجل الزيارة بنجاح');
      setVisits(visits.filter((v) => v.id !== id));
    } catch (error) {
      console.error('Error deleting visit', error);
      showToast('فشل في حذف سجل الزيارة', 'error');
    }
  };

  const handleExportExcel = async () => {
    try {
      showToast('جاري تحضير ملف الإكسل...', 'info');
      const response = await axios.get('/visits/export', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `الزيارات_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('تم تحميل ملف الإكسل بنجاح');
    } catch (error) {
      console.error('Error exporting visits to Excel', error);
      showToast('حدث خطأ أثناء تصدير ملف الإكسل', 'error');
    }
  };

  const toggleExpand = (id) => {
    setExpandedVisitId(expandedVisitId === id ? null : id);
  };

  const getReminderLabel = (minutes) => {
    if (minutes === 0) return 'وقت الزيارة';
    if (minutes === 60) return 'قبلها بساعة';
    if (minutes === 180) return 'قبلها 3 ساعات';
    if (minutes === 1440) return 'قبلها يوم';
    if (minutes === 2880) return 'قبلها يومين';
    return `${minutes} دقيقة`;
  };

  // Schedule email using EmailJS
  const triggerEmailJS = (visitData, doctorName) => {
    if (!user?.reminderEmail || !visitData.nextVisitDate) return;

    const nextDate = new Date(visitData.nextVisitDate);
    const fireTime = new Date(nextDate.getTime() - (visitData.reminderMinutesBefore * 60 * 1000));
    const delay = fireTime - new Date();

    const sendEmail = () => {
      emailjs.init(EJS_KEY);
      emailjs.send(EJS_SID, EJS_TID, {
        to_email: user.reminderEmail,
        doctor_name: doctorName,
        visit_time: formatDate(visitData.nextVisitDate),
        visit_location: visitData.location || 'غير محدد',
        visit_type: visitData.visitType || 'زيارة',
        notes: visitData.notes || '',
        reminder: getReminderLabel(visitData.reminderMinutesBefore),
      })
      .then(() => console.log('Email sent successfully'))
      .catch((err) => console.error('Email failed to send', err));
    };

    if (delay > 0) {
      setTimeout(sendEmail, delay);
    } else if (nextDate > new Date()) {
      sendEmail();
    }
  };

  // Schedule local push notification
  const triggerLocalNotification = (visitData, doctorName) => {
    if (!visitData.nextVisitDate) return;

    const nextDate = new Date(visitData.nextVisitDate);
    const fireTime = new Date(nextDate.getTime() - (visitData.reminderMinutesBefore * 60 * 1000));
    const delay = fireTime - new Date();

    const showNotif = () => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`🏥 تذكير بزيارة قادمة`, {
          body: `لديك موعد مع: ${doctorName} في ${formatDate(visitData.nextVisitDate)}`,
        });
      }
    };

    if (delay > 0) {
      setTimeout(showNotif, delay);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctorId || !formData.visitDate) {
      showToast('يرجى اختيار الدكتور وتحديد تاريخ الزيارة', 'error');
      return;
    }

    try {
      const selectedDoc = doctors.find(d => d.id === formData.doctorId);
      const docName = selectedDoc ? selectedDoc.name : 'الطبيب';

      const payload = {
        ...formData,
        visitDate: new Date(formData.visitDate).toISOString(),
        nextVisitDate: formData.nextVisitDate ? new Date(formData.nextVisitDate).toISOString() : null,
      };

      const response = await axios.post('/visits', payload);
      const newVisit = {
        ...response.data,
        doctor: {
          name: docName,
          specialty: selectedDoc?.specialty || ''
        }
      };

      setVisits([newVisit, ...visits]);
      showToast('تم تسجيل الزيارة بنجاح');
      setModalOpen(false);

      // Trigger reminder schedulers
      if (formData.nextVisitDate) {
        triggerEmailJS(payload, docName);
        triggerLocalNotification(payload, docName);
      }
    } catch (error) {
      console.error('Error saving visit', error);
      showToast('حدث خطأ أثناء تسجيل الزيارة', 'error');
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
        <div className="flex gap-2 items-center">
          <button
            onClick={handleExportExcel}
            type="button"
            className="flex items-center justify-center gap-1.5 px-3 py-3 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-bold text-xs rounded-xl transition-all active:scale-[0.98] cursor-pointer"
            title="تصدير إكسل"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير إكسل</span>
          </button>
          <div className="relative flex-1">
            <input
              type="text"
              className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-right"
              placeholder="ابحث باسم الدكتور، الملاحظات، الفيدباك..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* List */}
      <main className="max-w-md mx-auto px-4 mt-4">
        {loading && visits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="mt-2 text-xs text-slate-400 font-bold">جاري تحميل الزيارات...</p>
          </div>
        ) : visits.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <div className="text-4xl mb-2">📅</div>
            <h3 className="text-sm font-extrabold text-slate-700 mb-1">لا توجد زيارات مسجلة</h3>
            <p className="text-xs text-slate-400">اضغط على الزر في الأسفل لتسجيل أول زيارة ميدانية.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((visit) => {
              const isExpanded = expandedVisitId === visit.id;
              const vDate = new Date(visit.visitDate);
              const day = vDate.getDate();
              const month = vDate.toLocaleDateString('ar-EG', { month: 'short' });

              return (
                <div
                  key={visit.id}
                  onClick={() => toggleExpand(visit.id)}
                  className="bg-white rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 cursor-pointer transition-all hover:shadow-[0_6px_25px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-start gap-4">
                    {/* Date Block */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl w-12 h-12 flex flex-col items-center justify-center flex-shrink-0 text-slate-800">
                      <span className="text-lg font-black leading-none">{day}</span>
                      <span className="text-[9px] font-bold mt-1 text-slate-400">{month}</span>
                    </div>

                    {/* Summary Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-extrabold text-slate-900 text-sm truncate">
                          {visit.doctor?.name || 'طبيب محذوف'}
                        </h3>
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full font-extrabold flex-shrink-0">
                          {visit.visitType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-1">
                        📍 {visit.location || 'غير محدد'}
                      </p>
                      {visit.feedback && !isExpanded && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border-r-2 border-r-green-500 mt-2 truncate">
                          💬 {visit.feedback}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400 font-bold border-t border-slate-50 pt-2.5">
                        <span>انقر {isExpanded ? 'لغلق التفاصيل ▲' : 'لعرض التفاصيل ▼'}</span>
                        <button
                          onClick={(e) => handleDelete(visit.id, e)}
                          className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded View */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-700 animate-slide-up text-right">
                      {visit.notes && (
                        <div className="bg-slate-50 rounded-2xl p-3 border-r-4 border-r-slate-400">
                          <span className="font-extrabold text-slate-900 block mb-1">📝 ملاحظات الزيارة:</span>
                          <p className="leading-relaxed">{visit.notes}</p>
                        </div>
                      )}
                      {visit.feedback && (
                        <div className="bg-green-50/50 rounded-2xl p-3 border-r-4 border-r-green-500">
                          <span className="font-extrabold text-green-900 block mb-1">💬 فيدباك الدكتور:</span>
                          <p className="leading-relaxed text-green-950">{visit.feedback}</p>
                        </div>
                      )}
                      {visit.nextVisitDate && (
                        <div className="flex flex-col gap-1 px-1">
                          <div className="flex justify-between items-center py-1">
                            <span className="text-slate-400 font-bold">موعد الزيارة القادمة:</span>
                            <span className="font-extrabold text-slate-900">{formatDate(visit.nextVisitDate)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-t border-slate-50">
                            <span className="text-slate-400 font-bold">موعد التذكير المحدد:</span>
                            <span className="font-extrabold text-slate-900">{getReminderLabel(visit.reminderMinutesBefore)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={handleOpenAdd}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-sm py-3.5 px-6 rounded-full shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all z-40 flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        <span>تسجيل زيارة جديدة</span>
      </button>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center md:items-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md rounded-t-[2rem] md:rounded-[2rem] max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-slide-up text-right">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-slate-900">📅 تسجيل زيارة جديدة</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-all text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">الدكتور *</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 transition-all text-right"
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                >
                  <option value="">اختر دكتور...</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.specialty ? `(${d.specialty})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">تاريخ ووقت الزيارة *</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 transition-all text-left"
                    value={formData.visitDate}
                    onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">نوع الزيارة</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 transition-all text-right"
                    value={formData.visitType}
                    onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                  >
                    <option value="زيارة عادية">زيارة عادية</option>
                    <option value="تقديم منتج">تقديم منتج</option>
                    <option value="فولو أب">فولو أب</option>
                    <option value="تسليم عينات">تسليم عينات</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">المستشفى / العيادة (المكان)</label>
                <input
                  type="text"
                  placeholder="مثال: مستشفى السلام"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-right"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">ملاحظات الزيارة</label>
                <textarea
                  placeholder="اكتب ما تم مناقشته خلال الزيارة..."
                  rows={2.5}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-right"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">فيدباك / رد فعل الدكتور</label>
                <textarea
                  placeholder="فيدباك الدكتور ورأيه في المنتج..."
                  rows={2.5}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-right"
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                />
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">موعد الزيارة القادمة (اختياري)</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 transition-all text-left"
                  value={formData.nextVisitDate}
                  onChange={(e) => setFormData({ ...formData, nextVisitDate: e.target.value })}
                />
              </div>

              {formData.nextVisitDate && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 mb-2">🔔 متى تود تلقي التذكير بالزيارة القادمة؟</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { val: 0, label: 'وقت الزيارة' },
                      { val: 60, label: 'قبلها بساعة' },
                      { val: 180, label: 'قبلها بـ 3 ساعات' },
                      { val: 1440, label: 'قبلها بيوم' },
                      { val: 2880, label: 'قبلها بيومين' },
                    ].map((rem) => (
                      <button
                        key={rem.val}
                        type="button"
                        onClick={() => setFormData({ ...formData, reminderMinutesBefore: rem.val })}
                        className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                          formData.reminderMinutesBefore === rem.val
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {rem.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-md transition-all active:scale-[0.98]"
                >
                  💾 حفظ الزيارة
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

export default Visits;
