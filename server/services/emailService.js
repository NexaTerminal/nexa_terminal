const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
  constructor() {
    this.resend = null;
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@nexa.mk';
    this.gmailTransporter = null;
  }

  // Lazy initialization of Resend client
  getResendClient() {
    if (!this.resend) {
      if (!process.env.RESEND_API_KEY) {
        // In development without API key, use mock mode
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️  RESEND_API_KEY not set - using mock email mode for development');
          return null; // Will trigger mock mode
        }
        throw new Error('RESEND_API_KEY environment variable is not set');
      }
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
    return this.resend;
  }

  /**
   * Send company verification email with verification link
   * @param {string} email - Company email address
   * @param {string} companyName - Company name
   * @param {string} verificationToken - Unique verification token
   * @param {string} baseUrl - Base URL for verification link
   */
  // Create Gmail transporter (fallback for when Resend fails)
  getGmailTransporter() {
    console.log('🔍 DEBUG: Checking Gmail configuration...');
    console.log('🔍 GMAIL_APP_PASSWORD exists:', !!process.env.GMAIL_APP_PASSWORD);
    console.log('🔍 GMAIL_APP_PASSWORD length:', process.env.GMAIL_APP_PASSWORD?.length);

    if (!this.gmailTransporter && process.env.GMAIL_APP_PASSWORD) {
      console.log('✅ Creating Gmail transporter...');
      this.gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'terminalnexa@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
      console.log('✅ Gmail transporter created successfully');
    } else {
      console.log('❌ Gmail transporter NOT created. Reasons:');
      console.log('   - Already exists?', !!this.gmailTransporter);
      console.log('   - GMAIL_APP_PASSWORD missing?', !process.env.GMAIL_APP_PASSWORD);
    }
    return this.gmailTransporter;
  }

  async sendVerificationEmail(email, companyName, verificationToken, baseUrl) {
    try {
      const verificationUrl = `${baseUrl}/api/verification/verify-email?token=${verificationToken}`;
      
      // In testing mode, override recipient but include original in email body
      const actualRecipient = process.env.EMAIL_TESTING_MODE === 'true' && process.env.TEST_EMAIL_RECIPIENT 
        ? process.env.TEST_EMAIL_RECIPIENT 
        : email;
      
      const emailData = {
        from: this.fromEmail,
        to: [actualRecipient],
        subject: 'Верификација на компанија - Nexa Terminal',
        html: this.generateVerificationEmailHTML(companyName, verificationUrl, email, actualRecipient !== email ? email : null)
      };

      const resendClient = this.getResendClient();
      
      // Mock mode for development
      if (!resendClient) {
        console.log('\n📧 [MOCK EMAIL] Verification email would be sent:');
        console.log('==========================================');
        console.log(`To: ${email}`);
        console.log(`Subject: ${emailData.subject}`);
        console.log(`Company: ${companyName}`);
        console.log(`Verification URL: ${verificationUrl}`);
        console.log('==========================================');
        console.log('💡 To actually send emails, set RESEND_API_KEY environment variable');
        console.log('💡 For testing: Copy the verification URL above and visit it in your browser\n');
        
        return { 
          success: true, 
          messageId: 'mock-' + Date.now(),
          mockMode: true,
          verificationUrl: verificationUrl
        };
      }

      try {
        // Try Resend first
        const result = await resendClient.emails.send(emailData);
        
        if (result.error) {
          console.log('Resend error, trying Gmail fallback:', result.error);
          
          // If Resend fails due to domain restrictions, try Gmail
          const gmailTransporter = this.getGmailTransporter();
          if (gmailTransporter) {
            const gmailResult = await gmailTransporter.sendMail({
              from: 'terminalnexa@gmail.com',
              to: email,
              subject: emailData.subject,
              html: emailData.html
            });
            console.log('Gmail backup email sent successfully:', gmailResult.messageId);
            return { success: true, messageId: gmailResult.messageId, service: 'gmail' };
          } else {
            throw new Error('Resend failed and Gmail not configured');
          }
        }
        
        console.log('Verification email sent successfully via Resend:', result);
        const messageId = result?.data?.id || result?.id || 'unknown';
        return { success: true, messageId, service: 'resend' };
      } catch (error) {
        console.log('Resend failed, trying Gmail fallback:', error.message);
        
        // Fallback to Gmail if available
        const gmailTransporter = this.getGmailTransporter();
        if (gmailTransporter) {
          const gmailResult = await gmailTransporter.sendMail({
            from: 'terminalnexa@gmail.com',
            to: email,
            subject: emailData.subject,
            html: emailData.html
          });
          console.log('Gmail backup email sent successfully:', gmailResult.messageId);
          return { success: true, messageId: gmailResult.messageId, service: 'gmail' };
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  /**
   * Generate HTML template for verification email
   * @param {string} companyName - Company name
   * @param {string} verificationUrl - Verification URL
   * @param {string} email - Recipient email
   * @param {string} originalEmail - Original intended recipient (for testing mode)
   */
  generateVerificationEmailHTML(companyName, verificationUrl, email, originalEmail = null) {
    return `
    <!DOCTYPE html>
    <html lang="mk">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Верификација на компанија</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .email-container {
          background-color: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #2563eb;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 16px;
        }
        .content {
          margin-bottom: 30px;
        }
        .verify-btn {
          display: inline-block;
          background-color: #ffffff;
          color: #1E4DB7;
          border: 2px solid #1E4DB7;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          transition: all 0.3s;
        }
        .verify-btn:hover {
          background-color: #F0F7FF;
          border-color: #163A8F;
          color: #163A8F;
        }
        .info-box {
          background-color: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          padding: 20px;
          margin: 20px 0;
        }
        .warning {
          background-color: #fefce8;
          border: 1px solid #fde047;
          color: #854d0e;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
          font-size: 14px;
          color: #666;
          text-align: center;
        }
        .required-info {
          background-color: #f8fafc;
          border-left: 4px solid #2563eb;
          padding: 15px;
          margin: 20px 0;
        }
        ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        li {
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">NEXA Terminal</div>
          <div class="subtitle">Професионална правна платформа</div>
        </div>
        
        <div class="content">
          <h2>Добредојдовте, ${companyName}!</h2>
          
          <p>Ви благодариме што се регистриравте на Nexa Terminal. За да ја завршите верификацијата на вашата компанија, ве молиме потврдете ја вашата службена email адреса.</p>
          
          ${originalEmail ? `
          <div class="info-box warning">
            <strong>🧪 TEST MODE</strong>
            <p>This email was intended for: <strong>${originalEmail}</strong></p>
            <p>But sent to: <strong>${email}</strong> (for testing purposes)</p>
          </div>
          ` : ''}
          
          <div class="info-box">
            <strong>📧 Верификација на email адреса</strong>
            <p>Ова email е пратена на: <strong>${originalEmail || email}</strong></p>
            <p>Кликнете на копчето подолу за да ја потврдите вашата службена email адреса и да го активирате вашиот профил.</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="verify-btn">✅ Потврди Email Адреса</a>
          </div>
          
          <div class="required-info">
            <h4>📋 Потребни информации за верификација:</h4>
            <p>За да го завршите процесот на верификација, осигурајте се дека ги имате внесено следните податоци:</p>
            <ul>
              <li>Име на компанија</li>
              <li>Адреса на компанија</li>
              <li>Даночен број на компанија</li>
              <li>Менаџер/Одговорно лице</li>
              <li>Службена email адреса на компанија</li>
            </ul>
          </div>
          
          <div class="info-box warning">
            <strong>⚠️ Важно:</strong>
            <p>Додека вашата компанија не е верификувана, можете само да ги прегледувате содржините на платформата. За да генерирате документи, да користите AI асистент или да објавувате на социјалните мрежи, мора да ја завршите верификацијата.</p>
          </div>
          
          <div class="info-box">
            <strong>🔗 Алтернативен начин</strong>
            <p>Ако копчето не работи, копирајте ја оваа врска во вашиот прелистувач:</p>
            <p style="word-break: break-all; font-family: monospace; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
              ${verificationUrl}
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p>Овој email е пратен автоматски од Nexa Terminal системот.</p>
          <p>Ако не сте го барале овој email, ве молиме игнорирајте го.</p>
          <p><strong>Nexa Terminal</strong> - Правна технологија за македонскиот бизнис</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate a secure verification token
   * @returns {string} Secure random token
   */
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Send verification success notification
   * @param {string} email - User email
   * @param {string} companyName - Company name
   */
  async sendVerificationSuccessEmail(email, companyName) {
    try {
      const emailData = {
        from: this.fromEmail,
        to: [email],
        subject: 'Успешна верификација - Nexa Terminal',
        html: this.generateSuccessEmailHTML(companyName)
      };

      const result = await this.getResendClient().emails.send(emailData);
      console.log('Success notification email sent:', result);
      const messageId = result?.data?.id || result?.id || 'unknown';
      return { success: true, messageId };
    } catch (error) {
      console.error('Error sending success email:', error);
      throw new Error(`Failed to send success email: ${error.message}`);
    }
  }

  /**
   * Generate HTML template for success notification
   * @param {string} companyName - Company name
   */
  generateSuccessEmailHTML(companyName) {
    return `
    <!DOCTYPE html>
    <html lang="mk">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Успешна верификација</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .email-container {
          background-color: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .success-icon {
          font-size: 60px;
          margin-bottom: 20px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #059669;
          margin-bottom: 10px;
        }
        .content {
          text-align: center;
        }
        .features {
          background-color: #f0f9ff;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: left;
        }
        .login-btn {
          display: inline-block;
          background-color: #ffffff;
          color: #1E4DB7;
          border: 2px solid #1E4DB7;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          transition: all 0.3s;
        }
        .login-btn:hover {
          background-color: #F0F7FF;
          border-color: #163A8F;
          color: #163A8F;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="success-icon">✅</div>
          <div class="logo">NEXA Terminal</div>
          <h2 style="color: #059669;">Честитки! Вашата компанија е успешно верификувана!</h2>
        </div>
        
        <div class="content">
          <p><strong>${companyName}</strong>, вашата компанија е официјално верификувана и сега имате пристап до сите функционалности на Nexa Terminal.</p>
          
          <div class="features">
            <h4>🎉 Сега можете да користите:</h4>
            <ul>
              <li>✅ Автоматско генерирање на правни документи</li>
              <li>🤖 AI правен асистент</li>
              <li>📱 Објавување на социјални мрежи</li>
              <li>📊 Компания аналитика и извештаи</li>
              <li>💼 Сите премиум функции на платформата</li>
            </ul>
          </div>
          
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/terminal" class="login-btn">
            Влез во Nexa Terminal
          </a>
          
          <p>Ви благодариме што ни се приклучивте!</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generic method to send any email (for password reset, etc.)
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   */
  async sendEmail(to, subject, html) {
    try {
      const resendClient = this.getResendClient();
      
      if (!resendClient) {
        // Development mode without API key - simulate email sending
        console.log('📧 [DEV MODE] Email would be sent:');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`HTML: ${html.substring(0, 200)}...`);
        return { success: true, mockSent: true };
      }

      const emailData = {
        from: this.fromEmail,
        to: [to],
        subject: subject,
        html: html
      };

      const result = await resendClient.emails.send(emailData);
      console.log('Email sent successfully via Resend:', result);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error sending email via Resend:', error);
      
      // Try Gmail fallback
      const gmailTransporter = this.getGmailTransporter();
      if (gmailTransporter) {
        try {
          const gmailResult = await gmailTransporter.sendMail({
            from: 'terminalnexa@gmail.com',
            to: to,
            subject: subject,
            html: html
          });
          
          console.log('Email sent successfully via Gmail:', gmailResult);
          return { success: true, data: gmailResult };
        } catch (gmailError) {
          console.error('Gmail fallback also failed:', gmailError);
        }
      }
      
      return { success: false, error: error.message };
    }
  }

  // ==================== OFFER REQUEST EMAIL METHODS ====================

  /**
   * Send admin notification about new offer request
   */
  async sendOfferRequestToAdmin(request, user) {
    try {
      const emailTemplates = require('../templates/offerRequestEmails');
      const template = emailTemplates.adminNewRequestNotification(request, user);

      const adminEmail = process.env.ADMIN_EMAIL || 'terminalnexa@gmail.com';

      return await this.sendEmail(adminEmail, template.subject, template.html);
    } catch (error) {
      console.error('Error sending admin notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send interest invitation to provider
   */
  async sendInterestInvitationToProvider(request, tokenData) {
    try {
      const emailTemplates = require('../templates/offerRequestEmails');
      const template = emailTemplates.providerInterestInvitation(
        request,
        tokenData.provider,
        tokenData.interestToken
      );

      return await this.sendEmail(tokenData.provider.email, template.subject, template.html);
    } catch (error) {
      console.error('Error sending provider invitation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send confirmation to provider after expressing interest
   */
  async sendInterestConfirmationToProvider(provider, interestData, request) {
    try {
      const emailTemplates = require('../templates/offerRequestEmails');
      const template = emailTemplates.providerInterestConfirmation(provider, interestData, request);

      return await this.sendEmail(provider.email, template.subject, template.html);
    } catch (error) {
      console.error('Error sending provider confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send client notification about provider interest
   */
  async sendProviderInterestToClient(client, request, provider, interestData) {
    try {
      const emailTemplates = require('../templates/offerRequestEmails');
      const template = emailTemplates.clientProviderInterestNotification(
        client,
        request,
        provider,
        interestData
      );

      return await this.sendEmail(client.email, template.subject, template.html);
    } catch (error) {
      console.error('Error sending client notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send request rejection notification to client
   */
  async sendRequestRejectionNotification(request, client, reason) {
    try {
      const emailTemplates = require('../templates/offerRequestEmails');
      const template = emailTemplates.requestRejectionNotification(request, client, reason);

      return await this.sendEmail(client.email, template.subject, template.html);
    } catch (error) {
      console.error('Error sending rejection notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send bulk interest invitations to multiple providers
   */
  async sendBulkInterestInvitations(request, providers, tokens) {
    try {
      const results = [];

      for (let i = 0; i < providers.length; i++) {
        const provider = providers[i];
        const tokenData = tokens[i];

        try {
          const result = await this.sendInterestInvitationToProvider(request, tokenData);
          results.push({
            provider: provider.email,
            success: result.success,
            error: result.error
          });
        } catch (error) {
          console.error(`Error sending invitation to ${provider.email}:`, error);
          results.push({
            provider: provider.email,
            success: false,
            error: error.message
          });
        }

        // Add small delay between emails to avoid rate limiting
        if (i < providers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      console.log(`Bulk invitation results: ${successCount} sent, ${failureCount} failed`);

      return {
        success: true,
        totalSent: successCount,
        totalFailed: failureCount,
        results: results
      };

    } catch (error) {
      console.error('Error sending bulk invitations:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test email template rendering (development helper)
   */
  async testEmailTemplate(templateName, testData) {
    try {
      const emailTemplates = require('../templates/offerRequestEmails');

      if (!emailTemplates[templateName]) {
        throw new Error(`Template "${templateName}" not found`);
      }

      const template = emailTemplates[templateName](testData);

      // In development, log the template instead of sending
      console.log('📧 Email Template Test:');
      console.log('Subject:', template.subject);
      console.log('HTML Preview:', template.html.substring(0, 500) + '...');

      return {
        success: true,
        template: template,
        preview: template.html.substring(0, 500)
      };

    } catch (error) {
      console.error('Error testing email template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send low credit warning email
   * @param {string} email - User email
   * @param {string} username - User name
   * @param {number} remainingCredits - Credits remaining
   * @param {Date} resetDate - Next reset date
   */
  async sendLowCreditWarning(email, username, remainingCredits, resetDate) {
    try {
      const emailData = {
        from: this.fromEmail,
        to: [email],
        subject: '⚠️ Малку кредити - Nexa Terminal',
        html: this.generateLowCreditWarningHTML(username, remainingCredits, resetDate)
      };

      const resendClient = this.getResendClient();

      if (!resendClient) {
        console.log('\n📧 [MOCK EMAIL] Low credit warning would be sent:');
        console.log('==========================================');
        console.log(`To: ${email}`);
        console.log(`User: ${username}`);
        console.log(`Remaining Credits: ${remainingCredits}`);
        console.log(`Reset Date: ${resetDate}`);
        console.log('==========================================\n');
        return { success: true, mockMode: true };
      }

      try {
        const result = await resendClient.emails.send(emailData);
        console.log('✅ Low credit warning email sent successfully:', result.id);
        return { success: true, messageId: result.id };
      } catch (resendError) {
        console.error('❌ Resend failed, trying Gmail fallback...');
        return await this.sendEmailViaGmail(emailData);
      }
    } catch (error) {
      console.error('Error sending low credit warning email:', error);
      throw error;
    }
  }

  /**
   * Send credit depleted notification
   * @param {string} email - User email
   * @param {string} username - User name
   * @param {Date} resetDate - Next reset date
   * @param {string} referralCode - User's referral code
   */
  async sendCreditDepletedNotification(email, username, resetDate, referralCode) {
    try {
      const emailData = {
        from: this.fromEmail,
        to: [email],
        subject: '🚨 Кредитите се потрошени - Nexa Terminal',
        html: this.generateCreditDepletedHTML(username, resetDate, referralCode)
      };

      const resendClient = this.getResendClient();

      if (!resendClient) {
        console.log('\n📧 [MOCK EMAIL] Credit depleted notification would be sent:');
        console.log('==========================================');
        console.log(`To: ${email}`);
        console.log(`User: ${username}`);
        console.log(`Reset Date: ${resetDate}`);
        console.log(`Referral Code: ${referralCode}`);
        console.log('==========================================\n');
        return { success: true, mockMode: true };
      }

      try {
        const result = await resendClient.emails.send(emailData);
        console.log('✅ Credit depleted notification sent successfully:', result.id);
        return { success: true, messageId: result.id };
      } catch (resendError) {
        console.error('❌ Resend failed, trying Gmail fallback...');
        return await this.sendEmailViaGmail(emailData);
      }
    } catch (error) {
      console.error('Error sending credit depleted notification:', error);
      throw error;
    }
  }

  /**
   * Send weekly credit reset notification
   * @param {string} email - User email
   * @param {string} username - User name
   * @param {number} newBalance - New credit balance
   * @param {number} bonusCredits - Bonus credits awarded
   */
  async sendWeeklyCreditReset(email, username, newBalance, bonusCredits = 0) {
    try {
      const emailData = {
        from: this.fromEmail,
        to: [email],
        subject: '🔄 Неделно ресетирање на кредити - Nexa Terminal',
        html: this.generateWeeklyCreditResetHTML(username, newBalance, bonusCredits)
      };

      const resendClient = this.getResendClient();

      if (!resendClient) {
        console.log('\n📧 [MOCK EMAIL] Weekly credit reset would be sent:');
        console.log('==========================================');
        console.log(`To: ${email}`);
        console.log(`User: ${username}`);
        console.log(`New Balance: ${newBalance}`);
        console.log(`Bonus Credits: ${bonusCredits}`);
        console.log('==========================================\n');
        return { success: true, mockMode: true };
      }

      try {
        const result = await resendClient.emails.send(emailData);
        console.log('✅ Weekly credit reset email sent successfully:', result.id);
        return { success: true, messageId: result.id };
      } catch (resendError) {
        console.error('❌ Resend failed, trying Gmail fallback...');
        return await this.sendEmailViaGmail(emailData);
      }
    } catch (error) {
      console.error('Error sending weekly credit reset email:', error);
      throw error;
    }
  }

  /**
   * Send referral bonus notification
   * @param {string} email - User email
   * @param {string} username - User name
   * @param {number} bonusAmount - Bonus credits awarded
   * @param {number} activeReferrals - Number of active referrals
   */
  async sendReferralBonusNotification(email, username, bonusAmount, activeReferrals) {
    try {
      const emailData = {
        from: this.fromEmail,
        to: [email],
        subject: '🎁 Референтен бонус - Nexa Terminal',
        html: this.generateReferralBonusHTML(username, bonusAmount, activeReferrals)
      };

      const resendClient = this.getResendClient();

      if (!resendClient) {
        console.log('\n📧 [MOCK EMAIL] Referral bonus notification would be sent:');
        console.log('==========================================');
        console.log(`To: ${email}`);
        console.log(`User: ${username}`);
        console.log(`Bonus Amount: ${bonusAmount}`);
        console.log(`Active Referrals: ${activeReferrals}`);
        console.log('==========================================\n');
        return { success: true, mockMode: true };
      }

      try {
        const result = await resendClient.emails.send(emailData);
        console.log('✅ Referral bonus notification sent successfully:', result.id);
        return { success: true, messageId: result.id };
      } catch (resendError) {
        console.error('❌ Resend failed, trying Gmail fallback...');
        return await this.sendEmailViaGmail(emailData);
      }
    } catch (error) {
      console.error('Error sending referral bonus notification:', error);
      throw error;
    }
  }

  /**
   * Send invitation email to potential new user
   * @param {string} email - Recipient email
   * @param {Object} referrer - User who is sending the invitation
   * @param {string} referralCode - Referrer's referral code
   */
  async sendInvitationEmail(email, referrer, referralCode) {
    try {
      console.log('\n🎯 [EmailService] sendInvitationEmail called');
      console.log('📧 [EmailService] To:', email);
      console.log('👤 [EmailService] Referrer:', referrer.username || referrer.email);
      console.log('🔑 [EmailService] Referral code:', referralCode);

      const referralLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/register?ref=${referralCode}`;
      const referrerName = referrer.companyInfo?.companyName || referrer.username || 'Твој пријател';

      console.log('🏢 [EmailService] Referrer name:', referrerName);
      console.log('🔗 [EmailService] Referral link:', referralLink);

      const emailData = {
        from: this.fromEmail,
        to: [email],
        subject: `${referrerName} те покани да се приклучиш на Nexa Terminal`,
        html: this.generateInvitationEmailHTML(referrerName, referralLink)
      };

      console.log('📨 [EmailService] Email data prepared');
      console.log('   From:', emailData.from);
      console.log('   To:', emailData.to);
      console.log('   Subject:', emailData.subject);

      const resendClient = this.getResendClient();
      console.log('🔍 [EmailService] Resend client available:', !!resendClient);

      if (!resendClient) {
        console.log('\n📧 [MOCK EMAIL] Invitation email would be sent:');
        console.log('==========================================');
        console.log(`To: ${email}`);
        console.log(`From: ${referrerName}`);
        console.log(`Referral Link: ${referralLink}`);
        console.log('==========================================\n');
        return { success: true, mockMode: true };
      }

      try {
        console.log('📮 [EmailService] Sending via Resend...');
        const result = await resendClient.emails.send(emailData);
        console.log(`✅ [EmailService] Invitation sent to ${email}:`, result.id);
        return { success: true, messageId: result.id };
      } catch (resendError) {
        console.error('❌ [EmailService] Resend failed:', resendError.message);
        console.log('🔄 [EmailService] Trying Gmail fallback...');
        return await this.sendEmailViaGmail(emailData);
      }
    } catch (error) {
      console.error(`❌ [EmailService] Error sending invitation to ${email}:`, error);
      throw error;
    }
  }

  // HTML Templates for Credit Notifications

  generateLowCreditWarningHTML(username, remainingCredits, resetDate) {
    const resetDateStr = new Date(resetDate).toLocaleDateString('mk-MK', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px 12px 0 0;">
                    <div style="font-size: 64px; margin-bottom: 10px;">⚠️</div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Малку кредити</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Здраво <strong>${username}</strong>,
                    </p>

                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Вашите кредити се на исчезнување. Имате само <strong style="color: #f59e0b;">${remainingCredits} кредит${remainingCredits === 1 ? '' : 'и'}</strong> преостанати.
                    </p>

                    <!-- Credit Info Box -->
                    <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%); border: 2px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 20px; margin: 30px 0;">
                      <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">Преостанати кредити:</div>
                      <div style="font-size: 32px; font-weight: 700; color: #f59e0b;">${remainingCredits}</div>
                      <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">Ресетирање: ${resetDateStr}</div>
                    </div>

                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                      <strong>Како да добиете повеќе кредити:</strong>
                    </p>

                    <ul style="margin: 0 0 30px; padding-left: 20px; color: #374151; font-size: 16px; line-height: 1.8;">
                      <li>Поканете <strong>3+ пријатели</strong> и добијте <strong>+7 бонус кредити</strong> секоја недела</li>
                      <li>Почекајте до <strong>${resetDateStr}</strong> за автоматско ресетирање</li>
                    </ul>

                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding: 10px 0;">
                          <a href="${process.env.CLIENT_URL || 'https://nexa.mk'}/terminal/invite" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                            🎁 Покани пријатели
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      Nexa Terminal - Вашиот правен асистент<br>
                      <a href="${process.env.CLIENT_URL || 'https://nexa.mk'}" style="color: #10b981; text-decoration: none;">nexa.mk</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  generateCreditDepletedHTML(username, resetDate, referralCode) {
    const resetDateStr = new Date(resetDate).toLocaleDateString('mk-MK', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const referralLink = `${process.env.CLIENT_URL || 'https://nexa.mk'}/register?ref=${referralCode}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 12px 12px 0 0;">
                    <div style="font-size: 64px; margin-bottom: 10px;">🚨</div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Кредитите се потрошени</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Здраво <strong>${username}</strong>,
                    </p>

                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Ги потрошивте сите ваши кредити за оваа недела. Нема да можете да користите некои функции додека не се ресетираат кредитите.
                    </p>

                    <!-- Alert Box -->
                    <div style="background: linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%); border: 2px solid rgba(220, 38, 38, 0.3); border-radius: 10px; padding: 20px; margin: 30px 0; text-align: center;">
                      <div style="font-size: 48px; font-weight: 700; color: #dc2626;">0</div>
                      <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">Преостанати кредити</div>
                    </div>

                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                      <strong>Како да добиете кредити веднаш:</strong>
                    </p>

                    <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%); border: 2px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 20px; margin: 20px 0;">
                      <div style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 10px;">🎁 Поканете пријатели</div>
                      <p style="margin: 0 0 15px; color: #4b5563; font-size: 14px;">
                        Поканете 3+ пријатели со вашиот референтен код и добијте <strong style="color: #059669;">+7 бонус кредити</strong> секоја недела!
                      </p>
                      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; font-family: 'Courier New', monospace; font-size: 14px; color: #059669; font-weight: 700; text-align: center;">
                        ${referralCode}
                      </div>
                      <p style="margin: 15px 0 0; color: #6b7280; font-size: 12px; text-align: center;">
                        Или споделете го овој линк: <a href="${referralLink}" style="color: #10b981; word-break: break-all;">${referralLink}</a>
                      </p>
                    </div>

                    <p style="margin: 30px 0 20px; color: #6b7280; font-size: 14px; text-align: center;">
                      Или почекајте до <strong>${resetDateStr}</strong> за автоматско ресетирање.
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding: 10px 0;">
                          <a href="${process.env.CLIENT_URL || 'https://nexa.mk'}/terminal/invite" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                            ✉️ Испрати покани
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      Nexa Terminal - Вашиот правен асистент<br>
                      <a href="${process.env.CLIENT_URL || 'https://nexa.mk'}" style="color: #10b981; text-decoration: none;">nexa.mk</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  generateWeeklyCreditResetHTML(username, newBalance, bonusCredits) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px 12px 0 0;">
                    <div style="font-size: 64px; margin-bottom: 10px;">🔄</div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Кредитите се ресетирани!</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Здраво <strong>${username}</strong>,
                    </p>

                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Добра вест! Вашите неделни кредити се ресетирани и сега имате нови кредити достапни.
                    </p>

                    <!-- Credit Balance Box -->
                    <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%); border: 2px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 20px; margin: 30px 0; text-align: center;">
                      <div style="font-size: 48px; font-weight: 700; color: #10b981;">${newBalance}</div>
                      <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">Нови кредити</div>
                      ${bonusCredits > 0 ? `
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(16, 185, 129, 0.2);">
                          <div style="font-size: 14px; color: #6b7280;">Вклучувајќи</div>
                          <div style="font-size: 24px; font-weight: 700; color: #059669; margin-top: 5px;">+${bonusCredits} референтен бонус 🎁</div>
                        </div>
                      ` : ''}
                    </div>

                    ${bonusCredits > 0 ? `
                      <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%); border: 2px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 20px; margin: 20px 0;">
                        <div style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 10px; text-align: center;">🎉 Честитки!</div>
                        <p style="margin: 0; color: #4b5563; font-size: 14px; text-align: center;">
                          Добивте <strong style="color: #d97706;">${bonusCredits} бонус кредити</strong> за вашите активни препораки. Продолжете да поканувате пријатели за уште повеќе бонуси!
                        </p>
                      </div>
                    ` : `
                      <div style="background: rgba(243, 244, 246, 0.8); border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">
                          Поканете 3+ пријатели за да добиете <strong style="color: #059669;">+7 бонус кредити</strong> секоја недела!
                        </p>
                      </div>
                    `}

                    <p style="margin: 30px 0 20px; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                      Вашите кредити се спремни за употреба. Започнете со генерирање на документи!
                    </p>

                    <!-- CTA Buttons -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding: 10px 0;">
                          <a href="${process.env.CLIENT_URL || 'https://nexa.mk'}/terminal/documents" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); margin: 5px;">
                            📄 Генерирај документи
                          </a>
                          <a href="${process.env.CLIENT_URL || 'https://nexa.mk'}/terminal/ai-chat" style="display: inline-block; background: rgba(59, 130, 246, 0.9); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); margin: 5px;">
                            🤖 AI Асистент
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      Nexa Terminal - Вашиот правен асистент<br>
                      <a href="${process.env.CLIENT_URL || 'https://nexa.mk'}" style="color: #10b981; text-decoration: none;">nexa.mk</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  generateReferralBonusHTML(username, bonusAmount, activeReferrals) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 12px 12px 0 0;">
                    <div style="font-size: 64px; margin-bottom: 10px;">🎁</div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Референтен бонус!</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Здраво <strong>${username}</strong>,
                    </p>

                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Одлична работа! Благодарение на вашите успешни препораки, заработивте бонус кредити!
                    </p>

                    <!-- Bonus Box -->
                    <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%); border: 2px solid rgba(139, 92, 246, 0.3); border-radius: 10px; padding: 30px; margin: 30px 0; text-align: center;">
                      <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">Вие заработивте</div>
                      <div style="font-size: 64px; font-weight: 700; color: #8b5cf6; line-height: 1;">+${bonusAmount}</div>
                      <div style="font-size: 18px; color: #6b7280; margin-top: 10px;">бонус кредити 🎉</div>
                    </div>

                    <!-- Referral Stats -->
                    <div style="background: rgba(243, 244, 246, 0.8); border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0;">
                      <div style="text-align: center; margin-bottom: 15px;">
                        <div style="font-size: 32px; font-weight: 700; color: #10b981;">${activeReferrals}</div>
                        <div style="font-size: 14px; color: #6b7280;">Активни препораки</div>
                      </div>
                      <p style="margin: 0; color: #4b5563; font-size: 14px; text-align: center;">
                        Продолжете да поканувате пријатели за да продолжите да заработувате <strong style="color: #8b5cf6;">+7 кредити</strong> секоја недела!
                      </p>
                    </div>

                    <p style="margin: 30px 0 20px; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                      Благодариме што го промовирате Nexa Terminal! 💜
                    </p>

                    <!-- CTA Buttons -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding: 10px 0;">
                          <a href="${process.env.CLIENT_URL || 'https://nexa.mk'}/terminal/invite" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); margin: 5px;">
                            ✉️ Покани повеќе пријатели
                          </a>
                          <a href="${process.env.CLIENT_URL || 'https://nexa.mk'}/terminal/credits" style="display: inline-block; background: rgba(139, 92, 246, 0.9); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); margin: 5px;">
                            💳 Преглед на кредити
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      Nexa Terminal - Вашиот правен асистент<br>
                      <a href="${process.env.CLIENT_URL || 'https://nexa.mk'}" style="color: #10b981; text-decoration: none;">nexa.mk</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  generateInvitationEmailHTML(referrerName, referralLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px 12px 0 0;">
                    <div style="font-size: 64px; margin-bottom: 10px;">✉️</div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Добиваш покана!</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Здраво,
                    </p>

                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                      <strong style="color: #10b981;">${referrerName}</strong> те покани да се приклучиш на <strong>Nexa Terminal</strong> - твојот дигитален правен асистент!
                    </p>

                    <!-- Benefits Box -->
                    <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%); border: 2px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 25px; margin: 30px 0;">
                      <h3 style="margin: 0 0 15px; color: #111827; font-size: 18px; font-weight: 600;">Што добиваш?</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
                        <li>Автоматско генерирање на правни документи</li>
                        <li>AI правен советник достапен 24/7</li>
                        <li>Проверка на законска усогласеност</li>
                        <li><strong style="color: #10b981;">14 бесплатни кредити</strong> при регистрација</li>
                        <li>Пристап до експертски правни совети</li>
                      </ul>
                    </div>

                    <p style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                      Регистрирај се денес и започни со професионално управување со правните документи!
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${referralLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
                            Прифати покана
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Info Box -->
                    <div style="background: rgba(243, 244, 246, 0.8); border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 30px 0;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                        Регистрацијата е бесплатна и трае помалку од 2 минути.<br>
                        Веднаш добиваш <strong style="color: #10b981;">14 кредити</strong> за започнување!
                      </p>
                    </div>

                    <!-- Social Proof -->
                    <div style="text-align: center; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                        Придружи се на стотици македонски компании кои веќе го користат Nexa Terminal
                      </p>
                      <div style="font-size: 24px; margin-top: 10px;">⭐⭐⭐⭐⭐</div>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      Nexa Terminal - Вашиот правен асистент<br>
                      <a href="${process.env.CLIENT_URL || 'https://nexa.mk'}" style="color: #10b981; text-decoration: none;">nexa.mk</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  // ======================
  // NEWSLETTER METHODS
  // ======================

  /**
   * Fetch blogs for newsletter from database
   * @param {Array} blogIds - Array of blog IDs
   * @returns {Array} Array of blog objects
   */
  async fetchBlogsForNewsletter(blogIds) {
    try {
      if (!blogIds || blogIds.length === 0) {
        return [];
      }

      // Get database instance from global app
      const db = global.app?.locals?.db;
      if (!db) {
        console.error('Database not available in fetchBlogsForNewsletter');
        return [];
      }

      const blogs = await db.collection('blogPosts')
        .find({
          _id: { $in: blogIds },
          status: 'published'
        })
        .project({
          _id: 1,
          title: 1,
          excerpt: 1,
          content: 1,
          featuredImage: 1,
          createdAt: 1
        })
        .sort({ createdAt: -1 })
        .toArray();

      return blogs;
    } catch (error) {
      console.error('Error fetching blogs for newsletter:', error);
      return [];
    }
  }

  /**
   * Generate newsletter HTML with blog preview cards
   * @param {Object} campaign - Campaign object
   * @param {Array} blogs - Array of blog objects
   * @param {String} unsubscribeToken - Unsubscribe token
   * @param {String} trackingPixelToken - Tracking pixel token
   * @returns {String} HTML email content
   */
  async generateNewsletterHTML(campaign, blogs, unsubscribeToken, trackingPixelToken) {
    const baseUrl = process.env.CLIENT_URL || 'https://nexa.mk';
    const serverUrl = process.env.SERVER_URL || 'https://nexa-terminal-api-production-74cc.up.railway.app';

    // Generate blog cards
    const blogCardsHtml = blogs.map(blog => {
      const blogUrl = `${baseUrl}/blog/${blog._id}`;
      const trackingUrl = `${serverUrl}/api/public/newsletter/track/click/${trackingPixelToken}/blog-${blog._id}?redirect=${encodeURIComponent(blogUrl)}`;
      const imageUrl = blog.featuredImage || `${baseUrl}/nexa-logo-navbar.png`;
      const excerpt = blog.excerpt || (blog.content ? blog.content.substring(0, 150) + '...' : '');

      return `
        <tr>
          <td style="padding: 20px 0;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="padding: 0;">
                  ${blog.featuredImage ? `
                  <img src="${imageUrl}" alt="${blog.title}" style="width: 100%; height: auto; display: block; max-height: 250px; object-fit: cover;">
                  ` : ''}
                </td>
              </tr>
              <tr>
                <td style="padding: 20px;">
                  <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px; font-weight: 600; line-height: 1.4;">
                    <a href="${trackingUrl}" style="color: #111827; text-decoration: none;">
                      ${blog.title}
                    </a>
                  </h2>
                  <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                    ${excerpt}
                  </p>
                  <a href="${trackingUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                    Прочитај повеќе →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="mk">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${campaign.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <!-- Tracking Pixel -->
        <img src="${serverUrl}/api/public/newsletter/track/open/${trackingPixelToken}" width="1" height="1" style="display:none;" alt="">

        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                <!-- Header -->
                <tr>
                  <td style="padding: 30px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                      Nexa Terminal
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                      Билтен
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                      ${campaign.subject}
                    </h2>
                    <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Здраво! Ги споделуваме нашите најнови објави што ви донесуваат корисни информации и совети.
                    </p>

                    <!-- Blog Cards -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      ${blogCardsHtml}
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                    <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">
                      Nexa Terminal - Автоматизација на правни документи<br>
                      <a href="${baseUrl}" style="color: #10b981; text-decoration: none;">nexa.mk</a>
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      Не сакате повеќе да примате билтен?
                      <a href="${serverUrl}/api/public/newsletter/unsubscribe/${unsubscribeToken}" style="color: #dc2626; text-decoration: none;">
                        Отпиши се
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Send newsletter to batch of subscribers with rate limiting
   * @param {Object} campaign - Campaign object
   * @param {Array} blogs - Array of blog objects
   * @param {Array} subscribers - Array of subscriber objects
   * @returns {Object} Results with sent/failed counts
   */
  async sendNewsletterBatch(campaign, blogs, subscribers) {
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    // Get database instance
    const db = global.app?.locals?.db;
    if (!db) {
      throw new Error('Database not available');
    }

    for (const subscriber of subscribers) {
      try {
        // Generate unique tracking pixel token
        const trackingPixelToken = crypto.randomBytes(32).toString('hex');

        // Create analytics record
        const analyticsRecord = {
          campaignId: campaign._id,
          subscriberId: subscriber._id,
          subscriberEmail: subscriber.email,
          events: [{
            type: 'sent',
            timestamp: new Date(),
            metadata: {}
          }],
          trackingPixelToken,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.collection('newsletter_analytics').insertOne(analyticsRecord);

        // Generate personalized HTML
        const html = await this.generateNewsletterHTML(
          campaign,
          blogs,
          subscriber.unsubscribeToken,
          trackingPixelToken
        );

        // Send email
        await this.sendEmail(subscriber.email, campaign.subject, html);

        results.sent++;

        // Rate limiting: 100ms delay between sends
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error sending to ${subscriber.email}:`, error);
        results.failed++;
        results.errors.push({
          email: subscriber.email,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new EmailService();