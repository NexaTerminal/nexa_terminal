const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('../middleware/auth');

// Get user's progress for a specific course
router.get('/:courseId/progress', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { courseId } = req.params;
    const userId = req.user.userId;

    const progress = await db.collection('courseProgress').findOne({
      userId: new ObjectId(userId),
      courseId: courseId
    });

    if (!progress) {
      return res.json({ completedLessons: [] });
    }

    res.json(progress);
  } catch (error) {
    console.error('Error fetching course progress:', error);
    res.status(500).json({ message: 'Error fetching course progress' });
  }
});

// Mark lesson as complete
router.post('/:courseId/lessons/:lessonId/complete', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { courseId, lessonId } = req.params;
    const userId = req.user.userId;

    const result = await db.collection('courseProgress').updateOne(
      {
        userId: new ObjectId(userId),
        courseId: courseId
      },
      {
        $addToSet: { completedLessons: lessonId },
        $set: {
          lastUpdated: new Date(),
          userId: new ObjectId(userId),
          courseId: courseId
        }
      },
      { upsert: true }
    );

    res.json({ message: 'Lesson marked as complete', success: true });
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    res.status(500).json({ message: 'Error marking lesson complete' });
  }
});

// Update video progress (watch position)
router.put('/:courseId/lessons/:lessonId/progress', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { courseId, lessonId } = req.params;
    const { watchPosition } = req.body;
    const userId = req.user.userId;

    await db.collection('courseProgress').updateOne(
      {
        userId: new ObjectId(userId),
        courseId: courseId
      },
      {
        $set: {
          [`lessonProgress.${lessonId}.watchPosition`]: watchPosition,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );

    res.json({ message: 'Progress updated', success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Error updating progress' });
  }
});

// Get all courses with user progress
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user.userId;

    // Get all user's course progress
    const userProgress = await db.collection('courseProgress')
      .find({ userId: new ObjectId(userId) })
      .toArray();

    res.json({ progress: userProgress });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

module.exports = router;
