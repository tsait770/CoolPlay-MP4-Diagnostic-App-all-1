import { useCallback, useMemo, useRef, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
// eslint-disable-next-line @rork/linters/rsp-no-asyncstorage-direct
import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe JSON parsing utility
export const safeJsonParse = (data: string, fallback: any = null) => {
  try {
    if (!data || typeof data !== 'string') {
      console.log('[Storage] Invalid data type:', typeof data);
      return fallback;
    }
    
    const cleaned = data.trim();
    
    if (cleaned.length === 0) {
      console.log('[Storage] Empty data string');
      return fallback;
    }
    
    if (cleaned.includes('[object Object]') || 
        cleaned.includes('object Object') ||
        cleaned === 'undefined' || 
        cleaned === 'NaN' ||
        cleaned === 'null' ||
        cleaned.startsWith('object ') ||
        cleaned.startsWith('Object ')) {
      console.warn('[Storage] Detected corrupted data pattern:', cleaned.substring(0, 50));
      return fallback;
    }
    
    if (!cleaned.startsWith('{') && !cleaned.startsWith('[') && !cleaned.startsWith('"') && cleaned !== 'true' && cleaned !== 'false' && isNaN(Number(cleaned))) {
      console.warn('[Storage] Data does not start with valid JSON character:', cleaned.substring(0, 50));
      return fallback;
    }
    
    try {
      const parsed = JSON.parse(cleaned);
      
      if (parsed === null || parsed === undefined) {
        console.warn('[Storage] Parsed to null/undefined');
        return fallback;
      }
      
      return parsed;
    } catch (parseError: any) {
      console.error('[Storage] JSON parse error:', parseError?.message || parseError, 'Data preview:', cleaned.substring(0, 100));
      return fallback;
    }
  } catch (error: any) {
    console.error('[Storage] Unexpected error in safeJsonParse:', error?.message || error);
    return fallback;
  }
};

export const [StorageProvider, useStorage] = createContextHook(() => {
  console.log('[StorageProvider] Initializing...');
  const cache = useRef<Map<string, { data: string | null; timestamp: number }>>(new Map());
  const CACHE_TTL = 60000;
  const cleanupRun = useRef(false);
  
  useEffect(() => {
    if (!cleanupRun.current) {
      cleanupRun.current = true;
      
      setTimeout(() => {
        (async () => {
          try {
            console.log('[StorageProvider] Running deferred cleanup...');
            const allKeys = await AsyncStorage.getAllKeys();
            const corruptedKeys: string[] = [];
            
            const maxCheck = Math.min(allKeys.length, 50);
            for (let i = 0; i < maxCheck; i++) {
              const key = allKeys[i];
              try {
                const data = await AsyncStorage.getItem(key);
                if (data && typeof data === 'string' && data.length > 0) {
                  const cleaned = data.trim();
                  
                  if (cleaned.includes('[object Object]') || 
                      cleaned.includes('object Object') ||
                      cleaned === 'undefined' || 
                      cleaned === 'NaN' ||
                      cleaned === 'null' ||
                      cleaned.startsWith('object ') ||
                      cleaned.startsWith('Object ')) {
                    corruptedKeys.push(key);
                  } else if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
                    try {
                      JSON.parse(cleaned);
                    } catch {
                      corruptedKeys.push(key);
                    }
                  }
                }
              } catch (error: any) {
                corruptedKeys.push(key);
              }
            }
            
            if (corruptedKeys.length > 0) {
              console.log(`[StorageProvider] Removing ${corruptedKeys.length} corrupted keys`);
              await AsyncStorage.multiRemove(corruptedKeys);
            }
          } catch (error: any) {
            console.error('[StorageProvider] Deferred cleanup failed:', error?.message || error);
          }
        })();
      }, 2000);
    }
  }, []);

  const getItem = useCallback(async (key: string): Promise<string | null> => {
    try {
      if (!key || !key.trim()) {
        console.warn('[Storage] Invalid key provided to getItem');
        return null;
      }
      
      const trimmedKey = key.trim();
      const cached = cache.current.get(trimmedKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
      
      const startTime = Date.now();
      const data = await AsyncStorage.getItem(trimmedKey);
      const duration = Date.now() - startTime;
      
      if (duration > 100) {
        console.log(`[Storage] getItem for key ${key}: ${duration}ms`);
      }
      
      cache.current.set(trimmedKey, { data, timestamp: Date.now() });
      
      if (data && typeof data === 'string' && data.length > 0) {
        const cleaned = data.trim();
        if (cleaned.includes('[object Object]') || 
            cleaned === 'undefined' || 
            cleaned === 'NaN' ||
            cleaned === 'null' ||
            cleaned.startsWith('object ') ||
            cleaned.startsWith('Object ')) {
          console.warn(`[Storage] Auto-clearing corrupted data for key: ${key}`);
          try {
            await AsyncStorage.removeItem(key.trim());
          } catch (removeError) {
            console.error(`[Storage] Failed to remove corrupted key ${key}:`, removeError);
          }
          return null;
        }
      }
      
      return data;
    } catch (error: any) {
      console.error(`[Storage] Failed to get item ${key}:`, error?.message || error);
      return null;
    }
  }, []);
  
  const invalidateCache = useCallback((key: string) => {
    cache.current.delete(key.trim());
  }, []);

  const setItem = useCallback(async (key: string, value: string): Promise<void> => {
    try {
      if (!key || !key.trim()) {
        console.error('[Storage] Invalid storage key');
        return;
      }
      if (value === null || value === undefined) {
        console.error('[Storage] Invalid storage value (null/undefined)');
        return;
      }
      
      if (typeof value === 'string') {
        if (value.includes('[object Object]') || 
            value === 'undefined' || 
            value === 'NaN' ||
            value === 'null' ||
            value.startsWith('object ') ||
            value.startsWith('Object ')) {
          console.error('[Storage] Attempting to save corrupted data, aborting:', value.substring(0, 50));
          return;
        }
        
        if (value.startsWith('{') || value.startsWith('[')) {
          try {
            JSON.parse(value);
          } catch {
            console.error('[Storage] Invalid JSON data, aborting save:', value.substring(0, 50));
            return;
          }
        }
      }
      
      const trimmedKey = key.trim();
      const startTime = Date.now();
      await AsyncStorage.setItem(trimmedKey, value);
      const duration = Date.now() - startTime;
      
      cache.current.set(trimmedKey, { data: value, timestamp: Date.now() });
      
      if (duration > 300) {
        console.warn(`[Storage] Slow setItem for key ${key}: ${duration}ms, size: ${value.length} bytes`);
      } else if (duration > 150) {
        console.log(`[Storage] setItem for key ${key}: ${duration}ms`);
      }
    } catch (error: any) {
      console.error(`[Storage] Failed to set item ${key}:`, error?.message || error);
    }
  }, []);

  const removeItem = useCallback(async (key: string): Promise<void> => {
    try {
      if (!key || !key.trim()) {
        console.error('Invalid storage key');
        return;
      }
      const trimmedKey = key.trim();
      cache.current.delete(trimmedKey);
      await AsyncStorage.removeItem(trimmedKey);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
    }
  }, []);

  const clear = useCallback(async (): Promise<void> => {
    try {
      console.log('[Storage] Starting storage clear...');
      cache.current.clear();
      
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        console.log(`[Storage] Found ${allKeys.length} keys to clear`);
        
        if (allKeys.length > 0) {
          await AsyncStorage.multiRemove(allKeys);
          console.log('[Storage] Successfully cleared all keys');
        } else {
          console.log('[Storage] No keys to clear');
        }
      } catch (clearError: any) {
        console.warn('[Storage] AsyncStorage operation failed:', clearError?.message);
        
        const errorMessage = clearError?.message || '';
        const errorCode = clearError?.code;
        const underlyingError = clearError?.userInfo?.NSUnderlyingError;
        const underlyingCode = underlyingError?.code;
        
        if (errorMessage.includes('No such file or directory') || 
            errorMessage.includes('無法移除') ||
            errorCode === 4 || 
            errorCode === 'ENOENT' ||
            underlyingCode === 2) {
          console.log('[Storage] Directory already cleared or does not exist, treating as success');
          return;
        }
        
        throw clearError;
      }
      
      console.log('[Storage] Successfully cleared all storage');
    } catch (error: any) {
      console.error('[Storage] Failed to clear storage:', error);
      
      const errorMessage = error?.message || '';
      const errorCode = error?.code;
      const underlyingError = error?.userInfo?.NSUnderlyingError;
      const underlyingCode = underlyingError?.code;
      
      if (errorMessage.includes('No such file or directory') || 
          errorMessage.includes('無法移除') ||
          errorCode === 4 || 
          errorCode === 'ENOENT' ||
          underlyingCode === 2) {
        console.log('[Storage] Treating as success despite error - storage is already empty');
        return;
      }
      
      throw error;
    }
  }, []);

  const clearCorruptedData = useCallback(async (): Promise<number> => {
    try {
      console.log('[Storage] Starting corrupted data scan...');
      const allKeys = await AsyncStorage.getAllKeys();
      const corruptedKeys: string[] = [];
      
      for (const key of allKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data && typeof data === 'string' && data.length > 0) {
            const cleaned = data.trim();
            
            if (cleaned.includes('[object Object]') || 
                cleaned.includes('object Object') ||
                cleaned === 'undefined' || 
                cleaned === 'NaN' ||
                cleaned === 'null' ||
                cleaned.startsWith('object ') ||
                cleaned.startsWith('Object ')) {
              console.warn(`[Storage] Found corrupted key: ${key}, data preview: ${cleaned.substring(0, 50)}`);
              corruptedKeys.push(key);
            } else if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
              try {
                JSON.parse(cleaned);
              } catch {
                console.warn(`[Storage] Found invalid JSON key: ${key}, data preview: ${cleaned.substring(0, 50)}`);
                corruptedKeys.push(key);
              }
            }
          }
        } catch (error: any) {
          console.error(`[Storage] Error checking key ${key}:`, error?.message || error);
          corruptedKeys.push(key);
        }
      }
      
      if (corruptedKeys.length > 0) {
        console.log(`[Storage] Clearing ${corruptedKeys.length} corrupted keys:`, corruptedKeys);
        try {
          await AsyncStorage.multiRemove(corruptedKeys);
          console.log('[Storage] Successfully removed corrupted keys');
        } catch (removeError: any) {
          console.error('[Storage] Error removing corrupted keys:', removeError?.message || removeError);
          for (const key of corruptedKeys) {
            try {
              await AsyncStorage.removeItem(key);
            } catch (singleError: any) {
              console.error(`[Storage] Failed to remove key ${key}:`, singleError?.message || singleError);
            }
          }
        }
      } else {
        console.log('[Storage] No corrupted data found');
      }
      
      return corruptedKeys.length;
    } catch (error: any) {
      console.error('[Storage] Failed to clear corrupted data:', error?.message || error);
      return 0;
    }
  }, []);

  const runStartupCleanup = useCallback(async (): Promise<void> => {
    try {
      console.log('[Storage] Running startup cleanup...');
      const corruptedCount = await clearCorruptedData();
      if (corruptedCount > 0) {
        console.log(`[Storage] Startup cleanup removed ${corruptedCount} corrupted items`);
      } else {
        console.log('[Storage] Startup cleanup: no issues found');
      }
    } catch (error: any) {
      console.error('[Storage] Startup cleanup failed:', error?.message || error);
    }
  }, [clearCorruptedData]);

  return useMemo(() => ({
    getItem,
    setItem,
    removeItem,
    clear,
    clearCorruptedData,
    runStartupCleanup,
    safeJsonParse,
    invalidateCache,
  }), [getItem, setItem, removeItem, clear, clearCorruptedData, runStartupCleanup, invalidateCache]);
});