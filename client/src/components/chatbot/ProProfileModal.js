import React from 'react';
import styles from './ProProfileModal.module.css';

/**
 * Shows the assigned Pro's public profile (name, address, website, phone, email)
 * — whatever they filled in on their account. The user can always reach the Pro;
 * the Pro, meanwhile, only learns the user's identity if the user reveals it.
 */
const ProProfileModal = ({ profile, onClose }) => {
  if (!profile) return null;
  const rows = [
    ['Град', profile.city],
    ['Адреса', profile.address],
    ['Телефон', profile.phone],
    ['Е-пошта', profile.email],
    ['Лиценца', profile.license],
  ].filter(([, v]) => v);

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className={styles.close} onClick={onClose} aria-label="Затвори">×</button>
        <div className={styles.header}>
          <span className={styles.avatar}>🧑‍⚖️</span>
          <div>
            <div className={styles.name}>{profile.name || 'Професионалец'}</div>
            <div className={styles.role}>Правен професионалец</div>
          </div>
        </div>

        {rows.length > 0 ? (
          <dl className={styles.details}>
            {rows.map(([label, value]) => (
              <div className={styles.row} key={label}>
                <dt className={styles.dt}>{label}</dt>
                <dd className={styles.dd}>{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className={styles.empty}>Професионалецот сè уште нема внесено дополнителни податоци во профилот.</p>
        )}

        {profile.website && (
          <a className={styles.website} href={/^https?:\/\//.test(profile.website) ? profile.website : `https://${profile.website}`}
            target="_blank" rel="noopener noreferrer">
            Посети веб-страница →
          </a>
        )}
      </div>
    </div>
  );
};

export default ProProfileModal;
