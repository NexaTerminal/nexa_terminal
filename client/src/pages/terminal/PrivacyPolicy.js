import React from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import styles from '../../styles/terminal/Contact.module.css';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
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
              <h1>Политика за приватност</h1>
              <p>Како Nexa Terminal ги заштитува вашите лични податоци</p>
            </div>

            <div className={styles['contact-form']}>
              <p style={{fontSize: '0.875rem', color: '#737373', fontStyle: 'italic', marginBottom: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px', textAlign: 'center'}}>
                Последно ажурирано: Декември 2024
              </p>

              {/* Introduction */}
              <section style={{marginBottom: '3rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb'}}>1. Вовед</h2>
                <p>
                  Добредојдовте на Nexa Terminal. Вашата приватност е од клучно значење за нас. Оваа Политика за приватност објаснува кои податоци ги собираме, како ги користиме и како ги заштитуваме вашите лични податоци во согласност со Законот за заштита на лични податоци на Република Северна Македонија и GDPR принципите.
                </p>
                <div style={{background: '#FEF3C7', borderLeft: '4px solid #F59E0B', padding: '1.25rem', margin: '1.5rem 0', borderRadius: '8px'}}>
                  <p style={{color: '#92400E', margin: 0, fontWeight: 500}}><strong>Важно:</strong> Nexa Terminal НЕ ги чува документите кои ги генерирате. Вашите документи се креираат во реално време и се испраќаат директно до вас. Податоците што ги внесувате во формуларите се бришат веднаш по генерирањето на документот.</p>
                </div>
              </section>

              {/* Rest of the content - condensed for brevity */}
              <section style={{marginBottom: '3rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb'}}>2. Кои податоци ги собираме</h2>
                <p>Повеќе детали за собраните податоци може да најдете на нашата јавна <a href="/privacy-policy" target="_blank" style={{color: 'var(--color-primary)', textDecoration: 'underline'}}>страница за приватност</a>.</p>
                <p>Накратко, ние собираме: корисничка сметка, информации за компанија и податоци за употреба на платформата. <strong>НЕ ги чуваме генерираните документи.</strong></p>
              </section>

              <section style={{marginBottom: '3rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb'}}>Вашите права според GDPR</h2>
                <p>Имате право на пристап, исправка, бришење, ограничување, преносливост и приговор во врска со вашите податоци.</p>
                <p>За да ги остварите вашите права, контактирајте не на: <a href="mailto:info@nexa.mk" style={{color: 'var(--color-primary)'}}>info@nexa.mk</a></p>
              </section>

              <div style={{background: 'linear-gradient(135deg, #1E4DB7 0%, #3B82F6 100%)', color: 'white', padding: '2rem', borderRadius: '12px', textAlign: 'center', marginTop: '2rem'}}>
                <h3 style={{color: 'white', marginBottom: '1rem'}}>Контакт за прашања за приватност</h3>
                <p><strong>Email:</strong> <a href="mailto:info@nexa.mk" style={{color: 'white', textDecoration: 'underline'}}>info@nexa.mk</a></p>
                <p>Целосната политика за приватност е достапна на: <a href="/privacy-policy" target="_blank" style={{color: 'white', textDecoration: 'underline'}}>nexa.mk/privacy-policy</a></p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
