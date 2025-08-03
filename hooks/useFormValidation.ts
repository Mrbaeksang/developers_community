'use client'

import { useState, useCallback, useEffect } from 'react'

type ValidationRule<T> = {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: T) => string | null
}

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>
}

type ValidationErrors<T> = {
  [K in keyof T]?: string
}

interface UseFormValidationOptions<T> {
  rules: ValidationRules<T>
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  options: UseFormValidationOptions<T>
) {
  const { rules, validateOnChange = true, validateOnBlur = true } = options

  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<ValidationErrors<T>>({})
  const [touched, setTouched] = useState<Set<keyof T>>(new Set())
  const [isValidating, setIsValidating] = useState(false)

  const validateField = useCallback(
    (field: keyof T, value: any): string => {
      const fieldRules = rules[field]
      if (!fieldRules) return ''

      // Required validation
      if (fieldRules.required) {
        if (!value || (typeof value === 'string' && !value.trim())) {
          return '필수 입력 항목입니다.'
        }
      }

      // Min length/value validation
      if (fieldRules.min !== undefined) {
        if (typeof value === 'string' && value.length < fieldRules.min) {
          return `최소 ${fieldRules.min}자 이상이어야 합니다.`
        }
        if (typeof value === 'number' && value < fieldRules.min) {
          return `최소값은 ${fieldRules.min}입니다.`
        }
      }

      // Max length/value validation
      if (fieldRules.max !== undefined) {
        if (typeof value === 'string' && value.length > fieldRules.max) {
          return `최대 ${fieldRules.max}자 이하여야 합니다.`
        }
        if (typeof value === 'number' && value > fieldRules.max) {
          return `최대값은 ${fieldRules.max}입니다.`
        }
      }

      // Pattern validation
      if (fieldRules.pattern && typeof value === 'string') {
        if (!fieldRules.pattern.test(value)) {
          return '올바른 형식이 아닙니다.'
        }
      }

      // Custom validation
      if (fieldRules.custom) {
        const customError = fieldRules.custom(value)
        if (customError) return customError
      }

      return ''
    },
    [rules]
  )

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors<T> = {}
    let isValid = true

    Object.keys(values).forEach((field) => {
      const error = validateField(field as keyof T, values[field as keyof T])
      if (error) {
        newErrors[field as keyof T] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [values, validateField])

  const setValue = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setValues((prev) => ({ ...prev, [field]: value }))

      if (validateOnChange && touched.has(field)) {
        const error = validateField(field, value)
        setErrors((prev) => ({ ...prev, [field]: error || undefined }))
      }
    },
    [validateField, validateOnChange, touched]
  )

  const setFieldTouched = useCallback(
    (field: keyof T) => {
      setTouched((prev) => new Set(prev).add(field))

      if (validateOnBlur) {
        const error = validateField(field, values[field])
        setErrors((prev) => ({ ...prev, [field]: error || undefined }))
      }
    },
    [validateField, validateOnBlur, values]
  )

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched(new Set())
  }, [initialValues])

  const getFieldProps = useCallback(
    (field: keyof T) => ({
      value: values[field],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => setValue(field, e.target.value as T[keyof T]),
      onBlur: () => setFieldTouched(field),
      error: errors[field],
    }),
    [values, errors, setValue, setFieldTouched]
  )

  return {
    values,
    errors,
    touched,
    isValidating,
    setValue,
    setFieldTouched,
    validateField,
    validateForm,
    resetForm,
    getFieldProps,
    isValid: Object.keys(errors).length === 0,
  }
}
