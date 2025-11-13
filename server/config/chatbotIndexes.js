/**
 * Chatbot Database Configuration
 *
 * Initializes MongoDB collections and indexes for the conversation history system
 */

/**
 * Initialize chatbot database collections and indexes
 * @param {Object} database - MongoDB database instance
 */
async function initializeChatbotDatabase(database) {
  try {
    console.log('🔧 Setting up chatbot database...');

    // Create conversations collection if it doesn't exist
    const collections = await database.listCollections({ name: 'chatbot_conversations' }).toArray();
    if (collections.length === 0) {
      await database.createCollection('chatbot_conversations');
      console.log('✅ Created chatbot_conversations collection');
    }

    const conversationsCollection = database.collection('chatbot_conversations');

    // Create indexes for optimal query performance
    const indexes = [
      {
        name: 'userId_updatedAt_idx',
        key: { userId: 1, updatedAt: -1 },
        background: true
      },
      {
        name: 'userId_idx',
        key: { userId: 1 },
        background: true
      },
      {
        name: 'createdAt_idx',
        key: { createdAt: 1 },
        background: true
      },
      {
        name: 'isActive_userId_idx',
        key: { isActive: 1, userId: 1 },
        background: true
      }
    ];

    // Create each index
    for (const index of indexes) {
      try {
        await conversationsCollection.createIndex(index.key, {
          name: index.name,
          background: index.background
        });
        console.log(`✅ Created index: ${index.name}`);
      } catch (error) {
        // Index might already exist, that's okay
        if (error.code !== 85) { // 85 = IndexOptionsConflict
          console.warn(`⚠️  Warning creating index ${index.name}:`, error.message);
        }
      }
    }

    console.log('✅ Chatbot database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing chatbot database:', error);
    throw error;
  }
}

/**
 * Schema documentation for reference
 *
 * Collection: chatbot_conversations
 * {
 *   _id: ObjectId,
 *   userId: String,                    // User ID reference
 *   title: String,                     // Auto-generated from first question
 *   messages: [                        // Array of conversation messages
 *     {
 *       messageId: String,             // Unique message ID
 *       type: String,                  // 'user' or 'ai'
 *       content: String,               // Message text
 *       sources: [                     // Only for AI messages
 *         {
 *           documentName: String,
 *           confidence: Number,
 *           pageNumber: Number,
 *           snippet: String
 *         }
 *       ],
 *       timestamp: Date                // Message creation time
 *     }
 *   ],
 *   createdAt: Date,                   // Conversation start time
 *   updatedAt: Date,                   // Last message time
 *   messageCount: Number,              // Total messages
 *   isActive: Boolean                  // Currently active conversation
 * }
 */

module.exports = {
  initializeChatbotDatabase
};
