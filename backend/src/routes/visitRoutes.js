const express = require('express');
const router = express.Router();
const prisma = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Get all visits (with search and doctor info)
router.get('/', authMiddleware, async (req, res) => {
  const { search } = req.query;
  try {
    const conditions = {
      userId: req.user.id,
    };

    if (search) {
      conditions.OR = [
        { doctor: { name: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
        { feedback: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const visits = await prisma.visit.findMany({
      where: conditions,
      include: {
        doctor: {
          select: {
            name: true,
            specialty: true,
          },
        },
      },
      orderBy: { visitDate: 'desc' },
    });

    res.json(visits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الزيارات' });
  }
});

// Log a new visit
router.post('/', authMiddleware, async (req, res) => {
  const {
    doctorId,
    visitDate,
    visitType,
    products_presented,
    samples_given,
    doctor_mood,
    visit_result,
    location,
    notes,
    feedback,
    nextVisitDate,
    reminderMinutesBefore,
  } = req.body;

  if (!doctorId || !visitDate || !visitType) {
    return res.status(400).json({ error: 'من فضلك املأ الحقول الإلزامية (الدكتور، تاريخ الزيارة، نوع الزيارة)' });
  }

  try {
    // Verify doctor ownership
    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, userId: req.user.id },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'الدكتور المحدد غير موجود أو لا تملك صلاحية الوصول إليه' });
    }

    // Run within a transaction so both write or none write
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the visit
      const visit = await tx.visit.create({
        data: {
          doctorId,
          visitDate: new Date(visitDate),
          visitType,
          productsPresented: products_presented,
          samplesGiven: samples_given !== undefined ? parseInt(samples_given) : null,
          doctorMood: doctor_mood,
          visitResult: visit_result,
          location,
          notes,
          feedback,
          nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : null,
          reminderMinutesBefore: reminderMinutesBefore !== undefined ? parseInt(reminderMinutesBefore) : 60,
          userId: req.user.id,
        },
      });

      // 2. Auto-update doctor's last_feedback and next_visit_date
      const updateData = {};
      if (feedback) updateData.lastFeedback = feedback;
      if (nextVisitDate) updateData.nextVisitDate = new Date(nextVisitDate);

      if (Object.keys(updateData).length > 0) {
        await tx.doctor.update({
          where: { id: doctorId },
          data: updateData,
        });
      }

      return visit;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الزيارة' });
  }
});

// Delete a visit
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const existingVisit = await prisma.visit.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existingVisit) {
      return res.status(404).json({ error: 'الزيارة غير موجودة أو لا تملك صلاحية حذفها' });
    }

    await prisma.visit.delete({
      where: { id },
    });

    res.json({ message: 'تم حذف الزيارة بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الزيارة' });
  }
});

// Export visits to Excel
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const visits = await prisma.visit.findMany({
      where: { userId: req.user.id },
      include: {
        doctor: {
          select: {
            name: true,
            specialty: true,
            phone: true,
            priority: true,
            subSpecialty: true,
            assistantName: true,
            assistantPhone: true,
            preferredContact: true,
          },
        },
      },
      orderBy: { visitDate: 'desc' },
    });

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('الزيارات');

    // Right to Left layout for Arabic text support
    worksheet.views = [{ rtl: true }];

    // Set columns definition
    worksheet.columns = [
      { header: 'اسم الدكتور', key: 'doctorName', width: 25 },
      { header: 'التخصص', key: 'specialty', width: 20 },
      { header: 'الهاتف', key: 'phone', width: 15 },
      { header: 'الأولويه', key: 'priority', width: 8 },
      { header: 'التخصص الفرعي', key: 'subSpecialty', width: 20 },
      { header: 'مساعد', key: 'assistant', width: 20 },
      { header: 'تواصل مفضل', key: 'preferredContact', width: 12 },
      { header: 'تاريخ الزيارة', key: 'visitDate', width: 25 },
      { header: 'نوع الزيارة', key: 'visitType', width: 15 },
      { header: 'المنتجات المعروضة', key: 'productsPresented', width: 25 },
      { header: 'العيّنات المسلمة', key: 'samplesGiven', width: 12 },
      { header: 'مزاج الدكتور', key: 'doctorMood', width: 12 },
      { header: 'نتيجة الزيارة', key: 'visitResult', width: 18 },
      { header: 'المكان', key: 'location', width: 25 },
      { header: 'ملاحظات', key: 'notes', width: 35 },
      { header: 'فيدباك الدكتور', key: 'feedback', width: 35 },
      { header: 'الزيارة القادمة', key: 'nextVisitDate', width: 25 },
    ];

    // Populate rows
    visits.forEach((v) => {
      worksheet.addRow({
        doctorName: v.doctor?.name || '',
        specialty: v.doctor?.specialty || '',
        phone: v.doctor?.phone || '',
        priority: v.doctor?.priority || '',
        subSpecialty: v.doctor?.subSpecialty || '',
        assistant: v.doctor ? `${v.doctor.assistantName || ''} ${v.doctor.assistantPhone ? '(' + v.doctor.assistantPhone + ')' : ''}` : '',
        preferredContact: v.doctor?.preferredContact || '',
        visitDate: v.visitDate ? new Date(v.visitDate).toLocaleString('ar-EG') : '',
        visitType: v.visitType || '',
        productsPresented: v.productsPresented || '',
        samplesGiven: v.samplesGiven || '',
        doctorMood: v.doctorMood || '',
        visitResult: v.visitResult || '',
        location: v.location || '',
        notes: v.notes || '',
        feedback: v.feedback || '',
        nextVisitDate: v.nextVisitDate ? new Date(v.nextVisitDate).toLocaleString('ar-EG') : '',
      });
    });

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A8A' }, // dark blue
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Align all other rows cells to right (as it is Arabic)
    worksheet.eachRow({ includeHeader: false }, (row) => {
      row.alignment = { vertical: 'middle', horizontal: 'right' };
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=visits_report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Excel failed:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تصدير ملف الإكسل' });
  }
});

module.exports = router;
