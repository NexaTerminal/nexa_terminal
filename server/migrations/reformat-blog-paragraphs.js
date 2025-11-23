/**
 * Migration script to reformat existing blog content with proper paragraphs
 * Run with: node server/migrations/reformat-blog-paragraphs.js
 *
 * This script applies the formatContentToParagraphs() function to all existing blogs
 * that don't already have <p> tags, ensuring consistent paragraph formatting.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Import the paragraph formatting logic from blogController
function formatContentToParagraphs(content) {
  if (!content) return '';

  // If already has HTML tags, return as is
  if (content.includes('<p>') || content.includes('<div>') || content.includes('<br>')) {
    return content;
  }

  // First, normalize line endings to \n
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split content by double line breaks first (explicit paragraph separators)
  let paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());

  // If we found double line breaks, use those as paragraph separators
  if (paragraphs.length > 1) {
    // For each paragraph, replace single line breaks with spaces (within paragraph)
    paragraphs = paragraphs.map(p =>
      p.replace(/\n/g, ' ')
       .replace(/\s+/g, ' ')
       .trim()
    ).filter(p => p);
  } else {
    // If no double line breaks, check for single line breaks
    const singleBreakParagraphs = content.split(/\n/).filter(p => p.trim());

    if (singleBreakParagraphs.length > 1) {
      // Use single line breaks as paragraph separators
      paragraphs = singleBreakParagraphs.map(p => p.trim()).filter(p => p);
    } else {
      // No line breaks at all - split by sentences for very long content
      if (content.length > 500) {
        const sentences = content.split(/(?<=[.!?])\s+(?=[А-ЯЀЁЂЃЄЅІЇЈЉЊЋЌЎЏA-Z])/);

        paragraphs = [];
        let currentParagraph = [];
        const sentencesPerParagraph = Math.max(2, Math.ceil(sentences.length / 4));

        sentences.forEach((sentence, index) => {
          currentParagraph.push(sentence.trim());

          if (currentParagraph.length >= sentencesPerParagraph || index === sentences.length - 1) {
            const paragraphText = currentParagraph.join(' ').trim();
            if (paragraphText) {
              paragraphs.push(paragraphText);
            }
            currentParagraph = [];
          }
        });
      } else {
        // Short content without line breaks - keep as single paragraph
        paragraphs = [content.trim()];
      }
    }
  }

  // Wrap each paragraph in <p> tags and preserve spacing
  return paragraphs
    .map(p => `<p>${p.trim()}</p>`)
    .join('\n\n');
}

async function reformatBlogParagraphs() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const blogsCollection = db.collection('blogs');

    // Find all blogs
    const blogs = await blogsCollection.find({}).toArray();
    console.log(`\n📚 Found ${blogs.length} blog posts\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const blog of blogs) {
      // Check if blog content already has paragraph tags
      if (blog.content && !blog.content.includes('<p>')) {
        console.log(`🔧 Reformatting: "${blog.title}"`);

        const formattedContent = formatContentToParagraphs(blog.content);

        await blogsCollection.updateOne(
          { _id: blog._id },
          {
            $set: {
              content: formattedContent,
              updatedAt: new Date()
            }
          }
        );

        updatedCount++;
        console.log(`   ✓ Updated with ${formattedContent.match(/<p>/g)?.length || 0} paragraphs`);
      } else {
        console.log(`⏭️  Skipping: "${blog.title}" (already formatted)`);
        skippedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`Total blogs: ${blogs.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log('='.repeat(60));
    console.log('\n✨ Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('👋 Database connection closed');
  }
}

// Run the migration
reformatBlogParagraphs().catch(console.error);
