import React from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import ContractAnalysisPanel from '../../components/contractAnalysis/ContractAnalysisPanel';
import styles from '../../styles/terminal/ContractAnalysis.module.css';

export default function ContractAnalysis() {
  return (
    <div>
      <Header isTerminal={true} />
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Анализа на договор АИ</h1>
            <p className={styles.pageSubtitle}>
              Прикачете договор и добијте темелна правна анализа од вашата перспектива како договорна страна.
            </p>
          </header>

          <ContractAnalysisPanel />
        </div>
      </main>
    </div>
  );
}
