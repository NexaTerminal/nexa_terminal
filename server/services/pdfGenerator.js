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

        // Certificate title - BLACK and bold
        doc.fontSize(34)
          .font(this.fonts.bold)
          .fillColor('#000000')
          .text('СЕРТИФИКАТ', 0, 125, { align: 'center' });

        doc.fontSize(15)
          .font(this.fonts.regular)
          .fillColor('#000000')
          .text('ЗА УСПЕШНО ЗАВРШУВАЊЕ', 0, 165, { align: 'center' });

        // "This certifies that" text - BLACK
        doc.fontSize(11)
          .font(this.fonts.regular)
          .fillColor('#000000')
          .text('Се потврдува дека', 0, 198, { align: 'center' });

        // Recipient name - BOLD BLACK
        doc.fontSize(26)
          .font(this.fonts.bold)
          .fillColor('#000000')
          .text(fullName, 0, 218, { align: 'center' });

        // Job position - BLACK
        doc.fontSize(12)
          .font(this.fonts.regular)
          .fillColor('#000000')
          .text(jobPosition, 0, 252, { align: 'center' });

        // Company name if exists
        let nextY = 272;
        if (companyName) {
          doc.fontSize(12)
            .font(this.fonts.italic)
            .fillColor('#000000')
            .text(companyName, 0, 270, { align: 'center' });
          nextY = 290;
        }

        // "has successfully completed" text - BLACK
        doc.fontSize(11)
          .font(this.fonts.regular)
          .fillColor('#000000')
          .text('успешно го заврши курсот', 0, nextY, { align: 'center' });

        // Course name - BOLD BLUE (but darker)
        doc.fontSize(18)
          .font(this.fonts.bold)
          .fillColor('#1e40af')
          .text(courseName, 0, nextY + 20, { align: 'center' });

        // Issue date and certificate ID - BLACK
        const formattedDate = new Date(issueDate).toLocaleDateString('mk-MK', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        doc.fontSize(10)
          .font(this.fonts.regular)
          .fillColor('#000000')
          .text(`Издадено на: ${formattedDate}`, 0, nextY + 62, { align: 'center' });

        doc.fontSize(9)
          .font(this.fonts.regular)
          .fillColor('#1a202c')
          .text(`Сертификат бр: ${certificateId}`, 0, nextY + 78, { align: 'center' });

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
    // Nexa logo image with better positioning
    if (fs.existsSync(this.logoPath)) {
      const logoWidth = 100; // Larger logo
      const logoX = (this.width - logoWidth) / 2;
      doc.image(this.logoPath, logoX, 40, { width: logoWidth });
    } else {
      // Fallback to text if logo not found - BOLD and BLUE
      doc.fontSize(28)
        .font(this.fonts.bold)
        .fillColor('#1e40af')
        .text('NEXA', 0, 45, { align: 'center' });
    }

    // Terminal text - BLACK and bold
    doc.fontSize(11)
      .font(this.fonts.bold)
      .fillColor('#000000')
      .text('T E R M I N A L', 0, 95, { align: 'center', characterSpacing: 5 });
  }

  drawSignature(doc, yPosition = 475) {
    const centerX = this.width / 2;

    // Signature line - darker
    doc.moveTo(centerX - 100, yPosition)
      .lineTo(centerX + 100, yPosition)
      .strokeColor('#4a5568')
      .lineWidth(1.5)
      .stroke();

    // Signature text - darker and bolder
    doc.fontSize(10)
      .font(this.fonts.italic)
      .fillColor('#000000')
      .text('Nexa Terminal', centerX - 100, yPosition + 10, {
        width: 200,
        align: 'center'
      });
  }

  drawFooter(doc, yPosition = null) {
    // Use provided position or calculate from bottom
    const footerY = yPosition || (this.height - 25);

    // Footer text - single line, BLACK for readability
    doc.fontSize(7)
      .font(this.fonts.regular)
      .fillColor('#000000')
      .text('Овој сертификат потврдува успешно завршување на курсот на платформата Nexa Terminal  •  www.nexaterminal.com',
        50, footerY, {
          align: 'center',
          width: this.width - 100,
          lineBreak: false // Prevent line breaks
        });
  }
}

module.exports = new CertificateGenerator();
