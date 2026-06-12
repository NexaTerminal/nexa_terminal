const multer = require('multer');
const mammoth = require('mammoth');
const { v4: uuidv4 } = require('uuid');
const { ChatOpenAI } = require('@langchain/openai');
const { analyzeAndSplit } = require('../../services/bilingualSplitter');
const DocumentStorageService = require('../../services/documentStorageService');
const { replaceInDocx } = require('../../services/docxInPlaceEditor');

/**
 * Company Act Extraction (Промени во фирма — режим „Прикачи постоен акт").
 *
 * Accepts the user's real incorporation act (.docx) — Изјава за основање (ДООЕЛ)
 * or Договор за основање (ДОО) — extracts the text and uses the LLM to return a
 * STRUCTURED snapshot of the current registered state. The frontend uses this to
 * pre-fill the form (editable values) and to reconcile conflicts against the
 * verified company profile.
 *
 * Phase 1: extraction + auto-fill + reconciliation. The articleMap is returned and
 * stashed for Phase 2 (in-place amendment of the user's actual act).
 *
 * Design notes (legal safety):
 *  - The LLM only LOCATES and EXTRACTS; it never rewrites legal text.
 *  - Everything returned is treated as an editable suggestion, never authoritative.
 *  - Identity numbers (ЕМБС/ЕДБ/ЕМБГ) are flagged for explicit confirmation.
 */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const lower = (file.originalname || '').toLowerCase();
    if (lower.endsWith('.docx') ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Поддржани се само .docx датотеки. Скенирани PDF не се поддржани во оваа верзија.'));
    }
  }
});

exports.uploadMiddleware = upload.single('act');

const SYSTEM_PROMPT = `Ти си асистент за анализа на македонски правни документи за деловна автоматизација.

Влез: текст на „Акт за основање" на друштво — Изјава за основање (ДООЕЛ, едно лице) или Договор за основање (ДОО, повеќе лица).

Задача: ИЗВЛЕЧИ ги податоците за ТЕКОВНАТА состојба и врати ИСКЛУЧИВО валиден JSON објект (без markdown, без објаснувања) со следната структура:

{
  "companyForm": "dooel" или "doo",
  "company": {
    "companyFullName": "полн назив",
    "companyShortName": "скратен назив",
    "companyForeignName": "назив во странство (латиница, ако постои)",
    "companyAddress": "адреса на седиште",
    "companyEMBS": "ЕМБС (7 цифри, ако постои)",
    "companyEDB": "ЕДБ (13 цифри, ако постои)",
    "companyCapitalEUR": "основна главнина во ЕУР (само бројка, пр. 5.000)",
    "companyContributionType": "паричен" или "непаричен",
    "companyActivityCode": "приоритетна шифра на дејност (пр. 70.22)",
    "companyActivityText": "опис на приоритетната дејност"
  },
  "shareholders": [
    {
      "name": "име и презиме или назив",
      "entityType": "physical" или "legal",
      "isForeign": "да" или "не",
      "citizenship": "државјанство/држава (само за странци)",
      "address": "адреса/седиште",
      "idType": "ЕМБГ" или "пасош" или "ЕМБС",
      "idNumber": "вредност на документот",
      "sharePercent": "процент на удел (само бројка)",
      "isAlsoManager": "да" или "не"
    }
  ],
  "managers": [
    { "name": "...", "isForeign": "да/не", "citizenship": "...", "address": "...", "idType": "ЕМБГ/пасош", "idNumber": "..." }
  ],
  "articleMap": [
    { "datum": "name" | "seat" | "manager" | "capital" | "shareholder" | "activity", "articleNumber": "3", "text": "точен текст на членот, дословно" }
  ]
}

Правила:
- Користи празен стринг "" за податок што не постои во документот. НЕ измислувај.
- ЕМБС е 7 цифри; ЕДБ и ЕМБГ се 13 цифри.
- За ДООЕЛ има точно еден содружник; за ДОО двајца или повеќе.
- articleMap.text мора да биде ДОСЛОВЕН текст од документот (заради подоцнежна измена) — не парафразирај.
- Ако документот е двојазичен, користи го САМО македонскиот дел.
- Врати САМО JSON.`;

exports.extractAct = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Не е прикачена датотека.' });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, error: 'AI извлекувањето е привремено недостапно (недостасува конфигурација).' });
    }

    // Keep only the Macedonian content for bilingual acts (fails safe to raw).
    let workingBuffer = req.file.buffer;
    try {
      const split = analyzeAndSplit(req.file.buffer);
      if (split && split.buffer) workingBuffer = split.buffer;
    } catch (e) {
      console.warn('[extract-act] bilingual split failed, using raw buffer:', e.message);
    }

    const { value: rawText } = await mammoth.extractRawText({ buffer: workingBuffer });
    if (!rawText || rawText.trim().length < 100) {
      return res.status(422).json({ success: false, error: 'Не можам да прочитам текст од документот. Проверете дали е валиден .docx (не скениран PDF).' });
    }

    // Acts run ~20 articles; cap to keep token usage modest.
    const truncated = rawText.slice(0, 14000);

    const chatModel = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    const response = await chatModel.invoke([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: truncated }
    ]);

    let extracted;
    try {
      const content = (response.content || '').toString().trim();
      const jsonStr = content.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      extracted = JSON.parse(jsonStr);
    } catch (e) {
      console.error('[extract-act] JSON parse failed:', e.message);
      return res.status(502).json({ success: false, error: 'AI не врати валиден резултат. Обидете се повторно или внесете ги податоците рачно.' });
    }

    // Light normalization / guards
    extracted.company = extracted.company || {};
    extracted.shareholders = Array.isArray(extracted.shareholders) ? extracted.shareholders : [];
    extracted.managers = Array.isArray(extracted.managers) ? extracted.managers : [];
    extracted.articleMap = Array.isArray(extracted.articleMap) ? extracted.articleMap : [];
    if (extracted.companyForm !== 'doo' && extracted.companyForm !== 'dooel') {
      extracted.companyForm = extracted.shareholders.length > 1 ? 'doo' : 'dooel';
    }

    // Persist the ORIGINAL act buffer so it can be amended in place at generate
    // time (Phase 2). Failure here is non-fatal — extraction still succeeds.
    let actId = null;
    try {
      const db = req.app.locals.db;
      if (db) {
        const storage = new DocumentStorageService(db);
        actId = (await storage.storeDocument(req.file.buffer, {
          fileName: `act-${Date.now()}.docx`,
          userId: req.user._id || req.user.id,
          documentType: 'companyActUpload',
          shareToken: uuidv4()
        })).toString();
      }
    } catch (e) {
      console.warn('[extract-act] could not persist act buffer:', e.message);
    }

    return res.json({ success: true, extracted, actId });
  } catch (err) {
    console.error('[extract-act] error:', err.message);
    return res.status(500).json({ success: false, error: 'Грешка при обработка на документот.' });
  }
};

/**
 * Builds the in-place text replacements for the amended act from the selected
 * changes. Phase 2 v1 covers the high-confidence value swaps where we have a
 * clean old→new pair that appears verbatim in the act: M1 (назив) and M2 (седиште).
 * Other modules' changes are reflected in the generated supporting documents.
 */
function buildActReplacements(formData) {
  const changes = Array.isArray(formData.changes) ? formData.changes : [];
  const reps = [];
  if (changes.includes('M1')) {
    if (formData.companyFullName && formData.newCompanyFullName) {
      reps.push({ find: formData.companyFullName, replace: formData.newCompanyFullName, label: 'Назив' });
    }
    if (formData.companyShortName && formData.newCompanyShortName) {
      reps.push({ find: formData.companyShortName, replace: formData.newCompanyShortName, label: 'Скратен назив' });
    }
    if (formData.companyForeignName && formData.newCompanyForeignName) {
      reps.push({ find: formData.companyForeignName, replace: formData.newCompanyForeignName, label: 'Назив во странство' });
    }
  }
  if (changes.includes('M2') && formData.companyAddress && formData.newSeatAddress) {
    reps.push({ find: formData.companyAddress, replace: formData.newSeatAddress, label: 'Седиште' });
  }
  return reps;
}

/**
 * Amend the user's uploaded act in place (preserving their formatting) and
 * return the edited .docx. Body: { actId, formData }.
 */
exports.amendAct = async (req, res) => {
  try {
    const { actId, formData } = req.body || {};
    if (!actId) return res.status(400).json({ success: false, error: 'Недостасува идентификатор на актот.' });
    if (!formData) return res.status(400).json({ success: false, error: 'Недостасуваат податоци.' });

    const replacements = buildActReplacements(formData);
    if (replacements.length === 0) {
      return res.status(422).json({ success: false, error: 'Нема промени што можат да се применат во актот (поддржани се промена на назив и седиште).' });
    }

    const db = req.app.locals.db;
    if (!db) return res.status(503).json({ success: false, error: 'Базата е недостапна.' });
    const storage = new DocumentStorageService(db);
    const original = await storage.retrieveDocument(actId);

    const { buffer, applied } = replaceInDocx(original, replacements);

    // Surface replacements whose old text wasn't found verbatim (user review).
    const unmatched = applied.filter((a) => !a.matched).map((a) => a.label);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="izmenet-akt.docx"');
    if (unmatched.length) res.setHeader('X-Unmatched', encodeURIComponent(unmatched.join(', ')));
    return res.send(buffer);
  } catch (err) {
    console.error('[amend-act] error:', err.message);
    return res.status(500).json({ success: false, error: 'Грешка при изменување на актот.' });
  }
};
