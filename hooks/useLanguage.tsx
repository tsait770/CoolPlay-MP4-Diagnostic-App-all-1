import React, { useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type Language = "en" | "zh-TW" | "zh-CN" | "es" | "pt-BR" | "pt" | "de" | "fr" | "ru" | "ar" | "ja" | "ko";

const [LanguageContext, useLanguageContext] = createContextHook(() => {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  const isValidLanguage = useCallback((lang: string): boolean => {
    const validLanguages: Language[] = ["en", "zh-TW", "zh-CN", "es", "pt-BR", "pt", "de", "fr", "ru", "ar", "ja", "ko"];
    return validLanguages.includes(lang as Language);
  }, []);

  const loadLanguage = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        const savedLang = localStorage.getItem("app_language");
        if (savedLang && typeof savedLang === 'string' && savedLang.trim().length > 0) {
          const trimmed = savedLang.trim();
          if (isValidLanguage(trimmed)) {
            setLanguageState(trimmed as Language);
            console.log(`[useLanguage] Loaded language from localStorage: ${trimmed}`);
          } else {
            console.warn(`[useLanguage] Invalid language in localStorage: ${trimmed}`);
            localStorage.removeItem("app_language");
          }
        }
      } else {
        const savedLang = await AsyncStorage.getItem("app_language");
        if (savedLang && typeof savedLang === 'string' && savedLang.trim().length > 0) {
          const trimmed = savedLang.trim();
          if (isValidLanguage(trimmed)) {
            setLanguageState(trimmed as Language);
            console.log(`[useLanguage] Loaded language from AsyncStorage: ${trimmed}`);
          } else {
            console.warn(`[useLanguage] Invalid language in AsyncStorage: ${trimmed}`);
            await AsyncStorage.removeItem("app_language");
          }
        }
      }
    } catch (error) {
      console.error("[useLanguage] Failed to load language:", error);
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem("app_language");
        } else {
          await AsyncStorage.removeItem("app_language");
        }
      } catch (clearError) {
        console.error("[useLanguage] Failed to clear corrupted language data:", clearError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isValidLanguage]);

  useEffect(() => {
    loadLanguage();
  }, [loadLanguage]);

  const setLanguage = useCallback(async (lang: Language) => {
    if (!lang?.trim() || lang.length > 10) return;
    const sanitizedLang = lang.trim() as Language;
    
    if (!isValidLanguage(sanitizedLang)) return;
    
    try {
      // Update state immediately for responsive UI
      setLanguageState(sanitizedLang);
      
      // Persist to storage asynchronously (non-blocking)
      Promise.resolve().then(async () => {
        try {
          if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem("app_language", sanitizedLang);
          } else {
            await AsyncStorage.setItem("app_language", sanitizedLang);
          }
          console.log(`Language persisted: ${sanitizedLang}`);
        } catch (error) {
          console.error("Failed to persist language:", error);
        }
      });
      
      console.log(`Language changed to: ${sanitizedLang}`);
    } catch (error) {
      console.error("Failed to change language:", error);
      setLanguageState(language);
    }
  }, [isValidLanguage, language]);

  return useMemo(() => ({ language, setLanguage, isLoading }), [language, setLanguage, isLoading]);
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  return <LanguageContext>{children}</LanguageContext>;
}

export function useLanguage() {
  try {
    const context = useLanguageContext();
    if (!context || typeof context !== 'object') {
      console.warn('[useLanguage] Context not available, returning defaults');
      return { language: "en" as Language, setLanguage: async () => {}, isLoading: false };
    }
    if (!context.language) {
      console.warn('[useLanguage] Language property missing, returning defaults');
      return { language: "en" as Language, setLanguage: context.setLanguage || (async () => {}), isLoading: context.isLoading || false };
    }
    return context;
  } catch (error) {
    console.error('[useLanguage] Error accessing context:', error);
    return { language: "en" as Language, setLanguage: async () => {}, isLoading: false };
  }
}