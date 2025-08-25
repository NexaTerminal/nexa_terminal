import React, { useState, useEffect } from 'react';
import styles from '../../styles/terminal/RightSidebar.module.css';
import ApiService from '../../services/api';

const RightSidebar = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socialPosts, setSocialPosts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [marketingPosts, setMarketingPosts] = useState([]);

  useEffect(() => {
    const fetchTopInvestments = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/investments?limit=3`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setInvestments(data.investments || data);
        }
      } catch (error) {
        console.error('Грешка при преземање на инвестиции:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSocialPosts = async () => {
      try {
        const posts = await ApiService.request('/social?limit=3');
        setSocialPosts(posts);
      } catch (e) {
        setSocialPosts([]);
      }
    };

    const fetchMarketing = async () => {
      try {
        const posts = await ApiService.request('/marketing?limit=3');
        setMarketingPosts(posts);
      } catch (e) {
        setMarketingPosts([]);
      }
    };

    const fetchBlogs = async () => {
      try {
        const blogs = await ApiService.request('/blogs?limit=3');
        setBlogs(blogs);
      } catch (e) {
        setBlogs([]);
      }
    };

    fetchTopInvestments();
    fetchSocialPosts();
    fetchMarketing();
    fetchBlogs();
  }, []);

  return (
    <aside className={styles.rightSidebar}>
      {/* Marketing Posts */}
      {marketingPosts.length > 0 && (
        <div className={styles.marketingSection}>
          {/* <h4 className={styles.marketingTitle}>Маркетинг</h4> */}
          {marketingPosts.map((post) => (
            <a
              key={post._id}
              href={post.websiteLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.marketingCard}
            >
              <img src={post.imageUrl} alt={post.quote} className={styles.marketingImage} />
              <div className={styles.marketingQuote}>{post.quote}</div>
              {post.websiteLink && (
                <div className={styles.marketingLink}>{post.websiteLink}</div>
              )}
            </a>
          ))}
        </div>
      )}

      {/* Social Posts */}
      {socialPosts.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>📱</span>
            Социјални Мрежи
          </h3>
          <div className={styles.sectionContent}>
            {socialPosts.map((post) => (
              <div key={post._id} className={styles.socialCard}>
                <div className={styles.socialHeader}>
                  <span className={styles.socialPlatform}>{post.platform}</span>
                  <span className={styles.socialDate}>{new Date(post.createdAt).toLocaleDateString('mk-MK')}</span>
                </div>
                <p className={styles.socialContent}>{post.content}</p>
                {post.imageUrl && (
                  <img src={post.imageUrl} alt="Social post" className={styles.socialImage} />
                )}
              </div>
            ))}
            <a href="/terminal/social" className={styles.sectionLink}>
              Видете сè →
            </a>
          </div>
        </div>
      )}

      {/* Top Investment Opportunities */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>💰</span>
          Топ Инвестициски Можности
        </h3>
        <div className={styles.sectionContent}>
          {loading ? (
            <div className={styles.loading}>Се вчитува...</div>
          ) : investments.length > 0 ? (
            investments.slice(0, 3).map((investment, index) => (
              <div key={index} className={styles.investmentCard}>
                <div className={styles.investmentHeader}>
                  <h4 className={styles.investmentTitle}>{investment.title}</h4>
                  <span className={styles.investmentAmount}>
                    {investment.minInvestment}€+
                  </span>
                </div>
                <p className={styles.investmentDescription}>
                  {investment.description?.substring(0, 80)}...
                </p>
                <div className={styles.investmentMeta}>
                  <span className={styles.investmentSector}>{investment.sector}</span>
                  <span className={styles.investmentRisk}>{investment.riskLevel}</span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noData}>Нема достапни инвестиции</div>
          )}
          <a href="/terminal/investments" className={styles.sectionLink}>
            Видете сè →
          </a>
        </div>
      </div>

      {/* Latest Blogs */}
      {blogs.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>📝</span>
            Последни Блогови
          </h3>
          <div className={styles.sectionContent}>
            {blogs.map((blog) => (
              <div key={blog._id} className={styles.blogCard}>
                <div className={styles.blogHeader}>
                  <h4 className={styles.blogTitle}>{blog.title}</h4>
                  <span className={styles.blogDate}>{new Date(blog.createdAt).toLocaleDateString('mk-MK')}</span>
                </div>
                <p className={styles.blogExcerpt}>
                  {blog.content?.substring(0, 100)}...
                </p>
                <div className={styles.blogMeta}>
                  <span className={styles.blogAuthor}>{blog.author}</span>
                  <span className={styles.blogCategory}>{blog.category}</span>
                </div>
              </div>
            ))}
            <a href="/terminal/blogs" className={styles.sectionLink}>
              Видете сè →
            </a>
          </div>
        </div>
      )}
    </aside>
  );
};

export default RightSidebar;
