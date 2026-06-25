import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from './Dashboard.module.css';

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date) ? '—' : date.toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: '2-digit' });
};
const daysUntil = (d) => {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
};
const daysLabel = (n) => {
  if (n === 0) return 'денес';
  if (n === 1) return '1 ден';
  return `${n} денови`;
};
const PLAN_LABEL = {
  basic: 'Основен',
  pro:   'Про',
  // legacy
  standard: 'Основен',
  admin_5:  'Про',
  admin_10: 'Про',
  admin:    'Про'
};

export default function AdminUserDashboard() {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/admin-user/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setSummary(res.data.summary))
      .catch(err => setError(err.response?.data?.message || err.message));
  }, [token]);

  if (error) {
    return <TerminalShell><div className={styles.error}>{error}</div></TerminalShell>;
  }
  if (!summary) {
    return <TerminalShell><div className={styles.loading}>Се вчитува…</div></TerminalShell>;
  }

  const sub = summary.subscription || {};
  const dr = daysUntil(sub.endsAt);

  return (
    <TerminalShell>
      <div className={styles.page}>
          <div className={styles.header}>
            <h1>Преглед на фирмата</h1>
            <p>{summary.user.companyName || summary.user.fullName || summary.user.email}</p>
          </div>

          <div className={styles.tiles}>
            <Tile
              label="Достапни за земање"
              value={summary.leads.available ?? 0}
              hint={(summary.leads.available ?? 0) > 0 ? 'Прв што ќе земе — го добива' : 'Нема лиди во базенот моментално'}
              to="/terminal/admin-user/leads?tab=available"
              accent={(summary.leads.available ?? 0) > 0 ? 'warn' : 'blue'}
            />
            <Tile
              label="Мои отворени лиди"
              value={summary.leads.open}
              hint={summary.leads.contacted > 0 ? `${summary.leads.contacted} контактирани` : 'Чекаат акција'}
              to="/terminal/admin-user/leads"
              accent="blue"
            />
            <Tile
              label="Седишта"
              value={`${summary.seats.used} / ${summary.seats.limit}`}
              hint={summary.seats.used >= summary.seats.limit ? 'Достигнат лимит' : 'Покани уште тим'}
              to="/terminal/team"
              accent="ink"
            />
            <Tile
              label="Претплата"
              value={PLAN_LABEL[sub.plan] || (sub.plan || '—')}
              hint={dr !== null ? `Уште ${daysLabel(Math.max(0, dr))} · ${fmtDate(sub.endsAt)}` : sub.status || ''}
              to="/pricing"
              accent={dr !== null && dr <= 14 ? 'warn' : 'ok'}
            />
            <Tile
              label="Затворени (Добиени)"
              value={summary.leads.won}
              hint="Вкупно"
              accent="ok"
            />
          </div>

          <div className={styles.quicklinks}>
            <h3>Брзи акции</h3>
            <ul>
              <li><Link to="/terminal/admin-user/leads">Отвори ги лидите →</Link></li>
              <li><Link to="/terminal/team">Управувај со тимот →</Link></li>
              <li><Link to="/terminal/documents">Генерирај документ →</Link></li>
            </ul>
          </div>
      </div>
    </TerminalShell>
  );
}

function Tile({ label, value, hint, to, accent }) {
  const Card = to ? Link : 'div';
  return (
    <Card to={to} className={`${styles.tile} ${styles[`accent_${accent}`] || ''}`}>
      <div className={styles.tileLabel}>{label}</div>
      <div className={styles.tileValue}>{value}</div>
      <div className={styles.tileHint}>{hint}</div>
    </Card>
  );
}
