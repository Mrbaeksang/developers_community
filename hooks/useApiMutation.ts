'use client'

import { useState, useCallback } from 'react'
import { toast as sonnerToast } from 'sonner'

interface UseApiMutationOptions<TData = any, TError = any, TVariables = any> {
  url: string | ((variables: TVariables) => string)
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: HeadersInit
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: TError | Error, variables: TVariables) => void
  onSettled?: (
    data?: TData,
    error?: TError | Error,
    variables?: TVariables
  ) => void
  successMessage?: string
  errorMessage?: string
  transformData?: (data: any) => TData
  transformError?: (error: any) => TError
}

export function useApiMutation<TData = any, TError = any, TVariables = any>(
  options: UseApiMutationOptions<TData, TError, TVariables>
) {
  const {
    url,
    method = 'POST',
    headers = { 'Content-Type': 'application/json' },
    onSuccess,
    onError,
    onSettled,
    successMessage,
    errorMessage,
    transformData,
    transformError,
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<TError | Error | null>(null)
  const [data, setData] = useState<TData | null>(null)

  const mutate = useCallback(
    async (variables: TVariables) => {
      setIsLoading(true)
      setError(null)

      try {
        const endpoint = typeof url === 'function' ? url(variables) : url
        const body = method !== 'DELETE' ? JSON.stringify(variables) : undefined

        const response = await fetch(endpoint, {
          method,
          headers,
          body,
        })

        // Parse response
        let responseData
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          responseData = await response.json()
        } else {
          responseData = await response.text()
        }

        if (!response.ok) {
          const error = new Error(
            responseData.message ||
              responseData.error ||
              errorMessage ||
              '요청이 실패했습니다.'
          )
          throw transformError ? transformError(responseData) : error
        }

        const finalData = transformData
          ? transformData(responseData)
          : responseData
        setData(finalData)

        if (successMessage) {
          sonnerToast.success(successMessage)
        }

        if (onSuccess) {
          onSuccess(finalData, variables)
        }

        return finalData
      } catch (error) {
        const finalError = error as TError | Error
        setError(finalError)

        const errorMsg =
          finalError instanceof Error
            ? finalError.message
            : errorMessage || '요청이 실패했습니다.'

        sonnerToast.error(errorMsg)

        if (onError) {
          onError(finalError, variables)
        }

        throw finalError
      } finally {
        setIsLoading(false)

        if (onSettled) {
          onSettled(data || undefined, error || undefined, variables)
        }
      }
    },
    [
      url,
      method,
      headers,
      onSuccess,
      onError,
      onSettled,
      successMessage,
      errorMessage,
      transformData,
      transformError,
      data,
      error,
    ]
  )

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      return mutate(variables)
    },
    [mutate]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
    data,
    reset,
    isError: error !== null,
    isSuccess: data !== null && error === null,
  }
}
