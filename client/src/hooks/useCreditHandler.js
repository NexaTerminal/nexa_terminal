import { useState, useCallback } from 'react';
import { useCredit } from '../contexts/CreditContext';

/**
 * Custom hook to handle credit-consuming operations
 *
 * Features:
 * - Automatically refreshes credits after successful operations
 * - Detects insufficient credit errors (402 status)
 * - Provides modal state for InsufficientCreditsModal
 * - Handles credit error messages
 *
 * Usage:
 * const { handleCreditOperation, showInsufficientModal, closeModal } = useCreditHandler();
 *
 * await handleCreditOperation(
 *   async () => api.post('/api/endpoint', data),
 *   'генерирање на документ'
 * );
 */
const useCreditHandler = () => {
  const { refreshCredits } = useCredit();
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    requiredCredits: 1,
    actionName: 'ова дејство'
  });

  /**
   * Wraps an async operation with credit handling
   *
   * @param {Function} operation - Async function that performs the credit-consuming operation
   * @param {string} actionName - Macedonian name of the action (e.g., 'генерирање на документ')
   * @param {number} requiredCredits - Number of credits required (default 1)
   * @returns {Promise} - Result from the operation
   * @throws {Error} - Throws if operation fails (except for 402 which is handled)
   */
  const handleCreditOperation = useCallback(async (
    operation,
    actionName = 'ова дејство',
    requiredCredits = 1
  ) => {
    try {
      const result = await operation();

      // If successful, refresh credits to get updated balance
      await refreshCredits();

      return result;
    } catch (error) {
      // Check if it's an insufficient credits error
      if (error.response?.status === 402 ||
          error.response?.data?.code === 'INSUFFICIENT_CREDITS' ||
          error.response?.data?.error === 'Insufficient credits') {

        // Show insufficient credits modal
        setModalConfig({
          requiredCredits,
          actionName
        });
        setShowInsufficientModal(true);

        // Don't throw the error - it's been handled
        return null;
      }

      // For other errors, rethrow
      throw error;
    }
  }, [refreshCredits]);

  /**
   * Checks if an error is a credit-related error
   *
   * @param {Error} error - Error object from API call
   * @returns {boolean} - True if it's a credit error
   */
  const isCreditError = useCallback((error) => {
    return error.response?.status === 402 ||
           error.response?.data?.code === 'INSUFFICIENT_CREDITS' ||
           error.response?.data?.error === 'Insufficient credits' ||
           error.response?.data?.message?.includes('кредити') ||
           error.message?.includes('кредити');
  }, []);

  /**
   * Close the insufficient credits modal
   */
  const closeModal = useCallback(() => {
    setShowInsufficientModal(false);
  }, []);

  return {
    handleCreditOperation,
    isCreditError,
    showInsufficientModal,
    modalConfig,
    closeModal
  };
};

export default useCreditHandler;
