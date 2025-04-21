import { useState, useEffect, useRef, useCallback } from 'react';

interface QueryOptions<T> {
  queryFn: () => Promise<T>;
  initialData?: T;
  interval?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  onMaxErrorsReached?: () => void; // 新增回调
  compareDataFn?: (prevData: T, newData: T) => boolean;
  maxErrorCount?: number;
  redirectPath?: string;
}

interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => Promise<void>;
  errorCount: number;
}

// 在组件外部定义
const defaultCompareDataFn = (prevData: any, newData: any) =>
  JSON.stringify(prevData) === JSON.stringify(newData);

export function useQuery<T>({
  queryFn,
  initialData,
  interval = 0,
  enabled = true,
  onSuccess,
  onError,
  compareDataFn = defaultCompareDataFn,
  maxErrorCount = 3,
  onMaxErrorsReached,
}: QueryOptions<T>): QueryResult<T> {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const prevDataRef = useRef<T | undefined>(initialData);
  const fetchingRef = useRef<boolean>(false);
  const errorCountRef = useRef<number>(0);
  const [errorCount, setErrorCount] = useState(0);

  const fetch = useCallback(async (isInitialFetch: boolean = false) => {
    if (fetchingRef.current || !enabled) return;

    try {
      fetchingRef.current = true;
      if (isInitialFetch) {
        setIsLoading(true);
      }

      const result = await queryFn();

      const hasChanged = !prevDataRef.current || !compareDataFn(prevDataRef.current, result);

      if (hasChanged) {
        prevDataRef.current = result;
        setData(result);
        onSuccess?.(result);
      }

      errorCountRef.current = 0;
      setErrorCount(0);

      setIsError(false);
      setError(null);
    } catch (err) {
      errorCountRef.current += 1;
      setErrorCount(errorCountRef.current);

      setIsError(true);
      setError(err);
      onError?.(err);

      if (errorCountRef.current >= maxErrorCount) {
        onMaxErrorsReached && onMaxErrorsReached();
      }
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [queryFn, enabled, compareDataFn, onSuccess, onError, maxErrorCount]);

  const refetch = useCallback(async () => {
    await fetch(true);
  }, [fetch]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (enabled) {
      fetch(true);

      if (interval > 0) {
        timer = setInterval(() => {
          fetch(false);
        }, interval);
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [enabled, interval, fetch]);

  return { data, isLoading, isError, error, refetch, errorCount };
}