import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    console.log('[Index] Redirecting to home...');
    // Immediate redirect without delay to prevent hydration timeout
    router.replace('/(tabs)/home');
  }, [router]);

  return (
    <View style={styles.container} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
});