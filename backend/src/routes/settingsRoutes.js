const express = require('express');
const router = express.Router();
const prisma = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Update Settings (reminderEmail only)
router.put('/', authMiddleware, async (req, res) => {
  const { reminderEmail } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        reminderEmail: reminderEmail !== undefined ? reminderEmail : undefined,
      },
    });

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      reminderEmail: updatedUser.reminderEmail,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث الإعدادات' });
  }
});

module.exports = router;

