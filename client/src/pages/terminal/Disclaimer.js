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
                  <strong>Nexa Terminal е посредничка платформа</strong> која поврзува компании со даватели на услуги.
                  Ние НЕ даваме директни услуги, туку служиме како посредник за поврзување на корисници со соодветни провајдери.
                </p>
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
                <h2>Одговорности на платформата</h2>
                <p>
                  Како посредничка платформа, Nexa Terminal:
                 </p>
                <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
                  <li>НЕ е одговорна за квалитетот на услугите што ги даваат провајдерите</li>
                  <li>НЕ гарантира за резултатите од соработката со провајдерите</li>
                  <li>НЕ учествува во договарањето на цени или услови</li>
                  <li>Служи само како канал за почетна комуникација</li>
                </ul>
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