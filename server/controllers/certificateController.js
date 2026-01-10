const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const certificateGenerator = require('../services/pdfGenerator');

class CertificateController {
  constructor(db) {
    this.db = db;
  }

  // Generate unique certificate ID
  generateCertificateId() {
    return `NEXA-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  // Verify course completion
  async verifyCourseCompletion(userId, courseId) {
    try {
      const progress = await this.db.collection('courseProgress').findOne({
        userId: new ObjectId(userId),
        courseId: courseId
      });

      if (!progress) {
        return { completed: false, message: 'Нема забележан напредок за овој курс' };
      }

      // Get course data to check total lessons
      const { courseData } = require('../data/courseData');
      const course = courseData[courseId];

      if (!course) {
        return { completed: false, message: 'Курсот не е пронајден' };
      }

      const allLessons = course.modules.flatMap(m => m.lessons);
      const completedCount = progress.completedLessons?.length || 0;

      console.log(`📊 Course completion check: ${completedCount}/${allLessons.length} lessons`);

      if (completedCount < allLessons.length) {
        return {
          completed: false,
          message: `Мора да завршите ги сите ${allLessons.length} лекции (завршени: ${completedCount})`
        };
      }

      return { completed: true };
    } catch (error) {
      console.error('Error verifying course completion:', error);
      return { completed: false, message: 'Грешка при проверка на завршувањето' };
    }
  }

  // Generate certificate
  async generateCertificate(req, res) {
    try {
      const { courseId } = req.params;
      const { fullName, jobPosition, honorCodeAccepted } = req.body;
      const userId = req.user._id;

      console.log('📜 Certificate generation request:', {
        userId,
        courseId,
        fullName,
        jobPosition
      });

      // Validate input
      if (!fullName || !jobPosition) {
        return res.status(400).json({
          message: 'Полното име и работната позиција се задолжителни'
        });
      }

      if (!honorCodeAccepted) {
        return res.status(400).json({
          message: 'Мора да го прифатите Кодексот на чест'
        });
      }

      // Verify course completion
      const verification = await this.verifyCourseCompletion(userId, courseId);
      if (!verification.completed) {
        return res.status(400).json({ message: verification.message });
      }

      // Check if certificate already issued
      const existingProgress = await this.db.collection('courseProgress').findOne({
        userId: new ObjectId(userId),
        courseId: courseId
      });

      if (existingProgress?.certificate?.issued) {
        console.log('📜 Certificate already exists, regenerating...');
        // Return existing certificate data
        return this.downloadCertificate(req, res);
      }

      // Get user data
      const user = await this.db.collection('users').findOne({
        _id: new ObjectId(userId)
      });

      // Get course data
      const { courseData } = require('../data/courseData');
      const course = courseData[courseId];

      if (!course) {
        return res.status(404).json({ message: 'Курсот не е пронајден' });
      }

      // Generate certificate ID
      const certificateId = this.generateCertificateId();
      const issueDate = new Date();

      // Prepare certificate data
      const certificateData = {
        fullName,
        jobPosition,
        companyName: user?.companyInfo?.companyName || null,
        courseName: course.title,
        certificateId,
        issueDate
      };

      // Generate PDF
      const pdfBuffer = await certificateGenerator.generateCertificate(certificateData);

      // Save certificate info to database
      await this.db.collection('courseProgress').updateOne(
        {
          userId: new ObjectId(userId),
          courseId: courseId
        },
        {
          $set: {
            certificate: {
              issued: true,
              issuedAt: issueDate,
              fullName,
              jobPosition,
              companyName: certificateData.companyName,
              certificateId,
              honorCodeAccepted: true,
              honorCodeAcceptedAt: issueDate
            }
          }
        }
      );

      console.log('✅ Certificate generated successfully:', certificateId);

      // Send PDF as download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Nexa-Certificate-${certificateId}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error generating certificate:', error);
      res.status(500).json({ message: 'Грешка при генерирање на сертификатот' });
    }
  }

  // Download existing certificate
  async downloadCertificate(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user._id;

      console.log('📥 Certificate download request:', { userId, courseId });

      // Get certificate data from database
      const progress = await this.db.collection('courseProgress').findOne({
        userId: new ObjectId(userId),
        courseId: courseId
      });

      if (!progress?.certificate?.issued) {
        return res.status(404).json({
          message: 'Сертификатот не е издаден. Прво мора да го завршите курсот.'
        });
      }

      // Get course data
      const { courseData } = require('../data/courseData');
      const course = courseData[courseId];

      if (!course) {
        return res.status(404).json({ message: 'Курсот не е пронајден' });
      }

      // Prepare certificate data
      const certificateData = {
        fullName: progress.certificate.fullName,
        jobPosition: progress.certificate.jobPosition,
        companyName: progress.certificate.companyName,
        courseName: course.title,
        certificateId: progress.certificate.certificateId,
        issueDate: progress.certificate.issuedAt
      };

      // Regenerate PDF
      const pdfBuffer = await certificateGenerator.generateCertificate(certificateData);

      console.log('✅ Certificate downloaded:', progress.certificate.certificateId);

      // Send PDF as download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Nexa-Certificate-${progress.certificate.certificateId}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error downloading certificate:', error);
      res.status(500).json({ message: 'Грешка при преземање на сертификатот' });
    }
  }

  // Get certificate status
  async getCertificateStatus(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user._id;

      const progress = await this.db.collection('courseProgress').findOne({
        userId: new ObjectId(userId),
        courseId: courseId
      });

      if (!progress) {
        return res.json({ issued: false });
      }

      res.json({
        issued: progress.certificate?.issued || false,
        certificateId: progress.certificate?.certificateId || null,
        issuedAt: progress.certificate?.issuedAt || null,
        fullName: progress.certificate?.fullName || null,
        jobPosition: progress.certificate?.jobPosition || null
      });

    } catch (error) {
      console.error('Error getting certificate status:', error);
      res.status(500).json({ message: 'Грешка при проверка на статусот' });
    }
  }
}

module.exports = CertificateController;
