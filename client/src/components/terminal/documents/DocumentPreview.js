import React from 'react';
import { useAuth } from '../../../contexts/AuthContext'; // Corrected path
import styles from '../../../styles/terminal/documents/DocumentGeneration.module.css';
import moment from 'moment';
import documentCategories from '../../../data/documentCategories.json';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return moment(dateString).isValid() ? moment(dateString).format('DD.MM.YYYY') : dateString;
};

const getCurrentDate = () => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date().toLocaleDateString('mk-MK', options); // Changed to Macedonian locale
};

function getDocumentHeadline(documentType) {
  for (const category of documentCategories) {
    for (const template of category.templates || []) {
      if (template.id === documentType) {
        return template.name;
      }
    }
  }
  return '[Наслов на документ]';
}

const documentHeadlines = {
  // Employment
  terminationAgreement: "СПОГОДБА ЗА ПРЕСТАНОК НА РАБОТЕН ОДНОС",
  terminationDecisionDueToDuration: "ОДЛУКА за престанок на Договорот за вработување поради истек на времето за кое бил склучен",
  annualLeaveDecision: "РЕШЕНИЕ ЗА ГОДИШЕН ОДМОР",
  confirmationOfEmployment: "ПОТВРДА ЗА ВРАБОТУВАЊЕ",
  employmentAgreement: "ДОГОВОР ЗА ВРАБОТУВАЊЕ",
  disciplinaryAction: "РЕШЕНИЕ ЗА ДИСЦИПЛИНСКА МЕРКА",
  terminationWarning: "ПРЕДУПРЕДУВАЊЕ пред откажување на договор за вработување",
  employmentAnnex: "АНЕКС кон договор за вработување",
  warningLetter: "ОПОМЕНА до вработен",
  terminationPersonalReasons: "ОДЛУКА ЗА ПРЕСТАНОК ПОРАДИ ЛИЧНИ ПРИЧИНИ",
  terminationDueToFault: "ОДЛУКА ЗА ПРЕСТАНОК ПОРАДИ ВИНА НА РАБОТНИКОТ",
  terminationByEmployeeRequest: "РЕШЕНИЕ ЗА ПРЕСТАНОК НА РАБОТЕН ОДНОС",
  bonusPayment: "ОДЛУКА ЗА ИСПЛАТА НА РАБОТНА УСПЕШНОСТ - БОНУС",

  // Personal Data Protection
  consentForPersonalDataProcessing: "СОГЛАСНОСТ ЗА ОБРАБОТКА НА ЛИЧНИ ПОДАТОЦИ",

  // Contracts
  rentAgreement: "ДОГОВОР ЗА ЗАКУП НА НЕДВИЖЕН ИМОТ",
  nda: "ДОГОВОР ЗА ДОВЕРЛИВОСТ НА ИНФОРМАЦИИ",
  employeeDamagesStatement: "ИЗЈАВА ЗА СОГЛАСНОСТ ЗА НАМАЛУВАЊЕ НА ПЛАТА ПОРАДИ ПРЕДИЗВИКАНА ШТЕТА",
  terminationDueToAgeLimit: "ОДЛУКА ЗА ПРЕСТАНОК ПОРАДИ ВОЗРАСНА ГРАНИЦА",
  
  // Obligations  
  vehicleSalePurchaseAgreement: "ДОГОВОР ЗА КУПОПРОДАЖБА НА МОТОРНО ВОЗИЛО",

  // Rulebooks
  personalDataRulebook: "ПРАВИЛНИК ЗА ЗАШТИТА НА ДЕЛОВНА ТАЈНА",

  // ...add more as needed
};

// Function to highlight user input within template sentences
const highlightText = (text, inputValue, isHighlighted = true) => {
  if (!inputValue || !text.includes(inputValue)) {
    return (
      <span className={isHighlighted ? styles.greyedText : undefined}>
        {text}
      </span>
    );
  }
  
  const parts = text.split(inputValue);
  return (
    <span>
      {parts.map((part, index) => (
        <span key={index}>
          <span className={isHighlighted ? styles.greyedText : undefined}>{part}</span>
          {index < parts.length - 1 && (
            <span className={styles.highlightedInput}>{inputValue}</span>
          )}
        </span>
      ))}
    </span>
  );
};

// Define template sentences for each document type with placeholders
const documentSentences = {
  employmentAgreement: {
    title: "ДОГОВОР ЗА ВРАБОТУВАЊЕ",
    sentences: [
      {
        text: "На {agreementDate} година се склучи следниот договор помеѓу работодавецот {companyName} и работникот {employeeName}.",
        fields: ['agreementDate', 'companyName', 'employeeName']
      },
      {
        text: "Работникот {employeeName} со адреса на живеење на ул. {employeeAddress} со ЕМБГ {employeePIN}.",
        fields: ['employeeName', 'employeeAddress', 'employeePIN']
      },
      {
        text: "Работникот ќе ги извршува работните задачи за позицијата {jobPosition} со нето плата од {netSalary} денари.",
        fields: ['jobPosition', 'netSalary']
      },
      {
        text: "Работните обврски включуваат: {workTasks}.",
        fields: ['workTasks']
      },
      {
        text: "Работното време {dailyWorkTime} на место {placeOfWork} {otherWorkPlace}.",
        fields: ['dailyWorkTime', 'placeOfWork', 'otherWorkPlace']
      },
      {
        text: "Договорот е склучен на {agreementDurationType} {definedDuration}.",
        fields: ['agreementDurationType', 'definedDuration']
      },
      {
        text: "Конкурентска клаузула: {concurrentClause} со детали {concurrentClauseInput}.",
        fields: ['concurrentClause', 'concurrentClauseInput']
      }
    ]
  },
  annualLeaveDecision: {
    title: "РЕШЕНИЕ ЗА ГОДИШЕН ОДМОР",
    sentences: [
      {
        text: "На вработениот {employeeName} на позицијата {employeePosition} му се одобрува годишен одмор.",
        fields: ['employeeName', 'employeePosition']
      },
      {
        text: "Годишниот одмор ќе трае од {annualLeaveStart} до {annualLeaveEnd} година за {annualLeaveYear} година.",
        fields: ['annualLeaveStart', 'annualLeaveEnd', 'annualLeaveYear']
      }
    ]
  },
  disciplinaryAction: {
    title: "РЕШЕНИЕ ЗА ДИСЦИПЛИНСКА МЕРКА",
    sentences: [
      {
        text: "На работникот {employeeName} на позицијата {jobPosition} му се изрекува дисциплинска мерка.",
        fields: ['employeeName', 'jobPosition']
      },
      {
        text: "Казната изнесува {sanctionAmount}% од нето плата за период од {sanctionPeriod} месеци, изречена на {sanctionDate}.",
        fields: ['sanctionAmount', 'sanctionPeriod', 'sanctionDate']
      },
      {
        text: "Работната обврска која работникот ја запоставил: {workTaskFailure}.",
        fields: ['workTaskFailure']
      },
      {
        text: "Постапувањето на работникот спротивно на обврската на {employeeWrongdoingDate}: {employeeWrongDoing}.",
        fields: ['employeeWrongdoingDate', 'employeeWrongDoing']
      }
    ]
  },
  confirmationOfEmployment: {
    title: "ПОТВРДА ЗА ВРАБОТУВАЊЕ",
    sentences: [
      {
        text: "Се потврдува дека {employeeName} со ЕМБГ {employeePIN} е вработен во нашата компанија.",
        fields: ['employeeName', 'employeePIN']
      },
      {
        text: "Работникот живее на адреса {employeeAddress} и работи на позицијата {jobPosition}.",
        fields: ['employeeAddress', 'jobPosition']
      },
      {
        text: "Договорот за вработување е склучен на {agreementDurationType}.",
        fields: ['agreementDurationType']
      }
    ]
  },
  rentAgreement: {
    title: "ДОГОВОР ЗА ЗАКУП НА НЕДВИЖЕН ИМОТ",
    sentences: [
      {
        text: "Склучен на ден {contractDate} година, во {contractTown} помеѓу закуподавачот и закупецот.",
        fields: ['contractDate', 'contractTown']
      },
      {
        text: "Вашата компанија {companyName} во овој договор е {userRole}.",
        fields: ['companyName', 'userRole']
      },
      {
        text: "Другата договорна страна е {otherPartyType}: {otherPartyName} {otherPartyCompanyName} со адреса {otherPartyAddress} {otherPartyCompanyAddress}.",
        fields: ['otherPartyType', 'otherPartyName', 'otherPartyCompanyName', 'otherPartyAddress', 'otherPartyCompanyAddress']
      },
      {
        text: "ЕМБГ на физичкото лице: {otherPartyPIN}, додека управителот на компанијата е {otherPartyCompanyManager} со даночен број {otherPartyCompanyTaxNumber}.",
        fields: ['otherPartyPIN', 'otherPartyCompanyManager', 'otherPartyCompanyTaxNumber']
      },
      {
        text: "Предмет на договорот е недвижен имот на адреса {propertyAddress} од {propertySize}м² тип {propertyType}.",
        fields: ['propertyAddress', 'propertySize', 'propertyType']
      },
      {
        text: "Катастарски податоци: парцела {cadastralParcelNumber}, општина {cadastralMunicipality}, имотен лист {propertySheetNumber}.",
        fields: ['cadastralParcelNumber', 'cadastralMunicipality', 'propertySheetNumber']
      },
      {
        text: "Дополнителни детали: зграда {buildingNumber}, намена {propertyPurpose}, влез {entrance}, кат {floor}, број {apartmentNumber}, специфична намена {specificPurpose}.",
        fields: ['buildingNumber', 'propertyPurpose', 'entrance', 'floor', 'apartmentNumber', 'specificPurpose']
      },
      {
        text: "Месечната закупнина изнесува {rentAmount} евра {includesVAT} и се плаќа {rentPaymentDeadline}.",
        fields: ['rentAmount', 'includesVAT', 'rentPaymentDeadline']
      },
      {
        text: "Депозит: {requiresDeposit} во износ од {depositAmount} {customDepositAmount} евра.",
        fields: ['requiresDeposit', 'depositAmount', 'customDepositAmount']
      },
      {
        text: "Договорот е склучен на {durationType} времетраење {durationValue} до {endDate}.",
        fields: ['durationType', 'durationValue', 'endDate']
      },
      {
        text: "Плаќањето се врши на жиро сметка {bankAccount} кај {bankName}.",
        fields: ['bankAccount', 'bankName']
      },
      {
        text: "Посебни обврски: осигурување {requiresInsurance}, квартална инспекција {allowsQuarterlyInspection}, годишно зголемување {hasAnnualIncrease}.",
        fields: ['requiresInsurance', 'allowsQuarterlyInspection', 'hasAnnualIncrease']
      }
    ]
  },
  terminationPersonalReasons: {
    title: "ОДЛУКА ЗА ПРЕСТАНОК ПОРАДИ ЛИЧНИ ПРИЧИНИ",
    sentences: [
      {
        text: "На работникот {employeeName} со ЕМБГ {employeePin} на позицијата {jobPosition} му престанува работниот однос поради лични причини.",
        fields: ['employeeName', 'employeePin', 'jobPosition']
      },
      {
        text: "Работникот живее на адреса {employeeAddress} и работниот однос започнал на {contractStartDate}.",
        fields: ['employeeAddress', 'contractStartDate']
      },
      {
        text: "Работниот однос престанува на {terminationDate} поради следните лични причини: {personalReasonDescription}.",
        fields: ['terminationDate', 'personalReasonDescription']
      },
      {
        text: "Одлуката е донесена на {documentDate} година.",
        fields: ['documentDate']
      }
    ]
  },
  terminationAgreement: {
    title: "СПОГОДБА ЗА ПРЕСТАНОК НА РАБОТЕН ОДНОС",
    sentences: [
      {
        text: "Спогодба за престанок на работниот однос на работникот {employeeName} со ЕМБГ {employeePIN}.",
        fields: ['employeeName', 'employeePIN']
      },
      {
        text: "Работникот живее на адреса {employeeAddress} и работниот однос престанува на {endDate}.",
        fields: ['employeeAddress', 'endDate']
      }
    ]
  },
  terminationDecisionDueToDuration: {
    title: "ОДЛУКА ЗА ПРЕСТАНОК ПОРАДИ ИСТЕК НА ВРЕМЕТО",
    sentences: [
      {
        text: "На работникот {employeeName} на позицијата {jobPosition} му престанува работниот однос поради истек на времето.",
        fields: ['employeeName', 'jobPosition']
      },
      {
        text: "Работниот однос престанува на {employmentEndDate} според договорот склучен на {agreementDate}.",
        fields: ['employmentEndDate', 'agreementDate']
      },
      {
        text: "Одлуката е донесена на {decisionDate} година.",
        fields: ['decisionDate']
      }
    ]
  },
  terminationWarning: {
    title: "ПРЕДУПРЕДУВАЊЕ ПРЕД ОТКАЖУВАЊЕ",
    sentences: [
      {
        text: "На работникот {employeeName} на позицијата {jobPosition} му се издава предупредување пред откажување.",
        fields: ['employeeName', 'jobPosition']
      },
      {
        text: "Предупредувањето е издадено на {decisionDate} поради следното постапување: {employeeWrongDoing}.",
        fields: ['decisionDate', 'employeeWrongDoing']
      },
      {
        text: "Работната обврска која е запостави: {workTaskFailure}, со рок за исправка до {fixingDeadline}.",
        fields: ['workTaskFailure', 'fixingDeadline']
      }
    ]
  },
  employmentAnnex: {
    title: "АНЕКС КОН ДОГОВОР ЗА ВРАБОТУВАЊЕ",
    sentences: [
      {
        text: "Анекс кон договорот за вработување на работникот {employeeName} на позицијата {jobPosition}.",
        fields: ['employeeName', 'jobPosition']
      },
      {
        text: "Измените се однесуваат на: {changeType} со детали {changeDetails}.",
        fields: ['changeType', 'changeDetails']
      },
      {
        text: "Анексот влегува во сила на {effectiveDate} година.",
        fields: ['effectiveDate']
      }
    ]
  },
  warningLetter: {
    title: "ОПОМЕНА ДО ВРАБОТЕН",
    sentences: [
      {
        text: "На работникот {employeeName} му се издава опомена на {warningDate}.",
        fields: ['employeeName', 'warningDate']
      },
      {
        text: "Постапувањето спротивно на обврската: {employeeWrongDoing}.",
        fields: ['employeeWrongDoing']
      },
      {
        text: "Правилата кои не се почитуваат: {rulesNotRespected} според член {articleNumber}.",
        fields: ['rulesNotRespected', 'articleNumber']
      }
    ]
  },
  consentForPersonalDataProcessing: {
    title: "СОГЛАСНОСТ ЗА ОБРАБОТКА НА ЛИЧНИ ПОДАТОЦИ",
    sentences: [
      {
        text: "Согласност за обработка на лични податоци на лицето {fullName} со ЕМБГ {pin}.",
        fields: ['fullName', 'pin']
      },
      {
        text: "Лицето живее на адреса {address} и се согласува на обработка за целите: {purposes}.",
        fields: ['address', 'purposes']
      },
      {
        text: "Согласноста е дадена на {consentDate} за период од {retentionPeriod}.",
        fields: ['consentDate', 'retentionPeriod']
      }
    ]
  },
  terminationDueToFault: {
    title: "ОДЛУКА ЗА ПРЕСТАНОК ПОРАДИ ВИНА НА РАБОТНИКОТ",
    sentences: [
      {
        text: "На работникот {employeeName} со ЕМБГ {employeePIN} на позицијата {jobPosition} му престанува работниот однос поради вина на работникот.",
        fields: ['employeeName', 'employeePIN', 'jobPosition']
      },
      {
        text: "Типот на престанок: {terminationType} - според членовите 81 и 82 од ЗРО.",
        fields: ['terminationType']
      },
      {
        text: "Опис на случувањето: {faultDescription}.",
        fields: ['faultDescription']
      },
      {
        text: "Информации за докази и прилози: {evidenceDescription}.",
        fields: ['evidenceDescription']
      },
      {
        text: "Работниот однос започнал на {employmentStartDate} и престанува на {terminationDate}.",
        fields: ['employmentStartDate', 'terminationDate']
      }
    ]
  },
  terminationByEmployeeRequest: {
    title: "РЕШЕНИЕ ЗА ПРЕСТАНОК НА РАБОТЕН ОДНОС",
    sentences: [
      {
        text: "Работникот {employeeName} на работно место {jobPosition} поднесе барање бр. {requestNumber} од {requestDate} година.",
        fields: ['employeeName', 'jobPosition', 'requestNumber', 'requestDate']
      },
      {
        text: "Со барањето работникот бара да му престане работниот однос заклучно со {employmentEndDate} година.",
        fields: ['employmentEndDate']
      },
      {
        text: "Од денот на поднесување на барањето до денот на донесување на ова Решение изминат е отказниот рок согласно Законот за работните односи.",
        fields: []
      },
      {
        text: "Решението е донесено на {decisionDate} година врз основа на член 71 ст.1 од Законот за работни односи.",
        fields: ['decisionDate']
      },
      {
        text: "Против ова решение работникот има право на приговор во рок од 8 дена од приемот до надлежниот орган на друштвото.",
        fields: []
      }
    ]
  },
  bonusPayment: {
    title: "ОДЛУКА ЗА ИСПЛАТА НА РАБОТНА УСПЕШНОСТ - БОНУС",
    sentences: [
      {
        text: "Врз основа на член 105 од Законот за работните односи, [компанија], со седиште на ул. [адреса], со ЕМБС [број], претставувано од Управителот [управител], на ден [датум], ја донесе следната ОДЛУКА за исплата на работна успешност - бонус.",
        fields: []
      },
      {
        text: "Врз основа на оваа одлука, на работникот {employeeName}, вработен во [компанија], на работното место: {employeeWorkPosition} во [компанија], му се определува и додаток на плата за работна успешност (бонус) во износ од {bonusAmount} денари како нето износ.",
        fields: ['employeeName', 'employeeWorkPosition', 'bonusAmount']
      },
      {
        text: "Образложение: Правото на додаток на плата за работна успешност на работникот му се определува земајќи го предвид неговиот домаќински однос, придонесот во квалитетот и обемот на извршената работа, како и во согласност со индивидуалниот придонес на работникот за деловниот успех на работодавачот.",
        fields: []
      },
      {
        text: "Конкретно, бонусот се доделува заради: {bonusReason}.",
        fields: ['bonusReason']
      },
      {
        text: "Следствено на погоре наведеното, работодавачот одлучи како во диспозитивот на оваа Одлука.",
        fields: []
      }
    ]
  },
  employeeDamagesStatement: {
    title: "ИЗЈАВА ЗА СОГЛАСНОСТ ЗА НАМАЛУВАЊЕ НА ПЛАТА ПОРАДИ ПРЕДИЗВИКАНА ШТЕТА",
    sentences: [
      {
        text: "Јас долупотпишаниот/та {employeeName}, работник во [компанија], на работното место {jobPosition}, изјавувам дека се согласувам со намалување на мојата плата поради штетата што ја предизвикав.",
        fields: ['employeeName', 'jobPosition']
      },
      {
        text: "Штетата се состои од: {damageDescription}, во износ од {damageAmount} денари, настаната на ден {statementDate}.",
        fields: ['damageDescription', 'damageAmount', 'statementDate']
      },
      {
        text: "Се согласувам со намалувањето на платата за покривање на штетата согласно со Законот за работни односи.",
        fields: []
      }
    ]
  },
  terminationDueToAgeLimit: {
    title: "ОДЛУКА ЗА ПРЕСТАНОК ПОРАДИ ВОЗРАСНА ГРАНИЦА",
    sentences: [
      {
        text: "Врз основа на член 104 од Законот за работните односи, [компанија] донесува ОДЛУКА за престанок на работниот однос на работникот {employeeName}.",
        fields: ['employeeName']
      },
      {
        text: "Работникот {employeeName}, ЕМБГ {employeePIN}, на работната позиција {jobPosition}, ја достигна возраста од 64 години и има над 15 години пензиски стаж.",
        fields: ['employeeName', 'employeePIN', 'jobPosition']
      },
      {
        text: "Работниот однос престанува на ден {terminationDate} поради исполнување на условите за возрасна граница.",
        fields: ['terminationDate']
      },
      {
        text: "Против оваа одлука работникот има право на приговор во рок од 8 дена од денот на приемот.",
        fields: []
      }
    ]
  },
  mandatoryBonus: {
    title: "РЕГРЕС ЗА ГОДИШЕН ОДМОР - МУЛТИДОКУМЕНТ",
    sentences: [
      {
        text: "🗂️ Документ 1: ОДЛУКА за исплата на регресот за годишен одмор",
        fields: []
      },
      {
        text: "Врз основа на член 35 од Општиот колективен договор, {companyName} на ден {decisionDate} година ја донесе одлуката за исплата на регрес за годишен одмор.",
        fields: ['companyName', 'decisionDate']
      },
      {
        text: "На сите вработени им се утврдува право на исплата на регрес за годишен одмор за {year} година, во висина од {amount},00 денари по вработен.",
        fields: ['year', 'amount']
      },
      {
        text: "📋 Документ 2: ЗАПИСНИК за избор на претставник на вработените",
        fields: []
      },
      {
        text: "Се избира лицето {employeesRepresentative} за претставник на вработените за преговори и договарање на висината на регресот за годишен одмор.",
        fields: ['employeesRepresentative']
      },
      {
        text: "Претставникот е овластен да преговара и потпише спогодба со работодавачот за исплата на регрес во износ од {amount},00 денари по вработен.",
        fields: ['amount']
      },
      {
        text: "📝 Документ 3: СПОГОДБА помеѓу работодавач и претставник на вработените",
        fields: []
      },
      {
        text: "Договорни страни: {companyName} и претставникот на вработените {employeesRepresentative} потпишуваат спогодба за намален регрес.",
        fields: ['companyName', 'employeesRepresentative']
      },
      {
        text: "Износот од {amount},00 денари ќе биде исплатен најдоцна до 31.12.{year} година на сите вработени кои се стекнале со право на регрес.",
        fields: ['amount', 'year']
      },
      {
        text: "📧 Документ 4: БАРАЊЕ за консултација со синдикат на гранка",
        fields: []
      },
      {
        text: "Се испраќа барање за консултација до {employeeUnion} за мислење по однос на донесената одлука за намален регрес.",
        fields: ['employeeUnion']
      },
      {
        text: "Консултацијата е задолжителна согласно член 35 од Општиот колективен договор за приватниот сектор од областа на стопанството.",
        fields: []
      }
    ]
  },
  nda: {
    title: "ДОГОВОР ЗА ДОВЕРЛИВОСТ НА ИНФОРМАЦИИ",
    sentences: [
      {
        text: "Склучен на ден {agreementDate} година, помеѓу првата договорна страна {companyName} и втората договорна страна {secondPartyName}.",
        fields: ['agreementDate', 'companyName', 'secondPartyName']
      },
      {
        text: "Првата договорна страна има седиште на {companyAddress}, додека втората договорна страна има адреса {secondPartyAddress}.",
        fields: ['companyAddress', 'secondPartyAddress']
      },
      {
        text: "Втората договорна страна {secondPartyTaxNumber} има контакт е-маил {contactEmail}.",
        fields: ['secondPartyTaxNumber', 'contactEmail']
      },
      {
        text: "Договорот е од тип {agreementType} и важи {agreementDuration} години од датумот на склучување.",
        fields: ['agreementType', 'agreementDuration']
      },
      {
        text: "Обврската за доверливост продолжува најмалку 5 години по завршување на договорот, независно од неговото времетраење.",
        fields: []
      },
      {
        text: "Договорот опфаќа заштита на сите доверливи информации, технички податоци, деловни стратегии, клиентски листи и интелектуална сопственост.",
        fields: []
      },
      {
        text: "Дополнителни услови: {additionalTerms}.",
        fields: ['additionalTerms']
      }
    ]
  },
  vehicleSalePurchaseAgreement: {
    title: "ДОГОВОР ЗА КУПОПРОДАЖБА НА МОТОРНО ВОЗИЛО",
    sentences: [
      {
        text: "Склучен на ден {contractDate} година во {placeOfSigning}, помеѓу продавачот и купувачот.",
        fields: ['contractDate', 'placeOfSigning']
      },
      {
        text: "Вашата компанија {companyName} во овој договор е {userRole} на возилото.",
        fields: ['companyName', 'userRole']
      },
      {
        text: "Другата договорна страна е {otherPartyType}: {otherPartyName} {otherPartyCompanyName} со адреса {otherPartyAddress}.",
        fields: ['otherPartyType', 'otherPartyName', 'otherPartyCompanyName', 'otherPartyAddress']
      },
      {
        text: "Идентификација на другата страна: ЕМБГ {otherPartyPIN}, ЕДБ {otherPartyTaxNumber}, управител {otherPartyManager}.",
        fields: ['otherPartyPIN', 'otherPartyTaxNumber', 'otherPartyManager']
      },
      {
        text: "Предмет на договорот е {vehicleType} марка {vehicleBrand} {commercialBrand} со број на шасија {chassisNumber}.",
        fields: ['vehicleType', 'vehicleBrand', 'commercialBrand', 'chassisNumber']
      },
      {
        text: "Возилото е произведено во {productionYear} година со регистарски таблички {registrationNumber}.",
        fields: ['productionYear', 'registrationNumber']
      },
      {
        text: "Договорената цена за возилото изнесува {price} денари, со начин на плаќање {paymentMethod} {paymentDate}.",
        fields: ['price', 'paymentMethod', 'paymentDate']
      },
      {
        text: "За спорови надлежен е Основен граѓански суд {competentCourt}.",
        fields: ['competentCourt']
      }
    ]
  },
  personalDataRulebook: {
    title: "ПРАВИЛНИК ЗА ЗАШТИТА НА ДЕЛОВНА ТАЈНА",
    sentences: [
      {
        text: "Правилникот за заштита на деловна тајна на {companyName} стапува на сила на {effectiveDate} година според член 35 од Законот за работни односи.",
        fields: ['companyName', 'effectiveDate']
      },
      {
        text: "Заштитениот производ/услуга {productNameProtected} се смета за деловна тајна и подлежи на строга доверливост.",
        fields: ['productNameProtected']
      },
      {
        text: "Периодот на доверливост по престанок на работниот однос изнесува {confidentialityPeriod} години за заштита на деловните тајни и know-how.",
        fields: ['confidentialityPeriod']
      },
      {
        text: "Под деловна тајна се подразбираат сите внатрешни и надворешни документи, спецификации, финансиски информации, податоци за клиенти и соработници на компанијата.",
        fields: []
      },
      {
        text: "Вработените и раководните лица се должни да обезбедат највисок степен на доверливост на деловните тајни без да овозможат пристап на неовластени лица.",
        fields: []
      },
      {
        text: "При повреда на доверливоста, вработените одговараат материјално за целокупната штета причинета на компанијата.",
        fields: []
      }
    ]
  }
};

const renderLivePreview = ({ formData, company, documentType }) => {
  // Add defensive checks
  if (!formData || typeof formData !== 'object') {
    return (
      <div className={styles.document}>
        <h2 className={styles.title}>[Наслов на документ]</h2>
        <p className={styles.greyedText}>Внесете податоци за да видите преглед на документот...</p>
      </div>
    );
  }
  
  const docTemplate = documentSentences[documentType];
  if (!docTemplate) {
    return (
      <div className={styles.document}>
        <h2 className={styles.title}>[Наслов на документ]</h2>
        <p className={styles.greyedText}>Преглед за овој документ не е достапен...</p>
      </div>
    );
  }
  
  // Get formatted values for fields
  const getFieldValue = (fieldName) => {
    if (fieldName === 'companyName') return company?.companyName || '[Име на компанија]';
    if (fieldName === 'companyAddress') return company?.address || '[Адреса на компанија]';
    
    const value = formData[fieldName];
    if (!value || value === '') return `[${fieldName}]`;
    
    // Format dates
    if (['agreementDate', 'annualLeaveStart', 'annualLeaveEnd', 'sanctionDate', 
         'employeeWrongdoingDate', 'decisionDate', 'contractDate', 'employmentStartDate',
         'employmentEndDate', 'endDate', 'definedDuration', 'fixingDeadline', 
         'warningDate', 'effectiveDate', 'consentDate', 'terminationDate',
         'contractStartDate', 'documentDate', 'violationDate', 'paymentDate'].includes(fieldName)) {
      return formatDate(value);
    }
    
    // Format special fields
    if (fieldName === 'rentPaymentDeadline') {
      const deadlines = {
        '5': 'најдоцна до 5-ти во месецот за тековниот месец',
        '10': 'најдоцна до 10-ти во месецот за тековниот месец', 
        '15': 'најдоцна до 15-ти во месецот за тековниот месец',
        'last': 'најдоцна до последниот ден од месецот',
        '15after': 'во рок од 15 дена по истекот на месецот'
      };
      return deadlines[value] || value;
    }
    
    if (fieldName === 'agreementDurationType') {
      return value === 'неопределено време' ? 'неопределено времетраење' : 
             value === 'определено време' ? 'определено времетраење' : value;
    }
    
    // Handle rent agreement and vehicle agreement specific fields
    if (fieldName === 'userRole') {
      if (value === 'landlord') return 'закуподавач';
      if (value === 'tenant') return 'закупец';
      if (value === 'seller') return 'продавач';
      if (value === 'buyer') return 'купувач';
      return value;
    }
    
    if (fieldName === 'otherPartyType') {
      if (value === 'individual' || value === 'natural') return 'физичко лице';
      if (value === 'company') return 'правно лице (компанија)';
      return value;
    }
    
    // Handle vehicle agreement specific fields
    if (fieldName === 'paymentMethod') {
      if (value === 'notary_day') return 'на денот на заверката кај нотар';
      if (value === 'custom_date') return 'на определен датум';
      return value;
    }
    
    if (fieldName === 'includesVAT') {
      return value === true ? '(со ДДВ)' : value === false ? '(без ДДВ)' : '';
    }
    
    if (fieldName === 'requiresDeposit') {
      return value === true ? 'се плаќа депозит' : value === false ? 'не се плаќа депозит' : '';
    }
    
    if (fieldName === 'requiresInsurance') {
      return value === true ? 'задолжително' : value === false ? 'не е задолжително' : '';
    }
    
    if (fieldName === 'allowsQuarterlyInspection') {
      return value === true ? 'дозволена' : value === false ? 'не е дозволена' : '';
    }
    
    if (fieldName === 'hasAnnualIncrease') {
      return value === true ? 'со годишно зголемување' : value === false ? 'без годишно зголемување' : '';
    }
    
    if (fieldName === 'durationType') {
      return value === 'определено' ? 'определено' : value === 'неопределено' ? 'неопределено' : value;
    }
    
    // Handle NDA specific fields
    if (fieldName === 'agreementType') {
      return value === 'bilateral' ? 'двострана доверливост' : 
             value === 'unilateral' ? 'еднострана доверливост' : value;
    }
    
    if (fieldName === 'secondPartyTaxNumber') {
      return value ? `со ЕДБ ${value}` : '';
    }
    
    if (fieldName === 'contactEmail') {
      return value ? `е-маил: ${value}` : '';
    }
    
    // Handle mandatory bonus specific fields
    if (fieldName === 'employeeUnion') {
      if (!value) return '[Назив на синдикат]';
      // Parse the union value (format: "Name|Address")
      const unionData = value.split('|');
      return unionData[0] || value; // Return just the name for preview
    }
    
    // Handle employment agreement specific fields
    if (fieldName === 'workTasks' && Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (fieldName === 'placeOfWork') {
      return value === 'company_premises' ? 'во просториите на компанијата' : 
             value === 'other' ? 'на друго место' : value || '';
    }
    
    if (fieldName === 'dailyWorkTime') {
      return value === 'standard' ? 'стандардно работно време (8 часа)' :
             value === 'flexible' ? 'флексибилно работно време' :
             value === 'other' ? 'друго работно време' : value || '';
    }
    
    if (fieldName === 'concurrentClause') {
      return value === 'yes' ? 'се применува' : value === 'no' ? 'не се применува' : value || '';
    }
    
    // Handle additional employment document fields
    if (fieldName === 'changeType') {
      const types = {
        'salary': 'промена на плата',
        'position': 'промена на работна позиција', 
        'duration': 'промена на времетраење',
        'worktime': 'промена на работно време',
        'other': 'друга промена'
      };
      return types[value] || value || '';
    }
    
    // Handle personal data protection fields
    if (fieldName === 'purposes' && Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (fieldName === 'retentionPeriod') {
      return value ? `${value} години` : '';
    }
    
    // Handle termination due to fault specific fields
    if (fieldName === 'terminationType') {
      const types = {
        'with_notice': 'со отказен рок од 30 дена (член 81)',
        'without_notice': 'без отказен рок - итно (член 82)'
      };
      return types[value] || value || '';
    }
    
    if (fieldName === 'faultCategory') {
      const categories = {
        'minor': 'помали прекршувања',
        'serious': 'сериозни прекршувања',
        'gross': 'груби прекршувања',
        'trust': 'повреда на довербата',
        'criminal': 'кривична активност',
        'repeated': 'повторувани прекршувања'
      };
      return categories[value] || value || '';
    }
    
    if (fieldName === 'evidenceTypes' && Array.isArray(value)) {
      const evidenceLabels = {
        'witness': 'сведочења',
        'documents': 'документи',
        'video': 'видео снимки',
        'photos': 'фотографии',
        'records': 'записи',
        'reports': 'извештаи',
        'other': 'други докази'
      };
      return value.map(type => evidenceLabels[type] || type).join(', ');
    }
    
    return String(value || '');
  };
  
  // Render sentence with live highlighting
  const renderSentence = (sentence, index) => {
    let text = sentence.text;
    const parts = [];
    let lastIndex = 0;
    
    // Process each field in the sentence
    sentence.fields.forEach(field => {
      const placeholder = `{${field}}`;
      const placeholderIndex = text.indexOf(placeholder, lastIndex);
      
      if (placeholderIndex !== -1) {
        // Add text before placeholder (grayed)
        if (placeholderIndex > lastIndex) {
          const beforeText = text.substring(lastIndex, placeholderIndex);
          parts.push(
            <span key={`before-${field}-${index}`} className={styles.greyedText}>
              {beforeText}
            </span>
          );
        }
        
        // Add the field value (highlighted if user input exists)
        const value = getFieldValue(field);
        const hasUserInput = formData[field] || (field === 'companyName' && company?.companyName) || (field === 'companyAddress' && company?.address);
        
        if (hasUserInput && value && !String(value).startsWith('[')) {
          parts.push(
            <span key={`value-${field}-${index}`} className={styles.highlightedInput}>
              {value}
            </span>
          );
        } else {
          parts.push(
            <span key={`placeholder-${field}-${index}`} className={styles.greyedText}>
              {value}
            </span>
          );
        }
        
        lastIndex = placeholderIndex + placeholder.length;
      }
    });
    
    // Add remaining text (grayed)
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      parts.push(
        <span key={`remaining-${index}`} className={styles.greyedText}>
          {remainingText}
        </span>
      );
    }
    
    return parts;
  };
  
  return (
    <div className={styles.document}>
      <h2 className={styles.title}>{docTemplate.title}</h2>
      
      <div className={styles.companyInfo}>
        <p className={styles.greyedText}>
          Друштво: <span className={styles.highlightedInput}>{company?.companyName || '[Име на компанија]'}</span>
        </p>
        <p className={styles.greyedText}>
          Адреса: <span className={styles.highlightedInput}>{company?.address || '[Адреса на компанија]'}</span>
        </p>
        <p className={styles.greyedText}>
          ЕДБ: <span className={styles.highlightedInput}>{company?.taxNumber || '[ЕДБ број]'}</span>
        </p>
      </div>
      
      <div className={styles.sentencePreview}>
        {docTemplate.sentences.map((sentence, index) => (
          <p key={index} className={styles.previewSentence}>
            {renderSentence(sentence, index)}
          </p>
        ))}
      </div>
    </div>
  );
};

const DocumentPreview = ({ formData, documentType, currentStep }) => {
  const { currentUser } = useAuth();
  const company = currentUser?.companyInfo || {};

  if (!currentUser) {
    return <div className={styles.previewContainer}><p>Ве молиме најавете се за да ги видите деталите за компанијата.</p></div>;
  }

  // Add default values if formData is not provided
  const safeFormData = formData || {};

  return (
    <div className={styles.previewContainer}>
      {renderLivePreview({ formData: safeFormData, company, documentType })}
    </div>
  );
};

export default DocumentPreview;

