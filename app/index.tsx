import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

export default function Index() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('[Index] Starting app initialization...');
        
        // Give providers time to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('[Index] Initialization complete, navigating to home...');
        setIsReady(true);
        
        // Navigate to home
        setTimeout(() => {
          try {
            router.replace('/(tabs)/home');
          } catch (navError) {
            console.error('[Index] Navigation error:', navError);
            setError(navError instanceof Error ? navError.message : 'Navigation failed');
          }
        }, 100);
      } catch (err) {
        console.error('[Index] Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initApp();
  }, [router]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Initialization Error</Text>
        <Text style={styles.errorDetail}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setIsReady(false);
            router.replace('/(tabs)/home');
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.retryButton, { marginTop: 10, backgroundColor: Colors.primary.textSecondary }]}
          onPress={() => router.push('/debug-screen')}
        >
          <Text style={styles.retryText}>Open Debug Screen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary.accent} />
      <Text style={styles.loadingText}>Loading CoolPlay...</Text>
      {isReady && (
        <Text style={styles.subText}>Navigating to home...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.primary.bg,
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.primary.text,
    marginTop: 20,
    fontWeight: '600' as const,
  },
  subText: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    marginTop: 8,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.semantic.danger,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  errorDetail: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  retryButton: {
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.primary.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});