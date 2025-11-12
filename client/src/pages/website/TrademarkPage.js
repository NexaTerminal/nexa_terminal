import SimpleNavbar from '../../components/common/SimpleNavbar';
import PublicFooter from '../../components/common/PublicFooter';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { OrganizationSchema, FAQSchema } from '../../components/seo/StructuredData';

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
            Трговска марка и заштита на жиг
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#525252',
            lineHeight: '1.8'
          }}>
            Комплетна заштита на вашиот бренд - од регистрација до обновување на трговска марка во Северна Македонија
          </p>
        </header>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', color: '#262626', marginBottom: '1rem' }}>
            Зошто е важна регистрацијата?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
              background: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{ fontSize: '1.25rem', color: '#262626', marginBottom: '0.5rem' }}>
                Ексклузивно право на користење
              </h3>
              <p style={{ color: '#525252', lineHeight: '1.6' }}>
                Само вие имате право да ја користите вашата трговска марка во регистрираните класи на производи и услуги.
              </p>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{ fontSize: '1.25rem', color: '#262626', marginBottom: '0.5rem' }}>
                Правна заштита
              </h3>
              <p style={{ color: '#525252', lineHeight: '1.6' }}>
                Можност за тужба против секој што ја користи вашата марка без дозвола. Заштита од копирање и неовластена употреба.
              </p>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{ fontSize: '1.25rem', color: '#262626', marginBottom: '0.5rem' }}>
                Градење на бренд вредност
              </h3>
              <p style={{ color: '#525252', lineHeight: '1.6' }}>
                Регистрираната марка станува ваш актив што може да се продава, лицeнцира или користи како обезбедување.
              </p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', color: '#262626', marginBottom: '1rem' }}>
            Процес на регистрација
          </h2>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <ol style={{
              color: '#525252',
              lineHeight: '2',
              paddingLeft: '1.5rem'
            }}>
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

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', color: '#262626', marginBottom: '1rem' }}>
            Класи на производи и услуги
          </h2>
          <p style={{
            color: '#525252',
            lineHeight: '1.6',
            marginBottom: '1rem'
          }}>
            Трговските марки се регистрираат според Нискската класификација која содржи 45 класи:
          </p>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            color: '#525252',
            lineHeight: '2'
          }}>
            <li>✓ Класи 1-34: Производи (хемикалии, прехранбени производи, облека, итн.)</li>
            <li>✓ Класи 35-45: Услуги (маркетинг, финансии, правни услуги, итн.)</li>
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
            Заштитете ја вашата марка денес
          </h2>
          <p style={{ color: '#525252', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Nexa Terminal ви помага да ја регистрирате вашата трговска марка брзо и ефикасно.
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
