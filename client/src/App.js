import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { trackPageView } from './utils/analytics';

// Public pages
import Login from './pages/website/Login';
import Home from './pages/website/Home';
import Pricing from './pages/website/Pricing';
import ContactPublic from './pages/website/Contact';
import ForgotPassword from './pages/website/ForgotPassword';
import ResetPassword from './pages/website/ResetPassword';
import ProviderResponse from './pages/public/ProviderResponse';
import SharedDocument from './pages/public/SharedDocument';
import DocumentPreviewPage from './pages/public/DocumentPreviewPage';
import Blog from './pages/website/Blog';
import BlogPost from './pages/website/BlogPost';
import TopicsPage from './pages/website/TopicsPage';
import ResidencePage from './pages/website/ResidencePage';
import EmploymentPage from './pages/website/EmploymentPage';
import TrademarkPage from './pages/website/TrademarkPage';
import CorporatePage from './pages/website/CorporatePage';
import PrivacyPolicy from './pages/website/PrivacyPolicy';
import TermsAndConditions from './pages/website/TermsAndConditions';
import About from './pages/website/About';

// Admin Pages
import EnhancedManageUsers from './pages/terminal/admin/EnhancedManageUsers';
import ManageSubscriptions from './pages/terminal/admin/ManageSubscriptions';
import AllUsers from './pages/terminal/admin/AllUsers';
import Team from './pages/terminal/admin-user/Team';
import AdminUserDashboard from './pages/terminal/admin-user/Dashboard';
import LeadsInbox from './pages/terminal/admin-user/LeadsInbox';
import ChangePassword from './pages/terminal/ChangePassword';
import ManageLeads from './pages/terminal/admin/ManageLeads';
import ManageServiceProviders from './pages/terminal/admin/ManageServiceProviders';
import ManageOfferRequests from './pages/terminal/admin/ManageOfferRequests';
import ManageChatbot from './pages/terminal/admin/ManageChatbot';
import AddBlog from './pages/terminal/admin/AddBlog';
import ManageBlogs from './pages/terminal/admin/ManageBlogs';
import EditBlog from './pages/terminal/admin/EditBlog';
import ManageUpdates from './pages/terminal/admin/ManageUpdates';

// Nexa 3.0 stubs (prompts 05–06 wire the remaining real UX)
import BlogsPage from './pages/terminal/Blogs';
import LeadsPage from './pages/terminal/Leads';
import TopicsQAPage from './pages/terminal/TopicsQA';
import FairPage from './pages/terminal/Fair';
import SourcingRequestPage from './pages/terminal/SourcingRequest';
import FairBoothDetailPage from './pages/terminal/FairBoothDetail';
import FairModerationPage from './pages/terminal/admin/FairModeration';
import StancePreferencesPage from './pages/terminal/StancePreferences';
// AdminInquiriesPage from prompt 02 stub replaced by the real page in prompt 05.
// AdminTopicsWorklistPage from prompt 02 stub replaced by the real page in prompt 06.

// Nexa 3.0 · 04 — blog submission workflow
import SubmitBlogPage from './pages/terminal/SubmitBlog';
import MyBlogSubmissionsPage from './pages/terminal/MyBlogSubmissions';
import MyPublishedBlogsPage from './pages/terminal/MyPublishedBlogs';
import PendingBlogSubmissionsPage from './pages/terminal/admin/PendingBlogSubmissions';

// Nexa 3.0 · 05 — inquiry board (manual model)
import AdminInquiriesPage   from './pages/terminal/admin/AdminInquiries';
import AdminInquiryNewPage  from './pages/terminal/admin/AdminInquiryNew';
import AdminInquiryDetailPage from './pages/terminal/admin/AdminInquiryDetail';

// Nexa 3.0 · 06 — Topics Q&A authoring (Studio-only)
import AnswerTopicPage                  from './pages/terminal/AnswerTopic';
import AdminTopicsWorklistPage          from './pages/terminal/admin/AdminTopicsWorklist';
import AdminTopicsWorklistNewPage       from './pages/terminal/admin/AdminTopicsWorklistNew';
import AdminTopicsSubmissionsPage       from './pages/terminal/admin/AdminTopicsSubmissions';
import AdminTopicsSubmissionDetailPage  from './pages/terminal/admin/AdminTopicsSubmissionDetail';

// Terminal Pages
import Dashboard from './pages/terminal/Dashboard';
import DocumentGen from './pages/terminal/DocumentGen';
import DocumentGeneratorPage from './pages/DocumentGeneratorPage';
import DocumentTemplateGenerator from './pages/terminal/documents/DocumentTemplateGenerator';
import LegalScreening from './pages/terminal/LegalScreening';
import EmploymentQuestionnaire from './pages/terminal/lhc/EmploymentQuestionnaire';
import EmploymentReport from './pages/terminal/lhc/EmploymentReport';
import EmploymentPart1Questionnaire from './pages/terminal/lhc/EmploymentPart1Questionnaire';
import EmploymentPart1Report from './pages/terminal/lhc/EmploymentPart1Report';
import EmploymentPart2Questionnaire from './pages/terminal/lhc/EmploymentPart2Questionnaire';
import EmploymentPart2Report from './pages/terminal/lhc/EmploymentPart2Report';
import EmploymentPart3Questionnaire from './pages/terminal/lhc/EmploymentPart3Questionnaire';
import EmploymentPart3Report from './pages/terminal/lhc/EmploymentPart3Report';
import EmploymentPart4Questionnaire from './pages/terminal/lhc/EmploymentPart4Questionnaire';
import EmploymentPart4Report from './pages/terminal/lhc/EmploymentPart4Report';
import HealthAndSafetyQuestionnaire from './pages/terminal/lhc/HealthAndSafetyQuestionnaire';
import HealthAndSafetyReport from './pages/terminal/lhc/HealthAndSafetyReport';
import GDPRQuestionnaire from './pages/terminal/lhc/GDPRQuestionnaire';
import GDPRReport from './pages/terminal/lhc/GDPRReport';
import ArchivesQuestionnaire from './pages/terminal/lhc/ArchivesQuestionnaire';
import ArchivesReport from './pages/terminal/lhc/ArchivesReport';
import AdminProInvoices from './pages/terminal/admin/AdminProInvoices';
import GeneralQuestionnaire from './pages/terminal/lhc/GeneralQuestionnaire';
import GeneralReport from './pages/terminal/lhc/GeneralReport';
import MarketingQuestionnaire from './pages/terminal/mhc/MarketingQuestionnaire';
import MarketingReport from './pages/terminal/mhc/MarketingReport';
import CyberQuestionnaire from './pages/terminal/chc/CyberQuestionnaire';
import CyberReport from './pages/terminal/chc/CyberReport';
import HRQuestionnaire from './pages/terminal/hhc/HRQuestionnaire';
import HRReport from './pages/terminal/hhc/HRReport';
import Investments from './pages/terminal/Investments';
import InvestmentDetail from './pages/terminal/InvestmentDetail';
import Contact from './pages/terminal/Contact';
import FindLawyer from './pages/terminal/FindLawyer';
import Disclaimer from './pages/terminal/Disclaimer';
import TerminalPrivacyPolicy from './pages/terminal/PrivacyPolicy';
import TerminalTermsAndConditions from './pages/terminal/TermsAndConditions';
// EditProfile (/terminal/profile) removed — account settings live in the
// Header profile dropdown (Профил / Сметка / Сметководство / Лозинка).
import UserSubscription from './pages/terminal/UserSubscription';
import UserBilling      from './pages/terminal/UserBilling';
import AIChat from './pages/terminal/AIChat';
import MarketingAIChat from './pages/terminal/MarketingAIChat';
import ContractAnalysis from './pages/terminal/ContractAnalysis';
// import CompleteProfile from './pages/terminal/CompleteProfile';
import SimpleCompleteProfile from './pages/terminal/SimpleCompleteProfile';
import Education from './pages/terminal/Education';
import CourseDetail from './pages/terminal/CourseDetail';
import CourseLesson from './pages/terminal/CourseLesson';
import Credits from './pages/terminal/Credits';
import Invite from './pages/terminal/Invite';
import MyTemplates from './pages/terminal/MyTemplates';
import MyTemplateBuilder from './pages/terminal/MyTemplateBuilder';
import TemplateFormFill from './pages/terminal/TemplateFormFill';
import TemplateEdit from './pages/terminal/TemplateEdit';
import TemplateHistory from './pages/terminal/TemplateHistory';
import TemplateBulkGenerate from './pages/terminal/TemplateBulkGenerate';
import TemplateMarketplace from './pages/terminal/TemplateMarketplace';

// Marketing Pages
import Marketing from './pages/terminal/marketing/Marketing';
import MarketingPerformanceReportPage from './pages/terminal/marketing/MarketingPerformanceReportPage';

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
import SaasAgreementPage from './pages/terminal/documents/contracts/SaasAgreementPage';
import ServicesContractPage from './pages/terminal/documents/contracts/ServicesContractPage';
import LoanAgreementPage from './pages/terminal/documents/contracts/LoanAgreementPage';
import CompanyChangesPage from './pages/terminal/documents/centralRegister/CompanyChangesPage';
import CompanyFormationPage from './pages/terminal/documents/centralRegister/CompanyFormationPage';
import VehicleSalePurchaseAgreementPage from './pages/terminal/documents/obligations/VehicleSalePurchaseAgreementPage';
import PersonalDataRulebookPage from './pages/terminal/documents/rulebooks/PersonalDataRulebookPage';
import CashRegisterMaximumDecisionPage from './pages/terminal/documents/accounting/CashRegisterMaximumDecisionPage';
import InvoiceSigningAuthorizationPage from './pages/terminal/documents/accounting/InvoiceSigningAuthorizationPage';
import WriteOffDecisionPage from './pages/terminal/documents/accounting/WriteOffDecisionPage';
import DividendPaymentDecisionPage from './pages/terminal/documents/accounting/DividendPaymentDecisionPage';
import AnnualAccountsAdoptionPage from './pages/terminal/documents/accounting/AnnualAccountsAdoptionPage';
import EmployeeStockPurchasePlanPage from './pages/terminal/documents/other/EmployeeStockPurchasePlanPage';
import MasterServicesAgreementPage from './pages/terminal/documents/other/MasterServicesAgreementPage';
import WarningBeforeLawsuitPage from './pages/terminal/documents/other/WarningBeforeLawsuitPage';
import GeneralConditions from './pages/terminal/GeneralConditions';
import VerificationResult from './pages/VerificationResult';

// Document Pages
// Employment
// import AnnexEmploymentAgreement from './pages/terminal/documents/contracts/AnnexEmploymentAgreement';
import AnnualLeaveDecisionPage from './pages/terminal/documents/employment/AnnualLeaveDecisionPage';
import UnpaidLeaveDecisionPage from './pages/terminal/documents/employment/UnpaidLeaveDecisionPage';
import DisciplinaryActionPage from './pages/terminal/documents/employment/DisciplinaryActionPage';
import DeathCompensationDecisionPage from './pages/terminal/documents/employment/DeathCompensationDecisionPage';
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
import Redeem from './pages/Redeem';
import PromoRedeemWatcher from './components/PromoRedeemWatcher';

import './styles/global.css';

function App() {
  const location = useLocation();

  // Track page views on route changes
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return (
    <>
    <PromoRedeemWatcher />
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/redeem" element={<Redeem />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/contact" element={<ContactPublic />} />
      <Route path="/ecosystem" element={<About />} />
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

      {/* Public Legal Pages */}
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-conditions" element={<TermsAndConditions />} />
      <Route path="/about" element={<About />} />

      {/* Provider Response - Public (no auth required) */}
      <Route path="/provider-response/:token" element={<ProviderResponse />} />

      {/* Shared Document Viewer - Public (no auth required) */}
      <Route path="/shared/:shareToken" element={<SharedDocument />} />

      {/* Document Preview - Public (no auth required) */}
      <Route path="/preview/:documentType" element={<DocumentPreviewPage />} />

      {/* Private Terminal Routes */}
      <Route path="/terminal" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/terminal/complete-profile" element={<PrivateRoute><CompanyVerificationSingle /></PrivateRoute>} />
      <Route path="/terminal/documents" element={<PrivateRoute><VerificationRequired><DocumentGen /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/generator" element={<PrivateRoute><VerificationRequired><DocumentGeneratorPage /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/:categoryId/:templateId" element={<PrivateRoute><VerificationRequired><DocumentTemplateGenerator /></VerificationRequired></PrivateRoute>} />
      {/* <Route path="/terminal/documents/contracts/annex-employment-agreement" element={<PrivateRoute><AnnexEmploymentAgreement /></PrivateRoute>} /> */}
      <Route path="/terminal/documents/employment/annual-leave-decision" element={<PrivateRoute><VerificationRequired><AnnualLeaveDecisionPage /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/unpaid-leave-decision" element={<PrivateRoute><VerificationRequired><UnpaidLeaveDecisionPage /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/disciplinary-action" element={<PrivateRoute><VerificationRequired><DisciplinaryActionPage /></VerificationRequired></PrivateRoute>} />
      {/* <Route path="/terminal/documents/labourLaw/confirmation-of-employment" element={<PrivateRoute><ConfirmationOfEmploymentPage /></PrivateRoute>} /> */}
      {/* <Route path="/terminal/documents/health-safety/health-safety-policy" element={<PrivateRoute><HealthAndSafetyPolicyPage /></PrivateRoute>} /> */}
      {/* <Route path="/terminal/documents/health-safety/workplace-harassment-policy" element={<PrivateRoute><WorkplaceHarassmentPolicyPage /></PrivateRoute>} /> */}
      <Route path="/terminal/documents/personal-data-protection/consent-for-personal-data-processing" element={<PrivateRoute><ConsentForPersonalDataProcessingPage /></PrivateRoute>} />
      <Route path="/terminal/documents/personal-data-protection/politics-for-data-protection" element={<PrivateRoute><PoliticsForDataProtectionPage /></PrivateRoute>} />
      <Route path="/terminal/documents/personal-data-protection/procedure-for-estimation" element={<PrivateRoute><ProcedureForEstimationPage /></PrivateRoute>} />
      {/* <Route path="/terminal/documents/personal-data-protection/gdpr-company-politics" element={<PrivateRoute><GdprCompanyPoliticsPage /></PrivateRoute>} /> */}
      {/* <Route path="/terminal/documents/personal-data-protection/privacy-policy" element={<PrivateRoute><PrivacyPolicyPage /></PrivateRoute>} /> */}
      <Route path="/terminal/legal-screening" element={<PrivateRoute><VerificationRequired><LegalScreening /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/employment" element={<PrivateRoute><VerificationRequired><EmploymentQuestionnaire /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/employment/report/:id" element={<PrivateRoute><VerificationRequired><EmploymentReport /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/employment-part1" element={<PrivateRoute><VerificationRequired><EmploymentPart1Questionnaire /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/employment-part1/report/:id" element={<PrivateRoute><VerificationRequired><EmploymentPart1Report /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/employment-part2" element={<PrivateRoute><VerificationRequired><EmploymentPart2Questionnaire /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/employment-part2/report/:id" element={<PrivateRoute><VerificationRequired><EmploymentPart2Report /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/employment-part3" element={<PrivateRoute><VerificationRequired><EmploymentPart3Questionnaire /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/employment-part3/report/:id" element={<PrivateRoute><VerificationRequired><EmploymentPart3Report /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/employment-part4" element={<PrivateRoute><VerificationRequired><EmploymentPart4Questionnaire /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/employment-part4/report/:id" element={<PrivateRoute><VerificationRequired><EmploymentPart4Report /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/health-safety" element={<PrivateRoute><VerificationRequired><HealthAndSafetyQuestionnaire /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/health-safety/report/:id" element={<PrivateRoute><VerificationRequired><HealthAndSafetyReport /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/gdpr" element={<PrivateRoute><VerificationRequired><GDPRQuestionnaire /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/gdpr/report/:id" element={<PrivateRoute><VerificationRequired><GDPRReport /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/archives" element={<PrivateRoute><VerificationRequired><ArchivesQuestionnaire /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/archives/report/:id" element={<PrivateRoute><VerificationRequired><ArchivesReport /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/general" element={<PrivateRoute><VerificationRequired><GeneralQuestionnaire /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/legal-screening/general/report/:id" element={<PrivateRoute><VerificationRequired><GeneralReport /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/marketing-screening" element={<PrivateRoute><VerificationRequired><MarketingQuestionnaire /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/marketing-screening/report/:id" element={<PrivateRoute><VerificationRequired><MarketingReport /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/cyber-screening" element={<PrivateRoute><VerificationRequired><CyberQuestionnaire /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/cyber-screening/report/:id" element={<PrivateRoute><VerificationRequired><CyberReport /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/hr-screening" element={<PrivateRoute><VerificationRequired><HRQuestionnaire /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/hr-screening/report/:id" element={<PrivateRoute><VerificationRequired><HRReport /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/my-templates" element={<PrivateRoute><VerificationRequired><MyTemplates /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/my-templates/new" element={<PrivateRoute><VerificationRequired><MyTemplateBuilder /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/my-templates/:templateId/fill" element={<PrivateRoute><VerificationRequired><TemplateFormFill /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/my-templates/:templateId/edit" element={<PrivateRoute><VerificationRequired><TemplateEdit /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/my-templates/history" element={<PrivateRoute><VerificationRequired><TemplateHistory /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/my-templates/:templateId/bulk" element={<PrivateRoute><VerificationRequired><TemplateBulkGenerate /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/template-marketplace" element={<PrivateRoute><VerificationRequired><TemplateMarketplace /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/ai-chat" element={<PrivateRoute><VerificationRequired><AIChat /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/marketing-ai" element={<PrivateRoute><VerificationRequired><MarketingAIChat /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/contract-analysis" element={<PrivateRoute><VerificationRequired><ContractAnalysis /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/investments" element={<PrivateRoute><Investments /></PrivateRoute>} />
      <Route path="/terminal/investments/:investmentId" element={<PrivateRoute><InvestmentDetail /></PrivateRoute>} />
      <Route path="/terminal/contact" element={<PrivateRoute><Contact /></PrivateRoute>} />
      <Route path="/terminal/find-lawyer" element={<PrivateRoute><VerificationRequired><FindLawyer /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/disclaimer" element={<PrivateRoute><Disclaimer /></PrivateRoute>} />
      <Route path="/terminal/privacy-policy" element={<PrivateRoute><TerminalPrivacyPolicy /></PrivateRoute>} />
      <Route path="/terminal/terms-conditions" element={<PrivateRoute><TerminalTermsAndConditions /></PrivateRoute>} />
      {/* /terminal/user merged into /terminal/subscription (Сметка + Лозинка) */}
      <Route path="/terminal/user" element={<Navigate to="/terminal/subscription" replace />} />
      <Route path="/terminal/subscription" element={<PrivateRoute><UserSubscription /></PrivateRoute>} />
      <Route path="/terminal/billing"      element={<PrivateRoute><UserBilling /></PrivateRoute>} />
      <Route path="/terminal/verification" element={<PrivateRoute><CompanyVerificationSingle /></PrivateRoute>} />
      <Route path="/terminal/education" element={<PrivateRoute><VerificationRequired><Education /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/education/course/:courseId" element={<PrivateRoute><VerificationRequired><CourseDetail /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/education/course/:courseId/lesson/:lessonId" element={<PrivateRoute><VerificationRequired><CourseLesson /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/credits" element={<PrivateRoute><Credits /></PrivateRoute>} />
      <Route path="/terminal/invite" element={<PrivateRoute><Invite /></PrivateRoute>} />

      {/* Marketing Documents */}
      <Route path="/terminal/marketing" element={<PrivateRoute><VerificationRequired><Marketing /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/marketing/performance-report" element={<PrivateRoute><VerificationRequired><MarketingPerformanceReportPage /></VerificationRequired></PrivateRoute>} />

      {/* General Conditions */}
      <Route path="/general-conditions" element={<GeneralConditions />} />
      
      {/* Verification Result */}
      <Route path="/verification-result" element={<VerificationResult />} />

      {/* Employment */}
      <Route path="/terminal/documents/employment/termination-agreement" element={<PrivateRoute><VerificationRequired><TerminationAgreementPage /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/confirmation-of-employment" element={<PrivateRoute><VerificationRequired><ConfirmationOfEmploymentPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/employment-agreement" element={<PrivateRoute><VerificationRequired><EmploymentAgreementPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/termination-decision-due-to-duration" element={<PrivateRoute><VerificationRequired><TerminationDecisionDueToDurationPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/termination-warning" element={<PrivateRoute><VerificationRequired><TerminationWarningPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/termination-personal-reasons" element={<PrivateRoute><VerificationRequired><TerminationPersonalReasonsPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/employment-annex" element={<PrivateRoute><VerificationRequired><EmploymentAnnexPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/warning-letter" element={<PrivateRoute><VerificationRequired><WarningLetterPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/termination-due-to-fault" element={<PrivateRoute><VerificationRequired><TerminationDueToFaultPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/termination-by-employee-request" element={<PrivateRoute><VerificationRequired><TerminationByEmployeeRequestPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/bonus-payment" element={<PrivateRoute><VerificationRequired><BonusPaymentPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/bonus-decision" element={<PrivateRoute><VerificationRequired><BonusDecisionPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/annual-leave-bonus-decision" element={<PrivateRoute><VerificationRequired><AnnualLeaveBonusDecisionPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/employee-damages-statement" element={<PrivateRoute><VerificationRequired><EmployeeDamagesStatementPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/termination-due-to-age-limit" element={<PrivateRoute><VerificationRequired><TerminationDueToAgeLimitPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/organization-act" element={<PrivateRoute><VerificationRequired><OrganizationActPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/mandatory-bonus" element={<PrivateRoute><VerificationRequired><MandatoryBonusPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/employment/death-compensation-decision" element={<PrivateRoute><VerificationRequired><DeathCompensationDecisionPage/></VerificationRequired></PrivateRoute>} />

      {/* Contracts */}
      <Route path="/terminal/documents/contracts/rent-agreement" element={<PrivateRoute><VerificationRequired><RentAgreementPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/contracts/nda" element={<PrivateRoute><VerificationRequired><NdaPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/contracts/mediation-agreement" element={<PrivateRoute><VerificationRequired><MediationAgreementPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/contracts/debt-assumption-agreement" element={<PrivateRoute><VerificationRequired><DebtAssumptionAgreementPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/contracts/saas-agreement" element={<PrivateRoute><VerificationRequired><SaasAgreementPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/contracts/services-contract" element={<PrivateRoute><VerificationRequired><ServicesContractPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/contracts/loan-agreement" element={<PrivateRoute><VerificationRequired><LoanAgreementPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/obligations/vehicle-sale-purchase-agreement" element={<PrivateRoute><VerificationRequired><VehicleSalePurchaseAgreementPage/></VerificationRequired></PrivateRoute>} />

      {/* Rulebooks */}
      <Route path="/terminal/documents/rulebooks/personal-data-rulebook" element={<PrivateRoute><VerificationRequired><PersonalDataRulebookPage/></VerificationRequired></PrivateRoute>} />

      {/* Accounting Documents */}
      <Route path="/terminal/documents/accounting/cash-register-maximum-decision" element={<PrivateRoute><VerificationRequired><CashRegisterMaximumDecisionPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/accounting/invoice-signing-authorization" element={<PrivateRoute><VerificationRequired><InvoiceSigningAuthorizationPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/accounting/write-off-decision" element={<PrivateRoute><VerificationRequired><WriteOffDecisionPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/accounting/dividend-payment-decision" element={<PrivateRoute><VerificationRequired><DividendPaymentDecisionPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/accounting/annual-accounts-adoption" element={<PrivateRoute><VerificationRequired><AnnualAccountsAdoptionPage/></VerificationRequired></PrivateRoute>} />

      {/* Other Business Documents */}
      <Route path="/terminal/documents/other/employee-stock-purchase-plan" element={<PrivateRoute><VerificationRequired><EmployeeStockPurchasePlanPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/other/master-services-agreement" element={<PrivateRoute><VerificationRequired><MasterServicesAgreementPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/other/warning-before-lawsuit" element={<PrivateRoute><VerificationRequired><WarningBeforeLawsuitPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/central-register/company-changes" element={<PrivateRoute><VerificationRequired><CompanyChangesPage/></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/documents/central-register/company-formation" element={<PrivateRoute><VerificationRequired><CompanyFormationPage/></VerificationRequired></PrivateRoute>} />

      {/* Admin Routes */}
      <Route path="/terminal/admin/blogs" element={<PrivateRoute><ManageBlogs /></PrivateRoute>} />
      <Route path="/terminal/admin/blogs/add" element={<PrivateRoute><AddBlog /></PrivateRoute>} />
      <Route path="/terminal/admin/blogs/edit/:id" element={<PrivateRoute><EditBlog /></PrivateRoute>} />
      <Route path="/terminal/admin/updates" element={<PrivateRoute><ManageUpdates /></PrivateRoute>} />
      <Route path="/terminal/admin/users" element={<PrivateRoute><EnhancedManageUsers /></PrivateRoute>} />
      <Route path="/terminal/admin/subscriptions" element={<PrivateRoute><ManageSubscriptions /></PrivateRoute>} />
      <Route path="/terminal/admin/all-users" element={<PrivateRoute><AllUsers /></PrivateRoute>} />
      <Route path="/terminal/admin/pro-invoices" element={<PrivateRoute><AdminProInvoices /></PrivateRoute>} />
      <Route path="/terminal/team" element={<PrivateRoute><Team /></PrivateRoute>} />
      <Route path="/terminal/admin-user" element={<PrivateRoute><AdminUserDashboard /></PrivateRoute>} />
      <Route path="/terminal/admin-user/leads" element={<PrivateRoute><LeadsInbox /></PrivateRoute>} />
      <Route path="/terminal/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
      <Route path="/terminal/admin/leads" element={<PrivateRoute><ManageLeads /></PrivateRoute>} />
      <Route path="/terminal/admin/service-providers" element={<PrivateRoute><ManageServiceProviders /></PrivateRoute>} />
      <Route path="/terminal/admin/offer-requests" element={<PrivateRoute><ManageOfferRequests /></PrivateRoute>} />
      <Route path="/terminal/admin/chatbot" element={<PrivateRoute><ManageChatbot /></PrivateRoute>} />

      {/* Nexa 3.0 stubs */}
      <Route path="/terminal/blogs"                  element={<PrivateRoute><BlogsPage /></PrivateRoute>} />
      <Route path="/terminal/leads"                  element={<PrivateRoute><LeadsPage /></PrivateRoute>} />
      <Route path="/terminal/topics-qa"              element={<PrivateRoute><TopicsQAPage /></PrivateRoute>} />
      {/* Виртуелен саем — /admin before /:id */}
      <Route path="/terminal/fair"                   element={<PrivateRoute><FairPage /></PrivateRoute>} />
      <Route path="/terminal/sourcing"               element={<PrivateRoute><VerificationRequired><SourcingRequestPage /></VerificationRequired></PrivateRoute>} />
      <Route path="/terminal/admin/fair"             element={<PrivateRoute><FairModerationPage /></PrivateRoute>} />
      <Route path="/terminal/fair/:id"               element={<PrivateRoute><FairBoothDetailPage /></PrivateRoute>} />
      <Route path="/terminal/ai/stance"              element={<PrivateRoute><StancePreferencesPage /></PrivateRoute>} />
      <Route path="/terminal/admin/inquiries"        element={<PrivateRoute><AdminInquiriesPage /></PrivateRoute>} />

      {/* Nexa 3.0 · 04 — Blog submission workflow */}
      <Route path="/terminal/blogs/submit"           element={<PrivateRoute><SubmitBlogPage /></PrivateRoute>} />
      {/* Legacy sub-tabs merged into the unified /terminal/blogs hub */}
      <Route path="/terminal/blogs/my-submissions"   element={<Navigate to="/terminal/blogs" replace />} />
      <Route path="/terminal/blogs/published"        element={<Navigate to="/terminal/blogs" replace />} />
      <Route path="/terminal/admin/blogs/pending"    element={<PrivateRoute><PendingBlogSubmissionsPage /></PrivateRoute>} />

      {/* Nexa 3.0 · 05 — Inquiry Board (admin) */}
      <Route path="/terminal/admin/inquiries/new"    element={<PrivateRoute><AdminInquiryNewPage /></PrivateRoute>} />
      <Route path="/terminal/admin/inquiries/:id"    element={<PrivateRoute><AdminInquiryDetailPage /></PrivateRoute>} />

      {/* Nexa 3.0 · 06 — Topics Q&A authoring */}
      <Route path="/terminal/topics-qa/answer/:id"            element={<PrivateRoute><AnswerTopicPage /></PrivateRoute>} />
      <Route path="/terminal/admin/topics/worklist"           element={<PrivateRoute><AdminTopicsWorklistPage /></PrivateRoute>} />
      <Route path="/terminal/admin/topics/worklist/new"       element={<PrivateRoute><AdminTopicsWorklistNewPage /></PrivateRoute>} />
      <Route path="/terminal/admin/topics/submissions"        element={<PrivateRoute><AdminTopicsSubmissionsPage /></PrivateRoute>} />
      <Route path="/terminal/admin/topics/submissions/:id"    element={<PrivateRoute><AdminTopicsSubmissionDetailPage /></PrivateRoute>} />
    </Routes>
    </>
  );
}

export default App;