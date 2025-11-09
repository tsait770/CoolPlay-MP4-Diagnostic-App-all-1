import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useCallback, Component, ReactNode } from "react";
import { StyleSheet, Platform, Alert, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
// eslint-disable-next-line @rork/linters/rsp-no-asyncstorage-direct
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageProvider } from "@/hooks/useLanguage";
import { BookmarkProvider } from "@/providers/BookmarkProvider";
import { CategoryProvider } from "@/providers/CategoryProvider";
import { ReferralProvider, useReferral } from "@/providers/ReferralProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { StripeProvider } from "@/providers/StripeProvider";
import { VoiceControlProvider, useVoiceControl } from "@/providers/VoiceControlProvider";
import { SiriIntegrationProvider, useSiriIntegration } from "@/providers/SiriIntegrationProvider";
import { StorageProvider, useStorage } from "@/providers/StorageProvider";
import ReferralCodeModal from "@/components/ReferralCodeModal";
import Colors from "@/constants/colors";
import VoiceOnboardingModal from "@/components/VoiceOnboardingModal";
import { SoundProvider } from "@/providers/SoundProvider";
import { MembershipProvider } from "@/providers/MembershipProvider";
import { RatingProvider } from "@/providers/RatingProvider";
import { PayPalProvider } from "@/providers/PayPalProvider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error; errorInfo?: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[ErrorBoundary] Error caught:', error);
    console.error('[ErrorBoundary] Error name:', error.name);
    console.error('[ErrorBoundary] Error message:', error.message);
    console.error('[ErrorBoundary] Error stack:', error.stack?.substring(0, 500));
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack?.substring(0, 500));
    this.setState({ errorInfo: errorInfo?.componentStack || 'No stack info' });
    
    // Log to a global error handler if available
    if (typeof (global as any).__handleAppError === 'function') {
      (global as any).__handleAppError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ App Error</Text>
          <Text style={styles.errorSubtext}>
            {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown error occurred'}
          </Text>
          <Text style={[styles.errorSubtext, { fontSize: 10, marginTop: 10, opacity: 0.7 }]}>
            Stack: {this.state.errorInfo?.substring(0, 150)}...
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <TouchableOpacity 
              onPress={() => {
                console.log('[ErrorBoundary] User clicked Retry');
                this.setState({ hasError: false, error: undefined, errorInfo: undefined });
              }}
              style={{
                padding: 15,
                backgroundColor: Colors.primary.accent,
                borderRadius: 8,
                marginRight: 10,
                flex: 1,
              }}
            >
              <Text style={{ color: Colors.primary.text, textAlign: 'center' as const, fontWeight: '600' as const }}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                console.log('[ErrorBoundary] User wants to reload');
                if (Platform.OS === 'web') {
                  window.location.reload();
                }
              }}
              style={{
                padding: 15,
                backgroundColor: Colors.primary.textSecondary,
                borderRadius: 8,
                flex: 1,
              }}
            >
              <Text style={{ color: Colors.primary.text, textAlign: 'center' as const, fontWeight: '600' as const }}>Reload</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

function RootLayoutNav() {
  const storage = useStorage();
  const { userData } = useReferral();
  const voice = useVoiceControl();
  const siri = useSiriIntegration();
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);
  const [hasCheckedFirstTime, setHasCheckedFirstTime] = useState<boolean>(false);
  const [showVoiceOnboarding, setShowVoiceOnboarding] = useState<boolean>(false);

  console.log('[RootLayoutNav] Rendering, storage:', typeof storage, 'userData:', typeof userData);

  useEffect(() => {
    let referralTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let voiceTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;

    const checkFirstTimeUser = async () => {
      try {
        console.log('[RootLayoutNav] Checking first time user...');
        const hasSeenModal = await storage.getItem('hasSeenReferralModal');
        const isFirstTime = !hasSeenModal && !userData.hasUsedReferralCode;
        console.log('[RootLayoutNav] hasSeenModal:', hasSeenModal, 'isFirstTime:', isFirstTime);

        if (isFirstTime && mounted) {
          referralTimeoutId = setTimeout(() => {
            if (mounted) {
              setShowReferralModal(true);
            }
          }, 1500);
        }

        const hasCompletedVoiceOnboarding = await storage.getItem('hasCompletedVoiceOnboarding');
        if (hasCompletedVoiceOnboarding !== 'true' && mounted) {
          voiceTimeoutId = setTimeout(() => {
            if (mounted) {
              setShowVoiceOnboarding(true);
            }
          }, 2000);
        }

        if (mounted) {
          setHasCheckedFirstTime(true);
          console.log('[RootLayoutNav] First time check completed');
        }
      } catch (error) {
        console.error('[RootLayoutNav] Error checking first time user:', error);
        if (mounted) {
          setHasCheckedFirstTime(true);
        }
      }
    };

    console.log('[RootLayoutNav] Starting first time check...');
    checkFirstTimeUser();

    return () => {
      mounted = false;
      if (referralTimeoutId) {
        clearTimeout(referralTimeoutId);
        referralTimeoutId = null;
      }
      if (voiceTimeoutId) {
        clearTimeout(voiceTimeoutId);
        voiceTimeoutId = null;
      }
    };
  }, [storage, userData.hasUsedReferralCode]);

  const handleModalClose = async () => {
    setShowReferralModal(false);
    try {
      await storage.setItem('hasSeenReferralModal', 'true');
    } catch (error) {
      console.error('Error saving modal state:', error);
    }
  };

  const handleCompleteVoiceOnboarding = useCallback(async () => {
    try {
      await storage.setItem('hasCompletedVoiceOnboarding', 'true');
      setShowVoiceOnboarding(false);
    } catch (error) {
      console.error('Error saving voice onboarding state:', error);
    }
  }, [storage]);

  const handleEnableInAppVoice = useCallback(async () => {
    try {
      if (typeof voice?.startListening === 'function') {
        await voice.startListening();
      }
    } catch (e) {
      console.error('Failed to start in-app voice:', e);
      Alert.alert('Error', 'Failed to start voice control');
    } finally {
      handleCompleteVoiceOnboarding();
    }
  }, [voice, handleCompleteVoiceOnboarding]);

  const handleEnableSiri = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        if (typeof siri?.enableSiri === 'function') {
          await siri.enableSiri();
        }
        if (typeof siri?.registerShortcuts === 'function') {
          await siri.registerShortcuts();
        }
      } else {
        Alert.alert('Info', 'Siri is available on iOS only');
      }
    } catch (e) {
      console.error('Failed to enable Siri:', e);
    } finally {
      handleCompleteVoiceOnboarding();
    }
  }, [siri, handleCompleteVoiceOnboarding]);

  return (
    <>
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="subscription/index" options={{ headerShown: false }} />
        <Stack.Screen name="debug-screen" options={{ headerShown: true, title: "Debug" }} />
      </Stack>
      {hasCheckedFirstTime && showReferralModal && (
        <ReferralCodeModal
          visible={showReferralModal}
          onClose={handleModalClose}
          isFirstTime={true}
        />
      )}
      {hasCheckedFirstTime && showVoiceOnboarding && (
        <VoiceOnboardingModal
          visible={showVoiceOnboarding}
          onClose={handleCompleteVoiceOnboarding}
          onEnableInApp={handleEnableInAppVoice}
          onEnableSiri={handleEnableSiri}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [providersReady, setProvidersReady] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('[App] Starting initialization...');
        const startTime = Date.now();
        
        setIsInitialized(true);
        setProvidersReady(true);
        
        const duration = Date.now() - startTime;
        console.log(`[App] Initialization completed in ${duration}ms`);
        
        setTimeout(() => {
          SplashScreen.hideAsync();
        }, 100);
        
        setTimeout(async () => {
          try {
            console.log('[App] Running deferred storage cleanup...');
            const allKeys = await AsyncStorage.getAllKeys();
            const corruptedKeys: string[] = [];
            
            const maxCheck = Math.min(allKeys.length, 30);
            for (let i = 0; i < maxCheck; i++) {
              const key = allKeys[i];
              try {
                const data = await AsyncStorage.getItem(key);
                if (data && typeof data === 'string' && data.length > 0) {
                  const cleaned = data.trim();
                  if (cleaned.includes('[object Object]') || 
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
              } catch {}
            }
            
            if (corruptedKeys.length > 0) {
              console.log(`[App] Cleared ${corruptedKeys.length} corrupted storage keys`);
              await AsyncStorage.multiRemove(corruptedKeys);
            }
          } catch (cleanupError) {
            console.warn('[App] Deferred cleanup failed:', cleanupError);
          }
        }, 2000);
      } catch (error) {
        console.error('[App] Initialization error:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
        SplashScreen.hideAsync();
      }
    };

    initialize();
  }, []);

  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to initialize app</Text>
        <Text style={styles.errorSubtext}>{initError}</Text>
      </View>
    );
  }

  if (!isInitialized || !providersReady) {
    return (
      <View style={styles.loadingContainer} testID="app-loading">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {!isInitialized ? 'Initializing App...' : 'Loading Providers...'}
        </Text>
        <Text style={[styles.loadingText, { fontSize: 12, marginTop: 10, opacity: 0.6 }]}>
          Please wait... This should only take a moment
        </Text>
      </View>
    );
  }

  console.log('[RootLayout] Rendering providers, isInitialized:', isInitialized, 'providersReady:', providersReady);

  try {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <StorageProvider>
                <LanguageProvider>
                  <AuthProvider>
                    <StripeProvider>
                      <PayPalProvider>
                        <MembershipProvider>
                          <RatingProvider>
                            <CategoryProvider>
                              <BookmarkProvider>
                                <ReferralProvider>
                                  <SoundProvider>
                                    <VoiceControlProvider>
                                      <SiriIntegrationProvider>
                                        <GestureHandlerRootView style={styles.container}>
                                          <RootLayoutNav />
                                        </GestureHandlerRootView>
                                      </SiriIntegrationProvider>
                                    </VoiceControlProvider>
                                  </SoundProvider>
                                </ReferralProvider>
                              </BookmarkProvider>
                            </CategoryProvider>
                          </RatingProvider>
                        </MembershipProvider>
                      </PayPalProvider>
                    </StripeProvider>
                  </AuthProvider>
                </LanguageProvider>
              </StorageProvider>
            </QueryClientProvider>
          </trpc.Provider>
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  } catch (renderError) {
    console.error('[RootLayout] Render error:', renderError);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to render app</Text>
        <Text style={styles.errorSubtext}>{renderError instanceof Error ? renderError.message : 'Unknown error'}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary.bg,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.primary.text,
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    textAlign: 'center' as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 16,
  },
});
