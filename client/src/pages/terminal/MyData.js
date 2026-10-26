import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import styles from './MyData.module.css';

/**
 * „Мои податоци и доверливост" — plain-language statement of what Nexa keeps
 * and where AI questions go, plus the user's own controls: counts, a full JSON
 * export, and permanent erase of AI history and of the activity log.
 */

const API = process.env.REACT_APP_API_URL || '/api';

const ERASE = {
  ai: {
    title: 'Избриши ја целата AI историја',
    body: 'Сите разговори со AI тимот (и оние во Корпа), меморијата што AI ја има за вас и дневникот на проверени цитати. Трајно — не може да се врати.',
    path: 'ai',
  },
  activity: {
    title: 'Избриши го дневникот на активност',
    body: 'Записите кои страници сте ги отвориле, колку време и на што сте кликнале. Трајно — не може да се врати.',
    path: 'activity',
  },
};

export default function MyData() {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState(null);
  const [busy, setBusy] = useState(false);

  const auth = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/my-data/summary`, { headers: auth() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSummary(data.summary);
    } catch (e) {
      setError(e.message || 'Не успеавме да ги вчитаме податоците.');
    }
  }, [auth]);

  useEffect(() => { if (token) load(); }, [token, load]);

  // Unused while the counts/export panel is hidden.
  // eslint-disable-next-line no-unused-vars
  const exportAll = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await fetch(`${API}/my-data/export`, { headers: auth() });
      if (!res.ok) throw new Error('Извозот не успеа.');
      const blob = await res.blob();
      const name = (res.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/)?.[1] || 'nexa-moi-podatoci.json';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setNotice('Извозот е преземен.');
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  };

  const erase = async (key) => {
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await fetch(`${API}/my-data/${ERASE[key].path}?confirm=1`, { method: 'DELETE', headers: auth() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setNotice(key === 'ai' ? 'AI историјата е трајно избришана.' : 'Дневникот на активност е трајно избришан.');
      setConfirming(null);
      load();
    } catch (e) {
      setError(e.message || 'Бришењето не успеа.');
    } finally { setBusy(false); }
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header>
          <span className={styles.eyebrow}>Приватност</span>
          <h1 className={styles.title}>Мои податоци и доверливост</h1>
          <p className={styles.lead}>
            Што чуваме за вас, каде одат вашите прашања до AI и како сами да ги преземете или избришете податоците.
          </p>
        </header>

        <section className={styles.panel}>
          <h2 className={styles.panelHead}>Што се случува со вашите прашања до AI</h2>
          <ul className={styles.points}>
            <li><strong>Ние ги чуваме:</strong> вашите разговори со AI тимот, за да можете да продолжите каде што застанавте. Ги бришете кога сакате — поединечно, преку Корпа (30 дена) или сите одеднаш подолу.</li>
            <li><strong>Обработка:</strong> за да се одговори, прашањето и релевантните извадоци од законите се испраќаат до OpenAI преку нивниот деловен API. Според условите на OpenAI, податоците испратени преку API не се користат за тренирање на нивните модели.</li>
            <li><strong>Не продаваме и не споделуваме</strong> ваши податоци за рекламирање.</li>
            <li><strong>Професионалци:</strong> кога барате помош од адвокат или друг професионалец, тој гледа само анонимизирана верзија на вашите пораки (без имиња, ЕМБГ, адреси, контакти). Вашиот идентитет го гледа само ако вие одлучите да му го откриете.</li>
            <li><strong>AI меморија:</strong> AI памти кратки деловни факти за вас (пр. дејност, број на вработени) за подобри одговори. Ја гледате и уредувате во AI разговорот (🧠), или ја бришете подолу.</li>
            <li><strong>Дневник на активност:</strong> бележиме кои страници ги отворате, колку време и на што кликате — никогаш што пишувате во полињата. Се чува {summary?.activityRetentionDays || 90} дена, потоа автоматски се брише.</li>
          </ul>
          <p className={styles.small}>
            Целосните правила: <Link to="/terminal/privacy-policy">Политика за приватност</Link>. Прашања или барање за бришење на целата сметка: <a href="mailto:info@nexa.mk">info@nexa.mk</a>.
          </p>
        </section>

        {/* Hidden for now (user, 2026-10-27): counts + JSON export. Endpoints stay live.
        <section className={styles.panel}>
          <h2 className={styles.panelHead}>Што имаме за вас сега</h2>
          {!summary && !error && <div className={styles.muted}>Се вчитува…</div>}
          {summary && (
            <div className={styles.stats}>
              <Stat value={summary.conversations} label="AI разговори" />
              <Stat value={summary.trashed} label="во Корпа" />
              <Stat value={summary.memoryFacts + summary.agentMemories} label="AI меморија (записи)" />
              <Stat value={summary.activityEvents} label="записи за активност" />
              <Stat value={summary.proRequests} label="разговори со професионалци" />
            </div>
          )}
          <div className={styles.actions}>
            <button type="button" className={styles.btnPrimary} onClick={exportAll} disabled={busy}>
              Преземи ги сите мои податоци (JSON)
            </button>
          </div>
        </section>
        */}

        <section className={styles.panel}>
          <h2 className={styles.panelHead}>Бришење</h2>
          {Object.entries(ERASE).map(([key, item]) => (
            <div key={key} className={styles.eraseRow}>
              <div>
                <div className={styles.eraseTitle}>{item.title}</div>
                <div className={styles.small}>{item.body}</div>
              </div>
              {confirming === key ? (
                <div className={styles.confirm}>
                  <button type="button" className={styles.btnDanger} onClick={() => erase(key)} disabled={busy}>
                    Да, избриши трајно
                  </button>
                  <button type="button" className={styles.btnGhost} onClick={() => setConfirming(null)} disabled={busy}>
                    Откажи
                  </button>
                </div>
              ) : (
                <button type="button" className={styles.btnOutline} onClick={() => setConfirming(key)} disabled={busy}>
                  Избриши
                </button>
              )}
            </div>
          ))}
          <p className={styles.small}>
            Разговорите со професионалци се заеднички со другата страна, па не се бришат тука — пишете ни на info@nexa.mk.
          </p>
        </section>

        {error && <div className={styles.error} role="alert">{error}</div>}
        {notice && <div className={styles.notice} role="status">{notice}</div>}
      </div>
    </TerminalShell>
  );
}

// Unused while the counts/export panel is hidden.
// eslint-disable-next-line no-unused-vars
function Stat({ value, label }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statValue}>{value ?? '—'}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}
