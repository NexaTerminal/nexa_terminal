import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import ApiService from '../../../services/api';
import styles from '../../../styles/terminal/RightSidebar.module.css';

const MarketingAdmin = () => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({ imageUrl: '', quote: '', websiteLink: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await ApiService.request('/marketing?limit=10');
      setPosts(data);
    } catch {
      setPosts([]);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await ApiService.request('/marketing', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSuccess('Маркетинг постот е додаден!');
      setForm({ imageUrl: '', quote: '', websiteLink: '' });
      fetchPosts();
    } catch (err) {
      setError(err.message || 'Грешка при додавање на постот.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser?.isAdmin) return <div>Access denied</div>;

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: 24 }}>
      <h2>Додај Маркетинг Пост</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 16 }}>
          <label>Image URL</label>
          <input name="imageUrl" value={form.imageUrl} onChange={handleChange} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Quote</label>
          <input name="quote" value={form.quote} onChange={handleChange} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Website Link</label>
          <input name="websiteLink" value={form.websiteLink} onChange={handleChange} required style={{ width: '100%' }} />
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Се додава...' : 'Додај'}</button>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
      </form>
      <h3>Последни Маркетинг Постови</h3>
      <div>
        {posts.map(post => (
          <a key={post._id} href={post.websiteLink} target="_blank" rel="noopener noreferrer" className={styles.marketingCard} style={{ marginBottom: 16, display: 'block' }}>
            <img src={post.imageUrl} alt={post.quote} className={styles.marketingImage} />
            <div className={styles.marketingQuote}>{post.quote}</div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default MarketingAdmin; 