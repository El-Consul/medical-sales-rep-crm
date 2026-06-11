const express = require('express');
const router = express.Router();
const prisma = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Create task for a doctor
router.post('/', authMiddleware, async (req, res) => {
  const { doctorId, title, dueDate, notes } = req.body;
  if (!doctorId || !title) return res.status(400).json({ error: 'doctorId and title required' });
  try {
    // verify doctor ownership
    const doctor = await prisma.doctor.findFirst({ where: { id: doctorId, userId: req.user.id } });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    const task = await prisma.task.create({
      data: {
        doctorId,
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        userId: req.user.id,
      },
    });
    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get tasks (optionally by doctor)
router.get('/', authMiddleware, async (req, res) => {
  const { doctorId } = req.query;
  try {
    const where = { userId: req.user.id };
    if (doctorId) where.doctorId = doctorId;
    const tasks = await prisma.task.findMany({ where, include: { doctor: { select: { name: true } } }, orderBy: { dueDate: 'asc' } });
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Toggle task done
router.put('/:id/done', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.task.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    const updated = await prisma.task.update({ where: { id }, data: { isDone: !existing.isDone } });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.task.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
