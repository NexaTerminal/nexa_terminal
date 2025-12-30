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
  bonusDecision: "ОДЛУКА ЗА ДОДЕЛУВАЊЕ БОНУС",
  deathCompensationDecision: "ОДЛУКА ЗА ИСПЛАТА НА НАДОМЕСТ ВО СЛУЧАЈ НА СМРТ НА ЧЛЕН НА СЕМЕЈНО ДОМАЌИНСТВО",
  unpaidLeaveDecision: "ОДЛУКА ЗА НЕПЛАТЕНО ОТСУСТВО",

  // Personal Data Protection
  consentForPersonalDataProcessing: "СОГЛАСНОСТ ЗА ОБРАБОТКА НА ЛИЧНИ ПОДАТОЦИ",
  politicsForDataProtection: "ПОЛИТИКА ЗА ЗАШТИТА НА ЛИЧНИ ПОДАТОЦИ",
  gdprCompanyPolitics: "ПОЛИТИКА ЗА АДМИНИСТРИРАЊЕ СО ПРАВАТА НА СУБЈЕКТИТЕ НА ПЕРСОНАЛНИ ПОДАТОЦИ",
  procedureForEstimation: "ПРОЦЕДУРА ЗА ПРОЦЕНКА НА ВЛИЈАНИЕТО ВРЗ ЗАШТИТАТА НА ЛИЧНИТЕ ПОДАТОЦИ И УПРАВУВАЊЕ СО РИЗИК",

  // Contracts
  rentAgreement: "ДОГОВОР ЗА ЗАКУП НА НЕДВИЖЕН ИМОТ",
  nda: "ДОГОВОР ЗА ДОВЕРЛИВОСТ НА ИНФОРМАЦИИ",
  mediationAgreement: "ДОГОВОР ЗА ПОСРЕДУВАЊЕ",
  employeeDamagesStatement: "ИЗЈАВА ЗА СОГЛАСНОСТ ЗА НАМАЛУВАЊЕ НА ПЛАТА ПОРАДИ ПРЕДИЗВИКАНА ШТЕТА",
  terminationDueToAgeLimit: "ОДЛУКА ЗА ПРЕСТАНОК ПОРАДИ ВОЗРАСНА ГРАНИЦА",
  
  // Obligations
  vehicleSalePurchaseAgreement: "ДОГОВОР ЗА КУПОПРОДАЖБА НА МОТОРНО ВОЗИЛО",
  debtAssumptionAgreement: "ДОГОВОР ЗА ПРЕЗЕМАЊЕ НА ДОЛГ",
  saasAgreement: "ДОГОВОР ЗА СОФТВЕР КАКО УСЛУГА (SaaS Agreement)",

  // Rulebooks
  personalDataRulebook: "ПРАВИЛНИК ЗА ЗАШТИТА НА ДЕЛОВНА ТАЈНА",

  // Accounting Documents
  cashRegisterMaximumDecision: "ОДЛУКА ЗА БЛАГАЈНИЧКИ МАКСИМУМ",
  invoiceSigningAuthorization: "ОВЛАСТУВАЊЕ ЗА ПОТПИШУВАЊЕ ФАКТУРИ",
  writeOffDecision: "ОДЛУКА ЗА ОТПИС",
  dividendPaymentDecision: "ОДЛУКА ЗА ИСПЛАТА НА ДИВИДЕНДА",
  annualAccountsAdoption: "ОДЛУКА ЗА УСВОЈУВАЊЕ НА ГОДИШНАТА СМЕТКА",

  // Other Business Documents
  employeeStockPurchasePlan: "ПЛАН ЗА КУПУВАЊЕ АКЦИИ ОД СТРАНА НА ВРАБОТЕНИ (ESPP)",
  masterServicesAgreement: "РАМКОВЕН ДОГОВОР ЗА УСЛУГИ (Master Services Agreement)",

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
        text: "Договорот за вработување е склучен на {agreementDurationType}.",
        fields: ['agreementDurationType']
      },
      {
        text: "Договорот престанува да важи на {definedDuration}.",
        fields: ['definedDuration'],
        condition: (formData) => formData.agreementDurationType === 'определено времетраење'
      },
      {
        text: "Конкурентска клаузула важи до {concurrentClauseDuration} со месечен надоместок од {concurrentClauseCompensation} денари.",
        fields: ['concurrentClauseDuration', 'concurrentClauseCompensation'],
        condition: (formData) => formData.concurrentClause === true
      },
      {
        text: "Дополнителни услови: {concurrentClauseInput}",
        fields: ['concurrentClauseInput'],
        condition: (formData) => formData.concurrentClauseInput && formData.concurrentClauseInput.trim() !== ''
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
  unpaidLeaveDecision: {
    title: "ОДЛУКА ЗА НЕПЛАТЕНО ОТСУСТВО",
    sentences: [
      {
        text: "На работникот {employeeName} му се одобрува неплатено отсуство од работа во траење од {unpaidLeaveDuration} месеци.",
        fields: ['employeeName', 'unpaidLeaveDuration']
      },
      {
        text: "Неплатеното отсуство почнува од {startingDate} година и работникот се враќа на работа на {startingWorkDate} година.",
        fields: ['startingDate', 'startingWorkDate']
      },
      {
        text: "За време на неплатеното отсуство на работникот нема да му се исплатува надомест на плата и придонеси.",
        fields: []
      },
      {
        text: "За време на неплатеното отсуство на работникот му мируваат правата и обврските од работен однос.",
        fields: []
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
  politicsForDataProtection: {
    title: "ПОЛИТИКА ЗА ЗАШТИТА НА ЛИЧНИ ПОДАТОЦИ",
    sentences: [
      {
        text: "Компанијата {companyName} усвојува политика за заштита на лични податоци која влегува во сила на {effectiveDate}.",
        fields: ['companyName', 'effectiveDate']
      },
      {
        text: "Политиката се однесува на {dataGroups} категории на лични податоци кои се обработуваат во рамки на деловната активност.",
        fields: ['dataGroups']
      },
      {
        text: "Обработката се врши согласно GDPR и македонската регулатива за заштита на лични податоци.",
        fields: []
      },
      {
        text: "Субјектите на податоци имаат право на пристап, исправка, бришење и преносливост на своите лични податоци.",
        fields: []
      },
      {
        text: "За контакт во врска со заштитата на лични податоци: {companyName} на {companyAddress}.",
        fields: ['companyName', 'companyAddress']
      }
    ]
  },
  terminationDueToFault: {
    title: "РЕШЕНИЕ ЗА ОТКАЖУВАЊЕ НА ДОГОВОРОТ ЗА ВРАБОТУВАЊЕ",
    sentences: [
      {
        text: "Согласно {articleCase} од Законот за работни односи, {companyName} донесе следнава одлука:",
        fields: ['articleCase', 'companyName']
      },
      {
        text: "На работникот {employeeName}, вработен во {companyName}, на работното место: {jobPosition}, МУ СЕ ОТКАЖУВА ДОГОВОРОТ ЗА ВРАБОТУВАЊЕ и му престанува работниот однос поради кршење на работниот ред и дисциплина и работните обврски.",
        fields: ['employeeName', 'companyName', 'jobPosition']
      },
      {
        text: "Фактичка ситуација: {factualSituation}",
        fields: ['factualSituation']
      },
      {
        text: "Образложение: Работникот е ангажиран кај работодавачот врз основа на Договорот за вработување. Врз основа на утврдената фактичка состојба, работниот однос престанува поради вина на работникот.",
        fields: []
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
  bonusDecision: {
    title: "ОДЛУКА ЗА ДОДЕЛУВАЊЕ БОНУС",
    sentences: [
      {
        text: "Врз основа на член 105 од Законот за работните односи, [компанија], со седиште на ул. [адреса], со ЕМБС [број], претставувано од Управителот [управител], на ден [датум], ја донесе следната ОДЛУКА за доделување бонус.",
        fields: []
      },
      {
        text: "Член 1: Со оваа одлука, на работникот {employeeName}, вработен во [компанија], на работното место: {employeeWorkPosition}, му се доделува бонус во износ од {bonusAmount} денари како нето износ.",
        fields: ['employeeName', 'employeeWorkPosition', 'bonusAmount']
      },
      {
        text: "Член 2: Оваа одлука влегува во сила на ден {effectiveDate}.",
        fields: ['effectiveDate']
      },
      {
        text: "Член 3: Оваа одлука се применува веднаш и се доставува до работникот за известување.",
        fields: []
      },
      {
        text: "Образложение: Правото на бонус на работникот му се определува земајќи го предвид неговиот домаќински однос, придонесот во квалитетот и обемот на извршената работа, како и во согласност со индивидуалниот придонес на работникот за деловниот успех на работодавачот.",
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
  saasAgreement: {
    title: "ДОГОВОР ЗА СОФТВЕР КАКО УСЛУГА (SaaS Agreement)",
    sentences: [
      {
        text: "Договорот е склучен на ден {agreementDate} година помеѓу давателот на услуга и клиентот.",
        fields: ['agreementDate']
      },
      {
        text: "Вашата компанија {companyName} во овој договор е {userRole} на софтверската услуга.",
        fields: ['companyName', 'userRole']
      },
      {
        text: "Услугата која се обезбедува е {serviceName} – {serviceDescription} достапна на {serviceURL}.",
        fields: ['serviceName', 'serviceDescription', 'serviceURL']
      },
      {
        text: "Месечниот претплатен надоместок изнесува {subscriptionFee} {currency} {includesVAT}, плаќање до {paymentDay}-ти во месецот.",
        fields: ['subscriptionFee', 'currency', 'includesVAT', 'paymentDay']
      },
      {
        text: "Уплатата се врши на трансакциска сметка {bankAccount} кај {bankName}.",
        fields: ['bankAccount', 'bankName']
      },
      {
        text: "Системската достапност е минимум {systemAvailability}% месечно, со техничка поддршка во {supportHours}.",
        fields: ['systemAvailability', 'supportHours']
      },
      {
        text: "Договорот е склучен на {durationType} времетраење со отказен рок од {terminationNoticeDays} дена.",
        fields: ['durationType', 'terminationNoticeDays']
      },
      {
        text: "Договорот влегува во сила на {effectiveDateType} и е составен во согласност со законите на Република Северна Македонија.",
        fields: ['effectiveDateType']
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
  },
  mediationAgreement: {
    title: "ДОГОВОР ЗА ПОСРЕДУВАЊЕ (чл. 869-882 ЗОО)",
    sentences: [
      {
        text: "На ден {agreementDate} година се склучи следниот договор за посредување помеѓу посредникот и налогодавецот согласно членови 869-882 од Законот за облигациони односи.",
        fields: ['agreementDate']
      },
      {
        text: "Ваша улога во договорот: {userRole} според член 869 од ЗОО.",
        fields: ['userRole']
      },
      {
        text: "Посредник: {mediatorName} со седиште на {mediatorAddress}, ЕДБ број {mediatorTaxNumber}, претставуван од {mediatorManager}.",
        fields: ['mediatorName', 'mediatorAddress', 'mediatorTaxNumber', 'mediatorManager']
      },
      {
        text: "Контакт информации на посредникот: телефон {mediatorPhone}, е-пошта {mediatorEmail}.",
        fields: ['mediatorPhone', 'mediatorEmail']
      },
      {
        text: "Налогодавец: {clientName} со адреса {clientAddress}, идентификација {clientPin} {clientTaxNumber}.",
        fields: ['clientName', 'clientAddress', 'clientPin', 'clientTaxNumber']
      },
      {
        text: "Управител на налогодавецот: {clientManager}, контакт {clientPhone}, е-пошта {clientEmail}.",
        fields: ['clientManager', 'clientPhone', 'clientEmail']
      },
      {
        text: "Договорот е склучен за времетраење од {agreementDuration} на територија {territoryScope}.",
        fields: ['agreementDuration', 'territoryScope']
      },
      {
        text: "Тип на посредување: {typeOfMediation} за склучување на {specificContractType} согласно член 870 од ЗОО.",
        fields: ['typeOfMediation', 'specificContractType']
      },
      {
        text: "Очекувана вредност на договорот: {targetContractValueRange}.",
        fields: ['targetContractValueRange']
      },
      {
        text: "Стапка на комисија: {commissionRate}% пресметана како {commissionCalculation}.",
        fields: ['commissionRate', 'commissionCalculation']
      },
      {
        text: "Фиксен износ на комисија: {fixedCommissionAmount} денари (кога е применливо).",
        fields: ['fixedCommissionAmount']
      },
      {
        text: "Минимална комисија: {minimumCommission} денари, максимална комисија: {maximumCommission} денари.",
        fields: ['minimumCommission', 'maximumCommission']
      },
      {
        text: "Време на плаќање на комисијата: {paymentTiming} согласно член 878-879 од ЗОО.",
        fields: ['paymentTiming']
      },
      {
        text: "Надоместување на трошоци: {costReimbursement} вклучувајќи патувања {travelCostsIncluded}, реклами {advertisementCostsIncluded}, правни консултации {legalConsultationCostsIncluded}.",
        fields: ['costReimbursement', 'travelCostsIncluded', 'advertisementCostsIncluded', 'legalConsultationCostsIncluded']
      },
      {
        text: "Период на доверливост: {confidentialityPeriod} по престанокот на договорот согласно член 876 од ЗОО.",
        fields: ['confidentialityPeriod']
      },
      {
        text: "Водење дневник на посредување: {mediatorDiaryRequired} (законски задолжително според член 877).",
        fields: ['mediatorDiaryRequired']
      },
      {
        text: "Писмено овластување за примање исполнување: {writtenAuthorizationForPerformance} согласно член 871 од ЗОО.",
        fields: ['writtenAuthorizationForPerformance']
      },
      {
        text: "Ексклузивно посредување: {exclusiveMediation}, двојно застапување: {dualRepresentationAllowed} (член 881 од ЗОО).",
        fields: ['exclusiveMediation', 'dualRepresentationAllowed']
      },
      {
        text: "Отказен рок за престанок на налогот: {earlyTerminationNoticePeriod} согласно член 872 од ЗОО.",
        fields: ['earlyTerminationNoticePeriod']
      },
      {
        text: "Решавање на спорови: {disputeResolution} согласно македонското законодавство.",
        fields: ['disputeResolution']
      },
      {
        text: "Правни обврски: Посредникот се обврзува на грижа на добар деловен човек (член 874), водење дневник (член 877), и доверливост (член 876).",
        fields: []
      },
      {
        text: "Права на налогодавецот: Право на отповик на налогот во секое време (член 872) и нема обврска да склучи договор (член 873).",
        fields: []
      },
      {
        text: "Губење право на надоместок: Кога посредникот работи против интересите на налогодавецот (член 882).",
        fields: []
      }
    ]
  },
  gdprCompanyPolitics: {
    title: "ПОЛИТИКА ЗА АДМИНИСТРИРАЊЕ СО ПРАВАТА НА СУБЈЕКТИТЕ НА ПЕРСОНАЛНИ ПОДАТОЦИ",
    sentences: [
      {
        text: "📋 ОСНОВИ НА ОБРАБОТКА: Врз основа на Законот за заштита на личните податоци, {companyName} со седиште на {companyAddress} и ЕДБ {companyTaxNumber} на датум {adoptionDate} ја усвои следната политика.",
        fields: ['companyName', 'companyAddress', 'companyTaxNumber', 'adoptionDate']
      },
      {
        text: "🏢 ДЕЛОВНА АКТИВНОСТ: Компанијата се занимава со {primaryBusinessActivity} и извршува {dataProcessingComplexity} на обработка на персонални податоци.",
        fields: ['primaryBusinessActivity', 'dataProcessingComplexity']
      },
      {
        text: "🔐 СПЕЦИЈАЛНИ ПОДАТОЦИ: {processesSpecialCategories|Обработува специјални категории персонални податоци|Не обработува специјални категории персонални податоци} {sensitiveDataProcessing}.",
        fields: ['processesSpecialCategories', 'sensitiveDataProcessing']
      },
      {
        text: "🤖 АВТОМАТИЗИРАНИ ОДЛУКИ: {usesAutomatedDecisionMaking|Користи автоматизирано донесување одлуки|Не користи автоматизирано донесување одлуки} {automatedDecisionTypes}.",
        fields: ['usesAutomatedDecisionMaking', 'automatedDecisionTypes']
      },
      {
        text: "📢 ДИРЕКТЕН МАРКЕТИНГ: {performsDirectMarketing|Извршува директни маркетиншки активности|Не извршува директни маркетиншки активности} преку каналите {marketingChannels}.",
        fields: ['performsDirectMarketing', 'marketingChannels']
      },
      {
        text: "🌍 МЕЃУНАРОДНИ ТРАНСФЕРИ: {hasInternationalTransfers|Извршува меѓународни трансфери на податоци|Не извршува меѓународни трансфери на податоци}.",
        fields: ['hasInternationalTransfers']
      },
      {
        text: "📊 ТИПОВИ ПОДАТОЦИ И ПРАВА: Обработуваме следните категории персонални податоци: {personalDataCategories}.",
        fields: ['personalDataCategories']
      },
      {
        text: "↔️ ПОРТАБИЛНОСТ НА ПОДАТОЦИ: {dataPortabilityApplicable|Правото на портабилност е применливо|Правото на портабилност не е применливо} за нашите процеси на обработка.",
        fields: ['dataPortabilityApplicable']
      },
      {
        text: "🤝 СПОДЕЛУВАЊЕ СО ТРЕТИ СТРАНИ: {sharesDataWithThirdParties|Споделуваме податоци со трети страни|Не споделуваме податоци со трети страни} {typicalDataRecipients}.",
        fields: ['sharesDataWithThirdParties', 'typicalDataRecipients']
      },
      {
        text: "📝 НАЧИНИ НА ПОДНЕСУВАЊЕ: Субјектите можат да поднесуваат барања преку: {allowEmailSubmission|е-пошта|} {allowPostalSubmission|пошта|} {allowInPersonSubmission|лично посетување|} {allowOnlinePortalSubmission|онлајн портал|}.",
        fields: ['allowEmailSubmission', 'allowPostalSubmission', 'allowInPersonSubmission', 'allowOnlinePortalSubmission']
      },
      {
        text: "🆔 ВЕРИФИКАЦИЈА НА ИДЕНТИТЕТ: Применуваме {identityVerificationLevel} за потврдување на идентитетот на субјектите пред обработка на барањата.",
        fields: ['identityVerificationLevel']
      },
      {
        text: "⏱️ ВРЕМЕ ЗА ОДГОВОР: Стандардното време за одговор на барањата изнесува {standardResponseTime} {complexRequestExtension|со можност за продолжување за комплексни барања|без можност за продолжување}.",
        fields: ['standardResponseTime', 'complexRequestExtension']
      },
      {
        text: "👤 ОФИЦЕР ЗА ЗАШТИТА НА ЛИЧНИ ПОДАТОЦИ: {hasDedicatedDPO|Имаме назначено ОФЗЛП|Немаме назначено ОФЗЛП} {companyDPO} ({dpoIsInternal|интерен вработен|надворешен консултант}) со контакт {companyDPOemail} и телефон {companyDPOphone}.",
        fields: ['hasDedicatedDPO', 'companyDPO', 'dpoIsInternal', 'companyDPOemail', 'companyDPOphone']
      },
      {
        text: "🏢 ОДГОВОРНОСТ И КОНТАКТ: За управување со барањата одговара {responsibleDepartment}, контакт е-пошта: {companyEmail}, достапни во работно време {businessHours}.",
        fields: ['responsibleDepartment', 'companyEmail', 'businessHours']
      },
      {
        text: "🌐 ЈАЗИЦИ ЗА КОМУНИКАЦИЈА: Комуницираме на следните јазици: {preferredContactLanguages}.",
        fields: ['preferredContactLanguages']
      },
      {
        text: "📋 ЦЕНТРАЛИЗИРАН РЕГИСТАР: {usesCentralizedRegistry|Користиме централизиран регистар|Не користиме централизиран регистар} за следење на сите барања од субјектите.",
        fields: ['usesCentralizedRegistry']
      },
      {
        text: "🎓 ЕДУКАЦИЈА НА ПЕРСОНАЛ: Спроведуваме {staffTrainingLevel} за сите вработени за правилно постапување со барањата на субјектите.",
        fields: ['staffTrainingLevel']
      },
      {
        text: "🔄 АЖУРИРАЊЕ НА ПОЛИТИКАТА: Политиката се ажурира {policyUpdateFrequency} за да се обезбеди усогласеност со актуелните законски барања.",
        fields: ['policyUpdateFrequency']
      },
      {
        text: "✅ МОНИТОРИНГ НА УСОГЛАСЕНОСТА: Спроведуваме {complianceMonitoring} за следење на ефикасноста на политиката и процедурите.",
        fields: ['complianceMonitoring']
      }
    ]
  },
  procedureForEstimation: {
    title: "ПРОЦЕДУРА ЗА ПРОЦЕНКА НА ВЛИЈАНИЕТО ВРЗ ЗАШТИТАТА НА ЛИЧНИТЕ ПОДАТОЦИ И УПРАВУВАЊЕ СО РИЗИК",
    sentences: [
      {
        text: "📊 ОСНОВИ НА ПРОЦЕДУРАТА: Врз основа на Законот за заштита на личните податоци, {companyName} со седиште на {companyAddress} и ЕДБ {companyTaxNumber} на ден {dpiaDate} ја донесе следната процедура.",
        fields: ['companyName', 'companyAddress', 'companyTaxNumber', 'dpiaDate']
      },
      {
        text: "🎯 ТИП НА ПРОЦЕНКА: Оваа процедура се применува за {assessmentType} според критериумите предвидени во законската регулатива.",
        fields: ['assessmentType']
      },
      {
        text: "📝 ЦЕЛ НА ОБРАБОТКАТА: {processingPurpose} за категориите субјекти: {dataSubjects}.",
        fields: ['processingPurpose', 'dataSubjects']
      },
      {
        text: "🔐 КАТЕГОРИИ ПОДАТОЦИ: Се обработуваат следните категории лични податоци: {dataCategories}.",
        fields: ['dataCategories']
      },
      {
        text: "⚠️ РИЗИК ПРОЦЕНКА: Веројатност за појава ({probability}) х Ниво на влијание ({impactLevel}) = {riskLevel} ризик.",
        fields: ['probability', 'impactLevel', 'riskLevel']
      },
      {
        text: "🛡️ ТЕХНИЧКИ МЕРКИ: Имплементирани се следните технички мерки: {technicalMeasures}.",
        fields: ['technicalMeasures']
      },
      {
        text: "📋 ОРГАНИЗАЦИСКИ МЕРКИ: Применувани се следните организациски мерки: {organizationalMeasures}.",
        fields: ['organizationalMeasures']
      },
      {
        text: "👤 ОДГОВОРНО ЛИЦЕ: {responsiblePerson} е одговорен за спроведување на процедурата и редовно преиспитување {reviewFrequency}.",
        fields: ['responsiblePerson', 'reviewFrequency']
      },
      {
        text: "⏰ ВРЕМЕНСКА РАМКА: Мерките за ублажување ќе се имплементираат во рок од {implementationTimeline}.",
        fields: ['implementationTimeline']
      },
      {
        text: "🏛️ КОНСУЛТАЦИЈА СО АЗЛП: {consultationRequired|Потребна е консултација со Агенцијата за заштита на личните податоци|Не е потребна консултација со АЗЛП}.",
        fields: ['consultationRequired']
      }
    ]
  },
  businessSecretRulebook: {
    title: "ПРАВИЛНИК ЗА ЗАШТИТА НА ДЕЛОВНА ТАЈНА",
    sentences: [
      {
        text: "📋 ОСНОВИ НА ПРАВИЛНИКОТ: Врз основа на член 35 од Законот за работни односи, {companyName} со седиште на {companyAddress} и ЕДБ {companyTaxNumber} на датум {effectiveDate} го донесе следниот правилник за заштита на деловна тајна.",
        fields: ['companyName', 'companyAddress', 'companyTaxNumber', 'effectiveDate']
      },
      {
        text: "🔐 ЗАШТИТЕНИ ИНФОРМАЦИИ: Компанијата заштитува информации поврзани со {productNameProtected} кои се сметаат за деловна тајна и know-how на компанијата.",
        fields: ['productNameProtected'],
        condition: (formData) => formData.productNameProtected
      },
      {
        text: "⏱️ ПЕРИОД НА ДОВЕРЛИВОСТ: Вработените се обврзани да чуваат доверливост за период од {confidentialityPeriod} години по престанок на работниот однос.",
        fields: ['confidentialityPeriod']
      },
      {
        text: "🛡️ ФИЗИЧКА БЕЗБЕДНОСТ: Компанијата применува зајакната физичка безбедност за документи што содржат деловна тајна.",
        fields: [],
        condition: (formData) => formData.additionalProtections?.includes('physicalSecurity')
      },
      {
        text: "💻 ДИГИТАЛНА БЕЗБЕДНОСТ: Имплементирани се дополнителни мерки за заштита на електронски документи што содржат доверливи информации.",
        fields: [],
        condition: (formData) => formData.additionalProtections?.includes('digitalSecurity')
      },
      {
        text: "🔒 КОНТРОЛА НА ПРИСТАП: Пристапот до деловни тајни е ограничен според оддели и потребите на работните позиции.",
        fields: [],
        condition: (formData) => formData.additionalProtections?.includes('accessControl')
      },
      {
        text: "📝 ДОГОВОРИ ЗА ДОВЕРЛИВОСТ: Компанијата склучува задолжителни договори за доверливост (NDA) со сите трети лица кои доаѓаат во контакт со деловни тајни.",
        fields: [],
        condition: (formData) => formData.additionalProtections?.includes('ndaRequired')
      },
      {
        text: "⚠️ САНКЦИИ: Повредата на обврската за чување на деловна тајна претставува тежок прекршок на работните обврски и може да биде основ за престанок на работниот однос со отказ.",
        fields: []
      },
      {
        text: "📢 ВАЖНОСТ: Овој правилник влегува во сила на денот на донесувањето и се применува на сите вработени во компанијата.",
        fields: []
      }
    ]
  },
  debtAssumptionAgreement: {
    title: "ДОГОВОР ЗА ПРЕЗЕМАЊЕ НА ДОЛГ",
    sentences: [
      {
        text: "📋 ОСНОВНИ ПОДАТОЦИ: Договорот е склучен на {contractDate} година, во {contractTown}.",
        fields: ['contractDate', 'contractTown']
      },
      {
        text: "🏢 ВАШАТА УЛОГА: Вашата компанија {companyName} во овој договор е {userRole|creditor:ДОВЕРИТЕЛ|debtor:ПРВИЧЕН ДОЛЖНИК|third_party:ПРЕЗЕМАЧ НА ДОЛГ}.",
        fields: ['companyName', 'userRole']
      },
      {
        text: "👤 ДОВЕРИТЕЛ: {userRole|creditor:Вашата компанија|originalCreditorName} {originalCreditorCompanyName} со адреса {originalCreditorAddress} {originalCreditorCompanyAddress}.",
        fields: ['userRole', 'originalCreditorName', 'originalCreditorCompanyName', 'originalCreditorAddress', 'originalCreditorCompanyAddress']
      },
      {
        text: "🔢 ЕМБГ/ДАНОЧЕН БРОЈ НА ДОВЕРИТЕЛ: {originalCreditorPIN} {originalCreditorCompanyTaxNumber}, управител: {originalCreditorCompanyManager}.",
        fields: ['originalCreditorPIN', 'originalCreditorCompanyTaxNumber', 'originalCreditorCompanyManager']
      },
      {
        text: "💼 ПРВИЧЕН ДОЛЖНИК: {userRole|debtor:Вашата компанија|originalDebtorName} {originalDebtorCompanyName} со адреса {originalDebtorAddress} {originalDebtorCompanyAddress}.",
        fields: ['userRole', 'originalDebtorName', 'originalDebtorCompanyName', 'originalDebtorAddress', 'originalDebtorCompanyAddress']
      },
      {
        text: "🔢 ЕМБГ/ДАНОЧЕН БРОЈ НА ПРВИЧЕН ДОЛЖНИК: {originalDebtorPIN} {originalDebtorCompanyTaxNumber}, управител: {originalDebtorCompanyManager}.",
        fields: ['originalDebtorPIN', 'originalDebtorCompanyTaxNumber', 'originalDebtorCompanyManager']
      },
      {
        text: "🤝 ПРЕЗЕМАЧ НА ДОЛГ: {userRole|third_party:Вашата компанија|assumingPartyName} {assumingPartyCompanyName} {otherPartyType|individual:физичко лице|company:правно лице}.",
        fields: ['userRole', 'assumingPartyName', 'assumingPartyCompanyName', 'otherPartyType']
      },
      {
        text: "🏠 АДРЕСА НА ПРЕЗЕМАЧ: {assumingPartyAddress} {assumingPartyCompanyAddress}, ЕМБГ/даночен број: {assumingPartyPIN} {assumingPartyCompanyTaxNumber}.",
        fields: ['assumingPartyAddress', 'assumingPartyCompanyAddress', 'assumingPartyPIN', 'assumingPartyCompanyTaxNumber']
      },
      {
        text: "💰 ИЗНОС НА ДОЛГОТ: {debtAmount} {debtCurrency|МКД:денари|EUR:евра|USD:долари} што се презема од првичниот должник.",
        fields: ['debtAmount', 'debtCurrency']
      },
      {
        text: "📝 ОПИС НА ДОЛГОТ: {debtDescription}.",
        fields: ['debtDescription']
      },
      {
        text: "📄 ПРВИЧЕН ДОГОВОР: Број {originalContractNumber}, датум {originalContractDate}, доспевање на {dueDate}.",
        fields: ['originalContractNumber', 'originalContractDate', 'dueDate']
      },
      {
        text: "⚖️ ТИП НА ПРЕЗЕМАЊЕ: {assumptionType|full:Целосно преземање на долгот|partial:Делумно преземање на долгот}.",
        fields: ['assumptionType']
      },
      {
        text: "🔓 СТАТУС НА ПРВИЧЕН ДОЛЖНИК: {releaseOriginalDebtor|true:Се ослободува од обврската|false:Останува солидарно одговорен}.",
        fields: ['releaseOriginalDebtor']
      },
      {
        text: "📋 ДОПОЛНИТЕЛНИ УСЛОВИ: {additionalConditions}.",
        fields: ['additionalConditions']
      }
    ]
  },
  annualLeaveBonusDecision: {
    title: "ОДЛУКА ЗА ИСПЛАТА НА РЕГРЕС ЗА ГОДИШЕН ОДМОР",
    sentences: [
      {
        text: "На вработените им се исплаќа регрес за користење годишен одмор за {annualLeaveYear} година, во висина од {bonusAmount} денари.",
        fields: ['annualLeaveYear', 'bonusAmount']
      },
      {
        text: "Регресот за годишен одмор ќе се исплати {paymentDate} година.",
        fields: ['paymentDate']
      },
      {
        text: "Право на регрес за годишен одмор имаат работниците кои се стекнале со право на користење годишен одмор и кои ќе се стекнат со тоа право во текот на {annualLeaveYear} година.",
        fields: ['annualLeaveYear']
      },
      {
        text: "Средствата за исплата на регресот ќе се обезбедат од тековното работење.",
        fields: []
      }
    ]
  },

  deathCompensationDecision: {
    title: "ОДЛУКА ЗА ИСПЛАТА НА НАДОМЕСТ ВО СЛУЧАЈ НА СМРТ НА ЧЛЕН НА СЕМЕЈНО ДОМАЌИНСТВО",
    sentences: [
      {
        text: "На работникот {employeeName} му се исплаќа надомест во случај на смрт на член на семејно домаќинство – {familyMember}.",
        fields: ['employeeName', 'familyMember']
      },
      {
        text: "Износот на надомест изнесува {compensationAmount} денари, што претставува две месечни просечни нето плати исплатени во Република Македонија во последните три месеци.",
        fields: ['compensationAmount']
      },
      {
        text: "Одлуката е донесена на {decisionDate} година, а надоместот ќе се исплати на {paymentDate} година.",
        fields: ['decisionDate', 'paymentDate']
      },
      {
        text: "Надоместот се исплаќа врз основа на член 35 од Општиот колективен договор за приватниот сектор од областа на стопанството.",
        fields: []
      }
    ]
  },

  // Accounting Documents
  cashRegisterMaximumDecision: {
    title: "ОДЛУКА ЗА БЛАГАЈНИЧКИ МАКСИМУМ",
    sentences: [
      {
        text: "Врз основа на член 20 од Законот за платниот промет, {companyName}, {companyAddress}, претставувани од Управителот {companyManager} на ден {decisionDate} година, донесе Одлука за благајнички максимум за {year} година.",
        fields: ['companyName', 'companyAddress', 'companyManager', 'decisionDate', 'year']
      },
      {
        text: "Се утврдува благајнички максимум за {year} година во износ од {amount} денари.",
        fields: ['year', 'amount']
      },
      {
        text: "Сите парични средства од дневниот пазар примени во готово по која и да било основа се уплатуваат на трансакциската сметка кај носителот на платен промет, истиот ден, а најдоцна наредниот работен ден од денот на наплатата.",
        fields: []
      },
      {
        text: "Оваа одлука се применува од денот на донесувањето и со стапување во сила на оваа одлука, престанува да важи Одлуката за благајнички максимум.",
        fields: []
      }
    ]
  },
  invoiceSigningAuthorization: {
    title: "ОВЛАСТУВАЊЕ ЗА ПОТПИШУВАЊЕ ФАКТУРИ",
    sentences: [
      {
        text: "Врз основа на член {articleNumber} од Договорот / Изјавата за основање друштво, управителот на Друштвото {companyName}, го дава следново Овластување за потпишување фактури.",
        fields: ['articleNumber', 'companyName']
      },
      {
        text: "За потпишување на излезни фактури на друштвото {companyName}, во подружница {branchLocation}, го овластувам лицето {authorizedPerson} распоредено на работно место {position}.",
        fields: ['companyName', 'branchLocation', 'authorizedPerson', 'position']
      },
      {
        text: "Работното место согласно систематиацијата на работни места и договорот за вработување опфаќа и работни задачи поврзани со проверка на релевантната документација при издавањето на фактури.",
        fields: []
      },
      {
        text: "Овластениот работник е должен пред потпишувањето на секоја фактура да изврши увид во документите врз основа кои е изготвената фактурата.",
        fields: []
      },
      {
        text: "Овластениот работник е одговорен за секоја потпишана фактура за која ќе се утврди дека не е заснована на веродостојни документи.",
        fields: []
      },
      {
        text: "Ова овластување стапува на сила од {effectiveDate} година.",
        fields: ['effectiveDate']
      },
      {
        text: "Управител {companyManager}, Дата: {date}, {city}",
        fields: ['companyManager', 'date', 'city']
      }
    ]
  },
  writeOffDecision: {
    title: "ОДЛУКА ЗА ОТПИС",
    sentences: [
      {
        text: "Врз основа на позитивните законски одредби и најдобрите расположиви проценки темелени на досегашните искуства, раководните лица на {companyName} со седиште на улица {companyAddress} од Скопје, Р. Македонија, донесоа одлука за отпис на сметки кои по својата економска суштина се {writeOffType}.",
        fields: ['companyName', 'companyAddress', 'writeOffType']
      },
      {
        text: "Одлуката се донесува на {date} година.",
        fields: ['date']
      },
      {
        text: "Одлуката да се достави и проследи до сите служби и надворешни деловни партнери (клиенти и добавувачи) кои се тангирани за понатамошна обработка.",
        fields: []
      },
      {
        text: "Град: {city}, Одговорно лице: {responsiblePerson}",
        fields: ['city', 'responsiblePerson']
      }
    ]
  },
  dividendPaymentDecision: {
    title: "ОДЛУКА ЗА ИСПЛАТА НА ДИВИДЕНДА",
    sentences: [
      {
        text: "Согласно член 490 од Законот за трговските друштва (Службен весник на РМ бр. 28/04), содружниците на {companyName} со седиште на {companyAddress} на ден {decisionDate} ја донесоа оваа одлука за исплата на дивиденда.",
        fields: ['companyName', 'companyAddress', 'decisionDate']
      },
      {
        text: "Одлучија да исплатат дивиденда од акумулираната добивка од {accumulatedProfitYear} година во износ од {accumulatedProfitAmount} денари.",
        fields: ['accumulatedProfitYear', 'accumulatedProfitAmount']
      },
      {
        text: "Исто така, од тековната добивка за {currentProfitYear} година се исплаќа износ од {currentProfitAmount} денари.",
        fields: ['currentProfitYear', 'currentProfitAmount']
      },
      {
        text: "Вкупниот износ на дивиденда за исплата изнесува {totalDividendAmount} денари.",
        fields: ['totalDividendAmount']
      },
      {
        text: "Износот се распределува на содружниците пропорционално на нивните удели според Книгата на удели и тековната состојба од Централниот регистар.",
        fields: []
      },
      {
        text: "Дивидендата ќе се исплати на трансакциска сметка на содружниците во текот на {paymentYear} годината.",
        fields: ['paymentYear']
      },
      {
        text: "Одлуката ја потпишува претседавачот: {chairman}.",
        fields: ['chairman']
      },
      {
        text: "* Бруто износите на дивиденда се оданочуваат со 10% персонален данок на доход.",
        fields: []
      }
    ]
  },
  annualAccountsAdoption: {
    title: "ОДЛУКА ЗА УСВОЈУВАЊЕ НА ГОДИШНАТА СМЕТКА",
    sentences: [
      {
        text: "Врз основа на член 215 став 1 точка 1) од ЗТД - кај друштвото со ограничена одговорност, и член {articleNumber} од Договорот за друштвото (односно Статутот), на седницата одржана на {meetingDate} година донесе ОДЛУКА за усвојување на годишната сметка.",
        fields: ['articleNumber', 'meetingDate']
      },
      {
        text: "Се усвојува годишната сметка, финансиските извештаи и годишниот извештај за работењето на друштвото за {year} на {companyName}.",
        fields: ['year', 'companyName']
      },
      {
        text: "1) Остварени приходи: {revenues} денари",
        fields: ['revenues']
      },
      {
        text: "2) Остварени расходи: {expenses} денари",
        fields: ['expenses']
      },
      {
        text: "3) Остварена добивка пред оданочување (1 - 2): {profitBeforeTax} денари",
        fields: ['profitBeforeTax']
      },
      {
        text: "4) Данок на непризнаени расходи: {taxOnExpenses} денари",
        fields: ['taxOnExpenses']
      },
      {
        text: "5) Остварена добивка по оданочување (3 - 4): {profitAfterTax} денари",
        fields: ['profitAfterTax']
      },
      {
        text: "Се одобрува работата на Управителот {managerName} (членовите на одборот на директорите, односно управниот и надзорниот одбор) во тековната година.",
        fields: ['managerName']
      },
      {
        text: "Составен дел на оваа одлука се: Билансот на успехот и Билансот на состојбата, Одлуката за одобрување на работата на управителот, Одлуката за распоредување на добивката (или покривање на загуба), Одлука за плаќање на дивиденда.",
        fields: []
      },
      {
        text: "Оваа одлука влегува во сила со денот на донесувањето.",
        fields: []
      },
      {
        text: "{city}  {date} - М.П - Собир на содружниците - Претседавач: {chairman}",
        fields: ['city', 'date', 'chairman']
      }
    ]
  },
  employeeStockPurchasePlan: {
    title: "{planTitle}",
    sentences: [
      {
        text: "{planIntro}",
        fields: ['planIntro']
      },
      {
        text: "ЦЕЛА: {purpose}",
        fields: ['purpose']
      },
      {
        text: "УСЛОВИ ЗА УЧЕСТВО: Вработените се квалификувани доколку се вработени најмалку {minimumServiceMonths} месеци и работат минимум {minimumWorkHours} часа неделно.",
        fields: ['minimumServiceMonths', 'minimumWorkHours']
      },
      {
        text: "МАКСИМАЛНА СОПСТВЕНОСТ: {ownershipSummary}",
        fields: ['ownershipSummary']
      },
      {
        text: "ЦЕНА НА СТЕКНУВАЊЕ: Вработените можат да стекнуваат сопственост на {purchasePricePercentage}% од пазарната вредност (попуст од {discountPercentage}%). Цената се пресметува како пониската вредност помеѓу датумот на запишување и датумот на извршување.",
        fields: ['purchasePricePercentage', 'discountPercentage']
      },
      {
        text: "ПЕРИОДИ НА ПОНУДА: Планот се имплементира преку последователни периоди на понуда со времетраење од {offeringPeriodMonths} месеци. Датуми на запишување: {enrollmentDates}.",
        fields: ['offeringPeriodMonths', 'enrollmentDates']
      },
      {
        text: "ОДБИВАЊА ОД ПЛАТА: Вработените избираат одбивање од плата до максимум {maxPayrollDeductionPercentage}% од својата нето плата месечно.",
        fields: ['maxPayrollDeductionPercentage']
      },
      {
        text: "АДМИНИСТРАЦИЈА: Планот го администрира {committeeName} кој има овластување да го толкува и спроведува планот.",
        fields: ['committeeName']
      },
      {
        text: "ГОТОВИНСКИ ПРИДОНЕСИ: {allowsCashContributionsText}",
        fields: ['allowsCashContributions']
      },
      {
        text: "ВРЕМЕТРАЕЊЕ НА ПЛАНОТ: Овој план продолжува за период од {termPeriod} {termUnit} и може да биде изменет или прекинат од страна на Одборот.",
        fields: ['termPeriod', 'termUnit']
      },
      {
        text: "{taxObligationsText}",
        fields: ['taxObligationsText']
      },
      {
        text: "{adjustmentsText}",
        fields: ['adjustmentsText']
      }
    ]
  },
  masterServicesAgreement: {
    title: "РАМКОВЕН ДОГОВОР ЗА УСЛУГИ (Master Services Agreement)",
    sentences: [
      {
        text: "Договорот е склучен на ден {agreementDate} година помеѓу давателот на услуга и клиентот согласно Законот за облигациони односи на РСМ.",
        fields: ['agreementDate']
      },
      {
        text: "Вашата компанија {companyName} во овој рамковен договор е {userRole} на услугите.",
        fields: ['companyName', 'userRole']
      },
      {
        text: "Предмет на договорот се {serviceType} што вклучуваат {serviceDescription}.",
        fields: ['serviceType', 'serviceDescription']
      },
      {
        text: "Обемот на услугите е дефиниран како {serviceScope}, а конкретните проекти се дефинираат преку посебни SOW (Statement of Work) документи.",
        fields: ['serviceScope']
      },
      {
        text: "Услугите ќе се извршуваат {serviceLocation} согласно {serviceDeliveryTerms}.",
        fields: ['serviceLocation', 'serviceDeliveryTerms']
      },
      {
        text: "Стандардите за квалитет на услугите се {qualityStandards} во согласност со применливите закони и прописи.",
        fields: ['qualityStandards']
      },
      {
        text: "Плаќањето се врши {paymentTerms} преку {paymentMethod} во валута {currency}.",
        fields: ['paymentTerms', 'paymentMethod', 'currency']
      },
      {
        text: "Структурата на надоместок е дефинирана како {feeStructure} со износ од {feeAmount}.",
        fields: ['feeStructure', 'feeAmount']
      },
      {
        text: "Максималниот број на часови изнесува {hoursLimit} со стапка за прекувремена работа од {overtimeRate}.",
        fields: ['hoursLimit', 'overtimeRate']
      },
      {
        text: "Во случај на доцнење во плаќањето, клиентот плаќа законска затезна камата и давателот може да ги суспендира услугите доколку задоцнувањето е повеќе од 15 дена.",
        fields: []
      },
      {
        text: "Секоја нова интелектуална сопственост создадена во текот на извршување на услугите станува сопственост на клиентот, освен ако поинаку не е договорено во посебен SOW.",
        fields: []
      },
      {
        text: "Двете страни се согласуваат да ги чуваат како доверливи сите информации добиени од другата страна, вклучувајќи деловни планови, финансиски информации, технички податоци и маркетинг стратегии.",
        fields: []
      },
      {
        text: "Максималната одговорност на давателот на услуга не може да го надмине {liabilityLimitType} износ платен од страна на клиентот за услугите во период од 12 месеци пред настанот што предизвикал штета.",
        fields: ['liabilityLimitType']
      },
      {
        text: "Договорот е склучен на {durationType} времетраење и влегува во сила на {effectiveDateType}.",
        fields: ['durationType', 'effectiveDateType']
      },
      {
        text: "Секоја страна може да го раскине договорот со писмено известување од {terminationNoticePeriod}. Активните SOW проекти продолжуваат и по раскинување на рамковниот договор.",
        fields: ['terminationNoticePeriod']
      },
      {
        text: "Договорот се толкува и применува во согласност со Законот за облигациони односи и другите закони на Република Северна Македонија, а спорови се решаваат пред надлежен суд во Скопје.",
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
    if (fieldName === 'companyTaxNumber') return company?.taxNumber || '[ЕДБ]';

    // Handle ESPP purpose field - combine all selected checkboxes
    if (fieldName === 'purpose') {
      const ownershipType = formData?.ownershipType || 'акции';
      const ownershipTerm = ownershipType === 'удели' ? 'удели' : 'акции';
      const ownersTerm = ownershipType === 'удели' ? 'членови' : 'акционери';

      const purposeParts = [];
      if (formData?.purposeOwnership) purposeParts.push(`да им овозможи на вработените да станат сопственици на ${ownershipTerm} на компанијата`);
      if (formData?.purposeMotivation) purposeParts.push('да ги мотивира вработените');
      if (formData?.purposeRetention) purposeParts.push('да ги задржи квалитетните кадри');
      if (formData?.purposeAlignment) purposeParts.push(`да ги усогласи интересите на вработените со ${ownersTerm}те`);
      if (formData?.purposeReward) purposeParts.push('да ги наградува вработените за успехот на компанијата');
      if (formData?.purposeAttract) purposeParts.push('да привлече нови квалитетни кадри');

      return purposeParts.length > 0
        ? purposeParts.join(', ')
        : '[Изберете барем една цел на планот]';
    }

    // Handle ESPP ownership summary - conditional based on ownership type
    if (fieldName === 'ownershipSummary') {
      const ownershipType = formData?.ownershipType || '';
      const isShares = ownershipType === 'удели';

      if (!ownershipType) {
        return 'Изберете го типот на друштво за да видите ги деталите за максимална сопственост.';
      }

      if (isShares) {
        const percentage = formData?.maximumSharesPercentage;
        return percentage
          ? `Според овој план, максималниот процент на удели достапен за стекнување изнесува ${percentage}% од вкупните удели.`
          : 'Според овој план, максималниот процент на удели достапен за стекнување е [Процент на удели].';
      } else {
        const number = formData?.maximumSharesNumber;
        return number
          ? `Според овој план, максималниот број акции достапни за стекнување изнесува ${number} обични акции.`
          : 'Според овој план, максималниот број акции достапни за стекнување е [Број на акции].';
      }
    }

    // Handle ESPP plan title - dynamic based on ownership type
    if (fieldName === 'planTitle') {
      const ownershipType = formData?.ownershipType || '';
      const isShares = ownershipType === 'удели';

      if (!ownershipType) {
        return 'ПЛАН ЗА СТЕКНУВАЊЕ СОПСТВЕНОСТ ОД СТРАНА НА ВРАБОТЕНИ';
      }

      if (isShares) {
        return 'ПЛАН ЗА СТЕКНУВАЊЕ УДЕЛИ ОД СТРАНА НА ВРАБОТЕНИ';
      } else {
        return 'ПЛАН ЗА КУПУВАЊЕ АКЦИИ ОД СТРАНА НА ВРАБОТЕНИ (ESPP)';
      }
    }

    // Handle ESPP plan intro - dynamic based on ownership type
    if (fieldName === 'planIntro') {
      const ownershipType = formData?.ownershipType || '';
      const isShares = ownershipType === 'удели';
      const effectiveDate = formData?.effectiveDate ? formatDate(formData.effectiveDate) : '[Датум]';

      if (!ownershipType) {
        return `Овој план е донесен на ${effectiveDate} од страна на [компанија] со седиште во Република Северна Македонија со цел да им обезбеди на вработените можност да стекнуваат сопственост.`;
      }

      if (isShares) {
        return `Овој план е донесен на ${effectiveDate} од страна на [компанија] со седиште во Република Северна Македонија со цел да им обезбеди на вработените можност да стекнуваат удели по поволни услови.`;
      } else {
        return `Овој план е донесен на ${effectiveDate} од страна на [компанија] со седиште во Република Северна Македонија со цел да им обезбеди на вработените можност да купуваат акции по дисконтна цена.`;
      }
    }

    // Handle ESPP tax obligations text - dynamic based on ownership type
    if (fieldName === 'taxObligationsText') {
      const ownershipType = formData?.ownershipType || '';
      const isShares = ownershipType === 'удели';

      if (!ownershipType) {
        return 'ДАНОЧНИ ОБВРСКИ: При стекнување или отуѓување на сопственоста, вработените мора да обезбедат соодветни средства за даночни обврски според македонското законодавство.';
      }

      if (isShares) {
        return 'ДАНОЧНИ ОБВРСКИ: При стекнување или отуѓување на уделите, вработените мора да обезбедат соодветни средства за даночни обврски според македонското законодавство.';
      } else {
        return 'ДАНОЧНИ ОБВРСКИ: При извршување на опцијата или отуѓување на акциите, вработените мора да обезбедат соодветни средства за даночни обврски според македонското законодавство.';
      }
    }

    // Handle ESPP adjustments text - dynamic based on ownership type
    if (fieldName === 'adjustmentsText') {
      const ownershipType = formData?.ownershipType || '';
      const isShares = ownershipType === 'удели';

      if (!ownershipType) {
        return 'ПРИЛАГОДУВАЊА: Во случај на промени во капитализацијата, распуштање, ликвидација, спојување или продажба на средства, Одборот има право да врши прилагодувања на планот.';
      }

      if (isShares) {
        return 'ПРИЛАГОДУВАЊА: Во случај на промени во капиталот на друштвото, распуштање, ликвидација, спојување или продажба на средства, Собранието на членови има право да врши прилагодувања на планот.';
      } else {
        return 'ПРИЛАГОДУВАЊА: Во случај на промени во капитализацијата, распуштање, ликвидација, спојување или продажба на средства, Собранието на акционери има право да врши прилагодувања на планот.';
      }
    }

    const value = formData[fieldName];
    if (!value || value === '') return `[${fieldName}]`;

    // Format dates
    if (['agreementDate', 'annualLeaveStart', 'annualLeaveEnd', 'sanctionDate',
         'employeeWrongdoingDate', 'decisionDate', 'contractDate', 'employmentStartDate',
         'employmentEndDate', 'endDate', 'definedDuration', 'fixingDeadline',
         'warningDate', 'effectiveDate', 'consentDate', 'terminationDate',
         'contractStartDate', 'documentDate', 'violationDate', 'paymentDate', 'adoptionDate',
         'originalContractDate', 'dueDate', 'startingDate', 'startingWorkDate', 'decisionDate', 'date', 'meetingDate', 'concurrentClauseDuration', 'specificEffectiveDate'].includes(fieldName)) {
      return formatDate(value);
    }

    // Format currency amounts (Macedonia format: 1.000,00 денари)
    if (['bonusAmount', 'netSalary', 'damageAmount', 'compensationAmount', 'amount',
         'accumulatedProfitAmount', 'currentProfitAmount', 'totalDividendAmount',
         'revenues', 'expenses', 'profitBeforeTax', 'taxOnExpenses', 'profitAfterTax', 'concurrentClauseCompensation', 'subscriptionFee'].includes(fieldName)) {
      if (!value || isNaN(value)) return value || '';
      return `${parseFloat(value).toLocaleString('mk-MK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Handle family member field for death compensation decision
    if (fieldName === 'familyMember') {
      const familyMapping = {
        'сопруг': 'сопруг',
        'сопруга': 'сопруга',
        'син': 'син',
        'ќерка': 'ќерка',
        'татко': 'татко',
        'мајка': 'мајка'
      };
      return familyMapping[value] || value || '[Член на семејно домаќинство]';
    }

    // Handle articleCase field for termination due to fault
    if (fieldName === 'articleCase') {
      const articleMapping = {
        'article_81_case_1': 'Член 81, точка 1',
        'article_81_case_2': 'Член 81, точка 2',
        'article_81_case_3': 'Член 81, точка 3',
        'article_81_case_4': 'Член 81, точка 4',
        'article_81_case_5': 'Член 81, точка 5',
        'article_81_case_6': 'Член 81, точка 6',
        'article_81_case_7': 'Член 81, точка 7',
        'article_81_case_8': 'Член 81, точка 8',
        'article_81_case_9': 'Член 81, точка 9',
        'article_81_case_10': 'Член 81, точка 10',
        'article_81_case_11': 'Член 81, точка 11',
        'article_82_case_1': 'Член 82, точка 1',
        'article_82_case_2': 'Член 82, точка 2',
        'article_82_case_3': 'Член 82, точка 3',
        'article_82_case_4': 'Член 82, точка 4',
        'article_82_case_5': 'Член 82, точка 5',
        'article_82_case_6': 'Член 82, точка 6'
      };
      return articleMapping[value] || '[Изберете член и случај]';
    }

    // Handle GDPR Company Politics specific boolean fields
    if (fieldName === 'processesSpecialCategories') {
      return value ? 'Обработува специјални категории персонални податоци' : 'Не обработува специјални категории персонални податоци';
    }
    if (fieldName === 'usesAutomatedDecisionMaking') {
      return value ? 'Користи автоматизирано донесување одлуки' : 'Не користи автоматизирано донесување одлуки';
    }
    if (fieldName === 'performsDirectMarketing') {
      return value ? 'Извршува директни маркетиншки активности' : 'Не извршува директни маркетиншки активности';
    }
    if (fieldName === 'hasInternationalTransfers') {
      return value ? 'Извршува меѓународни трансфери на податоци' : 'Не извршува меѓународни трансфери на податоци';
    }
    if (fieldName === 'dataPortabilityApplicable') {
      return value ? 'Правото на портабилност е применливо' : 'Правото на портабилност не е применливо';
    }
    if (fieldName === 'sharesDataWithThirdParties') {
      return value ? 'Споделуваме податоци со трети страни' : 'Не споделуваме податоци со трети страни';
    }
    if (fieldName === 'allowEmailSubmission') {
      return value ? 'е-пошта' : '';
    }
    if (fieldName === 'allowPostalSubmission') {
      return value ? 'пошта' : '';
    }
    if (fieldName === 'allowInPersonSubmission') {
      return value ? 'лично посетување' : '';
    }
    if (fieldName === 'allowOnlinePortalSubmission') {
      return value ? 'онлајн портал' : '';
    }
    if (fieldName === 'complexRequestExtension') {
      return value ? 'со можност за продолжување за комплексни барања' : 'без можност за продолжување';
    }
    if (fieldName === 'hasDedicatedDPO') {
      return value ? 'Имаме назначено ОФЗЛП' : 'Немаме назначено ОФЗЛП';
    }
    if (fieldName === 'dpoIsInternal') {
      return value ? 'интерен вработен' : 'надворешен консултант';
    }
    if (fieldName === 'usesCentralizedRegistry') {
      return value ? 'Користиме централизиран регистар' : 'Не користиме централизиран регистар';
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

    // Handle write-off decision specific fields
    if (fieldName === 'writeOffType') {
      if (value === 'ПОБАРУВАЊА') return 'побарувања';
      if (value === 'ОБВРСКИ') return 'обврски';
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

    // Handle GDPR Company Politics boolean fields
    if (fieldName === 'allowEmailSubmission') {
      return value === true ? 'дозволено' : 'не е дозволено';
    }

    if (fieldName === 'allowPostalSubmission') {
      return value === true ? 'дозволено' : 'не е дозволено';
    }

    if (fieldName === 'allowInPersonSubmission') {
      return value === true ? 'дозволено' : 'не е дозволено';
    }

    if (fieldName === 'allowOnlinePortalSubmission') {
      return value === true ? 'дозволено' : 'не е дозволено';
    }

    if (fieldName === 'usesCentralizedRegistry') {
      return value === true ? 'се користи' : 'не се користи';
    }

    // Handle dataGroups field for politics document
    if (fieldName === 'dataGroups') {
      if (Array.isArray(value) && value.length > 0) {
        return `${value.length} избрани категории: ${value.map(group => group.type).join(', ')}`;
      }
      return 'не се избрани категории на податоци';
    }

    // GDPR Company Politics specific field formatting
    if (fieldName === 'primaryBusinessActivity') {
      return value || '[Основна деловна активност]';
    }

    if (fieldName === 'dataProcessingComplexity') {
      return value || '[Сложеност на обработка]';
    }

    if (fieldName === 'personalDataCategories') {
      if (Array.isArray(value) && value.length > 0) {
        return value.join(', ');
      }
      return '[Категории персонални податоци]';
    }

    // Format checkbox fields to readable text
    if (fieldName === 'allowEmailSubmission') {
      return value === true ? '✓ е-пошта' : value === false ? '✗ е-пошта' : '[е-пошта]';
    }

    if (fieldName === 'allowPostalSubmission') {
      return value === true ? '✓ пошта' : value === false ? '✗ пошта' : '[пошта]';
    }

    if (fieldName === 'allowInPersonSubmission') {
      return value === true ? '✓ лично' : value === false ? '✗ лично' : '[лично]';
    }

    if (fieldName === 'allowOnlinePortalSubmission') {
      return value === true ? '✓ онлајн портал' : value === false ? '✗ онлајн портал' : '[онлајн портал]';
    }

    if (fieldName === 'usesCentralizedRegistry') {
      return value === true ? 'се користи' : value === false ? 'не се користи' : '[централизиран регистар]';
    }

    if (fieldName === 'identityVerificationLevel') {
      return value || '[Ниво на верификација]';
    }

    if (fieldName === 'standardResponseTime') {
      return value || '[Време за одговор]';
    }

    if (fieldName === 'responsibleDepartment') {
      return value || '[Одговорен оддел]';
    }

    if (fieldName === 'businessHours') {
      return value || '[Работно време]';
    }

    if (fieldName === 'staffTrainingLevel') {
      return value || '[Ниво на обука]';
    }

    if (fieldName === 'policyUpdateFrequency') {
      return value || '[Честота на ажурирање]';
    }

    if (fieldName === 'complianceMonitoring') {
      return value || '[Мониторинг на усогласеност]';
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

    // Handle mediation agreement specific fields
    if (fieldName === 'userRole') {
      if (value === 'mediator') return 'Посредник';
      if (value === 'client') return 'Налогодавец';
      return value;
    }

    if (fieldName === 'clientType' || fieldName === 'clientTypeForMediator') {
      if (value === 'natural') return 'физичко лице';
      if (value === 'legal') return 'правно лице';
      return value;
    }

    // Enhanced mediation agreement field handling
    if (fieldName === 'typeOfMediation') {
      const types = {
        'real_estate': 'Недвижен имот',
        'vehicle_sales': 'Продажба на возила',
        'business_contracts': 'Деловни договори',
        'employment': 'Работни места',
        'insurance': 'Осигурување',
        'loans': 'Кредити',
        'services': 'Услуги',
        'other': 'Друго'
      };
      return types[value] || value;
    }

    if (fieldName === 'specificContractType') {
      const contractTypes = {
        'sale_purchase': 'договор за купопродажба',
        'lease_rent': 'договор за закуп',
        'service_agreement': 'договор за услуги',
        'employment_contract': 'договор за вработување',
        'loan_agreement': 'договор за заем',
        'insurance_policy': 'полиса за осигурување',
        'franchise': 'договор за франшиза',
        'partnership': 'договор за партнерство',
        'other': 'друг тип договор'
      };
      return contractTypes[value] || value;
    }

    if (fieldName === 'commissionCalculation') {
      const calculations = {
        'percentage': 'Процент од вредноста',
        'fixed_amount': 'Фиксен износ',
        'hybrid': 'Хибридно (процент + фиксен)',
        'graduated': 'Градуирана стапка',
        'minimum_guarantee': 'Минимум гаранција'
      };
      return calculations[value] || value;
    }

    if (fieldName === 'paymentTiming') {
      const timings = {
        'contract_signing': 'При потпишување на договорот',
        'deal_completion': 'При завршување на работата',
        'monthly_installments': 'Месечни ратни отплати',
        'upfront_partial': 'Аванс + остаток',
        'success_only': 'Само при успех'
      };
      return timings[value] || value;
    }

    if (fieldName === 'targetContractValueRange') {
      const ranges = {
        'under_50k': 'под 50.000 денари',
        '50k_200k': '50.000 - 200.000 денари',
        '200k_500k': '200.000 - 500.000 денари',
        '500k_1m': '500.000 - 1.000.000 денари',
        '1m_5m': '1.000.000 - 5.000.000 денари',
        'over_5m': 'над 5.000.000 денари',
        'unlimited': 'неограничено'
      };
      return ranges[value] || value;
    }

    if (fieldName === 'confidentialityPeriod') {
      const periods = {
        '1_year': '1 година',
        '2_years': '2 години',
        '3_years': '3 години',
        '5_years': '5 години',
        '10_years': '10 години',
        'indefinite': 'неопределено'
      };
      return periods[value] || value;
    }

    if (fieldName === 'earlyTerminationNoticePeriod') {
      const periods = {
        'immediate': 'Без известување',
        '7_days': '7 дена',
        '15_days': '15 дена',
        '30_days': '30 дена',
        '60_days': '60 дена',
        '90_days': '90 дена'
      };
      return periods[value] || value;
    }

    if (fieldName === 'disputeResolution') {
      const methods = {
        'skopje_court': 'Суд во Скопје',
        'local_court': 'Месно надлежен суд',
        'arbitration': 'Арбитража',
        'mediation_first': 'Медијација па суд',
        'negotiation': 'Преговори'
      };
      return methods[value] || value;
    }

    // Boolean field formatting for mediation agreement
    if (fieldName === 'costReimbursement') {
      return value === true ? 'се надоместуваат' : value === false ? 'не се надоместуваат' : '';
    }

    if (fieldName === 'travelCostsIncluded') {
      return value === true ? 'вклучени' : value === false ? 'исклучени' : '';
    }

    if (fieldName === 'advertisementCostsIncluded') {
      return value === true ? 'вклучени' : value === false ? 'исклучени' : '';
    }

    if (fieldName === 'legalConsultationCostsIncluded') {
      return value === true ? 'вклучени' : value === false ? 'исклучени' : '';
    }

    if (fieldName === 'mediatorDiaryRequired') {
      return value === true ? 'ДА' : value === false ? 'НЕ' : 'ДА';
    }

    if (fieldName === 'writtenAuthorizationForPerformance') {
      return value === true ? 'потребно' : value === false ? 'не е потребно' : '';
    }

    if (fieldName === 'exclusiveMediation') {
      return value === true ? 'ексклузивно' : value === false ? 'неексклузивно' : '';
    }

    if (fieldName === 'dualRepresentationAllowed') {
      return value === true ? 'дозволено' : value === false ? 'забрането' : '';
    }

    // Set dynamic field values based on user role
    if (fieldName === 'mediatorName') {
      if (formData.userRole === 'mediator') {
        return company?.companyName || '[Име на посредник]';
      }
      return formData.mediatorCompanyName || '[Име на посредник]';
    }

    if (fieldName === 'mediatorAddress') {
      if (formData.userRole === 'mediator') {
        return company?.address || '[Адреса на посредник]';
      }
      return formData.mediatorCompanyAddress || '[Адреса на посредник]';
    }

    if (fieldName === 'mediatorTaxNumber') {
      if (formData.userRole === 'mediator') {
        return company?.taxNumber || '[ЕДБ на посредник]';
      }
      return formData.mediatorCompanyTaxNumber || '[ЕДБ на посредник]';
    }

    if (fieldName === 'mediatorManager') {
      if (formData.userRole === 'mediator') {
        return company?.manager || '[Управител на посредник]';
      }
      return formData.mediatorCompanyManager || '[Управител на посредник]';
    }

    if (fieldName === 'mediatorPhone') {
      if (formData.userRole === 'mediator') {
        return formData.mediatorPhone || '[Телефон на посредник]';
      }
      return formData.mediatorCompanyPhone || '[Телефон на посредник]';
    }

    if (fieldName === 'mediatorEmail') {
      if (formData.userRole === 'mediator') {
        return formData.mediatorEmail || '[Е-пошта на посредник]';
      }
      return formData.mediatorCompanyEmail || '[Е-пошта на посредник]';
    }

    if (fieldName === 'clientName') {
      if (formData.userRole === 'client') {
        return company?.companyName || '[Име на налогодавец]';
      } else if (formData.userRole === 'mediator') {
        if (formData.clientTypeForMediator === 'natural') {
          return formData.naturalClientName || '[Име на налогодавец]';
        } else if (formData.clientTypeForMediator === 'legal') {
          return formData.legalClientName || '[Име на налогодавец]';
        }
      }
      return '[Име на налогодавец]';
    }

    if (fieldName === 'clientAddress') {
      if (formData.userRole === 'client') {
        return company?.address || '[Адреса на налогодавец]';
      } else if (formData.userRole === 'mediator') {
        if (formData.clientTypeForMediator === 'natural') {
          return formData.naturalClientAddress || '[Адреса на налогодавец]';
        } else if (formData.clientTypeForMediator === 'legal') {
          return formData.legalClientAddress || '[Адреса на налогодавец]';
        }
      }
      return '[Адреса на налогодавец]';
    }

    if (fieldName === 'clientPin') {
      if (formData.userRole === 'mediator' && formData.clientTypeForMediator === 'natural') {
        return formData.naturalClientPin || '[ЕМБГ]';
      }
      return formData.clientPin || '[ЕМБГ]';
    }

    if (fieldName === 'clientTaxNumber') {
      if (formData.userRole === 'client') {
        return company?.taxNumber || '[ЕДБ на налогодавец]';
      } else if (formData.userRole === 'mediator' && formData.clientTypeForMediator === 'legal') {
        return formData.legalClientTaxNumber || '[ЕДБ на налогодавец]';
      }
      return '[ЕДБ на налогодавец]';
    }

    if (fieldName === 'clientManager') {
      if (formData.userRole === 'client') {
        return company?.manager || '[Управител на налогодавец]';
      } else if (formData.userRole === 'mediator' && formData.clientTypeForMediator === 'legal') {
        return formData.legalClientManager || '[Управител на налогодавец]';
      }
      return '[Управител на налогодавец]';
    }

    if (fieldName === 'clientPhone') {
      if (formData.userRole === 'client') {
        return formData.clientPhone || '[Телефон на налогодавец]';
      } else if (formData.userRole === 'mediator') {
        if (formData.clientTypeForMediator === 'natural') {
          return formData.naturalClientPhone || '[Телефон на налогодавец]';
        } else if (formData.clientTypeForMediator === 'legal') {
          return formData.legalClientPhone || '[Телефон на налогодавец]';
        }
      }
      return '[Телефон на налогодавец]';
    }

    if (fieldName === 'clientEmail') {
      if (formData.userRole === 'client') {
        return formData.clientEmail || '[Е-пошта на налогодавец]';
      } else if (formData.userRole === 'mediator') {
        if (formData.clientTypeForMediator === 'natural') {
          return formData.naturalClientEmail || '[Е-пошта на налогодавец]';
        } else if (formData.clientTypeForMediator === 'legal') {
          return formData.legalClientEmail || '[Е-пошта на налогодавец]';
        }
      }
      return '[Е-пошта на налогодавец]';
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

    // Procedure for Estimation field formatting
    if (fieldName === 'assessmentType') {
      const assessmentTypes = {
        'systematic_evaluation': 'Систематска и обемна евалуација (профилирање)',
        'special_categories': 'Обработка на посебни категории на лични податоци',
        'systematic_monitoring': 'Систематско набљудување на јавно достапна област',
        'new_technologies': 'Користење на нови технологии',
        'data_combination': 'Комбинирање на податоци',
        'location_tracking': 'Следење на локација или однесување',
        'health_risk': 'Обработка која претставува висок ризик по здравјето',
        'unique_identification': 'Обработка за цел на единствена идентификација'
      };
      return assessmentTypes[value] || value;
    }

    if (fieldName === 'dataSubjects' && Array.isArray(value)) {
      const dataSubjectLabels = {
        'employees': 'Вработени',
        'candidates': 'Кандидати за работа',
        'customers': 'Купувачи/клиенти',
        'suppliers': 'Добавувачи',
        'visitors': 'Посетители',
        'contractors': 'Изведувачи'
      };
      return value.map(subject => dataSubjectLabels[subject] || subject).join(', ');
    }

    if (fieldName === 'dataCategories' && Array.isArray(value)) {
      const dataCategoryLabels = {
        'basic_data': 'Основни податоци (име, адреса)',
        'contact_info': 'Контакт информации',
        'financial_data': 'Финансиски податоци',
        'health_data': 'Здравствени податоци',
        'biometric_data': 'Биометриски податоци',
        'location_data': 'Податоци за локација',
        'special_categories': 'Посебни категории податоци'
      };
      return value.map(category => dataCategoryLabels[category] || category).join(', ');
    }

    if (fieldName === 'threats' && Array.isArray(value)) {
      const threatLabels = {
        'unauthorized_access': 'Неовластен пристап',
        'data_loss': 'Губење на податоци',
        'data_alteration': 'Измена на податоци',
        'technical_failure': 'Технички дефекти',
        'cyber_attacks': 'Кибер напади',
        'human_error': 'Човечка грешка'
      };
      return value.map(threat => threatLabels[threat] || threat).join(', ');
    }

    if (fieldName === 'technicalMeasures' && Array.isArray(value)) {
      const technicalMeasureLabels = {
        'encryption': 'Енкрипција на податоци',
        'access_control': 'Контрола на пристап',
        'backup_systems': 'Системи за резервни копии',
        'monitoring': 'Континуирано следење',
        'firewalls': 'Firewall системи',
        'antivirus': 'Антивирус заштита'
      };
      return value.map(measure => technicalMeasureLabels[measure] || measure).join(', ');
    }

    if (fieldName === 'organizationalMeasures' && Array.isArray(value)) {
      const organizationalMeasureLabels = {
        'staff_training': 'Обука на персоналот',
        'policies': 'Политики и процедури',
        'regular_audits': 'Редовни ревизии',
        'incident_response': 'План за одговор на инциденти',
        'data_minimization': 'Минимизирање на податоци',
        'retention_policy': 'Политика за чување'
      };
      return value.map(measure => organizationalMeasureLabels[measure] || measure).join(', ');
    }

    if (fieldName === 'reviewFrequency') {
      const frequencyLabels = {
        'quarterly': 'квартално',
        'semi_annual': 'полугодишно',
        'annual': 'годишно'
      };
      return frequencyLabels[value] || value;
    }

    if (fieldName === 'implementationTimeline') {
      const timelineLabels = {
        '1_month': '1 месец',
        '3_months': '3 месеци',
        '6_months': '6 месеци',
        '1_year': '1 година'
      };
      return timelineLabels[value] || value;
    }

    if (fieldName === 'consultationRequired') {
      return value === 'yes' ? 'Потребна е консултација со Агенцијата за заштита на личните податоци' : 'Не е потребна консултација со АЗЛП';
    }

    // Risk level calculation for live preview
    if (fieldName === 'riskLevel') {
      const probability = formData.probability;
      const impact = formData.impactLevel;
      if (probability && impact) {
        const riskValue = parseInt(probability) * parseInt(impact);
        if (riskValue <= 2) return 'незначителен ризик';
        if (riskValue <= 4) return 'ризик';
        return 'висок ризик';
      }
      return 'се определува во текот на процесот';
    }

    // Handle SaaS Agreement specific fields
    if (fieldName === 'userRole') {
      if (value === 'давател') return 'давател на SaaS услуга';
      if (value === 'клиент') return 'клиент (корисник на услугата)';
      return value;
    }

    if (fieldName === 'effectiveDateType') {
      if (value === 'датум на склучување') return 'денот на потпишување од двете страни';
      if (value === 'специфичен датум') return 'специфичен датум (наведен подолу)';
      return value;
    }

    if (fieldName === 'currency') {
      if (value === 'денари') return 'денари';
      if (value === 'евра') return 'евра';
      if (value === 'долари') return 'американски долари';
      return value;
    }

    if (fieldName === 'supportHours') {
      if (value === 'работни часови') return 'работни часови (09:00-17:00)';
      if (value === '24/7') return '24/7 (секој ден, 24 часа)';
      if (value === 'работни денови') return 'работни денови';
      if (value === 'прилагодени') return 'прилагодени часови';
      return value;
    }

    if (fieldName === 'durationType') {
      if (value === 'неопределено') return 'неопределено време';
      if (value === 'определено') return 'определено време';
      return value;
    }

    // Handle Employee Stock Purchase Plan specific fields
    if (fieldName === 'allowsCashContributions' || fieldName === 'allowsCashContributionsText') {
      if (value === 'да' || value === true) return 'Дозволени се готовински придонеси покрај одбивањата од плата';
      if (value === 'не' || value === false) return 'Не се дозволени готовински придонеси - само одбивања од плата';
      return '[Дозволени готовински придонеси]';
    }

    if (fieldName === 'discountPercentage') {
      const purchasePrice = formData['purchasePricePercentage'];
      if (purchasePrice) {
        const discount = 100 - parseFloat(purchasePrice);
        return `${discount}%`;
      }
      return '[Попуст]';
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

        // Computed fields (fields that don't exist in formData but are calculated dynamically)
        const computedFields = ['purpose', 'ownershipSummary', 'planTitle', 'planIntro',
                                'taxObligationsText', 'adjustmentsText', 'discountPercentage',
                                'allowsCashContributionsText'];
        const isComputedField = computedFields.includes(field);

        const hasUserInput = formData[field] ||
                            (field === 'companyName' && company?.companyName) ||
                            (field === 'companyAddress' && company?.address) ||
                            isComputedField;

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
  
  // Process title to replace placeholders
  const processTitle = (title) => {
    if (!title) return '[Наслов на документ]';

    // Extract all placeholders from title
    const placeholderRegex = /\{([^}]+)\}/g;
    let processedTitle = title;
    let match;

    while ((match = placeholderRegex.exec(title)) !== null) {
      const fieldName = match[1];
      const value = getFieldValue(fieldName);
      processedTitle = processedTitle.replace(`{${fieldName}}`, value);
    }

    return processedTitle;
  };

  return (
    <div className={styles.document}>
      <h2 className={styles.title}>{processTitle(docTemplate.title)}</h2>
      
      <div className={styles.companyInfo}>
        {company?.companyName && (
          <p className={styles.greyedText}>
            Друштво: <span className={styles.highlightedInput}>{company.companyName}</span>
          </p>
        )}
        {company?.address && (
          <p className={styles.greyedText}>
            Адреса: <span className={styles.highlightedInput}>{company.address}</span>
          </p>
        )}
        {company?.taxNumber && (
          <p className={styles.greyedText}>
            ЕДБ: <span className={styles.highlightedInput}>{company.taxNumber}</span>
          </p>
        )}
      </div>
      
      <div className={styles.sentencePreview}>
        {docTemplate.sentences
          .filter(sentence => !sentence.condition || sentence.condition(formData))
          .map((sentence, index) => (
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

