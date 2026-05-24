import { useEffect } from 'react';
import PublicNavbarV2 from './PublicNavbarV2';
import PublicFooterV2 from './PublicFooterV2';
import '../../styles/website/brand.css';

export default function PublicLayout({ children }) {
  useEffect(() => {
    document.body.classList.add('nexa-public');
    return () => document.body.classList.remove('nexa-public');
  }, []);

  return (
    <>
      <a href="#main" className="nexa-skip">Skip to content</a>
      <PublicNavbarV2 />
      <main id="main">{children}</main>
      <PublicFooterV2 />
    </>
  );
}
