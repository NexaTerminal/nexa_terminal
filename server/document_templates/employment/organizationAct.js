const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

/**
 * Generate Organizational Systematization Act Document
 * Creates a comprehensive organizational structure document with hierarchical positions
 *
 * @param {Object} formData - Form data containing positions and document details
 * @param {Object} user - User information
 * @param {Object} company - Company information
 * @returns {Object} - Generated document object with doc property
 */
function generateOrganizationActDoc(formData, user, company) {
  // Get company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyTaxNumber = company?.companyTaxNumber || company?.taxNumber || '[Даночен број]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';

  // Format document date
  const documentDate = formData.documentDate
    ? moment(formData.documentDate).format('DD.MM.YYYY')
    : moment().format('DD.MM.YYYY');

  // Get positions array (normalize field names)
  const positions = (formData.positions || []).map(position => ({
    positionName: position.positionName || position.title || '[Позиција]',
    numberOfEmployees: position.numberOfEmployees || '1',
    educationRequirements: position.educationRequirements || 'Соодветно образование за позицијата',
    experienceRequirements: position.experienceRequirements || '',
    reportsTo: position.reportsTo || position.reports || 'Управителот на друштвото',
    responsibilities: Array.isArray(position.responsibilities)
      ? position.responsibilities
      : (position.responsibilities ? [position.responsibilities] : ['Да се извршуваат работните задачи согласно упатствата']),
    subordinates: Array.isArray(position.subordinates) ? position.subordinates : []
  }));

  // Generate document paragraphs
  const paragraphs = [];

  // Header
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Врз основа на член 30, член 31, член 34 од Законот за работните односи како и врз основа на основачкиот акт, работодавачот ${companyName}, со седиште на ул. ${companyAddress}, Република Северна Македонија, со ЕДБ ${companyTaxNumber}, претставувано од Управителот ${companyManager}, на ден ${documentDate} година, го донесе следниот:`
        })
      ],
      alignment: AlignmentType.JUSTIFIED
    })
  );

  paragraphs.push(new Paragraph({ text: '' }));

  // Title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'ПРАВИЛНИК', bold: true })
      ],
      alignment: AlignmentType.CENTER
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: `за систематизација на работните места во ${companyName}`, bold: true })
      ],
      alignment: AlignmentType.CENTER
    })
  );

  paragraphs.push(new Paragraph({ text: '' }));

  // Section I - Basic Provisions
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'I. Основни одредби', bold: true })
      ],
      alignment: AlignmentType.LEFT
    })
  );

  paragraphs.push(new Paragraph({ text: '' }));

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 1', bold: true })
      ]
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Со овој акт се утврдува вкупниот број на вработени во ${companyName}, потребни за извршување на работите и задачите за одделни работни места, како и описот на работните места дефиниран согласно со овој Правилник.`
        })
      ],
      alignment: AlignmentType.JUSTIFIED
    })
  );

  paragraphs.push(new Paragraph({ text: '' }));

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 2', bold: true })
      ]
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Работните места и работите се поделени согласно со нивната сродност, обем, степен за сложеност и потребни квалификации за вршење на истите.'
        })
      ],
      alignment: AlignmentType.JUSTIFIED
    })
  );

  paragraphs.push(new Paragraph({ text: '' }));

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 3', bold: true })
      ]
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Работите и задачите опишани и утврдени со овој Правилник претставуваат основа за вработување и распоредување на вработените во ${companyName}.`
        })
      ],
      alignment: AlignmentType.JUSTIFIED
    })
  );

  paragraphs.push(new Paragraph({ text: '' }));

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 4', bold: true })
      ]
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Општи услови утврдени со Законот, кои треба да се исполнат од работниците се:'
        })
      ],
      alignment: AlignmentType.JUSTIFIED
    })
  );

  const generalConditions = [
    '- да е државјанин на Република Македонија,',
    '- активно да го користи македонскиот јазик,',
    '- да е полнолетен,',
    '- да има општа здравствена способност за работното место и',
    '- со правосилна судска пресуда да не му е изречена казна забрана на вршење професија, дејност или должност.'
  ];

  generalConditions.forEach(condition => {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: condition })]
      })
    );
  });

  paragraphs.push(new Paragraph({ text: '' }));

  // Section II - Position Details
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'II. Распоред и опис на вработени', bold: true })
      ],
      alignment: AlignmentType.LEFT
    })
  );

  paragraphs.push(new Paragraph({ text: '' }));

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 5', bold: true })
      ]
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Кај работодавачот се врши вработување и работат вработени лица на следните позиции:'
        })
      ],
      alignment: AlignmentType.JUSTIFIED
    })
  );

  // List all positions
  positions.forEach(position => {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: `• ${position.positionName}` })]
      })
    );
  });

  paragraphs.push(new Paragraph({ text: '' }));

  // Generate detailed sections for each position
  let memberCounter = 6;

  positions.forEach(position => {
    // Position name as header
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: position.positionName, bold: true })
        ]
      })
    );

    paragraphs.push(new Paragraph({ text: '' }));

    // Number of employees
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Број на вработени', bold: true })
        ]
      })
    );

    paragraphs.push(new Paragraph({ text: '' }));

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Член ${memberCounter}`, bold: true })
        ]
      })
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Вкупниот број на вработени на позиција ${position.positionName} кај работодавачот е ${position.numberOfEmployees} извршители.`
          })
        ],
        alignment: AlignmentType.JUSTIFIED
      })
    );

    paragraphs.push(new Paragraph({ text: '' }));
    memberCounter++;

    // Special conditions
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Посебни услови', bold: true })
        ]
      })
    );

    paragraphs.push(new Paragraph({ text: '' }));

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Член ${memberCounter}`, bold: true })
        ]
      })
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Посебни услови за работното место „${position.positionName}" кои треба да се исполнуваат од вработениот или кандидатот за вработување се:`
          })
        ],
        alignment: AlignmentType.JUSTIFIED
      })
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: position.educationRequirements })
        ]
      })
    );

    if (position.experienceRequirements) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: position.experienceRequirements })
          ]
        })
      );
    }

    paragraphs.push(new Paragraph({ text: '' }));
    memberCounter++;

    // Reporting structure
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Член ${memberCounter}`, bold: true })
        ]
      })
    );

    const reportsToText = Array.isArray(position.reportsTo)
      ? position.reportsTo.join(', ')
      : position.reportsTo;

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${position.positionName} добива напаства за работа и одговара за извршените работи и работни задачи пред ${reportsToText}.`
          })
        ],
        alignment: AlignmentType.JUSTIFIED
      })
    );

    paragraphs.push(new Paragraph({ text: '' }));
    memberCounter++;

    // Job responsibilities
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Член ${memberCounter}`, bold: true })
        ]
      })
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Работните обврски и задачи за позицијата „${position.positionName}" се следните:`
          })
        ],
        alignment: AlignmentType.JUSTIFIED
      })
    );

    position.responsibilities.forEach(resp => {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${resp}` })]
        })
      );
    });

    paragraphs.push(new Paragraph({ text: '' }));
    memberCounter++;

    // Subordinates (if any)
    if (position.subordinates && position.subordinates.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Член ${memberCounter}`, bold: true })
          ]
        })
      );

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Лицето вработено на позицијата „${position.positionName}" е надреден вработен на следните работни позиции:`
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        })
      );

      position.subordinates.forEach(sub => {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${sub}` })]
          })
        );
      });

      paragraphs.push(new Paragraph({ text: '' }));
      memberCounter++;
    }
  });

  // Section III - Final Provisions
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'III. Останати одредби', bold: true })
      ],
      alignment: AlignmentType.LEFT
    })
  );

  paragraphs.push(new Paragraph({ text: '' }));

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Член ${memberCounter}`, bold: true })
      ]
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Овој акт влегува во сила од денот на неговото донесување.'
        })
      ],
      alignment: AlignmentType.JUSTIFIED
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Со влегување во сила на овој правилник лицата кои се опфатени со истиот се должни да ги извршуваат покрај прецизно определените работни обврски и задачи со договорот за вработување и одредбите кои им се зададени согласно овој правилник.'
        })
      ],
      alignment: AlignmentType.JUSTIFIED
    })
  );

  paragraphs.push(new Paragraph({ text: '' }));
  paragraphs.push(new Paragraph({ text: '' }));

  // Signature section
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Датум: ${documentDate}` })
      ]
    })
  );

  paragraphs.push(new Paragraph({ text: '' }));

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Управител:' })
      ]
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: '___________________________' })
      ]
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: companyManager })
      ]
    })
  );

  // Create document
  const doc = new Document({
    sections: [{
      children: paragraphs
    }]
  });

  return { doc };
}

module.exports = generateOrganizationActDoc;
