import SimpleNavbar from '../../components/common/SimpleNavbar';
import PublicFooter from '../../components/common/PublicFooter';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { OrganizationSchema, FAQSchema } from '../../components/seo/StructuredData';
import styles from '../../styles/website/LegalLandingPage.module.css';

export default function TrademarkPage() {
  const faqs = [
    {
      question: "Колку трае процесот на регистрација на трговска марка?",
      answer: "Процесот трае 6-12 месеци, зависно од тоа дали има приговори. По поднесување на барањето следува формална проверка, објава во билтен и период за приговори."
    },
    {
      question: "Колку чини регистрација на трговска марка?",
      answer: "Регистрацијата чини околу 3.000-5.000 денари за национална марка за една класа. Дополнителни класи чинат екстра. Обновувањето се врши на секои 10 години."
    }
  ];

  return (
    <>
      <SEOHelmet
        title="Трговска марка - Регистрација на жиг во Македонија"
        description="Заштитете ја вашата трговска марка. Услуги за регистрација на жиг, обновување, интернационална регистрација и заштита на интелектуална сопственост."
        keywords="трговска марка македонија, регистрација на жиг, заштита на марка, trademark registration macedonia, интелектуална сопственост"
        canonical="/trademark"
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
            Трговска марка и заштита на жиг
          </h1>
          <p className={styles.lead}>
            Комплетна заштита на вашиот бренд - од регистрација до обновување на трговска марка во Северна Македонија
          </p>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Зошто е важна регистрацијата?
          </h2>
          <div className={styles.cardStack}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                Ексклузивно право на користење
              </h3>
              <p className={styles.cardText}>
                Само вие имате право да ја користите вашата трговска марка во регистрираните класи на производи и услуги.
              </p>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                Правна заштита
              </h3>
              <p className={styles.cardText}>
                Можност за тужба против секој што ја користи вашата марка без дозвола. Заштита од копирање и неовластена употреба.
              </p>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                Градење на бренд вредност
              </h3>
              <p className={styles.cardText}>
                Регистрираната марка станува ваш актив што може да се продава, лицeнцира или користи како обезбедување.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Процес на регистрација
          </h2>
          <div className={styles.panel}>
            <ol className={styles.orderedList}>
              <li><strong>Пребарување</strong> - Проверка дали марката е слободна за регистрација</li>
              <li><strong>Подготовка на документација</strong> - Определување на класи и подготовка на барање</li>
              <li><strong>Поднесување на барање</strong> - Аплицирање во Државен завод за индустриска сопственост</li>
              <li><strong>Формална проверка</strong> - Проверка на комплетност на документацијата</li>
              <li><strong>Објава во билтен</strong> - Јавна објава за период на приговори</li>
              <li><strong>Период на приговори</strong> - 3 месеци за евентуални приговори од трети лица</li>
              <li><strong>Финална одлука</strong> - Издавање на решение за регистрација</li>
              <li><strong>Сертификат</strong> - Добивање на сертификат за регистрирана марка</li>
            </ol>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Класи на производи и услуги
          </h2>
          <p className={styles.note}>
            Трговските марки се регистрираат според Нискската класификација која содржи 45 класи:
          </p>
          <ul className={styles.checkList}>
            <li>✓ Класи 1-34: Производи (хемикалии, прехранбени производи, облека, итн.)</li>
            <li>✓ Класи 35-45: Услуги (маркетинг, финансии, правни услуги, итн.)</li>
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
            Заштитете ја вашата марка денес
          </h2>
          <p className={styles.ctaText}>
            Nexa Terminal ви помага да ја регистрирате вашата трговска марка брзо и ефикасно.
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
