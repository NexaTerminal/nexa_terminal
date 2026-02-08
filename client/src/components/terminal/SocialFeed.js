import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import styles from '../../styles/terminal/SocialFeed.module.css';

const SocialFeed = () => {
  const { token, currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await ApiService.request('/blogs?limit=10&page=1');
      setPosts(data?.blogs || []);
    } catch (error) {
      setError('Настана грешка при вчитување на објавите. Обидете се повторно.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle like/unlike
  const handleLike = async (blogId) => {
    try {
      const response = await ApiService.post(`/blogs/${blogId}/like`);
      // Update local state
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if ((post.id || post._id) === blogId) {
            const userId = currentUser?._id || currentUser?.id;
            const isNowLiked = response.isLiked;
            const newLikedBy = isNowLiked
              ? [...(post.likedBy || []), userId]
              : (post.likedBy || []).filter(id => id !== userId);
            // If liked, remove from dislikedBy
            const newDislikedBy = isNowLiked
              ? (post.dislikedBy || []).filter(id => id !== userId)
              : post.dislikedBy || [];
            return {
              ...post,
              likes: response.likes,
              likedBy: newLikedBy,
              dislikedBy: newDislikedBy,
              dislikes: isNowLiked && post.dislikedBy?.includes(userId) ? (post.dislikes || 1) - 1 : post.dislikes
            };
          }
          return post;
        })
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  // Handle dislike/un-dislike
  const handleDislike = async (blogId) => {
    try {
      const response = await ApiService.post(`/blogs/${blogId}/dislike`);
      // Update local state
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if ((post.id || post._id) === blogId) {
            const userId = currentUser?._id || currentUser?.id;
            const isNowDisliked = response.isDisliked;
            const newDislikedBy = isNowDisliked
              ? [...(post.dislikedBy || []), userId]
              : (post.dislikedBy || []).filter(id => id !== userId);
            // If disliked, remove from likedBy
            const newLikedBy = isNowDisliked
              ? (post.likedBy || []).filter(id => id !== userId)
              : post.likedBy || [];
            return {
              ...post,
              dislikes: response.dislikes,
              likes: response.likes,
              dislikedBy: newDislikedBy,
              likedBy: newLikedBy
            };
          }
          return post;
        })
      );
    } catch (err) {
      console.error('Error disliking post:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps




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
            currentUserId={currentUser?._id || currentUser?.id}
            onLike={handleLike}
            onDislike={handleDislike}
          />
        ))}
      </div>

    </div>
  );
};


// Decode HTML entities (e.g. &nbsp; &amp;) in plain text strings
function decodeEntities(text) {
  if (!text) return '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

// Blog Card Component
const BlogCard = ({ blog, formatDate, currentUserId, onLike, onDislike }) => {
  const isLiked = blog.likedBy && blog.likedBy.includes(currentUserId);
  const isDisliked = blog.dislikedBy && blog.dislikedBy.includes(currentUserId);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onLike) {
      onLike(blog.id || blog._id);
    }
  };

  const handleDislike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDislike) {
      onDislike(blog.id || blog._id);
    }
  };

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
                  blog.featuredImage.startsWith('https://') ||
                  blog.featuredImage.startsWith('/images/')
                    ? encodeURI(blog.featuredImage)
                    : `${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/uploads/blogs/${encodeURIComponent(blog.featuredImage)}`
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
                {(() => {
                  const decoded = decodeEntities(blog.excerpt);
                  return decoded.length > 150 ? decoded.slice(0, 150) + '...' : decoded;
                })()}
              </p>
            )}

            {/* Tags and Like */}
            <div className={styles.blogFooter}>
              {blog.tags && Array.isArray(blog.tags) && blog.tags.length > 0 && (
                <div className={styles.blogTags}>
                  {blog.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className={styles.blogTag}>#{tag}</span>
                  ))}
                </div>
              )}
              <div className={styles.reactionButtons}>
                <button
                  className={`${styles.likeButton} ${isLiked ? styles.liked : ''}`}
                  onClick={handleLike}
                  title="Добра идеја"
                >
                  <span className={styles.likeIcon}>{isLiked ? '💡' : '○'}</span>
                  <span className={styles.likeCount}>{blog.likes || 0}</span>
                </button>
                <button
                  className={`${styles.dislikeButton} ${isDisliked ? styles.disliked : ''}`}
                  onClick={handleDislike}
                  title="Губење пари"
                >
                  <span className={styles.dislikeIcon}>{isDisliked ? '💸' : '○'}</span>
                  <span className={styles.dislikeCount}>{blog.dislikes || 0}</span>
                </button>
              </div>
            </div>
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
