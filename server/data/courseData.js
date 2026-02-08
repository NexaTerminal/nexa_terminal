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
  'izvrsuvanje-nedviznosti': {
    title: 'Извршување врз недвижности',
    description: 'Комплетен курс за постапката на извршување врз недвижности - од прибелешка до намирување на доверителите.',
    modules: [
      {
        id: 1,
        title: 'Модул 1: Вовед во постапката за извршување',
        lessons: [
          { id: 'izv-lesson-1', title: 'Видео: Вовед во постапката', type: 'video', videoId: 'imAWHrYOVUQ', duration: '15 мин' },
          { id: 'izv-reading-1', title: 'Читање: Општи одредби за извршување', type: 'reading', duration: '10 мин' },
          { id: 'izv-quiz-1', title: 'Квиз: Модул 1', type: 'quiz', passingScore: 67, duration: '5 мин' }
        ]
      },
      {
        id: 2,
        title: 'Модул 2: Прибелешка и право на намирување',
        lessons: [
          { id: 'izv-lesson-2', title: 'Видео: Прибелешка и стекнување права', type: 'video', videoId: 'LDT5XHoOotU', duration: '15 мин' },
          { id: 'izv-reading-2', title: 'Читање: Прибелешка на налогот', type: 'reading', duration: '10 мин' },
          { id: 'izv-quiz-2', title: 'Квиз: Модул 2', type: 'quiz', passingScore: 67, duration: '5 мин' }
        ]
      },
      {
        id: 3,
        title: 'Модул 3: Утврдување на вредноста',
        lessons: [
          { id: 'izv-lesson-3', title: 'Видео: Проценка на недвижноста', type: 'video', videoId: '_o_EexOQroU', duration: '15 мин' },
          { id: 'izv-reading-3', title: 'Читање: Утврдување на вредноста', type: 'reading', duration: '10 мин' },
          { id: 'izv-quiz-3', title: 'Квиз: Модул 3', type: 'quiz', passingScore: 67, duration: '5 мин' }
        ]
      },
      {
        id: 4,
        title: 'Модул 4: Процес на продажба',
        lessons: [
          { id: 'izv-lesson-4', title: 'Видео: Продажба на недвижноста', type: 'video', videoId: '-d4BOXJCz4c', duration: '15 мин' },
          { id: 'izv-reading-4', title: 'Читање: Процес на продажба', type: 'reading', duration: '10 мин' },
          { id: 'izv-quiz-4', title: 'Квиз: Модул 4', type: 'quiz', passingScore: 67, duration: '5 мин' }
        ]
      },
      {
        id: 5,
        title: 'Модул 5: Намирување и сопственост',
        lessons: [
          { id: 'izv-lesson-5', title: 'Видео: Намирување на доверителите', type: 'video', videoId: '8L2we3HsBpc', duration: '15 мин' },
          { id: 'izv-reading-5', title: 'Читање: Намирување и сопственост', type: 'reading', duration: '10 мин' },
          { id: 'izv-quiz-5', title: 'Квиз: Модул 5', type: 'quiz', passingScore: 67, duration: '5 мин' }
        ]
      },
      {
        id: 6,
        title: 'Модул 6: Предавање на имотот',
        lessons: [
          { id: 'izv-lesson-6', title: 'Видео: Предавање и завршување', type: 'video', videoId: 'IQeYqQ7PzhI', duration: '15 мин' },
          { id: 'izv-reading-6', title: 'Читање: Предавање на имотот', type: 'reading', duration: '10 мин' },
          { id: 'izv-infographic', title: 'Инфографик: Водич низ постапката', type: 'reading', duration: '5 мин' },
          { id: 'izv-quiz-6', title: 'Квиз: Модул 6', type: 'quiz', passingScore: 67, duration: '5 мин' }
        ]
      },
      {
        id: 7,
        title: 'Финален тест',
        lessons: [
          { id: 'izv-quiz-final', title: 'Финален квиз', type: 'quiz', passingScore: 70, duration: '15 мин', isFinal: true }
        ]
      }
    ]
  },
  'rabotni-odnosi': {
    title: 'Работни односи',
    description: 'Разберете ги клучните аспекти на трудовото право, вработување, отпуштање и права на работниците.',
    modules: [] // Add other courses as needed
  },
  'lokalno-seo': {
    title: 'Локално SEO',
    description: 'Научете како да го оптимизирате вашиот бизнис за локално пребарување со Google Business Profile, NAP конзистентност, рецензии и AI SEO стратегии.',
    modules: [
      {
        id: 1,
        title: 'Модул 1: Вовед во локално SEO',
        lessons: [
          { id: 'lseo-lesson-1', title: 'Видео: Вовед во локално SEO', type: 'video', videoId: 'ctRtEzVgTk8', duration: '15 мин' },
          { id: 'lseo-reading-1', title: 'Читање: Вовед во SEO и локално пребарување', type: 'reading', duration: '15 мин' },
          { id: 'lseo-reading-2', title: 'Читање: Map Pack - најважната недвижност на интернетот', type: 'reading', duration: '10 мин' },
          { id: 'lseo-quiz-1', title: 'Квиз: Модул 1', type: 'quiz', passingScore: 67, duration: '5 мин' }
        ]
      },
      {
        id: 2,
        title: 'Модул 2: Crawlers и Discovery',
        lessons: [
          { id: 'lseo-lesson-2', title: 'Видео: Crawlers и Discovery', type: 'video', videoId: '0oVpwH06j_Y', duration: '15 мин' },
          { id: 'lseo-reading-3', title: 'Читање: Како пребарувачите ја наоѓаат вашата фирма', type: 'reading', duration: '10 мин' },
          { id: 'lseo-reading-4', title: 'Читање: Sitemaps и backlinks како патоказ', type: 'reading', duration: '10 мин' },
          { id: 'lseo-quiz-2', title: 'Квиз: Модул 2', type: 'quiz', passingScore: 67, duration: '5 мин' }
        ]
      },
      {
        id: 3,
        title: 'Модул 3: NAP конзистентност и цитати',
        lessons: [
          { id: 'lseo-lesson-3', title: 'Видео: NAP конзистентност', type: 'video', videoId: '46w_o7Y3-98', duration: '15 мин' },
          { id: 'lseo-reading-5', title: 'Читање: Дигиталниот пасош - NAP податоци', type: 'reading', duration: '10 мин' },
          { id: 'lseo-reading-6', title: 'Читање: Citations и директориуми', type: 'reading', duration: '10 мин' },
          { id: 'lseo-quiz-3', title: 'Квиз: Модул 3', type: 'quiz', passingScore: 67, duration: '5 мин' }
        ]
      },
      {
        id: 4,
        title: 'Модул 4: Рецензии и Trust сигнали',
        lessons: [
          { id: 'lseo-lesson-4', title: 'Видео: Рецензии и Trust сигнали', type: 'video', videoId: 'nJ14EOTkTSA', duration: '15 мин' },
          { id: 'lseo-reading-7', title: 'Читање: Review Velocity - брзината е поважна од бројот', type: 'reading', duration: '10 мин' },
          { id: 'lseo-reading-8', title: 'Читање: Ranking Layer Cake - слоеви на доверба', type: 'reading', duration: '10 мин' },
          { id: 'lseo-quiz-4', title: 'Квиз: Модул 4', type: 'quiz', passingScore: 67, duration: '5 мин' }
        ]
      },
      {
        id: 5,
        title: 'Модул 5: AI SEO и максимална дистрибуција',
        lessons: [
          { id: 'lseo-lesson-5', title: 'Видео: AI SEO и дистрибуција', type: 'video', videoId: 'mm1qlQGNBUw', duration: '15 мин' },
          { id: 'lseo-reading-9', title: 'Читање: AI препораки - како ChatGPT и Gemini препорачуваат бизниси', type: 'reading', duration: '10 мин' },
          { id: 'lseo-reading-10', title: 'Читање: Answer-First содржина и максимална дистрибуција', type: 'reading', duration: '10 мин' },
          { id: 'lseo-infographic', title: 'Инфографик: Локално SEO 2026 стратегија', type: 'reading', duration: '5 мин' },
          { id: 'lseo-quiz-5', title: 'Квиз: Модул 5', type: 'quiz', passingScore: 67, duration: '5 мин' }
        ]
      },
      {
        id: 6,
        title: 'Финален тест',
        lessons: [
          { id: 'lseo-download', title: 'Преземи: Локално SEO водич', type: 'download', duration: '2 мин' },
          { id: 'lseo-quiz-final', title: 'Финален квиз', type: 'quiz', passingScore: 70, duration: '15 мин', isFinal: true }
        ]
      }
    ]
  }
};

module.exports = { courseData };
