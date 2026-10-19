import React from 'react';
import { useLocation } from 'react-router-dom';
import styles from '../../styles/terminal/Contact.module.css';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';

const Disclaimer = () => {
  const location = useLocation();
  const isTerminal = location.pathname.startsWith('/terminal');

  return (
    <div>
      <Header isTerminal={isTerminal} />

      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <div className={styles['contact-container']}>
            <div className={styles['contact-header']}>
              <h1>Услови за работа и GDPR правила</h1>
              <p>Важни информации за користење на платформата и заштита на податоци</p>
            </div>

            <div className={styles['contact-form']}>
              <section style={{ marginBottom: '30px' }}>
                <h2>За Nexa Terminal</h2>
                <p>
                  <strong>Nexa Terminal (оператор: NEXA AMD) е алатка и канал за поврзување</strong> која
                  поврзува компании со даватели на услуги. Ние НЕ даваме правни услуги и НЕ сме адвокатска
                  канцеларија — служиме само како технички канал за почетна комуникација.
                </p>
              </section>

              <section style={{ marginBottom: '30px' }}>
                <h2>Вештачка интелигенција и правен совет</h2>
                <div style={{ padding: '15px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
                  <p style={{ margin: 0, color: '#1e40af' }}>
                    AI-асистентите и генерираните документи на Nexa се информативна алатка и <strong>НЕ
                    претставуваат правен совет</strong>. NEXA AMD не одговара за точноста, содржината,
                    упатствата ниту за последиците од нивното користење. За конкретни правни прашања
                    консултирајте квалификуван адвокат.
                  </p>
                </div>
              </section>

              <section style={{ marginBottom: '30px' }}>
                <h2>Користење на податоци</h2>
                <p>
                  Кога поднесувате барање за понуда, вашите податоци ќе бидат споделени со релевантни даватели на услуги
                  во согласност со следните принципи:
                </p>
                <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
                  <li>Податоците се споделуваат само со провајдери кои се совпаѓаат со вашите барања</li>
                  <li>Провајдерите добиваат пристап само до информациите неопходни за обработка на вашето барање</li>
                  <li>Не споделуваме лични податоци со трети страни за маркетинг цели</li>
                  <li>Вашиот е-маил и контакт информации се споделуваат за директна комуникација</li>
                </ul>
              </section>

              <section style={{ marginBottom: '30px' }}>
                <h2>Деловна тајна и доверливи податоци</h2>
                <div style={{ padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#856404' }}>
                    ⚠️ ВАЖНО: Доколку во вашето барање се наведуваат деловни тајни, доверливи финансиски податоци,
                    или други чувствителни информации, барањето ќе биде автоматски одбиено и нема да биде
                    проследено до провајдерите.
                  </p>
                </div>
                <p style={{ marginTop: '15px' }}>
                  Ве советуваме да користите општи опис на вашите потреби без да наведувате специфични
                  деловни информации во почетното барање.
                </p>
              </section>

              <section style={{ marginBottom: '30px' }}>
                <h2>GDPR и заштита на податоци</h2>
                <p>
                  Во согласност со Општата уредба за заштита на податоци (GDPR), имате право на:
                </p>
                <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
                  <li><strong>Пристап:</strong> Да барате копија од вашите лични податоци</li>
                  <li><strong>Исправка:</strong> Да ги исправите неточните податоци</li>
                  <li><strong>Бришење:</strong> Да барате бришење на вашите податоци</li>
                  <li><strong>Ограничување:</strong> Да ограничите обработката на податоци</li>
                  <li><strong>Преносливост:</strong> Да ги добиете вашите податоци во структуриран формат</li>
                  <li><strong>Приговор:</strong> Да се спротивставите на обработката</li>
                </ul>
              </section>

              <section style={{ marginBottom: '30px' }}>
                <h2>Поврзување со професионалец</h2>
                <p>
                  Кога ќе се поврзете со адвокат или друг професионалец преку Nexa:
                </p>
                <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
                  <li><strong>Комуникацијата е исклучиво меѓу вас и професионалецот</strong> — NEXA AMD е само каналот преку кој започнува контактот и не е страна во тој однос или договор.</li>
                  <li><strong>NEXA AMD не зема провизија</strong> од професионалците ниту од корисниците, и нема финансиски интерес во исходот.</li>
                  <li><strong>Не поттикнуваме ниту сме заинтересирани</strong> дали, како или колку долго ќе соработувате — тоа е целосно ваша и нивна одлука.</li>
                  <li>NEXA AMD НЕ е одговорна за квалитетот на услугите, дадените совети и упатства, ниту за резултатите од соработката.</li>
                  <li>NEXA AMD НЕ учествува во договарањето на цени или услови.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '30px' }}>
                <h2>Анонимност на корисникот</h2>
                <p>
                  Како корисник (компанија) <strong>стандардно останувате анонимни</strong> за професионалецот —
                  вашиот идентитет не се открива додека вие не одлучите да го откриете. Профилот на
                  професионалецот (име, адреса, веб-страница, доколку ги внел) е секогаш видлив и достапен
                  за вас.
                </p>
              </section>

              <section style={{ marginBottom: '30px' }}>
                <h2>Контакт за прашања</h2>
                <p>
                  За било какви прашања во врска со заштитата на податоци или условите за користење,
                  контактирајте не на:
                </p>
                <p>
                  <strong>Email:</strong> privacy@nexaterminal.com<br/>
                  <strong>Телефон:</strong> +389 XX XXX XXX
                </p>
              </section>

              <section>
                <h2>Последни измени</h2>
                <p>
                  Овие услови се последно ажурирани на: <strong>{new Date().toLocaleDateString('mk-MK')}</strong>
                </p>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Disclaimer;