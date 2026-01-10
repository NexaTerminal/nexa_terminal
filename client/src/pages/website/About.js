import React, { useState, useEffect, useMemo, memo } from 'react';
import SimpleNavbar from '../../components/common/SimpleNavbar';
import PublicFooter from '../../components/common/PublicFooter';
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

    // Only observe journey and cta sections, not feature sections
    const sectionsToObserve = document.querySelectorAll('#journey, #cta');
    sectionsToObserve.forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  // Feature sections data - memoized to prevent re-creation on every render
  const features = useMemo(() => [
    {
      id: 'dokumenti',
      title: 'Автоматизирани документи',
      tagline: 'Од концепт до договор за минути',
      description: 'Креирај професионални правни документи прилагодени на македонското законодавство. Системот автоматски ги пополнува информациите за твојата фирма и генерира документи готови за употреба.',
      videoUrl: 'https://www.youtube.com/watch?v=WG9Z0NadFJg',
      highlights: [
        'Договори за вработување и услуги',
        'ГДПР согласности и известувања',
        'Интерни правилници и акти',
        'Деловна кореспонденција'
      ]
    },
    {
      id: 'proverka',
      title: 'Правна проверка',
      tagline: 'Твојот Legal Health Check',
      description: 'Комплетна проверка на усогласеноста со македонското законодавство. Детален извештај со приоритизирани акции и препораки за подобрување на твојата фирма.',
      videoUrl: 'https://www.youtube.com/watch?v=98R2bDGKbgc',
      highlights: [
        'Заштита на лични податоци',
        'Работни односи и вработување',
        'Безбедност и здравје при работа',
        'Други регулативи'
      ]
    },
    {
      id: 'chatbot',
      title: 'АИ Чатбот',
      tagline: 'Твој правен асистент 24/7',
      description: 'Интелигентен АИ асистент обучен на македонското законодавство. Постави прашање и добиј прецизен одговор со цитирање на релевантни закони.',
      videoUrl: 'https://www.youtube.com/watch?v=IbTsGXAXHdY',
      highlights: [
        'Трениран и обучен на македонско право, закони и судска пракса',
        'Објаснувања на правни термини врз основа на разбирливи примери',
        'Насоки за усогласеност',
        'Достапен во секој момент'
      ]
    },
    {
      id: 'informativnaSodrzina',
      title: 'Информативна содржина',
      tagline: 'Знаење што те води понатаму',
      description: 'Пристапи до богата библиотека на ексклузивни содржини за право, маркетинг, претприемништво и инвестиции. Едуцирај се и развивај го твојот бизнис со стручни статии и водичи.',
      videoUrl: 'https://www.youtube.com/watch?v=LJXQtz--Sm8',
      highlights: [
        'Правни анализи и казуси',
        'Маркетинг стратегии за бизниси',
        'Водичи за претприемништво',
        'Совети за инвестиции и раст'
      ]
    },
    {
      id: 'advokat',
      title: 'Најди адвокат',
      tagline: 'Поврзи се со вистинскиот експерт',
      description: 'Marketplace за правни услуги каде можеш да најдеш верифицирани адвокати. Пребарувај по специјализација, споредувај профили и контактирај директно.',
      videoUrl: 'https://www.youtube.com/watch?v=1Z9nMueisuk',
      highlights: [
        'Барање на понуда по области на работа',
        'Анонимност до добивање на реална понуда',
        'Избор на најдобрата понуда',
        'Закажување на консултации'
      ]
    },
    {
      id: 'edukacija',
      title: 'Едукација',
      tagline: 'Учи за правните основи',
      description: 'Богата библиотека на едукативни содржини - курсеви, водичи, вебинари и статии. Стани експерт за правните прашања релевантни за твојот бизнис.',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      highlights: [
        'Онлајн курсеви за деловно работење и право',
        'Водичи за усогласеност',
        'Вебинари со правни експерти',
        'Блог со казуси и анализи'
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

      <SimpleNavbar />

      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroBackground}>
          <div className={styles.wavePattern}></div>
        </div>
        <div className={styles.heroContent}>
          <span className={styles.heroLabel}>Nexa Terminal</span>
          <h1 className={styles.heroTitle}>
            Твојата дигитална правна<br />
            <span className={styles.highlight}>трансформација</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Автоматизација и ефикасност на Вашата фирма со неколку клика
          </p>
          <button
            className={styles.ctaButton}
            onClick={(e) => scrollToSection(e, 'journey')}
          >
            Истражи ги можностите
          </button>
        </div>
        <div className={styles.scrollIndicator}>
          <div className={styles.scrollLine}></div>
          <span>Скролај за повеќе</span>
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
            <h2 className={styles.sectionTitle}>Зошто Nexa?</h2>
            <p className={styles.leadText}>
              Nexa Terminal е комплетна платформа која ги обединува сите правни потреби на современиот македонски бизнис на едно место. Од автоматизација на документи до поврзување со експерти.
            </p>
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

      {/* Final CTA Section */}
      <section
        className={`${styles.ctaSection} ${visibleSections.has('cta') ? styles.visible : ''}`}
        id="cta"
      >
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <span className={styles.ctaBadge}>08 — Финале</span>
            <h2 className={styles.ctaTitle}>
              Подготвен за<br />дигитална трансформација?
            </h2>
            <p className={styles.ctaText}>
              Придружи се на стотици македонски бизниси кои веќе ја користат Nexa Terminal за автоматизација на нивните правни процеси.
            </p>
            <a href="/login" className={styles.ctaButtonLarge}>
              Започни денес
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default About;
