const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

// Format date function
const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('mk-MK');
};

// Risk calculation function
const calculateRisk = (probability, impact) => {
    const riskValue = parseInt(probability) * parseInt(impact);
    if (riskValue <= 2) return 'незначителен ризик';
    if (riskValue <= 4) return 'ризик';
    return 'висок ризик';
};

// Assessment type mapping
const getAssessmentTypeText = (type) => {
    const types = {
        'systematic_evaluation': 'Систематска и обемна евалуација (профилирање)',
        'special_categories': 'Обработка на посебни категории на лични податоци',
        'systematic_monitoring': 'Систематско набљудување на јавно достапна област (видео надзор)',
        'new_technologies': 'Користење на нови технологии',
        'data_combination': 'Комбинирање на податоци',
        'location_tracking': 'Следење на локација или однесување',
        'health_risk': 'Обработка која претставува висок ризик по здравјето',
        'unique_identification': 'Обработка за цел на единствена идентификација'
    };
    return types[type] || type;
};

// Data subjects mapping
const getDataSubjectsText = (subjects) => {
    const mapping = {
        'employees': 'Вработени',
        'candidates': 'Кандидати за работа',
        'customers': 'Купувачи/клиенти',
        'suppliers': 'Добавувачи',
        'visitors': 'Посетители',
        'contractors': 'Изведувачи'
    };
    return subjects ? subjects.map(s => mapping[s] || s).join(', ') : '';
};

// Data categories mapping
const getDataCategoriesText = (categories) => {
    const mapping = {
        'basic_data': 'Основни податоци (име, адреса)',
        'contact_info': 'Контакт информации',
        'financial_data': 'Финансиски податоци',
        'health_data': 'Здравствени податоци',
        'biometric_data': 'Биометриски податоци',
        'location_data': 'Податоци за локација',
        'special_categories': 'Посебни категории податоци'
    };
    return categories ? categories.map(c => mapping[c] || c).join(', ') : '';
};

// Threats mapping
const getThreatsText = (threats) => {
    const mapping = {
        'unauthorized_access': 'Неовластен пристап',
        'data_loss': 'Губење на податоци',
        'data_alteration': 'Измена на податоци',
        'technical_failure': 'Технички дефекти',
        'cyber_attacks': 'Кибер напади',
        'human_error': 'Човечка грешка'
    };
    return threats ? threats.map(t => mapping[t] || t).join(', ') : '';
};

// Technical measures mapping
const getTechnicalMeasuresText = (measures) => {
    const mapping = {
        'encryption': 'Енкрипција на податоци',
        'access_control': 'Контрола на пристап',
        'backup_systems': 'Системи за резервни копии',
        'monitoring': 'Континуирано следење',
        'firewalls': 'Firewall системи',
        'antivirus': 'Антивирус заштита'
    };
    return measures ? measures.map(m => mapping[m] || m).join(', ') : '';
};

// Organizational measures mapping
const getOrganizationalMeasuresText = (measures) => {
    const mapping = {
        'staff_training': 'Обука на персоналот',
        'policies': 'Политики и процедури',
        'regular_audits': 'Редовни ревизии',
        'incident_response': 'План за одговор на инциденти',
        'data_minimization': 'Минимизирање на податоци',
        'retention_policy': 'Политика за чување'
    };
    return measures ? measures.map(m => mapping[m] || m).join(', ') : '';
};

function generateProcedureForEstimationDoc(formData, user, company) {
    // Get data with fallbacks
    const companyName = company?.companyName || '[Име на компанија]';
    const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
    const companyTaxNumber = company?.companyTaxNumber || company?.taxNumber || '[Единствен даночен број]';
    const currentDate = formData?.dpiaDate ? formatDate(formData.dpiaDate) : moment().format('DD.MM.YYYY');

    // Risk calculation
    const riskLevel = formData?.probability && formData?.impactLevel ? 
        calculateRisk(formData.probability, formData.impactLevel) : 'се определува во текот на процесот';

    const doc = new Document({
        sections: [{
            children: [
                // Title
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "ПРОЦЕДУРА ЗА ПРОЦЕНКА НА ВЛИЈАНИЕТО ВРЗ ЗАШТИТАТА НА ЛИЧНИТЕ ПОДАТОЦИ И УПРАВУВАЊЕ СО РИЗИК",
                            bold: true,
                            size: 28
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),

                // Legal basis
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Врз основа на императивните одредби од Законот за заштита на личните податоци (Службен весник на РСМ бр. 42/20, 294/21, 101/2025) и Правилникот за безбедност на обработката на личните податоци (Службен весник на РСМ бр. 266/24), ${companyName}, со регистрирано седиште на адреса: ${companyAddress}, со единствен даночен број ${companyTaxNumber} (во понатамошниот текст „Друштвото" или „Контролор"), на ден ${currentDate} година ја донесе следнава Процедура:`
                        })
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 300 }
                }),

                // Section I
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "I. ВОВЕД И ЦЕЛИ",
                            bold: true
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 300, after: 200 }
                }),

                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Оваа Процедура ја воспоставува нормативната рамка и оперативната методологија која Друштвото ја применува за спроведување на проценка на ризикот и влијанието врз заштитата на личните податоци, вклучително и за управување со ризиците кои произлегуваат од обработката на личните податоци, согласно законската регулатива, подзаконските акти и интерните прописи на Друштвото."
                        })
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 200 }
                }),

                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Примарната цел на оваа Процедура е да се идентификуваат, евалуираат и ублажат сите релевантни ризици по правата и слободите на субјектите на податоци, кои можат да произлезат од операциите на обработка на личните податоци, особено при имплементација на нови технологии или кога обработката, по својата природа, обем, контекст и цели, имплицира висок ризик."
                        })
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 200 }
                }),

                // Assessment type based on form data
                ...(formData?.assessmentType ? [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Во овој случај се применува следниот критериум:"
                            })
                        ],
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `• ${getAssessmentTypeText(formData.assessmentType)}`,
                                bold: true
                            })
                        ],
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 200 }
                    })
                ] : []),

                // Section II - DPIA Criteria
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "II. КРИТЕРИУМИ ЗА ЗАДОЛЖИТЕЛНА ПРОЦЕНКА НА ВЛИЈАНИЕТО (DPIA)",
                            bold: true
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 300, after: 200 }
                }),

        new Paragraph({
            children: [
                new TextRun("Спроведувањето на проценка на влијанието врз заштитата на личните податоци (DPIA) е императивно пред започнување на обработка, доколку постои реална веројатност истата да резултира со висок ризик за правата и слободите на физичките лица. Ова, без ограничување, ги вклучува следните категории на операции на обработка:")
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: "Систематска и обемна евалуација (профилирање): ",
                    bold: true
                }),
                new TextRun("Обработка на лични податоци која опфаќа систематска и екстензивна евалуација на личните аспекти на физичките лица, која се базира на автоматизирана обработка, вклучувајќи профилирање, и врз основа на која се донесуваат одлуки што произведуваат правни последици или на сличен начин имаат значително влијание врз физичкото лице.")
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: "Обработка на посебни категории на лични податоци: ",
                    bold: true
                }),
                new TextRun("Екстензивна обработка на посебни категории на лични податоци (на пример, здравствени досиеја на вработени).")
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: "Систематско набљудување на јавно достапна област (видео надзор): ",
                    bold: true
                }),
                new TextRun("Обемна и систематска обработка на лични податоци од јавно достапни локации, вклучително и преку средства за континуирано набљудување (на пример, системи за видео надзор) поставени на јавни површини.")
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: "Користење на нови технологии: ",
                    bold: true
                }),
                new TextRun("Кога се планира имплементација на нови технологии или се вршат значајни модификации на постоечките, кои воведуваат нови ризици.")
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: "Комбинирање на податоци: ",
                    bold: true
                }),
                new TextRun("Обработка на лични податоци која вклучува поврзување, компарација или верификација на податоци добиени од различни системи, бази на податоци или обработувачи.")
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 400 }
        }),

        // Section III - Roles and Responsibilities  
        new Paragraph({
            children: [
                new TextRun({
                    text: "III. УЛОГИ И ОДГОВОРНОСТИ ВО ПРОЦЕСОТ НА ПРОЦЕНКА НА ВЛИЈАНИЕТО",
                    bold: true,
                    size: 24
                })
            ],
            spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: "Улога на Друштвото како Контролор:",
                    bold: true
                })
            ],
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun("Контролорот, преку својот овластен претставник, иницира спроведување на проценка на влијанието врз заштитата на личните податоци и го одобрува предлогот за мерки за ублажување на идентификуваните ризици.")
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: "Обврски на Офицерот за заштита на личните податоци:",
                    bold: true
                })
            ],
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun(`Офицерот за заштита на лични податоци (${formData?.responsiblePerson || '[Име на одговорното лице]'}) ги има следниве клучни одговорности:`)
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun("• Обезбедува задолжителни стручни совети и насоки во текот на целиот процес на проценка на влијанието.")
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 100 }
        }),

        new Paragraph({
            children: [
                new TextRun("• Врши надзор врз усогласеноста на проценката на влијанието со Законот за заштита на личните податоци.")
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 100 }
        }),

        new Paragraph({
            children: [
                new TextRun("• Активно учествува во претходните консултации со Агенцијата за заштита на личните податоци.")
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: "Обврски на посебни работни групи (тимови):",
                    bold: true
                })
            ],
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun(`За целите на ефективно спроведување на проценката на влијанието, Контролорот формира посебна работна група (тим) составена од: ${formData?.responsiblePerson || '[Одговорно лице]'} и други релевантни експерти.`)
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 400 }
        }),

        // Section IV - DPIA Phases
        new Paragraph({
            children: [
                new TextRun({
                    text: "IV. ФАЗИ НА ПРОЦЕНКА НА ВЛИЈАНИЕТО",
                    bold: true,
                    size: 24
                })
            ],
            spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun("Процесот на проценка на влијанието врз заштитата на личните податоци се спроведува низ 4 (четири) етапи, во согласност со одредбите на Правилникот:")
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        // Phase 1
        new Paragraph({
            children: [
                new TextRun({
                    text: "Фаза 1: Идентификација и дефинирање на опфатот на обработката",
                    bold: true
                })
            ],
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: "Цел на обработката: ",
                    bold: true
                }),
                new TextRun(formData?.processingPurpose || '[Цел на обработката]')
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: "Категории на субјекти на личните податоци: ",
                    bold: true
                }),
                new TextRun(getDataSubjectsText(formData?.dataSubjects))
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: "Категории на лични податоци: ",
                    bold: true
                }),
                new TextRun(getDataCategoriesText(formData?.dataCategories))
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: "Правни основи: ",
                    bold: true
                }),
                new TextRun('Согласност на субјектот на податоци, легитимен интерес на контролорот, или друга правна основа согласно член 6 од ЗЗЛП')
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: "Рокови на чување: ",
                    bold: true
                }),
                new TextRun('Податоците се чуваат онолку долго колку што е потребно за постигнување на целта на обработката, но не подолго од роковите предвидени во закон')
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        // Phase 2
        new Paragraph({
            children: [
                new TextRun({
                    text: "Фаза 2: Процена на потребата за заштита и идентификација на ризиците",
                    bold: true
                })
            ],
            spacing: { before: 200, after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: "Проценка на ризик: ",
                    bold: true
                }),
                new TextRun(`Ризикот се проценува како ${riskLevel} врз основа на веројатност (${formData?.probability || 'се определува'}) и влијание (${formData?.impactLevel || 'се определува'}).`)
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun("Потребата за заштита на личните податоци се класифицира според скала која се состои од 3 (три) нивоа на влијание (ниско = вредност 1, средно = вредност 2, високо = вредност 3), врз основа на природата, обемот, контекстот и целта на обработката.")
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        // Phase 3
        new Paragraph({
            children: [
                new TextRun({
                    text: "Фаза 3: Постапување со ризикот – дефинирање и имплементација на мерки за ублажување",
                    bold: true
                })
            ],
            spacing: { before: 200, after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: "Технички мерки: ",
                    bold: true
                }),
                new TextRun(getTechnicalMeasuresText(formData?.technicalMeasures))
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: "Организациски мерки: ",
                    bold: true
                }),
                new TextRun(getOrganizationalMeasuresText(formData?.organizationalMeasures))
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun("За секој идентификуван висок ризик се дефинираат конкретни технички и организациски мерки со цел негово ублажување до прифатливо ниво. Овие мерки се преземаат од Правилата за технички и организациски мерки на Друштвото.")
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        // Phase 4
        new Paragraph({
            children: [
                new TextRun({
                    text: "Фаза 4: Документирање, ревизија и консултација",
                    bold: true
                })
            ],
            spacing: { before: 200, after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun("Во оваа фаза се врши целосно документирање на резултатите од проценката на влијанието, редовна ревизија на спроведените активности и консултации со релевантните засегнати страни, вклучително и надлежните регулаторни органи.")
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun(`Проценката се преиспитува на редовна основа, ${getReviewFrequencyText(formData?.reviewFrequency)} или веднаш по секоја значајна промена во обработката или системите кои ја засегаат безбедноста на личните податоци.`)
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 400 }
        }),

        // Section V - Final Provisions
        new Paragraph({
            children: [
                new TextRun({
                    text: "V. ПРЕОДНИ И ЗАВРШНИ ОДРЕДБИ",
                    bold: true,
                    size: 24
                })
            ],
            spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun("Оваа Процедура е интегрален дел од системот за заштита на личните податоци на Друштвото. Сите вработени кои учествуваат во процеси на обработка со висок ризик се должни да бидат запознаени и да ги применуваат одредбите од оваа Процедура.")
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        }),

        new Paragraph({
            children: [
                new TextRun("Оваа Процедура стапува на сила со денот на нејзиното донесување.")
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 400 }
        }),

        // Signature section
        new Paragraph({
            children: [
                new TextRun(`${currentDate} година.`)
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 400 }
        }),

        new Paragraph({
            children: [
                new TextRun("___________________________")
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 0 }
        }),

        new Paragraph({
            children: [
                new TextRun(companyName)
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 0 }
        }),

        new Paragraph({
            children: [
                new TextRun(company?.manager || company?.companyManager || '[Овластено лице]')
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 300 }
        })
            ]
        }]
    });

    return {
        doc,
        filenameSuffix: `Procedura_procenka_vlijanie_LP_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
    };
}

module.exports = generateProcedureForEstimationDoc;