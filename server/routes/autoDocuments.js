const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { requireVerifiedCompany } = require('../middleware/verificationMiddleware');
const { checkCredits, deductCredits } = require('../middleware/creditMiddleware');
const generate = require('../controllers/autoDocuments/consentForPersonalDataProcessingController');
const terminationAgreementController = require('../controllers/autoDocuments/terminationAgreementController');
const annualLeaveDecisionController = require('../controllers/autoDocuments/annualLeaveDecisionController');
const confirmationOfEmploymentController = require('../controllers/autoDocuments/confirmationOfEmploymentController');
const employmentAgreementController = require('../controllers/autoDocuments/employmentAgreementController');
const disciplinaryActionController = require('../controllers/autoDocuments/disciplinaryActionController');
const terminationDecisionDueToDurationController = require('../controllers/autoDocuments/terminationDecisionDueToDurationController');
const terminationWarningController = require('../controllers/autoDocuments/terminationWarningController');
const employmentAnnexController = require('../controllers/autoDocuments/employmentAnnexController');
const warningLetterController = require('../controllers/autoDocuments/warningLetterController');
const rentAgreementController = require('../controllers/autoDocuments/rentAgreementController');
const terminationPersonalReasonsController = require('../controllers/autoDocuments/terminationPersonalReasonsController');
const terminationDueToFaultController = require('../controllers/autoDocuments/terminationDueToFaultController');
const terminationByEmployeeRequestController = require('../controllers/autoDocuments/terminationByEmployeeRequestController');
const bonusPaymentController = require('../controllers/autoDocuments/bonusPaymentController');
const bonusDecisionController = require('../controllers/autoDocuments/bonusDecisionController');
const employeeDamagesStatementController = require('../controllers/autoDocuments/employeeDamagesStatementController');
const terminationDueToAgeLimitController = require('../controllers/autoDocuments/terminationDueToAgeLimitController');
const organizationActController = require('../controllers/autoDocuments/organizationActController');
const mandatoryBonusController = require('../controllers/autoDocuments/mandatoryBonusController');
const ndaController = require('../controllers/autoDocuments/ndaController');
const mediationAgreementController = require('../controllers/autoDocuments/mediationAgreementController');
const vehicleSalePurchaseAgreementController = require('../controllers/autoDocuments/vehicleSalePurchaseAgreementController');
const debtAssumptionAgreementController = require('../controllers/autoDocuments/debtAssumptionAgreementController');
const personalDataRulebookController = require('../controllers/autoDocuments/personalDataRulebookController');
const politicsForDataProtectionController = require('../controllers/autoDocuments/politicsForDataProtectionController');
const procedureForEstimationController = require('../controllers/autoDocuments/procedureForEstimationController');
const unpaidLeaveDecisionController = require('../controllers/autoDocuments/unpaidLeaveDecisionController');
const annualLeaveBonusDecisionController = require('../controllers/autoDocuments/annualLeaveBonusDecisionController');
const deathCompensationDecisionController = require('../controllers/autoDocuments/deathCompensationDecisionController');
const gdprCompanyPoliticsController = require('../controllers/autoDocuments/gdprCompanyPoliticsController');
const cashRegisterMaximumDecisionController = require('../controllers/autoDocuments/cashRegisterMaximumDecisionController');
const invoiceSigningAuthorizationController = require('../controllers/autoDocuments/invoiceSigningAuthorizationController');
const writeOffDecisionController = require('../controllers/autoDocuments/writeOffDecisionController');
const dividendPaymentDecisionController = require('../controllers/autoDocuments/dividendPaymentDecisionController');
const annualAccountsAdoptionController = require('../controllers/autoDocuments/annualAccountsAdoptionController');
const saasAgreementController = require('../controllers/autoDocuments/saasAgreementController');
const employeeStockPurchasePlanController = require('../controllers/autoDocuments/employeeStockPurchasePlanController');
const masterServicesAgreementController = require('../controllers/autoDocuments/masterServicesAgreementController');
const servicesContractController = require('../controllers/autoDocuments/servicesContractController');

// Consent for Personal Data Processing
router.post('/consent-for-personal-data', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), generate);

// Politics for Data Protection (Политика за заштита на лични податоци)
router.post('/politics-for-data-protection', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), politicsForDataProtectionController);

// Procedure for Estimation (Процедура за проценка на влијанието врз заштитата на личните податоци)
router.post('/procedure-for-estimation', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), procedureForEstimationController);

// GDPR Company Politics (Политика за администрирање со правата на субјектите на персонални податоци)
router.post('/gdpr-company-politics', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), gdprCompanyPoliticsController);

// Employment
// Confirmation of Employment (Потврда за вработување)
router.post('/confirmation-of-employment', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), confirmationOfEmploymentController);

// Death Compensation Decision (Одлука за исплата на надомест во случај на смрт на член на семејно домаќинство)
router.post('/death-compensation-decision', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), deathCompensationDecisionController);

// Termination Agreement (Спогодба за престанок на работен однос)
router.post('/termination-agreement', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), terminationAgreementController);

// Annual Leave Decision (Решение за годишен одмор)
router.post('/annual-leave-decision', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), annualLeaveDecisionController);

// Unpaid Leave Decision (Одлука за неплатено отсуство)
router.post('/unpaid-leave-decision', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), unpaidLeaveDecisionController);

// Annual Leave Bonus Decision (Одлука за исплата на регрес за годишен одмор)
router.post('/annual-leave-bonus', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), annualLeaveBonusDecisionController);

// Employment Agreement (Договор за вработување)
router.post('/employment-agreement', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), employmentAgreementController);

// Disciplinary Action (Дисциплинска мерка)
router.post('/disciplinary-action', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), disciplinaryActionController);

// Termination Decision Due to Duration (Одлука за престанок поради истек на времето)
router.post('/termination-decision-due-to-duration', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), terminationDecisionDueToDurationController);

// Termination Warning (Предупредување пред откажување на договор за вработување)
router.post('/termination-warning', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), terminationWarningController);

// Employment Annex (Анекс на договор за вработување)
router.post('/employment-annex', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), employmentAnnexController);

// Warning Letter to Employee (Опомена до вработен)
router.post('/warning-letter', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), warningLetterController);

// Termination Decision Due to Personal Reasons (Одлука за престанок поради лични причини)
router.post('/termination-personal-reasons', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), terminationPersonalReasonsController);

// Termination Decision Due to Fault by Employee (Одлука за престанок поради вина на работникот)
router.post('/termination-due-to-fault', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), terminationDueToFaultController);

// Termination by Employee Request (Решение за престанок по барање на работникот)
router.post('/termination-by-employee-request', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), terminationByEmployeeRequestController);

// Bonus Payment Decision (Одлука за бонус плаќање)
router.post('/bonus-payment', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), bonusPaymentController);

// Bonus Decision (Одлука за бонус)
router.post('/bonus-decision', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), bonusDecisionController);

// Employee Damages Statement (Изјава за согласност за намалување на плата поради предизвикана штета)
router.post('/employee-damages-statement', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), employeeDamagesStatementController);

// Termination Due to Age Limit (Решение за престанок поради возраст)
router.post('/termination-due-to-age-limit', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), terminationDueToAgeLimitController);

// Organization Act (Акт за систематизација на работните места)
router.post('/organization-act', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), organizationActController);

// Mandatory Bonus - Multi Document (Задолжителен бонус - Мултидокумент)
router.post('/mandatory-bonus', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), mandatoryBonusController);

// Contracts
// Rent Agreement (Договор за закуп на недвижен имот)
router.post('/rent-agreement', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), rentAgreementController);

// NDA (Договор за доверливост на информации)
router.post('/nda', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), ndaController);

// Mediation Agreement (Договор за посредување)
router.post('/mediation-agreement', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), mediationAgreementController);

// Vehicle Sale-Purchase Agreement (Договор за продажба-купување на возило)
router.post('/vehicle-sale-purchase-agreement', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), vehicleSalePurchaseAgreementController);

// Debt Assumption Agreement (Договор за преземање на долг)
router.post('/debt-assumption-agreement', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), debtAssumptionAgreementController);

// SaaS Agreement (Договор за софтвер како услуга)
router.post('/saas-agreement', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), saasAgreementController);

// Services Contract (Договор за услуги)
router.post('/services-contract', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), servicesContractController);

// Rulebooks
// Business Secret Rulebook (Правилник за заштита на деловна тајна)
router.post('/business-secret-rulebook', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), personalDataRulebookController);

// Accounting Documents
// Cash Register Maximum Decision (Одлука за благајнички максимум)
router.post('/cash-register-maximum-decision', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), cashRegisterMaximumDecisionController);

// Invoice Signing Authorization (Овластување за потпишување фактури)
router.post('/invoice-signing-authorization', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), invoiceSigningAuthorizationController);

// Write-off Decision (Одлука за отпис)
router.post('/write-off-decision', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), writeOffDecisionController);

// Dividend Payment Decision (Одлука за исплата на дивиденда)
router.post('/dividend-payment-decision', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), dividendPaymentDecisionController);

// Annual Accounts Adoption Decision (Одлука за усвојување на годишната сметка)
router.post('/annual-accounts-adoption', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), annualAccountsAdoptionController);

// Other Business Documents
// Employee Stock Purchase Plan (План за купување акции од страна на вработени)
router.post('/employee-stock-purchase-plan', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), employeeStockPurchasePlanController);

// Master Services Agreement (Рамковен договор за услуги)
router.post('/master-services-agreement', authenticateJWT, requireVerifiedCompany, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), masterServicesAgreementController);

// Add more document routes here as needed

module.exports = router; 