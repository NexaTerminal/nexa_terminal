# Automated Document Generation System - Complete Guide

This guide provides comprehensive instructions for understanding, maintaining, and creating new automated documents in the Nexa Terminal system.

## 🏗️ **System Architecture Overview**

The document automation system follows a **3-tier architecture**:
1. **Frontend (React)** - User input forms and preview
2. **Backend (Express.js)** - Business logic and document generation
3. **Document Templates (DOCX.js)** - Word document creation

## 📋 **Data Flow Process**

### **Step 1: User Input (Frontend)**
```
User fills form → Validation → API call with formData
```

### **Step 2: Backend Processing**
```
Route → Controller → Template → DOCX Generation → File Download
```

### **Step 3: Document Generation**
```
Template Function → Document Structure → Binary Buffer → Client Download
```

## 🗂️ **Folder Structure**

```
/client/src/pages/terminal/documents/
├── employment/
│   ├── ConfirmationOfEmploymentPage.js
│   ├── AnnualLeaveDecisionPage.js
│   └── TerminationAgreementPage.js
├── personalDataProtection/
│   └── ConsentForPersonalDataProcessingPage.js
└── index.js

/server/controllers/autoDocuments/
├── confirmationOfEmploymentController.js
├── annualLeaveDecisionController.js
├── terminationAgreementController.js
└── consentForPersonalDataProcessingController.js

/server/document_templates/
├── employment/
│   ├── confirmationOfEmployment.js
│   ├── annualLeaveDecision.js
│   └── terminationAgreement.js
├── personalDataProtection/
│   └── consentForPersonalDataProcessing.js
└── source_documents/ (Legal reference documents)

/server/routes/
└── autoDocuments.js (Route definitions)
```

## 🔍 **Detailed Component Analysis**

### **Frontend Page Component Pattern**

**File:** `/client/src/pages/terminal/documents/employment/ConfirmationOfEmploymentPage.js`

#### **Key Features:**
- **Authentication Check:** Uses `useAuth()` context
- **Form State Management:** `useState` for form data, validation, and loading states
- **Validation System:** Client-side validation with error messaging
- **API Integration:** CSRF-protected API calls with JWT authentication
- **File Download:** Blob handling for DOCX file downloads
- **Preview Integration:** Real-time document preview via `DocumentPreview` component

#### **Form Data Structure:**
```javascript
const [formData, setFormData] = useState({
  employeeName: "",
  employeePIN: "",
  employeeAddress: "",
  // Additional fields based on document type
});
```

#### **API Call Pattern:**
```javascript
const response = await fetch(`${apiUrl}/auto-documents/confirmation-of-employment`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "X-CSRF-Token": csrfToken,
  },
  body: JSON.stringify({ formData }),
});
```

#### **File Download Mechanism:**
```javascript
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `Document_Name.docx`;
document.body.appendChild(a);
a.click();
```

### **Backend Controller Pattern**

**File:** `/server/controllers/autoDocuments/confirmationOfEmploymentController.js`

#### **Controller Structure:**
```javascript
async function generate(req, res) {
  try {
    // 1. Extract data from request
    const { formData } = req.body;
    const user = req.user; // From JWT middleware
    
    // 2. Validate required data
    if (!user || !user.companyInfo) {
      return res.status(400).json({ message: 'User or company info missing.' });
    }
    
    // 3. Validate form data
    if (!formData || !formData.employeeName || !formData.employeePIN) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    
    // 4. Generate document
    const { doc } = generateConfirmationOfEmploymentDoc(formData, user, user.companyInfo);
    
    // 5. Convert to buffer and send
    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Disposition', 'attachment; filename="document.docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    // Error handling
    res.status(500).json({ message: 'Error generating document', error: error.message });
  }
}
```

#### **Data Sources Available:**
- **formData:** User input from frontend form
- **user:** Authenticated user object with profile information
- **user.companyInfo:** Company details (name, address, tax number, manager)

### **Document Template Pattern**

**File:** `/server/document_templates/employment/confirmationOfEmployment.js`

#### **Template Function Structure:**
```javascript
function generateConfirmationOfEmploymentDoc(formData, user, company) {
  // 1. Extract and format data
  const companyName = company?.companyName || '[Default Value]';
  const employeeName = formData.employeeName || '[Default Value]';
  const certificateDate = moment().format('DD.MM.YYYY');
  
  // 2. Build document structure
  const children = [
    new Paragraph({
      children: [new TextRun({ text: "Document content..." })],
      alignment: AlignmentType.JUSTIFIED,
    }),
    // Additional paragraphs...
  ];
  
  // 3. Create and return document
  const doc = new Document({ sections: [{ children }] });
  return { doc };
}
```

#### **DOCX.js Components Used:**
- **Document:** Root document container
- **Paragraph:** Text paragraphs with alignment
- **TextRun:** Formatted text runs (bold, italic, etc.)
- **Table:** Tabular data with rows and cells
- **AlignmentType:** Text alignment (LEFT, CENTER, RIGHT, JUSTIFIED)

### **Routing System**

**File:** `/server/routes/autoDocuments.js`

#### **Route Pattern:**
```javascript
// Authentication middleware applied to all routes
router.post('/document-endpoint', authenticateJWT, controllerFunction);
```

#### **Available Routes:**
- `/api/auto-documents/confirmation-of-employment`
- `/api/auto-documents/termination-agreement`
- `/api/auto-documents/annual-leave-decision`
- `/api/auto-documents/consent-for-personal-data`

## 🔧 **Creating New Automated Documents**

### **Step-by-Step Process:**

#### **1. Create Frontend Page Component**

**Location:** `/client/src/pages/terminal/documents/[category]/[DocumentName]Page.js`

**Template:**
```javascript
import React, { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import Header from "../../../../components/common/Header";
import Sidebar from "../../../../components/terminal/Sidebar";
import ProfileReminderBanner from "../../../../components/terminal/ProfileReminderBanner";
import DocumentPreview from "../../../../components/terminal/documents/DocumentPreview";
import styles from "../../../../styles/terminal/documents/DocumentGeneration.module.css";
import { getCSRFToken } from "../../../../services/csrfService";

const [DocumentName]Page = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    // Define form fields based on legal document requirements
    field1: "",
    field2: "",
    // ...
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    // Add validation logic based on required fields
    if (!formData.field1.trim())
      newErrors.field1 = "Ова поле е задолжително";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateDocument = async () => {
    if (!validateForm()) return;
    if (!currentUser) {
      alert("Мора да бидете најавени за да генерирате документ.");
      return;
    }
    setIsGenerating(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5001/api";
      const csrfToken = await getCSRFToken();
      const response = await fetch(
        `${apiUrl}/auto-documents/[endpoint-name]`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({ formData }),
        }
      );
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `[Document_Name].docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Неуспешно генерирање на документот: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Header isTerminal={true} />
      <div className={styles.dashboardLayout}>
        <Sidebar />
        <main className={styles.dashboardMain}>
          {!currentUser?.profileComplete && <ProfileReminderBanner />}
          <div className={styles.splitLayout}>
            {/* Form Section */}
            <div className={styles.formSection}>
              <div className={styles["form-sections"]}>
                <div className={styles["form-section"]}>
                  {/* Form fields based on legal document requirements */}
                  <div className={styles["form-group"]}>
                    <label htmlFor="field1">Field Label *</label>
                    <input
                      type="text"
                      id="field1"
                      value={formData.field1}
                      onChange={(e) => handleInputChange("field1", e.target.value)}
                      placeholder="пр. Example"
                      className={errors.field1 ? styles.error : ""}
                    />
                    {errors.field1 && (
                      <span className={styles["error-message"]}>{errors.field1}</span>
                    )}
                  </div>
                  {/* Additional form fields... */}
                </div>
              </div>
              <div className={styles["form-actions"]}>
                <button
                  onClick={handleGenerateDocument}
                  disabled={isGenerating}
                  className={styles["generate-btn"]}
                >
                  {isGenerating ? (
                    <>
                      <span className={styles["loading-spinner"]}></span>
                      Генерирање...
                    </>
                  ) : (
                    "Генерирај документ"
                  )}
                </button>
              </div>
            </div>
            {/* Preview Section */}
            <div className={styles.previewSection}>
              <DocumentPreview
                formData={formData}
                documentType="[documentTypeId]"
                currentStep={1}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default [DocumentName]Page;
```

#### **2. Create Backend Controller**

**Location:** `/server/controllers/autoDocuments/[documentName]Controller.js`

**Template:**
```javascript
const { Packer } = require('docx');
const generate[DocumentName]Doc = require('../../document_templates/[category]/[documentName]');

async function generate(req, res) {
  try {
    const { formData } = req.body;
    const user = req.user;
    
    // Validate user and company info
    if (!user || !user.companyInfo) {
      return res.status(400).json({ message: 'User or company info missing.' });
    }
    
    // Validate required form fields
    if (!formData || !formData.field1 || !formData.field2) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    
    // Generate document
    const { doc } = generate[DocumentName]Doc(formData, user, user.companyInfo);
    const buffer = await Packer.toBuffer(doc);
    
    // Set response headers and send file
    res.setHeader('Content-Disposition', 'attachment; filename="[document-name].docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error('Document generation error:', error);
    res.status(500).json({ message: 'Error generating document', error: error.message });
  }
}

module.exports = generate;
```

#### **3. Create Document Template**

**Location:** `/server/document_templates/[category]/[documentName].js`

**Template:**
```javascript
const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType } = require('docx');
const moment = require('moment');

function generate[DocumentName]Doc(formData, user, company) {
  // Extract and format data with fallbacks
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.address || '[Адреса на компанија]';
  const companyNumber = company?.taxNumber || '[ЕМБС/Единствен број на компанија]';
  const companyManager = company?.manager || '[Управител]';
  const documentDate = formData.documentDate ? moment(formData.documentDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  
  // Extract form data with fallbacks
  const field1 = formData.field1 || '[Default Value]';
  const field2 = formData.field2 || '[Default Value]';
  
  // Build document structure based on legal requirements
  const children = [
    new Paragraph({
      children: [
        new TextRun({
          text: "Document header text...",
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }), // Empty line
    new Paragraph({
      children: [
        new TextRun({ text: "DOCUMENT TITLE", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Subtitle", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "" }),
    // Document body paragraphs based on legal structure
    new Paragraph({
      children: [
        new TextRun({
          text: `Document content with ${field1} and ${field2} interpolated...`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    // Signature section
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({ text: "За Друштвото" }),
      ],
      alignment: AlignmentType.RIGHT,
    }),
    // Signature table
    new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "" })],
              borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } }
            }),
            new TableCell({
              children: [
                new Paragraph({ text: "_________________________", alignment: AlignmentType.RIGHT }),
                new Paragraph({ text: `${companyName} ${companyManager}`, alignment: AlignmentType.RIGHT }),
              ],
              borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } }
            }),
          ],
        }),
      ],
      width: { size: 100, type: 'pct' },
      borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } }
    })
  ];

  const doc = new Document({
    sections: [{ children }],
  });

  return { doc };
}

module.exports = generate[DocumentName]Doc;
```

#### **4. Add Route**

**In:** `/server/routes/autoDocuments.js`

```javascript
// Add controller import
const [documentName]Controller = require('../controllers/autoDocuments/[documentName]Controller');

// Add route
router.post('/[endpoint-name]', authenticateJWT, [documentName]Controller);
```

#### **5. Update Document Preview (Optional)**

**In:** `/client/src/components/terminal/documents/DocumentPreview.js`

```javascript
// Add document headline
const documentHeadlines = {
  // ... existing headlines
  [documentTypeId]: "DOCUMENT TITLE IN MACEDONIAN",
};
```

## 📝 **Legal Document Integration Process**

### **When Provided with Legal Document:**

1. **Analyze Legal Structure**
   - Identify required fields and data points
   - Note legal formatting requirements
   - Understand business logic and conditional content

2. **Map Form Fields**
   - Create form field structure matching legal requirements
   - Define validation rules for required fields
   - Plan conditional fields based on document logic

3. **Design Document Template**
   - Follow legal document structure exactly
   - Implement conditional paragraphs for different scenarios
   - Ensure proper legal language and formatting

4. **Test Integration**
   - Verify all form fields map correctly to document output
   - Test validation and error handling
   - Confirm document formatting matches legal requirements

## 🔒 **Security & Authentication**

### **Authentication Flow:**
1. **JWT Authentication:** All document endpoints require valid JWT token
2. **CSRF Protection:** Frontend includes CSRF token in requests
3. **User Context:** Controllers access authenticated user data
4. **Company Data:** User must have completed company profile

### **Data Validation:**
- **Frontend:** Client-side validation with immediate feedback
- **Backend:** Server-side validation of all required fields
- **Sanitization:** Input sanitization prevents malicious content

## 🎯 **Best Practices**

### **Frontend Development:**
- Use consistent form validation patterns
- Implement proper loading states and error handling
- Follow existing styling patterns from `DocumentGeneration.module.css`
- Include real-time document preview when possible

### **Backend Development:**
- Always validate user authentication and company data
- Provide clear error messages for debugging
- Follow consistent controller structure
- Include comprehensive error handling

### **Document Templates:**
- Use fallback values for all interpolated data
- Follow Macedonian legal document formatting standards
- Implement conditional content logic where needed
- Ensure proper table formatting for signatures

### **Testing:**
- Test with various user profiles and company configurations
- Verify document generation with missing optional fields
- Test file download functionality across browsers
- Validate document formatting in Microsoft Word

## 🔧 **Common Issues & Solutions**

### **File Download Issues:**
- Ensure proper MIME type headers
- Use blob handling for binary data
- Clean up object URLs after download

### **Template Formatting:**
- Use AlignmentType constants for consistent alignment
- Implement proper table borders (usually none for signature tables)
- Handle empty paragraphs for spacing

### **Data Integration:**
- Always provide fallback values for optional fields
- Format dates consistently using moment.js
- Validate company data completeness before generation

## 📚 **Dependencies & Libraries**

### **Frontend:**
- **React:** Component structure and state management
- **Moment.js:** Date formatting and manipulation
- **Fetch API:** HTTP requests for document generation

### **Backend:**
- **docx:** DOCX document creation and manipulation
- **moment:** Date formatting
- **express:** Route handling and middleware

### **Key DOCX.js Classes:**
- **Document:** Root document container
- **Paragraph:** Text paragraphs with formatting
- **TextRun:** Formatted text with bold, italic, etc.
- **Table/TableRow/TableCell:** Tabular data structures
- **AlignmentType:** Text alignment enumeration

---

This comprehensive guide provides everything needed to understand, maintain, and extend the automated document generation system. Use it as a reference when creating new document types or debugging existing functionality.