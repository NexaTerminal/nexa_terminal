import React from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import styles from '../../styles/terminal/Contact.module.css';
import { useNavigate } from 'react-router-dom';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Header isTerminal={true} />
      <div className={styles['dashboard-layout']}>
        <Sidebar />
        <main className={styles['dashboard-main']}>
          <div className={styles['contact-container']}>
            <div className={styles['contact-header']}>
              <button onClick={() => navigate('/terminal')} className={styles['back-button']}>
                ← Назад кон Dashboard
              </button>
              <h1>Услови за користење</h1>
              <p>Правила и услови за користење на Nexa Terminal платформата</p>
            </div>

            <div className={styles['contact-form']}>
              <p style={{fontSize: '0.875rem', color: '#737373', fontStyle: 'italic', marginBottom: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px', textAlign: 'center'}}>
                Последно ажурирано: Септември 2026 година
              </p>

              {/* Owner */}
              <section style={{marginBottom: '3rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb'}}>Сопственик на платформата</h2>
                <p>
                  Веб апликацијата Nexa Terminal е во сопственост на <strong>Друштво за услуги НЕКСА АМД ДООЕЛ Скопје</strong>, со седиште на <strong>БУЛЕВАР ПАРТИЗАНСКИ ОДРЕД 102/2-14</strong>.
                </p>
                <p>
                  <strong>Контакт телефон:</strong> <a href="tel:+38978534258" style={{color: 'var(--color-primary)'}}>+389 78 534 258</a>
                </p>
              </section>

              {/* Key Points */}
              <section style={{marginBottom: '3rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb'}}>Најважни точки</h2>
                <p>
                  Целосните Услови за користење може да ги најдете на нашата јавна <a href="/terms-conditions" target="_blank" style={{color: 'var(--color-primary)', textDecoration: 'underline'}}>страница за услови</a>.
                </p>
                <p>Накратко, клучните точки се:</p>
              </section>

              {/* Critical Disclaimers */}
              <section style={{marginBottom: '3rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb'}}>⚖️ КРИТИЧНО: Правни дисклејмери</h2>

                <div style={{background: '#FEF3C7', borderLeft: '4px solid #F59E0B', padding: '1.25rem', margin: '1.5rem 0', borderRadius: '8px'}}>
                  <p style={{color: '#92400E', margin: 0, fontWeight: 500}}><strong>НЕ ДАВАМЕ ПРАВЕН СОВЕТ</strong></p>
                </div>

                <ul style={{marginLeft: '2rem', lineHeight: 1.8}}>
                  <li>Nexa Terminal е <strong>образовна платформа</strong>, не адвокатска канцела</li>
                  <li>Генерираните документи се <strong>шаблони</strong> кои мораат да бидат прегледани од адвокат</li>
                  <li>НЕ даваме правен совет или инвестициски совет</li>
                  <li>Секогаш консултирајте адвокат пред употреба на документите</li>
                </ul>
              </section>

              {/* Find Lawyer */}
              <section style={{marginBottom: '3rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb'}}>Find Lawyer - Посредничка услуга</h2>

                <div style={{background: '#DBEAFE', borderLeft: '4px solid #3B82F6', padding: '1.25rem', margin: '1.5rem 0', borderRadius: '8px'}}>
                  <p style={{color: '#1E40AF', margin: 0}}><strong>Важно:</strong> Nexa Terminal е само посредник. Ние НЕ сме страна во договорот помеѓу вас и провајдерот.</p>
                </div>

                <ul style={{marginLeft: '2rem', lineHeight: 1.8}}>
                  <li>Нема гаранции за квалитетот на услугите</li>
                  <li>Провајдерите се независни професионалци</li>
                  <li>Цените ги договарате директно со нив</li>
                  <li>НЕ споделувајте деловни тајни во почетното барање</li>
                </ul>
              </section>

              {/* Providers — Leads / Cases */}
              <section style={{marginBottom: '3rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb'}}>Членови-провајдери и услугата „Случаи“ (посредување на прашања)</h2>

                <div style={{background: '#DBEAFE', borderLeft: '4px solid #3B82F6', padding: '1.25rem', margin: '1.5rem 0', borderRadius: '8px'}}>
                  <p style={{color: '#1E40AF', margin: 0}}><strong>Улогата на Nexa завршува со воведниот е-меил.</strong> Откако ќе ве поврземе со потенцијален клиент преку воведно (introduction) известување, Nexa <strong>повеќе не е вклучена</strong> и <strong>не е страна</strong> во вашиот однос со клиентот.</p>
                </div>

                <p>За услугата „Случаи“ / „Прашања“ преку која добивате потенцијални клиенти од нашата мрежа сајтови, важи следново:</p>
                <ul style={{marginLeft: '2rem', lineHeight: 1.8}}>
                  <li>Nexa е <strong>само технички посредник</strong> што прикажува анонимизирани прашања и, по ваша изразена заинтересираност и наша одлука, ве поврзува со клиентот преку воведен е-меил.</li>
                  <li>По испраќањето на воведниот е-меил, <strong>секаква понатамошна комуникација, договор, ангажман, хонорар, наплата, квалитет и исход се исклучиво помеѓу вас и клиентот</strong>. Nexa не посредува, не надгледува, не гарантира и не одговара за ниту еден дел од тој однос.</li>
                  <li>Nexa <strong>не гарантира</strong> број, зачестеност, достапност, квалитет или конверзија на прашањата/случаите. Тие се доставуваат „како што се“ (AS IS).</li>
                  <li>Вие сте <strong>самостоен и целосно одговорен професионалец</strong> — сами одговарате за сопственото лиценцирање/овластување, договорите со клиентите, наплатата, осигурувањето од професионална одговорност, даноците и почитувањето на прописите.</li>
                  <li><strong>Доверливост:</strong> податоците за клиентот што ќе ги добиете се доверливи и се користат исклучиво за конкретниот случај. Забрането е нивно неовластено чување, споделување, препродажба или користење за друга цел, како и секаков спам.</li>
                  <li><strong>Забрана за заобиколување:</strong> забрането е препродажба или пренос на добиените контакти/лидови, како и намерно заобиколување на платформата со цел избегнување на овие правила.</li>
                  <li>Односот меѓу вас и Nexa е на <strong>независни договорни страни</strong> — ништо во овие услови не создава ортаклак, вработување, застапништво или заедничко вложување.</li>
                </ul>
              </section>

              {/* Licensing & Right to Remove */}
              <section style={{marginBottom: '3rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb'}}>Лиценцирање, изјави и право на исклучување</h2>

                <div style={{background: '#FEE2E2', borderLeft: '4px solid #EF4444', padding: '1.25rem', margin: '1.5rem 0', borderRadius: '8px'}}>
                  <p style={{color: '#991B1B', margin: 0, fontWeight: 500}}>Ако утврдиме дека немате важечка лиценца/овластување за дејноста што ја нудите, можеме веднаш да ве исклучиме — без претходна најава и без враќање на платениот надоместок.</p>
                </div>

                <p>Со користење на услугата, вие <strong>изјавувате и гарантирате</strong> дека:</p>
                <ul style={{marginLeft: '2rem', lineHeight: 1.8}}>
                  <li>сте <strong>соодветно лиценцирани и овластени</strong> да ја вршите дејноста што ја нудите (на пр. адвокат запишан во Именикот на адвокати при Адвокатската комора, овластен сметководител, даночен советник и сл.) и сте во <strong>добра професионална состојба</strong> (не сте суспендирани, избришани или под забрана);</li>
                  <li>сите податоци што ги давате за себе, вашите квалификации и вашата дејност се <strong>вистинити и ажурни</strong>;</li>
                  <li>ќе ги почитувате сите применливи закони, професионални и етички правила при работата со клиентите.</li>
                </ul>

                <p style={{marginTop: '1rem'}}>Nexa го задржува правото, по сопствена оцена и со основано сомневање, <strong>веднаш да суспендира или трајно да ја укине вашата сметка</strong> (без враќање на средства) доколку:</p>
                <ul style={{marginLeft: '2rem', lineHeight: 1.8}}>
                  <li>не сте лиценцирани/овластени или сте дале лажни или погрешни податоци за вашите квалификации;</li>
                  <li>ги прекршувате овие услови, законите или професионалните правила;</li>
                  <li>ја злоупотребувате платформата, податоците за клиентите или другите членови;</li>
                  <li>примаме основана поплака што ја загрозува довербата во мрежата.</li>
                </ul>
                <p>Во такви случаи можеме да го известиме клиентот и, каде што е соодветно, да го пријавиме случајот до надлежните тела или професионални комори.</p>
              </section>

              {/* Indemnification */}
              <section style={{marginBottom: '3rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb'}}>Обештетување</h2>
                <p>Се согласувате да ја <strong>обештетите и заштитите Nexa</strong> (и нејзините сопственици, вработени и соработници) од секакви побарувања, штети, трошоци и правни трошоци што произлегуваат од:</p>
                <ul style={{marginLeft: '2rem', lineHeight: 1.8}}>
                  <li>услугите што им ги давате на клиентите поврзани преку платформата;</li>
                  <li>вашето (не)лиценцирање или лажно претставување на квалификациите;</li>
                  <li>вашето прекршување на овие услови, на закон или на професионални правила;</li>
                  <li>вашето ракување со податоците на клиентите.</li>
                </ul>
              </section>

              {/* Prohibited Use */}
              <section style={{marginBottom: '3rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb'}}>Забрането користење</h2>
                <p>НЕ смеете да ја користите платформата за:</p>
                <ul style={{marginLeft: '2rem', lineHeight: 1.8}}>
                  <li>Незаконски активности или кршење на закони</li>
                  <li>Генерирање на документи за измама</li>
                  <li>Злоупотреба на системот (spam, автоматизирани барања)</li>
                  <li>Споделување на вашата сметка</li>
                  <li>Репродукција или продажба на нашите шаблони</li>
                  <li>Лажно претставување на вашата лиценца, овластување или квалификации</li>
                  <li>Препродажба, пренос или заобиколување на добиените контакти/случаи</li>
                </ul>
              </section>

              {/* Limitation of Liability */}
              <section style={{marginBottom: '3rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb'}}>Ограничување на одговорноста</h2>

                <div style={{background: '#FEF3C7', borderLeft: '4px solid #F59E0B', padding: '1.25rem', margin: '1.5rem 0', borderRadius: '8px'}}>
                  <p style={{color: '#92400E', margin: 0, fontWeight: 500}}>Услугите се нудат "AS IS" (како што се)</p>
                </div>

                <p>НЕ гарантираме:</p>
                <ul style={{marginLeft: '2rem', lineHeight: 1.8}}>
                  <li>Дека генерираните документи се правно точни</li>
                  <li>Дека платформата ќе биде секогаш достапна</li>
                  <li>Дека ќе постигнете конкретни резултати</li>
                  <li>Број, квалитет или конверзија на прашања/случаи доставени преку мрежата</li>
                </ul>
                <p>Nexa <strong>не одговара за односот меѓу членот-провајдер и клиентот</strong> откако ќе биде испратен воведниот е-меил — вклучувајќи ги квалитетот на услугата, договорите, наплатата, споровите и исходот.</p>
                <p><strong>Максимална одговорност:</strong> Ограничена на износот што сте го платиле во последните 12 месеци, или 100 евра (што е помалку).</p>
              </section>

              <div style={{background: 'linear-gradient(135deg, #1E4DB7 0%, #3B82F6 100%)', color: 'white', padding: '2rem', borderRadius: '12px', textAlign: 'center', marginTop: '2rem'}}>
                <h3 style={{color: 'white', marginBottom: '1rem'}}>Прочитајте ги целосните услови</h3>
                <p>Целосните Услови за користење се достапни на: <a href="/terms-conditions" target="_blank" style={{color: 'white', textDecoration: 'underline'}}>nexa.mk/terms-conditions</a></p>
                <p><strong>Email за прашања:</strong> <a href="mailto:info@nexa.mk" style={{color: 'white', textDecoration: 'underline'}}>info@nexa.mk</a></p>
                <p><strong>Телефон:</strong> <a href="tel:+38978534258" style={{color: 'white', textDecoration: 'underline'}}>+389 78 534 258</a></p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TermsAndConditions;
