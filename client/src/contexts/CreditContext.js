import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

/**
 * CreditContext
 *
 * Provides credit balance and transaction management throughout the app.
 * Automatically fetches credits when user logs in and provides methods to refresh.
 */

export const CreditContext = createContext();

export const useCredit = () => {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCredit must be used within a CreditProvider');
  }
  return context;
};

export const CreditProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch user's credit balance from API
   */
  const fetchCredits = useCallback(async () => {
    if (!currentUser) {
      setCredits(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/credits/balance');

      if (response.success) {
        setCredits(response.credits);
      }
    } catch (err) {
      console.error('❌ Failed to fetch credits:', err);
      setError(err.message || 'Failed to load credits');

      // Initialize with default values on error
      setCredits({
        balance: 0,
        weeklyAllocation: 14,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        nextResetDate: null
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  /**
   * Refresh credit balance (call after credit-consuming operations)
   */
  const refreshCredits = useCallback(async () => {
    await fetchCredits();
  }, [fetchCredits]);

  /**
   * Deduct credits locally (optimistic update)
   * Call this before making credit-consuming requests for instant UI feedback
   */
  const deductCreditsOptimistic = useCallback((amount) => {
    setCredits(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        balance: Math.max(0, prev.balance - amount)
      };
    });
  }, []);

  /**
   * Add credits locally (optimistic update)
   */
  const addCreditsOptimistic = useCallback((amount) => {
    setCredits(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        balance: prev.balance + amount
      };
    });
  }, []);

  /**
   * Check if user has sufficient credits
   */
  const hasCredits = useCallback((required = 1) => {
    if (!credits) return false;
    return credits.balance >= required;
  }, [credits]);

  /**
   * Get credit info (for displaying in UI)
   */
  const getCreditInfo = useCallback(() => {
    if (!credits) return null;

    const percentage = (credits.balance / credits.weeklyAllocation) * 100;
    const isLow = credits.balance <= 3;
    const isDepleted = credits.balance === 0;

    return {
      ...credits,
      percentage,
      isLow,
      isDepleted,
      daysUntilReset: credits.nextResetDate
        ? Math.ceil((new Date(credits.nextResetDate) - new Date()) / (1000 * 60 * 60 * 24))
        : null
    };
  }, [credits]);

  // Fetch credits on mount and when user changes
  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Refresh credits every 5 minutes while user is active
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      fetchCredits();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [currentUser, fetchCredits]);

  const value = {
    credits,
    loading,
    error,
    refreshCredits,
    deductCreditsOptimistic,
    addCreditsOptimistic,
    hasCredits,
    getCreditInfo
  };

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
};

export default CreditContext;
