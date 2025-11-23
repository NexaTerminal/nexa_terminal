import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/terminal/LegalScreening.module.css';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import ProfileReminderBanner from '../../components/terminal/ProfileReminderBanner';

const LegalScreening = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: 'employment',
      title: 'Работни односи',
      description: 'Проверка на усогласеноста со законите за работни односи, договори за вработување, и права на вработените.',
      icon: '👔',
      status: 'active'
    },
    {
      id: 'health-safety',
      title: 'Безбедност и здравје при работа',
      description: 'Евалуација на мерките за безбедност, превенција на повреди, и законска усогласеност на работното место.',
      icon: '🦺',
      status: 'active'
    },
    {
      id: 'gdpr',
      title: 'Лични податоци',
      description: 'Преглед на усогласеноста со GDPR, обработка на лични податоци, и заштита на приватноста.',
      icon: '🔒',
      status: 'active'
    },
    {
      id: 'trade',
      title: 'Трговија',
      description: 'Проверка на договори, фактури, деловни практики, и усогласеност со трговското право.',
      icon: '🏢',
      status: 'coming-soon'
    },
    {
      id: 'mobbing',
      title: 'Мобинг',
      description: 'Анализа на политиките за спречување на малтретирање на работното место и заштита на вработените.',
      icon: '🛡️',
      status: 'coming-soon'
    }
  ];

  const handleCategoryClick = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);

    if (category.status === 'active') {
      navigate(`/terminal/legal-screening/${categoryId}`);
    } else {
      alert(`Категоријата "${category.title}" наскоро ќе биде достапна.`);
    }
  };

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <ProfileReminderBanner />

          <div className={styles["page-container"]}>
            {/* Page Header */}
            <div className={styles["page-header"]}>
              <h1>Изберете категорија за проверка</h1>
              <p>
                Кликнете на категорија за да започнете со проверка на правната усогласеност на вашата компанија во таа област.
              </p>
            </div>

            {/* Categories Grid */}
            <div className={styles["categories-grid"]}>
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={styles["category-card"]}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <div className={styles["category-icon"]}>
                    {category.icon}
                  </div>
                  <h3 className={styles["category-title"]}>{category.title}</h3>
                  <p className={styles["category-description"]}>{category.description}</p>
                  <span className={`${styles["category-status"]} ${styles[category.status]}`}>
                    {category.status === 'active' ? 'Достапно' : 'Наскоро'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LegalScreening;
