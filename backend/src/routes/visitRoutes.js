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

module.exports = router;
