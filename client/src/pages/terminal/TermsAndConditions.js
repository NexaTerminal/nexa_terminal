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
                Последно ажурирано: Декември 2025 година
              </p>

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

              {/* Prohibited Use */}
              <section style={{marginBottom: '3rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb'}}>Забрането користење</h2>
                <p>НЕ смеете да ја користите платформата за:</p>
                <ul style={{marginLeft: '2rem', lineHeight: 1.8}}>
                  <li>Illegals активности или кршење на закони</li>
                  <li>Генерирање на документи за измама</li>
                  <li>Злоупотреба на системот (spam, автоматизирани барања)</li>
                  <li>Споделување на вашата сметка</li>
                  <li>Репродукција или продажба на нашите шаблони</li>
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
                </ul>
                <p><strong>Максимална одговорност:</strong> Ограничена на износот што сте го платиле во последните 12 месеци, или 100 евра (што е помалку).</p>
              </section>

              <div style={{background: 'linear-gradient(135deg, #1E4DB7 0%, #3B82F6 100%)', color: 'white', padding: '2rem', borderRadius: '12px', textAlign: 'center', marginTop: '2rem'}}>
                <h3 style={{color: 'white', marginBottom: '1rem'}}>Прочитајте ги целосните услови</h3>
                <p>Целосните Услови за користење се достапни на: <a href="/terms-conditions" target="_blank" style={{color: 'white', textDecoration: 'underline'}}>nexa.mk/terms-conditions</a></p>
                <p><strong>Email за прашања:</strong> <a href="mailto:info@nexa.mk" style={{color: 'white', textDecoration: 'underline'}}>info@nexa.mk</a></p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TermsAndConditions;
