import SimpleNavbar from '../../components/common/SimpleNavbar';
import PublicFooter from '../../components/common/PublicFooter';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { OrganizationSchema, FAQSchema } from '../../components/seo/StructuredData';
import styles from '../../styles/website/LegalLandingPage.module.css';

export default function EmploymentPage() {
  const faqs = [
    {
      question: "Што мора да содржи договорот за вработување?",
      answer: "Договорот мора да содржи: вид на работа, работно место, датум на започнување, траење (определено/неопределено), работно време, плата, место на работа и други права и обврски."
    },
    {
      question: "Колкав е отказниот рок?",
      answer: "Отказниот рок зависи од времето на работа: до 1 година - 1 месец, од 1-5 години - 2 месеци, од 5-10 години - 3 месеци, преку 10 години - 4 месеци."
    }
  ];

  return (
    <>
      <SEOHelmet
        title="Работни односи - Договори за вработување и работно право"
        description="Сè за договори за вработување, откажување, права на вработени, годишни одмори и работно законодавство во Македонија."
        keywords="договор за вработување, работно право македонија, откажување, годишен одмор, employment contract macedonia"
        canonical="/employment"
      />
      <OrganizationSchema />
      <FAQSchema questions={faqs} />

      {/* Dark header bar for navbar visibility */}
      <div className={styles.headerBar} />

      <SimpleNavbar />

      <div className={styles.page}>
        <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            Работни односи
          </h1>
          <p className={styles.lead}>
            Сè што треба да знаете за договори за вработување, права на вработени и работно законодавство
          </p>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Видови на договори
          </h2>
          <div className={styles.cardStack}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                Договор на неопределено време
              </h3>
              <p className={styles.cardText}>
                Стандарден договор без утврден рок за престанок. Полни права и бенефиции за вработениот.
              </p>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                Договор на определено време
              </h3>
              <p className={styles.cardText}>
                До 5 години вкупно (вклучувајќи продолжувања). Користи се за сезонски работи, замени или проекти.
              </p>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                Договор за дополнителна работа
              </h3>
              <p className={styles.cardText}>
                Работа кај друг работодавач покрај редовниот. Ограничена на 8 часа неделно.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Документи што ги генерираме
          </h2>
          <ul className={styles.checkList}>
            <li>✓ Договор за вработување</li>
            <li>✓ Анекс на договор</li>
            <li>✓ Одлука за престанок на договор</li>
            <li>✓ Одлука за годишен одмор</li>
            <li>✓ Потврда за работен однос</li>
            <li>✓ Предупредување/Опомена</li>
            <li>✓ Одлука за бонус и регрес</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={`${styles.sectionTitle} ${styles.sectionTitleSpaced}`}>
            Често поставувани прашања
          </h2>
          {faqs.map((faq, index) => (
            <div key={index} className={styles.faqCard}>
              <h3 className={styles.faqQuestion}>
                {faq.question}
              </h3>
              <p className={styles.faqAnswer}>
                {faq.answer}
              </p>
            </div>
          ))}
        </section>

        <section className={styles.cta}>
          <h2 className={styles.ctaTitle}>
            Генерирајте договори автоматски
          </h2>
          <p className={styles.ctaText}>
            Со Nexa Terminal, сите работни документи се генерираат за 30 секунди.
          </p>
          <a href="/" className={styles.ctaButton}>
            Започни сега →
          </a>
        </section>
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
