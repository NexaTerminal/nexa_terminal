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
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
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
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
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
      image: 'https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?auto=format&fit=crop&w=1200&q=80',
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
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
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
            {isMk ? 'Правни алатки за мали и средни бизниси во Македонија' : 'Legal tools for small and medium businesses in Macedonia'}
          </span>
          <h1 className="nx-fade-in-up nx-d-100">{t('home.heroTitle')}</h1>
          <p className={`${styles.heroSub} nx-fade-in-up nx-d-200`}>{t('home.heroSubtitle')}</p>
          <div className={`${styles.heroCtas} nx-fade-in-up nx-d-300`}>
            <Link to="/pricing" className="nexa-btn nexa-btn-accent nexa-btn-lg">
              {t('home.ctaTerminal')}
              <Icon name="arrowRight" size={18} />
            </Link>
            <Link to="/proverka" className="nexa-btn nexa-btn-secondary nexa-btn-lg">
              {t('home.ctaProfessionals')}
            </Link>
          </div>
          <p className={`${styles.heroTertiary} nx-fade-in-up nx-d-400`}>
            <Link to="/about">{t('home.ctaSeeHow')}</Link>
          </p>
        </div>
      </section>

      {/* ============ PART 1: AUTOMATE (the product, SMB story first) ============ */}
      <section className={`${styles.ctaFinal} nx-section-ink`}>
        <div className="nexa-container">
          <div className={`${styles.finalGrid} nx-reveal`}>
            <div className={styles.finalContent}>
              <span className={`${styles.chapterNum} ${styles.chapterNumInk}`}>
                {isMk ? 'Дел 1' : 'Part 1'}
              </span>
              <h2 className={styles.finalTitle}>
                {isMk ? 'Автоматизирајте го Вашето работење' : 'Automate your operations'}
              </h2>
              <ul className={styles.finalFeatures}>
                {[
                  isMk ? 'Автоматизирани документи'  : 'Automated documents',
                  isMk ? 'Проверки за усогласеност'  : 'Compliance health checks',
                  isMk ? 'AI правен помошник'        : 'AI legal assistant',
                  isMk ? 'Анализа на договор'        : 'Contract analysis'
                ].map(f => (
                  <li key={f}>
                    <span className={styles.finalFeatureDot} aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <div className={styles.ctaButtons}>
                <Link to="/pricing" className="nexa-btn nexa-btn-accent nexa-btn-lg">
                  {isMk ? 'Изберете план' : 'Choose a plan'}
                  <Icon name="arrowRight" size={18} />
                </Link>
                <Link to="/contact" className="nexa-btn nexa-btn-glass nexa-btn-lg">
                  {isMk ? 'Контактирајте нé' : 'Contact us'}
                </Link>
              </div>
            </div>

            <div className={styles.finalVisual} aria-hidden>
              <div className={styles.finalMockStack}>
                <div className={`${styles.finalMockCard} ${styles.finalMockCard1}`}>
                  <span className={`${styles.finalMockIcon} ${styles.finalMockIconBlue}`}>
                    <Icon name="documents" size={18} />
                  </span>
                  <div>
                    <div className={styles.finalMockTitle}>
                      {isMk ? 'Договор за вработување' : 'Employment agreement'}
                    </div>
                    <div className={styles.finalMockMeta}>
                      {isMk ? 'Генериран за 30 сек' : 'Generated in 30s'}
                    </div>
                  </div>
                  <span className={styles.finalMockBadge}>DOCX</span>
                </div>

                <div className={`${styles.finalMockCard} ${styles.finalMockCard2}`}>
                  <span className={`${styles.finalMockIcon} ${styles.finalMockIconAmber}`}>
                    <Icon name="shield" size={18} />
                  </span>
                  <div>
                    <div className={styles.finalMockTitle}>
                      {isMk ? 'Правна проверка' : 'Legal screening'}
                    </div>
                    <div className={styles.finalMockMeta}>
                      {isMk ? '8 / 12 прашања' : '8 / 12 questions'}
                    </div>
                  </div>
                  <span className={styles.finalMockProgress}>
                    <span className={styles.finalMockProgressFill} style={{ width: '66%' }} />
                  </span>
                </div>

                <div className={`${styles.finalMockCard} ${styles.finalMockCard3}`}>
                  <span className={`${styles.finalMockIcon} ${styles.finalMockIconTeal}`}>
                    <Icon name="ai" size={18} />
                  </span>
                  <div>
                    <div className={styles.finalMockTitle}>
                      {isMk ? 'AI одговор' : 'AI answer'}
                    </div>
                    <div className={styles.finalMockMeta}>
                      {isMk ? 'Прашање за ДДВ · готов' : 'VAT question · ready'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOR PROVIDERS (satellites — demoted below the product) ============ */}
      <section className="nx-section">
        <div className="nexa-container">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">{isMk ? 'За провајдери на услуги' : 'For service providers'}</span>
            <h2>
              {isMk
                ? 'Адвокат, сметководител или консултант? Nexa Ви носи клиенти.'
                : 'Lawyer, accountant or consultant? Nexa brings you clients.'}
            </h2>
            <p>
              {isMk
                ? 'Про членството е за оние што продаваат услуги. Управуваме мрежа од специјализирани сајтови што привлекуваат посетители со конкретна потреба — а нивните барања стигнуваат до Вас. Плус, Вашата експертиза станува видлива содржина што клиентите ја наоѓаат пред да Ве побараат.'
                : 'The Pro membership is for those who sell services. We run a network of specialized sites that attract visitors with a concrete need — and their requests reach you. Plus, your expertise becomes visible content clients find before they even search for you.'}
            </p>
            <p className={styles.providerCtaLine}>
              <Link to="/smetkovoditeli" className="nexa-btn nexa-btn-secondary">
                {isMk ? 'Сметководител? Водете ги сите клиенти од една сметка →' : 'An accountant? Manage all clients from one account →'}
              </Link>
            </p>
          </div>

          <div className={`${styles.chapterMarker} nx-reveal`}>
            <span className={styles.chapterNum}>{isMk ? 'Дел 2' : 'Part 2'}</span>
            <h3 className={styles.chapterTitle}>
              {isMk ? 'Носиме клиенти кај Вас' : 'We bring clients to you'}
            </h3>
            <p className={styles.chapterLead}>
              {isMk
                ? 'Управуваме мрежа од специјализирани сајтови. Секој покрива конкретна потреба, секој таргетира посетители со јасна намера да платат. Тие посетители — Ваши клиенти.'
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
            <span className={styles.chapterNum}>{isMk ? 'Дел 3' : 'Part 3'}</span>
            <h3 className={styles.chapterTitle}>
              {isMk ? 'Ве правиме видливи како експерт' : 'We make you a visible expert'}
            </h3>
            <p className={styles.chapterLead}>
              {isMk
                ? 'Содржината што ја создавате — одговорите на прашања и стручни мислења — станува Ваша најдобра реклама. Луѓето Ве препознаваат пред да Ве побараат.'
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
                  ? 'Topics.nexa е платформа за прашања и одговори за бизнис и правни теми во Македонија. Како Admin корисник, Вашите одговори стануваат дел од јавна, SEO + GEO оптимизирана содржина. Google и AI асистентите ги пронаоѓаат, а потенцијалните клиенти Ве препознаваат како експерт.'
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

      {/* ============ CLOSING CTA ============ */}
      <section className="nx-section">
        <div className="nexa-container text-center">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <h2>{isMk ? 'Подготвени да започнете?' : 'Ready to start?'}</h2>
            <p>
              {isMk
                ? 'Изберете план, примете профактура и активирајте го Терминалот уште денес.'
                : 'Pick a plan, receive a pro-forma invoice, and activate the Terminal today.'}
            </p>
          </div>
          <div className={`${styles.heroCtas} nx-reveal`}>
            <Link to="/pricing" className="nexa-btn nexa-btn-accent nexa-btn-lg">
              {isMk ? 'Погледни ги цените' : 'See pricing'}
              <Icon name="arrowRight" size={18} />
            </Link>
            <Link to="/contact" className="nexa-btn nexa-btn-secondary nexa-btn-lg">
              {isMk ? 'Контактирајте нé' : 'Contact us'}
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
