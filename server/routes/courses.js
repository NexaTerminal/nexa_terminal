const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { authenticateJWT } = require('../middleware/auth');

// Get user's progress for a specific course
router.get('/:courseId/progress', authenticateJWT, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { courseId } = req.params;
    const userId = req.user._id; // Use _id, not userId

    console.log('📚 Loading progress for user:', userId, 'course:', courseId);

    const progress = await db.collection('courseProgress').findOne({
      userId: new ObjectId(userId),
      courseId: courseId
    });

    console.log('📚 Progress found:', progress);

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
router.post('/:courseId/lessons/:lessonId/complete', authenticateJWT, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { courseId, lessonId } = req.params;
    const { score, isFinalQuiz } = req.body; // Accept score and final quiz flag
    const userId = req.user._id; // Use _id, not userId

    console.log('✅ Marking lesson complete for user:', userId, 'lesson:', lessonId, 'score:', score, 'isFinalQuiz:', isFinalQuiz);

    // If this is a quiz attempt, record it
    if (score !== undefined) {
      await db.collection('courseProgress').updateOne(
        {
          userId: new ObjectId(userId),
          courseId: courseId
        },
        {
          $push: {
            [`quizAttempts.${lessonId}`]: {
              score: score,
              attemptedAt: new Date()
            }
          },
          $set: {
            lastUpdated: new Date(),
            userId: new ObjectId(userId),
            courseId: courseId
          }
        },
        { upsert: true }
      );
    }

    // For final quiz, only mark complete if score >= 70
    // For regular quizzes/lessons, always mark complete
    const shouldMarkComplete = isFinalQuiz ? (score >= 70) : true;

    if (shouldMarkComplete) {
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

      console.log('✅ Lesson marked complete, result:', result);
    } else {
      console.log('⏳ Final quiz not passed, not marking complete');
    }

    res.json({
      message: shouldMarkComplete ? 'Lesson marked as complete' : 'Quiz attempt recorded',
      success: true,
      markedComplete: shouldMarkComplete
    });
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    res.status(500).json({ message: 'Error marking lesson complete' });
  }
});

// Update video progress (watch position)
router.put('/:courseId/lessons/:lessonId/progress', authenticateJWT, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { courseId, lessonId } = req.params;
    const { watchPosition } = req.body;
    const userId = req.user._id; // Use _id, not userId

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

// Check if retry is allowed for final quiz
router.get('/:courseId/lessons/:lessonId/retry-status', authenticateJWT, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { courseId, lessonId } = req.params;
    const userId = req.user._id;

    const progress = await db.collection('courseProgress').findOne({
      userId: new ObjectId(userId),
      courseId: courseId
    });

    if (!progress || !progress.quizAttempts || !progress.quizAttempts[lessonId]) {
      return res.json({
        canRetry: true,
        attempts: 0,
        lastAttempt: null,
        hoursUntilRetry: 0
      });
    }

    const attempts = progress.quizAttempts[lessonId];
    const lastAttempt = attempts[attempts.length - 1];
    const lastAttemptTime = new Date(lastAttempt.attemptedAt);
    const now = new Date();
    const hoursSinceLastAttempt = (now - lastAttemptTime) / (1000 * 60 * 60);
    const canRetry = hoursSinceLastAttempt >= 6;
    const hoursUntilRetry = canRetry ? 0 : Math.ceil(6 - hoursSinceLastAttempt);

    res.json({
      canRetry,
      attempts: attempts.length,
      lastAttempt: lastAttemptTime,
      lastScore: lastAttempt.score,
      hoursUntilRetry
    });
  } catch (error) {
    console.error('Error checking retry status:', error);
    res.status(500).json({ message: 'Error checking retry status' });
  }
});

// Get all courses with user progress
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user._id; // Use _id, not userId

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
