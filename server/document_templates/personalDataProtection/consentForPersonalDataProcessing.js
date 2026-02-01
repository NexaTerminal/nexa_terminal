const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

function generateConsentForPersonalDataProcessingDoc(formData, user, company) {

    // Get data with fallbacks
    const companyName = company?.companyName || '[Име на компанија]';
    const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
    const companyNumber = company?.companyTaxNumber || company?.taxNumber || '[ЕМБС/Единствен број на компанија]';
    const companyManager = company?.companyManager || company?.manager || '[Управител]';
    const currentDate = moment().format('DD.MM.YYYY');

    // Get employee data from form
    const employeeName = formData?.employeeName || '[Име и презиме на вработен]';
    const employeeAddress = formData?.employeeAddress || '[Адреса на вработен]';
    const employeePosition = formData?.employeeWorkPosition || formData?.employeePosition || '[Позиција на работа]';

    // Build the children array first (needed for preview)
    const children = [
        // Title
        new Paragraph({
            children: [
                new TextRun({ text: "СОГЛАСНОСТ ЗА ОБРАБОТКА НА ЛИЧНИ ПОДАТОЦИ", bold: true, size: 28 })
            ],
            alignment: AlignmentType.CENTER,
        }),

        // Empty line
        new Paragraph({ text: "" }),

        // Company info
        new Paragraph({
            children: [
                new TextRun(`Контролор на збирката на лични податоци: ${companyName}, со седиште на ${companyAddress}.`)
            ],
            alignment: AlignmentType.JUSTIFIED,
        }),

        // Empty line
        new Paragraph({ text: "" }),

        // Employee statement
        new Paragraph({
            children: [
                new TextRun(`Јас, долупотпишаниот(ата) ${employeeName}, со адреса ${employeeAddress}, на позицијата ${employeePosition}, изјавувам дека сум согласен(а) моите лични податоци да се обработуваат од страна на ${companyName} за следните цели:`)
            ],
            alignment: AlignmentType.JUSTIFIED,
        }),

        // Empty line
        new Paragraph({ text: "" }),

        // Processing purposes
        new Paragraph({
            children: [
                new TextRun({ text: "Цели на обработка: ", bold: true }),
                new TextRun("Администрирање на вработените, водење на персонална евиденција, исполнување на законските обврски")
            ],
            alignment: AlignmentType.JUSTIFIED,
        }),

        // Data types
        new Paragraph({
            children: [
                new TextRun({ text: "Категории на лични податоци: ", bold: true }),
                new TextRun("Име и презиме, адреса, контакт телефон, е-маил адреса, позиција на работа")
            ],
            alignment: AlignmentType.JUSTIFIED,
        }),

        // Legal basis
        new Paragraph({
            children: [
                new TextRun({ text: "Правен основ: ", bold: true }),
                new TextRun("Согласност на субјектот на лични податоци согласно член 6(1)(а) од GDPR")
            ],
            alignment: AlignmentType.JUSTIFIED,
        }),

        // Retention period
        new Paragraph({
            children: [
                new TextRun({ text: "Рок на чување: ", bold: true }),
                new TextRun("5 години по престанок на работниот однос")
            ],
            alignment: AlignmentType.JUSTIFIED,
        }),

        // Empty line
        new Paragraph({ text: "" }),

        // Rights information
        new Paragraph({
            children: [
                new TextRun("Изјавувам дека сум запознаен(а) со моите права во однос на заштитата на личните податоци, вклучувајќи го правото на пристап, исправка, бришење, ограничување на обработката, право на преносливост на податоците и право на приговор, како и правото да ја повлечам оваа согласност во секое време.")
            ],
            alignment: AlignmentType.JUSTIFIED,
        }),

        // Empty line
        new Paragraph({ text: "" }),

        // Date
        new Paragraph({
            children: [
                new TextRun(`Датум: ${currentDate}`)
            ],
            alignment: AlignmentType.LEFT,
        }),

        // Empty line
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),

        // Signature section
        new Paragraph({
            children: [new TextRun("Субјект на лични податоци:")],
            alignment: AlignmentType.RIGHT,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
            children: [new TextRun("___________________________")],
            alignment: AlignmentType.RIGHT,
        }),

        new Paragraph({
            children: [new TextRun(`(${employeeName})`)],
            alignment: AlignmentType.RIGHT,
        }),
    ];

    // Create sections array (needed for preview)
    const sections = [{ children }];

    // Create document
    const doc = new Document({ sections });

    return {
        doc,
        sections,  // Return sections for preview functionality
        filenameSuffix: `Soglasnost_obrabotka_LP_${employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
    };
}

module.exports = generateConsentForPersonalDataProcessingDoc;
