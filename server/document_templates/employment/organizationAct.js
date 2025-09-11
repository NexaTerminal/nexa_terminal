const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const fs = require("fs");
const path = require("path");
const moment = require("moment");

/**
 * Generate Organizational Systematization Act Document
 * Creates a comprehensive organizational structure document with hierarchical positions
 * 
 * @param {Object} formData - Form data containing positions and document details
 * @param {Object} user - User information  
 * @param {Object} company - Company information
 * @returns {Object} - Generated document object
 */
function generateOrganizationActDoc(formData, user, company) {
  try {
    // Load the template
    const templatePath = path.join(__dirname, '../templates/organization-act-template.docx');
    
    // For now, we'll create a basic template since we don't have the DOCX file
    // This will be replaced with actual DOCX template loading
    const content = fs.readFileSync(templatePath);
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    });

    // Format document date
    const documentDate = formData.documentDate 
      ? moment(formData.documentDate).format('DD.MM.YYYY')
      : moment().format('DD.MM.YYYY');

    // Process positions and generate member numbering
    const processedPositions = processPositionsWithMembers(formData.positions || []);

    // Prepare template data
    const templateData = {
      // Company information
      companyName: company?.companyName || '',
      address: company?.address || '',
      taxNumber: company?.taxNumber || '',
      manager: company?.manager || '',
      
      // Document details
      documentDate: documentDate,
      
      // Position data for Section II
      positions: processedPositions,
      positionsList: (formData.positions || []).map(p => p.positionName).join('\n'),
      
      // Dynamic member numbering starts from member 6
      startingMemberNumber: 6
    };

    // Render the document
    doc.render(templateData);

    // Generate the document buffer
    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE"
    });

    // Return document object
    return {
      doc: buffer,
      filename: `Akt-za-sistematizacija-${company?.companyName?.replace(/[^a-zA-Z0-9]/g, '-')}-${moment().format('YYYY-MM-DD')}.docx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

  } catch (error) {
    console.error('Error generating Organization Act document:', error);
    
    // Fallback: Create a simple text-based document
    return createFallbackDocument(formData, user, company);
  }
}

/**
 * Process positions and assign proper member numbers for the document
 */
function processPositionsWithMembers(positions) {
  let memberCounter = 6; // Starting from Member 6 as per template
  
  return positions.map(position => {
    const processedPosition = {
      ...position,
      memberNumbers: {
        count: memberCounter,      // Member X: Number of employees
        conditions: memberCounter + 1,  // Member X+1: Special conditions  
        reporting: memberCounter + 2,   // Member X+2: Reporting structure
        responsibilities: memberCounter + 3, // Member X+3: Job responsibilities
        subordinates: memberCounter + 4     // Member X+4: Subordinate positions
      }
    };
    
    // Increment by 5 for next position (each position takes 5 members)
    memberCounter += 5;
    
    return processedPosition;
  });
}

/**
 * Create fallback text document when DOCX template is not available
 */
function createFallbackDocument(formData, user, company) {
  const documentDate = formData.documentDate 
    ? moment(formData.documentDate).format('DD.MM.YYYY')
    : moment().format('DD.MM.YYYY');

  let documentContent = `Врз основа на член 30, член 31, член 34 од Законот за работните односи како и врз основа на основачкиот акт, работодавачот ${company?.companyName || '[КОМПАНИЈА]'}, со седиште на ул. ${company?.address || '[АДРЕСА]'}, Република Северна Македонија, со ЕДБ ${company?.taxNumber || '[ДАНОЧЕН БРОЈ]'}, претставувано од Управителот ${company?.manager || '[УПРАВИТЕЛ]'}, на ден ${documentDate} година, го донесе следниот:

ПРАВИЛНИК
за систематизација на работните места во ${company?.companyName || '[КОМПАНИЈА]'}

I. Основни одредби

Член 1
Со овој акт се утврдува вкупниот број на вработени во ${company?.companyName || '[КОМПАНИЈА]'}, потребни за извршување на работите и задачите за одделни работни места, како и описот на работните места дефиниран согласно со овој Правилник.

Член 2
Работните места и работите се поделени согласно со нивната сродност, обем, степен за сложеност и потребни квалификации за вршење на истите.

Член 3
Работите и задачите опишани и утврдени со овој Правилник претставуваат основа за вработување и распоредување на вработените во ${company?.companyName || '[КОМПАНИЈА]'}.

Член 4
Општи услови утврдени со Законот, кои треба да се исполнат од работниците се:
- да е државјанин на Република Македонија,
- активно да го користи македонскиот јазик,
- да е полнолетен,
- да има општа здравствена способност за работното место и
- со правосилна судска пресуда да не му е изречена казна забрана на вршење професија, дејност или должност.

II. Распоред и опис на вработени

Член 5
Кај работодавачот се врши вработување и работат вработени лица на следните позиции:
${(formData.positions || []).map(p => `• ${p.positionName}`).join('\n')}

`;

  // Generate sections for each position
  let memberCounter = 6;
  (formData.positions || []).forEach(position => {
    documentContent += `\n${position.positionName}\n\nБрој на вработени\n\nЧлен ${memberCounter}`;
    documentContent += `\nВкупниот број на вработени на позиција ${position.positionName} кај работодавачот е ${position.numberOfEmployees || '1 (еден)'} извршители.\n`;
    
    memberCounter++;
    documentContent += `\nПосебни услови\n\nЧлен ${memberCounter}`;
    documentContent += `\nПосебни услови за работното место „${position.positionName}" кои треба да се исполнуваат од вработениот или кандидатот за вработување се:\n`;
    documentContent += `${position.educationRequirements || 'Да има завршено соодветно образование'}\n`;
    if (position.experienceRequirements) {
      documentContent += `\n${position.experienceRequirements}\n`;
    }
    
    memberCounter++;
    documentContent += `\nЧлен ${memberCounter}`;
    const reportsToText = position.reportsTo && position.reportsTo.length > 0 
      ? position.reportsTo.join(', ') 
      : 'Управителот на друштвото';
    documentContent += `\n${position.positionName} добива напаства за работа и одговара за извршените работи и работни задачи пред ${reportsToText}.\n`;
    
    memberCounter++;
    documentContent += `\nЧлен ${memberCounter}`;
    documentContent += `\nРаботните обврски и задачи за позицијата „${position.positionName}" се следните:\n`;
    if (position.responsibilities && position.responsibilities.length > 0) {
      position.responsibilities.forEach(resp => {
        documentContent += `• ${resp}\n`;
      });
    } else {
      documentContent += `• [Да се дефинираат работните обврски]\n`;
    }
    
    memberCounter++;
    if (position.subordinates && position.subordinates.length > 0) {
      documentContent += `\nЧлен ${memberCounter}`;
      documentContent += `\nЛицето вработено на позицијата „${position.positionName}" е надреден вработен на следните работни позиции:\n`;
      position.subordinates.forEach(sub => {
        documentContent += `• ${sub}\n`;
      });
    }
    
    memberCounter++;
    documentContent += `\n`;
  });

  documentContent += `\nIII. Останати одредби\n\nЧлен ${memberCounter}`;
  documentContent += `\nОвој акт влегува во сила од денот на неговото донесување.\nСо влегување во сила на овој правилник лицата кои се опфатени со истиот се должни да ги извршуваат покрај прецизно определените работни обврски и задачи со договорот за вработување и одредбите кои им се зададени согласно овој правилник.\n`;

  // Convert to buffer (simulate DOCX)
  const buffer = Buffer.from(documentContent, 'utf8');

  return {
    doc: buffer,
    filename: `Akt-za-sistematizacija-${company?.companyName?.replace(/[^a-zA-Z0-9]/g, '-')}-${moment().format('YYYY-MM-DD')}.docx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
}

module.exports = generateOrganizationActDoc;