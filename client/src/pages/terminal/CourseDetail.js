import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseData } from '../../data/courseData';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = courseData[courseId];

  useEffect(() => {
    if (!course) {
      navigate('/terminal/education');
      return;
    }

    // Redirect to first lesson
    if (course.modules.length > 0 && course.modules[0].lessons.length > 0) {
      const firstLesson = course.modules[0].lessons[0];
      navigate(`/terminal/education/course/${courseId}/lesson/${firstLesson.id}`, { replace: true });
    }
  }, [courseId, course, navigate]);

  return null;
};

export default CourseDetail;
