# Comprehensive Testing Guide: All 38 Automated Documents

## Overview
This guide provides a systematic approach to testing all 38 automated document pages across all responsive breakpoints to ensure perfect mobile and desktop experiences.

## Testing Setup

### Prerequisites
1. Start the development server: `cd client && npm start`
2. Open Chrome DevTools (F12)
3. Enable Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M)

### Testing Breakpoints
Test each document at these screen widths:

| Breakpoint | Width | Device Type | Expected Behavior |
|-----------|-------|-------------|-------------------|
| Desktop XL | 1920px | Large desktop | Full layout, sidebar visible, form + preview side-by-side |
| Desktop L | 1440px | Desktop | Full layout, sidebar visible, form + preview side-by-side |
| Desktop M | 1280px | Small desktop | Full layout, sidebar visible, form + preview side-by-side |
| Tablet XL | 1200px | iPad Pro | Stacked layout begins, form above preview |
| Tablet L | 1024px | iPad | Sidebar hidden, hamburger menu visible, stacked layout |
| Mobile XL | 768px | Large phones | Mobile optimizations active, hamburger menu, stacked layout |
| Mobile L | 430px | iPhone 14 Pro | Full mobile mode, touch-optimized |
| Mobile M | 375px | iPhone SE | Small phone optimizations active |
| Mobile S | 360px | Android | Minimum width support, compact layout |

## Testing Checklist (Per Document)

### Layout Tests
- [ ] No sidebar overlap at any size
- [ ] Form and preview sections properly sized
- [ ] No horizontal scrolling at any width
- [ ] Proper spacing and padding throughout
- [ ] Elements don't overflow containers
- [ ] Stacked layout at ≤1200px (form above preview)
- [ ] Sidebar hidden at ≤1024px

### Mobile Menu Tests (≤1024px only)
- [ ] Hamburger button (☰) visible in top-left
- [ ] Hamburger button is 44x44px (touch-friendly)
- [ ] Clicking hamburger opens sidebar smoothly (slide from left)
- [ ] Semi-transparent overlay appears
- [ ] Clicking overlay closes menu
- [ ] Close button (×) visible inside sidebar
- [ ] Clicking close button (×) closes menu
- [ ] Clicking any menu item closes menu and navigates
- [ ] No layout shift when opening/closing menu

### Button Tests
- [ ] All buttons are 44px+ height (touch-friendly)
- [ ] Generate button is 44px+ height with min-width 120px
- [ ] Navigation buttons (Назад/Следно) are 44px+ height
- [ ] Buttons stack vertically on very small screens (<480px) if needed
- [ ] Proper spacing between buttons (12px minimum)
- [ ] Buttons are full-width on mobile (≤768px)
- [ ] Hover states work on desktop
- [ ] Active/pressed states work on mobile

### Form Input Tests
- [ ] All inputs are full-width on mobile
- [ ] Input height is 44px+ (touch-friendly)
- [ ] Font size is 16px+ (prevents iOS auto-zoom)
- [ ] Proper padding: 12px vertical, 16px horizontal
- [ ] Labels are 14px+ with proper line-height
- [ ] Adequate spacing between form groups (16px+)
- [ ] Error messages are visible and readable (13px+)
- [ ] Radio buttons/checkboxes are touch-friendly
- [ ] Select dropdowns work correctly on mobile
- [ ] Date pickers work correctly on mobile
- [ ] No input clipping or overflow

### Typography Tests
- [ ] Headings are readable: H2 (18px+), H3 (16px+)
- [ ] Body text is 14px+ on mobile
- [ ] Input text is 16px+ (prevents zoom)
- [ ] Proper line-height: 1.5-1.6 for body text
- [ ] Text doesn't overflow containers
- [ ] Long text wraps properly
- [ ] Heading hierarchy is clear

### Preview Section Tests
- [ ] Preview renders correctly
- [ ] Preview text wraps properly (no horizontal scroll)
- [ ] Preview font sizes are readable (14px+ body)
- [ ] Preview headings are properly sized (18px+)
- [ ] Line-height is adequate (1.6) for readability
- [ ] Preview boxes don't overflow
- [ ] Highlighted fields show correctly
- [ ] Fallback labels appear for empty fields

### Step Progress Tests (Multi-step documents)
- [ ] Step dots are visible and properly sized (10-12px)
- [ ] Adequate spacing between dots (12px+)
- [ ] Active/inactive states are clear
- [ ] Step progress doesn't overflow on mobile
- [ ] Touch-friendly on mobile

### Functional Tests
- [ ] Form validation works correctly
- [ ] Error messages appear below inputs
- [ ] Navigation between steps works (if multi-step)
- [ ] Document generation succeeds
- [ ] Preview updates in real-time
- [ ] Terms checkbox functions correctly
- [ ] Back button navigation works
- [ ] Browser refresh preserves form state (if applicable)

### Accessibility Tests
- [ ] Focus indicators are visible (2px outline)
- [ ] Keyboard navigation works (Tab/Shift+Tab)
- [ ] Screen reader labels present (aria-labels)
- [ ] Color contrast sufficient (WCAG AA)
- [ ] Touch targets are 44x44px minimum
- [ ] Error messages associated with inputs

## Documents to Test

### Employment/Labour Law (19 documents)
- [ ] 1. Employment Agreement (EmploymentAgreementPage)
- [ ] 2. Employment Annex (EmploymentAnnexPage)
- [ ] 3. Disciplinary Action (DisciplinaryActionPage)
- [ ] 4. Employee Damages Statement (EmployeeDamagesStatementPage)
- [ ] 5. Bonus Decision (BonusDecisionPage)
- [ ] 6. Bonus Payment (BonusPaymentPage)
- [ ] 7. Annual Leave Bonus (AnnualLeaveBonusDecisionPage)
- [ ] 8. Unpaid Leave Decision (UnpaidLeaveDecisionPage)
- [ ] 9. Termination Due to Fault (TerminationDueToFaultPage)
- [ ] 10. Termination Due to Duration (TerminationDecisionDueToDurationPage) **[REFACTORED]**
- [ ] 11. Termination Personal Reasons (TerminationPersonalReasonsPage)
- [ ] 12. Warning Letter (WarningLetterPage)
- [ ] 13. Confirmation of Employment (ConfirmationOfEmploymentPage)
- [ ] 14. Death Compensation (DeathCompensationDecisionPage)
- [ ] 15. Termination Warning (TerminationWarningPage)
- [ ] 16. Mandatory Bonus (MandatoryBonusPage)
- [ ] 17. Annual Leave Decision (AnnualLeaveDecisionPage)
- [ ] 18. Termination by Employee (TerminationByEmployeeRequestPage)
- [ ] 19. Termination Due to Age (TerminationDueToAgeLimitPage)
- [ ] 20. Termination Agreement (TerminationAgreementPage) **[REFACTORED]**

### Rulebooks (1 document)
- [ ] 1. Personal Data Rulebook (PersonalDataRulebookPage)

### Personal Data Protection (4 documents)
- [ ] 1. Data Protection Policy (PoliticsForDataProtectionPage) **[REFACTORED]**
- [ ] 2. DPIA Procedure (ProcedureForEstimationPage) **[REFACTORED]**
- [ ] 3. Consent for Data Processing (ConsentForPersonalDataProcessingPage) **[REFACTORED]**
- [ ] 4. GDPR Company Politics (GdprCompanyPoliticsPage)

### Contracts (5 documents)
- [ ] 1. NDA (NdaPage)
- [ ] 2. Rent Agreement (RentAgreementPage)
- [ ] 3. Mediation Agreement (MediationAgreementPage)
- [ ] 4. Debt Assumption Agreement (DebtAssumptionAgreementPage)
- [ ] 5. Annex Employment Agreement (AnnexEmploymentAgreement) **[REFACTORED]**

### Obligations (1 document)
- [ ] 1. Vehicle Sale/Purchase (VehicleSalePurchaseAgreementPage)

### Accounting (5 documents)
- [ ] 1. Cash Register Maximum (CashRegisterMaximumDecisionPage)
- [ ] 2. Invoice Signing Authorization (InvoiceSigningAuthorizationPage)
- [ ] 3. Write-Off Decision (WriteOffDecisionPage)
- [ ] 4. Dividend Payment (DividendPaymentDecisionPage)
- [ ] 5. Annual Accounts Adoption (AnnualAccountsAdoptionPage)

## Priority Testing Order

### Phase 1: Critical Documents (Refactored - Test First)
These documents were just refactored and need thorough testing:
1. TerminationAgreementPage
2. TerminationDecisionDueToDurationPage
3. ConsentForPersonalDataProcessingPage
4. PoliticsForDataProtectionPage
5. ProcedureForEstimationPage
6. AnnexEmploymentAgreement

### Phase 2: Representative Modern Documents (Spot Check)
Test 1-2 documents per category to verify CSS changes work:
- Employment: EmploymentAgreementPage (already tested), BonusDecisionPage
- Contracts: NdaPage, RentAgreementPage
- Accounting: WriteOffDecisionPage

### Phase 3: Remaining Modern Documents (Quick Check)
If representative samples pass, quickly verify:
- No horizontal scrolling
- Hamburger menu works
- Forms are touch-friendly
- No obvious layout issues

## How to Test Efficiently

### Desktop Testing (5 minutes per document)
1. Open document page at 1920px
2. Verify full layout, sidebar visible
3. Resize to 1280px, verify no issues
4. Check form inputs, buttons, preview

### Tablet Testing (5 minutes per document)
1. Switch to 1200px
2. Verify stacked layout (form above preview)
3. Switch to 1024px
4. Verify hamburger menu appears and works
5. Test menu open/close functionality

### Mobile Testing (5 minutes per document)
1. Switch to 768px
2. Verify all mobile optimizations active
3. Test touch targets (buttons 44px+)
4. Verify no horizontal scrolling
5. Switch to 375px
6. Verify compact layout works
7. Fill out form to test inputs
8. Test document generation

## Edge Case Testing

### Long Content Tests
- [ ] Very long employee names (50+ characters)
- [ ] Very long addresses (100+ characters)
- [ ] Large text in textareas
- [ ] Maximum form data

### Empty Data Tests
- [ ] Empty form submission (validation)
- [ ] Preview with no data (fallback labels)
- [ ] Missing required fields

### Navigation Tests
- [ ] Browser back button
- [ ] Direct URL access to document page
- [ ] Refresh during form filling
- [ ] Navigate away and return

### Landscape Orientation (Mobile)
- [ ] Test at 768x1024 (iPad landscape)
- [ ] Test at 812x375 (iPhone landscape)
- [ ] Verify layouts adapt correctly

## Issue Reporting Template

If you find issues, document them like this:

```
Document: [Document Name]
Breakpoint: [Width]px
Issue: [Description]
Expected: [What should happen]
Actual: [What actually happens]
Screenshot: [If applicable]
```

## Success Criteria

✅ All documents tested across all breakpoints
✅ No horizontal scrolling at any width
✅ Hamburger menu works on all documents
✅ All buttons are touch-friendly (44px+)
✅ All inputs are readable (16px+ font)
✅ Forms are fully functional on mobile
✅ Document generation works on all devices
✅ No layout overlap or broken UI
✅ Smooth transitions and animations

## Estimated Testing Time

- **Refactored Documents (6)**: 15 min each = 1.5 hours
- **Representative Samples (8)**: 15 min each = 2 hours
- **Quick Checks (24)**: 5 min each = 2 hours
- **Edge Cases**: 30 min
- **Total**: ~6 hours

## Quick Test Script

For rapid testing, use this script:
1. Open document
2. Resize: 1920 → 1280 → 1024 → 768 → 375
3. At 1024: Test hamburger menu (open/close)
4. At 375: Fill one input, check font size (should be 16px+)
5. Check: No horizontal scroll at any width
6. Next document

This reduces testing time to 3-5 minutes per document (~2-3 hours total).
