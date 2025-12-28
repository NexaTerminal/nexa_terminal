# SaaS Agreement - Quick Reference Card

## API Endpoint
```
POST /api/auto-documents/saas-agreement
```

## Frontend Route (to be added to routing)
```javascript
import SaasAgreementPage from './pages/terminal/documents/contracts/SaasAgreementPage';

// Add to router:
<Route path="/terminal/documents/contracts/saas-agreement" element={<SaasAgreementPage />} />
```

## Document Type ID
```javascript
documentType: 'saasAgreement'
```

## Form Fields Summary (27 total)

### Step 1: Basic Information (4 fields)
- agreementDate (required)
- effectiveDateType (required)
- specificEffectiveDate (conditional)
- userRole (required)

### Step 2: Other Party (8 fields - conditional based on role)
If user is "давател" (provider):
- clientName, clientAddress, clientTaxNumber, clientManager

If user is "клиент" (client):
- providerName, providerAddress, providerTaxNumber, providerManager

### Step 3: Service Description (3 fields)
- serviceName (required)
- serviceDescription (required)
- serviceURL (optional)

### Step 4: Financial Terms (6 fields)
- subscriptionFee (required)
- currency (required)
- includesVAT (checkbox)
- paymentDay (required)
- bankAccount (required)
- bankName (required)

### Step 5: Service Levels & Terms (6 fields)
- systemAvailability (default: 98%)
- supportHours (default: working hours)
- durationType (required)
- durationMonths (conditional)
- endDate (conditional)
- terminationNoticeDays (default: 30 days)

## Document Structure

### Main Sections (Членови)
1. Доделување на лиценца (License Grant)
2. Услуги на поддршка (Support Services)
3. Надоместоци и плаќање (Fees and Payment)
4. Нивоа на услуга (Service Levels)
5. Рокови и раскинување (Term and Termination)
6. Доверливост (Confidentiality)
7. Интелектуална сопственост (Intellectual Property)
8. Ограничување на одговорност (Limitation of Liability)
9. Виша сила (Force Majeure)
10. Целосен договор (Entire Agreement)
11. Измени и дополнувања (Amendments)
12. Применливо право (Governing Law)

## Default Values
```javascript
{
  effectiveDateType: 'датум на склучување',
  currency: 'денари',
  includesVAT: false,
  systemAvailability: '98',
  supportHours: 'работни часови',
  durationType: 'неопределено',
  terminationNoticeDays: '30'
}
```

## Live Preview Sentences
1. Датум на склучување
2. Улога на компанијата (давател/клиент)
3. Опис на услугата
4. Месечен надоместок и плаќање
5. Банкарски детали
6. SLA и поддршка
7. Времетраење и раскинување
8. Влегување во сила

## Validation Rules
- Required fields: 11 total
- Conditional required: 0 (all conditionals are optional)
- Optional fields: 16 total

## Testing Commands
```bash
# Check template exists
ls -l server/document_templates/contracts/saasAgreement.js

# Check controller exists
ls -l server/controllers/autoDocuments/saasAgreementController.js

# Check route integration
grep "saasAgreementController" server/routes/autoDocuments.js

# Check frontend config
ls -l client/src/config/documents/saasAgreement.js

# Check page component
ls -l client/src/pages/terminal/documents/contracts/SaasAgreementPage.js

# Check preview integration
grep "saasAgreement:" client/src/components/terminal/documents/DocumentPreview.js
```

## Common Issues & Solutions

### Issue: "Внатрешна грешка на серверот"
**Solution**: Check parameter order in template - must be `(formData, user, company)`

### Issue: Preview not showing
**Solution**: Verify documentType matches in config and DocumentPreview.js

### Issue: Conditional fields not appearing
**Solution**: Check condition function returns boolean based on formData

### Issue: Currency/date formatting incorrect
**Solution**: Ensure field names added to format arrays in getFieldValue()

## File Paths Reference
```
Backend:
├── server/document_templates/contracts/saasAgreement.js
├── server/controllers/autoDocuments/saasAgreementController.js
└── server/routes/autoDocuments.js (modified)

Frontend:
├── client/src/config/documents/saasAgreement.js
├── client/src/pages/terminal/documents/contracts/SaasAgreementPage.js
└── client/src/components/terminal/documents/DocumentPreview.js (modified)
```

## Credits Cost
1 credit per document generation

## Authentication Requirements
- JWT authentication required
- Company verification required (isVerified: true)
- Credit balance check (minimum 1 credit)

## Legal Framework
- Macedonian Law on Obligations and Contracts
- GDPR compliance
- International SaaS agreement standards
- Macedonian tax law (VAT)

---
Generated: 2025-12-28
Document Status: Production Ready ✅
