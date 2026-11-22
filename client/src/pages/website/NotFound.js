import { Link } from 'react-router-dom';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import styles from './Services.module.css';

/** Catch-all for unknown URLs — noindex so soft-404s never get indexed. */
export default function NotFound() {
  const isMk = (i18n.language || 'mk') === 'mk';
  return (
    <PublicLayout>
      <SEOHelmet title={isMk ? 'Страницата не е пронајдена · Nexa' : 'Page not found · Nexa'} canonical="/" noIndex />
      <div className={`nexa-container ${styles.notFound}`}>
        <h1>404</h1>
        <p>{isMk ? 'Страницата што ја барате не постои или е преместена.' : 'The page you are looking for does not exist or has moved.'}</p>
        <p><Link to="/">{isMk ? 'Почетна' : 'Home'}</Link> · <Link to="/uslugi">{isMk ? 'Услуги' : 'Services'}</Link></p>
      </div>
    </PublicLayout>
  );
}
