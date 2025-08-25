const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { ObjectId } = require('mongodb');
const UserService = require('../services/userService');

class VerificationController {
  constructor() {
    // Configure multer for file uploads
    this.upload = multer({ 
      storage: multer.diskStorage({
        destination: async (req, file, cb) => {
          const uploadDir = path.join(__dirname, '../public/uploads/verification');
          try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
          } catch (error) {
            cb(error);
          }
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExt)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'));
        }
      }
    });

    // Bind methods to preserve 'this' context
    this.submitVerification = this.submitVerification.bind(this);
    this.getVerificationStatus = this.getVerificationStatus.bind(this);
    this.getPendingVerifications = this.getPendingVerifications.bind(this);
    this.approveVerification = this.approveVerification.bind(this);
    this.rejectVerification = this.rejectVerification.bind(this);
    this.uploadDocument = this.uploadDocument.bind(this);
  }

  // Submit verification request
  async submitVerification(req, res) {
    try {
      const {
        companyName,
        companyAddress,
        taxNumber,
        businessActivity,
        email,
        website,
        documents
      } = req.body;

      // Validation
      if (!companyName || !companyAddress || !taxNumber || !businessActivity) {
        return res.status(400).json({ 
          message: 'Company name, address, tax number, and business activity are required' 
        });
      }

      const db = req.app.locals.db;
      const userService = new UserService(db);
      const verificationsCollection = db.collection('company_verifications');

      // Check if user already has a pending verification
      const existingVerification = await verificationsCollection.findOne({ 
        userId: new ObjectId(req.user.id),
        status: { $in: ['pending', 'under_review'] }
      });

      if (existingVerification) {
        return res.status(400).json({ 
          message: 'You already have a pending verification request' 
        });
      }

      // Create verification record
      const verificationData = {
        userId: new ObjectId(userId),
        companyName: companyName.trim(),
        companyAddress: companyAddress.trim(),
        taxNumber: taxNumber.trim(),
        businessActivity: businessActivity.trim(),
        email: email ? email.trim() : '',
        website: website ? website.trim() : '',
        documents: documents || [],
        status: 'pending',
        submittedAt: new Date(),
        updatedAt: new Date()
      };

      const result = await verificationsCollection.insertOne(verificationData);

      // Mark user as unverified (they'll be verified upon approval)
      await userService.updateUser(userId, { 
        isVerified: false 
      });

      res.status(201).json({
        message: 'Verification request submitted successfully',
        verificationId: result.insertedId
      });
    } catch (error) {
      console.error('Error submitting verification:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get verification status for current user
  async getVerificationStatus(req, res) {
    try {
      const db = req.app.locals.db;
      const verificationsCollection = db.collection('company_verifications');

      // Get user ID - handle both req.user.id (from JWT payload) and req.user._id (from database object)
      const userId = req.user.id || req.user._id;

      const verification = await verificationsCollection.findOne({ 
        userId: new ObjectId(userId) 
      });

      if (!verification) {
        return res.json({ 
          status: 'not_submitted',
          message: 'No verification request found' 
        });
      }

      res.json({
        status: verification.status,
        submittedAt: verification.submittedAt,
        updatedAt: verification.updatedAt,
        companyName: verification.companyName,
        reviewComments: verification.reviewComments || null
      });
    } catch (error) {
      console.error('Error fetching verification status:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get all pending verifications (admin only)
  async getPendingVerifications(req, res) {
    try {
      const db = req.app.locals.db;
      const verificationsCollection = db.collection('company_verifications');

      const pendingVerifications = await verificationsCollection.aggregate([
        { $match: { status: 'pending' } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
            pipeline: [
              {
                $project: {
                  email: 1,
                  profileImage: 1
                }
              }
            ]
          }
        },
        { $unwind: '$user' },
        { $sort: { submittedAt: 1 } }
      ]).toArray();

      res.json(pendingVerifications);
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Approve verification (admin only)
  async approveVerification(req, res) {
    try {
      const { id } = req.params;
      const { reviewComments } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid verification ID' });
      }

      const db = req.app.locals.db;
      const userService = new UserService(db);
      const verificationsCollection = db.collection('company_verifications');

      // Find verification
      const verification = await verificationsCollection.findOne({ 
        _id: new ObjectId(id) 
      });

      if (!verification) {
        return res.status(404).json({ message: 'Verification request not found' });
      }

      // Get user ID - handle both req.user.id (from JWT payload) and req.user._id (from database object)
      const userId = req.user.id || req.user._id;

      // Update verification status
      await verificationsCollection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            status: 'approved',
            reviewComments: reviewComments || '',
            reviewedAt: new Date(),
            reviewedBy: new ObjectId(userId),
            updatedAt: new Date()
          } 
        }
      );

      // Update user status
      await userService.updateVerificationStatus(
        verification.userId.toString(),
        'approved'
      );

      res.json({ message: 'Verification approved successfully' });
    } catch (error) {
      console.error('Error approving verification:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Reject verification (admin only)
  async rejectVerification(req, res) {
    try {
      const { id } = req.params;
      const { reviewComments } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid verification ID' });
      }

      const db = req.app.locals.db;
      const userService = new UserService(db);
      const verificationsCollection = db.collection('company_verifications');

      // Find verification
      const verification = await verificationsCollection.findOne({ 
        _id: new ObjectId(id) 
      });

      if (!verification) {
        return res.status(404).json({ message: 'Verification request not found' });
      }

      // Get user ID - handle both req.user.id (from JWT payload) and req.user._id (from database object)  
      const userId = req.user.id || req.user._id;

      // Update verification status
      await verificationsCollection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            status: 'rejected',
            reviewComments: reviewComments || 'Verification rejected',
            reviewedAt: new Date(),
            reviewedBy: new ObjectId(userId),
            updatedAt: new Date()
          } 
        }
      );

      // Update user status
      await userService.updateVerificationStatus(
        verification.userId.toString(),
        'rejected',
        false
      );

      res.json({ message: 'Verification rejected successfully' });
    } catch (error) {
      console.error('Error rejecting verification:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Upload verification document
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const documentUrl = `/uploads/verification/${req.file.filename}`;
      
      res.json({
        message: 'Document uploaded successfully',
        documentUrl,
        filename: req.file.filename,
        originalName: req.file.originalname
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new VerificationController();
