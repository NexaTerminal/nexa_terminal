import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import Icon from '../../components/website/Icon';
import useScrollReveal from '../../hooks/useScrollReveal';
import { NEXA_ORG, NEXA_WEBSITE, webPage } from '../../components/seo/schemaGraph';
import styles from './Home.module.css';

export default function Home() {
  const { t } = useTranslation('website');
  useScrollReveal();
  const lang = i18n.language || 'mk';
  const isMk = lang === 'mk';
  const url = 'https://nexa.mk/';

  const SATELLITES = [
    {
      name: 'СамоДаПрашам',
      url: 'https://samodaprasham.mk',
      domain: 'samodaprasham.mk',
      tag: isMk ? 'Правни прашања од граѓани' : 'Citizen legal questions',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
      title: isMk ? 'Граѓаните имаат правни прашања. Некои се сериозни случаи.' : 'Citizens have legal questions. Some are serious cases.',
      body: isMk
        ? 'Илјадници луѓе годишно бараат одговор за наследство, развод, кривична одбрана, имотни спорови и работни односи. Голем дел од нив имаат потреба од вистинско правно застапување — не само информација. Преку платформата, нивните прашања стигнуваат до правник со соодветна област.'
        : 'Thousands of people each year search for answers on inheritance, divorce, criminal defense, property disputes and employment. Many need real representation — not just information. Their questions route through the platform to a lawyer in the right practice area.',
      audience: isMk ? 'Целна публика: физички лица' : 'Audience: individuals'
    },
    {
      name: 'Immigration.mk',
      url: 'https://immigration.mk',
      domain: 'immigration.mk',
      tag: isMk ? 'Странци кои живеат во Македонија' : 'Foreigners living in Macedonia',
      image: 'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?auto=format&fit=crop&w=1200&q=80',
      title: isMk ? 'Странците бараат стручна помош за дозвола за престој.' : 'Foreigners need expert help with residence permits.',
      body: isMk
        ? 'Странски државјани, инвеститори и работници постојано имаат потреба од издавање, обновување и пренамена на дозволи за престој. Без локален советник, процесот е тежок. Овие посетители се клиенти со јасна намера да платат — често за итен случај.'
        : 'Foreign citizens, investors and workers constantly need to obtain, renew or change residence permits. Without a local advisor the process is difficult. These visitors come with clear intent to pay — often for an urgent case.',
      audience: isMk ? 'Целна публика: странци, инвеститори' : 'Audience: foreigners, investors'
    },
    {
      name: 'Македонско државјанство',
      url: 'https://macedoniancitizenship.mk',
      domain: 'macedoniancitizenship.mk',
      tag: isMk ? 'Дијаспора и потомци' : 'Diaspora and descendants',
      image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1200&q=80',
      title: isMk ? 'Дијаспората бара начин да го врати државјанството.' : 'The diaspora seeks to reclaim citizenship.',
      body: isMk
        ? 'Луѓе со македонско потекло од Австралија, САД, Канада и Европа аплицираат за државјанство преку различни основи — потекло, брак, инвестиција. Случаите бараат правно водство и подготовка на документи во рок од месеци, не недели. Тоа е работа на специјализиран адвокат.'
        : 'People with Macedonian roots from Australia, the US, Canada and Europe apply for citizenship through various paths — origin, marriage, investment. These cases need legal guidance and document preparation over months, not weeks. That is specialist work.',
      audience: isMk ? 'Целна публика: дијаспора, потомци' : 'Audience: diaspora, descendants'
    },
    {
      name: 'Company.nexa.mk',
      url: 'https://company.nexa.mk',
      domain: 'company.nexa.mk',
      tag: isMk ? 'Нови претприемачи' : 'New entrepreneurs',
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
      title: isMk ? 'Претприемачи бараат да отворат фирма.' : 'Entrepreneurs are looking to register a company.',
      body: isMk
        ? 'Регистрација на ДОО, ДООЕЛ, АД, подружница, измена на основач, регистрација во Централен регистар. Секој месец стотици претприемачи го пребаруваат овој процес и имаат потреба од сметководител и адвокат уште од прв ден.'
        : 'Setting up a DOO, DOOEL, AD, branch office, change of owner, registration with the Central Registry. Each month hundreds of founders search this process and need an accountant and a lawyer from day one.',
      audience: isMk ? 'Целна публика: основачи, инвеститори' : 'Audience: founders, investors'
    },
    {
      name: 'IPLaw.nexa.mk',
      url: 'https://iplaw.nexa.mk',
      domain: 'iplaw.nexa.mk',
      tag: isMk ? 'Брендови и иноватори' : 'Brands and innovators',
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
      title: isMk ? 'Брендовите и иноваторите бараат заштита.' : 'Brands and innovators need protection.',
      body: isMk
        ? 'Заштитни знаци, патенти, авторски права, лиценцирање. Компаниите кои растат имаат потреба да го заштитат тоа што го градат. Овие клиенти веќе се успешни — можат да си дозволат професионални услуги и плаќаат за квалитет.'
        : 'Trademarks, patents, copyrights, licensing. Growing companies need to protect what they build. These clients are already successful — they can afford professional services and pay for quality.',
      audience: isMk ? 'Целна публика: компании во раст' : 'Audience: growing companies'
    }
  ];

  const STEPS = [
    {
      title: isMk ? 'Регистрирајте се за 30 секунди' : 'Sign up in 30 seconds',
      body:  isMk
        ? 'Само корисничко име и лозинка. Без картичка, без обврска. 8 дена целосен пристап до сè.'
        : 'Just a username and password. No card, no commitment. 8 days of full access to everything.'
    },
    {
      title: isMk ? 'Пробајте го Терминалот' : 'Try the Terminal',
      body:  isMk
        ? 'Генерирајте договор за 30 секунди. Анализирајте постоен договор. Спроведете проверка на усогласеност. Прашајте го AI помошникот.'
        : 'Generate a contract in 30 seconds. Analyze an existing contract. Run a compliance check. Ask the AI assistant.'
    },
    {
      title: isMk ? 'Останете кога ќе видите вредност' : 'Stay when you see the value',
      body:  isMk
        ? 'По 8 дена изберете план што ви одговара. Ако не сте задоволни — едноставно не плаќате и сметката се суспендира.'
        : 'After 8 days pick the plan that fits. Not happy — simply don\'t pay and the account suspends.'
    }
  ];

  return (
    <PublicLayout>
      <SEOHelmet
        title={t('home.seoTitle')}
        description={t('home.seoDesc')}
        canonical="/"
        locale={isMk ? 'mk_MK' : 'en_US'}
        altLocale={isMk ? 'en_US' : 'mk_MK'}
        jsonLd={[NEXA_ORG, NEXA_WEBSITE, webPage({ url, name: 'Nexa', description: t('home.seoDesc'), language: lang })]}
      />

      {/* ============ HERO ============ */}
      <section className={`${styles.hero} nx-hero-aurora`}>
        <span className="nx-orb nx-orb-1" aria-hidden></span>
        <span className="nx-orb nx-orb-2" aria-hidden></span>

        <div className={`nexa-container ${styles.heroInner}`}>
          <span className={`nx-pill ${styles.heroPill} nx-fade-in-up`}>
            <Icon name="globe" size={14} />
            {isMk ? 'Деловен екосистем за Северна Македонија' : 'Business ecosystem for North Macedonia'}
          </span>
          <h1 className="nx-fade-in-up nx-d-100">{t('home.heroTitle')}</h1>
          <div className={`${styles.heroCtas} nx-fade-in-up nx-d-300`}>
            <Link to="/login" className="nexa-btn nexa-btn-accent nexa-btn-lg">
              {t('home.ctaTerminal')}
              <Icon name="arrowRight" size={18} />
            </Link>
            <Link to="/pricing" className="nexa-btn nexa-btn-secondary nexa-btn-lg">
              {t('home.ctaProfessionals')}
            </Link>
          </div>
          <p className={`${styles.heroTertiary} nx-fade-in-up nx-d-400`}>
            <Link to="/about">{t('home.ctaSeeHow')}</Link>
          </p>
        </div>
      </section>

      {/* ============ ECOSYSTEM ============ */}
      <section className="nx-section">
        <div className="nexa-container">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">{isMk ? 'Екосистем' : 'Ecosystem'}</span>
            <h2>
              {isMk
                ? 'Nexa е целосен екосистем кој го надградува твојот бизнис.'
                : 'Nexa is a complete ecosystem that upgrades your business.'}
            </h2>
            <p>
              {isMk
                ? 'Не е само алатка. Прво ти ги автоматизира внатрешните процеси — документи, проверки за усогласеност, AI помош. Потоа ти носи нови клиенти преку мрежа од специјализирани сајтови. И на крај, те прави видлив како експерт во твојата област. Еве како го правиме сето тоа — еден дел по еден.'
                : 'Not just a tool. First it automates your internal processes — documents, compliance checks, AI assistance. Then it brings you new clients through a network of specialized sites. Finally it makes you visible as an expert in your field. Here is how we do all of this — one part at a time.'}
            </p>
          </div>

          <div className={`${styles.chapterMarker} nx-reveal`}>
            <span className={styles.chapterNum}>{isMk ? 'Дел 1' : 'Part 1'}</span>
            <h3 className={styles.chapterTitle}>
              {isMk ? 'Носиме клиенти кај тебе' : 'We bring clients to you'}
            </h3>
            <p className={styles.chapterLead}>
              {isMk
                ? 'Управуваме мрежа од специјализирани сајтови. Секој покрива конкретна потреба, секој таргетира посетители со јасна намера да платат. Тие посетители — твои клиенти.'
                : 'We run a network of specialized sites. Each covers a specific need, each targets visitors with clear intent to pay. Those visitors — your clients.'}
            </p>
          </div>

          <div className={styles.satelliteList}>
            {SATELLITES.map((s, i) => (
              <article
                key={s.url}
                className={`${styles.satellite} nx-reveal ${i % 2 === 1 ? styles.satelliteFlip : ''}`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <a className={styles.satelliteImage} href={s.url} target="_blank" rel="noopener">
                  <img src={s.image} alt={s.name} loading="lazy" />
                  <span className={styles.satelliteDomainBadge}>{s.domain}</span>
                </a>
                <div className={styles.satelliteContent}>
                  <span className={styles.satelliteTag}>{s.tag}</span>
                  <h3 className={styles.satelliteTitle}>{s.title}</h3>
                  <p className={styles.satelliteBody}>{s.body}</p>
                  <div className={styles.satelliteMeta}>
                    <span className={styles.satelliteAudience}>{s.audience}</span>
                    <a className={styles.satelliteLink} href={s.url} target="_blank" rel="noopener">
                      {isMk ? 'Посети' : 'Visit'} <Icon name="arrowRight" size={14} />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TOPICS.NEXA HIGHLIGHT ============ */}
      <section className={`nx-section ${styles.topicsSection}`}>
        <div className="nexa-container">
          <div className={`${styles.chapterMarker} ${styles.chapterMarkerCentered} nx-reveal`}>
            <span className={styles.chapterNum}>{isMk ? 'Дел 2' : 'Part 2'}</span>
            <h3 className={styles.chapterTitle}>
              {isMk ? 'Те правиме видлив експерт' : 'We make you a visible expert'}
            </h3>
            <p className={styles.chapterLead}>
              {isMk
                ? 'Содржината што ја создаваш — одговорите на прашања и стручни мислења — стануваат твоја најдобра реклама. Луѓето те препознаваат пред да те побараат.'
                : 'The content you create — answers to questions and expert opinions — becomes your best advertising. People recognize you before they reach out.'}
            </p>
          </div>
          <div className={styles.topicsCard}>
            <div className={styles.topicsContent}>
              <span className="nx-eyebrow">Topics.nexa</span>
              <h2 className={styles.topicsHeading}>
                {isMk
                  ? 'Експертски одговори. Видливи насекаде.'
                  : 'Expert answers. Visible everywhere.'}
              </h2>
              <p className={styles.topicsBody}>
                {isMk
                  ? 'Topics.nexa е платформа за прашања и одговори за бизнис и правни теми во Македонија. Како Admin корисник, твоите одговори стануваат дел од јавна, SEO + GEO оптимизирана содржина. Google и AI асистентите ги пронаоѓаат, а потенцијалните клиенти те препознаваат тебе како експерт.'
                  : 'Topics.nexa is a Q&A platform for business and legal topics in Macedonia. As an Admin user, your answers become part of public, SEO + GEO-optimized content. Google and AI assistants surface them, and prospective clients recognize you as the expert.'}
              </p>
              <ul className={styles.topicsPoints}>
                <li>{isMk ? 'Директна промоција преку експертиза, не реклама' : 'Direct promotion through expertise, not ads'}</li>
                <li>{isMk ? 'Содржината го таргетира она што луѓето веќе го пребаруваат' : 'Content targets what people already search for'}</li>
                <li>{isMk ? 'AI асистентите цитираат твои одговори при барања' : 'AI assistants cite your answers in responses'}</li>
              </ul>
              <a className="nexa-btn nexa-btn-secondary" href="https://topics.nexa.mk" target="_blank" rel="noopener">
                {isMk ? 'Отвори Topics.nexa' : 'Open Topics.nexa'} <Icon name="arrowRight" size={16} />
              </a>
            </div>
            <div className={styles.topicsVisual} aria-hidden>
              <div className={styles.topicsCardStack}>
                <div className={`${styles.topicsMockCard} ${styles.topicsMockCard1}`}>
                  <div className={styles.topicsMockQ}>?</div>
                  <div>
                    <div className={styles.topicsMockTitle}>{isMk ? 'Како се пресметува отпремнина?' : 'How is severance calculated?'}</div>
                    <div className={styles.topicsMockMeta}>{isMk ? 'Работни односи · 2.3к читања' : 'Employment · 2.3k reads'}</div>
                  </div>
                </div>
                <div className={`${styles.topicsMockCard} ${styles.topicsMockCard2}`}>
                  <div className={styles.topicsMockQ}>?</div>
                  <div>
                    <div className={styles.topicsMockTitle}>{isMk ? 'ДДВ за SaaS услуги од странство?' : 'VAT for SaaS services from abroad?'}</div>
                    <div className={styles.topicsMockMeta}>{isMk ? 'Даноци · 1.1к читања' : 'Tax · 1.1k reads'}</div>
                  </div>
                </div>
                <div className={`${styles.topicsMockCard} ${styles.topicsMockCard3}`}>
                  <div className={styles.topicsMockQ}>?</div>
                  <div>
                    <div className={styles.topicsMockTitle}>{isMk ? 'Регистрација на заштитен знак — чекори?' : 'Registering a trademark — steps?'}</div>
                    <div className={styles.topicsMockMeta}>{isMk ? 'ИС · 870 читања' : 'IP · 870 reads'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PART 3: TRY THE TERMINAL ============ */}
      <section className="nx-section nx-section-soft">
        <div className="nexa-container">
          <div className={`${styles.chapterMarker} ${styles.chapterMarkerCentered} nx-reveal`}>
            <span className={styles.chapterNum}>{isMk ? 'Дел 3' : 'Part 3'}</span>
            <h3 className={styles.chapterTitle}>
              {isMk ? 'Автоматизирај го твоето работење' : 'Automate your operations'}
            </h3>
            <p className={styles.chapterLead}>
              {isMk
                ? 'Терминалот ти ја држи внатрешната администрација — документи, проверки, AI помош, анализа на договори. Сè на едно место. Пробај го 8 дена бесплатно, без картичка.'
                : 'The Terminal handles your internal admin — documents, compliance checks, AI assistance, contract analysis. All in one place. Try it free for 8 days, no card required.'}
            </p>
          </div>

          <ol className={styles.steps}>
            {STEPS.map((s, i) => (
              <li key={i} className={`nx-reveal ${styles.stepItem}`} style={{ transitionDelay: `${i * 80}ms` }}>
                <div className={styles.stepNum}>{i + 1}</div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className={`${styles.stepsCta} nx-reveal`}>
            <Link to="/login" className="nexa-btn nexa-btn-accent nexa-btn-lg">
              {isMk ? 'Започни бесплатно' : 'Start free'}
              <Icon name="arrowRight" size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className={`${styles.ctaFinal} nx-section-ink`}>
        <div className="nexa-container">
          <div className={`${styles.ctaInner} nx-reveal`}>
            <h2>{isMk ? 'Подготвени сте да го пробате Терминалот?' : 'Ready to try the Terminal?'}</h2>
            <p>
              {isMk
                ? '8 дена бесплатно. Не бара картичка. Откажете во секое време.'
                : '8 days free. No card required. Cancel any time.'}
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/login" className="nexa-btn nexa-btn-accent nexa-btn-lg">
                {isMk ? 'Започни бесплатно' : 'Start free'}
                <Icon name="arrowRight" size={18} />
              </Link>
              <Link to="/contact" className="nexa-btn nexa-btn-glass nexa-btn-lg">
                {isMk ? 'Контактирај нé' : 'Contact us'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
