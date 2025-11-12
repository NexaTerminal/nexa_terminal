import SimpleNavbar from '../../components/common/SimpleNavbar';
import PublicFooter from '../../components/common/PublicFooter';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { OrganizationSchema } from '../../components/seo/StructuredData';

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
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '8rem 2rem 4rem 2rem',
          flex: 1,
          width: '100%'
        }}>
          <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: '700',
              color: '#262626',
              marginBottom: '1rem'
            }}>
              Правни теми
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: '#525252',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              Најчести прашања и одговори за правни теми што ги интересираат македонските бизниси
            </p>
          </header>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {/* Topic Cards */}
            <a href="/employment" style={{
              background: '#ffffff',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              textDecoration: 'none',
              transition: 'all 0.3s',
              display: 'block'
            }}>
              <h2 style={{ fontSize: '1.5rem', color: '#262626', marginBottom: '1rem' }}>
                👔 Работни односи
              </h2>
              <p style={{ color: '#525252', lineHeight: '1.6' }}>
                Договори за вработување, откажувања, права на вработените, годишни одмори
              </p>
            </a>

            <a href="/trademark" style={{
              background: '#ffffff',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              textDecoration: 'none',
              transition: 'all 0.3s',
              display: 'block'
            }}>
              <h2 style={{ fontSize: '1.5rem', color: '#262626', marginBottom: '1rem' }}>
                ®️ Трговска марка
              </h2>
              <p style={{ color: '#525252', lineHeight: '1.6' }}>
                Регистрација на жигови, заштита на трговска марка, обновување, интернационална регистрација
              </p>
            </a>

            <a href="/corporate" style={{
              background: '#ffffff',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              textDecoration: 'none',
              transition: 'all 0.3s',
              display: 'block'
            }}>
              <h2 style={{ fontSize: '1.5rem', color: '#262626', marginBottom: '1rem' }}>
                🏢 Корпоративно право
              </h2>
              <p style={{ color: '#525252', lineHeight: '1.6' }}>
                Отворање фирма, статут, акционерско општество, реорганизација, ликвидација
              </p>
            </a>

            <a href="/residence" style={{
              background: '#ffffff',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              textDecoration: 'none',
              transition: 'all 0.3s',
              display: 'block'
            }}>
              <h2 style={{ fontSize: '1.5rem', color: '#262626', marginBottom: '1rem' }}>
                🛂 Престој
              </h2>
              <p style={{ color: '#525252', lineHeight: '1.6' }}>
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
