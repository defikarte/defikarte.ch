import { useCallback, useEffect, useRef, useState } from 'react';

export const usePersistenceState = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
  const isJSONParsable = useCallback((value: T): boolean => {
    return value && typeof value === 'object' && Array.isArray(value);
  }, []);

  const getValue = (): T => {
    const savedValue = localStorage.getItem(key);
    if (savedValue !== null) {
      return isJSONParsable(initialValue) ? (JSON.parse(savedValue) as T) : (savedValue as T);
    }

    return initialValue;
  };

  const [state, setState] = useState<T>(getValue);
  const prevStateRef = useRef<T>(state);

  useEffect(() => {
    if (prevStateRef.current === state) {
      return;
    }
    const value = isJSONParsable(state) ? JSON.stringify(state) : String(state);
    localStorage.setItem(key, value);
  }, [isJSONParsable, key, state]);

  return [state, setState];
};
