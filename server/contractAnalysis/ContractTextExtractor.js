const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_WORDS = 50000;

class ContractTextExtractor {
  async extract(buffer, mimetype, originalName = '') {
    if (!buffer || buffer.length === 0) {
      throw new ExtractionError('EMPTY_FILE', 'Прикачената датотека е празна.');
    }
    if (buffer.length > MAX_BYTES) {
      throw new ExtractionError('FILE_TOO_LARGE', 'Датотеката е поголема од 10MB.');
    }

    const kind = this._detectKind(mimetype, originalName);
    let text;
    try {
      if (kind === 'pdf') {
        const result = await pdfParse(buffer);
        text = result.text || '';
      } else if (kind === 'docx') {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value || '';
      } else {
        throw new ExtractionError('UNSUPPORTED_FORMAT', 'Поддржани се само .docx и .pdf датотеки.');
      }
    } catch (err) {
      if (err instanceof ExtractionError) throw err;
      throw new ExtractionError('PARSE_FAILED', 'Не успеавме да го прочитаме документот. Проверете дали е валиден.');
    }

    const cleaned = this._normalize(text);
    const wordCount = cleaned ? cleaned.split(/\s+/).length : 0;

    if (wordCount < 50) {
      throw new ExtractionError(
        'TOO_LITTLE_TEXT',
        kind === 'pdf'
          ? 'Документот изгледа како скенирана PDF датотека или не содржи текст. Прикачете .docx или текстуален PDF.'
          : 'Документот не содржи доволно текст за анализа.'
      );
    }

    if (wordCount > MAX_WORDS) {
      throw new ExtractionError(
        'TOO_MUCH_TEXT',
        `Договорот има ${wordCount} зборови. Максимумот е ${MAX_WORDS}. Прикачете пократок документ.`
      );
    }

    return { text: cleaned, wordCount, kind };
  }

  _detectKind(mimetype, name) {
    const lower = (name || '').toLowerCase();
    if (mimetype === 'application/pdf' || lower.endsWith('.pdf')) return 'pdf';
    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      lower.endsWith('.docx')
    ) {
      return 'docx';
    }
    return null;
  }

  _normalize(raw) {
    return raw
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

class ExtractionError extends Error {
  constructor(code, userMessage) {
    super(userMessage);
    this.code = code;
    this.userMessage = userMessage;
  }
}

module.exports = { ContractTextExtractor: new ContractTextExtractor(), ExtractionError, MAX_BYTES, MAX_WORDS };
