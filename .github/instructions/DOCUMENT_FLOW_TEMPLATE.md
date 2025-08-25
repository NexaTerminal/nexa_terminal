# Automated Document Generation Flow: Universal Template (React Frontend to Node.js Backend)

This guide describes the **unified, reusable workflow** for automating document generation (docx) from a React frontend through a Node.js backend. It ensures:
- **Consistent variable names** across all documents
- **One universal live preview component** (`DocumentPreview.js`)
- **Consistent form, style, CORS, CSRF, and workflow** for all documents
- **Easy addition of new document types** by following this template

---

## 1. User Input & Live Preview (Frontend React Page)

### **User Action:**
- The user fills out a form with required fields (e.g., employeeName, employeeAddress, etc.) on a React page.
- As the user types, a **universal live preview** (`DocumentPreview.js`) renders below the form, showing how the final document will look (in HTML, styled to match the docx as closely as possible).
- On submit, the form data is collected into a `formData` object and sent to the backend.

### **Frontend Code Example**
- **File:** `client/src/pages/terminal/documents/<category>/<DocumentType>Page.js`
- **Live Preview:** Uses the universal `DocumentPreview.js` component, which receives `formData`, `documentType`, and company info as props.
- **Variable names:** Always use the same variable names for the same concepts (e.g., `employeeName`, `employeePIN`, `employeeAddress`, `endDate`, etc.).
- **Date fields:** Always formatted as `DD.MM.YYYY` using `moment.js`.

```jsx
<DocumentPreview
  formData={formData}
  documentType="terminationAgreement" // or other document type
  currentStep={1}
/>
```

---

## 2. API Request (Frontend to Backend)
- **Endpoint:**
  - The frontend sends a POST request to `/api/auto-documents/<document-type>`.
  - The request includes the `formData` and a JWT token for authentication.
  - CSRF token is included in the headers.

---

## 3. Backend Route (Express Router)
- **File:** `server/routes/autoDocuments.js`
- Each document type has its own route, e.g.:
```js
router.post('/termination-agreement', authenticateJWT, terminationAgreementController);
```
- All routes use the same CORS and CSRF middleware.

---

## 4. Backend Controller (Handles Request)
- **File:** `server/controllers/autoDocuments/<DocumentType>Controller.js`
- Receives `formData` and user info, validates required fields (using the same variable names as the frontend), and calls the template function.
- Returns the generated docx as a file download.

---

## 5. Document Template (Business Logic)
- **File:** `server/document_templates/<category>/<documentType>.js`
- Exports a function that receives `formData`, `user`, and `company` and returns a docx document.
- Uses the same variable names as the frontend and controller.
- All date fields are formatted as `DD.MM.YYYY` using `moment.js`.

---

## 6. Universal Live Preview (Frontend)
- **File:** `client/src/components/terminal/documents/DocumentPreview.js`
- **How it works:**
  - Receives `formData`, `company`, and `documentType` as props.
  - Dynamically displays the correct headline/title for the document based on `documentType`.
  - Only renders fields that are present and non-empty.
  - All date fields are formatted as `DD.MM.YYYY` using `moment.js`.
  - No document-specific preview code—**one function for all documents**.

---

## 7. Adding a New Automated Document Type

**For every new document:**
1. **Create the .md file** with the document content and required fields.
2. **Create a new backend template file** in `server/document_templates/<category>/<documentType>.js` using the same variable names.
3. **Create a new controller** in `server/controllers/autoDocuments/<DocumentType>Controller.js` that imports the template and handles the request.
4. **Add a new route** in `server/routes/autoDocuments.js` for the new document type.
5. **Create a new React page** in `client/src/pages/terminal/documents/<category>/<DocumentType>Page.js` for the form and POST logic, using the universal `DocumentPreview.js` for live preview.
6. **Use the same variable names** for all fields across frontend, backend, and preview.
7. **Test end-to-end.**

---

## 8. Best Practices
- **Variable names:** Always use the same names for the same concepts in all files.
- **Date formatting:** Always use `moment.js` and `DD.MM.YYYY` format.
- **Live preview:** Only one universal preview function; no per-document preview code.
- **Consistent workflow:** CORS, CSRF, form look, and style are the same for all documents.
- **Extensibility:** Adding a new document is just a matter of creating a new template, controller, route, and page, all following this guide.

---

## 9. Example Directory Structure

```
client/src/pages/terminal/documents/employment/TerminationAgreementPage.js
client/src/components/terminal/documents/DocumentPreview.js
server/routes/autoDocuments.js
server/controllers/autoDocuments/terminationAgreementController.js
server/document_templates/employment/terminationAgreement.js
```

---

**This template is the single source of truth for automating new documents. Always follow this guide for consistency and maintainability.** 