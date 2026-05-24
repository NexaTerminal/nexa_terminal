import { useTranslation } from 'react-i18next';
import styles from './EcosystemMap.module.css';

const PROPERTIES = [
  { key: 'terminal', href: '/about#terminal', external: false },
  { key: 'samodaprasham', href: 'https://samodaprasham.mk', external: true },
  { key: 'immigration', href: 'https://immigration.mk', external: true },
  { key: 'citizenship', href: 'https://macedoniancitizenship.mk', external: true },
  { key: 'company', href: 'https://company.nexa.mk', external: true },
  { key: 'iplaw', href: 'https://iplaw.nexa.mk', external: true },
  { key: 'topics', href: 'https://topics.nexa.mk', external: true }
];

export default function EcosystemMap() {
  const { t } = useTranslation('website');
  return (
    <div className={styles.grid}>
      {PROPERTIES.map(p => {
        const Tag = p.external ? 'a' : 'a';
        const props = p.external
          ? { href: p.href, rel: 'noopener' }
          : { href: p.href };
        return (
          <Tag key={p.key} {...props} className={styles.tile}>
            <div className={styles.tileName}>{t(`ecosystem.${p.key}.name`)}</div>
            <div className={styles.tileDesc}>{t(`ecosystem.${p.key}.desc`)}</div>
          </Tag>
        );
      })}
    </div>
  );
}
