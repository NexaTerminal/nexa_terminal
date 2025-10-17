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

    // Logo path
    this.logoPath = path.join(__dirname, '../fonts/nexa-logo.png');
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

        // Create PDF document (A4 landscape) - SINGLE PAGE ONLY
        const doc = new PDFDocument({
          size: [this.width, this.height],
          margins: { top: 20, bottom: 20, left: 50, right: 50 },
          bufferPages: false // Prevent auto page breaks
        });

        // Buffer to store PDF
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Background gradient effect
        this.drawBackground(doc);

        // Border
        this.drawBorder(doc);

        // Logo/Header area with actual logo image
        this.drawHeader(doc);

        const centerX = 50; // Left margin
        const textWidth = this.width - 100; // Full width minus margins

        // Certificate title - 30% LARGER (44px) and BLUE like Nexa logo
        doc.fontSize(44)
          .font(this.fonts.bold)
          .fillColor('#2563eb', 1) // Blue like Nexa logo
          .text('СЕРТИФИКАТ', centerX, 120, {
            width: textWidth,
            align: 'center'
          });

        doc.fontSize(15)
          .font(this.fonts.regular)
          .fillColor('#000000', 1)
          .text('ЗА УСПЕШНО ЗАВРШУВАЊЕ', centerX, 165, {
            width: textWidth,
            align: 'center'
          });

        // "This certifies that" text - PURE BLACK
        doc.fontSize(11)
          .font(this.fonts.regular)
          .fillColor('#000000', 1)
          .text('Се потврдува дека', centerX, 198, {
            width: textWidth,
            align: 'center'
          });

        // Recipient name - BOLD PURE BLACK
        doc.fontSize(26)
          .font(this.fonts.bold)
          .fillColor('#000000', 1)
          .text(fullName, centerX, 218, {
            width: textWidth,
            align: 'center'
          });

        // Job position - PURE BLACK
        doc.fontSize(12)
          .font(this.fonts.regular)
          .fillColor('#000000', 1)
          .text(jobPosition, centerX, 252, {
            width: textWidth,
            align: 'center'
          });

        // Company name if exists - PURE BLACK
        let nextY = 272;
        if (companyName) {
          doc.fontSize(12)
            .font(this.fonts.italic)
            .fillColor('#000000', 1)
            .text(companyName, centerX, 270, {
              width: textWidth,
              align: 'center'
            });
          nextY = 290;
        }

        // "has successfully completed" text - PURE BLACK
        doc.fontSize(11)
          .font(this.fonts.regular)
          .fillColor('#000000', 1)
          .text('успешно го заврши курсот', centerX, nextY, {
            width: textWidth,
            align: 'center'
          });

        // Course name - BOLD DARK BLUE
        doc.fontSize(18)
          .font(this.fonts.bold)
          .fillColor('#1e40af', 1)
          .text(courseName, centerX, nextY + 20, {
            width: textWidth,
            align: 'center'
          });

        // Issue date and certificate ID - PURE BLACK
        const formattedDate = new Date(issueDate).toLocaleDateString('mk-MK', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        doc.fontSize(10)
          .font(this.fonts.regular)
          .fillColor('#000000', 1)
          .text(`Издадено на: ${formattedDate}`, centerX, nextY + 62, {
            width: textWidth,
            align: 'center'
          });

        doc.fontSize(9)
          .font(this.fonts.regular)
          .fillColor('#000000', 1)
          .text(`Сертификат бр: ${certificateId}`, centerX, nextY + 78, {
            width: textWidth,
            align: 'center'
          });

        // Signature line - calculated to stay on page
        this.drawSignature(doc, nextY + 105);

        // Footer - must fit on same page (calculated position)
        this.drawFooter(doc, nextY + 138);

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
    const centerX = 50;
    const textWidth = this.width - 100;

    // Nexa logo image - 20% larger (120px instead of 100px)
    if (fs.existsSync(this.logoPath)) {
      const logoWidth = 120;
      const logoX = (this.width - logoWidth) / 2;
      doc.image(this.logoPath, logoX, 40, { width: logoWidth });
    } else {
      // Fallback to text if logo not found - BOLD and BLUE
      doc.fontSize(32)
        .font(this.fonts.bold)
        .fillColor('#1e40af', 1)
        .text('NEXA', centerX, 45, {
          width: textWidth,
          align: 'center'
        });
    }

    // No "TERMINAL" text - removed as requested
  }

  drawSignature(doc, yPosition = 475) {
    const centerX = this.width / 2;

    // Signature line - PURE BLACK
    doc.moveTo(centerX - 100, yPosition)
      .lineTo(centerX + 100, yPosition)
      .strokeColor('#000000', 1)
      .lineWidth(1.5)
      .stroke();

    // Signature text - PURE BLACK italic
    doc.fontSize(10)
      .font(this.fonts.italic)
      .fillColor('#000000', 1)
      .text('Nexa Terminal', centerX - 100, yPosition + 10, {
        width: 200,
        align: 'center'
      });
  }

  drawFooter(doc, yPosition = null) {
    // Use provided position or calculate from bottom
    const footerY = yPosition || (this.height - 25);
    const centerX = 50;
    const textWidth = this.width - 100;

    // Footer text - single line, PURE BLACK
    doc.fontSize(7)
      .font(this.fonts.regular)
      .fillColor('#000000', 1)
      .text('Овој сертификат потврдува успешно завршување на курсот на платформата Nexa Terminal  •  www.nexaterminal.com',
        centerX, footerY, {
          width: textWidth,
          align: 'center',
          lineBreak: false // Prevent line breaks
        });
  }
}

module.exports = new CertificateGenerator();
