import SimpleNavbar from '../../components/common/SimpleNavbar';
import PublicFooter from '../../components/common/PublicFooter';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { OrganizationSchema, FAQSchema } from '../../components/seo/StructuredData';

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
            Корпоративно право
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#525252',
            lineHeight: '1.8'
          }}>
            Професионална правна поддршка за отворање, управување и реорганизација на вашата компанија
          </p>
        </header>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', color: '#262626', marginBottom: '1rem' }}>
            Правни форми на компании
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
              background: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{ fontSize: '1.25rem', color: '#262626', marginBottom: '0.5rem' }}>
                ДООЕЛ - Друштво со ограничена одговорност основано од едно лице
              </h3>
              <p style={{ color: '#525252', lineHeight: '1.6' }}>
                Најпопуларна форма. Минимален капитал 5.000 денари. Едноставно управување. Ограничена одговорност на основачот.
              </p>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{ fontSize: '1.25rem', color: '#262626', marginBottom: '0.5rem' }}>
                ДОО - Друштво со ограничена одговорност
              </h3>
              <p style={{ color: '#525252', lineHeight: '1.6' }}>
                Со двајца или повеќе сопственици. Минимален капитал 5.000 денари. Договор за основање меѓу сопствениците.
              </p>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{ fontSize: '1.25rem', color: '#262626', marginBottom: '0.5rem' }}>
                АД - Акционерско друштво
              </h3>
              <p style={{ color: '#525252', lineHeight: '1.6' }}>
                За поголеми бизниси. Минимален капитал 500.000 денари. Можност за котирање на берза. Сложена структура на управување.
              </p>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{ fontSize: '1.25rem', color: '#262626', marginBottom: '0.5rem' }}>
                Commanditno Društvo (КД)
              </h3>
              <p style={{ color: '#525252', lineHeight: '1.6' }}>
                Партнерство со генерални и ограничени партнери. Ретко користено. Специфично за определени индустрии.
              </p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', color: '#262626', marginBottom: '1rem' }}>
            Процес на отворање фирма
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

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', color: '#262626', marginBottom: '1rem' }}>
            Потребни документи
          </h2>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            color: '#525252',
            lineHeight: '2'
          }}>
            <li>✓ Лична карта на основачот/основачите</li>
            <li>✓ Статут на компанијата</li>
            <li>✓ Одлука за основање или Договор за основање</li>
            <li>✓ Доказ за уплатен основачки капитал</li>
            <li>✓ Договор за користење на деловен простор (закуп или сопственост)</li>
            <li>✓ Одлука за именување на директор/управител</li>
            <li>✓ Изјава за прифаќање на функцијата од директорот</li>
          </ul>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', color: '#262626', marginBottom: '1rem' }}>
            Корпоративни услуги
          </h2>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              color: '#525252',
              lineHeight: '2'
            }}>
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
            Започнете го вашиот бизнис денес
          </h2>
          <p style={{ color: '#525252', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Nexa Terminal ви обезбедува комплетна правна поддршка за отворање и управување со вашата компанија.
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
