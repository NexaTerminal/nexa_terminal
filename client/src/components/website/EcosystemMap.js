import { useTranslation } from 'react-i18next';
import styles from './EcosystemMap.module.css';

const PROPERTIES = [
  {
    key: 'terminal', href: '/about#terminal', external: false,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
  },
  {
    key: 'samodaprasham', href: 'https://samodaprasham.mk', external: true,
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    key: 'immigration', href: 'https://immigration.mk', external: true,
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'
  },
  {
    key: 'citizenship', href: 'https://macedoniancitizenship.mk', external: true,
    image: 'https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?auto=format&fit=crop&w=1200&q=80'
  },
  {
    key: 'company', href: 'https://company.nexa.mk', external: true,
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    key: 'iplaw', href: 'https://iplaw.nexa.mk', external: true,
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80'
  },
  {
    key: 'topics', href: 'https://topics.nexa.mk', external: true,
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    key: 'osiguran', href: 'https://osiguran.nexa.mk', external: true,
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80'
  }
];

export default function EcosystemMap() {
  const { t } = useTranslation('website');
  return (
    <div className={styles.grid}>
      {PROPERTIES.map(p => {
        const props = p.external
          ? { href: p.href, rel: 'noopener', target: '_blank' }
          : { href: p.href };
        return (
          <a key={p.key} {...props} className={styles.tile}>
            <div className={styles.tileImage}>
              <img src={p.image} alt={t(`ecosystem.${p.key}.name`)} loading="lazy" />
            </div>
            <div className={styles.tileBody}>
              <div className={styles.tileName}>{t(`ecosystem.${p.key}.name`)}</div>
              <div className={styles.tileDesc}>{t(`ecosystem.${p.key}.desc`)}</div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
