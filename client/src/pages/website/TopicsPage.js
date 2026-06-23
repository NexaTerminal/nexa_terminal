import SimpleNavbar from '../../components/common/SimpleNavbar';
import PublicFooter from '../../components/common/PublicFooter';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { OrganizationSchema } from '../../components/seo/StructuredData';
import styles from '../../styles/website/LegalLandingPage.module.css';

export default function TopicsPage() {
  return (
    <>
      <SEOHelmet
        title="Теми - Правни теми и прашања"
        description="Најчести правни прашања и одговори за македонски бизниси. Работно право, договори, GDPR, корпоративно право и повеќе."
        keywords="правни теми, FAQ macedonia, правни прашања, работно право, договори"
        canonical="/topics"
      />
      <OrganizationSchema />

      {/* Dark header bar for navbar visibility */}
      <div className={styles.headerBar} />

      <SimpleNavbar />

      <div className={styles.page}>
        <main className={`${styles.main} ${styles.mainWide}`}>
          <header className={styles.headerCentered}>
            <h1 className={`${styles.title} ${styles.titleLarge}`}>
              Правни теми
            </h1>
            <p className={styles.leadCentered}>
              Најчести прашања и одговори за правни теми што ги интересираат македонските бизниси
            </p>
          </header>

          <div className={styles.topicsGrid}>
            {/* Topic Cards */}
            <a href="/employment" className={styles.topicCard}>
              <h2 className={styles.topicCardTitle}>
                👔 Работни односи
              </h2>
              <p className={styles.topicCardText}>
                Договори за вработување, откажувања, права на вработените, годишни одмори
              </p>
            </a>

            <a href="/trademark" className={styles.topicCard}>
              <h2 className={styles.topicCardTitle}>
                ®️ Трговска марка
              </h2>
              <p className={styles.topicCardText}>
                Регистрација на жигови, заштита на трговска марка, обновување, интернационална регистрација
              </p>
            </a>

            <a href="/corporate" className={styles.topicCard}>
              <h2 className={styles.topicCardTitle}>
                🏢 Корпоративно право
              </h2>
              <p className={styles.topicCardText}>
                Отворање фирма, статут, акционерско општество, реорганизација, ликвидација
              </p>
            </a>

            <a href="/residence" className={styles.topicCard}>
              <h2 className={styles.topicCardTitle}>
                🛂 Престој
              </h2>
              <p className={styles.topicCardText}>
                Дозволи за живеење, работни дозволи, документи за странци, постојан престој
              </p>
            </a>
          </div>
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
