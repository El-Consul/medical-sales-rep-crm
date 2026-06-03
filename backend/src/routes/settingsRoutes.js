const express = require('express');
const router = express.Router();
const prisma = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Update Settings (reminderEmail and sheetsUrl)
router.put('/', authMiddleware, async (req, res) => {
  const { reminderEmail, sheetsUrl } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        reminderEmail: reminderEmail !== undefined ? reminderEmail : undefined,
        sheetsUrl: sheetsUrl !== undefined ? sheetsUrl : undefined,
      },
    });

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      reminderEmail: updatedUser.reminderEmail,
      sheetsUrl: updatedUser.sheetsUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث الإعدادات' });
  }
});

// Compile synchronization payload for Google Sheets
router.get('/sync-data', authMiddleware, async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const visits = await prisma.visit.findMany({
      where: { userId: req.user.id },
      include: {
        doctor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { visitDate: 'desc' },
    });

    // Format Doctors Rows
    const doctorHeaders = [
      'ID',
      'الاسم',
      'التخصص',
      'التليفون',
      'العنوان',
      'المستشفى الأساسي',
      'مستشفى ثاني',
      'معاد الدكتور',
      'موعد الزيارة القادمة',
      'ريمايندر',
      'آخر فيدباك',
      'تاريخ الإضافة'
    ];

    const doctorRows = doctors.map((d) => [
      d.id,
      d.name || '',
      d.specialty || '',
      d.phone || '',
      d.address || '',
      d.hospital1 || '',
      d.hospital2 || '',
      d.doctorSchedule || '',
      d.nextVisitDate ? d.nextVisitDate.toLocaleString('ar-EG') : '',
      d.reminderNote || '',
      d.lastFeedback || '',
      d.createdAt ? d.createdAt.toLocaleString('ar-EG') : ''
    ]);

    // Format Visits Rows
    const visitHeaders = [
      'ID',
      'الدكتور',
      'تاريخ الزيارة',
      'نوع الزيارة',
      'المكان',
      'ملاحظات',
      'فيدباك الدكتور',
      'الزيارة القادمة',
      'وقت التذكير'
    ];

    const visitRows = visits.map((v) => {
      let rLabel = 'وقت الزيارة';
      if (v.reminderMinutesBefore === 60) rLabel = 'قبلها بساعة';
      else if (v.reminderMinutesBefore === 180) rLabel = 'قبلها 3 ساعات';
      else if (v.reminderMinutesBefore === 1440) rLabel = 'قبلها يوم';
      else if (v.reminderMinutesBefore === 2880) rLabel = 'قبلها يومين';
      else if (v.reminderMinutesBefore > 0) rLabel = `${v.reminderMinutesBefore} دقيقة`;

      return [
        v.id,
        v.doctor ? v.doctor.name : '',
        v.visitDate ? v.visitDate.toLocaleString('ar-EG') : '',
        v.visitType || '',
        v.location || '',
        v.notes || '',
        v.feedback || '',
        v.nextVisitDate ? v.nextVisitDate.toLocaleString('ar-EG') : '',
        v.nextVisitDate ? rLabel : ''
      ];
    });

    res.json({
      doctors: {
        type: 'doctors',
        headers: doctorHeaders,
        rows: doctorRows,
      },
      visits: {
        type: 'visits',
        headers: visitHeaders,
        rows: visitRows,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء تجهيز بيانات المزامنة' });
  }
});

module.exports = router;
