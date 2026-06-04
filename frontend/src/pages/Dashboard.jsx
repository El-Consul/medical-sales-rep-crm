import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, Calendar, Clock, Bell, LogOut, RefreshCw, ChevronRight } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalVisits: 0,
    upcomingVisits: 0,
    todayVisits: 0,
  });
  const [todayReminders, setTodayReminders] = useState([]);
  const [recentVisits, setRecentVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMsg({ text: msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [docsRes, visitsRes] = await Promise.all([
        axios.get('/doctors'),
        axios.get('/visits'),
      ]);

      const doctors = docsRes.data;
      const visits = visitsRes.data;

      // Calculations
      const todayStr = new Date().toDateString();
      const now = new Date();

      const upcoming = visits.filter(v => v.nextVisitDate && new Date(v.nextVisitDate) > now).length;
      const today = visits.filter(v => v.nextVisitDate && new Date(v.nextVisitDate).toDateString() === todayStr);

      setStats({
        totalDoctors: doctors.length,
        totalVisits: visits.length,
        upcomingVisits: upcoming,
        todayVisits: today.length,
      });

      setTodayReminders(today);

      // Sort and slice top 3 recent visits
      const sortedVisits = [...visits].sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
      setRecentVisits(sortedVisits.slice(0, 3));
    } catch (error) {
      console.error('Failed to load dashboard data', error);
      showToast('خطأ في تحميل البيانات', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);



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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 pb-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-3 text-sm text-slate-500 font-semibold">جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl transition-all duration-300 flex items-center gap-2 ${
          toastMsg.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Sync Loader */}


      {/* Header */}
      <header className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-b-[2.5rem] px-6 pt-8 pb-12 shadow-lg md:max-w-md md:mx-auto md:rounded-2xl md:mt-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black mb-1">مرحباً، {user?.name || 'مندوبنا'}</h1>
            <p className="text-xs text-blue-100">إدارة عملك الميداني بكل سهولة</p>
          </div>
          <div className="flex gap-2">

            <button
              onClick={logout}
              className="p-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/10 rounded-2xl transition-all active:scale-95 text-red-200"
              title="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 -mt-6">
        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center gap-4">
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none mb-1">{stats.totalDoctors}</div>
              <div className="text-xs text-slate-400 font-semibold">الدكاتره</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center gap-4">
            <div className="p-3.5 bg-green-50 text-green-600 rounded-2xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none mb-1">{stats.totalVisits}</div>
              <div className="text-xs text-slate-400 font-semibold">الزيارات</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center gap-4">
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none mb-1">{stats.upcomingVisits}</div>
              <div className="text-xs text-slate-400 font-semibold">زيارات قادمة</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center gap-4">
            <div className="p-3.5 bg-red-50 text-red-600 rounded-2xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none mb-1">{stats.todayVisits}</div>
              <div className="text-xs text-slate-400 font-semibold">النهارده</div>
            </div>
          </div>
        </section>

        {/* Today's Reminders */}
        <section className="mt-8">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <span>🔔</span> تذكيرات النهارده
          </h2>
          {todayReminders.length === 0 ? (
            <div className="bg-gradient-to-br from-amber-50/50 to-white rounded-3xl p-6 text-center border border-amber-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="text-3xl mb-2">🎉</div>
              <h3 className="text-sm font-extrabold text-amber-800 mb-1">مفيش زيارات مبرمجة النهارده</h3>
              <p className="text-xs text-slate-400">استمتع بيومك أو رتب زيارات جديدة!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayReminders.map((reminder) => {
                const hour = new Date(reminder.nextVisitDate).toLocaleTimeString('ar-EG', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={reminder.id}
                    className="bg-white rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 border-r-4 border-r-amber-500 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{reminder.doctor?.name || 'دكتور غير معروف'}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {reminder.location || 'عيادة الدكتور'} • {reminder.visitType}
                      </p>
                    </div>
                    <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-black rounded-full">
                      {hour}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Visits */}
        <section className="mt-8">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <span>📋</span> آخر الزيارات المسجلة
          </h2>
          {recentVisits.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">لم يتم تسجيل أي زيارات بعد.</p>
          ) : (
            <div className="space-y-3">
              {recentVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="bg-white rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center gap-4"
                >
                  <div className="bg-slate-50 rounded-2xl w-12 h-12 flex flex-col items-center justify-center flex-shrink-0 text-slate-700">
                    <span className="text-lg font-black leading-none">
                      {new Date(visit.visitDate).getDate()}
                    </span>
                    <span className="text-[9px] font-bold mt-1 text-slate-400">
                      {new Date(visit.visitDate).toLocaleDateString('ar-EG', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <h3 className="font-bold text-slate-950 text-sm truncate">{visit.doctor?.name}</h3>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-bold flex-shrink-0">
                        {visit.visitType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-1">{visit.location || 'بدون مكان'}</p>
                    {visit.feedback && (
                      <p className="text-[11px] text-slate-600 bg-slate-50/80 px-2 py-1 rounded-lg border-r-2 border-r-blue-400 mt-2 truncate">
                        💬 {visit.feedback}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
