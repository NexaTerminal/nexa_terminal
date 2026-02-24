const UserService = require('../services/userService');
const bcrypt = require('bcryptjs');

class UserController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.getProfile = this.getProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.createOrUpdateCompany = this.createOrUpdateCompany.bind(this);
    this.updateCredentials = this.updateCredentials.bind(this);
    this.regenerateCompanyCode = this.regenerateCompanyCode.bind(this);
    this.joinCompany = this.joinCompany.bind(this);
  }

  // Get user profile
  async getProfile(req, res) {
    try {
      const db = req.app.locals.db;
      const userService = new UserService(db);
      const companiesCollection = db.collection('companies');
      
      // Ensure user ID is properly formatted
      const userId = req.user._id.toString ? req.user._id : req.user._id;
      
      // Get user profile
      let user = await userService.findById(userId);

      // Backfill: existing verified users who pre-date the company code feature
      // get promoted to companyAdmin automatically on next profile fetch
      if (user && user.isVerified && !user.isCompanyAdmin && !user.companyAdminId && !user.companyCode) {
        const companyCode = await userService.generateUniqueCompanyCode();
        await userService.collection.updateOne(
          { _id: user._id },
          { $set: { isCompanyAdmin: true, companyCode, companyCodeGeneratedAt: new Date() } }
        );
        user = await userService.findById(userId);
      }

      // Get company profile if exists
      const company = await companiesCollection.findOne({ userId: userId });

      res.json({
        user: userService.sanitizeUser(user),
        company: company || null
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      console.log('📝 Profile update request body:', JSON.stringify(req.body, null, 2));
      
      const currentUser = req.user;
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Handle both old format (direct fields) and new format (nested companyInfo)
      const { companyInfo: incomingCompanyInfo, email, companyManager, officialEmail, termsAccepted, marketplaceInfo } = req.body;

      // Block members from editing company info
      if (currentUser.companyAdminId && !currentUser.isCompanyAdmin) {
        // Allow other profile fields but strip companyInfo
        const memberPayload = {};
        if (email?.trim()) memberPayload.email = email.trim();
        if (officialEmail?.trim()) memberPayload.officialEmail = officialEmail.trim();
        const userService = new UserService(req.app.locals.db);
        const updated = await userService.updateUser(currentUser._id || currentUser.id, memberPayload);
        const finalUser = await userService.findById(currentUser._id || currentUser.id);
        return res.json({ message: 'Profile updated successfully', user: userService.sanitizeUser(finalUser) });
      }

      // Block duplicate tax number (only for non-members trying to register a new company)
      const incomingTaxNumber = incomingCompanyInfo?.companyTaxNumber?.trim();
      if (incomingTaxNumber) {
        const userService = new UserService(req.app.locals.db);
        const existingByTax = await userService.findByTaxNumber(incomingTaxNumber);
        const currentUserId = (currentUser._id || currentUser.id).toString();
        const isAlreadyLinkedToThisCompany = existingByTax?._id.toString() === currentUser.companyAdminId?.toString();

        if (existingByTax && existingByTax._id.toString() !== currentUserId && !isAlreadyLinkedToThisCompany) {
          return res.status(409).json({
            message: 'Компанија со овој даночен број веќе постои.',
            code: 'TAX_NUMBER_CONFLICT',
            canJoinWithCode: true
          });
        }
      }

      // Prepare company info update - merge with existing data
      let companyInfoUpdate = {};
      
      if (incomingCompanyInfo) {
        // New format with nested companyInfo object
        companyInfoUpdate = {
          companyName: incomingCompanyInfo.companyName?.trim() || null,
          companyAddress: incomingCompanyInfo.companyAddress?.trim() || '',
          companyTaxNumber: incomingCompanyInfo.companyTaxNumber?.trim() || '',
          companyManager: incomingCompanyInfo.companyManager?.trim() || '', // NOW in companyInfo
          companyLogo: incomingCompanyInfo.companyLogo?.trim() || '', // Company logo in companyInfo
          businessActivity: incomingCompanyInfo.businessActivity?.trim() || '',
          website: incomingCompanyInfo.website?.trim() || '',
          industry: incomingCompanyInfo.industry?.trim() || null,
          role: incomingCompanyInfo.role?.trim() || '',
          description: incomingCompanyInfo.description?.trim() || '',
          // Keep existing fields for backward compatibility
          missionStatement: incomingCompanyInfo.missionStatement?.trim() || '',
          facebook: incomingCompanyInfo.facebook?.trim() || '',
          linkedin: incomingCompanyInfo.linkedin?.trim() || ''
        };
      } else {
        // Old format with direct fields (backward compatibility)
        const { companyName, industry, address } = req.body;
        companyInfoUpdate = {
          companyName: companyName?.trim(),
          industry: industry?.trim(),
          companyAddress: address?.trim() || ''
        };
      }

      // Prepare user update payload
      const userUpdatePayload = {
        companyInfo: companyInfoUpdate,
        profileComplete: true,
        updatedAt: new Date()
      };

      // Add email fields if provided
      if (email?.trim()) {
        userUpdatePayload.email = email.trim();
      }
      if (officialEmail?.trim()) {
        userUpdatePayload.officialEmail = officialEmail.trim();
      }

      // Add terms acceptance if provided
      if (typeof termsAccepted === 'boolean') {
        userUpdatePayload.termsAccepted = termsAccepted;
        if (termsAccepted) {
          userUpdatePayload.termsAcceptedAt = new Date();
        }
      }

      // Add marketplace info if provided
      if (marketplaceInfo) {
        userUpdatePayload.marketplaceInfo = {
          serviceCategory: marketplaceInfo.serviceCategory?.trim() || '',
          description: marketplaceInfo.description?.trim() || '',
          isServiceProvider: !!marketplaceInfo.serviceCategory
        };
      }

      // NOTE: companyManager is now handled within companyInfo object above

      console.log('📝 User update payload:', JSON.stringify(userUpdatePayload, null, 2));

      // Update user using UserService
      const userService = new UserService(req.app.locals.db);
      const userUpdateResult = await userService.updateUser(currentUser._id || currentUser.id, userUpdatePayload);

      if (!userUpdateResult) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get updated user data
      const updatedUser = await userService.findById(currentUser._id || currentUser.id);

      // ============================================
      // AUTO-VERIFICATION (2025-11-29)
      // ============================================
      // Check if all required company fields are complete
      // If yes, automatically set isVerified to true
      const hasCompleteCompanyInfo = updatedUser.companyInfo &&
                                     updatedUser.companyInfo.companyName &&
                                     (updatedUser.companyInfo.companyAddress || updatedUser.companyInfo.address) &&
                                     (updatedUser.companyInfo.companyTaxNumber || updatedUser.companyInfo.taxNumber) &&
                                     (updatedUser.companyInfo.companyManager || updatedUser.companyManager) &&
                                     updatedUser.officialEmail;

      if (hasCompleteCompanyInfo && !updatedUser.isVerified) {
        console.log('✅ Auto-verifying user - all required company data is complete');

        // Generate a unique company code if this user doesn't have one yet
        let companyCode = updatedUser.companyCode;
        if (!companyCode) {
          companyCode = await userService.generateUniqueCompanyCode();
        }

        await userService.updateUser(currentUser._id || currentUser.id, {
          isVerified: true,
          verificationStatus: 'approved',
          isCompanyAdmin: true,
          companyCode,
          companyCodeGeneratedAt: new Date(),
          updatedAt: new Date()
        });

        // Refresh user data after auto-verification
        const finalUser = await userService.findById(currentUser._id || currentUser.id);

        return res.json({
          message: 'Profile updated and verified successfully! You now have access to all features.',
          user: userService.sanitizeUser(finalUser),
          autoVerified: true
        });
      }

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Error updating profile' });
    }
  }

  // Create or update company profile (separate companies collection)
  async createOrUpdateCompany(req, res) {
    try {
      const { 
        companyName, 
        address,
        taxNumber, 
        industry,
        contactEmail,
        website, 
        mission, 
        logoUrl,
        role,
        description,
        crnNumber,
        phone,
        companyPIN,
        companySize
      } = req.body;
      
      const db = req.app.locals.db;
      const userService = new UserService(db);
      const companiesCollection = db.collection('companies');
      
      // Ensure user ID is properly formatted
      const userId = req.user._id;
      
      // Validate required fields - make companyName the only required field
      if (!companyName) {
        return res.status(400).json({ message: 'Company name is required' });
      }
      
      // Check if company profile already exists
      const existingCompany = await companiesCollection.findOne({ userId: userId });
      
      // Prepare data for companies collection (backward compatibility)
      const companyData = {
        companyName,
        companyAddress: address || '', // Map address to companyAddress for backward compatibility
        taxNumber: taxNumber || '',
        businessActivity: industry || '', // Map industry to businessActivity
        updatedAt: new Date()
      };
      
      // Add optional fields if provided
      if (contactEmail) companyData.email = contactEmail;
      if (website) companyData.website = website;
      if (mission) companyData.mission = mission;
      if (logoUrl) companyData.logoUrl = logoUrl;

      // Prepare comprehensive data for User.companyInfo
      const userCompanyInfoUpdate = {
        companyName: companyName || '',
        companyAddress: address || '', // Use companyAddress consistently
        companyTaxNumber: taxNumber || '', // Use companyTaxNumber consistently
        companyManager: req.body.companyManager || req.body.manager || '', // Company manager in companyInfo
        companyLogo: logoUrl || '', // Company logo in companyInfo
        businessActivity: industry || '',
        industry: req.body.industry || '',
        companySize: companySize || '',
        contactEmail: contactEmail || '',
        phone: phone || '',
        website: website || '',
        facebook: req.body.facebook || '',
        linkedin: req.body.linkedin || '',
        description: description || '',
        mission: mission || '',
        missionStatement: req.body.missionStatement || '',
        role: role || '',
        crnNumber: crnNumber || '',
        companyPIN: companyPIN || ''
      };

      // Get current user to see existing data
      const currentUser = await userService.findById(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userUpdatePayload = {
        profileComplete: true,
        companyInfo: userCompanyInfoUpdate
      };
      
      // Update or create company in companies collection
      if (existingCompany) {
        await companiesCollection.updateOne(
          { userId: userId },
          { $set: companyData }
        );
      } else {
        companyData.userId = userId;
        companyData.createdAt = new Date();
        await companiesCollection.insertOne(companyData);
      }
      
      // CRITICAL: Update user's companyInfo and profileComplete status
      const userUpdateResult = await userService.updateUser(userId, userUpdatePayload);
      
      // Verify the update by fetching the user again
      const updatedUser = await userService.findById(userId);
      
      res.json({ 
        message: 'Company profile saved successfully',
        companyInfo: updatedUser?.companyInfo,
        profileComplete: updatedUser?.profileComplete
      });
      
    } catch (error) {
      console.error('❌ Company profile save error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // Regenerate company code (company admins only)
  async regenerateCompanyCode(req, res) {
    try {
      const db = req.app.locals.db;
      const userService = new UserService(db);
      const user = await userService.findById(req.user._id || req.user.id);

      if (!user) return res.status(404).json({ message: 'User not found' });
      if (!user.isCompanyAdmin) {
        return res.status(403).json({ message: 'Only company admins can regenerate the company code' });
      }

      const companyCode = await userService.generateUniqueCompanyCode();
      await userService.updateUser(user._id, {
        companyCode,
        companyCodeGeneratedAt: new Date()
      });

      return res.json({ companyCode, generatedAt: new Date() });
    } catch (error) {
      console.error('Error regenerating company code:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // Join a company using a 5-digit company code
  async joinCompany(req, res) {
    try {
      const db = req.app.locals.db;
      const userService = new UserService(db);
      const { companyCode } = req.body;

      // 1. Validate input format
      if (!companyCode || !/^\d{5}$/.test(companyCode.toString().trim())) {
        return res.status(400).json({ message: 'Невалиден код. Кодот мора да содржи точно 5 цифри.' });
      }

      const code = companyCode.toString().trim();

      // 2. Load the requesting user fresh from DB for rate-limit state
      const requestingUser = await userService.findById(req.user._id || req.user.id);
      if (!requestingUser) return res.status(404).json({ message: 'User not found' });

      // 3. Guard: cannot join if already an admin or already linked
      if (requestingUser.isCompanyAdmin) {
        return res.status(409).json({ message: 'Company admins cannot join another company.' });
      }
      if (requestingUser.companyAdminId) {
        return res.status(409).json({ message: 'You are already a member of a company.' });
      }

      // 4. Per-user rate limiting: max 5 attempts per 15 min window
      const now = new Date();
      const windowMs = 15 * 60 * 1000;
      const attempts = requestingUser.companyCodeAttempts || { count: 0, windowStart: now };

      if (now - new Date(attempts.windowStart) > windowMs) {
        // Reset window
        attempts.count = 0;
        attempts.windowStart = now;
      }

      attempts.count += 1;

      // Persist updated attempt count before lookup (prevents TOCTOU)
      await userService.collection.updateOne(
        { _id: requestingUser._id },
        { $set: { companyCodeAttempts: attempts } }
      );

      if (attempts.count > 5) {
        return res.status(429).json({
          message: 'Премногу неуспешни обиди. Обидете се повторно по 15 минути.',
          retryAfter: '15 minutes'
        });
      }

      // 5. Find admin by code
      const adminUser = await userService.findByCompanyCode(code);
      if (!adminUser) {
        return res.status(404).json({ message: 'Невалиден код. Проверете го кодот и обидете се повторно.' });
      }

      // 6. Cannot use your own code
      if (adminUser._id.toString() === requestingUser._id.toString()) {
        return res.status(400).json({ message: 'Не можете да го користите сопствениот код.' });
      }

      // 7. Link the user to the admin's company
      const updatedUser = await userService.updateUser(requestingUser._id, {
        companyAdminId: adminUser._id,
        companyJoinedAt: new Date(),
        isVerified: true,
        verificationStatus: 'approved',
        profileComplete: true
      });

      const finalUser = await userService.findById(requestingUser._id);

      return res.json({
        message: 'Успешно се приклучивте на компанијата!',
        companyName: adminUser.companyInfo?.companyName || '',
        user: userService.sanitizeUser(finalUser)
      });

    } catch (error) {
      console.error('Error joining company:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // Update user credentials (username and password)
  async updateCredentials(req, res) {
    try {
      const { currentPassword, username, password } = req.body;
      
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      
      if (!username && !password) {
        return res.status(400).json({ message: 'At least one field (username or password) must be provided' });
      }
      
      const db = req.app.locals.db;
      const userService = new UserService(db);
      
      // Ensure user ID is properly formatted
      const userId = req.user._id.toString ? req.user._id : req.user._id;
      
      // Get current user to verify current password
      const currentUser = await userService.findById(userId);
      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Prepare update data
      const updateData = {};
      
      // Update username if provided
      if (username) {
        // Check if username is already taken
        const existingUser = await userService.findByUsername(username);
        if (existingUser && existingUser._id.toString() !== userId) {
          return res.status(400).json({ message: 'Username is already taken' });
        }
        updateData.username = username;
      }
      
      // Update password if provided
      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
      }
      
      // Update user credentials
      const result = await userService.updateUser(userId, updateData);
      
      // Fetch the updated user to send back
      const updatedUser = await userService.findById(userId);
      
      res.json({ 
        message: 'Credentials updated successfully',
        user: userService.sanitizeUser(updatedUser)
      });
    } catch (error) {
      console.error('❌ Credentials update error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = new UserController();
