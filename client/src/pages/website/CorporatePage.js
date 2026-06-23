import SimpleNavbar from '../../components/common/SimpleNavbar';
import PublicFooter from '../../components/common/PublicFooter';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { OrganizationSchema, FAQSchema } from '../../components/seo/StructuredData';
import styles from '../../styles/website/LegalLandingPage.module.css';

export default function CorporatePage() {
  const faqs = [
    {
      question: "Колку трае процесот на регистрација на фирма?",
      answer: "Регистрацијата на фирма трае 1-3 работни дена. Потребни се: статут, одлука за именување, доказ за уплатен капитал и регистрирана седиште."
    },
    {
      question: "Кој е минималниот капитал за ДООЕЛ?",
      answer: "Минималниот капитал за ДООЕЛ е 5.000 денари. За АД (акционерско друштво) минималниот капитал е 500.000 денари."
    }
  ];

  return (
    <>
      <SEOHelmet
        title="Корпоративно право - Отворање фирма и правна поддршка"
        description="Комплетни услуги за регистрација на фирма, статут, акционерско друштво, реорганизација, спојување и ликвидација на компании во Македонија."
        keywords="отворање фирма македонија, регистрација ДООЕЛ, статут, акционерско друштво, корпоративно право, corporate law macedonia"
        canonical="/corporate"
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
            Корпоративно право
          </h1>
          <p className={styles.lead}>
            Професионална правна поддршка за отворање, управување и реорганизација на вашата компанија
          </p>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Правни форми на компании
          </h2>
          <div className={styles.cardStack}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                ДООЕЛ - Друштво со ограничена одговорност основано од едно лице
              </h3>
              <p className={styles.cardText}>
                Најпопуларна форма. Минимален капитал 5.000 денари. Едноставно управување. Ограничена одговорност на основачот.
              </p>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                ДОО - Друштво со ограничена одговорност
              </h3>
              <p className={styles.cardText}>
                Со двајца или повеќе сопственици. Минимален капитал 5.000 денари. Договор за основање меѓу сопствениците.
              </p>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                АД - Акционерско друштво
              </h3>
              <p className={styles.cardText}>
                За поголеми бизниси. Минимален капитал 500.000 денари. Можност за котирање на берза. Сложена структура на управување.
              </p>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                Commanditno Društvo (КД)
              </h3>
              <p className={styles.cardText}>
                Партнерство со генерални и ограничени партнери. Ретко користено. Специфично за определени индустрии.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Процес на отворање фирма
          </h2>
          <div className={styles.panel}>
            <ol className={styles.orderedList}>
              <li><strong>Резервација на име</strong> - Проверка и резервација на име на компанијата</li>
              <li><strong>Подготовка на документација</strong> - Статут, одлука за основање, договор за седиште</li>
              <li><strong>Уплата на капитал</strong> - Депозит на основачки капитал во банка</li>
              <li><strong>Нотарска заверка</strong> - Потпис на документи пред јавен белезник</li>
              <li><strong>Регистрација во Централен регистар</strong> - Поднесување на сите документи</li>
              <li><strong>Добивање ЕМБС и ЕМБГ</strong> - Единствени матични броеви</li>
              <li><strong>Даночна регистрација</strong> - Регистрација во Управа за јавни приходи</li>
              <li><strong>Отворање сметка</strong> - Деловна банкарска сметка</li>
            </ol>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Потребни документи
          </h2>
          <ul className={styles.checkList}>
            <li>✓ Лична карта на основачот/основачите</li>
            <li>✓ Статут на компанијата</li>
            <li>✓ Одлука за основање или Договор за основање</li>
            <li>✓ Доказ за уплатен основачки капитал</li>
            <li>✓ Договор за користење на деловен простор (закуп или сопственост)</li>
            <li>✓ Одлука за именување на директор/управител</li>
            <li>✓ Изјава за прифаќање на функцијата од директорот</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Корпоративни услуги
          </h2>
          <div className={styles.panel}>
            <ul className={styles.checkList}>
              <li>• Промена на статут</li>
              <li>• Промена на сопственичка структура</li>
              <li>• Зголемување или намалување на капитал</li>
              <li>• Спојување (Merger) и преземање (Acquisition)</li>
              <li>• Поделба на компании</li>
              <li>• Реорганизација</li>
              <li>• Ликвидација и стечај</li>
              <li>• Управување со акции и удели</li>
              <li>• Корпоративно управување (Corporate Governance)</li>
            </ul>
          </div>
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
            Започнете го вашиот бизнис денес
          </h2>
          <p className={styles.ctaText}>
            Nexa Terminal ви обезбедува комплетна правна поддршка за отворање и управување со вашата компанија.
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
