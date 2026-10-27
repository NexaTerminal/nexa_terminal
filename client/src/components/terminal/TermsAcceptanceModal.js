import React, { useState, useRef, useEffect } from 'react';
import styles from '../../styles/terminal/TermsAcceptanceModal.module.css';

const TermsAcceptanceModal = ({ isOpen, onAccept, onDecline }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasCheckedBox, setHasCheckedBox] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Reset states when modal opens
      setHasScrolledToBottom(false);
      setHasCheckedBox(false);

      // Auto-scroll to bottom after modal opens
      const scrollTimer = setTimeout(() => {
        if (contentRef.current) {
          const scrollHeight = contentRef.current.scrollHeight;
          const startTime = Date.now();
          const duration = 1000; // 1 second

          const animateScroll = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-in-out function for smooth animation
            const easeInOutCubic = progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            contentRef.current.scrollTop = scrollHeight * easeInOutCubic;

            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            }
          };

          animateScroll();
        }
      }, 100); // Small delay to ensure modal is rendered

      return () => clearTimeout(scrollTimer);
    }
  }, [isOpen]);

  const handleScroll = () => {
    if (!contentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold

    if (scrolledToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleCheckboxChange = (e) => {
    setHasCheckedBox(e.target.checked);
  };

  const canAccept = hasScrolledToBottom && hasCheckedBox;

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>Услови за користење</h2>
          <p className={styles.scrollInstruction}>
            {!hasScrolledToBottom ? 'Прочитајте ги условите до крај за да продолжите.' : 'Ги прочитавте условите.'}
          </p>
        </div>

        <div
          className={styles.modalContent}
          ref={contentRef}
          onScroll={handleScroll}
        >
          {/* Terms Content */}
          <div className={styles.termsContent}>
            <p className={styles.lastUpdated}>
              Последно ажурирано: Декември 2025 година
            </p>

            {/* Acceptance */}
            <section className={styles.section}>
              <h3>1. Прифаќање на условите</h3>
              <p>
                Со пристапување и користење на Nexa Terminal платформата, се согласувате да ги прифатите и да ги почитувате овие Услови за користење. Доколку не се согласувате со овие услови, ве молиме не ја користете платформата.
              </p>
              <ul>
                <li>Овие услови се применуваат на сите корисници на Nexa Terminal</li>
                <li>Задржуваме право да ги ажурираме условите во секое време</li>
                <li>Продолжувањето на користењето по промените значи прифаќање</li>
                <li>Минимална возраст за користење: 18 години</li>
              </ul>
            </section>

            {/* Service Description */}
            <section className={styles.section}>
              <h3>2. Опис на услугите</h3>
              <p>Nexa Terminal нуди следните услуги:</p>
              <ul>
                <li><strong>Автоматизирано генерирање на правни документи</strong> - шаблони за договори, одлуки и правни акти</li>
                <li><strong>Правна анализа на усогласеност</strong> - прашалници за проценка на усогласеност со закони</li>
                <li><strong>Најди адвокатr</strong> - посредничка услуга за поврзување со правни провајдери</li>
                <li><strong>АИ Чатбот асистент</strong> - експериментална функција за правни прашања (само информативна)</li>
                <li><strong>Едукативни материјали</strong> - курсеви и содржини за правно образование</li>
              </ul>
            </section>

            {/* Legal Disclaimer */}
            <section className={styles.section}>
              <h3>3. КРИТИЧНО: Правен образложение</h3>

              <div className={styles.warningBox}>
                <p><strong>⚖️ ВАЖНО: НИЕ НЕ ДАВАМЕ ПРАВЕН СОВЕТ</strong></p>
              </div>

              <h4>А. Образовна платформа</h4>
              <p>
                Nexa Terminal е <strong>образовна платформа</strong> и алатка за автоматизација. Ние <strong>НЕ даваме правен совет</strong> и <strong>НЕ сме ниту заменуваме совет на адвокат</strong>. Сите генерирани документи и информации се обезбедени за информативни и образовни цели. Се претпоставува дека сите документи, теркови ги користите само како за пример и во хипотетички ситуации, а доколку има потреба за истите може и да се консултирате со Вашите адвокати или стручни лица.
              </p>

              <h4>Б. Не е замена за адвокат</h4>
              <p>
                Генерираните документи се <strong>шаблони</strong> кои можат да бидат користени како основа, но <strong>мораат да бидат прегледани од квалификуван адвокат</strong> пред употреба. Секој правен документ треба да биде прилагоден на вашата специфична ситуација, а вака генерирани тие документи се смета дека не се вистински прилагодени и за тоа сте Вие свесни при користење на платформата.
              </p>

              <div className={styles.warningBox}>
                <p>
                  <strong>⚠️ ПРЕПОРАКА:</strong> Секогаш консултирајте адвокат пред употреба на документите генерирани од Nexa Terminal. Ние не можеме да гарантираме дека документите се соодветни за вашата ситуација или усогласени со најновите законски измени.
                </p>
              </div>

              <h4>В. Не е инвестициски совет</h4>
              <p>
                Било какви информации за инвестиции, финансии или деловни стратегии се <strong>само информативни</strong>. Nexa Terminal <strong>НЕ дава инвестициски совет</strong> и <strong>НЕ препорачува конкретни инвестиции</strong>. Консултирајте лиценциран финансиски советник за инвестициски одлуки.
              </p>
            </section>

            {/* Company Verification */}
            <section className={styles.section}>
              <h3>4. Верификација на компанија</h3>
              <p>
                За пристап до основните функции, морате да ја верификувате вашата компанија со обезбедување на:
              </p>
              <ul>
                <li>Точно име на компанијата</li>
                <li>Валиден даночен број</li>
                <li>Службен е-маил адреса (@вашата-компанија.com)</li>
                <li>Точни контакт информации</li>
              </ul>
              <p>
                <strong>Задржуваме право</strong> да ја одбиеме или повлечеме верификацијата доколку податоците се неточни или постои сомнение за злоупотреба. Обезбедувањето на лажни информации може да резултира со суспензија на сметката.
              </p>
            </section>

            {/* Prohibited Use */}
            <section className={styles.section}>
              <h3>5. Забрането користење</h3>
              <p>НЕ смеете да ја користите платформата за:</p>
              <ul>
                <li>Противзаконски активности или кршење на закони</li>
                <li>Генерирање на документи за измама или лажно презентирање или претставување</li>
                <li>Злоупотреба на системот (spam, автоматизирани барања)</li>
                <li>Споделување на вашата сметка со други лица</li>
                <li>Обид за хакирање или нарушување на безбедноста</li>
                <li>Репродукција, продажба или дистрибуција на нашите шаблони без дозвола</li>
              </ul>
              <p><strong>Последици:</strong> Кршењето на овие правила може да резултира со суспензија или трајно бришење на сметката без рефундирање на кредити.</p>
            </section>

            {/* Find Lawyer Terms */}
            <section className={styles.section}>
              <h3>6. Најди адвокат - Посредничка услуга</h3>

              <div className={styles.infoBox}>
                <p><strong>Важно:</strong> Nexa Terminal е само посредник кој ги поврзува компаниите со правни провајдери. Ние НЕ сме страна во договорот помеѓу вас и провајдерот, ниту сме во улога на посредник или застапник.</p>
              </div>

              <ul>
                <li><strong>Нема гаранции</strong> - не гарантираме за квалитетот на услугите на провајдерите</li>
                <li><strong>Независни провајдери</strong> - адвокатите/адвокатските друштва се независни професионалци</li>
                <li><strong>Цени и услови</strong> - ги договарате директно со провајдерот, ние не учествуваме</li>
                <li><strong>Доверливост</strong> - НЕ споделувајте деловни тајни во почетното барање</li>
                <li><strong>Договор</strong> - склучувате директен договор со провајдерот (не со Nexa)</li>
              </ul>

              <p>
                <strong>Одговорност:</strong> Nexa не е одговорна за квалитетот, резултатите или било какви штети што произлегуваат од услугите обезбедени од правните провајдери.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className={styles.section}>
              <h3>7. Ограничување на одговорноста</h3>

              <div className={styles.warningBox}>
                <p><strong>Услугите се нудат "AS IS" (како што се)</strong></p>
              </div>

              <p>
                Nexa Terminal <strong>НЕ гарантира</strong>:
              </p>
              <ul>
                <li>Дека генерираните документи се правно точни или комплетни</li>
                <li>Дека платформата ќе биде секогаш достапна без прекини</li>
                <li>Дека Legal Health Check резултатите се 100% прецизни</li>
                <li>Дека ќе постигнете конкретни резултати со употреба на услугите</li>
              </ul>

              <p>
                <strong>Максимална одговорност:</strong> Во случај на штета, нашата максимална одговорност е ограничена на износот што сте го платиле за кредити во последните 12 месеци, или 100 евра (што е помалку).
              </p>

              <p>
                <strong>Исклучување:</strong> Не одговараме за индиректни штети, изгубена добивка, изгубени деловни можности или други последични штети.
              </p>
            </section>

            {/* Governing Law */}
            <section className={styles.section}>
              <h3>8. Применливо право</h3>
              <p>
                Овие Услови за користење се уредени и толкуваат според законите на <strong>Република Северна Македонија</strong>.
              </p>
              <p>
                Било какви спорови ќе се решаваат пред надлежните судови во Скопје, Северна Македонија.
              </p>
              <p>
                Јазикот на овој договор е македонски. Во случај на конфликт помеѓу преводи, македонската верзија превладува.
              </p>
            </section>

            {/* Contact */}
            <section className={styles.section}>
              <h3>9. Контакт информации</h3>
              <p>За прашања во врска со овие Услови за користење:</p>
              <p><strong>Email:</strong> <a href="mailto:info@nexa.mk">info@nexa.mk</a></p>
              <p>
                <strong>Важно:</strong> Ве потсетуваме дека Nexa Terminal е образовна платформа и не дава правен совет. За правни прашања, консултирајте адвокат.
              </p>
            </section>

            <div className={styles.fullTermsLink}>
              <p>
                Целосните Услови за користење може да ги прочитате на:{' '}
                <a href="/terms-conditions" target="_blank" rel="noopener noreferrer">
                  nexa.mk/terms-conditions
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="termsCheckbox"
              checked={hasCheckedBox}
              onChange={handleCheckboxChange}
              disabled={!hasScrolledToBottom}
              className={styles.checkbox}
            />
            <label htmlFor="termsCheckbox" className={!hasScrolledToBottom ? styles.disabledLabel : ''}>
              Ги прочитав и ги прифаќам Условите за користење
            </label>
          </div>

          <div className={styles.buttonContainer}>
            <button
              onClick={onDecline}
              className={styles.declineButton}
              type="button"
            >
              Откажи
            </button>
            <button
              onClick={onAccept}
              disabled={!canAccept}
              className={styles.acceptButton}
              type="button"
            >
              {canAccept ? 'Прифати и продолжи' : 'Скролајте до крај и потврдете'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAcceptanceModal;
