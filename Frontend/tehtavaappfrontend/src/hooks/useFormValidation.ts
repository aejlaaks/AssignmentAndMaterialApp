import { useState, useCallback } from 'react';

/**
 * Generic type for form values - a record with string keys and any values
 */
export type FormValues = Record<string, any>;

/**
 * Type for errors object - keys match form fields with string error messages
 */
export type FormErrors<T extends FormValues> = Partial<Record<keyof T, string>>;

/**
 * Type for validation rules - functions that return either an error message or null/undefined
 */
export type ValidationRule<T extends FormValues> = (value: any, values: T) => string | null | undefined;

/**
 * Type for validation schema - maps field names to arrays of validation rules
 */
export type ValidationSchema<T extends FormValues> = {
  [K in keyof T]?: ValidationRule<T>[];
};

/**
 * Common validation rules for reuse
 */
export const validationRules = {
  required: (message = 'This field is required') => 
    (value: any) => !value || (typeof value === 'string' && !value.trim()) ? message : null,

  minLength: (min: number, message = `Minimum length is ${min} characters`) => 
    (value: string) => value && value.length < min ? message : null,

  maxLength: (max: number, message = `Maximum length is ${max} characters`) => 
    (value: string) => value && value.length > max ? message : null,

  min: (min: number, message = `Minimum value is ${min}`) => 
    (value: number) => value !== undefined && value < min ? message : null,

  max: (max: number, message = `Maximum value is ${max}`) => 
    (value: number) => value !== undefined && value > max ? message : null,

  email: (message = 'Please enter a valid email address') => 
    (value: string) => value && !/\S+@\S+\.\S+/.test(value) ? message : null,

  matches: (pattern: RegExp, message = 'Invalid format') => 
    (value: string) => value && !pattern.test(value) ? message : null,

  equals: (field: string, message = 'Fields do not match') => 
    (value: any, values: FormValues) => value !== values[field] ? message : null
};

/**
 * A custom hook for validating form values
 * 
 * @param schema The validation schema mapping fields to validation rules
 * @param initialValues Initial form values
 * @returns An object with values, errors, and handler functions
 */
export function useFormValidation<T extends FormValues>(
  schema: ValidationSchema<T>,
  initialValues: T
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  /**
   * Validate a single field
   */
  const validateField = useCallback((name: keyof T, value: any): string | null => {
    const fieldRules = schema[name];
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      const errorMessage = rule(value, values);
      if (errorMessage) {
        return errorMessage;
      }
    }
    
    return null;
  }, [schema, values]);

  /**
   * Validate all form fields
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors<T> = {};
    let isValid = true;

    // Validate each field in the schema
    for (const field in schema) {
      const name = field as keyof T;
      const errorMessage = validateField(name, values[name]);
      
      if (errorMessage) {
        newErrors[name] = errorMessage;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [schema, validateField, values]);

  /**
   * Handle input change and validate field
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const key = name as keyof T;
    
    // Handle different input types
    let newValue: any = value;
    if (type === 'number') {
      newValue = value === '' ? '' : Number(value);
    } else if (type === 'checkbox' && 'checked' in e.target) {
      newValue = (e.target as HTMLInputElement).checked;
    }
    
    setValues(prev => ({ ...prev, [key]: newValue }));
    
    // Validate field if it's been touched
    if (touched[key]) {
      const errorMessage = validateField(key, newValue);
      setErrors(prev => ({ 
        ...prev, 
        [key]: errorMessage || undefined 
      }));
    }
  }, [touched, validateField]);

  /**
   * Set a field value programmatically
   */
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Validate field if it's been touched
    if (touched[name]) {
      const errorMessage = validateField(name, value);
      setErrors(prev => ({ 
        ...prev, 
        [name]: errorMessage || undefined 
      }));
    }
  }, [touched, validateField]);

  /**
   * Mark a field as touched (user interacted with it)
   */
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    const key = name as keyof T;
    
    setTouched(prev => ({ ...prev, [key]: true }));
    
    // Validate on blur
    const errorMessage = validateField(key, values[key]);
    setErrors(prev => ({ 
      ...prev, 
      [key]: errorMessage || undefined 
    }));
  }, [validateField, values]);

  /**
   * Reset form to initial values or new values
   */
  const resetForm = useCallback((newValues?: T) => {
    setValues(newValues || initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  /**
   * Set multiple values at once
   */
  const setMultipleValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    setMultipleValues,
    validateForm,
    validateField,
    resetForm,
    setValues,
    setErrors,
    setTouched
  };
} 