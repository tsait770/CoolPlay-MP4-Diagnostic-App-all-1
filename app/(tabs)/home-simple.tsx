import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import Colors from '@/constants/colors';

export default function HomeSimple() {
  console.log('[HomeSimple] Rendering...');
  
  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>CoolPlay</Text>
          <Text style={styles.subtitle}>App is working!</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>✓ App initialized successfully</Text>
            <Text style={styles.cardText}>✓ Providers loaded</Text>
            <Text style={styles.cardText}>✓ Colors system working</Text>
            <Text style={styles.cardText}>✓ Navigation working</Text>
          </View>

          <Text style={styles.sectionTitle}>Debug Tools</Text>
          <Link href="/debug-screen" asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Open Debug Screen</Text>
            </TouchableOpacity>
          </Link>

          <Text style={styles.info}>
            If you can see this screen, the basic app structure is working correctly.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  header: {
    alignItems: 'center' as const,
    padding: 40,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.primary.textSecondary,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginTop: 20,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardText: {
    fontSize: 14,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  button: {
    backgroundColor: Colors.primary.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary.text,
  },
  info: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    textAlign: 'center' as const,
    marginTop: 20,
    lineHeight: 20,
  },
});
