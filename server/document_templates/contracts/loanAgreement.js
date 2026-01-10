const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

/**
 * Loan Agreement Template (Договор за заем)
 * Based on Macedonian Law Articles 545-554 (Loan Agreement)
 * Generates professional loan agreement with comprehensive legal compliance
 * Template parameters: (formData, user, company) - CRITICAL ORDER
 */
function generateLoanAgreementDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyTaxNumber = company?.companyTaxNumber || company?.taxNumber || '[Даночен број]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';

  // Contract parties data based on user role
  const userRole = formData?.userRole || 'давател';

  // Determine which party is which based on user's role
  let lenderName, lenderAddress, lenderTaxNumber, lenderManager;
  let borrowerName, borrowerAddress, borrowerTaxNumber, borrowerManager;

  if (userRole === 'давател') {
    // User's company is the lender
    lenderName = companyName;
    lenderAddress = companyAddress;
    lenderTaxNumber = companyTaxNumber;
    lenderManager = companyManager;

    // Other party is the borrower
    borrowerName = formData?.borrowerName || '[Име на примател]';
    borrowerAddress = formData?.borrowerAddress || '[Адреса на примател]';
    borrowerTaxNumber = formData?.borrowerTaxNumber || '[Даночен број на примател]';
    borrowerManager = formData?.borrowerManager || '[Управител на примател]';
  } else {
    // User's company is the borrower
    borrowerName = companyName;
    borrowerAddress = companyAddress;
    borrowerTaxNumber = companyTaxNumber;
    borrowerManager = companyManager;

    // Other party is the lender
    lenderName = formData?.lenderName || '[Име на давател]';
    lenderAddress = formData?.lenderAddress || '[Адреса на давател]';
    lenderTaxNumber = formData?.lenderTaxNumber || '[Даночен број на давател]';
    lenderManager = formData?.lenderManager || '[Управител на давател]';
  }

  // Contract basic data
  const contractDate = formData?.contractDate ? moment(formData.contractDate).format('DD.MM.YYYY') : '[Датум]';
  const contractLocation = formData?.contractLocation || 'Скопје';

  // Loan details
  const loanAmount = formData?.loanAmount ? `${parseInt(formData.loanAmount).toLocaleString('mk-MK')},00` : '[Износ]';
  const loanType = formData?.loanType || 'general';
  const loanPurpose = formData?.loanPurpose || '';

  const loanTypeText = {
    'general': 'општ парични заем',
    'business': 'деловен парични заем',
    'purpose-specific': 'наменски парични заем'
  };

  // Interest details
  const hasInterest = formData?.hasInterest || 'no';
  const interestRate = formData?.interestRate || '0';

  // Repayment details
  const repaymentType = formData?.repaymentType || 'single';
  const repaymentDeadline = formData?.repaymentDeadline ? moment(formData.repaymentDeadline).format('DD.MM.YYYY') : '[Рок]';
  const numberOfInstallments = formData?.numberOfInstallments || '[Број]';
  const firstPaymentDate = formData?.firstPaymentDate ? moment(formData.firstPaymentDate).format('DD.MM.YYYY') : '[Датум]';
  const paymentFrequency = formData?.paymentFrequency || 'monthly';

  const paymentFrequencyText = {
    'monthly': 'месечно',
    'quarterly': 'квартално',
    'annually': 'годишно'
  };

  // Bank details
  const borrowerBankAccount = formData?.borrowerBankAccount || '[Број на сметка]';
  const borrowerBank = formData?.borrowerBank || '[Банка]';

  // Early repayment
  const earlyRepayment = formData?.earlyRepayment || 'no';
  const earlyRepaymentNotice = formData?.earlyRepaymentNotice || '30';

  // Additional terms
  const specialConditions = formData?.specialConditions || '';
  const disputeResolution = formData?.disputeResolution || `Во случај на спор двете страни ќе се обидат да го решат истиот спогодбено, во спротивно надлежен за решавање на спорот е ${userRole} има седиште.`;

  // Build document paragraphs
  const children = [
    // Document title
    new Paragraph({
      children: [
        new TextRun({
          text: 'ДОГОВОР ЗА ПОЗАЈМИЦА',
          bold: true,
          size: 28
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'НА ПАРИЧНИ СРЕДСТВА',
          italics: true,
          size: 24
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),

    // Contract introduction
    new Paragraph({
      children: [
        new TextRun({
          text: `Склучен на ден ${contractDate} година, во ${contractLocation}, помеѓу:`
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),

    // Party 1 - Lender
    new Paragraph({
      children: [
        new TextRun({ text: '1. ', bold: true }),
        new TextRun({ text: lenderName, bold: true }),
        new TextRun({
          text: `, со седиште на ул. ${lenderAddress}, со даночен број ${lenderTaxNumber}, претставувано од ${lenderManager} (во понатамошниот текст: „Давател"), од една страна како Давател на позајмица, и`
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),

    // Party 2 - Borrower
    new Paragraph({
      children: [
        new TextRun({ text: '2. ', bold: true }),
        new TextRun({ text: borrowerName, bold: true }),
        new TextRun({
          text: `, со седиште на ул. ${borrowerAddress}, со даночен број ${borrowerTaxNumber}, претставувано од ${borrowerManager} (во понатамошниот текст: „Примател"), од друга страна како Примател на позајмица.`
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    }),

    // Preamble
    new Paragraph({
      children: [
        new TextRun({
          text: 'Со договорот се утврдуваат условите за давање и враќање на парична позајмица согласно одредбите од Законот за облигациони односи.',
          italics: true
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'ПРЕДМЕТ НА ДОГОВОРОТ', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    // Article 1 - Subject
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 1', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Давателот се обврзува да му даде на примателот ${loanTypeText[loanType]} во износ од ${loanAmount} денари, а примателот се обврзува да го прими истиот и да го врати под условите утврдени со овој договор.`
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    })
  ];

  // Add loan purpose if purpose-specific
  if (loanType === 'purpose-specific' && loanPurpose) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Намена на заемот: ${loanPurpose}`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 600, line: 276 }
      })
    );
  } else {
    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 400 }
      })
    );
  }

  // Article 2 - Amount and Disbursement
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 2', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'ИЗНОС И ИСПЛАТА НА ЗАЕМОТ', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Износот на заемот изнесува ${loanAmount} денари.`
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Давателот се обврзува износот на заемот да го исплати на трансакциска сметка број ${borrowerBankAccount}, депонент на ${borrowerBank}, во рок од 5 (пет) работни дена од денот на потпишување на овој договор.`
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    })
  );

  // Article 3 - Repayment
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 3', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'ВРАЌАЊЕ НА ЗАЕМОТ', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    })
  );

  if (repaymentType === 'single') {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Примателот се обврзува заемот да го врати во целост, еднократно, најдоцна до ${repaymentDeadline} година согласно Член 550 од Законот за облигациони односи.`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300, line: 276 }
      })
    );
  } else {
    // Installments
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Примателот се обврзува заемот да го врати на ${numberOfInstallments} ${paymentFrequencyText[paymentFrequency]} рати, со првата рата која доспева на ${firstPaymentDate} година согласно Член 550 од Законот за облигациони односи.`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300, line: 276 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: `Секоја рата изнесува ${formData?.loanAmount && formData?.numberOfInstallments ? `${parseInt(formData.loanAmount / formData.numberOfInstallments).toLocaleString('mk-MK')},00` : '[Износ на рата]'} денари ${hasInterest === 'yes' ? '(главница)' : ''}.`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300, line: 276 }
      })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Враќањето на заемот се врши преку банкарски трансфер на трансакциската сметка на давателот која ќе биде наведена во писмено известување.'
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    })
  );

  // Article 4 - Interest
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 4', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'КАМАТА', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    })
  );

  if (hasInterest === 'yes') {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `На износот на заемот се пресметува годишна каматна стапка од ${interestRate}% (${interestRate} проценти), која се пресметува на месечна основа согласно Член 546 од Законот за облигациони односи.`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300, line: 276 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: 'Каматата се пресметува од денот на исплатата на заемот до денот на целосното враќање на истиот. Примателот ја плаќа каматата заедно со секоја рата на главницата.'
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 600, line: 276 }
      })
    );
  } else {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Овој заем е без камата (безкаматна позајмица) согласно Член 546 од Законот за облигациони односи. Примателот е должен да го врати само износот на главницата.'
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 600, line: 276 }
      })
    );
  }

  // Article 4a - Early Repayment (conditional)
  if (earlyRepayment === 'yes') {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 5', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: 'ПРЕДВРЕМЕНО ВРАЌАЊЕ', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: `Примателот има право на предвремено враќање на целиот износ или дел од заемот со писмено известување до давателот ${earlyRepaymentNotice} дена однапред согласно Член 551 од Законот за облигациони односи.`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300, line: 276 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: hasInterest === 'yes'
              ? 'При предвремено враќање, каматата се пресметува само до денот на враќањето и примателот не плаќа камата за преостанатиот период.'
              : 'При предвремено враќање, не се плаќа надоместок или камата.'
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 600, line: 276 }
      })
    );
  }

  // Article 5/6 - Special Conditions (conditional)
  let articleNumber = earlyRepayment === 'yes' ? 6 : 5;

  if (specialConditions) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Член ${articleNumber}`, bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: 'СПЕЦИЈАЛНИ УСЛОВИ', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: specialConditions
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 600, line: 276 }
      })
    );

    articleNumber++;
  }

  // Article - Dispute Resolution
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Член ${articleNumber}`, bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'РЕШАВАЊЕ НА СПОРОВИ', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: disputeResolution
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    })
  );

  articleNumber++;

  // Article - Effective Date
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Член ${articleNumber}`, bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'СТАПУВАЊЕ ВО СИЛА', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'Овој договор влегува во сила на денот на потпишување од двете страни и важи до целосното извршување на сите договорени обврски.'
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    })
  );

  articleNumber++;

  // Article - Copies
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Член ${articleNumber}`, bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'ПРИМЕРОЦИ', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'Овој договор е составен во 2 (два) истоветни примероци, по еден за секоја договорна страна.'
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    }),

    // Signature section
    new Paragraph({
      children: [
        new TextRun({
          text: `Овој договор е потпишан од двете страни на ден ${contractDate} година.`,
          bold: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600, line: 276 }
    }),

    // Lender signature
    new Paragraph({
      children: [
        new TextRun({ text: 'ЗА ДАВАТЕЛОТ:' })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '___________________________' })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: lenderName })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: lenderManager })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 400 }
    }),

    // Borrower signature
    new Paragraph({
      children: [
        new TextRun({ text: 'ЗА ПРИМАТЕЛОТ:' })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '___________________________' })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: borrowerName })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: borrowerManager })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 300 }
    })
  );

  const sections = [{ children }];
  const doc = new Document({ sections });

  return { doc, sections };
}

module.exports = generateLoanAgreementDoc;
