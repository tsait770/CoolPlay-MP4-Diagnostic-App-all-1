import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import {
  Mic,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Settings,
} from 'lucide-react-native';



interface MinimalGlowControlsProps {
  title?: string;
  isPlaying?: boolean;
  isMuted?: boolean;
  isVoiceActive?: boolean;
  position?: number;
  duration?: number;
  onPlayPause?: () => void;
  onMute?: () => void;
  onSeek?: (seconds: number) => void;
  onVoiceToggle?: () => void;
  onSettings?: () => void;
}

export default function MinimalGlowControls({
  title = 'Video Title',
  isPlaying = false,
  isMuted = false,
  isVoiceActive = false,
  position = 0,
  duration = 0,
  onPlayPause,
  onMute,
  onSeek,
  onVoiceToggle,
  onSettings,
}: MinimalGlowControlsProps) {
  const [showControls, setShowControls] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for voice button
  useEffect(() => {
    if (isVoiceActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isVoiceActive, pulseAnim]);

  // Voice waveform animation
  useEffect(() => {
    if (isVoiceActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      waveAnim.setValue(0);
    }
  }, [isVoiceActive, waveAnim]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, isPlaying, fadeAnim]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={() => {
        setShowControls(!showControls);
        Animated.timing(fadeAnim, {
          toValue: showControls ? 0 : 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }}
    >
      {/* Minimal Glow Container with Border Glow */}
      <Animated.View style={[styles.controlsWrapper, { opacity: fadeAnim }]}>
        <View style={styles.glowContainer}>
          {/* Title & Status Section */}
          <View style={styles.headerSection}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.status}>
              {isPlaying ? 'Playing' : 'Paused'}
            </Text>
          </View>

          {/* Voice Waveform Display */}
          {isVoiceActive && (
            <View style={styles.waveformContainer}>
              <View style={styles.waveformWrapper}>
                {[...Array(20)].map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.waveformBar,
                      {
                        height: waveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [8, Math.random() * 40 + 10],
                        }),
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.waveformLabel}>Listening...</Text>
            </View>
          )}

          {/* Seek Bar */}
          <View style={styles.seekSection}>
            <View style={styles.seekBar}>
              <View style={[styles.seekProgress, { width: `${progressPercentage}%` }]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlsSection}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => onSeek?.(-10)}
              activeOpacity={0.7}
            >
              <SkipBack size={24} color="#FFFFFF" />
              <Text style={styles.controlLabel}>10s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playButton}
              onPress={onPlayPause}
              activeOpacity={0.7}
            >
              {isPlaying ? (
                <Pause size={32} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => onSeek?.(10)}
              activeOpacity={0.7}
            >
              <SkipForward size={24} color="#FFFFFF" />
              <Text style={styles.controlLabel}>10s</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Row: Volume & Voice */}
          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onMute}
              activeOpacity={0.7}
            >
              {isMuted ? (
                <VolumeX size={20} color="#FFFFFF" />
              ) : (
                <Volume2 size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            {/* Voice Input Button - Cyan Color */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.voiceButton,
                  isVoiceActive && styles.voiceButtonActive,
                ]}
                onPress={onVoiceToggle}
                activeOpacity={0.7}
              >
                <Mic size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={onSettings}
              activeOpacity={0.7}
            >
              <Settings size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  controlsWrapper: {
    width: '100%',
  },
  glowContainer: {
    backgroundColor: '#212121',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#69E7D8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    // Border glow effect using box-shadow equivalent
    ...Platform.select({
      web: {
        boxShadow: '0 0 15px rgba(105, 231, 216, 0.4), 0 0 15px rgba(232, 28, 255, 0.3), inset 0 0 0 2px rgba(105, 231, 216, 0.6)',
      },
      default: {
        borderColor: '#69E7D8',
        borderWidth: 2,
      },
    }),
  },
  headerSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: '#69E7D8',
    fontWeight: '500',
  },
  waveformContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  waveformWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    gap: 4,
    marginBottom: 8,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#69E7D8',
    borderRadius: 2,
  },
  waveformLabel: {
    fontSize: 12,
    color: '#69E7D8',
    fontWeight: '600',
  },
  seekSection: {
    marginBottom: 16,
  },
  seekBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  seekProgress: {
    height: '100%',
    backgroundColor: '#69E7D8',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    marginBottom: 16,
  },
  controlButton: {
    alignItems: 'center',
    gap: 4,
  },
  controlLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(105, 231, 216, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#69E7D8',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#69E7D8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#69E7D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
  },
});
