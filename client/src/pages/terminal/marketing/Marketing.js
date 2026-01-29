import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import ProfileReminderBanner from '../../../components/terminal/ProfileReminderBanner';
import styles from '../../../styles/terminal/marketing/Marketing.module.css';

const Marketing = () => {
  const navigate = useNavigate();

  const documents = [
    {
      id: 'performance-report',
      title: 'Маркетинг перформанс извештај',
      description: 'Генерирајте детален извештај за маркетинг активностите, буџетот, перформансите и остварувањето на целите за одреден период.',
      route: '/terminal/marketing/performance-report',
      status: 'active'
    }
  ];

  const handleDocumentClick = (doc) => {
    if (doc.status === 'active') {
      navigate(doc.route);
    }
  };

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <ProfileReminderBanner />

          <div className={styles["page-container"]}>
            <div className={styles["page-header"]}>
              <h1>Маркетинг документи</h1>
              <p>
                Изберете документ за автоматско генерирање. Пополнете ги потребните податоци и системот ќе генерира професионален документ подготвен за употреба.
              </p>
            </div>

            <div className={styles["documents-grid"]}>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`${styles["document-card"]} ${doc.status !== 'active' ? styles["disabled"] : ''}`}
                  onClick={() => handleDocumentClick(doc)}
                >
                  <h3 className={styles["document-title"]}>{doc.title}</h3>
                  <p className={styles["document-description"]}>{doc.description}</p>
                  <span className={`${styles["document-status"]} ${styles[doc.status]}`}>
                    {doc.status === 'active' ? 'Достапно' : 'Наскоро'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Marketing;
