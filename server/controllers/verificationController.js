const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { ObjectId } = require('mongodb');
const UserService = require('../services/userService');
const emailService = require('../services/emailService');
const MarketplaceService = require('../services/marketplaceService');
const settingsManager = require('../config/settingsManager');

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
    this.sendVerificationEmail = this.sendVerificationEmail.bind(this);
    this.verifyEmail = this.verifyEmail.bind(this);
    this.resendVerificationEmail = this.resendVerificationEmail.bind(this);
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

      // Get user ID - handle both req.user.id (from JWT payload) and req.user._id (from database object)
      const userId = req.user.id || req.user._id;

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

      // Auto-create service provider if user has marketplace info
      let serviceProviderCreated = false;
      if (settingsManager.isFeatureEnabled('marketplace')) {
        try {
          const marketplaceService = new MarketplaceService(db);

          // Get the updated user to check for marketplace info
          const updatedUser = await userService.findById(verification.userId.toString());

          if (updatedUser && updatedUser.marketplaceInfo?.serviceCategory) {
            // Check if service provider already exists
            const existingProvider = await marketplaceService.getProviderByUserId(updatedUser._id);

            if (!existingProvider) {
              await marketplaceService.createServiceProviderFromUser(
                updatedUser._id,
                updatedUser.marketplaceInfo.serviceCategory,
                {
                  description: updatedUser.marketplaceInfo.serviceDescription,
                  servesRemote: updatedUser.marketplaceInfo.servesRemote,
                  phone: updatedUser.phone,
                  website: updatedUser.website
                }
              );
              serviceProviderCreated = true;
            }
          }
        } catch (marketplaceError) {
          console.error('Error creating service provider during verification:', marketplaceError);
          // Don't fail the verification approval if marketplace creation fails
        }
      }

      const response = { message: 'Verification approved successfully' };
      if (serviceProviderCreated) {
        response.message = 'Verification approved and service provider profile created';
        response.serviceProviderCreated = true;
      }

      res.json(response);
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

  // Send verification email
  async sendVerificationEmail(req, res) {
    try {
      const { officialEmail, companyName, companyManager } = req.body;

      if (!officialEmail || !companyName || !companyManager) {
        return res.status(400).json({
          message: 'Official email, company name, and company manager are required'
        });
      }

      const db = req.app.locals.db;
      const userService = new UserService(db);
      const userId = req.user.id || req.user._id;

      // Get current user to validate
      const currentUser = await userService.findById(userId.toString());

      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is already verified
      if (currentUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Your company is already verified'
        });
      }

      // Validate required company information is complete
      const requiredFields = ['companyName', 'companyAddress', 'companyTaxNumber', 'companyManager'];
      const missingFields = requiredFields.filter(field => !currentUser.companyInfo[field]?.trim());

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ве молиме пополнете ги сите задолжителни полиња (име на компанија, адреса, даночен број, менаџер) пред да побарате верификација.'
        });
      }

      // Email spam prevention - TEMPORARILY SET TO 1 MINUTE (TODO: Change to 15 minutes in production)
      const lastEmailSent = currentUser.lastVerificationEmailSent;
      const ONE_MINUTE = 60 * 1000; // 1 minute in milliseconds (TODO: Change to 15 * 60 * 1000 for production)

      if (lastEmailSent && (Date.now() - new Date(lastEmailSent).getTime() < ONE_MINUTE)) {
        const secondsRemaining = Math.ceil((ONE_MINUTE - (Date.now() - new Date(lastEmailSent).getTime())) / 1000);
        return res.status(429).json({
          success: false,
          message: `Веќе испративте верификационен email. Ве молиме почекајте ${secondsRemaining} секунди пред да побарате повторно.`
        });
      }

      // Generate verification token
      const verificationToken = emailService.generateVerificationToken();
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with verification token and official email
      await userService.updateUser(userId.toString(), {
        officialEmail: officialEmail.trim(),
        companyManager: companyManager.trim(),
        verificationToken,
        verificationTokenExpiry: tokenExpiry,
        emailVerificationSent: true,
        lastVerificationEmailSent: new Date(),
        updatedAt: new Date()
      });

      // Send verification email
      const baseUrl = process.env.SERVER_URL || 'http://localhost:5001';
      await emailService.sendVerificationEmail(
        officialEmail,
        companyName,
        verificationToken,
        baseUrl
      );

      res.json({
        success: true,
        message: 'Verification email sent successfully',
        sentTo: officialEmail
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || 'Failed to send verification email' 
      });
    }
  }

  // Verify email with token
  async verifyEmail(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
      }

      const db = req.app.locals.db;
      const userService = new UserService(db);
      const usersCollection = db.collection('users');

      // Find user with this verification token
      const user = await usersCollection.findOne({
        verificationToken: token,
        verificationTokenExpiry: { $gt: new Date() }
      });

      if (!user) {
        // Redirect to frontend with error
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        return res.redirect(`${clientUrl}/verification-result?success=false&error=invalid_token`);
      }

      // Validate that all required company information is present
      const requiredFields = {
        companyName: user.companyInfo?.companyName,
        companyAddress: user.companyInfo?.companyAddress || user.companyInfo?.address,
        companyTaxNumber: user.companyInfo?.companyTaxNumber || user.companyInfo?.taxNumber,
        companyManager: user.companyManager
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value || !value.trim())
        .map(([key]) => key);

      if (missingFields.length > 0) {
        // Redirect to frontend with error - company info incomplete
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        return res.redirect(`${clientUrl}/verification-result?success=false&error=incomplete_profile&missing=${missingFields.join(',')}`);
      }

      // Update user verification status
      await userService.updateUser(user._id.toString(), {
        isVerified: true,
        emailVerified: true,
        verificationStatus: 'approved',
        verificationToken: null,
        verificationTokenExpiry: null,
        updatedAt: new Date()
      });

      // Send success email
      try {
        await emailService.sendVerificationSuccessEmail(
          user.officialEmail,
          user.companyInfo?.companyName || 'Your Company'
        );
      } catch (emailError) {
        console.error('Failed to send success email:', emailError);
        // Continue with verification even if success email fails
      }

      // Redirect to frontend with success - user is now verified and can access all features
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(`${clientUrl}/verification-result?success=true&company=${encodeURIComponent(user.companyInfo?.companyName || '')}&message=verified`);
    } catch (error) {
      console.error('Error verifying email:', error);
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(`${clientUrl}/verification-result?success=false&error=server_error`);
    }
  }

  // Resend verification email
  async resendVerificationEmail(req, res) {
    try {
      const userId = req.user.id || req.user._id;
      const db = req.app.locals.db;
      const userService = new UserService(db);
      const usersCollection = db.collection('users');

      // Get current user data
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      if (!user.officialEmail || !user.companyInfo?.companyName || !user.companyManager) {
        return res.status(400).json({ 
          success: false,
          message: 'Missing required information. Please update your profile first.' 
        });
      }

      if (user.isVerified) {
        return res.status(400).json({ 
          success: false,
          message: 'User is already verified' 
        });
      }

      // Generate new verification token
      const verificationToken = emailService.generateVerificationToken();
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with new token
      await userService.updateUser(userId.toString(), {
        verificationToken,
        verificationTokenExpiry: tokenExpiry,
        emailVerificationSent: true,
        lastVerificationEmailSent: new Date(),
        updatedAt: new Date()
      });

      // Send verification email
      const baseUrl = process.env.SERVER_URL || 'http://localhost:5001';
      await emailService.sendVerificationEmail(
        user.officialEmail,
        user.companyInfo.companyName,
        verificationToken,
        baseUrl
      );

      res.json({
        success: true,
        message: 'Verification email resent successfully',
        sentTo: user.officialEmail
      });
    } catch (error) {
      console.error('Error resending verification email:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || 'Failed to resend verification email' 
      });
    }
  }
}

module.exports = new VerificationController();
