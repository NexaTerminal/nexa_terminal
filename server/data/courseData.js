// Server-side course data for certificate generation
// This is a CommonJS module that mirrors the client-side courseData.js

const courseData = {
  'udel-vo-drushtvo': {
    title: 'Удел во друштвото',
    description: 'Комплетен курс за разбирање на уделот во друштвото, права на сопствениците, процедури за стекнување и пренесување на удел.',
    modules: [
      {
        id: 1,
        title: 'Модул 1: Вовед во концептот на удел',
        lessons: [
          { id: 'lesson-1', title: 'Видео: Вовед во концептот на удел', type: 'video', videoId: 'a4t7n8-Zfpk', duration: '15 мин' },
          { id: 'reading-1', title: 'Читање: Што е удел во друштвото', type: 'reading', duration: '10 мин' },
          { id: 'reading-2', title: 'Читање: Видови на удели и нивно значење', type: 'reading', duration: '12 мин' },
          { id: 'quiz-1', title: 'Квиз: Модул 1', type: 'quiz', passingScore: 67, duration: '10 мин' }
        ]
      },
      {
        id: 2,
        title: 'Модул 2: Права и обврски на сопствениците на удели',
        lessons: [
          { id: 'lesson-2', title: 'Видео: Права на сопствениците', type: 'video', videoId: 'VaWON6WMVLs', duration: '18 мин' },
          { id: 'reading-3', title: 'Читање: Право на глас', type: 'reading', duration: '10 мин' },
          { id: 'reading-4', title: 'Читање: Право на дивиденда', type: 'reading', duration: '12 мин' },
          { id: 'quiz-2', title: 'Квиз: Модул 2', type: 'quiz', passingScore: 67, duration: '10 мин' }
        ]
      },
      {
        id: 3,
        title: 'Модул 3: Постапка за основање на друштво',
        lessons: [
          { id: 'lesson-3', title: 'Видео: Постапка за основање', type: 'video', videoId: 'VaWON6WMVLs', duration: '20 мин' },
          { id: 'reading-5', title: 'Читање: Договор за основање', type: 'reading', duration: '15 мин' },
          { id: 'reading-6', title: 'Читање: Статут на друштвото', type: 'reading', duration: '15 мин' },
          { id: 'quiz-3', title: 'Квиз: Модул 3', type: 'quiz', passingScore: 67, duration: '10 мин' }
        ]
      },
      {
        id: 4,
        title: 'Модул 4: Пренос на удели',
        lessons: [
          { id: 'lesson-4', title: 'Видео: Пренос на удели', type: 'video', videoId: 'VaWON6WMVLs', duration: '20 мин' },
          { id: 'reading-7', title: 'Читање: Договор за пренос', type: 'reading', duration: '12 мин' },
          { id: 'reading-8', title: 'Читање: Право на предност', type: 'reading', duration: '10 мин' },
          { id: 'quiz-4', title: 'Квиз: Модул 4', type: 'quiz', passingScore: 67, duration: '10 мин' }
        ]
      },
      {
        id: 5,
        title: 'Модул 5: Финансиски аспекти',
        lessons: [
          { id: 'lesson-5', title: 'Видео: Вреднување на удели', type: 'video', videoId: 'VaWON6WMVLs', duration: '20 мин' },
          { id: 'reading-9', title: 'Читање: Номинална и книговодствена вредност', type: 'reading', duration: '12 мин' },
          { id: 'reading-10', title: 'Читање: Пазарна вредност', type: 'reading', duration: '10 мин' },
          { id: 'quiz-5', title: 'Квиз: Модул 5', type: 'quiz', passingScore: 67, duration: '10 мин' }
        ]
      },
      {
        id: 6,
        title: 'Модул 6: Правна заштита',
        lessons: [
          { id: 'lesson-6', title: 'Видео: Правна заштита', type: 'video', videoId: 'VaWON6WMVLs', duration: '18 мин' },
          { id: 'reading-11', title: 'Читање: Заштита на малцински сопственици', type: 'reading', duration: '12 мин' },
          { id: 'reading-12', title: 'Читање: Тужби и спорови', type: 'reading', duration: '15 мин' },
          { id: 'quiz-6', title: 'Квиз: Модул 6', type: 'quiz', passingScore: 67, duration: '10 мин' }
        ]
      },
      {
        id: 7,
        title: 'Модул 7: Практични примери',
        lessons: [
          { id: 'lesson-7', title: 'Видео: Практични примери', type: 'video', videoId: 'VaWON6WMVLs', duration: '25 мин' },
          { id: 'reading-13', title: 'Читање: Случај 1 - Пренос на удел', type: 'reading', duration: '15 мин' },
          { id: 'reading-14', title: 'Читање: Случај 2 - Спор за удели', type: 'reading', duration: '15 мин' },
          { id: 'quiz-7', title: 'Квиз: Модул 7', type: 'quiz', passingScore: 67, duration: '10 мин' },
          { id: 'quiz-final-udel', title: 'Финален тест', type: 'quiz', passingScore: 70, duration: '30 мин', isFinal: true }
        ]
      }
    ]
  },
  'rabotni-odnosi': {
    title: 'Работни односи',
    description: 'Разберете ги клучните аспекти на трудовото право, вработување, отпуштање и права на работниците.',
    modules: [] // Add other courses as needed
  }
};

module.exports = { courseData };
