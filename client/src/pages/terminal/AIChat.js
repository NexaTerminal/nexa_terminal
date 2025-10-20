import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import styles from '../../styles/terminal/AIChat.module.css';

const AIChat = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.pageWrapper}>
      <Header isTerminal={true} />

      <div className={styles.layout}>
        <Sidebar />

        <main className={styles.mainContent}>
          <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
              <div className={styles.headerContent}>
                <div className={styles.aiAvatar}>🤖</div>
                <div className={styles.headerText}>
                  <h1>{t('dashboard.nexaAI')}</h1>
                  <p className={styles.subtitle}>{t('dashboard.nexaAISubtitle')}</p>
                </div>
              </div>
            </div>

            <div className={styles.chatbotContainer}>
              <iframe
                src="https://www.chatbase.co/chatbot-iframe/Q32fiJ_HYKM38y3KEK0qW"
                className={styles.chatbotIframe}
                title="Nexa AI Assistant"
                frameBorder="0"
                allow="clipboard-write"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIChat;
