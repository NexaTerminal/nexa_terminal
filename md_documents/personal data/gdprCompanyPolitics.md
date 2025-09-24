# GDPR Policy Document Variables - Integrated with Document Structure

## Core Company Variables (Already Provided)
```
{companyName} - Company name
{companyAddress} - Company registered address  
{companyTaxNumber} - Company tax/registration number (EDB)
{companyEmail} - Company email for data subject requests
{companyDPO} - Data Protection Officer name
{companyDPOemail} - DPO email address
{companyDPOphone} - DPO phone number
{date} - Policy adoption date
```

## SECTION I - Strategic Goals Variables

### Processing Scope Definition
```
{primaryBusinessActivity} - Primary business activity dropdown:
- Трговија и услуги
- Производство
- Финансиски услуги
- Здравствени услуги
- Образование
- ИТ и технологија
- Човечки ресурси
- Маркетинг и реклами

{dataProcessingComplexity} - Data processing complexity level:
- Едноставно (основни контакт податоци)
- Средно (клиентски профили и историја)
- Комплексно (аналитика и профилирање)
- Високо комплексно (автоматски одлуки и специјални податоци)
```

## SECTION II - Rights Customization Variables

### Rights Availability Based on Processing
```
{processesSpecialCategories} - Processes special categories of personal data (checkbox)
- If checked: Add enhanced consent withdrawal procedures
- If unchecked: Standard rights only

{usesAutomatedDecisionMaking} - Uses automated decision-making (checkbox)  
- If checked: Include detailed Section 9 about automated decisions
- If unchecked: Simplified mention only

{performsDirectMarketing} - Performs direct marketing (checkbox)
- If checked: Enhanced objection rights in Section 8
- If unchecked: Standard objection procedures

{dataPortabilityApplicable} - Data portability applicable (checkbox)
- If checked: Full Section 7 implementation
- If unchecked: Note that portability may not apply to all data types

{hasInternationalTransfers} - Transfers data internationally (checkbox)
- If checked: Add specific information requirements about transfers
- If unchecked: Remove international transfer references
```

### Data Types Impact on Rights
```
{personalDataCategories} - Categories of personal data processed (multi-select):
- Основни идентификациски податоци
- Финансиски податоци  
- Здравствени податоци
- Биометриски податоци
- Локациски податоци
- Онлајн идентификатори
- Професионални податоци

{sensitiveDataProcessing} - Special categories processed (multi-select):
- Здравствени информации
- Биометриски податоци  
- Генетски податоци
- Политички мислења
- Верски уверувања
- Сексуален живот
- Криминални осуди
```

## SECTION III - Submission Procedures Variables

### Contact Methods Customization
```
{allowEmailSubmission} - Allow email submissions (checkbox)
{allowPostalSubmission} - Allow postal submissions (checkbox)  
{allowInPersonSubmission} - Allow in-person submissions (checkbox)
{allowOnlinePortalSubmission} - Allow online portal submissions (checkbox)

{requireAppointmentForInPerson} - Require appointment for in-person visits (checkbox)
{hasPhysicalOfficeHours} - Has specific office hours for visits (checkbox)
{officeHoursDetails} - Office hours details (text input if above checked)

{alternativeSubmissionMethods} - Additional submission methods (multi-select):
- Препорачана пошта
- Електронски потпис  
- Мобилна апликација
- Портал за клиенти
```

### Identity Verification Requirements
```
{identityVerificationLevel} - Identity verification level dropdown:
- Основно (само име и адреса)
- Стандардно (ID документ за сите барања)
- Засилено (нотаризирана документација за специјални податоци)
- Максимално (лична верификација за сите барања)

{acceptedIdentityDocuments} - Accepted identity documents (multi-select):
- Лична карта
- Пасош  
- Возачка дозвола
- ID карта на странски државјанин

{allowThirdPartySubmission} - Allow third-party submissions with authorization (checkbox)
{requireNotarizedAuthorization} - Require notarized authorization for third parties (checkbox)
```

## SECTION IV - Processing Procedures Variables

### Response Time Customization
```
{standardResponseTime} - Standard response time dropdown:
- 15 дена (за сите барања)
- 30 дена (за сите барања)  
- Варијабилно според типот

{informationRequestTime} - Information request response time:
- 15 дена
- 30 дена
- еден месец

{correctionRequestTime} - Correction request response time:
- 15 дена
- 30 дена

{deletionRequestTime} - Deletion request response time:
- 15 дена  
- 30 дена
- еден месец

{complexRequestExtension} - Allow extension for complex requests (checkbox)
{extensionPeriod} - Extension period if above checked:
- Дополнителни 30 дена
- Дополнителни 60 дена
- До 3 месеца вкупно
```

### Internal Processing Structure  
```
{hasDedicatedDPO} - Has dedicated Data Protection Officer (checkbox)
{dpoIsInternal} - DPO is internal employee (checkbox)
{dpoIsExternal} - DPO is external consultant (checkbox)

{responsibleDepartment} - Primary responsible department dropdown:
- Правен оддел
- Човечки ресурси
- ИТ оддел  
- Административен оддел
- Посебен оддел за приватност

{hasDataProtectionTeam} - Has dedicated data protection team (checkbox)
{teamSize} - Team size if above checked:
- 1 лице
- 2-3 лица
- 4-5 лица
- Повеќе од 5 лица
```

### Record Keeping Requirements
```
{usesCentralizedRegistry} - Uses centralized request registry (checkbox)
{registrySystem} - Registry system type dropdown:
- Манулна евиденција  
- Excel табели
- Посебен софтвер за GDPR
- CRM систем
- ERP интеграција

{auditTrailLevel} - Audit trail detail level:
- Основни информации
- Детаљно следење на сите чекори
- Временски печати и одговорни лица
- Целосна документација со прилози
```

## SECTION V - Third Party Notification Variables

### Data Sharing Complexity
```
{sharesDataWithThirdParties} - Shares data with third parties (checkbox)

{typicalDataRecipients} - Typical data recipients (multi-select):
- ИТ провајдери
- Сметководители  
- Правни советници
- Маркетиншки агенции
- Логистички партнери
- Финансиски институции
- Владини органи

{notificationComplexity} - Third-party notification complexity:
- Едноставно (неколку познати партнери)
- Средно (до 10 редовни партнери)
- Комплексно (повеќе од 10 партнери)
- Многу комплексно (динамички партнери)

{hasAutomatedNotificationSystem} - Has automated notification system for partners (checkbox)
```

## SECTION VI - Objection and Automated Decision Variables

### Marketing and Profiling
```
{conductsDirectMarketing} - Conducts direct marketing activities (checkbox)
{marketingChannels} - Marketing channels used (multi-select):
- Електронска пошта
- SMS/телефонски повици  
- Директна пошта
- Социјални мрежи
- Веб реклами

{usesProfilingForMarketing} - Uses profiling for marketing (checkbox)
{profilingMethods} - Profiling methods (multi-select if above checked):
- Анализа на купувачки навики
- Демографско таргетирање  
- Анализа на однесување на веб
- Предиктивна аналитика
```

### Automated Decision Making
```
{hasAutomatedDecisionMaking} - Makes automated decisions affecting individuals (checkbox)

{automatedDecisionTypes} - Types of automated decisions (multi-select if above checked):
- Кредитни одлуки
- Вработување/селекција  
- Ценовни одлуки
- Препораки за производи
- Процена на ризик
- Фрод детекција

{humanReviewAvailable} - Human review available for automated decisions (checkbox)
{rightToExplanation} - Provides explanations for automated decisions (checkbox)

{safeguardMeasures} - Safeguard measures for automated decisions (multi-select):
- Право на човечка интервенција
- Право на објаснување на логиката  
- Право на оспорување на одлуката
- Редовна контрола на алгоритмите
```

## SECTION VII - Contact Information Variables

### Contact Method Preferences
```
{preferredContactLanguages} - Preferred contact languages (multi-select):
- Македонски
- Албански  
- Англиски
- Српски

{businessHours} - Business hours for contact:
- 08:00-16:00, понеделник-петок
- 09:00-17:00, понеделник-петок  
- Прошири викенди
- 24/7 за итни случаи

{hasMultipleContactChannels} - Multiple contact channels available (checkbox)
{emergencyContactAvailable} - Emergency contact for urgent requests (checkbox)
```

## SECTION VIII - Implementation Variables

### Training and Compliance
```
{staffTrainingLevel} - Staff training level dropdown:
- Основна едукација за клучни лица
- Редовни обуки за сите вработени
- Специјализирани обуки по одделения  
- Сертифицирани обуки за GDPR

{policyUpdateFrequency} - Policy update frequency:
- Годишно
- На секои 2 години
- При промена на законодавство  
- При значајни промени во работењето

{complianceMonitoring} - Compliance monitoring level:
- Самооценување  
- Интерни проверки
- Надворешни аудити
- Континуиран мониторинг
```

## Document Customization Logic:

### Conditional Content Rules:
1. **If {processesSpecialCategories} = true**: 
   - Add enhanced identity verification requirements
   - Include specific consent withdrawal procedures
   - Add safeguards for special data processing

2. **If {usesAutomatedDecisionMaking} = true**:
   - Include full Section VI on automated decisions
   - Add right to human intervention
   - Include explanation requirements

3. **If {hasInternationalTransfers} = true**:
   - Add international transfer notification in rights section
   - Include transfer safeguards information

4. **If {sharesDataWithThirdParties} = true**:
   - Enhance Section V with detailed notification procedures
   - Add complexity-based timeframes

5. **Response Time Logic**:
   - If {dataProcessingComplexity} = "Високо комплексно": Use maximum allowed times
   - If {complexRequestExtension} = true: Add extension clause

6. **Contact Methods Logic**:
   - Only include sections for methods where checkbox = true
   - Add specific requirements based on verification level

### Dynamic Content Sections:
- **Rights availability**: Filter based on processing activities
- **Response procedures**: Scale complexity with data volume
- **Notification obligations**: Match with recipient complexity  
- **Safeguards**: Match with risk level of processing

Врз основа на законските одредби содржани во Законот за заштита на личните податоци (Службен весник на РСМ бр. 42/20, 294/21, 101/2025) и Правилникот за безбедност на обработката на личните податоци (Службен весник на РСМ бр. 266/24), {companyName}, правно лице со регистрирано седиште на локација: {companyAddress}, идентификувано со ЕДБ {companyTaxNumber} (во последователниот текст означено како „Правното субјект" или „Контролор на податоци"), на датум {date} година ја усвои нижеследната:
ПОЛИТИКА ЗА АДМИНИСТРИРАЊЕ СО ПРАВАТА НА СУБЈЕКТИТЕ НА ПЕРСОНАЛНИ ПОДАТОЦИ
I. ВОВЕДНИ ОДРЕДБИ И СТРАТЕШКИ ЦЕЛИ
Оваа Политика ги дефинира основните принципи, оперативните процедури и институционалните одговорности на Друштвото при прием, процесирање и формулирање одговор на барањата за реализирање на правата на субјектите на персонални податоци. Политиката се имплементира во конформност со законските одредби од Законот за заштита на личните податоци, како и во согласност со заштитната мерка „Интервенирање" дефинирана во Правилникот за безбедност на обработка на личните податоци ("Службен весник на РСМ" бр. 266/24).
Стратешката цел на Политиката е да гарантира ефективно, навремено и транспарентно административно постапување со сите барања поднесени од субјектите на персонални податоци во контекст на обработувањето кое го извршува Правното субјект.
Оваа Политика претставува обврзувачки правен инструмент за сите вработени лица кои, според нивната функционална позиција или професионални задолженија, се во можност да примаат барања или да партиципираат во процесот на нивното административно обработување.
II. ПРАВНИ ОСНОВИ НА СУБЈЕКТИТЕ НА ПЕРСОНАЛНИТЕ ПОДАТОЦИ
Субјектите на персонални податоци поседуваат право да иницираат барања за реализирање на нижеследните права во однос на податоците кои се предмет на обработување од страна на Правното субјект:
1.	Право на транспарентно информирање: Субјектот поседува право да биде компрехензивно информиран за: идентитетот и контакт-елементите на контролорот на податоци, целите на обработувањето, правно-регулаторната основа, категоријалната класификација на персонални податоци, реципиентите, временските рамки на ретенција, неговите законски права и други релевантни информациски содржини.
2.	Право на директен пристап: Субјектот поседува право да добие официјална потврда дали се извршува обработување на персонални податоци кои се однесуваат на неговата личност, директен пристап до наведените податоци и исцрпни информации во врска со процесот на обработување.
3.	Право на корективна исправка: Субјектот поседува право да инициира барање за исправување на неточни или надополнување на нецелосни персонални податоци кои се однесуваат на неговата личност.
4.	Право на дефинитивно бришење („право на дигитално заборавање"): Субјектот поседува право да барает елиминирање на неговите персонални податоци без неоправдано пролонгирање, доколку е реализиран некој од нижеследните критериуми:
o	податоците повеќе не се неопходни за целите за кои биле првично собирани;
o	субјектот ја отповикал дадената согласност;
o	податоците се обработувале во контравенција со законската регулатива;
o	податоците мора да се елиминираат поради императивна законска обврска.
5.	Право на рестриктивно ограничување на обработката: Субјектот поседува право да барает ограничување на обработувањето, особено:
o	кога ја контестира веродостојноста на податоците,
o	кога обработувањето е во контравенција со законот, а субјектот не барает бришење,
o	кога податоците не се неопходни, но субјектот ги барает за остварување на правни побарувања.
6.	Право на нотификација во врска со корекции, елиминирање или рестрикции: Контролорот на податоци има императивна обврска да ги извести сите реципиенти на кои податоците им биле дискутирани за секоја извршена корекција, елиминирање или ограничување, освен доколку тоа е технички неизводливо или бара диспропорционален оперативен ангажман.
7.	Право на портабилност на податоци: Субјектот поседува право да ги добие своите персонални податоци во структурно организиран, стандардно употребуван и машински интерпретабилен формат и да ги трансферира на алтернативен контролор, доколку:
o	обработувањето се базира на согласност или договорни односи,
o	и се извршува на автоматизиран начин.
8.	Право на формален приговор: Субјектот поседува право во секој временски момент да поднесе приговор на обработувањето на персоналните податоци кое се извршува врз основа на:
o	легитимни интереси на контролорот или трета странка,
o	директни маркетиншки активности, вклучително и профилирање поврзано со комерцијални цели.
9.	Права поврзани со автоматизирано процесирање на одлуки, инклузивно профилирање: Субјектот поседува право да не биде подложен на одлука заснована исклучиво на автоматска обработка, вклучувајќи профилирање, доколку таквата одлука генерира правни консеквенци или значително воздејствие врз неговата личност.
III. ПРОЦЕДУРАЛНИ МОДАЛИТЕТИ ЗА ПОДНЕСУВАЊЕ НА БАРАЊЕ ЗА ОСТВАРУВАЊЕ НА ПРАВА
Субјектите на персонални податоци поседуваат право да иницираат писмено и/или електронско барање за реализирање на нивните права предвидени со Законот за заштита на личните податоци. Барањата можат да се достават преку електронска комуникација, лично во административната служба на Правното субјект, или преку алтернативен модалитет утврден од Правното субјект.
Секое барање мора да содржи прецизна идентификација на субјектот и дескриптивен опис на правото што се реализира.
Барањата за остварување на правата можат да се поднесат во писмена форма:
•	По поштенски сообраќај на адреса: {companyAddress}, Република Северна Македонија
•	По електронска комуникација: {companyEmail}
Субјектот на персоналните податоци е должен да ги специфицира нижеследните информации во барањето за да овозможи негово административно процесирање:
•	Лично име и фамилијарно име;
•	Резиденцијална адреса и контакт-елементи (телефонски број, електронска пошта);
•	Детаљно образложение на барањето (кое право има намера да го реализира);
•	Кои персонални податоци се предмет на барањето;
•	Календарски датум и автограф (за писмени барања).
Друштвото може да побара дополнителни информации или доказ за идентификација на субјектот на податоци, доколку постојат разумни сомнежи во идентитетот на лицето кое го поднесува барањето. Ова се извршува за да се заштитат податоците на субјектот.
IV. АДМИНИСТРАТИВНА ПРОЦЕДУРА ЗА ПОСТАПУВАЊЕ ПО БАРАЊЕ
Друштвото постапува по секое поднесено барање од субјект на персонални податоци без неоправдано пролонгирање, а најдоцна во законски рок од 15 дена од денот на официјалниот прием на барањето.
Составен дел од оваа политика е Формуларот – Барање за пристап, исправка и елиминирање на персонални податоци.
Доколку барањето е нејасно дефинирано или нецелосно, Друштвото поседува право да побара дополнителни информации. Одговорот се доставува во писмена или електронска форма, во зависност од модалитетот на поднесување на барањето. Постапувањето по барањата се евидентира во специјализирана евиденција, согласно принципот на институционална отчетност.
Сите барања добиени преку горенаведените комуникациски канали се евидентираат и се проследуваат до Офицерот за заштита на персоналните podatoci или до одговорното лице/департман за ЗЗЛП во Правното субјект.
Се води централизирана евиденција за сите примени барања, инклузивно го календарскиот датум на прием, типологијата на барањето, субјектот, преземените активности и календарскиот датум на одговор.
Офицерот за заштита на персоналните податоци или одговорното лице/департман извршува верификација на идентитетот на подносителот на барањето.
Офицерот за заштита на персоналните податоци/одговорното лице/департман, во колаборација со релевантните организациски единици, го евалуира барањето и ги презема соодветните активности за негово исполнување.
Одговорот до субјектот на персонални податоци се формулира во писмена форма (по поштенски сообраќај или електронски) без неоправдано пролонгирање, односно:
1.	Контролорот на податоци има императивна обврска да постапи и да одговори на барањата на субјектот на персоналните податоци во рок од еден месец од денот на официјалниот прием на Барањето за информирање;
2.	во рок од 15 дена од денот на официјалниот прием на Барањето за исправка или дополнување, односно
3.	на Барањето на субјектот на персоналните податоци за елиминирање на персоналните податоци или ограничување на обработувањето Контролорот на податоци има императивна обврска да одговори во рок од 30 дена од денот на официјалниот прием на Барањето.
Доколку Друштвото одбие да постапи по барањето, го нотифицира субјектот за причинителите за одбивањето и за неговото право да поднесе барање до Агенцијата за заштита на личните податоци или да иницира постапка пред компетентниот судски орган.
Барањата можат да бидат одбиени доколку се манифестно неосновани или ексцесивни, особено поради нивниот повторувачки карактер, при што Друштвото може да наплати разумен надомест или да одбие да постапи по барањето, доколку тоа е неосновано или ексцесивно.
V. ОБВРСКИ ПРИ ПОСТАПУВАЊЕ ПО БАРАЊЕ ЗА ПРИСТАП, ИСПРАВКА, ЕЛИМИНИРАЊЕ И ОГРАНИЧУВАЊЕ
Друштвото ги нотифицира сите реципиенти на кои персоналните податоци им биле дискутирани за секоја извршена исправка, елиминирање или ограничување на обработувањето, освен доколку таквата нотификација е технички неизводлива или би претставувала диспропорционален оперативен ангажман.
VI. СПЕЦИЈАЛНИ ОДРЕДБИ ЗА ПРАВОТО НА ПРИГОВОР И АВТОМАТСКО ПРОЦЕСИРАЊЕ НА ОДЛУКИ
Субјектот поседува право да поднесе приговор против обработувањето на неговите персонални податоци, а Друштвото има обврска да прекине со обработувањето, освен доколку докаже дека постојат легитимни и оправдани основи за обработувањето што преовладуваат над интересите, правата и слободите на субјектот на персонални податоци, или за утврдување, реализирање или одбрана на правни побарувања.
Доколку податоците се обработуваат за цели на директен маркетинг, субјектот поседува право на приговор во секој временски момент, а Друштвото веднаш прекинува со обработувањето за овие цели.
Субјектот поседува право да не биде подложен на одлука заснована исклучиво на автоматска обработка, инклузивно профилирање, која генерира правни ефекти или на аналоген начин значително воздејствува врз неговата личност. Исклучоци се применливи доколку одлуката е неопходна за склучување/извршување на договорни односи, е дозволена со законска регулатива, или се заснова на експлицитна согласност на субјектот. Во овие случаи, Друштвото обезбедува соодветни заштитни механизми.
VII. КОНТАКТ-ИНФОРМАЦИИ ЗА ОСТВАРУВАЊЕ НА ПРАВАТА НА СУБЈЕКТИТЕ НА ПЕРСОНАЛНИТЕ ПОДАТОЦИ
За сите прашања и барања за реализирање на правата, субјектите на персонални податоци можат да го контактираат Офицерот за заштита на персоналните податоци (или одговорното лице/департман) на Друштвото преку користење на нижеследните контакт-елементи:
Контакт-информации: ОФЗЛП: {companyDPO} Електронска адреса: {companyDPOemail} Контакт телефон: {companyDPOphone}
VIII. ТРАНЗИЦИСКИ И ФИНАЛНИ ОДРЕДБИ
Оваа Политика претставува интегрален составен дел на системот за заштита на персоналните податоци на Правното субјект.
Секој вработен има императивна обврска да биде запознаен со нејзината содржина и да ја имплементира.
Оваа Политика влегува во правна сила со денот на нејзиното официјално усвојување.
Прилог 1: Формулар – Барање за пристап, исправка и елиминирање на персонални податоци.
{date} година.
 
{companyName}

