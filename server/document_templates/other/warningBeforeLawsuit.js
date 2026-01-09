const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

/**
 * Warning Before Lawsuit Template
 * Generates professional pre-litigation warning letter in Macedonian language
 * Template parameters: (formData, user, company) - CRITICAL ORDER
 * Category: Other Business Documents (Други деловни документи)
 */
function generateWarningBeforeLawsuitDoc(formData, user, company) {
  // Company data with defaults (creditor)
  const userCompanyName = company?.companyName || '[Име на компанија]';
  const userCompanyAddress = company?.companyAddress || company?.address || '[Адреса]';
  const userCompanyManager = company?.companyManager || company?.manager || '[Управител]';

  // Debtor information
  const debtorName = formData?.debtorName || '[Име на должник]';
  const debtorAddress = formData?.debtorAddress || '[Адреса на должник]';

  // Debt details
  const debtBasis = formData?.debtBasis || 'фактура';
  const totalAmountToBePaid = formData?.totalAmountToBePaid || '[Износ]';

  // Response deadline (default 8 days)
  const responseDeadlineDays = formData?.responseDeadlineDays || '8 (осум)';

  // Contact information (optional)
  const contactInfo = formData?.contactInfo || '';

  // Date formatting
  const currentDate = moment().format('DD.MM.YYYY');

  // Map debt basis to readable Macedonian text
  const debtBasisText = {
    'фактура': 'фактура',
    'фактури': 'фактури',
    'договор': 'договор',
    'судска одлука': 'судска одлука',
    'меница': 'меница',
    'договор за заем': 'договор за заем',
    'друго': formData?.debtBasisOther || 'друго правно основание'
  }[debtBasis] || 'фактура';

  // Build sections array for preview
  const sections = [{
    children: [
      // Header - TO
      new Paragraph({
        children: [
          new TextRun({
            text: 'ДО',
            bold: true
          })
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 200 }
      }),

        // Debtor details
        new Paragraph({
          children: [
            new TextRun({
              text: `${debtorName},`
            })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 100 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: debtorAddress
            })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 400 }
        }),

        // Header - FROM
        new Paragraph({
          children: [
            new TextRun({
              text: 'ОД',
              bold: true
            })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `${userCompanyName},`
            })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 100 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: userCompanyAddress
            })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 400 }
        }),

        // Subject line
        new Paragraph({
          children: [
            new TextRun({
              text: 'ПРЕДМЕТ: ',
              bold: true
            }),
            new TextRun({
              text: 'Опомена пред тужба',
              bold: true
            })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 400 }
        }),

        // Greeting
        new Paragraph({
          children: [
            new TextRun({
              text: 'Почитувани,'
            })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 300, line: 276 }
        }),

        // Opening paragraph
        new Paragraph({
          children: [
            new TextRun({
              text: `Ви се обраќаме во врска со наплата на парично побарување кое ${debtorName} како должник го има према нас ${userCompanyName} како доверител.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Debt basis
        new Paragraph({
          children: [
            new TextRun({
              text: `Имено, паричното побарување произлегува врз основа на ${debtBasisText}.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Total amount
        new Paragraph({
          children: [
            new TextRun({
              text: `Така, вкупното побарување изнесува вкупно ${totalAmountToBePaid} денари.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Debt fulfillment statement
        new Paragraph({
          children: [
            new TextRun({
              text: `Имено, до денот на испраќање на оваа опомена пред тужба во целост се исполнети обврските према Вас како должник врз основа на кои е настанато паричното побарување, меѓутоа од Ваша страна сè уште не е исплатен доспениот долг, поради што ни должите вкупен износ од ${totalAmountToBePaid} денари.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Deadline paragraph
        new Paragraph({
          children: [
            new TextRun({
              text: `Со оглед на гореизнесеното, односно постоењето на доспеан, а не исплатен долг од Ваша страна, Ве повикуваме во рок од ${responseDeadlineDays} дена, да пристапите кон исплата на доспеаното, а неисплатено парично побарување или да не контактирате со цел да најдеме заеднично прифатливо решение.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Legal consequences warning
        new Paragraph({
          children: [
            new TextRun({
              text: 'Во спротивно, доколку не пристапите кон исполнување на Вашата доспеана парична обврска, ќе сметаме дека од Ваша страна нема волја за вонсудско разрешување на постоечкиот долг и ќе бидеме приморани да иницираме соодветна постапка каде ќе бидете изложени и на дополнителни трошоци (камати, адвокатски, нотарски, судски, извршителски и други трошоци).'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Contact information (if provided)
        ...(contactInfo ? [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Во однос на горенаведеното, можете да не контактирате на долунаведените контакт податоци.'
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 300, line: 276 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: contactInfo
              })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 400, line: 276 }
          })
        ] : [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Во однос на горенаведеното, можете да не контактирате на долунаведените контакт податоци.'
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 600, line: 276 }
          })
        ]),

        // Empty space before signature
        new Paragraph({
          children: [new TextRun({ text: '' })],
          spacing: { after: 400 }
        }),

        // Signature line
        new Paragraph({
          children: [
            new TextRun({ text: '______________________' })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0 }
        }),

        // Company name
        new Paragraph({
          children: [
            new TextRun({ text: userCompanyName })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0 }
        }),

        // Manager name
        new Paragraph({
          children: [
            new TextRun({ text: userCompanyManager })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 300 }
        })
      ]
    }];

  const doc = new Document({ sections });

  return { doc, sections };
}

module.exports = generateWarningBeforeLawsuitDoc;
