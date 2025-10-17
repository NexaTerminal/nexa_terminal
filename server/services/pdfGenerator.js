const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class CertificateGenerator {
  constructor() {
    // Certificate dimensions (A4 landscape)
    this.width = 842;
    this.height = 595;
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
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
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

        // Certificate title
        doc.fontSize(36)
          .font('Helvetica-Bold')
          .fillColor('#2d3748')
          .text('СЕРТИФИКАТ', 0, 120, { align: 'center' });

        doc.fontSize(18)
          .font('Helvetica')
          .fillColor('#4a5568')
          .text('ЗА УСПЕШНО ЗАВРШУВАЊЕ', 0, 165, { align: 'center' });

        // "This certifies that" text
        doc.fontSize(14)
          .font('Helvetica')
          .fillColor('#718096')
          .text('Се потврдува дека', 0, 220, { align: 'center' });

        // Recipient name (bold and large)
        doc.fontSize(28)
          .font('Helvetica-Bold')
          .fillColor('#2d3748')
          .text(fullName, 0, 250, { align: 'center' });

        // Job position and company
        doc.fontSize(14)
          .font('Helvetica')
          .fillColor('#4a5568')
          .text(jobPosition, 0, 290, { align: 'center' });

        if (companyName) {
          doc.fontSize(14)
            .font('Helvetica-Oblique')
            .fillColor('#718096')
            .text(companyName, 0, 315, { align: 'center' });
        }

        // "has successfully completed" text
        doc.fontSize(14)
          .font('Helvetica')
          .fillColor('#718096')
          .text('успешно го заврши курсот', 0, 350, { align: 'center' });

        // Course name (highlighted)
        doc.fontSize(20)
          .font('Helvetica-Bold')
          .fillColor('#667eea')
          .text(courseName, 0, 380, { align: 'center' });

        // Issue date and certificate ID
        const formattedDate = new Date(issueDate).toLocaleDateString('mk-MK', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        doc.fontSize(11)
          .font('Helvetica')
          .fillColor('#718096')
          .text(`Издадено на: ${formattedDate}`, 0, 450, { align: 'center' });

        doc.fontSize(10)
          .font('Helvetica')
          .fillColor('#a0aec0')
          .text(`Сертификат бр: ${certificateId}`, 0, 470, { align: 'center' });

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
    // Nexa Terminal text logo
    doc.fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#667eea')
      .text('NEXA', 0, 60, { align: 'center' });

    doc.fontSize(12)
      .font('Helvetica')
      .fillColor('#718096')
      .text('T E R M I N A L', 0, 88, { align: 'center', characterSpacing: 3 });
  }

  drawSignature(doc) {
    const signatureY = 510;
    const centerX = this.width / 2;

    // Signature line
    doc.moveTo(centerX - 100, signatureY)
      .lineTo(centerX + 100, signatureY)
      .strokeColor('#cbd5e0')
      .lineWidth(1)
      .stroke();

    // Signature text
    doc.fontSize(11)
      .font('Helvetica-Oblique')
      .fillColor('#4a5568')
      .text('Nexa Terminal', centerX - 100, signatureY + 10, {
        width: 200,
        align: 'center'
      });
  }

  drawFooter(doc) {
    // Footer text
    doc.fontSize(8)
      .font('Helvetica')
      .fillColor('#a0aec0')
      .text('Овој сертификат потврдува успешно завршување на курсот на платформата Nexa Terminal',
        50, this.height - 35, {
          align: 'center',
          width: this.width - 100
        });

    doc.fontSize(8)
      .font('Helvetica')
      .fillColor('#cbd5e0')
      .text('www.nexaterminal.com | terminalnexa@gmail.com',
        50, this.height - 20, {
          align: 'center',
          width: this.width - 100
        });
  }
}

module.exports = new CertificateGenerator();
