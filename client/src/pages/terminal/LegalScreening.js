import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/terminal/LegalScreening.module.css';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';

const LegalScreening = () => {
  const navigate = useNavigate();

  // Cards are organised into visual groups (see GROUPS below). Each card carries
  // a `group` key; within a group the descriptive name is the title and the
  // group header carries the shared family label, so titles stay short.
  const categories = [
    {
      id: 'general',
      group: 'quick',
      title: 'Брз преглед',
      description: '20 случајно избрани прашања од сите области за брза проценка на усогласеноста на вашата компанија.',
      icon: '🎯',
      status: 'active'
    },

    // ─── Работни односи ───────────────────────────────────────────────
    {
      id: 'employment-part1',
      group: 'employment',
      title: 'Вработување и договори',
      subtitle: 'Дел 1',
      description: 'Проверка на процесите за вработување, договори за работа, организација и специјални договори (30 прашања).',
      icon: '📝',
      status: 'active'
    },
    {
      id: 'employment-part2',
      group: 'employment',
      title: 'Заштита и престанок',
      subtitle: 'Дел 2',
      description: 'Проверка на заштитата на работниците, плаќање и престанок на работен однос (18 прашања).',
      icon: '🛡️',
      status: 'active'
    },
    {
      id: 'employment-part3',
      group: 'employment',
      title: 'Работно време и одмор',
      subtitle: 'Дел 3',
      description: 'Проверка на работното време, прекувремена и ноќна работа, одмори и отсуства (29 прашања).',
      icon: '⏰',
      status: 'active'
    },
    {
      id: 'employment-part4',
      group: 'employment',
      title: 'Посебна заштита',
      subtitle: 'Дел 4',
      description: 'Проверка на заштитата на бремени работнички, родители и лица со намалена работна способност (7 прашања).',
      icon: '👶',
      status: 'active'
    },

    // ─── Области на усогласеност ──────────────────────────────────────
    {
      id: 'health-safety',
      group: 'areas',
      title: 'Безбедност и здравје при работа',
      subtitle: 'ЗБЗР + правилници',
      description: 'Проверка на изјавата за безбедност (проценка на ризик), стручно лице и медицина на трудот, обуки, здравствени прегледи, прва помош и евакуација, опрема, ЛЗО, работа со екрани и евиденции.',
      icon: '🦺',
      status: 'active'
    },
    {
      id: 'gdpr',
      group: 'areas',
      title: 'Лични податоци',
      description: 'Преглед на усогласеноста со GDPR, обработка на лични податоци, и заштита на приватноста.',
      icon: '🔒',
      status: 'active'
    },
    {
      id: 'archives',
      group: 'areas',
      title: 'Архивско и канцелариско работење',
      subtitle: 'Закон 135/2025 + Упатство 99/2014',
      description: 'Проверка на усогласеноста со новиот Закон за архивски материјал и архивска дејност (примена од 1 јуни 2026): план на архивски знаци, листи со рокови, деловодник, услови за чување, одбирање и уништување.',
      icon: '📚',
      status: 'active'
    },
    {
      id: 'protection-rescue',
      group: 'areas',
      title: 'Заштита, спасување и превенција на пожари',
      subtitle: 'ЗЗС + Закон за пожарникарството',
      description: 'Проверка на обврските на трговските друштва: процена на загрозеност и план за заштита и спасување, организација и известување, противпожарна опрема и евакуација, опасни материи и соработка со надлежните органи.',
      icon: '🚨',
      status: 'active'
    },
    {
      id: 'waste-management',
      group: 'areas',
      title: 'Управување со отпад, пакување и батерии',
      subtitle: 'Закон за отпад + пакување + батерии',
      description: 'Проверка на обврските за отпад: предавање на овластен собирач, евиденција, изјава на краен доставувач за пакување, пластични кеси, батерии, опасен отпад и складирање. Прашањата се прилагодуваат според вашата дејност.',
      icon: '♻️',
      status: 'active'
    },

    // ─── Даночна усогласеност ─────────────────────────────────────────
    {
      id: 'tax-profit',
      group: 'tax',
      title: 'Данок на добивка',
      subtitle: 'Закон за данокот на добивка',
      description: 'Проверка на признати/непризнати расходи (репрезентација, лимити по вработен, донации, камати), точниот даночен режим (ДБ / ДБ-ВП) и аконтации, отписи и амортизација, и трансферни цени со поврзани лица. Прашањата се прилагодуваат според профилот на вашата компанија.',
      icon: '📊',
      status: 'active'
    },
    {
      id: 'tax-vat',
      group: 'tax',
      title: 'ДДВ (Данок на додадена вредност)',
      subtitle: 'Закон за ДДВ',
      description: 'Проверка на одбивката на претходен данок (само по валидни фактури), навремени пријави и уплати, воедначени ДДВ евиденции, ослободен/мешан промет и издавање фискални сметки. Прашањата се прилагодуваат според тоа дали сте регистрирани за ДДВ и работите со готовина.',
      icon: '🧾',
      status: 'active'
    },
    {
      id: 'tax-payroll',
      group: 'tax',
      title: 'Плати и придонеси',
      subtitle: 'Персонален данок + придонеси',
      description: 'Проверка на пресметката на плати: целосна бруто основица (не под минимална, без исплати „на рака"), оданочување на бенефиции во натура, точна класификација (вработување наспроти договор на дело) и навремени МПИН пресметки и уплати. Модулот се однесува главно на работодавачи.',
      icon: '👥',
      status: 'active'
    },
    {
      id: 'tax-general',
      group: 'tax',
      title: 'Општа даночна дисциплина',
      subtitle: 'Даночна постапка + финансиска дисциплина',
      description: 'Проверка на уредни деловни книги, чување документи (10/5 години), рокови на плаќање кон добавувачи (60/120 дена), дневен готовински извештај и данок по задршка кон нерезиденти. Овие обврски важат за секоја компанија.',
      icon: '🗂️',
      status: 'active'
    },

    // ─── Наскоро ──────────────────────────────────────────────────────
    {
      id: 'trade',
      group: 'soon',
      title: 'Трговија',
      description: 'Проверка на договори, фактури, деловни практики, и усогласеност со трговското право.',
      icon: '🏢',
      status: 'coming-soon'
    },
    {
      id: 'mobbing',
      group: 'soon',
      title: 'Мобинг',
      description: 'Анализа на политиките за спречување на малтретирање на работното место и заштита на вработените.',
      icon: '⚖️',
      status: 'coming-soon'
    }
  ];

  // Visual groups in display order. `id` matches the `group` key on each card.
  const GROUPS = [
    { id: 'quick', title: 'Брза проценка', description: 'Почнете тука за брз преглед низ сите области.' },
    { id: 'employment', title: 'Работни односи', description: 'Усогласеност со Законот за работните односи, поделена на четири дела.' },
    { id: 'areas', title: 'Области на усогласеност', description: 'Проверки по посебни закони и области што се однесуваат на вашата дејност.' },
    { id: 'tax', title: 'Даночна усогласеност', description: 'Четири под-проверки за даночните обврски на вашата компанија.' },
    { id: 'soon', title: 'Наскоро', description: 'Области што допрва ќе бидат достапни.' }
  ];

  const handleCategoryClick = (category) => {
    if (category.status === 'active') {
      navigate(`/terminal/legal-screening/${category.id}`);
    } else {
      alert(`Категоријата "${category.title}" наскоро ќе биде достапна.`);
    }
  };

  const renderCard = (category) => (
    <div
      key={category.id}
      className={styles["category-card"]}
      onClick={() => handleCategoryClick(category)}
    >
      <div className={styles["category-icon"]}>
        {category.icon}
      </div>
      <h3 className={styles["category-title"]}>{category.title}</h3>
      {category.subtitle && (
        <p className={styles["category-subtitle"]}>{category.subtitle}</p>
      )}
      <p className={styles["category-description"]}>{category.description}</p>
      <span className={`${styles["category-status"]} ${styles[category.status]}`}>
        {category.status === 'active' ? 'Достапно' : 'Наскоро'}
      </span>
    </div>
  );

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <div className={styles["page-container"]}>
            {/* Page Header */}
            <div className={styles["page-header"]}>
              <h1>Изберете категорија за проверка</h1>
              <p>
                Кликнете на категорија за да започнете со проверка на правната усогласеност на вашата компанија во таа област.
              </p>
            </div>

            {/* Grouped sections */}
            {GROUPS.map((group) => {
              const cards = categories.filter((c) => c.group === group.id);
              if (cards.length === 0) return null;
              return (
                <section key={group.id} className={styles["group-section"]}>
                  <div className={styles["group-header"]}>
                    <h2 className={styles["group-title"]}>{group.title}</h2>
                    {group.description && (
                      <p className={styles["group-description"]}>{group.description}</p>
                    )}
                  </div>
                  <div className={styles["categories-grid"]}>
                    {cards.map(renderCard)}
                  </div>
                </section>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LegalScreening;
