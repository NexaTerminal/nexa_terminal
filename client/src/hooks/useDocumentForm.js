import { useState, useCallback, useMemo } from 'react';
import { createValidator, createStepValidator } from '../utils/documentValidation';
import documentService from '../services/documentService';

/**
 * Custom hook for document form management
 * Handles all common form logic: state, validation, navigation, submission
 */
export const useDocumentForm = (config) => {
  const {
    initialFormData = {},
    steps = [],
    validationRules = [],
    apiEndpoint,
    documentType,
    fileName
  } = config;

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ acceptTerms: false, ...initialFormData });
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [missingFields, setMissingFields] = useState([]);

  // Create validators
  const validator = useMemo(() => createValidator(validationRules), [validationRules]);
  const stepValidator = useMemo(() => createStepValidator(steps), [steps]);

  /**
   * Handle form field changes
   */
  const handleInputChange = useCallback((name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  }, [errors]);

  /**
   * Navigate to next step
   */
  const nextStep = useCallback(() => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps.length]);

  /**
   * Navigate to previous step
   */
  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  /**
   * Go to specific step
   */
  const goToStep = useCallback((stepId) => {
    if (stepId >= 1 && stepId <= steps.length) {
      setCurrentStep(stepId);
    }
  }, [steps.length]);

  /**
   * Check if a step is completed
   */
  const isStepCompleted = useCallback((stepId) => {
    return stepValidator(stepId, formData);
  }, [stepValidator, formData]);

  /**
   * Check if current step is valid
   */
  const isCurrentStepValid = useCallback(() => {
    return isStepCompleted(currentStep);
  }, [isStepCompleted, currentStep]);

  /**
   * Validate entire form
   */
  const validateForm = useCallback(() => {
    const result = validator(formData);
    setErrors(result.errors);
    return result;
  }, [validator, formData]);

  /**
   * Generate document using service
   */
  const generateDocument = useCallback(async () => {
    if (!apiEndpoint) {
      console.error('API endpoint not configured');
      return;
    }

    const generatedFileName = fileName || documentService.generateFileName(documentType, formData);

    await documentService.generateDocument(apiEndpoint, formData, {
      fileName: generatedFileName,
      onStart: () => setIsGenerating(true),
      onSuccess: () => setIsGenerating(false),
      onError: (error) => {
        setIsGenerating(false);
        console.error('Document generation failed:', error);
      }
    });
  }, [apiEndpoint, documentType, fileName, formData]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    // Check terms acceptance
    if (!formData.acceptTerms) {
      alert('Мора да ги прифатите општите услови за да продолжите.');
      return;
    }

    // Skip validation - generate document directly
    await generateDocument();
  }, [formData.acceptTerms, generateDocument]);

  /**
   * Force document generation (skip missing fields)
   */
  const forceGeneration = useCallback(async () => {
    setShowMissingFieldsModal(false);
    await generateDocument();
  }, [generateDocument]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setFormData({ acceptTerms: false, ...initialFormData });
    setErrors({});
    setIsGenerating(false);
    setShowMissingFieldsModal(false);
    setMissingFields([]);
  }, [initialFormData]);

  /**
   * Get current step data
   */
  const currentStepData = useMemo(() => {
    return steps.find(step => step.id === currentStep);
  }, [steps, currentStep]);

  /**
   * Check if we're on the last step
   */
  const isLastStep = useMemo(() => {
    return currentStep === steps.length;
  }, [currentStep, steps.length]);

  /**
   * Check if we're on the first step
   */
  const isFirstStep = useMemo(() => {
    return currentStep === 1;
  }, [currentStep]);

  /**
   * Get progress percentage
   */
  const progressPercentage = useMemo(() => {
    return Math.round((currentStep / steps.length) * 100);
  }, [currentStep, steps.length]);

  return {
    // State
    currentStep,
    formData,
    errors,
    isGenerating,
    showMissingFieldsModal,
    missingFields,
    currentStepData,

    // Computed values
    isLastStep,
    isFirstStep,
    progressPercentage,
    
    // Actions
    handleInputChange,
    nextStep,
    prevStep,
    goToStep,
    handleSubmit,
    forceGeneration,
    resetForm,
    validateForm,
    
    // Validation helpers
    isStepCompleted,
    isCurrentStepValid,
    
    // Modal controls
    setShowMissingFieldsModal,
    
    // Steps configuration
    steps
  };
};