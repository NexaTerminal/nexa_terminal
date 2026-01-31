/**
 * Migration: Add slugs to existing blog posts
 *
 * Run with: node server/migrations/add-slugs-to-blogs.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');
const { generateSlug } = require('../utils/slugify');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';

async function migrateBlogSlugs() {
  console.log('Starting blog slug migration...');
  console.log('Connecting to MongoDB...');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();
    const blogsCollection = db.collection('blogs');

    // Find all blogs without slugs
    const blogsWithoutSlugs = await blogsCollection.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    }).toArray();

    console.log(`Found ${blogsWithoutSlugs.length} blogs without slugs`);

    if (blogsWithoutSlugs.length === 0) {
      console.log('All blogs already have slugs. Nothing to migrate.');
      return;
    }

    // Track used slugs to avoid duplicates
    const existingSlugs = new Set();

    // Get all existing slugs
    const blogsWithSlugs = await blogsCollection.find({ slug: { $exists: true, $ne: null, $ne: '' } }).toArray();
    blogsWithSlugs.forEach(blog => existingSlugs.add(blog.slug));

    let updated = 0;
    let errors = 0;

    for (const blog of blogsWithoutSlugs) {
      try {
        let baseSlug = generateSlug(blog.title);

        if (!baseSlug) {
          // Fallback if title produces empty slug
          baseSlug = `post-${blog._id.substring(0, 8)}`;
        }

        let slug = baseSlug;
        let counter = 1;

        // Ensure uniqueness
        while (existingSlugs.has(slug)) {
          slug = `${baseSlug}-${counter}`;
          counter++;

          if (counter > 100) {
            slug = `${baseSlug}-${Date.now()}`;
            break;
          }
        }

        // Update the blog with the new slug
        await blogsCollection.updateOne(
          { _id: blog._id },
          {
            $set: {
              slug,
              // Also add default SEO fields if missing
              metaTitle: blog.metaTitle || blog.title,
              metaDescription: blog.metaDescription || (blog.excerpt ? blog.excerpt.substring(0, 155) : ''),
              focusKeyword: blog.focusKeyword || ''
            }
          }
        );

        existingSlugs.add(slug);
        updated++;
        console.log(`  ✓ "${blog.title}" → ${slug}`);

      } catch (error) {
        errors++;
        console.error(`  ✗ Error updating blog "${blog.title}":`, error.message);
      }
    }

    console.log('\n--- Migration Complete ---');
    console.log(`Updated: ${updated}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total processed: ${blogsWithoutSlugs.length}`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the migration
migrateBlogSlugs()
  .then(() => {
    console.log('Migration script finished.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
