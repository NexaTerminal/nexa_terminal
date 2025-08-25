import React, { useState, useEffect } from 'react';
import styles from '../../styles/terminal/Investments.module.css';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import ProfileReminderBanner from '../../components/terminal/ProfileReminderBanner';
import { useAuth } from '../../contexts/AuthContext';

const Investments = () => {
  const { token } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/investments?page=${currentPage}&limit=6`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setInvestments(data.investments);
          setTotalPages(data.pagination.pages);
        }
      } catch (error) {
        // Silently handle investment fetch errors
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, [token, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <Header isTerminal={true} />
      
      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <ProfileReminderBanner />
          
          <div className={styles['investments-container']}>
            <div className={styles['investments-header']}>
              <h1>Инвестиции</h1>
              <p>Истражете ги можностите за инвестирање.</p>
            </div>
          
              {loading ? (
                <div className="text-center">
                  <p>Се вчитуваат инвестиции...</p>
                </div>
              ) : investments.length === 0 ? (
                <div className="text-center">
                  <p>Нема достапни инвестиции.</p>
                </div>
              ) : (
                <>
                  <div className={styles['investments-grid']}>
                    {investments.map((investment) => (
                      <div key={investment._id} className={styles['investment-card']}>
                        <div className={styles['investment-content']}>
                          <h2 className={styles['investment-title']}>{investment.title}</h2>
                          <p className={styles['investment-summary']}>{investment.summary || investment.description?.substring(0, 150) + '...'}</p>
                          <div className={styles['investment-meta']}>
                            <span className={styles['investment-amount']}>{investment.amount}€</span>
                            <span className={styles['investment-sector']}>{investment.sector}</span>
                            <span className={styles['investment-risk']}>{investment.riskLevel}</span>
                          </div>
                          <a href={`/terminal/investments/${investment._id}`} className={styles['investment-link']}>
                            Дознај повеќе
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {totalPages > 1 && (
                    <div className={styles.pagination}>
                      {currentPage > 1 && (
                        <button 
                          className={styles['page-button']} 
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                          Претходна
                        </button>
                      )}
                      
                      {[...Array(totalPages).keys()].map((page) => (
                        <button
                          key={page + 1}
                          className={`${styles['page-button']} ${currentPage === page + 1 ? styles.active : ''}`}
                          onClick={() => handlePageChange(page + 1)}
                        >
                          {page + 1}
                        </button>
                      ))}
                      
                      {currentPage < totalPages && (
                        <button 
                          className={styles['page-button']} 
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                          Следна
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  };

export default Investments;
