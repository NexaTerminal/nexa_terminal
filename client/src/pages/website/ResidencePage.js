import SimpleNavbar from '../../components/common/SimpleNavbar';
import PublicFooter from '../../components/common/PublicFooter';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { OrganizationSchema } from '../../components/seo/StructuredData';

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
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: 'linear-gradient(135deg, #1E4DB7 0%, #3B82F6 50%, #06B6D4 100%)',
        zIndex: 9998
      }} />

      <SimpleNavbar />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: '#f9fafb'
      }}>
        <main style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '8rem 2rem 4rem 2rem',
          flex: 1,
          width: '100%'
        }}>
          <header style={{ marginBottom: '3rem' }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              color: '#262626',
              marginBottom: '1rem'
            }}>
              Престој и дозволи за живеење
            </h1>
            <p style={{
              fontSize: '1.125rem',
              color: '#525252',
              lineHeight: '1.8'
            }}>
              Професионална помош за добивање дозволи за престој, работни дозволи и постојан престој во Северна Македонија
            </p>
          </header>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.75rem', color: '#262626', marginBottom: '1rem' }}>
              Видови на дозволи
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                background: '#ffffff',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <h3 style={{ fontSize: '1.25rem', color: '#262626', marginBottom: '0.5rem' }}>
                  Привремен престој
                </h3>
                <p style={{ color: '#525252', lineHeight: '1.6' }}>
                  До 1 година, можност за продолжување. Потребно: валиден пасош, доказ за средства, здравствено осигурување, причина за престој.
                </p>
              </div>

              <div style={{
                background: '#ffffff',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <h3 style={{ fontSize: '1.25rem', color: '#262626', marginBottom: '0.5rem' }}>
                  Работна дозвола
                </h3>
                <p style={{ color: '#525252', lineHeight: '1.6' }}>
                  За странци кои работат во Македонија. Послодавачот мора да докаже дека нема соодветен кадар. Траење: 1 година.
                </p>
              </div>

              <div style={{
                background: '#ffffff',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <h3 style={{ fontSize: '1.25rem', color: '#262626', marginBottom: '0.5rem' }}>
                  Постојан престој
                </h3>
                <p style={{ color: '#525252', lineHeight: '1.6' }}>
                  По 5 години непрекинат престој. Потребно: редовно плаќање данок, владеење на македонски јазик, нема криминално минато.
                </p>
              </div>
            </div>
          </section>

          <section style={{
            background: '#F0F7FF',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '3rem'
          }}>
            <h2 style={{ fontSize: '1.75rem', color: '#262626', marginBottom: '1rem' }}>
              Потребна ви е помош?
            </h2>
            <p style={{ color: '#525252', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Nexa Terminal ви помага во целиот процес - од подготовка на документи до поднесување на барање.
            </p>
            <a
              href="/"
              style={{
                display: 'inline-block',
                background: '#4F46E5',
                color: 'white',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'transform 0.2s'
              }}
            >
              Започни сега →
            </a>
          </section>
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
