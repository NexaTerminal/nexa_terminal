// preview-provider.jsx — context stack for design-sync preview cards.
//
// Nexa's terminal components read auth (useAuth), language (useLanguage /
// react-i18next) and the router. Previews render outside the app, so this
// provider recreates that stack with a realistic verified-company stub user.
// Exported via cfg.extraEntries and named in cfg.provider.
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import '../client/.ds-dist/i18n/i18n.js'; // side-effect: init i18next (mk default)
import { LanguageProvider } from '../client/.ds-dist/contexts/LanguageContext.js';
import { AuthContext } from '../client/.ds-dist/contexts/AuthContext.js';

const noop = () => {};
const asyncNoop = async () => ({ success: true });

const stubUser = {
  _id: 'preview-user-id',
  username: 'demo.kompanija',
  email: 'kontakt@demo.mk',
  role: 'standard_user',
  plan: 'basic',
  isVerified: true,
  profileComplete: true,
  officialEmail: 'kontakt@demo.mk',
  subscription: { status: 'active', plan: 'basic' },
  companyInfo: {
    companyName: 'Демо Компанија ДООЕЛ Скопје',
    address: 'ул. Македонија бр. 12, Скопје',
    taxNumber: '4030026123456',
    role: 'Управител',
    industry: 'Информатички технологии',
    companySize: '10-50',
    website: 'https://demo.mk'
  }
};

const stubAuth = {
  currentUser: stubUser,
  token: 'preview-token',
  loading: false,
  isAuthenticated: true,
  setCurrentUser: noop,
  refreshUser: asyncNoop,
  updateProfile: asyncNoop,
  logout: noop,
  handleAuthError: noop,
  loginWithUsername: asyncNoop,
  loginWithToken: asyncNoop,
  registerSimple: asyncNoop,
  login: asyncNoop,
  register: asyncNoop
};

export function PreviewProvider({ children }) {
  return (
    <MemoryRouter initialEntries={['/terminal']}>
      <AuthContext.Provider value={stubAuth}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}
