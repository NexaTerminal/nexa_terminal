const { Document, Paragraph, TextRun, AlignmentType, HeadingLevel } = require('docx');
const moment = require('moment');

function generateGdprCompanyPoliticsDoc(formData, user, company) {
  // Extract company information
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyTaxNumber = company?.companyTaxNumber || company?.taxNumber || '[ЕДБ]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';

  // Core form data with defaults based on .md file structure
  const adoptionDate = formData.adoptionDate ? moment(formData.adoptionDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const companyEmail = formData.companyEmail || '[email@компанија.mk]';
  const companyDPO = formData.companyDPO || '[Име на ДПО]';
  const companyDPOemail = formData.companyDPOemail || '[dpo@компанија.mk]';
  const companyDPOphone = formData.companyDPOphone || '[+389 XX XXX XXX]';

  // Business activity and complexity
  const primaryBusinessActivity = formData.primaryBusinessActivity || 'Трговија и услуги';
  const dataProcessingComplexity = formData.dataProcessingComplexity || 'Средно (клиентски профили и историја)';

  // Processing characteristics (checkboxes with defaults)
  const processesSpecialCategories = formData.processesSpecialCategories || false;
  const usesAutomatedDecisionMaking = formData.usesAutomatedDecisionMaking || false;
  const performsDirectMarketing = formData.performsDirectMarketing || false;
  const dataPortabilityApplicable = formData.dataPortabilityApplicable !== false; // Default true
  const hasInternationalTransfers = formData.hasInternationalTransfers || false;

  // Data categories (arrays with defaults)
  const personalDataCategories = formData.personalDataCategories || ['Основни идентификациски податоци'];
  const sensitiveDataProcessing = formData.sensitiveDataProcessing || [];

  // Contact and submission methods
  const allowEmailSubmission = formData.allowEmailSubmission !== false; // Default true
  const allowPostalSubmission = formData.allowPostalSubmission !== false; // Default true
  const allowInPersonSubmission = formData.allowInPersonSubmission || false;
  const allowOnlinePortalSubmission = formData.allowOnlinePortalSubmission || false;

  // Identity verification and response times
  const identityVerificationLevel = formData.identityVerificationLevel || 'Стандардно (ID документ за сите барања)';
  const standardResponseTime = formData.standardResponseTime || '30 дена (за сите барања)';
  const complexRequestExtension = formData.complexRequestExtension || false;

  // DPO and department setup
  const hasDedicatedDPO = formData.hasDedicatedDPO !== false; // Default true
  const dpoIsInternal = formData.dpoIsInternal !== false; // Default true
  const responsibleDepartment = formData.responsibleDepartment || 'Правен оддел';

  // Compliance and training
  const staffTrainingLevel = formData.staffTrainingLevel || 'Редовни обуки за сите вработени';
  const policyUpdateFrequency = formData.policyUpdateFrequency || 'При промена на законодавство';

  // Third party sharing
  const sharesDataWithThirdParties = formData.sharesDataWithThirdParties || false;
  const typicalDataRecipients = formData.typicalDataRecipients || [];

  const doc = new Document({
    sections: [{
      children: [
        // Document header with legal basis
        new Paragraph({
          children: [
            new TextRun({
              text: `Врз основа на законските одредби содржани во Законот за заштита на личните податоци (Службен весник на РСМ бр. 42/20, 294/21, 101/2025) и Правилникот за безбедност на обработката на личните податоци (Службен весник на РСМ бр. 266/24), ${companyName}, правно лице со регистрирано седиште на локација: ${companyAddress}, идентификувано со ЕДБ ${companyTaxNumber} (во последователниот текст означено како „Правното субјект" или „Контролор на податоци"), на датум ${adoptionDate} година ја усвои нижеследната:`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Document title
        new Paragraph({
          children: [
            new TextRun({
              text: 'ПОЛИТИКА ЗА АДМИНИСТРИРАЊЕ СО ПРАВАТА НА СУБЈЕКТИТЕ НА ПЕРСОНАЛНИ ПОДАТОЦИ',
              bold: true,
              size: 28
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 480 }
        }),

        // Section I - INTRODUCTORY PROVISIONS AND STRATEGIC GOALS
        new Paragraph({
          children: [
            new TextRun({
              text: 'I. ВОВЕДНИ ОДРЕДБИ И СТРАТЕШКИ ЦЕЛИ',
              bold: true,
              size: 26
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Оваа Политика ги дефинира основните принципи, оперативните процедури и институционалните одговорности на ${companyName} при прием, процесирање и формулирање одговор на барањата за реализирање на правата на субјектите на персонални податоци. Политиката се имплементира во конформност со законските одредби од Законот за заштита на личните податоци, како и во согласност со заштитната мерка „Интервенирање" дефинирана во Правилникот за безбедност на обработка на личните податоци.`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Стратешката цел на Политиката е да гарантира ефективно, навремено и транспарентно административно постапување со сите барања поднесени од субјектите на персонални податоци во контекст на обработувањето кое го извршува Правното субјект во рамки на својата примарна деловна активност: ${primaryBusinessActivity}.`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Правното субјект обработува персонални податоци со ниво на комплексност: ${dataProcessingComplexity}. Оваа Политика претставува обврзувачки правен инструмент за сите вработени лица кои, според нивната функционална позиција или професионални задолженија, се во можност да примаат барања или да партиципираат во процесот на нивното административно обработување.`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 480 }
        }),

        // Section II - RIGHTS OF DATA SUBJECTS
        new Paragraph({
          children: [
            new TextRun({
              text: 'II. ПРАВНИ ОСНОВИ НА СУБЈЕКТИТЕ НА ПЕРСОНАЛНИТЕ ПОДАТОЦИ',
              bold: true,
              size: 26
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Субјектите на персонални податоци поседуваат право да иницираат барања за реализирање на нижеследните права во однос на податоците кои се предмет на обработување од страна на Правното субјект:',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        // Right 1 - Transparent Information
        new Paragraph({
          children: [
            new TextRun({
              text: '1. Право на транспарентно информирање: ',
              bold: true,
              size: 22
            }),
            new TextRun({
              text: `Субјектот поседува право да биде компрехензивно информиран за: идентитетот и контакт-елементите на контролорот на податоци (${companyName}), целите на обработувањето, правно-регулаторната основа, категоријалната класификација на персонални податоци, реципиентите, временските рамки на ретенција, неговите законски права и други релевантни информациски содржини.`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        // Right 2 - Direct Access
        new Paragraph({
          children: [
            new TextRun({
              text: '2. Право на директен пристап: ',
              bold: true,
              size: 22
            }),
            new TextRun({
              text: 'Субјектот поседува право да добие официјална потврда дали се извршува обработување на персонални податоци кои се однесуваат на неговата личност, директен пристап до наведените податоци и исцрпни информации во врска со процесот на обработување.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        // Right 3 - Correction
        new Paragraph({
          children: [
            new TextRun({
              text: '3. Право на корективна исправка: ',
              bold: true,
              size: 22
            }),
            new TextRun({
              text: 'Субјектот поседува право да инициира барање за исправување на неточни или надополнување на нецелосни персонални податоци кои се однесуваат на неговата личност.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        // Right 4 - Erasure (Right to be forgotten)
        new Paragraph({
          children: [
            new TextRun({
              text: '4. Право на дефинитивно бришење („право на дигитално заборавање"): ',
              bold: true,
              size: 22
            }),
            new TextRun({
              text: 'Субјектот поседува право да барает елиминирање на неговите персонални податоци без неоправдано пролонгирање, доколку е реализиран некој од нижеследните критериуми: податоците повеќе не се неопходни за целите за кои биле првично собирани; субјектот ја отповикал дадената согласност; податоците се обработувале во контравенција со законската регулатива; податоците мора да се елиминираат поради императивна законска обврска.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        // Right 5 - Restriction
        new Paragraph({
          children: [
            new TextRun({
              text: '5. Право на рестриктивно ограничување на обработката: ',
              bold: true,
              size: 22
            }),
            new TextRun({
              text: 'Субјектот поседува право да барает ограничување на обработувањето, особено: кога ја контестира веродостојноста на податоците, кога обработувањето е во контравенција со законот, а субјектот не барает бришење, кога податоците не се неопходни, но субјектот ги барает за остварување на правни побарувања.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        // Right 6 - Notification
        new Paragraph({
          children: [
            new TextRun({
              text: '6. Право на нотификација во врска со корекции, елиминирање или рестрикции: ',
              bold: true,
              size: 22
            }),
            new TextRun({
              text: `Контролорот на податоци има императивна обврска да ги извести сите реципиенти на кои податоците им биле дискутирани за секоја извршена корекција, елиминирање или ограничување${sharesDataWithThirdParties ? `, вклучително и следните категории реципиенти: ${typicalDataRecipients.join(', ')}` : ''}, освен доколку тоа е технички неизводливо или бара диспропорционален оперативен ангажман.`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        // Right 7 - Data Portability (conditional)
        ...(dataPortabilityApplicable ? [
          new Paragraph({
            children: [
              new TextRun({
                text: '7. Право на портабилност на податоци: ',
                bold: true,
                size: 22
              }),
              new TextRun({
                text: 'Субјектот поседува право да ги добие своите персонални податоци во структурно организиран, стандардно употребуван и машински интерпретабилен формат и да ги трансферира на алтернативен контролор, доколку: обработувањето се базира на согласност или договорни односи, и се извршува на автоматизиран начин.',
                size: 22
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 240 }
          })
        ] : []),

        // Right 8 - Objection (enhanced if direct marketing)
        new Paragraph({
          children: [
            new TextRun({
              text: '8. Право на формален приговор: ',
              bold: true,
              size: 22
            }),
            new TextRun({
              text: `Субјектот поседува право во секој временски момент да поднесе приговор на обработувањето на персоналните податоци кое се извршува врз основа на: легитимни интереси на контролорот или трета странка${performsDirectMarketing ? ', директни маркетиншки активности, вклучително и профилирање поврзано со комерцијални цели. За маркетиншки цели, Правното субјект може да користи следните канали: електронска пошта, SMS/телефонски повици, директна пошта, социјални мрежи, веб реклами' : ''}.`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        // Right 9 - Automated Decision Making (conditional)
        ...(usesAutomatedDecisionMaking ? [
          new Paragraph({
            children: [
              new TextRun({
                text: '9. Права поврзани со автоматизирано процесирање на одлуки, инклузивно профилирање: ',
                bold: true,
                size: 22
              }),
              new TextRun({
                text: 'Субјектот поседува право да не биде подложен на одлука заснована исклучиво на автоматска обработка, вклучувајќи профилирање, доколку таквата одлука генерира правни консеквенци или значително воздејствие врз неговата личност. Правното субјект обезбедува право на човечка интервенција, право на објаснување на логиката и право на оспорување на одлуката.',
                size: 22
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 240 }
          })
        ] : []),

        // Data Categories Processing Info
        new Paragraph({
          children: [
            new TextRun({
              text: `Правното субјект обработува следните категории на персонални податоци: ${personalDataCategories.join(', ')}.`,
              size: 22
            }),
            ...(processesSpecialCategories && sensitiveDataProcessing.length > 0 ? [
              new TextRun({
                text: ` Дополнително, се обработуваат и специјални категории податоци: ${sensitiveDataProcessing.join(', ')}, за кои важат зајакнати мерки за заштита и пристап.`,
                size: 22
              })
            ] : [])
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 480 }
        }),

        // Section III - SUBMISSION PROCEDURES
        new Paragraph({
          children: [
            new TextRun({
              text: 'III. ПРОЦЕДУРАЛНИ МОДАЛИТЕТИ ЗА ПОДНЕСУВАЊЕ НА БАРАЊЕ ЗА ОСТВАРУВАЊЕ НА ПРАВА',
              bold: true,
              size: 26
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Субјектите на персонални податоци поседуваат право да иницираат писмено и/или електронско барање за реализирање на нивните права предвидени со Законот за заштита на личните податоци. Барањата можат да се достават преку следните модалитети:',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        // Contact methods based on form selection
        new Paragraph({
          children: [
            new TextRun({
              text: 'Достапни канали за поднесување на барања:',
              bold: true,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),

        ...(allowPostalSubmission ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `• По поштенски сообраќај на адреса: ${companyAddress}, Република Северна Македонија`,
                size: 22
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120 }
          })
        ] : []),

        ...(allowEmailSubmission ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `• По електронска комуникација: ${companyEmail}`,
                size: 22
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120 }
          })
        ] : []),

        ...(allowInPersonSubmission ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `• Лично во административната служба на Правното субјект (потребен претходен договор)`,
                size: 22
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120 }
          })
        ] : []),

        ...(allowOnlinePortalSubmission ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `• Преку онлајн портал за клиенти (доколку е достапен)`,
                size: 22
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120 }
          })
        ] : []),

        // Required information in requests
        new Paragraph({
          children: [
            new TextRun({
              text: 'Секое барање мора да содржи прецизна идентификација на субјектот и дескриптивен опис на правото што се реализира. Субјектот на персоналните податоци е должен да ги специфицира нижеследните информации во барањето:',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '• Лично име и фамилијарно име;\n• Резиденцијална адреса и контакт-елементи (телефонски број, електронска пошта);\n• Детаљно образложение на барањето (кое право има намера да го реализира);\n• Кои персонални податоци се предмет на барањето;\n• Календарски датум и автограф (за писмени барања).',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        // Identity verification requirements
        new Paragraph({
          children: [
            new TextRun({
              text: `Правното субјект применува ${identityVerificationLevel} за верификација на идентитетот на подносителот. Ова се извршува за да се заштитат податоците на субјектот и да се спречи неовластен пристап.`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 480 }
        }),

        // Section IV - ADMINISTRATIVE PROCEDURE
        new Paragraph({
          children: [
            new TextRun({
              text: 'IV. АДМИНИСТРАТИВНА ПРОЦЕДУРА ЗА ПОСТАПУВАЊЕ ПО БАРАЊЕ',
              bold: true,
              size: 26
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Правното субјект постапува по секое поднесено барање од субјект на персонални податоци без неоправдано пролонгирање. Стандардниот рок за одговор е: ${standardResponseTime}.`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        ...(complexRequestExtension ? [
          new Paragraph({
            children: [
              new TextRun({
                text: 'За комплексни барања, Правното субјект може да го продолжи рокот за дополнителни 30 дена, со соодветно известување до подносителот за причините за продолжувањето.',
                size: 22
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 240 }
          })
        ] : []),

        // Internal processing structure
        new Paragraph({
          children: [
            new TextRun({
              text: `Составен дел од оваа политика е Формуларот – Барање за пристап, исправка и елиминирање на персонални податоци. Одговорен департман за процесирање: ${responsibleDepartment}.`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Постапката за обработка на барањата:',
              bold: true,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `1. Сите барања се евидентираат и се проследуваат до ${hasDedicatedDPO ? 'Офицерот за заштита на персоналните податоци' : 'одговорното лице/департман за ЗЗЛП'} во Правното субјект.\n2. Се води централизирана евиденција за сите примени барања, инклузивно го календарскиот датум на прием, типологијата на барањето, субјектот, преземените активности и календарскиот датум на одговор.\n3. Извршува се верификација на идентитетот на подносителот на барањето.\n4. Во колаборација со релевантните организациски единици, се евалуира барањето и се преземаат соодветните активности за негово исполнување.\n5. Одговорот до субјектот се формулира во писмена форма без неоправдано пролонгирање.`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        // Response timeframes by request type
        new Paragraph({
          children: [
            new TextRun({
              text: 'Специфични рокови по тип на барање:',
              bold: true,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '• Барања за информирање: во рок од еден месец од денот на официјалниот прием\n• Барања за исправка или дополнување: во рок од 15 дена од денот на официјалниот прием\n• Барања за елиминирање на персоналните податоци или ограничување на обработувањето: во рок од 30 дена од денот на официјалниот прием',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Доколку Правното субјект одбие да постапи по барањето, го нотифицира субјектот за причинителите за одбивањето и за неговото право да поднесе барање до Агенцијата за заштита на личните податоци или да иницира постапка пред компетентниот судски орган.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 480 }
        }),

        // Section V - THIRD PARTY NOTIFICATIONS (conditional)
        ...(sharesDataWithThirdParties ? [
          new Paragraph({
            children: [
              new TextRun({
                text: 'V. ОБВРСКИ ПРИ ПОСТАПУВАЊЕ ПО БАРАЊЕ ЗА ПРИСТАП, ИСПРАВКА, ЕЛИМИНИРАЊЕ И ОГРАНИЧУВАЊЕ',
                bold: true,
                size: 26
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Правното субјект ги нотифицира сите реципиенти на кои персоналните податоци им биле дискутирани за секоја извршена исправка, елиминирање или ограничување на обработувањето. Типични категории реципиенти вклучуваат: ${typicalDataRecipients.join(', ')}.`,
                size: 22
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 240 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'Нотификацијата се извршува освен доколку таквата нотификација е технички неизводлива или би претставувала диспропорционален оперативен ангажман.',
                size: 22
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 480 }
          })
        ] : []),

        // Section VI - OBJECTION AND AUTOMATED DECISIONS
        new Paragraph({
          children: [
            new TextRun({
              text: 'VI. СПЕЦИЈАЛНИ ОДРЕДБИ ЗА ПРАВОТО НА ПРИГОВОР И АВТОМАТСКО ПРОЦЕСИРАЊЕ НА ОДЛУКИ',
              bold: true,
              size: 26
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Субјектот поседува право да поднесе приговор против обработувањето на неговите персонални податоци, а Правното субјект има обврска да прекине со обработувањето, освен доколку докаже дека постојат легитимни и оправдани основи за обработувањето што преовладуваат над интересите, правата и слободите на субјектот на персонални податоци.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        ...(performsDirectMarketing ? [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Доколку податоците се обработуваат за цели на директен маркетинг, субјектот поседува право на приговор во секој временски момент, а Правното субјект веднаш прекинува со обработувањето за овие цели.',
                size: 22
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 240 }
          })
        ] : []),

        ...(usesAutomatedDecisionMaking ? [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Субјектот поседува право да не биде подложен на одлука заснована исклучиво на автоматска обработка, инклузивно профилирање, која генерира правни ефекти или на аналоген начин значително воздејствува врз неговата личност. Исклучоци се применливи доколку одлуката е неопходна за склучување/извршување на договорни односи, е дозволена со законска регулатива, или се заснова на експлицитна согласност на субјектот. Во овие случаи, Правното субјект обезбедува соодветни заштитни механизми вклучително право на човечка интервенција, право на објаснување и право на оспорување на одлуката.',
                size: 22
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 240 }
          })
        ] : []),

        // International transfers (conditional)
        ...(hasInternationalTransfers ? [
          new Paragraph({
            children: [
              new TextRun({
                text: 'При меѓународни трансфери на податоци, Правното субјект обезбедува соодветни заштитни мерки и ги известува субјектите за деталите на трансферите согласно законските барања.',
                size: 22
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 480 }
          })
        ] : []),

        // Section VII - CONTACT INFORMATION
        new Paragraph({
          children: [
            new TextRun({
              text: 'VII. КОНТАКТ-ИНФОРМАЦИИ ЗА ОСТВАРУВАЊЕ НА ПРАВАТА НА СУБЈЕКТИТЕ НА ПЕРСОНАЛНИТЕ ПОДАТОЦИ',
              bold: true,
              size: 26
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `За сите прашања и барања за реализирање на правата, субјектите на персонални податоци можат да ${hasDedicatedDPO ? 'го контактираат Офицерот за заштита на персоналните податоци' : 'се обратат до одговорното лице/департман'} на Правното субјект преку користење на нижеследните контакт-елементи:`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Контакт-информации: ${hasDedicatedDPO ? 'ОФЗЛП: ' + companyDPO : 'Одговорно лице: ' + companyManager}`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Електронска адреса: ${hasDedicatedDPO ? companyDPOemail : companyEmail}`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Контакт телефон: ${hasDedicatedDPO ? companyDPOphone : '[+389 XX XXX XXX]'}`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 480 }
        }),

        // Section VIII - TRANSITIONAL AND FINAL PROVISIONS
        new Paragraph({
          children: [
            new TextRun({
              text: 'VIII. ТРАНЗИЦИСКИ И ФИНАЛНИ ОДРЕДБИ',
              bold: true,
              size: 26
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Оваа Политика претставува интегрален составен дел на системот за заштита на персоналните податоци на Правното субјект. Секој вработен има императивна обврска да биде запознаен со нејзината содржина и да ја имплементира.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Правното субјект применува следно ниво на едукација за вработените: ${staffTrainingLevel}. Политиката се ажурира ${policyUpdateFrequency}.`,
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Оваа Политика влегува во правна сила со денот на нејзиното официјално усвојување.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Прилог 1: Формулар – Барање за пристап, исправка и елиминирање на персонални податоци.',
              size: 22
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 480 }
        }),

        // Date and signature
        new Paragraph({
          children: [
            new TextRun({ text: `${adoptionDate} година.`, size: 22 })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 240 }
        }),

        // Simple line signature format
        new Paragraph({
          children: [
            new TextRun({ text: "___________________________" }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0, line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: companyName }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0, line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: companyManager }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 300, line: 276 }
        })
      ]
    }]
  });

  return { doc };
}

module.exports = generateGdprCompanyPoliticsDoc;