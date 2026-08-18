/**
 * One-line consent shown at the point of submission (cases, blog, topics),
 * replacing the heavy per-feature terms modal. Links to the general terms.
 */
export default function SubmitConsent({ style }) {
  return (
    <p style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.5, margin: '10px 0 0', ...style }}>
      Со поднесувањето се согласувате со{' '}
      <a href="/terminal/terms-conditions" target="_blank" rel="noopener noreferrer">општите услови и правила</a>.
    </p>
  );
}
