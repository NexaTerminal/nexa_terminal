import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Only Login page (now the main public page)
import Login from './pages/website/Login';

// Admin Pages
import AddInvestment from './pages/terminal/admin/AddInvestment';
import ManageUsers from './pages/terminal/admin/ManageUsers';
import AddBlog from './pages/terminal/admin/AddBlog';
import MarketingAdmin from './pages/terminal/admin/Marketing';

// Terminal Pages
import Dashboard from './pages/terminal/Dashboard';
import DocumentGen from './pages/terminal/DocumentGen';
import DocumentGeneratorPage from './pages/DocumentGeneratorPage';
import DocumentTemplateGenerator from './pages/terminal/documents/DocumentTemplateGenerator';
import LegalScreening from './pages/terminal/LegalScreening';
import Investments from './pages/terminal/Investments';
import InvestmentDetail from './pages/terminal/InvestmentDetail';
import BlogDetail from './pages/terminal/BlogDetail';
import Contact from './pages/terminal/Contact';
import EditProfile from './pages/terminal/EditProfile';
import User from './pages/terminal/User';
import AIChat from './pages/terminal/AIChat';
// import CompleteProfile from './pages/terminal/CompleteProfile';
import SimpleCompleteProfile from './pages/terminal/SimpleCompleteProfile';
import Education from './pages/terminal/Education';


import TerminationAgreementPage from './pages/terminal/documents/employment/TerminationAgreementPage';
import ConfirmationOfEmploymentPage from './pages/terminal/documents/employment/ConfirmationOfEmploymentPage';

// Document Pages
// Employment
// import AnnexEmploymentAgreement from './pages/terminal/documents/contracts/AnnexEmploymentAgreement';
// import AnnualLeaveDecisionPage from './pages/terminal/documents/labourLaw/AnnualLeaveDecisionPage'; // Assuming this component will be created
// import ConfirmationOfEmploymentPage from './pages/terminal/documents/labourLaw/ConfirmationOfEmploymentPage'; // Assuming this component will be created

// import HealthAndSafetyPolicyPage from './pages/terminal/documents/healthAndSafety/HealthAndSafetyPolicyPage';
// import WorkplaceHarassmentPolicyPage from './pages/terminal/documents/healthAndSafety/WorkplaceHarassmentPolicyPage';
import ConsentForPersonalDataProcessingPage from './pages/terminal/documents/personalDataProtection/ConsentForPersonalDataProcessingPage';
// import PrivacyPolicyPage from './pages/terminal/documents/personalDataProtection/PrivacyPolicyPage';

// Verification Components
import CompanyVerification from './components/terminal/CompanyVerification';
import AdminVerification from './components/terminal/AdminVerification';

// Auth Components
import PrivateRoute from './components/common/PrivateRoute';
import AuthCallback from './components/common/AuthCallback';

import './styles/global.css';

function App() {
  return (
    <Routes>
      {/* Public Routes - Only Login */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      {/* <Route path="/complete-profile" element={<CompleteProfile />} /> */}
      <Route path="/auth/success" element={<AuthCallback />} />

      {/* Private Terminal Routes */}
      <Route path="/terminal" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/terminal/complete-profile" element={<PrivateRoute><SimpleCompleteProfile /></PrivateRoute>} />
      <Route path="/terminal/documents" element={<PrivateRoute><DocumentGen /></PrivateRoute>} />
      <Route path="/terminal/documents/generator" element={<PrivateRoute><DocumentGeneratorPage /></PrivateRoute>} />
      <Route path="/terminal/documents/:categoryId/:templateId" element={<PrivateRoute><DocumentTemplateGenerator /></PrivateRoute>} />
      {/* <Route path="/terminal/documents/contracts/annex-employment-agreement" element={<PrivateRoute><AnnexEmploymentAgreement /></PrivateRoute>} />
      <Route path="/terminal/documents/employment/annual-leave-decision" element={<PrivateRoute><AnnualLeaveDecisionPage /></PrivateRoute>} />
      <Route path="/terminal/documents/labourLaw/confirmation-of-employment" element={<PrivateRoute><ConfirmationOfEmploymentPage /></PrivateRoute>} /> */}
      {/* <Route path="/terminal/documents/health-safety/health-safety-policy" element={<PrivateRoute><HealthAndSafetyPolicyPage /></PrivateRoute>} /> */}
      {/* <Route path="/terminal/documents/health-safety/workplace-harassment-policy" element={<PrivateRoute><WorkplaceHarassmentPolicyPage /></PrivateRoute>} /> */}
      <Route path="/terminal/documents/personal-data-protection/consent-for-personal-data-processing" element={<PrivateRoute><ConsentForPersonalDataProcessingPage /></PrivateRoute>} />
      {/* <Route path="/terminal/documents/personal-data-protection/privacy-policy" element={<PrivateRoute><PrivacyPolicyPage /></PrivateRoute>} /> */}
      <Route path="/terminal/legal-screening" element={<PrivateRoute><LegalScreening /></PrivateRoute>} />
      <Route path="/terminal/ai-chat" element={<PrivateRoute><AIChat /></PrivateRoute>} />
      <Route path="/terminal/investments" element={<PrivateRoute><Investments /></PrivateRoute>} />
      <Route path="/terminal/investments/:investmentId" element={<PrivateRoute><InvestmentDetail /></PrivateRoute>} />
      <Route path="/terminal/blogs/:id" element={<PrivateRoute><BlogDetail /></PrivateRoute>} />
      <Route path="/terminal/contact" element={<PrivateRoute><Contact /></PrivateRoute>} />
      <Route path="/terminal/profile" element={<PrivateRoute><EditProfile /></PrivateRoute>} />
      <Route path="/terminal/user" element={<PrivateRoute><User /></PrivateRoute>} />
      <Route path="/terminal/verification" element={<PrivateRoute><CompanyVerification /></PrivateRoute>} />
      <Route path="/terminal/education" element={<PrivateRoute><Education /></PrivateRoute>} />

      {/* Employment */}
      <Route path="/terminal/documents/employment/termination-agreement" element={<PrivateRoute><TerminationAgreementPage /></PrivateRoute>} />
      <Route path="/terminal/documents/employment/confirmation-of-employment" element={<PrivateRoute><ConfirmationOfEmploymentPage/></PrivateRoute>} />
 
      {/* Admin Routes */}
      <Route path="/terminal/admin/blogs/add" element={<PrivateRoute><AddBlog /></PrivateRoute>} />
      <Route path="/terminal/admin/investments/add" element={<PrivateRoute><AddInvestment /></PrivateRoute>} />
      <Route path="/terminal/admin/users" element={<PrivateRoute><ManageUsers /></PrivateRoute>} />
      <Route path="/terminal/admin/verification" element={<PrivateRoute><AdminVerification /></PrivateRoute>} />
      <Route path="/terminal/admin/marketing" element={<PrivateRoute><MarketingAdmin /></PrivateRoute>} />
    </Routes>
  );
}

export default App;