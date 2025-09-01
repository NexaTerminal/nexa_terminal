import React from "react";
import Header from "../../components/common/Header";
import Sidebar from "../../components/terminal/Sidebar";
import styles from "../../styles/terminal/documents/DocumentGeneration.module.css";

const GeneralConditions = () => {
  return (
    <>
      <Header />
      <div className={styles['dashboard-layout']}>
        <Sidebar />
        <main className={styles['dashboard-main']}>
          <div className={styles['page-container']}>
            <div className={styles['page-content']}>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                color: '#374151', 
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                Општи услови за користење
              </h1>
              
              <div style={{ 
                maxWidth: '800px', 
                margin: '0 auto', 
                background: '#ffffff',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                lineHeight: '1.6'
              }}>
                <h2 style={{ color: '#374151', marginTop: '2rem', marginBottom: '1rem' }}>
                  Правно предупредување и одрекување од одговорност
                </h2>
                
                <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
                  Пред користење на алатките за генерирање документи на платформата Nexa, ве молиме внимателно да ги прочитате следните услови и ограничувања:
                </p>

                <h3 style={{ color: '#374151', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  1. Образовна и информативна цель
                </h3>
                <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
                  Сите документи и шаблони достапни на оваа платформа се наменети исклучиво за <strong>образовни и информативни цели</strong>. Тие не претставуваат правен совет ниту службена подготвка на правни документи.
                </p>

                <h3 style={{ color: '#374151', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  2. Не е правен совет
                </h3>
                <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
                  Информациите и документите генерирани преку оваа платформа <strong>не претставуваат правен совет</strong>. Тие не се замена за консултација со квалификуван правник или адвокат.
                </p>

                <h3 style={{ color: '#374151', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  3. Препорака за правна консултација
                </h3>
                <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
                  <strong>Силно препорачуваме</strong> секој документ генериран преку оваа платформа да биде прегледан и верификуван од страна на квалификуван адвокат или правен советник пред неговото користење во реални правни ситуации.
                </p>

                <h3 style={{ color: '#374151', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  4. Одговорност на корисникот
                </h3>
                <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
                  Корисникот е <strong>единствено одговорен</strong> за начинот на кој избира да ги користи генерираните документи. Секоја одлука за користење на документите во правни или деловни ситуации е на сопствена одговорност на корисникот.
                </p>

                <h3 style={{ color: '#374151', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  5. Ограничување на одговорноста
                </h3>
                <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
                  Создавачите и операторите на платформата Nexa <strong>не прифаќаат никаква одговорност</strong> за:
                </p>
                <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem', color: '#4b5563' }}>
                  <li>Точноста, комплетноста или правната ваљаност на генерираните документи</li>
                  <li>Штети или загуби кои може да произлезат од користењето на документите</li>
                  <li>Правни последици од користењето на документите без соодветна правна консултација</li>
                </ul>

                <h3 style={{ color: '#374151', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  6. Не очекуваме реална употреба
                </h3>
                <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
                  Создавачите на Nexa <strong>не очекуваат и не препорачуваат</strong> директна употреба на генерираните документи во реални правни случаи без претходна правна верификација и прилагодување од страна на квалификуван правник.
                </p>

                <h3 style={{ color: '#374151', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  7. Важност на локалните закони
                </h3>
                <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
                  Правните барања и регулативи се разликуваат според законодавството. Генерираните документи мора да бидат прилагодени според <strong>важечките локални закони и прописи</strong>.
                </p>

                <h3 style={{ color: '#374151', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  8. Согласност со условите
                </h3>
                <p style={{ marginBottom: '2rem', color: '#4b5563' }}>
                  Со користење на оваа платформа и генерирање на документи, се согласувате дека:
                </p>
                <ul style={{ marginLeft: '1.5rem', marginBottom: '2rem', color: '#4b5563' }}>
                  <li>Ги разбирате и прифаќате горенаведените ограничувања</li>
                  <li>Ќе бидете одговорни за секоја употреба на генерираните документи</li>
                  <li>Ќе побарате професионален правен совет пред користење на документите</li>
                  <li>Nexa и нејзините создавачи не се одговорни за никакви последици</li>
                </ul>

                <div style={{ 
                  background: '#fef3c7', 
                  border: '1px solid #f59e0b', 
                  borderRadius: '6px', 
                  padding: '1rem', 
                  marginTop: '2rem' 
                }}>
                  <p style={{ 
                    margin: 0, 
                    color: '#92400e', 
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    ⚠️ ВАЖНО: Овие документи се само образовни алатки. Секогаш консултирајте се со адвокат!
                  </p>
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                  <button 
                    onClick={() => window.close()} 
                    style={{
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 2rem',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#374151'}
                    onMouseLeave={(e) => e.target.style.background = '#6b7280'}
                  >
                    Затвори
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default GeneralConditions;