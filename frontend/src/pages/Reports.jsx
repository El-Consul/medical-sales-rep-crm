import React from 'react';

const Reports = () => {
  return (
    <div className="min-h-screen pb-24 text-slate-800 bg-slate-50">
      <div className="max-w-md mx-auto px-4 pt-6">
        <h2 className="text-lg font-black text-slate-900 mb-3">📊 التقارير</h2>
        <div className="bg-white p-4 rounded-2xl border space-y-3 text-right">
          <div className="font-bold">تقارير أسبوعية وشهرية</div>
          <div className="text-xs text-slate-500">مخططات لتحليل الزيارات، المزاج، وأداء الأهداف الشهرية. (سيتم ملؤها برسم بياني لاحقاً)</div>
        </div>
        <div className="mt-4 bg-white p-4 rounded-2xl border text-right">
          <button className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-500 text-white rounded-2xl font-bold">🖨️ تصدير التقرير (PDF / Excel)</button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
