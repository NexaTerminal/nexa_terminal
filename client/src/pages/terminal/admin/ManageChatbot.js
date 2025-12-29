import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import DocumentManagement from '../../../components/admin/chatbot/DocumentManagement';
import ConversationManagement from '../../../components/admin/chatbot/ConversationManagement';
import styles from '../../../styles/terminal/admin/ManageChatbot.module.css';

/**
 * Admin Chatbot Management Dashboard
 * Manages documents, conversations, and analytics for the AI chatbot
 */
const ManageChatbot = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('documents');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tab configuration
  const tabs = [
    { id: 'documents', label: 'Документи', icon: '📄' },
    { id: 'conversations', label: 'Разговори', icon: '💬' },
    { id: 'analytics', label: 'Аналитика', icon: '📊' }
  ];

  // Clear messages after timeout
  const showMessage = (type, message) => {
    if (type === 'success') {
      setSuccess(message);
      setTimeout(() => setSuccess(''), 4000);
    } else if (type === 'error') {
      setError(message);
      setTimeout(() => setError(''), 4000);
    }
  };

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles.dashboardLayout}>
        <Sidebar />

        <main className={styles.dashboardMain}>
          <div className={styles.pageHeader}>
            <h1>Управување со AI Chatbot</h1>
            <p>Управувајте со документи, разговори и аналитика на правниот chatbot</p>
          </div>

          {/* Tab Navigation */}
          <div className={styles.tabNavigation}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={styles.tabIcon}>{tab.icon}</span>
                <span className={styles.tabLabel}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Global Messages */}
          {error && (
            <div className={styles.messageError}>
              <span className={styles.messageIcon}>⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.messageSuccess}>
              <span className={styles.messageIcon}>✅</span>
              {success}
            </div>
          )}

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === 'documents' && (
              <DocumentManagement
                showMessage={showMessage}
                setLoading={setLoading}
              />
            )}

            {activeTab === 'conversations' && (
              <ConversationManagement
                showMessage={showMessage}
                setLoading={setLoading}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsDashboardPlaceholder
                token={token}
                setLoading={setLoading}
                showMessage={showMessage}
              />
            )}
          </div>

          {/* Global Loading Overlay */}
          {loading && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner}></div>
              <p>Вчитување...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

/**
 * Temporary placeholder components until actual components are created
 */
const DocumentManagementPlaceholder = ({ token, setLoading, showMessage }) => {
  return (
    <div className={styles.placeholder}>
      <h2>📄 Управување со документи</h2>
      <p>Овде ќе можете да:</p>
      <ul>
        <li>Прегледувате сите документи во Qdrant базата</li>
        <li>Додавате нови PDF/DOCX документи</li>
        <li>Бришете документи од векторската база</li>
        <li>Гледате статистика за документите</li>
      </ul>
      <div className={styles.placeholderNote}>
        Компонентата DocumentManagement е во развој
      </div>
    </div>
  );
};

const ConversationManagementPlaceholder = ({ token, setLoading, showMessage }) => {
  return (
    <div className={styles.placeholder}>
      <h2>💬 Управување со разговори</h2>
      <p>Овде ќе можете да:</p>
      <ul>
        <li>Прегледувате сите разговори со корисници</li>
        <li>Означувате непримерени разговори</li>
        <li>Гледате детали на разговорите</li>
        <li>Бришете разговори</li>
      </ul>
      <div className={styles.placeholderNote}>
        Компонентата ConversationManagement е во развој
      </div>
    </div>
  );
};

const AnalyticsDashboardPlaceholder = ({ token, setLoading, showMessage }) => {
  return (
    <div className={styles.placeholder}>
      <h2>📊 Аналитика на Chatbot</h2>
      <p>Овде ќе можете да:</p>
      <ul>
        <li>Гледате вкупен број на прашања</li>
        <li>Анализирате популарни прашања</li>
        <li>Следите користење на кредити</li>
        <li>Гледате топ корисници</li>
      </ul>
      <div className={styles.placeholderNote}>
        Компонентата AnalyticsDashboard е во развој
      </div>
    </div>
  );
};

export default ManageChatbot;
