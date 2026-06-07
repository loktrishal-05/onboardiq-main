import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const startDate = new Date(user.startDate || Date.now());
    const today = new Date();
    const dayInJourney = Math.max(1, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)));

    res.json({
      dayInJourney,
      completedTasks: user.completedTasks || [],
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        seniority: user.seniority,
        location: user.location,
        startDate: user.startDate,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/dashboard/complete-task
router.patch('/complete-task', requireAuth, async (req, res) => {
  try {
    const { taskId, completed } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (completed && !user.completedTasks.includes(taskId)) {
      user.completedTasks.push(taskId);
    } else if (!completed) {
      user.completedTasks = user.completedTasks.filter(id => id !== taskId);
    }

    await user.save();
    res.json({ completedTasks: user.completedTasks });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
