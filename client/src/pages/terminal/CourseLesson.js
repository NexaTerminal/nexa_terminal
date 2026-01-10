import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import courseStyles from '../../styles/terminal/CourseDetail.module.css';
import certificateStyles from '../../styles/education/Certificate.module.css';
import api from '../../services/api';
import { courseData, readingContent, quizData } from '../../data/courseData';
import CertificateModal from '../../components/education/CertificateModal';

const CourseLesson = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const course = courseData[courseId];

  const [completedLessons, setCompletedLessons] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateStatus, setCertificateStatus] = useState({ issued: false });
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [userData, setUserData] = useState(null);
  const [retryStatus, setRetryStatus] = useState(null);

  // Find current lesson and navigation info
  const allLessons = course?.modules.flatMap(m => m.lessons) || [];
  const currentIndex = allLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  useEffect(() => {
    if (!course) {
      navigate('/terminal/education');
      return;
    }

    // Find the current lesson
    const lesson = allLessons.find(l => l.id === lessonId);
    if (!lesson) {
      navigate(`/terminal/education/course/${courseId}`);
      return;
    }

    setCurrentLesson(lesson);
    loadProgress();
    loadUserData();
    checkCertificateStatus();

    // Check retry status for final quiz
    if (lesson.type === 'quiz' && lesson.id.includes('final')) {
      checkRetryStatus(lesson.id);
    }

    // Reset quiz state when lesson changes
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  }, [courseId, lessonId]);

  const loadProgress = async () => {
    try {
      const response = await api.get(`/courses/${courseId}/progress`);
      if (response && response.completedLessons) {
        setCompletedLessons(response.completedLessons);
        console.log('Progress loaded:', response.completedLessons);
      }
    } catch (error) {
      console.log('No previous progress found:', error.message);
    }
  };

  const loadUserData = async () => {
    try {
      const response = await api.get('/users/profile');
      setUserData(response);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const checkCertificateStatus = async () => {
    try {
      const response = await api.get(`/certificates/${courseId}/status`);
      setCertificateStatus(response);
    } catch (error) {
      console.log('No certificate status found:', error);
    }
  };

  const checkRetryStatus = async (lessonIdToCheck) => {
    try {
      const response = await api.get(`/courses/${courseId}/lessons/${lessonIdToCheck}/retry-status`);
      setRetryStatus(response);
      console.log('Retry status:', response);
    } catch (error) {
      console.error('Error checking retry status:', error);
      setRetryStatus({ canRetry: true, attempts: 0 });
    }
  };

  const handleGenerateCertificate = async (formData) => {
    setIsGeneratingCertificate(true);
    try {
      // Use api.downloadBlob with CSRF token support
      const blob = await api.downloadBlob(`/certificates/${courseId}/generate`, 'POST', formData);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Nexa-Certificate-${courseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Update certificate status
      setShowCertificateModal(false);
      await checkCertificateStatus();

      alert('Сертификатот е успешно генериран и преземен!');
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Грешка при генерирање на сертификатот. Обидете се повторно.');
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      // Use api.downloadBlob for GET request
      const blob = await api.downloadBlob(`/certificates/${courseId}/download`, 'GET');

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Nexa-Certificate-${courseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('❌ Грешка при преземање на сертификатот. Обидете се повторно.');
    }
  };

  const markLessonComplete = async (lessonIdToMark, score = undefined, isFinalQuiz = false) => {
    // For non-quiz lessons, check if already completed
    if (score === undefined && completedLessons.includes(lessonIdToMark)) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setShowSuccessMessage(false);

    try {
      const response = await api.post(`/courses/${courseId}/lessons/${lessonIdToMark}/complete`, {
        score,
        isFinalQuiz
      });
      console.log('✅ Lesson completion response:', lessonIdToMark, response);

      // Update local state only if the lesson was actually marked complete
      if (response.markedComplete && !completedLessons.includes(lessonIdToMark)) {
        const updated = [...completedLessons, lessonIdToMark];
        setCompletedLessons(updated);

        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else if (!response.markedComplete) {
        console.log('Quiz attempt recorded but not marked complete');
      }
    } catch (error) {
      console.error('❌ Error saving progress:', error);
      setSaveError('Грешка при зачувување. Обидете се повторно.');

      // Auto-hide error after 5 seconds
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVideoEnd = () => {
    if (currentLesson && currentLesson.type === 'video') {
      markLessonComplete(currentLesson.id);
    }
  };

  const handleMarkReadingComplete = () => {
    if (currentLesson && currentLesson.type === 'reading') {
      markLessonComplete(currentLesson.id);

      // Auto-navigate to next lesson after marking complete
      if (nextLesson) {
        setTimeout(() => {
          navigate(`/terminal/education/course/${courseId}/lesson/${nextLesson.id}`);
        }, 1000);
      }
    }
  };

  const handleQuizAnswer = (questionId, answerIndex) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: answerIndex
    });
  };

  const handleQuizSubmit = async () => {
    const quiz = quizData[currentLesson.id];
    let correct = 0;

    quiz.questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });

    const score = Math.round((correct / quiz.questions.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);

    // Determine if this is a final quiz
    const isFinalQuiz = currentLesson.id.includes('final');

    // For final quiz, check if retry is allowed
    if (isFinalQuiz && retryStatus && !retryStatus.canRetry) {
      alert(`Можете да го обидете повторно финалниот тест по ${retryStatus.hoursUntilRetry} час(а)`);
      return;
    }

    // Use passingScore from lesson data, default to 70 if not specified
    const passingScore = currentLesson.passingScore || 70;

    // Mark lesson complete with score
    // For regular quizzes: always mark complete
    // For final quiz: only mark complete if score >= 70%
    await markLessonComplete(currentLesson.id, score, isFinalQuiz);

    // If final quiz and passed, show certificate modal
    if (isFinalQuiz && score >= passingScore) {
      // Check certificate status
      const status = await api.get(`/certificates/${courseId}/status`);
      if (!status.issued) {
        // Show certificate modal
        setTimeout(() => setShowCertificateModal(true), 1500);
      }
    }

    // Refresh retry status for final quiz
    if (isFinalQuiz) {
      await checkRetryStatus(currentLesson.id);
    }
  };

  const calculateProgress = () => {
    const totalLessons = allLessons.length;
    return Math.round((completedLessons.length / totalLessons) * 100);
  };

  const handleLessonClick = (lesson) => {
    navigate(`/terminal/education/course/${courseId}/lesson/${lesson.id}`);
  };

  const goToNextLesson = () => {
    if (nextLesson) {
      navigate(`/terminal/education/course/${courseId}/lesson/${nextLesson.id}`);
    }
  };

  const goToPrevLesson = () => {
    if (prevLesson) {
      navigate(`/terminal/education/course/${courseId}/lesson/${prevLesson.id}`);
    }
  };

  if (!course || !currentLesson) {
    return null;
  }

  const renderContent = () => {
    if (currentLesson.type === 'video') {
      return (
        <div className={courseStyles.videoContainer}>
          <iframe
            src={`https://www.youtube.com/embed/${currentLesson.videoId}`}
            title={currentLesson.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={courseStyles.videoPlayer}
            onEnded={handleVideoEnd}
          ></iframe>
          <div className={courseStyles.videoInfo}>
            <h2>{currentLesson.title}</h2>
            <div className={courseStyles.videoActions}>
              <button
                className={courseStyles.completeButton}
                onClick={() => markLessonComplete(currentLesson.id)}
                disabled={completedLessons.includes(currentLesson.id) || isSaving}
              >
                {isSaving ? 'Зачувување...' :
                 completedLessons.includes(currentLesson.id) ? 'Завршено' :
                 'Означи како завршено'}
              </button>
              {showSuccessMessage && (
                <span className={courseStyles.successMessage}>Лекцијата е зачувана</span>
              )}
              {saveError && (
                <span className={courseStyles.errorMessage}>{saveError}</span>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (currentLesson.type === 'reading') {
      const reading = readingContent[currentLesson.id];
      return (
        <div className={courseStyles.readingContainer}>
          <h1>{reading.title}</h1>
          {reading.content.map((section, idx) => (
            <div key={idx} className={courseStyles.readingSection}>
              <h2>{section.heading}</h2>
              <p style={{ whiteSpace: 'pre-line' }}>{section.text}</p>
            </div>
          ))}
          <div className={courseStyles.readingActions}>
            <button
              className={courseStyles.completeButton}
              onClick={handleMarkReadingComplete}
              disabled={completedLessons.includes(currentLesson.id) || isSaving}
            >
              {isSaving ? 'Зачувување...' :
               completedLessons.includes(currentLesson.id) ? 'Завршено' :
               'Означи како завршено'}
            </button>
            {showSuccessMessage && (
              <span className={courseStyles.successMessage}>Лекцијата е зачувана</span>
            )}
            {saveError && (
              <span className={courseStyles.errorMessage}>{saveError}</span>
            )}
          </div>
        </div>
      );
    }

    if (currentLesson.type === 'quiz') {
      const quiz = quizData[currentLesson.id];
      const passingScore = currentLesson.passingScore || 70;
      const isFinalQuiz = currentLesson.id.includes('final');

      return (
        <div className={courseStyles.quizContainer}>
          <h1>{quiz.title}</h1>
          <p className={courseStyles.quizInstructions}>
            Одговорете на сите прашања. За да поминете, потребни се минимум {passingScore}% точни одговори.
          </p>

          {/* Show retry status for final quiz */}
          {isFinalQuiz && retryStatus && retryStatus.attempts > 0 && (
            <div className={courseStyles.retryInfo}>
              <p>
                <strong>Обиди:</strong> {retryStatus.attempts} |
                <strong> Последен резултат:</strong> {retryStatus.lastScore}%
                {!retryStatus.canRetry && (
                  <span style={{ color: '#737373' }}>
                    {' '}| Следен обид можен по {retryStatus.hoursUntilRetry} час(а)
                  </span>
                )}
              </p>
            </div>
          )}

          {quiz.questions.map((q, idx) => (
            <div key={q.id} className={courseStyles.question}>
              <h3>{idx + 1}. {q.question}</h3>
              <div className={courseStyles.options}>
                {q.options.map((option, optIdx) => (
                  <label
                    key={optIdx}
                    className={`${courseStyles.option} ${
                      quizSubmitted
                        ? optIdx === q.correctAnswer
                          ? courseStyles.correct
                          : quizAnswers[q.id] === optIdx
                            ? courseStyles.incorrect
                            : ''
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={optIdx}
                      checked={quizAnswers[q.id] === optIdx}
                      onChange={() => handleQuizAnswer(q.id, optIdx)}
                      disabled={quizSubmitted}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {!quizSubmitted ? (
            <button
              className={courseStyles.submitQuizButton}
              onClick={handleQuizSubmit}
              disabled={
                Object.keys(quizAnswers).length !== quiz.questions.length ||
                (isFinalQuiz && retryStatus && !retryStatus.canRetry)
              }
            >
              {isFinalQuiz && retryStatus && !retryStatus.canRetry
                ? `Обидот можен по ${retryStatus.hoursUntilRetry} час(а)`
                : 'Испрати одговори'}
            </button>
          ) : (
            <div className={courseStyles.quizResult}>
              <h2>Резултат: {quizScore}%</h2>
              <p>
                {quizScore >= passingScore
                  ? isFinalQuiz
                    ? 'Честитки! Успешно го поминавте финалниот тест и го завршивте курсот!'
                    : 'Честитки! Успешно го поминавте квизот!'
                  : isFinalQuiz
                    ? 'За жал, не постигнавте доволен број на поени за финалниот тест. Потребни се минимум 70% за да го завршите курсот.'
                    : 'За жал, не постигнавте доволен број на поени. Можете да го обидете повторно.'}
              </p>
              {quizScore < passingScore && (
                <>
                  {isFinalQuiz && retryStatus && !retryStatus.canRetry ? (
                    <p style={{ color: '#737373', fontWeight: 'bold' }}>
                      Можете да го обидете повторно финалниот тест по {retryStatus.hoursUntilRetry} час(а).
                    </p>
                  ) : (
                    <button
                      className={courseStyles.retryButton}
                      onClick={() => {
                        setQuizSubmitted(false);
                        setQuizAnswers({});
                      }}
                    >
                      Обиди се повторно
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div>
      <Header isTerminal={true} />
      <div className={courseStyles.courseLayout}>
        <Sidebar />
        <main className={courseStyles.courseMain}>
          <div className={courseStyles.courseHeader}>
            <button onClick={() => navigate('/terminal/education')} className={courseStyles.backButton}>
              ← Назад до обуки
            </button>
            <h1>{course.title}</h1>
            <p>{course.description}</p>
            <div className={courseStyles.progressBar}>
              <div
                className={courseStyles.progressFill}
                style={{ width: `${calculateProgress()}%` }}
              ></div>
              <span className={courseStyles.progressText}>{calculateProgress()}% завршено</span>
            </div>

            {/* Certificate Section */}
            {calculateProgress() === 100 && certificateStatus.issued && (
              <div className={certificateStyles.certificateSection}>
                <p>Честитки! Успешно го завршивте курсот!</p>
                <button
                  className={certificateStyles.downloadCertificateButton}
                  onClick={handleDownloadCertificate}
                >
                  Преземи сертификат
                </button>
              </div>
            )}
          </div>

          <div className={courseStyles.courseContent}>
            <div className={courseStyles.sidebar}>
              <h3>Содржина на курсот</h3>
              {course.modules.map((module) => (
                <div key={module.id} className={courseStyles.module}>
                  <h4>{module.title}</h4>
                  <ul className={courseStyles.lessonList}>
                    {module.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className={`${courseStyles.lessonItem} ${
                          currentLesson?.id === lesson.id ? courseStyles.active : ''
                        } ${completedLessons.includes(lesson.id) ? courseStyles.completed : ''}`}
                        onClick={() => handleLessonClick(lesson)}
                      >
                        <div className={courseStyles.lessonInfo}>
                          <span className={courseStyles.lessonTitle}>{lesson.title}</span>
                          <span className={courseStyles.lessonDuration}>{lesson.duration}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className={courseStyles.mainContent}>
              {renderContent()}

              {/* Navigation buttons */}
              <div className={courseStyles.lessonNavigation}>
                <button
                  className={courseStyles.navButton}
                  onClick={goToPrevLesson}
                  disabled={!prevLesson}
                  style={{ visibility: prevLesson ? 'visible' : 'hidden' }}
                >
                  ← Претходна лекција
                </button>
                <button
                  className={courseStyles.navButton}
                  onClick={goToNextLesson}
                  disabled={!nextLesson}
                  style={{ visibility: nextLesson ? 'visible' : 'hidden' }}
                >
                  Следна лекција →
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        onGenerate={handleGenerateCertificate}
        userData={userData}
        courseName={course.title}
        isGenerating={isGeneratingCertificate}
      />
    </div>
  );
};

export default CourseLesson;
