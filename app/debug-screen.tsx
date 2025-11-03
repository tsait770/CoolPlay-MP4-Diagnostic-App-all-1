import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

export default function DebugScreen() {
  const [logs, setLogs] = useState<string[]>([]);
  const [storageKeys, setStorageKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkApp = async () => {
      const newLogs: string[] = [];
      
      try {
        newLogs.push('[DEBUG] Starting diagnostic...');
        
        // Check AsyncStorage
        try {
          const keys = await AsyncStorage.getAllKeys();
          newLogs.push(`[DEBUG] Storage keys count: ${keys.length}`);
          setStorageKeys([...keys]);
          
          // Check for corrupted keys
          let corruptedCount = 0;
          for (const key of keys.slice(0, 10)) {
            try {
              const value = await AsyncStorage.getItem(key);
              if (value && typeof value === 'string') {
                if (value.includes('[object Object]') || value === 'undefined' || value === 'NaN') {
                  corruptedCount++;
                  newLogs.push(`[WARN] Corrupted key: ${key}`);
                }
              }
            } catch (e) {
              newLogs.push(`[ERROR] Failed to read key ${key}: ${e}`);
            }
          }
          newLogs.push(`[DEBUG] Corrupted keys: ${corruptedCount}`);
        } catch (storageError) {
          newLogs.push(`[ERROR] AsyncStorage check failed: ${storageError}`);
        }
        
        // Check Colors
        try {
          newLogs.push(`[DEBUG] Colors.primary.bg: ${Colors.primary.bg}`);
          newLogs.push(`[DEBUG] Colors.primary.text: ${Colors.primary.text}`);
        } catch (colorError) {
          newLogs.push(`[ERROR] Colors check failed: ${colorError}`);
        }
        
        newLogs.push('[DEBUG] Diagnostic completed');
        setLogs(newLogs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        newLogs.push(`[FATAL] Diagnostic failed: ${err}`);
        setLogs(newLogs);
      }
    };
    
    checkApp();
  }, []);

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      setLogs([...logs, '[ACTION] Storage cleared successfully']);
      setStorageKeys([]);
    } catch (err) {
      setLogs([...logs, `[ERROR] Failed to clear storage: ${err}`]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>Debug Screen</Text>
      
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.button} onPress={clearStorage}>
        <Text style={styles.buttonText}>Clear Storage</Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>Storage Keys ({storageKeys.length})</Text>
      <ScrollView style={styles.logContainer}>
        {storageKeys.map((key, idx) => (
          <Text key={idx} style={styles.logText}>• {key}</Text>
        ))}
      </ScrollView>
      
      <Text style={styles.sectionTitle}>Logs</Text>
      <ScrollView style={styles.logContainer}>
        {logs.map((log, idx) => (
          <Text key={idx} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.primary.text,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: Colors.semantic.danger,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    color: Colors.primary.text,
    fontSize: 14,
  },
  button: {
    backgroundColor: Colors.primary.accent,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center' as const,
  },
  buttonText: {
    color: Colors.primary.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginTop: 10,
    marginBottom: 10,
  },
  logContainer: {
    flex: 1,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  logText: {
    color: Colors.primary.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 5,
  },
});
