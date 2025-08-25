import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from '../../../styles/terminal/admin/ManageUsers.module.css';
import ProfileRequired from '../../../components/common/ProfileRequired';

const ManageUsers = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Неуспешно вчитување на корисници');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      // Get CSRF token
      const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const { csrfToken } = await csrfResponse.json();

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        throw new Error('Неуспешна промена на улога');
      }

      setSuccess('Улогата е успешно променета.');
      fetchUsers(); // Refresh user list

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    try {
      // Get CSRF token
      const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const { csrfToken } = await csrfResponse.json();

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) {
        throw new Error('Неуспешна промена на статус');
      }

      setSuccess('Статусот е успешно променет.');
      fetchUsers(); // Refresh user list

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Вчитување...</div>;
  }

  return (
    <ProfileRequired>
      <div className={styles.container}>
      <h1>Управување со корисници</h1>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Име и Презиме</th>
              <th>Е-пошта</th>
              <th>Улога</th>
              <th>Статус</th>
              <th>Акции</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.companyInfo?.companyName || user.email}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    className={styles.select}
                  >
                    <option value="user">Корисник</option>
                    <option value="admin">Администратор</option>
                  </select>
                </td>
                <td>
                  <span className={`${styles.status} ${styles[user.isActive ? 'active' : 'inactive']}`}>
                    {user.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleStatusChange(user._id, !user.isActive)}
                    className={`${styles.actionButton} ${user.isActive ? styles.deactivate : styles.activate}`}
                  >
                    {user.isActive ? 'Деактивирај' : 'Активирај'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>        </div>
      </div>
    </ProfileRequired>
  );
};

export default ManageUsers;
