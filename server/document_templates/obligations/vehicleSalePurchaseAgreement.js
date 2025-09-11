const { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
const moment = require('moment');

function generateVehicleSalePurchaseAgreementDoc(formData, user, company) {
  // Extract company information
  const userCompanyName = company?.companyName || '[Име на компанија]';
  const userCompanyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const userCompanyTaxNumber = company?.companyTaxNumber || company?.taxNumber || '[ЕДБ]';
  const userCompanyManager = company?.companyManager || company?.manager || '[Управител]';
  
  // Determine user's role and assign parties accordingly
  const isUserSeller = formData.userRole === 'seller';
  
  let sellerName, sellerAddress, sellerTaxNumber, sellerManager;
  let buyerName, buyerAddress, buyerTaxNumber, buyerManager;
  
  if (isUserSeller) {
    // User's company is the seller
    sellerName = userCompanyName;
    sellerAddress = userCompanyAddress;
    sellerTaxNumber = userCompanyTaxNumber;
    sellerManager = userCompanyManager;
    
    // Other party is the buyer
    if (formData.otherPartyType === 'company') {
      buyerName = formData.otherPartyCompanyName || '[Име на купувач]';
      buyerAddress = formData.otherPartyAddress || '[Адреса на купувач]';
      buyerTaxNumber = formData.otherPartyTaxNumber || '[ЕДБ на купувач]';
      buyerManager = formData.otherPartyManager || '[Управител на купувач]';
    } else {
      buyerName = formData.otherPartyName || '[Име на купувач]';
      buyerAddress = formData.otherPartyAddress || '[Адреса на купувач]';
      buyerTaxNumber = formData.otherPartyPIN || '[ЕМБГ на купувач]';
      buyerManager = '';
    }
  } else {
    // User's company is the buyer
    buyerName = userCompanyName;
    buyerAddress = userCompanyAddress;
    buyerTaxNumber = userCompanyTaxNumber;
    buyerManager = userCompanyManager;
    
    // Other party is the seller
    if (formData.otherPartyType === 'company') {
      sellerName = formData.otherPartyCompanyName || '[Име на продавач]';
      sellerAddress = formData.otherPartyAddress || '[Адреса на продавач]';
      sellerTaxNumber = formData.otherPartyTaxNumber || '[ЕДБ на продавач]';
      sellerManager = formData.otherPartyManager || '[Управител на продавач]';
    } else {
      sellerName = formData.otherPartyName || '[Име на продавач]';
      sellerAddress = formData.otherPartyAddress || '[Адреса на продавач]';
      sellerTaxNumber = formData.otherPartyPIN || '[ЕМБГ на продавач]';
      sellerManager = '';
    }
  }

  // Format date and location
  const contractDate = formData.contractDate ? moment(formData.contractDate).format('DD.MM.YYYY') : '[Датум]';
  const placeOfSigning = formData.placeOfSigning || '[Место на потпишување]';
  const competentCourt = formData.competentCourt || '[Надлежен суд]';
  
  // Vehicle information
  const vehicleType = formData.vehicleType || '[Тип на возило]';
  const vehicleBrand = formData.vehicleBrand || '[Марка]';
  const commercialBrand = formData.commercialBrand || '[Комерцијална ознака]';
  const chassisNumber = formData.chassisNumber || '[Број на шасија]';
  const productionYear = formData.productionYear || '[Година на производство]';
  const registrationNumber = formData.registrationNumber || '[Регистарски таблички]';
  
  // Financial information
  const price = formData.price || '[Цена]';
  const paymentMethod = formData.paymentMethod || 'notary_day';
  const paymentDate = formData.paymentDate ? moment(formData.paymentDate).format('DD.MM.YYYY') : '';
  
  const paymentText = paymentMethod === 'notary_day' 
    ? 'на денот на спроведувањето на заверката на овој договор пред надлежен нотар'
    : paymentDate;

  const doc = new Document({
    sections: [{
      children: [
        // Document title
        new Paragraph({
          children: [
            new TextRun({ text: 'Д О Г О В О Р', bold: true, size: 32 })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'за купопродажба на моторно возило', bold: true, size: 24 })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: '' }),
        
        // Contract opening
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Склучен на ден ${contractDate} година во ${placeOfSigning}, помеѓу`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        
        // Seller information
        new Paragraph({
          children: [
            new TextRun({ 
              text: `1. ${sellerName}, со живеалиште на ул. ${sellerAddress}, со ${formData.otherPartyType === 'company' && isUserSeller ? 'ЕДБ' : (formData.otherPartyType === 'company' && !isUserSeller ? 'ЕДБ' : 'ЕМБГ')} ${sellerTaxNumber}${sellerManager ? `, претставувано од ${sellerManager}` : ''} во понатамошниот текст како: ПРОДАВАЧ`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'и', size: 22 })
          ],
          alignment: AlignmentType.LEFT
        }),
        
        // Buyer information
        new Paragraph({
          children: [
            new TextRun({ 
              text: `2. ${buyerName}, со живеалиште на ул. ${buyerAddress}, со ${formData.otherPartyType === 'company' && !isUserSeller ? 'ЕДБ' : (formData.otherPartyType === 'company' && isUserSeller ? 'ЕДБ' : 'ЕМБГ')} ${buyerTaxNumber}${buyerManager ? `, претставувано од ${buyerManager}` : ''} во понатамошниот текст како: КУПУВАЧ`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        
        // Article 1
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 1', bold: true, size: 22 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Предмет на овој договор е купопродажба на патничко моторно возило, сопственост на продавачот, под услови, права и обврски на договорните страни предвидени во продолжение на овој договор.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        
        // Article 2
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 2', bold: true, size: 22 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Продавачот е сопственик на патничко моторно возило и тоа:',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        
        // Vehicle details table
        new Paragraph({
          children: [
            new TextRun({ text: `Вид на возило\t${vehicleType}`, size: 22 })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Марка\t${vehicleBrand}`, size: 22 })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Комерцијална ознака\t${commercialBrand}`, size: 22 })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Број на шасија / Идентификационен број на возило\t${chassisNumber}`, size: 22 })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Година на производство\t${productionYear}`, size: 22 })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Регистарски таблички\t${registrationNumber}`, size: 22 })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({ text: '' }),
        
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Со овој Договор Продавачот е согласен да го продаде, а Купувачот е согласен да го купи горе опишаното моторно возило на начин и под услови предвидени со овој Договор.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        
        // Article 3
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 3', bold: true, size: 22 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Продавачот го продава, а купувачот го купува патничкото моторно возило попрецизно опишано во член 2 на овој договор, за вкупна договорена купопродажна цена во износ од ${price},00 денари.`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Договорните страни се се согласни купопродажната цена од став 1 на овој член, купувачот да му ја исплати на продавачот (${paymentText}).`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        
        // Article 4
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 4', bold: true, size: 22 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Продавачот изрично изјавува дека врз предметот на купопродажба до денот на потпишување на овој договор нема засновано никакви заложни права, лизинг, ниту пак било какви товари или права со кои се ограничува сопственоста и во случај на евикција ќе се јави во заштита на купувачот и му одговара за предизвиканата штета.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Продавачот истовремено потврдува дека предметното возило го продава во исправна состојба, без да постојат било какви материјални недостатоци, како и дека по предавање во владение и сопственост на Купувачот, истиот ќе може слободно да го управува во земјата и странство, ќе може да одјавува регистарски таблици, да го регистрира на свое име, односно ќе може самостојно да располага со моторното возило, вклучително и да го продава на трети лица.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        
        // Article 5
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 5', bold: true, size: 22 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Договорните страни се согласни продавачот да му го предаде во владение на купувачот предметното возило веднаш по заверка на овој договор пред надлежен нотар.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        
        // Article 6
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 6', bold: true, size: 22 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'За се што не е предвидено со овој Договор ќе се применува Законот за облигационите односи и останатите позитивни правни прописи.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        
        // Article 7
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 7', bold: true, size: 22 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Сите трошоци кои ќе настанат врз основа на овој Договор ќе паднат на товар на Купувачот.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        
        // Article 8
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 8', bold: true, size: 22 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Во случај на спор во врска со одредбите на овој Договор, договорните страни ќе се обидат да го решат по мирен пат и спогодбено, а доколку не успеат во тоа надлежен ќе биде Основен граѓански суд ${competentCourt}.`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        
        // Article 9
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 9', bold: true, size: 22 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Овој Договор е составен во 3 (три) идентични примерока, по еден примерок за секоја договорна страна и еден примерок за службена употреба.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        
        // Signatures
        new Paragraph({
          children: [
            new TextRun({ text: 'ДОГОВОРНИ СТРАНИ', bold: true, size: 22 })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: '' }),
        
        // Signature table for symmetrical layout
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
          rows: [
            // Header row with party labels
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: 'ПРОДАВАЧ', bold: true, size: 22 })
                      ],
                      alignment: AlignmentType.CENTER
                    })
                  ],
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: 'КУПУВАЧ', bold: true, size: 22 })
                      ],
                      alignment: AlignmentType.CENTER
                    })
                  ],
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                }),
              ],
            }),
            // Spacer row
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ text: '' })
                  ],
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ text: '' })
                  ],
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                }),
              ],
            }),
            // Signature lines row
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: '________________________________', size: 22 })
                      ],
                      alignment: AlignmentType.CENTER
                    })
                  ],
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: '________________________________', size: 22 })
                      ],
                      alignment: AlignmentType.CENTER
                    })
                  ],
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                }),
              ],
            }),
            // Names row
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: `${sellerName}`, size: 22 })
                      ],
                      alignment: AlignmentType.CENTER
                    })
                  ],
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: `${buyerName}`, size: 22 })
                      ],
                      alignment: AlignmentType.CENTER
                    })
                  ],
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                }),
              ],
            }),
            // Manager rows (if applicable)
            ...(sellerManager || buyerManager ? [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: sellerManager ? `${sellerManager}` : '', 
                            size: 22 
                          })
                        ],
                        alignment: AlignmentType.CENTER
                      })
                    ],
                    width: {
                      size: 50,
                      type: WidthType.PERCENTAGE,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: buyerManager ? `${buyerManager}` : '', 
                            size: 22 
                          })
                        ],
                        alignment: AlignmentType.CENTER
                      })
                    ],
                    width: {
                      size: 50,
                      type: WidthType.PERCENTAGE,
                    },
                  }),
                ],
              })
            ] : [])
          ],
        })
      ]
    }]
  });

  return { doc };
}

module.exports = generateVehicleSalePurchaseAgreementDoc;