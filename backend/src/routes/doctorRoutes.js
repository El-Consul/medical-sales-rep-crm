const express = require('express');
const router = express.Router();
const prisma = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Get all doctors (with search)
router.get('/', authMiddleware, async (req, res) => {
  const { search } = req.query;
  try {
    const conditions = {
      userId: req.user.id,
    };

    if (search) {
      conditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { specialty: { contains: search, mode: 'insensitive' } },
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where: conditions,
      orderBy: { createdAt: 'desc' },
    });

    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الدكاتره' });
  }
});

// Add doctor
router.post('/', authMiddleware, async (req, res) => {
  const {
    name,
    specialty,
    priority,
    sub_specialty,
    assistant_name,
    assistant_phone,
    preferred_contact,
    phone,
    address,
    hospital1,
    hospital2,
    doctorSchedule,
    nextVisitDate,
    reminderNote,
    lastFeedback,
    lat,
    lng,
    area,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'اسم الدكتور مطلوب' });
  }

  try {
    const doctor = await prisma.doctor.create({
      data: {
        name,
        specialty,
        priority,
        subSpecialty: sub_specialty,
        assistantName: assistant_name,
        assistantPhone: assistant_phone,
        preferredContact: preferred_contact,
        phone,
        address,
        hospital1,
        hospital2,
        doctorSchedule,
        nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : null,
        reminderNote,
        lastFeedback,
        lat: lat !== undefined ? parseFloat(lat) : null,
        lng: lng !== undefined ? parseFloat(lng) : null,
        area,
        userId: req.user.id,
      },
    });
    res.status(201).json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة الدكتور' });
  }
});

// Edit doctor
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    specialty,
    priority,
    sub_specialty,
    assistant_name,
    assistant_phone,
    preferred_contact,
    phone,
    address,
    hospital1,
    hospital2,
    doctorSchedule,
    nextVisitDate,
    reminderNote,
    lastFeedback,
    lat,
    lng,
    area,
  } = req.body;

  try {
    // Verify ownership
    const existingDoctor = await prisma.doctor.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existingDoctor) {
      return res.status(404).json({ error: 'الدكتور غير موجود أو لا تملك صلاحية تعديله' });
    }

    const doctor = await prisma.doctor.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingDoctor.name,
        specialty: specialty !== undefined ? specialty : existingDoctor.specialty,
        priority: priority !== undefined ? priority : existingDoctor.priority,
        subSpecialty: sub_specialty !== undefined ? sub_specialty : existingDoctor.subSpecialty,
        assistantName: assistant_name !== undefined ? assistant_name : existingDoctor.assistantName,
        assistantPhone: assistant_phone !== undefined ? assistant_phone : existingDoctor.assistantPhone,
        preferredContact: preferred_contact !== undefined ? preferred_contact : existingDoctor.preferredContact,
        phone: phone !== undefined ? phone : existingDoctor.phone,
        address: address !== undefined ? address : existingDoctor.address,
        hospital1: hospital1 !== undefined ? hospital1 : existingDoctor.hospital1,
        hospital2: hospital2 !== undefined ? hospital2 : existingDoctor.hospital2,
        doctorSchedule: doctorSchedule !== undefined ? doctorSchedule : existingDoctor.doctorSchedule,
        nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : (nextVisitDate === null ? null : existingDoctor.nextVisitDate),
        reminderNote: reminderNote !== undefined ? reminderNote : existingDoctor.reminderNote,
        lastFeedback: lastFeedback !== undefined ? lastFeedback : existingDoctor.lastFeedback,
        lat: lat !== undefined ? parseFloat(lat) : existingDoctor.lat,
        lng: lng !== undefined ? parseFloat(lng) : existingDoctor.lng,
        area: area !== undefined ? area : existingDoctor.area,
      },
    });

    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء تعديل بيانات الدكتور' });
  }
});

// Delete doctor
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const existingDoctor = await prisma.doctor.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existingDoctor) {
      return res.status(404).json({ error: 'الدكتور غير موجود أو لا تملك صلاحية حذفه' });
    }

    await prisma.doctor.delete({
      where: { id },
    });

    res.json({ message: 'تم حذف الدكتور بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الدكتور' });
  }
});

module.exports = router;
