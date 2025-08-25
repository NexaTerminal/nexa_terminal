const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType } = require('docx');
const moment = require('moment');

// Simple date formatting function
const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('mk-MK');
};

function generateConsentForPersonalDataProcessingDoc(formData, user, company) {

    // Get data with fallbacks
    const companyName = company?.companyName || '[Име на компанија]';
    const companyAddress = company?.address || '[Адреса на компанија]';
    const companyNumber = company?.taxNumber || '[ЕМБС/Единствен број на компанија]';
    const companyManager = company?.manager || '[Управител]';
    const currentDate = moment().format('DD.MM.YYYY');

    // Create the simplest possible document with minimal formatting
    const doc = new Document({
        sections: [{
            children: [
                // Title - just text, no special formatting
                new Paragraph({
                    children: [
                        new TextRun("СОГЛАСНОСТ ЗА ОБРАБОТКА НА ЛИЧНИ ПОДАТОЦИ")
                    ]
                }),
                
                // Empty line
                new Paragraph({
                    children: [new TextRun("")]
                }),
                
                // Company info
                new Paragraph({
                    children: [
                        new TextRun(`Контролор на збирката на лични податоци: ${companyName}, со седиште на ${companyAddress}.`)
                    ]
                }),
                
                // Empty line
                new Paragraph({
                    children: [new TextRun("")]
                }),
                
                // Employee statement
                new Paragraph({
                    children: [
                        new TextRun(`Јас, долупотпишаниот(ата) ${employeeName}, со адреса ${employeeAddress}, на позицијата ${employeePosition}, изјавувам дека сум согласен(а) моите лични податоци да се обработуваат од страна на ${companyName} за следните цели:`)
                    ]
                }),
                
                // Empty line
                new Paragraph({
                    children: [new TextRun("")]
                }),
                
                // Processing purposes
                new Paragraph({
                    children: [
                        new TextRun("Цели на обработка: Администрирање на вработените, водење на персонална евиденција, исполнување на законските обврски")
                    ]
                }),
                
                // Data types
                new Paragraph({
                    children: [
                        new TextRun("Категории на лични податоци: Име и презиме, адреса, контакт телефон, е-маил адреса, позиција на работа")
                    ]
                }),
                
                // Legal basis
                new Paragraph({
                    children: [
                        new TextRun("Правен основ: Согласност на субјектот на лични податоци согласно член 6(1)(а) од GDPR")
                    ]
                }),
                
                // Retention period
                new Paragraph({
                    children: [
                        new TextRun("Рок на чување: 5 години по престанок на работниот однос")
                    ]
                }),
                
                // Empty line
                new Paragraph({
                    children: [new TextRun("")]
                }),
                
                // Rights information
                new Paragraph({
                    children: [
                        new TextRun("Изјавувам дека сум запознаен(а) со моите права во однос на заштитата на личните податоци, вклучувајќи го правото на пристап, исправка, бришење, ограничување на обработката, право на преносливост на податоците и право на приговор, како и правото да ја повлечам оваа согласност во секое време.")
                    ]
                }),
                
                // Empty line
                new Paragraph({
                    children: [new TextRun("")]
                }),
                
                // Date
                new Paragraph({
                    children: [
                        new TextRun(`Датум: ${currentDate}`)
                    ]
                }),
                
                // Empty line
                new Paragraph({
                    children: [new TextRun("")]
                }),
                
                // Signature section
                new Paragraph({
                    children: [new TextRun("Субјект на лични податоци:")]
                }),
                
                new Paragraph({
                    children: [new TextRun("")]
                }),
                
                new Paragraph({
                    children: [new TextRun("___________________________")]
                }),
                
                new Paragraph({
                    children: [new TextRun(`(${employeeName})`)]
                }),
            ]
        }]
    });

    return {
        doc,
        filenameSuffix: `Soglasnost_obrabotka_LP_${employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
    };
}

module.exports = generateConsentForPersonalDataProcessingDoc;
