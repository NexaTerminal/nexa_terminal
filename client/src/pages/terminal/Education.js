import React from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import RightSidebar from '../../components/terminal/RightSidebar';
import styles from '../../styles/terminal/Dashboard.module.css';
import educationStyles from '../../styles/terminal/EducationGrid.module.css';

const courses = [
  {
    title: 'Основи на деловно право',
    description: 'Запознајте се со основните принципи на деловното право, договори, обврски и права на компаниите.',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'
  },
  {
    title: 'Финансии за претприемачи',
    description: 'Научете ги основите на финансиското управување, буџетирање и анализа на финансиски извештаи.',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80'
  },
  {
    title: 'Трудово право и работни односи',
    description: 'Разберете ги клучните аспекти на трудовото право, вработување, отпуштање и права на работниците.',
    image: 'https://images.unsplash.com/photo-1515168833906-d2a3b82b3029?auto=format&fit=crop&w=400&q=80'
  },
  {
    title: 'Заштита на лични податоци (GDPR)',
    description: 'Практичен курс за заштита на лични податоци и усогласување со европските и македонските регулативи.',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80'
  },
  {
    title: 'Даночна регулатива за компании',
    description: 'Сеопфатен преглед на даночните обврски, даночни олеснувања и практични совети за компании.',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80'
  },
  {
    title: 'Деловна етика и корпоративна одговорност',
    description: 'Курс за етичко водење на бизнис и општествена одговорност на компаниите.',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80'
  }
];

const Education = () => {
  return (
    <div>
      <Header isTerminal={true} />
      <div className={styles['dashboard-layout']}>
        <Sidebar />
        <main className={styles['dashboard-main']}>
          <h1 style={{ marginTop: 0, marginBottom: 24 }}>Обуки</h1>
          <div className={educationStyles.grid}>
            {courses.map((course, idx) => (
              <div key={idx} className={educationStyles.card}>
                <div className={educationStyles.imageWrapper}>
                  <img src={course.image} alt={course.title} className={educationStyles.image} />
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