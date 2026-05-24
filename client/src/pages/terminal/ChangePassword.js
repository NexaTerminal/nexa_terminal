import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import styles from './ChangePassword.module.css';

const API = process.env.REACT_APP_API_URL || '/api';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { token, currentUser, setCurrentUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const mustChange = currentUser?.mustChangePassword === true;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      // Fetch CSRF token (the auth/change-password endpoint is CSRF-exempt via our updated list,
      // but other auth endpoints expect it — keep it consistent with the existing pattern).
      let csrfToken = null;
      try {
        const r = await fetch(`${API}/csrf-token`, { credentials: 'include' });
        if (r.ok) { const d = await r.json(); csrfToken = d.csrfToken; }
      } catch {}

      await axios.post(`${API}/auth/change-password`,
        { currentPassword, newPassword, confirmPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
          },
          withCredentials: true
        }
      );
      // Update local state so the modal/redirect goes away.
      if (setCurrentUser && currentUser) {
        setCurrentUser({ ...currentUser, mustChangePassword: false });
      }
      setDone(true);
      setTimeout(() => navigate('/terminal'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
        <h1 className={styles.title}>
          {mustChange ? 'Set a new password' : 'Change password'}
        </h1>
        {mustChange && (
          <p className={styles.subtitle}>
            You're using a temporary password. Please set your own to continue.
          </p>
        )}

        {done ? (
          <div className={styles.success}>✓ Password updated. Redirecting…</div>
        ) : (
          <form className={styles.form} onSubmit={submit}>
            <label>
              Current (temporary) password
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              New password
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.btnPrimary} disabled={busy}>
              {busy ? 'Saving…' : 'Save new password'}
            </button>
          </form>
        )}
      </div>
    </TerminalShell>
  );
}
