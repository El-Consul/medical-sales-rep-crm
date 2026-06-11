import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, BarChart2, Smile, ArrowDownToLine, Loader2, Sparkles } from 'lucide-react';

const Reports = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('week'); // 'week' | 'month'
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/visits');
        setVisits(res.data);
      } catch (e) {
        console.error('Failed to fetch visits for reports', e);
      } finally {
        setLoading(false);
      }
    };
    fetchVisits();
  }, []);

  // Filter visits based on week (7 days) or month (30 days)
  const now = new Date();
  const getFilteredVisits = () => {
    const cutoffDate = new Date();
    if (filterMode === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else {
      cutoffDate.setDate(now.getDate() - 30);
    }
    return visits.filter(v => new Date(v.visitDate) >= cutoffDate);
  };

  const filteredVisits = getFilteredVisits();

  // 1. Visit Count
  const visitCount = filteredVisits.length;

  // 2. Visit Type Breakdown
  const typeCounts = {};
  filteredVisits.forEach(v => {
    const t = v.visitType || 'غير محدد';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const typeBreakdown = Object.entries(typeCounts).map(([type, count]) => ({
    type,
    count,
    percentage: visitCount > 0 ? Math.round((count / visitCount) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  // 3. Avg Doctor Mood (3=positive, 2=neutral, 1=negative)
  const moodVisits = filteredVisits.filter(v => v.doctorMood);
  const totalMoodScore = moodVisits.reduce((sum, v) => {
    if (v.doctorMood === 'positive') return sum + 3;
    if (v.doctorMood === 'neutral') return sum + 2;
    if (v.doctorMood === 'negative') return sum + 1;
    return sum;
  }, 0);
  const avgMood = moodVisits.length > 0 ? (totalMoodScore / moodVisits.length).toFixed(1) : 'N/A';

  const getMoodEmoji = (score) => {
    if (score === 'N/A') return '➖';
    const num = parseFloat(score);
    if (num >= 2.5) return '😊 ممتاز';
    if (num >= 1.8) return '😐 عادي';
    return '😞 سلبي';
  };

  // 4. Custom SVG Bar Chart Data preparation
  const getChartData = () => {
    if (filterMode === 'week') {
      // Last 7 days daily breakdown (in Arabic)
      const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        days.push({
          dateStr: d.toDateString(),
          label: dayNames[d.getDay()],
          count: 0
        });
      }

      filteredVisits.forEach(v => {
        const vDate = new Date(v.visitDate);
        vDate.setHours(0, 0, 0, 0);
        const match = days.find(d => d.dateStr === vDate.toDateString());
        if (match) match.count += 1;
      });

      return days;
    } else {
      // Last 4 weeks breakdown (30 days partitioned into 4 weeks)
      const weeks = [
        { label: 'الأسبوع 1', startDaysAgo: 30, endDaysAgo: 22, count: 0 },
        { label: 'الأسبوع 2', startDaysAgo: 21, endDaysAgo: 15, count: 0 },
        { label: 'الأسبوع 3', startDaysAgo: 14, endDaysAgo: 8, count: 0 },
        { label: 'الأسبوع 4', startDaysAgo: 7, endDaysAgo: 0, count: 0 }
      ];

      filteredVisits.forEach(v => {
        const vDate = new Date(v.visitDate);
        const diffTime = Math.abs(now - vDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const matchedWeek = weeks.find(w => diffDays >= w.endDaysAgo && diffDays <= w.startDaysAgo);
        if (matchedWeek) matchedWeek.count += 1;
      });

      return weeks;
    }
  };

  const chartData = getChartData();

  // Excel Export Download Handler
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const res = await axios.get('/visits/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `تقرير_زيارات_CRM_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Failed to export Excel report', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 text-slate-800 bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 py-5 px-6 sticky top-0 z-40 md:max-w-md md:mx-auto md:rounded-t-2xl md:mt-4 flex justify-between items-center flex-row-reverse">
        <h1 className="text-lg font-black text-slate-900">📊 التقارير</h1>
        <div className="flex bg-slate-100 p-0.5 rounded-xl">
          <button 
            onClick={() => setFilterMode('month')} 
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            شهري
          </button>
          <button 
            onClick={() => setFilterMode('week')} 
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            أسبوعي
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-6 space-y-6 text-right">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-xs text-slate-400 mt-2">جاري تحميل التقارير...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between">
                <div className="flex justify-between items-center flex-row-reverse mb-3">
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">إجمالي الزيارات</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 leading-none">{visitCount}</h3>
                  <span className="text-[9px] text-slate-400 mt-1 block">خلال الفترة المحددة</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between">
                <div className="flex justify-between items-center flex-row-reverse mb-3">
                  <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                    <Smile className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">مزاج الأطباء</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none">{avgMood} <span className="text-[11px] font-normal text-slate-400">/ 3.0</span></h3>
                  <span className="text-[10px] text-slate-500 font-bold mt-1 block">{getMoodEmoji(avgMood)}</span>
                </div>
              </div>
            </div>

            {/* Visit Over Time Chart */}
            <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-4">
              <h2 className="font-extrabold text-xs text-slate-400 tracking-wide uppercase border-b border-slate-50 pb-3 flex items-center gap-1.5 justify-end">
                <span>معدل الزيارات بمرور الوقت</span>
                <BarChart2 className="w-4 h-4 text-blue-600" />
              </h2>

              {/* Custom SVG Bar Chart */}
              <div className="w-full bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                <div className="flex justify-between items-end h-[160px] px-1 pt-4">
                  {chartData.map((item, idx) => {
                    const maxVal = Math.max(...chartData.map(d => d.count), 1);
                    const pct = (item.count / maxVal) * 100;
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 group">
                        <div className="relative w-full flex justify-center items-end h-[120px]">
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded-lg pointer-events-none whitespace-nowrap z-10 shadow-md transform translate-y-1 group-hover:translate-y-0">
                            {item.count} زيارات
                          </div>
                          {/* Bar */}
                          <div 
                            style={{ height: `${pct > 0 ? Math.max(pct, 6) : 0}%` }} 
                            className={`w-3 sm:w-5 bg-gradient-to-t ${item.count > 0 ? 'from-blue-600 to-indigo-500 shadow-sm' : 'from-slate-200 to-slate-200'} rounded-t-full transition-all duration-500 cursor-pointer`}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-2 text-center w-full truncate">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Visit Type breakdown percentages */}
            <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-4">
              <h2 className="font-extrabold text-xs text-slate-400 border-b border-slate-50 pb-3 flex items-center gap-1.5 justify-end">
                <span>توزيع أنواع الزيارة</span>
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </h2>

              {visitCount === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">لا توجد زيارات مسجلة في هذه الفترة</div>
              ) : (
                <div className="space-y-3">
                  {typeBreakdown.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs flex-row-reverse">
                        <span className="font-extrabold text-slate-800">{item.type}</span>
                        <span className="text-slate-400 font-bold">{item.percentage}% ({item.count})</span>
                      </div>
                      <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div 
                          style={{ width: `${item.percentage}%` }}
                          className={`h-full rounded-full bg-gradient-to-r ${
                            idx === 0 
                              ? 'from-blue-500 to-indigo-500' 
                              : idx === 1 
                              ? 'from-indigo-400 to-purple-400' 
                              : 'from-slate-400 to-slate-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Export Section */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 text-right">
              <button 
                onClick={handleExportExcel}
                disabled={exporting}
                className="w-full py-3.5 bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-500 hover:to-teal-400 text-white font-extrabold rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري تصدير التقرير...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>تصدير التقرير إلى Excel</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Reports;
