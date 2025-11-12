import SimpleNavbar from '../../components/common/SimpleNavbar';
import PublicFooter from '../../components/common/PublicFooter';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { OrganizationSchema, FAQSchema } from '../../components/seo/StructuredData';

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
            Работни односи
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#525252',
            lineHeight: '1.8'
          }}>
            Сè што треба да знаете за договори за вработување, права на вработени и работно законодавство
          </p>
        </header>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', color: '#262626', marginBottom: '1rem' }}>
            Видови на договори
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
              background: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{ fontSize: '1.25rem', color: '#262626', marginBottom: '0.5rem' }}>
                Договор на неопределено време
              </h3>
              <p style={{ color: '#525252', lineHeight: '1.6' }}>
                Стандарден договор без утврден рок за престанок. Полни права и бенефиции за вработениот.
              </p>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{ fontSize: '1.25rem', color: '#262626', marginBottom: '0.5rem' }}>
                Договор на определено време
              </h3>
              <p style={{ color: '#525252', lineHeight: '1.6' }}>
                До 5 години вкупно (вклучувајќи продолжувања). Користи се за сезонски работи, замени или проекти.
              </p>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{ fontSize: '1.25rem', color: '#262626', marginBottom: '0.5rem' }}>
                Договор за дополнителна работа
              </h3>
              <p style={{ color: '#525252', lineHeight: '1.6' }}>
                Работа кај друг работодавач покрај редовниот. Ограничена на 8 часа неделно.
              </p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', color: '#262626', marginBottom: '1rem' }}>
            Документи што ги генерираме
          </h2>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            color: '#525252',
            lineHeight: '2'
          }}>
            <li>✓ Договор за вработување</li>
            <li>✓ Анекс на договор</li>
            <li>✓ Одлука за престанок на договор</li>
            <li>✓ Одлука за годишен одмор</li>
            <li>✓ Потврда за работен однос</li>
            <li>✓ Предупредување/Опомена</li>
            <li>✓ Одлука за бонус и регрес</li>
          </ul>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', color: '#262626', marginBottom: '1.5rem' }}>
            Често поставувани прашања
          </h2>
          {faqs.map((faq, index) => (
            <div key={index} style={{
              background: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              marginBottom: '1rem'
            }}>
              <h3 style={{ fontSize: '1.125rem', color: '#262626', marginBottom: '0.75rem' }}>
                {faq.question}
              </h3>
              <p style={{ color: '#525252', lineHeight: '1.6', margin: 0 }}>
                {faq.answer}
              </p>
            </div>
          ))}
        </section>

        <section style={{
          background: '#F0F7FF',
          padding: '2rem',
          borderRadius: '12px'
        }}>
          <h2 style={{ fontSize: '1.75rem', color: '#262626', marginBottom: '1rem' }}>
            Генерирајте договори автоматски
          </h2>
          <p style={{ color: '#525252', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Со Nexa Terminal, сите работни документи се генерираат за 30 секунди.
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
              fontWeight: '600'
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
