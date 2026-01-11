import React, { useState, useEffect, useMemo, memo } from 'react';
import styles from '../../styles/website/About.module.css';

// Extract YouTube ID from URL
const getYouTubeId = (url) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/);
  return match ? match[1] : null;
};

// Memoized Video Section Component to prevent re-renders
const VideoSection = memo(({ videoUrl, title }) => {
  const videoId = useMemo(() => getYouTubeId(videoUrl), [videoUrl]);

  return (
    <div className={styles.videoWrapper}>
      <div className={styles.videoContainer}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=0&rel=0&modestbranding=1`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className={styles.videoPlayer}
          loading="lazy"
        />
      </div>
    </div>
  );
});

VideoSection.displayName = 'VideoSection';

const About = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set());

  // Track scroll progress with throttling
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight - windowHeight;
          const scrolled = window.scrollY;
          const progress = (scrolled / documentHeight) * 100;
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to section
  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    const navHeight = 80;
    const elementPosition = element.offsetTop - navHeight;

    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
  };

  // Track visible sections with Intersection Observer (only for non-feature sections)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      {
        rootMargin: '-15% 0px -15% 0px',
        threshold: 0.2
      }
    );

    // Only observe journey section, not feature sections
    const sectionsToObserve = document.querySelectorAll('#journey');
    sectionsToObserve.forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  // Feature sections data - memoized to prevent re-creation on every render
  const features = useMemo(() => [
    {
      id: 'dokumenti',
      title: 'Правна документација со брзина на светлината',
      tagline: 'Брзина. Прецизност. Без грешки.',
      description: 'Генерирајте стандардизирани договори и решенија за помалку од 60 секунди. Нашата база на професионални документи е целосно усогласена со македонското законодавство и подготвена за инстант употреба.',
      videoUrl: 'https://www.youtube.com/watch?v=WG9Z0NadFJg',
      highlights: [
        'Генерирање за < 60 секунди',
        'Целосна усогласеност со МК законодавство',
        'Стандардизирани професионални шаблони',
        'Инстант готови за употреба'
      ]
    },
    {
      id: 'proverka',
      title: 'Станете имуни на инспекции',
      tagline: 'Од реактивен кон проактивен бизнис',
      description: 'Не чекајте проблем за да реагирате. Нашата дијагностика прави 360° преглед на вашата фирма и ви дава јасен план за елиминирање на сите законски ризици пред тие да станат трошок.',
      videoUrl: 'https://www.youtube.com/watch?v=98R2bDGKbgc',
      highlights: [
        '360° преглед на комплајанс статус',
        'Идентификација на законски ризици',
        'Приоритизиран акционен план',
        'Превенција на инспекциски казни'
      ]
    },
    {
      id: 'chatbot',
      title: 'Вашиот дигитален правен стратег',
      tagline: 'Инстант експертиза 24/7',
      description: 'Добијте инстантна јасност за македонските закони 24/7. Нашиот АИ асистент не само што одговара на прашања, туку цитира релевантни закони и судска пракса, заменувајќи ги десетиците часови истражување.',
      videoUrl: 'https://www.youtube.com/watch?v=IbTsGXAXHdY',
      highlights: [
        'Цитирање на релевантни закони и пракса',
        'Заменува часови на правно истражување',
        'Достапен 24/7 без чекање',
        'Обучен на македонска регулатива'
      ]
    },
    {
      id: 'informativnaSodrzina',
      title: 'Стратешко знаење за пазарна доминација',
      tagline: 'Неправедна предност пред конкуренцијата',
      description: 'Пристапете до инсајдерски анализи, стратегии за маркетинг и водичи за инвестиции. Едуцирајте се со содржини кои ви даваат неправедна предност пред конкуренцијата.',
      videoUrl: 'https://www.youtube.com/watch?v=LJXQtz--Sm8',
      highlights: [
        'Инсајдерски правни анализи',
        'Стратегии за маркетинг доминација',
        'Практични водичи за инвестиции',
        'Ексклузивни бизнис инсајти'
      ]
    },
    {
      id: 'advokat',
      title: 'Директен пристап до елитни експерти',
      tagline: 'Анонимно до најдобрата понуда',
      description: 'Кога ви е потребна специфична правна помош, Nexa ве поврзува со верифицирани адвокати. Добијте понуди анонимно и изберете го најдобриот партнер за вашиот следен голем чекор.',
      videoUrl: 'https://www.youtube.com/watch?v=1Z9nMueisuk',
      highlights: [
        'Верифицирани правни експерти',
        'Анонимно барање на понуди',
        'Споредба на повеќе профили',
        'Избор на најдобар партнер за вашиот бизнис'
      ]
    },
    {
      id: 'edukacija',
      title: 'Професионална едукација за модерен бизнис',
      tagline: 'Од основи до напредни стратегии',
      description: 'Комплетна библиотека на курсеви, вебинари и анализи за правни и бизнис теми. Стекнете ги знаењата кои ги имаат само големите играчи на пазарот.',
      videoUrl: 'https://www.youtube.com/watch?v=IrgddYz1bQM',
      highlights: [
        'Структурирани онлајн курсеви',
        'Вебинари со индустриски експерти',
        'Казуси од реални ситуации',
        'Сертификати за завршени курсеви'
      ]
    },
    // {
    //   id: 'vmrezhuvanje',
    //   title: 'Вмрежување',
    //   tagline: 'Градење на професионална заедница',
    //   description: 'Поврзи се со други бизниси, споделувај искуства и соработувај. Градење на вредна професионална мрежа со единствена цел - раст.',
    //   videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    //   highlights: [
    //     'Форуми за дискусии и прашања',
    //     'Групи по индустрии и интереси',
    //     'Настани и вебинари',
    //     'Можности за партнерства'
    //   ]
    // }
  ], []);

  return (
    <div className={styles.aboutPage}>
      {/* Scroll Progress Bar */}
      <div className={styles.progressBar} style={{ width: `${scrollProgress}%` }} />

      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroBackground}>
          <div className={styles.wavePattern}></div>
        </div>
        <div className={styles.heroContent}>
          <span className={styles.heroLabel}>Nexa</span>
          <h1 className={styles.heroTitle}>
            Оперативниот систем за<br />
            <span className={styles.highlight}>моќен бизнис</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Поставете ја вашата фирма на цврсти темели. Nexa Terminal ви ја нуди правната и оперативната инфраструктура на големите корпорации, со брзина на стартап.
          </p>
          <button
            className={styles.ctaButton}
            onClick={(e) => scrollToSection(e, 'journey')}
          >
            Обезбеди Early Access профил
          </button>
        </div>
        <div className={styles.scrollIndicator}>
          <div className={styles.scrollLine}></div>
          <span>Прочитај како</span>
        </div>
      </div>

      {/* Journey Introduction */}
      <section
        id="journey"
        className={`${styles.journeyIntro} ${visibleSections.has('journey') ? styles.visible : ''}`}
      >
        <div className={styles.container}>
          <div className={styles.journeyContent}>
            <span className={styles.badge}>01 — Почеток</span>
            <h2 className={styles.sectionTitle}>Вашиот Business OS</h2>
            <p className={styles.leadText}>Nexa Terminal не е само платформа. Тоа е сеопфатен систем за модерен македонски бизнис.</p>
            <p className={styles.leadText}>Од правна документација до стратешки информации, од дијагностика за усогласеност до пристап до врвни експерти – сè што ви треба за да го водите вашиот бизнис со сигурност и брзина.</p>
          </div>
        </div>
      </section>

      {/* Feature Sections with Scrollytelling */}
      {features.map((feature, index) => (
        <section
          key={feature.id}
          id={feature.id}
          className={`${styles.featureSection} ${index % 2 === 0 ? styles.leftAlign : styles.rightAlign}`}
        >
          <div className={styles.container}>
            <div className={styles.featureWrapper}>
              <div className={styles.featureContent}>
                <span className={styles.featureLabel}>
                  {String(index + 2).padStart(2, '0')} — {feature.tagline}
                </span>
                <h2 className={styles.featureTitle}>{feature.title}</h2>
                <p className={styles.featureDescription}>{feature.description}</p>

                <div className={styles.featureHighlights}>
                  <h3 className={styles.highlightsTitle}>Клучни карактеристики</h3>
                  <ul className={styles.highlightsList}>
                    {feature.highlights.map((highlight, i) => (
                      <li key={i} className={styles.highlightItem}>
                        <span className={styles.highlightDot}></span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={styles.featureMedia}>
                <VideoSection videoUrl={feature.videoUrl} title={feature.title} />
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className={styles.featureNumber}>{String(index + 2).padStart(2, '0')}</div>
        </section>
      ))}

      {/* Free Signup Trust Section - Story Conclusion */}
      <section className={styles.trustSection}>
        <div className={styles.trustBackground}>
          <div className={styles.container}>
            <div className={styles.trustLayout}>
              <div className={styles.trustHero}>
                <span className={styles.trustBadge}>07 — Early Access</span>
                <h2 className={styles.trustMainTitle}>
                  Започнете ја вашата трансформација <span className={styles.trustHighlight}>без бариери</span>
                </h2>
                <p className={styles.trustDescription}>
                  Ние го поставуваме стандардот за модерен бизнис во Македонија. Како дел од нашата Early Access програма, добивате 14 гратис кредити за користење на сите функции веднаш. Без банкарски картички. Без скриени трошоци. Само чиста вредност.
                </p>
                <div className={styles.trustStats}>
                  <div className={styles.statItem}>
                    <div className={styles.statNumber}>14</div>
                    <div className={styles.statLabel}>кредити за добредојде</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statNumber}>0</div>
                    <div className={styles.statLabel}>денари трошок</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statNumber}>60</div>
                    <div className={styles.statLabel}>секунди регистрација</div>
                  </div>
                </div>
              </div>

              <div className={styles.trustCards}>
                <div className={styles.trustCard}>
                  <h3>14 кредити - кои се обновуваат секоја седмица</h3>
                  <p>Користете ги сите функции бесплатно. Генерирајте документи, проверете усогласеност, консултирајте се со AI.</p>
                </div>
                <div className={styles.trustCard}>
                  <h3>Без банкарски картички</h3>
                  <p>Не бараме картички. Само email и лозинка. Почнете со користење веднаш.</p>
                </div>
                <div className={styles.trustCard}>
                  <h3>Безбедност на податоци</h3>
                  <p>Чуваме само јавни информации што ги обезбедувате. Вашите податоци се целосно заштитени.</p>
                </div>
              </div>
            </div>

            <div className={styles.trustCtaWrapper}>
              <a href="/login" className={styles.trustCtaButton}>
                Земи ги твоите 14 кредити →
              </a>
              <p className={styles.trustDisclaimer}>
                Без обврски • Без договори • Само чиста вредност
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
