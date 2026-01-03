const { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, PageBreak } = require('docx');
const moment = require('moment');

function generatePersonalDataRulebookDoc(formData, user, company) {
  // Extract company information
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyTaxNumber = company?.companyTaxNumber || company?.taxNumber || '[ЕДБ]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';
  
  // Form data with defaults - now focused on business secrets
  const effectiveDate = formData.effectiveDate ? moment(formData.effectiveDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const productNameProtected = formData.productNameProtected || '[назив на производ/услуга]';

  const sections = [{
    children: [
        // Document header
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Во согласност со член 35 од Законот за работните односи (Службен весник на Република Македонија бр. 167/15 - Пречистен текст и сите последователни промени), ${companyName}, со седиште на адреса ул. ${companyAddress}, со ЕДБ ${companyTaxNumber}, преку Управителот ${companyManager}, на ден ${effectiveDate} година, го донесе следниот:`, 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        
        // Document title
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'П Р А В И Л Н И К', 
              bold: true, 
              size: 32 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'за заштита на деловна тајна', 
              bold: true, 
              size: 28 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 480 }
        }),

        // Section I - ОСНОВНИ ОДРЕДБИ
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'I. ОСНОВНИ ОДРЕДБИ', 
              bold: true, 
              size: 26 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 }
        }),

        // Член 1
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Член 1', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Со овој Правилник се уредува доверливоста на деловните тајни кои произлегуваат од деловното и корпоративното работење на ${companyName} (во понатамошниот текст: Друштво), како и вештините и знаењата на вработените и раководните лица во Друштвото во однос на научно/техничко/технолошки и деловни/финансиски процеси и концепти од неговата регистрираната дејност, стекнати во рамки или во врска со својот ангажман во Друштвото по основ на вработување, како и пристапот до нив и начинот и мерките за нивна заштита, чување, постапување.`, 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),

        // Член 2
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Член 2', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Под деловна тајна, во смисла на овој Правилник, се подразбира запис изразен во било која форма – писмена или електронска, предмет, на кој е содржана или од кој произлегува информција која се однесува на деловни партнери на Друштвото, вклучувајќи и клиенти или други соработници, комуникацијата остварена со нив, видот на работата и услугите кои им се давани како и други аспекти на деловните односи помеѓу Друштвото и клиентот или другиот соработник, научно/техничко и деловни/финансиски процеси и концепти на Друштвото, како и истите на деловни партнери на Друштвото, за кои Друштвото е обврзано на доверливост, до кои вработените и раководните лица во Друштвото имаат пристап, а која кумулативно ги исполнува следниве предуслови:', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: '• е тајна информација, во смисла дека, како целина или во специфична конфигурација или збир на компоненти, не е вообичаено позната или достапна на лица кои дејствуваат во области во кои флуктуира ваквиот тип на информации;', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: '• има комерцијална вредност, актуелна или потенцијална, особено поради фактот што е тајна;', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: '• е предмет на очигледни напори на организација од страна на Друштвото, истата да остане во тајност.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Под поимот деловна тајна исто така се подразбираат сите внатрешни и надворешни документи, спецификации, лични податоци, примери, истражувања на пазарот или податоци за него, финасиски или маркетиншки информации, други податоци или бизнис, оперативни или технички информации, информации за соработници, клиенти, инвеститори и други трети лица, како и сите останати податоци и информации без оглед на нивната класификјa и независно дали се дадени во писмена, вербална или електронска форма, и се во сопственост и/или се поврзуваат со ${companyName}.`, 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Како деловна тајна ќе се сметаат сите информации и податоци кои директно или индиректно можат да утврдат содржина на определен ${productNameProtected} продукт кој претходно бил работен за целите и потребите на Друштвото или неговите клиенти.`, 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Исто така, поимот деловна тајна ги опфаќа и сите други податоци кои не се сопственост на ${companyName}, а се користат за одредени цели во работните задачи и обврски. Тука спаѓаат податоци на сите партнери, клиенти, добавувачи или било кое правно или физичко лице кое со ${companyName} има засновано деловен или било каков друг однос. ${companyName} ги става податоците на располагање на Давателот на услуги во врска со погоре наведената цел а за непречено одвивање на работните задачи и обврски.`, 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Како деловна тајна ќе се сметаат сите информации, податоци, називи и други показатели кои се однесуваат на лицата кои се сметаат за сопственици, инвеститори, управители, вработени, клиенти и други соработници на ${companyName}.`, 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Под know how, во смисла на овој Правилник, се подразбира вештини и познавања кои вработениот или раководното лице во Друштвото ги создава или ги надградува на веќе постоечките, како резултат на имањето пристап до, учеството во создавањето и користењето на деловните тајни на Друштвото, кои ставени на располагање на трети лица, овластено или неовластено, би претставувале додадена вредност на know how-то или интелектуалниот капитал на тие лица и би довеле до намалување на компетитивната предност на Друштвото во однос на нив.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Под вработени во Друштвото, во смисла на овој Правилник, се подразбираат лица кои се во работен однос со Друштвото на определено и неопределено време.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Под раководни лица, во смисла на овој Правилник, се подразбираат лицата кои согласно внатрешната организација и систематизација на Друштвото имаат раководни позиции, имаат склучено со Друштвото договор за уредување на меѓусебните односи согласно Законот за трговските друштва и лица кои се избрани во органите на управување на Друштвото.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Под деловни партнери на Друштвото, во смисла на овој Правилник, се подразбираат правни субјекти, независно од дејноста за која се регистрирани, од Република Северна Македонија или од странство, со кои Друштвото има воспоставено или е во преговори да воспостави деловна соработка, а воедно, презело или може да се претпостави дека презело обврски за доверливост на нивни доверливи информации, со чија повреда, Друштвото може биде земено на одговорност за надомест на штета.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Под трети лица, во смисла на овој Правилник, се смета било кое физичко или правно лице во Република Македонија или странство, освен институции и субјекти кои по основ на закон, други прописи или посебно овластување од страна на Друштвото имаат право на пристап до деловните тајни и know how на Друштвото.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 360 }
        }),

        // Член 3
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Член 3', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Сите вработени и раководни лица во Друштвото, согласно овој Правилник, се должни да обезбедат највисок степен на доверливост на деловните тајни на Друштвото и своето know how, на начин што нема да овозможат пристап, нема да ги стават на располагање и користење на трети лица или неовластени лица во Друштвото, од небрежност, или со умисла за своја или туѓа корист.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Обврската за обезбедување доверливост на деловните тајни и know-how од страна на вработените и раководните лица во Друштвото трае до истек на две (2) години по завршување на работниот однос по било кој основ или ангажманот кај Друштвото. Раководните лица на организациони единици можат, со посебна одлука, да уредат и подолг рок на доверливост за одредени деловни тајни.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Друштвото со одредени вработени, односно, со вработени во одредени организациони единици, ќе склучи договор за заштита на доверливост и know how од злоупотреба по основ на вработување, во рамки на кој ќе се уреди и конкурентска клаузула.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 360 }
        }),

        // Член 4
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Член 4', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Примената на овој Правилник и обврските и одговоростите со него предвидени, не се толкуваат на начин со кој се ограничуваат правата на вработените и раководните лица согласно Правилникот за заштита на укажувачи на ${companyName}.`, 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 360 }
        }),

        // Член 5
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Член 5', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Примената на овој Правилник и обврските и одговорностите со него предвидени не се толкуваат на начин на кој би можел да се загрози или занемари јавниот интерес, како сигурноста на граѓаните, заштита на потрошувачите, јавното здравство, заштита на животната средина и друго.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 480 }
        }),

        // Section II - ПРИСТАП, ЧУВАЊЕ И ПОСТАПУВАЊЕ СО ДЕЛОВНИ ТАЈНИ
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'II. ПРИСТАП, ЧУВАЊЕ И ПОСТАПУВАЊЕ СО ДЕЛОВНИ ТАЈНИ', 
              bold: true, 
              size: 26 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 }
        }),

        // Член 6
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Член 6', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Раководниот и Надзорниот орган на Друштвото имаат пристап до сите деловни тајни на Друштвото.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Раководниот и Надзорниот орган на Друштвото, самостојно или на предлог на раководни лица во организациони единици, дополнително на податоците и информациите опфатени со член 2 од овој правилник, можат да дадат и налог да одреден запис или група на записи во било која форма, на кои се содржани информации кои актуелно или потенцијално имаат статус на интелектуален капитал на Друштвото или комерцијална вредност, да добијат квалификација на деловна тајна.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'По квалификацијата на деловна тајна, се смета дека сите записи од кои настанала или сите записи кои произлегуваат од деловната тајна, го имаат истиот статус.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 360 }
        }),

        // Член 7
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Член 7', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Пристап до деловна тајна за конкретниот оддел во Друштвото може да добијат само вработени во таа организациона единица, чии работни задачи и одговорности се во посредна или непосредна корелација со активностите кои произлегуваат од деловната тајна, а за кои е надлежна соодветната организациона единица.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Пристап на вработени или раководни лица до деловна тајна, во смисла на овој Правилник, подразбира целосена и непречена достапност до записите на кои е содржана и информациите во врска со деловната тајна.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 360 }
        }),

        // Член 8
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Член 8', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Секој вработен или раководно лице кој е има можност да се стекне и е овластен за пристап до деловна тајна, има обврска за чување или обезбедување на начините со кој е овозможен тој пристап.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 360 }
        }),

        // Член 9
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Член 9', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Друштвото, во насока на заштита на своите деловни тајни и know how, пред иницирање на соработка со трети лица, како и во тек на реализација на соработка со трети лица, доколку се наметне потреба, во чии рамки постои можност за откривање на информации кои содржат деловна тајна од страна на Друштвото, без исклучок ќе склучува договори за доверливост со тие трети лица во кои ќе биде предвидена соодветна формално правна и материјално правна заштита на позицијата на Друштвото во заштита на своите деловните тајни.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 480 }
        }),

        // Постапување со информации од деловна тајна во форма на печатен документ
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Постапување со информации од деловна тајна во форма на печатен документ', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 }
        }),

        // Член 10
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Член 10', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Печатените документи кои содржат деловна тајна, а кои за согласно прописите за архивско работење е потребна архивска заверка, се заверувааат во посебен деловодник кој се води во архивската служба на Друштвото.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Документите од став 1 се чуваат одвоено од останатата документација на Друштвото, на начин кој ќе овозможи контролиран физички пристап до истите.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 360 }
        }),

        // Член 11
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Член 11', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Доставувањето на печатените документи кои содржат деловна тајна во рамкии на Друштвото се врши преку посебна интерна доставна книга. Приемот на документот го потврдува со свој потпис лично лицето за кого е наменет истиот за достава.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 480 }
        }),

        // Постапување со информации од деловна тајна во електронска форма
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Постапување со информации од деловна тајна во електронска форма', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 }
        }),

        // Член 12
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Член 12', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Информациите кои содржат деловна тајна во електронска форма, се обезбедуваат во рамки на информатичкиот систем на Друштвото и/или преку електронските пошти доделени на вработените за комуникација со други вработени и надворешни лица.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 480 }
        }),

        // Section III - ПОВРЕДА НА ДОВЕРЛИВОСТ НА ДЕЛОВНА ТАЈНИ И KNOW HOW
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'III. ПОВРЕДА НА ДОВЕРЛИВОСТ НА ДЕЛОВНА ТАЈНИ И KNOW HOW', 
              bold: true, 
              size: 26 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 }
        }),

        // Член 13
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Член 13', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Вработен или раководно лице врши повреда на доверливост на деловна тајна или know how на Друштвото во случај на повреда на член 3 став 1 од овој Правилник, односно во случај на овозможување пристап, ставање на располагање и користење на трети лица или неовластени лица во Друштвото, на истите, од небрежност, или со умисла за своја или туѓа корист, без разлика на фактичката штета која Друштвото ја претрпело поради повредата.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'За извршената повреда од став 1 на овој член, вработениот или раководното лице му одговара на Друштвото согласно Правилата за работен ред и дисциплина и Законот за работните односи, како и е должно да му ја надомести на Друштвото целокупната штета и да го обештети Друштвото за износот кој Друштвото ќе биде обврзано да го исплати на деловни партнери, надлежни институции и останати трети лица, како резултат на повреда од страна на вработениот и раководното лице на член 3 став 1 од овој Правилник.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Одговорноста на вработениот или раководното лице од став 1 на овој член, до степен до кој е применливо, подразбира неограничена самостојна, морална, материјална, прекршочна и кривична одговорност на истите пред домашни и странски институции и/или материјална одговорност пред Друштвото согласно правилата за дисциплинска одговорност на Друштвото и/или самостојна материјална и нематеријална одговорност пред трети лица.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'При утврдување на одговорноста на вработениот или раководното лице, Друштвото ќе ги има предвид следниве критериуми:', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: '• вредноста или други специфични карактеристики на деловната тајна или know how;', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: '• работната позиција на вработениот во Друштвото;', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: '• мерките кои тој ги презел за заштита на деловната тајна или know how;', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: '• неговото однесување при вршењето на повредата;', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: '• влијанието на повредата за Друштвото;', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: '• бенефитот на трети лица заради повредата;', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: '• легитимен интерес на деловни партнери во врска со повредата.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'При утврдувањето на надоместот на штета која вработениот или раководното лице е должно да му ја надомести на Друштвото заради извршена повреда, Друштвото ќе се раководи од принципот на пропорционалност и ќе ги примени следниве критериуми:', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: '• изгубена добивка/намалување на компетитивна предност на Друштвото', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: '• неовластено стекнување добивка/стекнување со компетитивна предност на трети лица', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: '• одговорност на Друштвото пред деловни партнери заради повредата.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 480 }
        }),

        // Section IV - ПРЕОДНИ И ЗАВРШНИ ОДРЕДБИ
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'IV. ПРЕОДНИ И ЗАВРШНИ ОДРЕДБИ', 
              bold: true, 
              size: 26 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 }
        }),

        // Член 14
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Член 14', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'За се што не е определено со овој правилник, применлив е Законот за работните односи.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 360 }
        }),

        // Член 15
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Член 15', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Овој Правилник за заштита на деловна тајна ги определува и податоците кои се определи од работодавачот за деловна тајна во смисла на член 35 од Законот за работните односи.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Овој Правилник за заштита на деловна тајна може да се дополни и со дополнителни податоци (Листа на податоци) кои се сметаат за деловна тајна, која листа ќе биде прилог и составен дел на овој правилник.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Околноста што определен податок не е определен со Листата на податоци не значи дека истиот не се смета за деловна тајна доколку истиот е опфатен или опишан со член 2 од овој Правилник.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 360 }
        }),

        // Член 16
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Член 16', 
              bold: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Овој Правилник стапува на сила на денот на неговото објавување и важи за сите вработени на Друштвото.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Правилник се објавува на огласна табла во просториите на работодавачот.', 
              size: 22 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 480 }
        }),

        // Signature section
        new Paragraph({
          children: [
            new TextRun({ text: '___________________________', size: 22 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0, line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: companyName, size: 22 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0, line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: companyManager, size: 22 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300, line: 276 }
        })
      ]
  }];

  const doc = new Document({ sections });

  return { doc, sections };
}

module.exports = generatePersonalDataRulebookDoc;