import React, { useState } from 'react';
import axios from 'axios';
import { Mail, FileSpreadsheet, Code, Download, Save, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user, updateSettings } = useAuth();
  const [reminderEmail, setReminderEmail] = useState(user?.reminderEmail || '');
  const [sheetsUrl, setSheetsUrl] = useState(user?.sheetsUrl || '');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMsg({ text: msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateSettings({ reminderEmail, sheetsUrl });
    setSaving(false);
    if (result.success) {
      showToast('تم حفظ الإعدادات بنجاح');
    } else {
      showToast(result.error, 'error');
    }
  };

  // Google Apps Script Code template
  const appsScriptCode = `// Medical CRM - Google Apps Script
// انسخ الكود ده كله والصقه في Apps Script

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    if (data.type === 'doctors') syncSheet(ss, 'الدكاتره', data.headers, data.rows, '#1a5276');
    else if (data.type === 'visits') syncSheet(ss, 'الزيارات', data.headers, data.rows, '#27ae60');
    return ContentService.createTextOutput(JSON.stringify({status:'ok'})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status:'error',msg:err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({status:'ok',msg:'Medical CRM Ready'})).setMimeType(ContentService.MimeType.JSON);
}

function syncSheet(ss, name, headers, rows, color) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  sheet.clearContents();
  sheet.appendRow(headers);
  sheet.getRange(1,1,1,headers.length).setBackground(color).setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  if (rows.length > 0) sheet.getRange(2,1,rows.length,headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);
  SpreadsheetApp.flush();
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    showToast('تم نسخ كود Apps Script بنجاح');
  };

  const handleExportJSON = async () => {
    try {
      setExporting(true);
      const docsRes = await axios.get('/doctors');
      const visitsRes = await axios.get('/visits');

      const backupData = {
        docs: docsRes.data,
        visits: visitsRes.data,
        exportedAt: new Date().toISOString(),
        user: { name: user.name, email: user.email },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medical_crm_backup_${new Date().toISOString().slice(0,10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('تم تصدير نسخة JSON الاحتياطية');
    } catch (error) {
      console.error('Export failed', error);
      showToast('فشل تصدير البيانات الاحتياطية', 'error');
    } finally {
      setExporting(false);
    }
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

      {/* Title Header */}
      <header className="bg-white border-b border-slate-100 py-5 px-6 sticky top-0 z-40 md:max-w-md md:mx-auto md:rounded-t-2xl md:mt-4">
        <h1 className="text-lg font-black text-slate-900 text-right">⚙️ الإعدادات</h1>
      </header>

      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">
        {/* Email & Sheets Url form */}
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 space-y-4 text-right">
          <h2 className="font-extrabold text-sm text-slate-900 border-b border-slate-50 pb-3 mb-2 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <span>📧 إعدادات التذكير والمزامنة</span>
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">البريد الإلكتروني لتلقي التذكيرات</label>
            <input
              type="email"
              required
              placeholder="example@gmail.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-left"
              value={reminderEmail}
              onChange={(e) => setReminderEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Apps Script Web App URL</label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-left font-mono text-xs"
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ الإعدادات</span>
              </>
            )}
          </button>
        </form>

        {/* Integration guides */}
        <section className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 text-right space-y-4">
          <h2 className="font-extrabold text-sm text-slate-900 border-b border-slate-50 pb-3 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <span>📊 ربط Google Sheets</span>
          </h2>

          <div className="bg-blue-50/50 text-blue-900 text-xs leading-relaxed rounded-2xl p-4 border border-blue-100 space-y-2.5">
            <h3 className="font-extrabold text-blue-950">📌 خطوات ربط ملف Google Sheet:</h3>
            <p>1️⃣ افتح جدول البيانات (الزر بالأسفل)</p>
            <p>2️⃣ من القائمة العلوية: <b>Extensions ← Apps Script</b></p>
            <p>3️⃣ امسح أي كود موجود والصق الكود الذي ستنسخه بالأسفل</p>
            <p>4️⃣ اضغط على <b>Deploy ← New deployment ← Web App</b></p>
            <p>5️⃣ غير "Who has access" واجعلها <b>Anyone</b></p>
            <p>6️⃣ انسخ الـ Web App URL والصقه في خانة الـ URL بالأعلى ثم احفظ.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyCode}
              type="button"
              className="flex-1 py-3 bg-green-50 hover:bg-green-100 text-green-700 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-green-200"
            >
              <Code className="w-4 h-4" />
              <span>انسخ الكود</span>
            </button>
            <a
              href="https://docs.google.com/spreadsheets/d/1ifTRzIQ86m-HLJ-Mx799yuZSf11Z-VETs7RvgaO5OVY/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center"
            >
              <button
                type="button"
                className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-amber-200"
              >
                <ExternalLink className="w-4 h-4" />
                <span>افتح الشيت</span>
              </button>
            </a>
          </div>
        </section>

        {/* Backups */}
        <section className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 text-right space-y-4">
          <h2 className="font-extrabold text-sm text-slate-900 border-b border-slate-50 pb-3 flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            <span>💾 تصدير وحفظ البيانات</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            يمكنك تحميل نسخة احتياطية من جميع الدكاتره والزيارات المسجلة الخاصة بك في ملف بصيغة JSON وحفظها على جهازك.
          </p>
          <button
            onClick={handleExportJSON}
            disabled={exporting}
            type="button"
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>تصدير نسخة JSON الاحتياطية</span>
          </button>
        </section>
      </main>
    </div>
  );
};

export default Settings;
