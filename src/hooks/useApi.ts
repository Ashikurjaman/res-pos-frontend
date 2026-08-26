// src/hooks/useApi.ts
import { useState, useCallback } from "react";

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useApi(options: UseApiOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const execute = useCallback(
    async <T = any>(
      apiCall: () => Promise<T>,
      successMessage?: string
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await apiCall();
        setData(result);
        
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        
        if (successMessage) {
          console.log(`✅ ${successMessage}`);
        }
        
        return result;
      } catch (error: any) {
        console.error("API Error:", error);
        const errorMessage = error.message || "An error occurred";
        setError(errorMessage);
        
        if (options.onError) {
          options.onError(error);
        }
        
        return null;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return {
    data,
    loading,
    error,
    execute,
    setData,
    setError,
    setLoading,
  };
}