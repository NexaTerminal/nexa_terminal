/**
 * Offer Request Email Templates - Macedonian language templates for marketplace workflow
 * Handles all email communications in the "Побарај понуда" system
 */

/**
 * Admin notification when new offer request is submitted
 */
const adminNewRequestNotification = (request, user) => {
  const qualityIndicators = request.qualityIndicators || {};
  const qualityScore = qualityIndicators.qualityScore || 0;
  const spamScore = qualityIndicators.spamScore || 0;
  const wordCount = qualityIndicators.wordCount || 0;

  const qualityLevel = qualityScore >= 70 ? '✅ Високо' :
                      qualityScore >= 50 ? '⚠️ Средно' : '❌ Ниско';

  const spamLevel = spamScore <= 20 ? '✅ Ниско' :
                   spamScore <= 40 ? '⚠️ Средно' : '❌ Високо';

  const categoryLabel = request.requestCategory === 'legal' ? 'Правни услуги' : 'Услуги';

  return {
    subject: `🔔 Ново барање - ${categoryLabel} (${request.serviceType})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1E4DB7 0%, #4F46E5 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📝 Ново барање за понуда</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Системот за барање понуди</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #1f2937; margin-top: 0;">Основни информации</h2>
          <table style="width: 100%; margin-bottom: 25px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Компанија:</td>
              <td style="padding: 8px 0; color: #1f2937;"><strong>${user.companyInfo?.companyName || 'Непознато'}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Email:</td>
              <td style="padding: 8px 0; color: #1f2937;">${user.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Категорија:</td>
              <td style="padding: 8px 0; color: #1f2937;"><span style="background: ${request.requestCategory === 'legal' ? '#fef3c7' : '#ecfdf5'}; color: ${request.requestCategory === 'legal' ? '#92400e' : '#065f46'}; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${categoryLabel}</span></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Услуга:</td>
              <td style="padding: 8px 0; color: #1f2937;"><span style="background: #dbeafe; color: #1d4ed8; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${request.serviceType}</span></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Буџет:</td>
              <td style="padding: 8px 0; color: #1f2937;">${request.budgetRange}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Тип:</td>
              <td style="padding: 8px 0; color: #1f2937;">${request.projectType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Рок:</td>
              <td style="padding: 8px 0; color: #1f2937;">${request.timeline}</td>
            </tr>
          </table>

          <h3 style="color: #1f2937; margin-bottom: 15px;">Опис на барањето</h3>
          <div style="background: #f9fafb; border-left: 4px solid #1E4DB7; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
            <p style="margin: 0; line-height: 1.6; color: #374151;">${request.projectDescription}</p>
          </div>

          <h3 style="color: #1f2937; margin-bottom: 15px;">📊 Показатели за квалитет</h3>
          <table style="width: 100%; background: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Квалитет скор:</td>
              <td style="padding: 8px 0; color: #1f2937;">${qualityLevel} (${qualityScore}%)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Спам ризик:</td>
              <td style="padding: 8px 0; color: #1f2937;">${spamLevel} (${spamScore}%)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Број зборови:</td>
              <td style="padding: 8px 0; color: #1f2937;">${wordCount} зборови</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Дупликат проверка:</td>
              <td style="padding: 8px 0; color: #1f2937;">${qualityIndicators.duplicateCheck ? '⚠️ Можен дупликат' : '✅ Уникатно'}</td>
            </tr>
          </table>

          ${Object.keys(request.serviceSpecificFields || {}).length > 0 ? `
            <h3 style="color: #1f2937; margin-bottom: 15px;">Дополнителни информации</h3>
            <table style="width: 100%; margin-bottom: 25px;">
              ${Object.entries(request.serviceSpecificFields).map(([key, value]) => `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">${key}:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${value}</td>
                </tr>
              `).join('')}
            </table>
          ` : ''}

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; margin-bottom: 20px;">Прегледајте го барањето и донесете одлука:</p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/terminal/admin/offer-requests"
               style="background: #1E4DB7; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: 600;">
              📝 Прегледај во админ панел
            </a>
          </div>
        </div>

        <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Неxa Terminal - Системот за автоматизација на деловни документи</p>
          <p style="margin: 5px 0 0 0;">Оваа порака е автоматски генерирана од системот за барање понуди.</p>
        </div>
      </div>
    `,
    text: `
Ново барање за понуда - ${request.serviceType}

Основни информации:
- Компанија: ${user.companyInfo?.companyName || 'Непознато'}
- Email: ${user.email}
- Услуга: ${request.serviceType}
- Буџет: ${request.budgetRange}
- Тип: ${request.projectType}
- Рок: ${request.timeline}

Опис на барањето:
${request.projectDescription}

Показатели за квалитет:
- Квалитет скор: ${qualityScore}%
- Спам ризик: ${spamScore}%
- Број зборови: ${wordCount}
- Дупликат проверка: ${qualityIndicators.duplicateCheck ? 'Можен дупликат' : 'Уникатно'}

Прегледајте го барањето на: ${process.env.CLIENT_URL || 'http://localhost:3000'}/terminal/admin/offer-requests

Nexa Terminal - Системот за автоматизација на деловни документи
    `
  };
};

/**
 * Provider invitation to express interest
 */
const providerInterestInvitation = (request, provider, interestToken) => {
  const responseUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/provider-response/${interestToken}`;
  const categoryLabel = request.requestCategory === 'legal' ? 'правни услуги' : 'услуги';
  const categoryIcon = request.requestCategory === 'legal' ? '⚖️' : '💼';

  return {
    subject: `${categoryIcon} Ново барање за ${categoryLabel} - ${request.serviceType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">${categoryIcon} Ново барање за ваши ${categoryLabel}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Можност за нов проект</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Здраво <strong>${provider.name}</strong>,</p>

          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 25px;">
            Имаме ново барање за <strong>${request.serviceType}</strong> ${request.requestCategory === 'legal' ? '(правни услуги)' : ''} што се совпаѓа со вашата експертиза.
            Ова е одлична можност да се поврзете со нов клиент.
          </p>

          <div style="background: #f0f9ff; border: 1px solid #0284c7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #0284c7; margin-top: 0; margin-bottom: 15px;">📋 Details за проектот</h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 120px;">Услуга:</td>
                <td style="padding: 8px 0; color: #1f2937;"><strong>${request.serviceType}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Буџет:</td>
                <td style="padding: 8px 0; color: #1f2937;">${request.budgetRange}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Тип:</td>
                <td style="padding: 8px 0; color: #1f2937;">${request.projectType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Рок:</td>
                <td style="padding: 8px 0; color: #1f2937;">${request.timeline}</td>
              </tr>
            </table>
          </div>

          <h3 style="color: #1f2937; margin-bottom: 15px;">Опис на проектот</h3>
          <div style="background: #f9fafb; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
            <p style="margin: 0; line-height: 1.6; color: #374151;">${request.projectDescription}</p>
          </div>

          ${Object.keys(request.serviceSpecificFields || {}).length > 0 ? `
            <h3 style="color: #1f2937; margin-bottom: 15px;">Дополнителни барања</h3>
            <ul style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
              ${Object.entries(request.serviceSpecificFields).map(([key, value]) => `
                <li style="margin-bottom: 8px;"><strong>${key}:</strong> ${value}</li>
              `).join('')}
            </ul>
          ` : ''}

          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #92400e; margin-top: 0; margin-bottom: 10px;">⏰ Важно</h4>
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              Овој линк е важечки <strong>7 дена</strong> и е уникатен за вас.
              Не го споделувајте со други. Првите провајдери што ќе одговорат имаат подобри шанси за соработка.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; margin-bottom: 20px; font-size: 16px;">Како ќе одговорите на ова барање?</p>

            <div style="margin-bottom: 20px;">
              <a href="${responseUrl}"
                 style="background: #10b981; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; margin: 5px;">
                ✅ Прифаќам - Детална понуда
              </a>
            </div>

            <div style="margin-bottom: 20px;">
              <a href="${responseUrl}"
                 style="background: #ef4444; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block; font-weight: 500; font-size: 14px; margin: 5px;">
                ❌ Одбивам
              </a>
              <a href="${responseUrl}"
                 style="background: #f59e0b; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block; font-weight: 500; font-size: 14px; margin: 5px;">
                🚫 Отпиши ме
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 14px; margin-top: 15px;">
              <strong>Напомена:</strong> Сите опции ве водат кон ист формулар каде можете да изберете ваш одговор.
            </p>
            <small style="color: #9ca3af;">Линк: ${responseUrl}</small>
          </div>
        </div>

        <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Nexa Terminal - Поврзување на бизниси во Македонија</p>
          <p style="margin: 5px 0 0 0;">Ова барање е анонимно до моментот кога ќе изразите интерес.</p>
        </div>
      </div>
    `,
    text: `
Ново барање за ${request.serviceType} - Изразете интерес

Здраво ${provider.name},

Имаме ново барање за ${request.serviceType} услуги што се совпаѓа со вашата експертиза.

Детали за проектот:
- Услуга: ${request.serviceType}
- Буџет: ${request.budgetRange}
- Тип: ${request.projectType}
- Рок: ${request.timeline}

Опис на проектот:
${request.projectDescription}

За да одговорите на барањето (Прифати/Одбиј/Отпиши се), посетете:
${responseUrl}

Овој линк е важечки 7 дена и е уникатен за вас.

Nexa Terminal - Поврзување на бизниси во Македонија
    `
  };
};

/**
 * Provider interest confirmation
 */
const providerInterestConfirmation = (provider, interestData, request) => {
  return {
    subject: `✅ Вашиот интерес е успешно поднесен - ${request.serviceType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">✅ Интересот е поднесен</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Успешна регистрација</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Здраво <strong>${provider.name}</strong>,</p>

          <p style="color: #059669; font-size: 18px; font-weight: 600; margin-bottom: 20px;">
            🎉 Вашиот интерес за проектот е успешно поднесен!
          </p>

          <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #059669; margin-top: 0; margin-bottom: 15px;">Резиме на вашиот одговор</h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 150px;">Проект:</td>
                <td style="padding: 8px 0; color: #1f2937;"><strong>${request.serviceType}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Достапност:</td>
                <td style="padding: 8px 0; color: #1f2937;">${interestData.availability}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Буџет:</td>
                <td style="padding: 8px 0; color: #1f2937;">${interestData.budgetAlignment}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Контакт:</td>
                <td style="padding: 8px 0; color: #1f2937;">${interestData.preferredContact || 'Email'}</td>
              </tr>
            </table>
          </div>

          <h3 style="color: #1f2937; margin-bottom: 15px;">Вашата понуда</h3>
          <div style="background: #f9fafb; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
            <p style="margin: 0; line-height: 1.6; color: #374151;">${interestData.proposal}</p>
          </div>

          ${interestData.portfolio ? `
            <p style="color: #374151; margin-bottom: 15px;">
              <strong>Портфолио:</strong> <a href="${interestData.portfolio}" style="color: #10b981;">${interestData.portfolio}</a>
            </p>
          ` : ''}

          ${interestData.nextSteps ? `
            <h4 style="color: #1f2937; margin-bottom: 10px;">Следни чекори</h4>
            <p style="color: #374151; margin-bottom: 25px; line-height: 1.6;">${interestData.nextSteps}</p>
          ` : ''}

          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #92400e; margin-top: 0; margin-bottom: 10px;">📞 Што се случува понатаму?</h4>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>Клиентот ќе го прегледа вашиот интерес</li>
              <li>Ако е заинтересиран, ќе ве контактира директно</li>
              <li>Можете да очекувате одговор во рок од 3-5 работни дена</li>
              <li>Се препорачува да бидете достапни на наведениот контакт</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Ви благодариме што сте дел од Nexa Terminal заедницата! 🤝
            </p>
          </div>
        </div>

        <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Nexa Terminal - Поврзување на бизниси во Македонија</p>
          <p style="margin: 5px 0 0 0;">За дополнителни прашања, контактирајте не на terminalnexa@gmail.com</p>
        </div>
      </div>
    `,
    text: `
Вашиот интерес е успешно поднесен - ${request.serviceType}

Здраво ${provider.name},

Вашиот интерес за проектот е успешно поднесен!

Резиме на вашиот одговор:
- Проект: ${request.serviceType}
- Достапност: ${interestData.availability}
- Буџет: ${interestData.budgetAlignment}
- Контакт: ${interestData.preferredContact || 'Email'}

Вашата понуда:
${interestData.proposal}

${interestData.portfolio ? `Портфолио: ${interestData.portfolio}` : ''}

Што се случува понатаму:
- Клиентот ќе го прегледа вашиот интерес
- Ако е заинтересиран, ќе ве контактира директно
- Можете да очекувате одговор во рок од 3-5 работни дена

Ви благодариме што сте дел од Nexa Terminal заедницата!

Nexa Terminal - Поврзување на бизниси во Македонија
    `
  };
};

/**
 * Client notification about provider interest
 */
const clientProviderInterestNotification = (client, request, provider, interestData) => {
  return {
    subject: `🎯 Провајдер изрази интерес за вашето барање - ${request.serviceType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1E4DB7 0%, #4F46E5 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🎯 Нов интерес за вашето барање</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Провајдер е заинтересиран за соработка</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Здраво <strong>${client.companyInfo?.companyName || client.email}</strong>,
          </p>

          <p style="color: #059669; font-size: 18px; font-weight: 600; margin-bottom: 20px;">
            🎉 Провајдер изрази интерес за вашето барање за "${request.serviceType}"!
          </p>

          <div style="background: #f0f9ff; border: 1px solid #0284c7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #0284c7; margin-top: 0; margin-bottom: 15px;">👤 Информации за провајдерот</h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 120px;">Име:</td>
                <td style="padding: 8px 0; color: #1f2937;"><strong>${provider.name}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Email:</td>
                <td style="padding: 8px 0; color: #1f2937;"><a href="mailto:${provider.email}" style="color: #0284c7;">${provider.email}</a></td>
              </tr>
              ${provider.phone ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Телефон:</td>
                <td style="padding: 8px 0; color: #1f2937;"><a href="tel:${provider.phone}" style="color: #0284c7;">${provider.phone}</a></td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Категорија:</td>
                <td style="padding: 8px 0; color: #1f2937;">${provider.serviceCategory}</td>
              </tr>
            </table>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #059669; margin-top: 0; margin-bottom: 15px;">📝 Одговор на провајдерот</h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 130px;">Достапност:</td>
                <td style="padding: 8px 0; color: #1f2937;">
                  ${interestData.availability === 'да' ? '✅ Достапен' : '❌ Недостапен'}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Буџет:</td>
                <td style="padding: 8px 0; color: #1f2937;">
                  ${interestData.budgetAlignment === 'да' ? '✅ Се согласува' :
                    interestData.budgetAlignment === 'преговарачки' ? '💬 Преговарачки' : '❌ Не се согласува'}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Префериран контакт:</td>
                <td style="padding: 8px 0; color: #1f2937;">${interestData.preferredContact || 'Email'}</td>
              </tr>
            </table>
          </div>

          <h3 style="color: #1f2937; margin-bottom: 15px;">💡 Понуда и пристап</h3>
          <div style="background: #f9fafb; border-left: 4px solid #1E4DB7; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
            <p style="margin: 0; line-height: 1.6; color: #374151;">${interestData.proposal}</p>
          </div>

          ${interestData.portfolio ? `
            <p style="color: #374151; margin-bottom: 15px;">
              <strong>🎨 Портфолио:</strong> <a href="${interestData.portfolio}" style="color: #1E4DB7; text-decoration: none;">${interestData.portfolio}</a>
            </p>
          ` : ''}

          ${interestData.nextSteps ? `
            <h4 style="color: #1f2937; margin-bottom: 10px;">🚀 Предложени следни чекори</h4>
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
              <p style="margin: 0; line-height: 1.6; color: #92400e;">${interestData.nextSteps}</p>
            </div>
          ` : ''}

          <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #1e40af; margin-top: 0; margin-bottom: 10px;">📞 Следни чекори</h4>
            <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
              <li>Контактирајте го провајдерот директно преку email или телефон</li>
              <li>Дискутирајте ги деталите за проектот и цената</li>
              <li>Договорете средба или презентација доколку е потребно</li>
              <li>Започнете ја соработката кога ќе се договорите за условите</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="mailto:${provider.email}?subject=Re: ${request.serviceType} - Ваше барање за понуда"
               style="background: #1E4DB7; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; margin-right: 10px;">
              📧 Контактирај преку Email
            </a>
            ${provider.phone ? `
            <a href="tel:${provider.phone}"
               style="background: #10b981; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
              📞 Повикај
            </a>
            ` : ''}
          </div>
        </div>

        <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Nexa Terminal - Поврзување на бизниси во Македонија</p>
          <p style="margin: 5px 0 0 0;">Ви желиме успешна соработка! 🤝</p>
        </div>
      </div>
    `,
    text: `
Провајдер изрази интерес за вашето барање - ${request.serviceType}

Здраво ${client.companyInfo?.companyName || client.email},

Провајдер изрази интерес за вашето барање за "${request.serviceType}"!

Информации за провајдерот:
- Име: ${provider.name}
- Email: ${provider.email}
${provider.phone ? `- Телефон: ${provider.phone}` : ''}
- Категорија: ${provider.serviceCategory}

Одговор на провајдерот:
- Достапност: ${interestData.availability === 'да' ? 'Достапен' : 'Недостапен'}
- Буџет: ${interestData.budgetAlignment === 'да' ? 'Се согласува' : interestData.budgetAlignment === 'преговарачки' ? 'Преговарачки' : 'Не се согласува'}
- Префериран контакт: ${interestData.preferredContact || 'Email'}

Понуда и пристап:
${interestData.proposal}

${interestData.portfolio ? `Портфолио: ${interestData.portfolio}` : ''}

${interestData.nextSteps ? `Предложени следни чекори: ${interestData.nextSteps}` : ''}

Контактирајте го провајдерот директно:
Email: ${provider.email}
${provider.phone ? `Телефон: ${provider.phone}` : ''}

Nexa Terminal - Поврзување на бизниси во Македонија
    `
  };
};

/**
 * Request rejection notification to client
 */
const requestRejectionNotification = (request, client, reason) => {
  return {
    subject: `❌ Вашето барање за понуда беше одбиено - ${request.serviceType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">❌ Барање одбиено</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Информации за вашето барање</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Здраво <strong>${client.companyInfo?.companyName || client.email}</strong>,
          </p>

          <p style="color: #dc2626; font-size: 16px; margin-bottom: 25px;">
            За жал, вашето барање за понуда за <strong>"${request.serviceType}"</strong> не можеше да биде одобрено.
          </p>

          <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #dc2626; margin-top: 0; margin-bottom: 15px;">📋 Детали за барањето</h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 100px;">Услуга:</td>
                <td style="padding: 8px 0; color: #1f2937;">${request.serviceType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Буџет:</td>
                <td style="padding: 8px 0; color: #1f2937;">${request.budgetRange}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Поднесено:</td>
                <td style="padding: 8px 0; color: #1f2937;">${new Date(request.createdAt).toLocaleDateString('mk-MK')}</td>
              </tr>
            </table>
          </div>

          <h3 style="color: #1f2937; margin-bottom: 15px;">💬 Причина за одбивање</h3>
          <div style="background: #fff7ed; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
            <p style="margin: 0; line-height: 1.6; color: #92400e;">${reason}</p>
          </div>

          <div style="background: #f0f9ff; border: 1px solid #0284c7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #0284c7; margin-top: 0; margin-bottom: 15px;">💡 Следни чекори</h4>
            <ul style="color: #0284c7; margin: 0; padding-left: 20px;">
              <li>Прегледајте ја причината за одбивање погоре</li>
              <li>Ажурирајте го вашето барање согласно препораките</li>
              <li>Поднесете ново барање со подобри детали</li>
              <li>Контактирајте не за дополнителна помош</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/terminal/contact"
               style="background: #1E4DB7; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; margin-bottom: 15px;">
              📝 Поднеси ново барање
            </a>
            <br>
            <a href="mailto:terminalnexa@gmail.com?subject=Помош со барање за понуда"
               style="color: #6b7280; font-size: 14px; text-decoration: underline;">
              Контактирај за помош
            </a>
          </div>
        </div>

        <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Nexa Terminal - Системот за автоматизација на деловни документи</p>
          <p style="margin: 5px 0 0 0;">Ви благодариме за користењето на нашиот систем.</p>
        </div>
      </div>
    `,
    text: `
Вашето барање за понуда беше одбиено - ${request.serviceType}

Здраво ${client.companyInfo?.companyName || client.email},

За жал, вашето барање за понуда за "${request.serviceType}" не можеше да биде одобрено.

Детали за барањето:
- Услуга: ${request.serviceType}
- Буџет: ${request.budgetRange}
- Поднесено: ${new Date(request.createdAt).toLocaleDateString('mk-MK')}

Причина за одбивање:
${reason}

Следни чекори:
- Прегледајте ја причината за одбивање погоре
- Ажурирајте го вашето барање согласно препораките
- Поднесете ново барање со подобри детали
- Контактирајте не за дополнителна помош

Поднесете ново барање: ${process.env.CLIENT_URL || 'http://localhost:3000'}/terminal/contact
Контактирај за помош: terminalnexa@gmail.com

Nexa Terminal - Системот за автоматизација на деловни документи
    `
  };
};

module.exports = {
  adminNewRequestNotification,
  providerInterestInvitation,
  providerInterestConfirmation,
  clientProviderInterestNotification,
  requestRejectionNotification
};