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
    if (!this.gmailTransporter && process.env.GMAIL_APP_PASSWORD) {
      this.gmailTransporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: 'terminalnexa@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
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
          background-color: #2563eb;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          transition: background-color 0.3s;
        }
        .verify-btn:hover {
          background-color: #1d4ed8;
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
          background-color: #2563eb;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
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
}

module.exports = new EmailService();