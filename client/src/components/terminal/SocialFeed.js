import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import styles from '../../styles/terminal/SocialFeed.module.css';

const SocialFeed = () => {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  // Fetch posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      // All posts now come from blogs collection with category filtering
      // If filter is 'all', fetch without category parameter to get all posts
      const categoryParam = filter === 'all' ? '' : `&category=${filter}`;
      const data = await ApiService.request(`/blogs?limit=10&page=1${categoryParam}`);
      setPosts(data?.blogs || []); // Use blogs data for all filters
    } catch (error) {
      setError('Настана грешка при вчитување на објавите. Обидете се повторно.');
      setPosts([]); // Ensure posts is an array even on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filter, token]); // eslint-disable-line react-hooks/exhaustive-deps 
  // Added token to dependency array as it's used in ApiService, and fetchPosts is called on mount.




  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return `пред ${diffInSeconds}с`;
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `пред ${diffInMinutes}м`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `пред ${diffInHours}ч`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return `пред ${diffInDays}д`;
  };


  if (loading && posts.length === 0) { // Show loading only if there are no posts yet
    return <div className={styles.loading}>Се вчитуваат објави...</div>;
  }

  return (
    <div className={styles.socialFeed}>

      {/* Filter buttons */}
      <div className={styles.filterSection}>
        <button
          className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          Сите
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'legal' ? styles.active : ''}`}
          onClick={() => setFilter('legal')}
        >
          Правни
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'entrepreneurship' ? styles.active : ''}`}
          onClick={() => setFilter('entrepreneurship')}
        >
          Претприемништво
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'investments' ? styles.active : ''}`}
          onClick={() => setFilter('investments')}
        >
          Инвестиции
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'marketing' ? styles.active : ''}`}
          onClick={() => setFilter('marketing')}
        >
          Маркетинг
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* Posts list */}
      {!loading && posts.length === 0 && !error && (
         <div className={styles.noPosts}>Нема објави за прикажување.</div>
      )}
      
      <div className={styles.postsList}>
        {posts.map(blog => (
          <BlogCard
            key={blog.id || blog._id}
            blog={blog}
            formatDate={formatDate}
          />
        ))}
      </div>

    </div>
  );
};


// Blog Card Component
const BlogCard = ({ blog, formatDate }) => {
  return (
    <div className={styles.blogCard}>
      <a href={`/terminal/blogs/${blog.id || blog._id}`} className={styles.blogCardLink}>
        <div className={styles.blogCardLayout}>
          {/* Blog Featured Image - Left Half */}
          <div className={styles.blogImageContainer}>
            {blog.featuredImage ? (
              <img
                src={
                  blog.featuredImage.startsWith('data:') ||
                  blog.featuredImage.startsWith('http://') ||
                  blog.featuredImage.startsWith('https://')
                    ? blog.featuredImage
                    : `${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/uploads/blogs/${blog.featuredImage}`
                }
                alt={blog.title}
                className={styles.blogFeaturedImage}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const placeholderElement = document.createElement('div');
                  placeholderElement.className = styles.blogImagePlaceholder;
                  placeholderElement.innerHTML = '<span>📝</span>';
                  e.target.parentNode.appendChild(placeholderElement);
                }}
              />
            ) : (
              <div className={styles.blogImagePlaceholder}>
                <span>📝</span>
              </div>
            )}
          </div>

          {/* Blog Content - Right Half */}
          <div className={styles.blogCardContent}>

            {/* Blog Title */}
            <h3 className={styles.blogCardTitle}>{blog.title}</h3>

            {/* Blog Excerpt */}
            {blog.excerpt && (
              <p className={styles.blogCardExcerpt}>
                {blog.excerpt.length > 150 ? blog.excerpt.slice(0, 150) + '...' : blog.excerpt}
              </p>
            )}

            {/* Tags */}
            {blog.tags && Array.isArray(blog.tags) && blog.tags.length > 0 && (
              <div className={styles.blogTags}>
                {blog.tags.slice(0, 2).map((tag, index) => (
                  <span key={index} className={styles.blogTag}>#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </a>
    </div>
  );
};

export default SocialFeed;

// Removed the old PostCard structure that was split into companySidebar and postMainContent
// as the new structure is more typical for a social feed post.
// The data structure for posts (post.user, post.author, post.companyInfo) needs to be consistent
// from the backend or handled more robustly here.
// For example, a post might have a `user` object with `name` and `profilePicture`.
// Admin posts (news, investment) might have a different structure or a generic "Admin" user.
// This example assumes `post.user.name` and `post.user.profilePicture` for user posts,
// and `post.author.name` for other types if `post.user` is not present.
// The `currentUser` prop was removed from PostCard as `useAuth` can be used directly if needed,
// or better, pass specific user data like `currentUserId` if PostCard shouldn't be coupled with AuthContext.
// For simplicity, `useAuth` is now used in PostCard to get the current user for like status.
