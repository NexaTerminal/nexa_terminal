/**
 * SocialPost Model Schema Definition
 * Used for creating social media posts by users and admin content
 */

const { ObjectId } = require('mongodb');

const SocialPostSchema = {
  // Required fields
  content: {
    type: 'string',
    required: true,
    maxLength: 2000
  },
  author: {
    type: 'objectId',
    required: true
  },
  companyName: {
    type: 'string',
    required: true
  },
  
  // Optional company information
  companyMission: {
    type: 'string',
    default: ''
  },
  companyWebsite: {
    type: 'string',
    default: ''
  },
  companyEmail: {
    type: 'string',
    default: ''
  },
  companyIndustry: {
    type: 'string',
    default: ''
  },
  companyDescription: {
    type: 'string',
    default: ''
  },
  
  // Media and interactions
  images: {
    type: 'array',
    items: {
      type: 'string'
    },
    default: []
  },
  comments: {
    type: 'array',
    items: {
      user: {
        type: 'objectId',
        required: true
      },
      content: {
        type: 'string',
        required: true,
        maxLength: 500
      },
      createdAt: {
        type: 'date',
        default: () => new Date()
      }
    },
    default: []
  },
  
  // Post management
  isApproved: {
    type: 'boolean',
    default: false
  },
  postType: {
    type: 'string',
    enum: ['user_post', 'admin_investment'],
    default: 'user_post'
  },
  originalContentId: {
    type: 'mixed' // Can be ObjectId or string
  },
  originalContentModel: {
    type: 'string',
    enum: ['News', 'Investment']
  },
  visibility: {
    type: 'string',
    enum: ['public', 'private'],
    default: 'public'
  },
  
  // Timestamps
  createdAt: {
    type: 'date',
    default: () => new Date()
  },
  updatedAt: {
    type: 'date',
    default: () => new Date()
  }
};

// Index definitions for MongoDB
const SocialPostIndexes = [
  { key: { createdAt: -1 }, name: 'createdAt_desc' },
  { key: { author: 1 }, name: 'author_asc' },
  { key: { isApproved: 1 }, name: 'isApproved_asc' },
  { key: { postType: 1 }, name: 'postType_asc' },
  { key: { visibility: 1 }, name: 'visibility_asc' },
  { key: { author: 1, createdAt: -1 }, name: 'author_createdAt_compound' }
];

// Validation function
function validateSocialPost(post) {
  const errors = [];
  
  if (!post.content || post.content.trim().length === 0) {
    errors.push('Content is required');
  }
  if (post.content && post.content.length > 2000) {
    errors.push('Content must be 2000 characters or less');
  }
  if (!post.author) {
    errors.push('Author is required');
  }
  if (!post.companyName || post.companyName.trim().length === 0) {
    errors.push('Company name is required');
  }
  
  // Validate post type
  const validPostTypes = ['user_post', 'admin_investment'];
  if (post.postType && !validPostTypes.includes(post.postType)) {
    errors.push('Invalid post type');
  }
  
  // Validate visibility
  const validVisibility = ['public', 'private'];
  if (post.visibility && !validVisibility.includes(post.visibility)) {
    errors.push('Invalid visibility setting');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitization function
function sanitizeSocialPost(post) {
  const sanitized = { ...post };
  
  // Trim string fields
  if (sanitized.content) sanitized.content = sanitized.content.trim();
  if (sanitized.companyName) sanitized.companyName = sanitized.companyName.trim();
  if (sanitized.companyMission) sanitized.companyMission = sanitized.companyMission.trim();
  if (sanitized.companyWebsite) sanitized.companyWebsite = sanitized.companyWebsite.trim();
  if (sanitized.companyEmail) sanitized.companyEmail = sanitized.companyEmail.trim();
  if (sanitized.companyIndustry) sanitized.companyIndustry = sanitized.companyIndustry.trim();
  if (sanitized.companyDescription) sanitized.companyDescription = sanitized.companyDescription.trim();
  
  // Convert author to ObjectId if it's a string
  if (sanitized.author && typeof sanitized.author === 'string') {
    try {
      sanitized.author = new ObjectId(sanitized.author);
    } catch (error) {
      // Keep as string if conversion fails
    }
  }
  
  // Set defaults
  sanitized.isApproved = sanitized.isApproved !== undefined ? sanitized.isApproved : false;
  sanitized.postType = sanitized.postType || 'user_post';
  sanitized.visibility = sanitized.visibility || 'public';
  sanitized.images = sanitized.images || [];
  sanitized.comments = sanitized.comments || [];
  
  // Set timestamps
  const now = new Date();
  if (!sanitized.createdAt) sanitized.createdAt = now;
  sanitized.updatedAt = now;
  
  return sanitized;
}

module.exports = {
  SocialPostSchema,
  SocialPostIndexes,
  validateSocialPost,
  sanitizeSocialPost,
  collectionName: 'socialposts'
};
