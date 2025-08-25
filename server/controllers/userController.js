const UserService = require('../services/userService');
const bcrypt = require('bcryptjs');

class UserController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.getProfile = this.getProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.createOrUpdateCompany = this.createOrUpdateCompany.bind(this);
    this.updateCredentials = this.updateCredentials.bind(this);
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
      const user = await userService.findById(userId);
      
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
      const { companyName, industry, address, email } = req.body;
      const currentUser = req.user;

      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Prepare company info update
      const companyInfo = {
        companyName: companyName?.trim(),
        industry: industry?.trim(),
        address: address?.trim()
      };

      // Update company info in companies collection
      const companyUpdateResult = await Company.findOneAndUpdate(
        { _id: currentUser.companyInfo?._id },
        { $set: companyInfo },
        { upsert: true, new: true }
      );

      // Prepare user update payload
      const userUpdatePayload = {
        email: email?.trim(),
        companyInfo: companyUpdateResult._id,
        profileComplete: true,
        updatedAt: new Date()
      };

      // Update user
      const userUpdateResult = await User.findByIdAndUpdate(
        currentUser._id,
        { $set: userUpdatePayload },
        { new: true }
      ).populate('companyInfo');

      if (!userUpdateResult) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        message: 'Profile updated successfully',
        user: userUpdateResult
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Error updating profile' });
    }
  },

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
        address: address || '',
        taxNumber: taxNumber || '',
        contactEmail: contactEmail || '',
        website: website || '',
        mission: mission || '',
        logoUrl: logoUrl || '',
        role: role || '',
        description: description || '',
        crnNumber: crnNumber || '',
        phone: phone || '',
        companyPIN: companyPIN || '',
        industry: industry || '',
        companySize: companySize || ''
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
