import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import RightSidebar from '../../components/terminal/RightSidebar';
import styles from '../../styles/terminal/Dashboard.module.css';
import educationStyles from '../../styles/terminal/EducationGrid.module.css';

const courses = [
  // {
  //   id: 'osnovi-delovno-pravo',
  //   title: 'Основи на деловно право',
  //   description: 'Запознајте се со основните принципи на деловното право, договори, обврски и права на компаниите.',
  //   image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
  //   available: false
  // },
  // {
  //   id: 'finansii-pretpriemaci',
  //   title: 'Финансии за претприемачи',
  //   description: 'Научете ги основите на финансиското управување, буџетирање и анализа на финансиски извештаи.',
  //   image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80',
  //   available: false
  // },
  {
    id: 'rabotni-odnosi',
    title: 'Работни односи',
    description: 'Разберете ги клучните аспекти на трудовото право, вработување, отпуштање и права на работниците.',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80',
    category: 'legal',
    available: true
  },
  {
    id: 'udel-vo-drushtvo',
    title: 'Удел во трговско друштво',
    description: 'Комплетен курс за разбирање на уделот во друштвото, права на сопствениците, процедури за стекнување и пренесување на удел.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
    category: 'legal',
    available: true
  },
  {
    id: 'izvrsuvanje-nedviznosti',
    title: 'Извршување врз недвижности',
    description: 'Комплетен курс за постапката на извршување врз недвижности - од прибелешка до намирување на доверителите.',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
    category: 'legal',
    available: true
  },
  {
    id: 'lokalno-seo',
    title: 'Локално SEO',
    description: 'Научете како да го оптимизирате вашиот бизнис за локално пребарување со Google Business Profile, NAP конзистентност, рецензии и AI SEO стратегии.',
    image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=800&q=80',
    category: 'marketing',
    available: true
  },
  // {
  //   id: 'zastita-licni-podatoci',
  //   title: 'Заштита на лични податоци (GDPR)',
  //   description: 'Практичен курс за заштита на лични податоци и усогласување со европските и македонските регулативи.',
  //   image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80',
  //   available: false
  // },
  // {
  //   id: 'danocna-regulativa',
  //   title: 'Даночна регулатива за компании',
  //   description: 'Сеопфатен преглед на даночните обврски, даночни олеснувања и практични совети за компании.',
  //   image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80',
  //   available: false
  // },
  // {
  //   id: 'delovna-etika',
  //   title: 'Деловна етика и корпоративна одговорност',
  //   description: 'Курс за етичко водење на бизнис и општествена одговорност на компаниите.',
  //   image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
  //   available: false
  // }
];

const CATEGORIES = [
  { key: 'all',        label: 'Сите' },
  { key: 'legal',      label: 'Правни' },
  { key: 'marketing',  label: 'Маркетинг' },
  { key: 'management', label: 'Менаџмент' }
];

const Education = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const handleCourseClick = (course) => {
    if (course.available) {
      navigate(`/terminal/education/course/${course.id}`);
    }
  };

  // Filter by category, then sort: available first, then coming soon.
  const visibleCourses = courses
    .filter(c => filter === 'all' || c.category === filter)
    .sort((a, b) => (a.available === b.available ? 0 : a.available ? -1 : 1));

  return (
    <div>
      <Header isTerminal={true} />
      <div className={styles['dashboard-layout']}>
        <Sidebar />
        <main className={styles['dashboard-main']}>
          <div className={educationStyles.filterBar} role="tablist" aria-label="Категории">
            {CATEGORIES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                className={`${educationStyles.filterBtn} ${filter === key ? educationStyles.filterBtnActive : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={educationStyles.grid}>
            {visibleCourses.length === 0 && (
              <p className={educationStyles.emptyState}>Нема курсеви во оваа категорија.</p>
            )}
            {visibleCourses.map((course, idx) => (
              <div
                key={idx}
                className={`${educationStyles.card} ${course.available ? educationStyles.available : educationStyles.unavailable}`}
                onClick={() => handleCourseClick(course)}
                style={{ cursor: course.available ? 'pointer' : 'not-allowed', opacity: course.available ? 1 : 0.6 }}
              >
                <div className={educationStyles.imageWrapper}>
                  <img src={course.image} alt={course.title} className={educationStyles.image} />
                  {!course.available && (
                    <div className={educationStyles.comingSoon}>
                      <span>Наскоро</span>
                    </div>
                  )}
                </div>
                <h2 className={educationStyles.title}>{course.title}</h2>
                <p className={educationStyles.description}>{course.description}</p>
              </div>
            ))}
          </div>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
};

export default Education; 