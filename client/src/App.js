import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { trackPageView } from './utils/analytics';

// Public pages
import Login from './pages/website/Login';
import ForgotPassword from './pages/website/ForgotPassword';
import ResetPassword from './pages/website/ResetPassword';
import ProviderResponse from './pages/public/ProviderResponse';
import Blog from './pages/website/Blog';
import BlogPost from './pages/website/BlogPost';
import TopicsPage from './pages/website/TopicsPage';
import ResidencePage from './pages/website/ResidencePage';
import EmploymentPage from './pages/website/EmploymentPage';
import TrademarkPage from './pages/website/TrademarkPage';
import CorporatePage from './pages/website/CorporatePage';

// Admin Pages
import EnhancedManageUsers from './pages/terminal/admin/EnhancedManageUsers';
import ManageServiceProviders from './pages/terminal/admin/ManageServiceProviders';
import ManageOfferRequests from './pages/terminal/admin/ManageOfferRequests';
import AddBlog from './pages/terminal/admin/AddBlog';

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
import FindLawyer from './pages/terminal/FindLawyer';
import Disclaimer from './pages/terminal/Disclaimer';
import EditProfile from './pages/terminal/EditProfile';
import User from './pages/terminal/User';
import AIChat from './pages/terminal/AIChat';
// import CompleteProfile from './pages/terminal/CompleteProfile';
import SimpleCompleteProfile from './pages/terminal/SimpleCompleteProfile';
import Education from './pages/terminal/Education';
import CourseDetail from './pages/terminal/CourseDetail';
import CourseLesson from './pages/terminal/CourseLesson';


import TerminationAgreementPage from './pages/terminal/documents/employment/TerminationAgreementPage';
import ConfirmationOfEmploymentPage from './pages/terminal/documents/employment/ConfirmationOfEmploymentPage';
import EmploymentAgreementPage from './pages/terminal/documents/employment/EmploymentAgreementPage';
import TerminationDecisionDueToDurationPage from './pages/terminal/documents/employment/TerminationDecisionDueToDurationPage';
import TerminationWarningPage from './pages/terminal/documents/employment/TerminationWarningPage';
import TerminationPersonalReasonsPage from './pages/terminal/documents/employment/TerminationPersonalReasonsPage';
import EmploymentAnnexPage from './pages/terminal/documents/employment/EmploymentAnnexPage';
import WarningLetterPage from './pages/terminal/documents/employment/WarningLetterPage';
import TerminationDueToFaultPage from './pages/terminal/documents/employment/TerminationDueToFaultPage';
import TerminationByEmployeeRequestPage from './pages/terminal/documents/employment/TerminationByEmployeeRequestPage';
import BonusPaymentPage from './pages/terminal/documents/employment/BonusPaymentPage';
import BonusDecisionPage from './pages/terminal/documents/employment/BonusDecisionPage';
import AnnualLeaveBonusDecisionPage from './pages/terminal/documents/employment/AnnualLeaveBonusDecisionPage';
import EmployeeDamagesStatementPage from './pages/terminal/documents/employment/EmployeeDamagesStatementPage';
import TerminationDueToAgeLimitPage from './pages/terminal/documents/employment/TerminationDueToAgeLimitPage';
import OrganizationActPage from './pages/terminal/documents/employment/OrganizationActPage';
import MandatoryBonusPage from './pages/terminal/documents/employment/MandatoryBonusPage';
import RentAgreementPage from './pages/terminal/documents/contracts/RentAgreementPage';
import NdaPage from './pages/terminal/documents/contracts/NdaPage';
import MediationAgreementPage from './pages/terminal/documents/contracts/MediationAgreementPage';
import DebtAssumptionAgreementPage from './pages/terminal/documents/contracts/DebtAssumptionAgreementPage';
import VehicleSalePurchaseAgreementPage from './pages/terminal/documents/obligations/VehicleSalePurchaseAgreementPage';
import PersonalDataRulebookPage from './pages/terminal/documents/rulebooks/PersonalDataRulebookPage';
import GeneralConditions from './pages/terminal/GeneralConditions';
import VerificationResult from './pages/VerificationResult';

// Document Pages
// Employment
// import AnnexEmploymentAgreement from './pages/terminal/documents/contracts/AnnexEmploymentAgreement';
import AnnualLeaveDecisionPage from './pages/terminal/documents/employment/AnnualLeaveDecisionPage';
import UnpaidLeaveDecisionPage from './pages/terminal/documents/employment/UnpaidLeaveDecisionPage';
import DisciplinaryActionPage from './pages/terminal/documents/employment/DisciplinaryActionPage';
// import ConfirmationOfEmploymentPage from './pages/terminal/documents/labourLaw/ConfirmationOfEmploymentPage'; // Assuming this component will be created

// import HealthAndSafetyPolicyPage from './pages/terminal/documents/healthAndSafety/HealthAndSafetyPolicyPage';
// import WorkplaceHarassmentPolicyPage from './pages/terminal/documents/healthAndSafety/WorkplaceHarassmentPolicyPage';
import ConsentForPersonalDataProcessingPage from './pages/terminal/documents/personalDataProtection/ConsentForPersonalDataProcessingPage';
import PoliticsForDataProtectionPage from './pages/terminal/documents/personalDataProtection/PoliticsForDataProtectionPage';
import ProcedureForEstimationPage from './pages/terminal/documents/personalDataProtection/ProcedureForEstimationPage';
// import GdprCompanyPoliticsPage from './pages/terminal/documents/personalDataProtection/GdprCompanyPoliticsPage';
// import PrivacyPolicyPage from './pages/terminal/documents/personalDataProtection/PrivacyPolicyPage';

// Verification Components
import CompanyVerificationSingle from './components/terminal/CompanyVerificationSingle';
import VerificationRequired from './components/common/VerificationRequired';

// Auth Components
import PrivateRoute from './components/common/PrivateRoute';
import AuthCallback from './components/common/AuthCallback';

import './styles/global.css';

function App() {
  const location = useLocation();

  // Track page views on route changes
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* <Route path="/complete-profile" element={<CompleteProfile />} /> */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/success" element={<AuthCallback />} />

      {/* Public Blog Routes (SEO-friendly, excerpt only) */}
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:id" element={<BlogPost />} />

      {/* Public SEO Pages */}
      <Route path="/topics" element={<TopicsPage />} />
      <Route path="/residence" element={<ResidencePage />} />
      <Route path="/employment" element={<EmploymentPage />} />
      <Route path="/trademark" element={<TrademarkPage />} />
      <Route path="/corporate" element={<CorporatePage />} />

      {/* Provider Response - Public (no auth required) */}
      <Route path="/provider-response/:token" element={<ProviderResponse />} />

      {/* Private Terminal Routes */}
      <Route path="/terminal" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/terminal/complete-profile" element={<PrivateRoute><CompanyVerificationSingle /></PrivateRoute>} />
      <Route path="/terminal/documents" element={<PrivateRoute><VerificationRequired feature="автоматизирано генерирање на документи"><DocumentGen /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/generator" element={<PrivateRoute><VerificationRequired feature="генерирање на документи"><DocumentGeneratorPage /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/:categoryId/:templateId" element={<PrivateRoute><VerificationRequired feature="генерирање на документи"><DocumentTemplateGenerator /></VerificationRequired></PrivateRoute>} />
      {/* <Route path="/terminal/documents/contracts/annex-employment-agreement" element={<PrivateRoute><AnnexEmploymentAgreement /></PrivateRoute>} /> */}
      <Route path="/terminal/documents/employment/annual-leave-decision" element={<PrivateRoute><VerificationRequired feature="годишни одмори"><AnnualLeaveDecisionPage /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/unpaid-leave-decision" element={<PrivateRoute><VerificationRequired feature="неплатени отсуства"><UnpaidLeaveDecisionPage /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/disciplinary-action" element={<PrivateRoute><VerificationRequired feature="дисциплински мерки"><DisciplinaryActionPage /></VerificationRequired></PrivateRoute>} />
      {/* <Route path="/terminal/documents/labourLaw/confirmation-of-employment" element={<PrivateRoute><ConfirmationOfEmploymentPage /></PrivateRoute>} /> */}
      {/* <Route path="/terminal/documents/health-safety/health-safety-policy" element={<PrivateRoute><HealthAndSafetyPolicyPage /></PrivateRoute>} /> */}
      {/* <Route path="/terminal/documents/health-safety/workplace-harassment-policy" element={<PrivateRoute><WorkplaceHarassmentPolicyPage /></PrivateRoute>} /> */}
      <Route path="/terminal/documents/personal-data-protection/consent-for-personal-data-processing" element={<PrivateRoute><ConsentForPersonalDataProcessingPage /></PrivateRoute>} />
      <Route path="/terminal/documents/personal-data-protection/politics-for-data-protection" element={<PrivateRoute><PoliticsForDataProtectionPage /></PrivateRoute>} />
      <Route path="/terminal/documents/personal-data-protection/procedure-for-estimation" element={<PrivateRoute><ProcedureForEstimationPage /></PrivateRoute>} />
      {/* <Route path="/terminal/documents/personal-data-protection/gdpr-company-politics" element={<PrivateRoute><GdprCompanyPoliticsPage /></PrivateRoute>} /> */}
      {/* <Route path="/terminal/documents/personal-data-protection/privacy-policy" element={<PrivateRoute><PrivacyPolicyPage /></PrivateRoute>} /> */}
      <Route path="/terminal/legal-screening" element={<PrivateRoute><VerificationRequired feature="правен здравствен преглед"><LegalScreening /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/ai-chat" element={<PrivateRoute><VerificationRequired feature="AI асистент"><AIChat /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/investments" element={<PrivateRoute><Investments /></PrivateRoute>} />
      <Route path="/terminal/investments/:investmentId" element={<PrivateRoute><InvestmentDetail /></PrivateRoute>} />
      <Route path="/terminal/blogs/:id" element={<PrivateRoute><BlogDetail /></PrivateRoute>} />
      <Route path="/terminal/contact" element={<PrivateRoute><Contact /></PrivateRoute>} />
      <Route path="/terminal/find-lawyer" element={<PrivateRoute><FindLawyer /></PrivateRoute>} />
      <Route path="/terminal/disclaimer" element={<PrivateRoute><Disclaimer /></PrivateRoute>} />
      <Route path="/terminal/profile" element={<PrivateRoute><EditProfile /></PrivateRoute>} />
      <Route path="/terminal/user" element={<PrivateRoute><User /></PrivateRoute>} />
      <Route path="/terminal/verification" element={<PrivateRoute><CompanyVerificationSingle /></PrivateRoute>} />
      <Route path="/terminal/education" element={<PrivateRoute><Education /></PrivateRoute>} />
      <Route path="/terminal/education/course/:courseId" element={<PrivateRoute><CourseDetail /></PrivateRoute>} />
      <Route path="/terminal/education/course/:courseId/lesson/:lessonId" element={<PrivateRoute><CourseLesson /></PrivateRoute>} />
      
      {/* General Conditions */}
      <Route path="/general-conditions" element={<GeneralConditions />} />
      
      {/* Verification Result */}
      <Route path="/verification-result" element={<VerificationResult />} />

      {/* Employment */}
      <Route path="/terminal/documents/employment/termination-agreement" element={<PrivateRoute><VerificationRequired feature="договор за престанок"><TerminationAgreementPage /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/confirmation-of-employment" element={<PrivateRoute><VerificationRequired feature="потврда за работа"><ConfirmationOfEmploymentPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/employment-agreement" element={<PrivateRoute><VerificationRequired feature="договор за работа"><EmploymentAgreementPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/termination-decision-due-to-duration" element={<PrivateRoute><VerificationRequired feature="одлука за престанок"><TerminationDecisionDueToDurationPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/termination-warning" element={<PrivateRoute><VerificationRequired feature="предупредување за откажување"><TerminationWarningPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/termination-personal-reasons" element={<PrivateRoute><VerificationRequired feature="одлука за престанок поради лични причини"><TerminationPersonalReasonsPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/employment-annex" element={<PrivateRoute><VerificationRequired feature="анекс на договор"><EmploymentAnnexPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/warning-letter" element={<PrivateRoute><VerificationRequired feature="опомена до вработен"><WarningLetterPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/termination-due-to-fault" element={<PrivateRoute><VerificationRequired feature="одлука за престанок поради вина"><TerminationDueToFaultPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/termination-by-employee-request" element={<PrivateRoute><VerificationRequired feature="решение за престанок по барање"><TerminationByEmployeeRequestPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/bonus-payment" element={<PrivateRoute><VerificationRequired feature="одлука за бонус плаќање"><BonusPaymentPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/bonus-decision" element={<PrivateRoute><VerificationRequired feature="одлука за бонус"><BonusDecisionPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/annual-leave-bonus-decision" element={<PrivateRoute><VerificationRequired feature="одлука за регрес за годишен одмор"><AnnualLeaveBonusDecisionPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/employee-damages-statement" element={<PrivateRoute><VerificationRequired feature="изјава за согласност за намалување на плата"><EmployeeDamagesStatementPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/termination-due-to-age-limit" element={<PrivateRoute><VerificationRequired feature="решение за престанок поради возраст"><TerminationDueToAgeLimitPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/organization-act" element={<PrivateRoute><VerificationRequired feature="акт за систематизација"><OrganizationActPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/mandatory-bonus" element={<PrivateRoute><VerificationRequired feature="регрес за годишен одмор"><MandatoryBonusPage/></VerificationRequired></PrivateRoute>} />

      {/* Contracts */}
      <Route path="/terminal/documents/contracts/rent-agreement" element={<PrivateRoute><VerificationRequired feature="договор за закуп"><RentAgreementPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/contracts/nda" element={<PrivateRoute><VerificationRequired feature="договор за доверливост"><NdaPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/contracts/mediation-agreement" element={<PrivateRoute><VerificationRequired feature="договор за посредување"><MediationAgreementPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/contracts/debt-assumption-agreement" element={<PrivateRoute><VerificationRequired feature="договор за преземање на долг"><DebtAssumptionAgreementPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/obligations/vehicle-sale-purchase-agreement" element={<PrivateRoute><VerificationRequired feature="договор за возила"><VehicleSalePurchaseAgreementPage/></VerificationRequired></PrivateRoute>} />

      {/* Rulebooks */}
      <Route path="/terminal/documents/rulebooks/personal-data-rulebook" element={<PrivateRoute><VerificationRequired feature="правилник за податоци"><PersonalDataRulebookPage/></VerificationRequired></PrivateRoute>} />
 
      {/* Admin Routes */}
      <Route path="/terminal/admin/blogs/add" element={<PrivateRoute><AddBlog /></PrivateRoute>} />
      <Route path="/terminal/admin/users" element={<PrivateRoute><EnhancedManageUsers /></PrivateRoute>} />
      <Route path="/terminal/admin/service-providers" element={<PrivateRoute><ManageServiceProviders /></PrivateRoute>} />
      <Route path="/terminal/admin/offer-requests" element={<PrivateRoute><ManageOfferRequests /></PrivateRoute>} />
    </Routes>
  );
}

export default App;