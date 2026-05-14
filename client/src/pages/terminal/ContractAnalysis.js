import React, { useEffect, useState } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import ContractDropzone from '../../components/contractAnalysis/ContractDropzone';
import IntroQuestions from '../../components/contractAnalysis/IntroQuestions';
import AnalysisReport from '../../components/contractAnalysis/AnalysisReport';
import { getUsage, uploadContract, analyzeContract } from '../../services/contractAnalysisApi';
import styles from '../../styles/terminal/ContractAnalysis.module.css';

const STEP = { UPLOAD: 'upload', QUESTIONS: 'questions', ANALYZING: 'analyzing', REPORT: 'report' };

export default function ContractAnalysis() {
  const [step, setStep] = useState(STEP.UPLOAD);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState(null);
  const [filename, setFilename] = useState(null);
  const [preScan, setPreScan] = useState(null);
  const [report, setReport] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => { fetchUsage(); }, []);

  async function fetchUsage() {
    try { setUsage(await getUsage()); } catch (e) { console.error(e); }
  }

  async function handleFile(file) {
    setError(null);
    setIsUploading(true);
    setFilename(file.name);
    try {
      const result = await uploadContract(file);
      setPreScan(result);
      // If pre-scan returned 0 questions AND only one detected role, skip straight to analysis with that role
      if ((!result.questions || result.questions.length === 0) && result.parties?.length === 1) {
        await runAnalysis({
          sessionId: result.sessionId,
          userRole: `${result.parties[0].role} (${result.parties[0].label})`,
          userAnswers: {},
        });
      } else {
        setStep(STEP.QUESTIONS);
      }
    } catch (e) {
      setError(e.message);
      setStep(STEP.UPLOAD);
    } finally {
      setIsUploading(false);
    }
  }

  async function runAnalysis({ sessionId, userRole, userAnswers }) {
    setError(null);
    setIsAnalyzing(true);
    setStep(STEP.ANALYZING);
    try {
      const result = await analyzeContract({ sessionId, userRole, userAnswers });
      setReport(result.report);
      setUsage(result.usage);
      setStep(STEP.REPORT);
    } catch (e) {
      setError(e.message);
      setStep(STEP.QUESTIONS);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleQuestionsSubmit({ userRole, userAnswers }) {
    if (!preScan?.sessionId) return;
    runAnalysis({ sessionId: preScan.sessionId, userRole, userAnswers });
  }

  function handleReset() {
    setStep(STEP.UPLOAD);
    setPreScan(null);
    setReport(null);
    setFilename(null);
    setError(null);
  }

  const quotaExhausted = usage && usage.remaining <= 0;

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
            {usage && (
              <div className={styles.usagePill}>
                Преостанати анализи овој месец: <strong>{usage.remaining}</strong> / {usage.limit}
              </div>
            )}
          </header>

          {error && (
            <div className={styles.errorBanner}>
              ⚠️ {error}
            </div>
          )}

          {step === STEP.UPLOAD && (
            <>
              {quotaExhausted && (
                <div className={styles.errorBanner}>
                  Ја достигнавте месечната граница. Лимитот се ресетира на 1-ви во наредниот месец.
                </div>
              )}
              <ContractDropzone onFile={handleFile} disabled={isUploading || quotaExhausted} />
              {isUploading && (
                <div className={styles.statusBox}>
                  <div className={styles.spinner} />
                  Читам го документот „{filename}"…
                </div>
              )}
            </>
          )}

          {step === STEP.QUESTIONS && preScan && (
            <IntroQuestions preScan={preScan} onSubmit={handleQuestionsSubmit} isAnalyzing={isAnalyzing} />
          )}

          {step === STEP.ANALYZING && (
            <div className={styles.statusBox}>
              <div className={styles.spinner} />
              <div>
                <strong>Анализирам го договорот…</strong>
                <p className={styles.muted}>Ова обично трае 20–40 секунди.</p>
              </div>
            </div>
          )}

          {step === STEP.REPORT && report && (
            <>
              <div className={styles.reportToolbar}>
                <span className={styles.muted}>Анализирано: <strong>{filename}</strong></span>
                <button className={styles.secondaryButton} onClick={handleReset}>Нова анализа</button>
              </div>
              <AnalysisReport report={report} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
