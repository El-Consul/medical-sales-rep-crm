const express = require('express');
const router = express.Router();
const prisma = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Set or update target for a doctor for a month
router.post('/', authMiddleware, async (req, res) => {
  const { doctorId, month, targetVisits } = req.body;
  if (!doctorId || !month || targetVisits === undefined) return res.status(400).json({ error: 'doctorId, month and targetVisits required' });
  try {
    const m = new Date(month);
    // upsert by doctorId + month
    const existing = await prisma.doctorTarget.findFirst({ where: { doctorId, month: m, userId: req.user.id } });
    if (existing) {
      const updated = await prisma.doctorTarget.update({ where: { id: existing.id }, data: { targetVisits: parseInt(targetVisits) } });
      return res.json(updated);
    }
    const created = await prisma.doctorTarget.create({ data: { doctorId, month: m, targetVisits: parseInt(targetVisits), userId: req.user.id } });
    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to set target' });
  }
});

// Get targets (for current user)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const targets = await prisma.doctorTarget.findMany({ where: { userId: req.user.id }, include: { doctor: { select: { name: true } } }, orderBy: { month: 'desc' } });
    res.json(targets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch targets' });
  }
});

module.exports = router;
