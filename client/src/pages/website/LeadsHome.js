import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import Icon from '../../components/website/Icon';
import useScrollReveal from '../../hooks/useScrollReveal';
import { NEXA_ORG, NEXA_WEBSITE, webPage } from '../../components/seo/schemaGraph';
import hs from './Home.module.css';
import styles from './LeadsHome.module.css';

/**
 * leads.nexa.mk — Product B storefront (Nexa for Lawyers).
 * Lean, no pricing: dream-outcome hero → the satellite network that brings the
 * clients → scarcity + risk reversal → FAQ → contact. Honest throughout (no
 * fabricated testimonials/earnings).
 */
export default function LeadsHome() {
  const { t } = useTranslation('website');
  useScrollReveal();
  const lang = i18n.language || 'mk';
  const isMk = lang === 'mk';
  const url = 'https://leads.nexa.mk/';
  const T = (mk, en) => (isMk ? mk : en);

  const SATELLITES = [
    {
      name: 'СамоДаПрашам', url: 'https://samodaprasham.mk', domain: 'samodaprasham.mk',
      tag: T('Правни прашања од граѓани', 'Citizen legal questions'),
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
      title: T('Граѓаните имаат правни прашања. Некои се сериозни случаи.', 'Citizens have legal questions. Some are serious cases.'),
      body: T('Илјадници луѓе годишно бараат одговор за наследство, развод, кривична одбрана, имотни спорови и работни односи. Голем дел имаат потреба од вистинско застапување — нивните прашања стигнуваат до правник со соодветна област.',
              'Thousands each year search for answers on inheritance, divorce, criminal defense, property and employment. Many need real representation — their questions route to a lawyer in the right area.'),
      audience: T('Целна публика: физички лица', 'Audience: individuals')
    },
    {
      name: 'Immigration.mk', url: 'https://immigration.mk', domain: 'immigration.mk',
      tag: T('Странци кои живеат во Македонија', 'Foreigners living in Macedonia'),
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
      title: T('Странците бараат стручна помош за дозвола за престој.', 'Foreigners need expert help with residence permits.'),
      body: T('Странски државјани, инвеститори и работници постојано имаат потреба од издавање, обновување и пренамена на дозволи. Овие посетители се клиенти со јасна намера да платат — често за итен случај.',
              'Foreign citizens, investors and workers constantly need to obtain, renew or change permits. These visitors come with clear intent to pay — often urgently.'),
      audience: T('Целна публика: странци, инвеститори', 'Audience: foreigners, investors')
    },
    {
      name: 'Македонско државјанство', url: 'https://macedoniancitizenship.mk', domain: 'macedoniancitizenship.mk',
      tag: T('Дијаспора и потомци', 'Diaspora and descendants'),
      image: 'https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?auto=format&fit=crop&w=1200&q=80',
      title: T('Дијаспората бара начин да го врати државјанството.', 'The diaspora seeks to reclaim citizenship.'),
      body: T('Луѓе со македонско потекло од Австралија, САД, Канада и Европа аплицираат преку потекло, брак или инвестиција. Случаите бараат правно водство и подготовка на документи со месеци — работа за специјализиран адвокат.',
              'People with Macedonian roots abroad apply through origin, marriage or investment. These cases need legal guidance over months — specialist work.'),
      audience: T('Целна публика: дијаспора, потомци', 'Audience: diaspora, descendants')
    },
    {
      name: 'Company.nexa.mk', url: 'https://company.nexa.mk', domain: 'company.nexa.mk',
      tag: T('Нови претприемачи', 'New entrepreneurs'),
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
      title: T('Претприемачи бараат да отворат фирма.', 'Entrepreneurs are looking to register a company.'),
      body: T('Регистрација на ДОО, ДООЕЛ, АД, подружница, измена на основач, регистрација во Централен регистар. Секој месец стотици претприемачи имаат потреба од сметководител и адвокат уште од прв ден.',
              'Registering a DOO, DOOEL, AD, branch, owner change, Central Registry filing. Each month hundreds of founders need an accountant and a lawyer from day one.'),
      audience: T('Целна публика: основачи, инвеститори', 'Audience: founders, investors')
    },
    {
      name: 'IPLaw.nexa.mk', url: 'https://iplaw.nexa.mk', domain: 'iplaw.nexa.mk',
      tag: T('Брендови и иноватори', 'Brands and innovators'),
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
      title: T('Брендовите и иноваторите бараат заштита.', 'Brands and innovators need protection.'),
      body: T('Заштитни знаци, патенти, авторски права, лиценцирање. Компаниите кои растат сакаат да го заштитат тоа што го градат — веќе се успешни и плаќаат за квалитет.',
              'Trademarks, patents, copyrights, licensing. Growing companies protect what they build — already successful, they pay for quality.'),
      audience: T('Целна публика: компании во раст', 'Audience: growing companies')
    },
    {
      name: 'Осигуран', url: 'https://osiguran.nexa.mk', domain: 'osiguran.nexa.mk',
      tag: T('Права од осигурување', 'Insurance rights'),
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
      title: T('Осигурениците бараат да ги остварат своите права.', 'Policyholders want to exercise their rights.'),
      body: T('Неутрален водич за осигурувањето во Македонија — права на осигурениците, постапки за штети и жалби. Кога спорот со осигурител бара правна помош, барањето стигнува до правник.',
              'A neutral guide to insurance in Macedonia — policyholder rights, claims and complaints. When a dispute needs legal help, the request reaches a lawyer.'),
      audience: T('Целна публика: осигуреници, граѓани и бизниси', 'Audience: policyholders, individuals and businesses')
    }
  ];

  const FAQ = [
    { q: T('Што ако не добијам случаи?', 'What if I get no cases?'),
      a: T('Не сте врзани — можете да откажете во секое време. Бидејќи има само 3 правници по област, шансите се на Ваша страна.',
           'No lock-in — cancel anytime. With only 3 lawyers per area, the odds are in your favor.') },
    { q: T('Колку правници има по област?', 'How many lawyers per area?'),
      a: T('Најмногу 3. Кога областа е полна, влегувате на листа на чекање — за да останат случаите вредни за членовите.',
           'At most 3. When an area is full you join a waitlist — to keep cases valuable for members.') },
    { q: T('Морам ли да го користам софтверот?', 'Do I have to use the software?'),
      a: T('Не. Случаите се главното; алатките на Терминалот се бонус што го користите колку сакате.',
           'No. Cases are the point; the Terminal tools are a bonus you use as much as you like.') },
    { q: T('Дали Nexa е адвокатска канцеларија?', 'Is Nexa a law firm?'),
      a: T('Не. Ве поврзуваме со потенцијални клиенти. Правната работа и односот со клиентот се целосно Ваши.',
           'No. We connect you with potential clients. The legal work and client relationship are entirely yours.') }
  ];

  return (
    <PublicLayout>
      <SEOHelmet
        title={T('Nexa за правници — нови клиенти од нашата мрежа', 'Nexa for Lawyers — new clients from our network')}
        description={T('Насочени случаи од специјализирани сајти по област и град, плус видливост како експерт. Ограничени места по област.',
                       'Routed cases from specialized sites by area and city, plus visibility as an expert. Limited seats per area.')}
        canonical="/"
        locale={isMk ? 'mk_MK' : 'en_US'}
        altLocale={isMk ? 'en_US' : 'mk_MK'}
        jsonLd={[NEXA_ORG, NEXA_WEBSITE, webPage({ url, name: 'Nexa for Lawyers', description: T('Нови клиенти за правници.', 'New clients for lawyers.'), language: lang })]}
      />

      {/* ============ HERO ============ */}
      <section className={`${hs.hero} nx-hero-aurora`}>
        <span className="nx-orb nx-orb-1" aria-hidden></span>
        <span className="nx-orb nx-orb-2" aria-hidden></span>

        <div className={`nexa-container ${hs.heroInner}`}>
          <span className={`nx-pill ${hs.heroPill} nx-fade-in-up`}>
            <Icon name="network" size={14} />
            {T('За правници, сметководители и консултанти', 'For lawyers, accountants and consultants')}
          </span>
          <h1 className="nx-fade-in-up nx-d-100">
            {T('Нови клиенти, испорачани до Вас. Без реклами, без агенции.',
               'New clients, delivered to you. No ads, no agencies.')}
          </h1>
          <p className={`${hs.heroSub} nx-fade-in-up nx-d-200`}>
            {T('Управуваме мрежа од специјализирани правни сајти што привлекуваат клиенти со јасна намера. Ги насочуваме тие случаи право до Вас — по област и град.',
               'We run a network of specialized legal sites that attract high-intent clients. We route those cases straight to you — by practice area and city.')}
          </p>
          <div className={`${hs.heroCtas} nx-fade-in-up nx-d-300`}>
            <Link to="/contact" className="nexa-btn nexa-btn-accent nexa-btn-lg">
              {T('Разговарајте со нас', 'Talk to us')}
              <Icon name="arrowRight" size={18} />
            </Link>
          </div>
          <p className={`${hs.heroTertiary} nx-fade-in-up nx-d-400`}>
            {T('~2.500 посетители месечно · 1000+ претплатници · само 3 правници по област',
               '~2,500 visits / month · 1000+ subscribers · only 3 lawyers per area')}
          </p>
        </div>
      </section>

      {/* ============ WE BRING YOU CLIENTS — the satellite network ============ */}
      <section className="nx-section">
        <div className="nexa-container">
          <div className={`${hs.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">{T('За провајдери на услуги', 'For service providers')}</span>
            <h2>{T('Адвокат, сметководител или консултант? Nexa Ви носи клиенти.',
                   'Lawyer, accountant or consultant? Nexa brings you clients.')}</h2>
            <p>{T('Про членството е за оние што продаваат услуги. Управуваме мрежа од специјализирани сајтови што привлекуваат посетители со конкретна потреба — а нивните барања стигнуваат до Вас. Плус, Вашата експертиза станува видлива содржина што клиентите ја наоѓаат пред да Ве побараат.',
                  'The Pro membership is for those who sell services. We run a network of specialized sites that attract visitors with a concrete need — and their requests reach you. Plus, your expertise becomes visible content clients find before they even search for you.')}</p>
            <p className={hs.providerCtaLine}>
              <Link to="/smetkovoditeli" className="nexa-btn nexa-btn-secondary">
                {T('Сметководител? Водете ги сите клиенти од една сметка →', 'An accountant? Manage all clients from one account →')}
              </Link>
            </p>
          </div>

          <div className={`${hs.chapterMarker} ${hs.chapterMarkerCentered} nx-reveal`}>
            <span className={hs.chapterNum}>{T('Дел 2', 'Part 2')}</span>
            <h3 className={hs.chapterTitle}>{T('Носиме клиенти кај Вас', 'We bring clients to you')}</h3>
            <p className={hs.chapterLead}>{T('Управуваме мрежа од специјализирани сајтови. Секој покрива конкретна потреба, секој таргетира посетители со јасна намера да платат. Тие посетители — Ваши клиенти.',
                   'We run a network of specialized sites. Each covers a specific need, each targets visitors with clear intent to pay. Those visitors — your clients.')}</p>
          </div>

          <div className={hs.satelliteList}>
            {SATELLITES.map((s, i) => (
              <article key={s.url} className={`${hs.satellite} nx-reveal ${i % 2 === 1 ? hs.satelliteFlip : ''}`} style={{ transitionDelay: `${i * 60}ms` }}>
                <a className={hs.satelliteImage} href={s.url} target="_blank" rel="noopener">
                  <img src={s.image} alt={s.name} loading="lazy" />
                  <span className={hs.satelliteDomainBadge}>{s.domain}</span>
                </a>
                <div className={hs.satelliteContent}>
                  <span className={hs.satelliteTag}>{s.tag}</span>
                  <h3 className={hs.satelliteTitle}>{s.title}</h3>
                  <p className={hs.satelliteBody}>{s.body}</p>
                  <div className={hs.satelliteMeta}>
                    <span className={hs.satelliteAudience}>{s.audience}</span>
                    <a className={hs.satelliteLink} href={s.url} target="_blank" rel="noopener">
                      {T('Посети', 'Visit')} <Icon name="arrowRight" size={14} />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SCARCITY + RISK REVERSAL ============ */}
      <section className="nx-section nx-section-soft">
        <div className="nexa-container">
          <div className={styles.rowTwo}>
            <div className={`${styles.panel} ${styles.panelWarn} nx-reveal`}>
              <div className={styles.panelIcon} aria-hidden>⏳</div>
              <h3>{T('Само 3 места по област', 'Only 3 seats per area')}</h3>
              <p>{T('Го ограничуваме бројот на правници по област намерно — за секој член да добие вредни случаи. Кога областа е полна, се затвора до слободно место.',
                    'We cap lawyers per area on purpose — so each member gets valuable cases. When an area fills, it closes until a seat opens.')}</p>
            </div>
            <div className={`${styles.panel} ${styles.panelSafe} nx-reveal`}>
              <div className={styles.panelIcon} aria-hidden>🛡️</div>
              <h3>{T('Без обврска', 'No commitment')}</h3>
              <p>{T('Плаќате со профактура и банкарски трансфер — без картичка, без автоматска наплата. Откажувате во секое време.',
                    'You pay by pro-forma invoice and bank transfer — no card, no auto-billing. Cancel anytime.')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="nx-section">
        <div className="nexa-container">
          <div className={`${hs.chapterMarker} ${hs.chapterMarkerCentered} nx-reveal`}>
            <span className={hs.chapterNum}>{T('Прашања', 'Questions')}</span>
            <h2 className={hs.chapterTitle}>{T('Она што правниците најчесто прашуваат.', 'What lawyers ask most.')}</h2>
          </div>
          <div className={styles.faq}>
            {FAQ.map((f) => (
              <div key={f.q} className={`${styles.faqItem} nx-reveal`}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className={`${hs.ctaFinal} nx-section-ink`}>
        <div className="nexa-container">
          <div className={`${hs.finalGrid} nx-reveal`}>
            <div className={hs.finalContent}>
              <h2 className={hs.finalTitle}>
                {T('Земи го Вашето место додека областа е слободна.', 'Claim your seat while your area is open.')}
              </h2>
              <ul className={hs.finalFeatures}>
                <li><span className={hs.finalFeatureDot} aria-hidden />{T('Ексклузивни случаи по област и град', 'Exclusive cases by area and city')}</li>
                <li><span className={hs.finalFeatureDot} aria-hidden />{T('Само 3 правници по област', 'Only 3 lawyers per area')}</li>
                <li><span className={hs.finalFeatureDot} aria-hidden />{T('Видливост преку Topics, билтен и блог', 'Visibility via Topics, newsletter and blog')}</li>
                <li><span className={hs.finalFeatureDot} aria-hidden />{T('Без обврска — платите по профактура', 'No commitment — pay by invoice')}</li>
              </ul>
              <div className={hs.heroCtas}>
                <Link to="/contact" className="nexa-btn nexa-btn-accent nexa-btn-lg">
                  {T('Разговарајте со нас', 'Talk to us')}
                  <Icon name="arrowRight" size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
