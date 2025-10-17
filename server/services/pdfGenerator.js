const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class CertificateGenerator {
  constructor() {
    // Certificate dimensions (A4 landscape)
    this.width = 842;
    this.height = 595;

    // Register custom fonts that support Cyrillic
    this.fonts = {
      regular: path.join(__dirname, '../fonts/DejaVuSans.ttf'),
      bold: path.join(__dirname, '../fonts/DejaVuSans-Bold.ttf'),
      italic: path.join(__dirname, '../fonts/DejaVuSans-Oblique.ttf')
    };
  }

  async generateCertificate(certificateData) {
    return new Promise((resolve, reject) => {
      try {
        const {
          fullName,
          jobPosition,
          companyName,
          courseName,
          certificateId,
          issueDate
        } = certificateData;

        // Create PDF document (A4 landscape)
        const doc = new PDFDocument({
          size: [this.width, this.height],
          margins: { top: 40, bottom: 40, left: 50, right: 50 }
        });

        // Buffer to store PDF
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Background gradient effect (simulated with rectangles)
        this.drawBackground(doc);

        // Border
        this.drawBorder(doc);

        // Logo/Header area
        this.drawHeader(doc);

        // Certificate title - darker and more compact
        doc.fontSize(32)
          .font(this.fonts.bold)
          .fillColor('#1a202c')
          .text('СЕРТИФИКАТ', 0, 110, { align: 'center' });

        doc.fontSize(16)
          .font(this.fonts.regular)
          .fillColor('#2d3748')
          .text('ЗА УСПЕШНО ЗАВРШУВАЊЕ', 0, 148, { align: 'center' });

        // "This certifies that" text - darker
        doc.fontSize(12)
          .font(this.fonts.regular)
          .fillColor('#4a5568')
          .text('Се потврдува дека', 0, 190, { align: 'center' });

        // Recipient name (bold and large) - darker
        doc.fontSize(26)
          .font(this.fonts.bold)
          .fillColor('#1a202c')
          .text(fullName, 0, 215, { align: 'center' });

        // Job position and company - darker, more compact
        doc.fontSize(13)
          .font(this.fonts.regular)
          .fillColor('#2d3748')
          .text(jobPosition, 0, 250, { align: 'center' });

        if (companyName) {
          doc.fontSize(13)
            .font(this.fonts.italic)
            .fillColor('#4a5568')
            .text(companyName, 0, 270, { align: 'center' });
        }

        // "has successfully completed" text - darker, adjusted position
        const afterCompanyY = companyName ? 300 : 280;
        doc.fontSize(12)
          .font(this.fonts.regular)
          .fillColor('#4a5568')
          .text('успешно го заврши курсот', 0, afterCompanyY, { align: 'center' });

        // Course name (highlighted) - darker blue
        doc.fontSize(18)
          .font(this.fonts.bold)
          .fillColor('#4c51bf')
          .text(courseName, 0, afterCompanyY + 25, { align: 'center' });

        // Issue date and certificate ID - darker, more compact
        const formattedDate = new Date(issueDate).toLocaleDateString('mk-MK', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        doc.fontSize(10)
          .font(this.fonts.regular)
          .fillColor('#4a5568')
          .text(`Издадено на: ${formattedDate}`, 0, afterCompanyY + 75, { align: 'center' });

        doc.fontSize(9)
          .font(this.fonts.regular)
          .fillColor('#718096')
          .text(`Сертификат бр: ${certificateId}`, 0, afterCompanyY + 92, { align: 'center' });

        // Signature line
        this.drawSignature(doc);

        // Footer
        this.drawFooter(doc);

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  drawBackground(doc) {
    // Light gradient effect with subtle colors
    doc.rect(0, 0, this.width, this.height)
      .fillColor('#f7fafc')
      .fill();

    // Decorative circles (top-right)
    doc.circle(750, 50, 100)
      .fillColor('#e6f0ff', 0.3)
      .fill();

    doc.circle(50, 550, 80)
      .fillColor('#f0e6ff', 0.3)
      .fill();
  }

  drawBorder(doc) {
    // Outer border
    doc.rect(30, 30, this.width - 60, this.height - 60)
      .lineWidth(3)
      .strokeColor('#667eea')
      .stroke();

    // Inner border
    doc.rect(40, 40, this.width - 80, this.height - 80)
      .lineWidth(1)
      .strokeColor('#cbd5e0')
      .stroke();
  }

  drawHeader(doc) {
    // Nexa Terminal text logo - darker
    doc.fontSize(22)
      .font(this.fonts.bold)
      .fillColor('#4c51bf')
      .text('NEXA', 0, 55, { align: 'center' });

    doc.fontSize(11)
      .font(this.fonts.regular)
      .fillColor('#4a5568')
      .text('T E R M I N A L', 0, 80, { align: 'center', characterSpacing: 3 });
  }

  drawSignature(doc) {
    const signatureY = 475;
    const centerX = this.width / 2;

    // Signature line
    doc.moveTo(centerX - 100, signatureY)
      .lineTo(centerX + 100, signatureY)
      .strokeColor('#718096')
      .lineWidth(1)
      .stroke();

    // Signature text
    doc.fontSize(10)
      .font(this.fonts.italic)
      .fillColor('#2d3748')
      .text('Nexa Terminal', centerX - 100, signatureY + 10, {
        width: 200,
        align: 'center'
      });
  }

  drawFooter(doc) {
    // Footer text - darker and more compact
    doc.fontSize(7)
      .font(this.fonts.regular)
      .fillColor('#718096')
      .text('Овој сертификат потврдува успешно завршување на курсот на платформата Nexa Terminal',
        50, this.height - 30, {
          align: 'center',
          width: this.width - 100
        });

    doc.fontSize(7)
      .font(this.fonts.regular)
      .fillColor('#a0aec0')
      .text('www.nexaterminal.com | terminalnexa@gmail.com',
        50, this.height - 18, {
          align: 'center',
          width: this.width - 100
        });
  }
}

module.exports = new CertificateGenerator();
