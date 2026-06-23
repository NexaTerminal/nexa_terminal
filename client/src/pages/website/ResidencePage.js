import SimpleNavbar from '../../components/common/SimpleNavbar';
import PublicFooter from '../../components/common/PublicFooter';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { OrganizationSchema } from '../../components/seo/StructuredData';
import styles from '../../styles/website/LegalLandingPage.module.css';

export default function ResidencePage() {
  return (
    <>
      <SEOHelmet
        title="Престој и дозволи за живеење во Македонија"
        description="Комплетен водич за дозволи за престој, работни дозволи и документи за странци во Северна Македонија. Процедури, рокови и потребни документи."
        keywords="дозвола за живеење македонија, работна дозвола, престој, residence permit macedonia, странци македонија"
        canonical="/residence"
      />
      <OrganizationSchema />

      {/* Dark header bar for navbar visibility */}
      <div className={styles.headerBar} />

      <SimpleNavbar />

      <div className={styles.page}>
        <main className={styles.main}>
          <header className={styles.header}>
            <h1 className={styles.title}>
              Престој и дозволи за живеење
            </h1>
            <p className={styles.lead}>
              Професионална помош за добивање дозволи за престој, работни дозволи и постојан престој во Северна Македонија
            </p>
          </header>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Видови на дозволи
            </h2>
            <div className={styles.cardStack}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>
                  Привремен престој
                </h3>
                <p className={styles.cardText}>
                  До 1 година, можност за продолжување. Потребно: валиден пасош, доказ за средства, здравствено осигурување, причина за престој.
                </p>
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>
                  Работна дозвола
                </h3>
                <p className={styles.cardText}>
                  За странци кои работат во Македонија. Послодавачот мора да докаже дека нема соодветен кадар. Траење: 1 година.
                </p>
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>
                  Постојан престој
                </h3>
                <p className={styles.cardText}>
                  По 5 години непрекинат престој. Потребно: редовно плаќање данок, владеење на македонски јазик, нема криминално минато.
                </p>
              </div>
            </div>
          </section>

          <section className={styles.cta}>
            <h2 className={styles.ctaTitle}>
              Потребна ви е помош?
            </h2>
            <p className={styles.ctaText}>
              Nexa Terminal ви помага во целиот процес - од подготовка на документи до поднесување на барање.
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
