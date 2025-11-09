import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import MinimalGlowControls from '@/components/MinimalGlowControls';
import { Play, Info } from 'lucide-react-native';

export default function VoiceControllerDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [position, setPosition] = useState(45);
  const [duration] = useState(180);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleSeek = (seconds: number) => {
    const newPosition = Math.max(0, Math.min(duration, position + seconds));
    setPosition(newPosition);
  };

  const handleVoiceToggle = () => {
    setIsVoiceActive(!isVoiceActive);
  };

  const handleSettings = () => {
    console.log('Settings pressed');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Voice Controller V3.1',
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: '#FFFFFF',
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>V3.1</Text>
          </View>
          <Text style={styles.headerTitle}>Enhanced Video Voice Controller</Text>
          <Text style={styles.headerSubtitle}>Minimal Design with Border Glow</Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <View style={styles.colorDot} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Minimalist Design</Text>
              <Text style={styles.featureDescription}>
                Clean, high-contrast UI with no complex effects
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(105, 231, 216, 0.15)' }]}>
              <View style={[styles.colorDot, { backgroundColor: '#69E7D8' }]} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Border Glow Effect</Text>
              <Text style={styles.featureDescription}>
                Purple-to-cyan gradient border as the only decoration
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(105, 231, 216, 0.15)' }]}>
              <View style={[styles.colorDot, { backgroundColor: '#69E7D8' }]} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Cyan Microphone</Text>
              <Text style={styles.featureDescription}>
                Changed from purple to cyan (#69E7D8) for a fresh, tech feel
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(232, 28, 255, 0.15)' }]}>
              <Play size={16} color="#e81cff" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Title at Top</Text>
              <Text style={styles.featureDescription}>
                Video title positioned at the very top for clear identification
              </Text>
            </View>
          </View>
        </View>

        {/* Design Specs */}
        <View style={styles.specsContainer}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Background</Text>
            <View style={styles.specValue}>
              <View style={[styles.colorPreview, { backgroundColor: '#212121' }]} />
              <Text style={styles.specText}>#212121 (Solid Dark)</Text>
            </View>
          </View>

          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Border Glow</Text>
            <View style={styles.specValue}>
              <View style={[styles.colorPreview, { 
                backgroundColor: '#69E7D8',
                borderWidth: 1,
                borderColor: '#e81cff',
              }]} />
              <Text style={styles.specText}>#e81cff → #69E7D8</Text>
            </View>
          </View>

          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Microphone Color</Text>
            <View style={styles.specValue}>
              <View style={[styles.colorPreview, { backgroundColor: '#69E7D8' }]} />
              <Text style={styles.specText}>#69E7D8 (Cyan)</Text>
            </View>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Info size={20} color="#69E7D8" />
          <Text style={styles.infoText}>
            This design removes the liquid glass effect for better performance and clarity. 
            The border glow is the only decorative element.
          </Text>
        </View>
      </ScrollView>

      {/* Demo Video Area with Controls */}
      <View style={styles.videoArea}>
        <View style={styles.videoPlaceholder}>
          <Play size={48} color="rgba(255, 255, 255, 0.5)" />
          <Text style={styles.placeholderText}>Video Player Area</Text>
        </View>
        
        <MinimalGlowControls
          title="Sample Video Title - Enhanced Voice Controller V3.1"
          isPlaying={isPlaying}
          isMuted={isMuted}
          isVoiceActive={isVoiceActive}
          position={position}
          duration={duration}
          onPlayPause={handlePlayPause}
          onMute={handleMute}
          onSeek={handleSeek}
          onVoiceToggle={handleVoiceToggle}
          onSettings={handleSettings}
        />
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => setIsVoiceActive(!isVoiceActive)}
        >
          <Text style={styles.testButtonText}>
            {isVoiceActive ? 'Stop Voice' : 'Start Voice'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  badge: {
    backgroundColor: '#69E7D8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#69E7D8',
    textAlign: 'center',
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(232, 28, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e81cff',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  specsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  specLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  specValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  specText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'monospace',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(105, 231, 216, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(105, 231, 216, 0.3)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
  },
  videoArea: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: '#000000',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  controlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
  },
  testButton: {
    backgroundColor: '#69E7D8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});
