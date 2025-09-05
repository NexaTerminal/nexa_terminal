# 📄 Automated Document Generation System

## Current Structure

### Overview
The Nexa Terminal automated document generation system creates professional legal documents based on user input and templates.

### Architecture

#### **Backend Components**
- **Controllers**: Located in `server/controllers/autoDocuments/`
  - `annualLeaveDecisionController.js`
  - `confirmationOfEmploymentController.js` 
  - `employmentAgreementController.js`
  - `disciplinaryActionController.js`

- **Templates**: Located in `server/document_templates/employment/`
  - `annualLeaveDecision.js`
  - `confirmationOfEmployment.js`
  - `employmentAgreement.js`
  - `terminationAgreement.js`
  - `disciplinaryAction.js`

- **Routes**: `server/routes/autoDocuments.js`
  - All routes protected by `requireVerifiedCompany` middleware

#### **Frontend Components**
- **Pages**: Located in `client/src/pages/terminal/documents/employment/`
  - `AnnualLeaveDecisionPage.js`
  - `ConfirmationOfEmploymentPage.js`
  - `EmploymentAgreementPage.js`
  - `DisciplinaryActionPage.js`

### Current Workflow

1. **User Access**
   - User must have `isVerified: true` status
   - Protected by verification middleware

2. **Document Creation Process**
   ```
   User Input Form → Validation → Template Processing → Document Generation → Download/Preview
   ```

3. **Template System**
   - Uses dynamic field replacement
   - Supports company data injection
   - Generates professional formatted documents

### Critical System Requirements

#### **Company Data Source**
- **ALL documents MUST use `user.companyInfo` as the source for company data**
- Required fields: `companyName`, `address`, `taxNumber`, `role`
- Controllers must extract from `req.user.companyInfo`
- Pass company object as third parameter to templates

#### **Personal Identification Number (EMBG/PIN) Validation**
- **Macedonia's PIN is exactly 13 digits** - this is non-negotiable
- Pattern: `/^\d{13}$/` (exactly 13 consecutive digits)
- Frontend: `maxLength: 13`, `pattern: /^\d{13}$/`, `inputMode: 'numeric'`
- Backend: Use `validators.pin(value)` function
- Validation applies to ALL employee PIN/EMBG fields

### Document Types Available

| Document | Status | Controller | Template | Frontend |
|----------|--------|------------|----------|----------|
| Annual Leave Decision | ✅ Active | ✅ | ✅ | ✅ |
| Employment Agreement | ✅ Active | ✅ | ✅ | ✅ |
| Confirmation of Employment | ✅ Active | ✅ | ✅ | ✅ |
| Termination Agreement | ✅ Active | ❌ | ✅ | ❌ |
| Disciplinary Action | ✅ Active | ✅ | ✅ | ✅ |

## Improvement Goals

### 🎯 **Priority 1: Enhanced Template System**
- **Status**: 🔄 In Progress
- **Goal**: Implement advanced template engine with conditional logic
- **Tasks**:
  - [ ] Add conditional field rendering
  - [ ] Support for complex data structures
  - [ ] Multi-language template support

### 🎯 **Priority 2: Document Versioning**
- **Status**: ❌ Not Started
- **Goal**: Track document versions and changes
- **Tasks**:
  - [ ] Version control system for templates
  - [ ] Document history tracking
  - [ ] Change audit logs

### 🎯 **Priority 3: Advanced Field Types**
- **Status**: ❌ Not Started  
- **Goal**: Support rich field types (dates, signatures, calculations)
- **Tasks**:
  - [ ] Date picker integration
  - [ ] Digital signature fields
  - [ ] Automatic calculations
  - [ ] File attachment support

### 🎯 **Priority 4: Template Management UI**
- **Status**: ❌ Not Started
- **Goal**: Allow admins to create/edit templates via UI
- **Tasks**:
  - [ ] Template editor interface
  - [ ] Field management system
  - [ ] Template preview functionality
  - [ ] Template testing tools

### 🎯 **Priority 5: Export Options**
- **Status**: 🔄 Partial (PDF only)
- **Goal**: Multiple export formats and delivery methods
- **Tasks**:
  - [ ] Word document export
  - [ ] Email delivery integration
  - [ ] Cloud storage integration
  - [ ] Bulk document generation

## Technical Improvements Needed

### Performance
- [ ] Template caching system
- [ ] Lazy loading for large documents
- [ ] Background processing for complex documents

### Security
- [ ] Document access controls
- [ ] Sensitive data encryption
- [ ] Audit trail for document access

### User Experience
- [ ] Auto-save functionality
- [ ] Form validation improvements
- [ ] Progress indicators for long operations
- [ ] Mobile-responsive document forms

## Future Enhancements

### Integration Opportunities
- **Email System**: Automatic document delivery
- **Calendar System**: Deadline tracking for legal documents
- **Client Portal**: Allow clients to request documents
- **E-signature**: Integration with DocuSign/similar services

### Advanced Features
- **AI Assistance**: Smart field suggestions based on company data
- **Document Analytics**: Track most used templates and fields
- **Collaborative Editing**: Multiple users working on same document
- **Workflow Automation**: Approval processes for document generation

---

*Last Updated: January 2025*
*Next Review: March 2025*