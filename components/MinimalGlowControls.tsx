import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Switch,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Play, Pause, SkipForward, SkipBack, Volume2, ChevronUp } from 'lucide-react-native';
import { useVoiceControl } from '@/providers/VoiceControlProvider';
import { useMembership } from '@/providers/MembershipProvider';
import { useTranslation } from '@/hooks/useTranslation';
import Colors from '@/constants/colors';

interface MinimalGlowControlsProps {
  videoTitle?: string;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  onPlayPause?: () => void;
  onSeek?: (seconds: number) => void;
  onVolumeChange?: (volume: number) => void;
}

export default function MinimalGlowControls({
  videoTitle = 'Video Title',
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  onPlayPause,
  onSeek,
  onVolumeChange,
}: MinimalGlowControlsProps) {
  const { t } = useTranslation();
  const voiceControl = useVoiceControl();
  const membership = useMembership();
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const { width: screenWidth } = dimensions;
  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1024;

  const {
    isListening = false,
    alwaysListening = false,
    usageCount = 0,
    toggleAlwaysListening = () => Promise.resolve(),
    startListening = () => Promise.resolve(),
  } = voiceControl || {};

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (isListening || alwaysListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isListening, alwaysListening, pulseAnim, glowAnim]);

  const getResponsiveSize = (mobile: number, tablet: number, desktop: number) => {
    if (isDesktop) return desktop;
    if (isTablet) return tablet;
    return mobile;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const containerStyle = [
    styles.container,
    {
      borderRadius: getResponsiveSize(16, 20, 24),
      padding: getResponsiveSize(20, 24, 28),
    },
  ];

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#e81cff', '#69E7D8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={containerStyle}>
          <View style={styles.headerSection}>
            <Text style={[styles.videoTitle, { fontSize: getResponsiveSize(20, 24, 28) }]}>
              {videoTitle}
            </Text>
            <Text style={[styles.playbackStatus, { fontSize: getResponsiveSize(13, 14, 15) }]}>
              {isPlaying ? t('playing') : t('paused')}
            </Text>
          </View>

          <View style={styles.mediaDisplay}>
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>{t('video_display_area')}</Text>
            </View>
          </View>

          <View style={styles.controlsSection}>
            <View style={styles.timelineContainer}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` },
                  ]}
                />
              </View>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            <View style={styles.playbackButtons}>
              <TouchableOpacity
                onPress={() => onSeek?.(-10)}
                style={styles.controlButton}
              >
                <SkipBack size={getResponsiveSize(24, 28, 32)} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onPlayPause}
                style={[styles.playButton, { width: getResponsiveSize(60, 70, 80), height: getResponsiveSize(60, 70, 80) }]}
              >
                {isPlaying ? (
                  <Pause size={getResponsiveSize(28, 32, 36)} color="#fff" />
                ) : (
                  <Play size={getResponsiveSize(28, 32, 36)} color="#fff" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onSeek?.(10)}
                style={styles.controlButton}
              >
                <SkipForward size={getResponsiveSize(24, 28, 32)} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.voiceSection}>
              <View style={styles.microphoneSection}>
                <Animated.View
                  style={[
                    styles.micButtonWrapper,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.micButton,
                      {
                        width: getResponsiveSize(80, 96, 110),
                        height: getResponsiveSize(80, 96, 110),
                        borderRadius: getResponsiveSize(40, 48, 55),
                      },
                      (isListening || alwaysListening) && styles.micButtonActive,
                    ]}
                    onPress={() => toggleAlwaysListening()}
                  >
                    <Mic size={getResponsiveSize(36, 42, 48)} color="#fff" />
                  </TouchableOpacity>
                </Animated.View>
                <Text style={[styles.micHint, { fontSize: getResponsiveSize(14, 15, 16) }]}>
                  {alwaysListening ? t('continuous_listening') : t('tap_to_speak')}
                </Text>
              </View>

              <View style={styles.alwaysListenCard}>
                <View style={styles.alwaysListenLeft}>
                  <View style={styles.alwaysListenIcon}>
                    <Mic size={20} color={alwaysListening ? '#69E7D8' : '#8E8E93'} />
                  </View>
                  <Text style={styles.alwaysListenText}>{t('always_listen')}</Text>
                </View>
                <Switch
                  value={alwaysListening}
                  onValueChange={() => toggleAlwaysListening()}
                  trackColor={{ false: '#3A3A3C', true: '#69E7D8' }}
                  thumbColor="#fff"
                  ios_backgroundColor="#3A3A3C"
                />
              </View>

              <View style={styles.statsCard}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { fontSize: getResponsiveSize(32, 38, 44) }]}>
                      {usageCount}
                    </Text>
                    <Text style={[styles.statLabel, { fontSize: getResponsiveSize(12, 13, 14) }]}>
                      {t('commands_used')}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { fontSize: getResponsiveSize(32, 38, 44) }]}>
                      2000
                    </Text>
                    <Text style={[styles.statLabel, { fontSize: getResponsiveSize(12, 13, 14) }]}>
                      {t('monthly_limit')}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.usageProgressBar}>
                    <View
                      style={[
                        styles.usageProgressFill,
                        { width: `${Math.min((usageCount / 2000) * 100, 100)}%` },
                      ]}
                    />
                  </View>
                </View>
                <TouchableOpacity style={styles.upgradeButton}>
                  <Text style={styles.upgradeButtonText}>{t('upgrade_plan')}</Text>
                  <ChevronUp
                    size={16}
                    color="#69E7D8"
                    style={{ transform: [{ rotate: '90deg' }] }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: 16,
  },
  gradientBorder: {
    padding: 2,
    borderRadius: 24,
    shadowColor: '#e81cff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  container: {
    backgroundColor: '#121212',
    width: '100%',
  },
  headerSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  videoTitle: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
    marginBottom: 6,
    textAlign: 'center',
  },
  playbackStatus: {
    color: '#69E7D8',
    fontWeight: '600' as const,
  },
  mediaDisplay: {
    marginBottom: 20,
  },
  videoPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  controlsSection: {
    gap: 20,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeText: {
    color: '#EBEBF5',
    fontSize: 12,
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#3A3A3C',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#69E7D8',
    borderRadius: 2,
  },
  playbackButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    backgroundColor: '#69E7D8',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#69E7D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  voiceSection: {
    gap: 16,
  },
  microphoneSection: {
    alignItems: 'center',
    gap: 12,
  },
  micButtonWrapper: {
    shadowColor: '#69E7D8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  micButton: {
    backgroundColor: '#69E7D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
  },
  micHint: {
    color: '#EBEBF5',
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  alwaysListenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  alwaysListenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alwaysListenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alwaysListenText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  statsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    color: '#8E8E93',
    fontWeight: '400' as const,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#3A3A3C',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  usageProgressBar: {
    height: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  usageProgressFill: {
    height: '100%',
    backgroundColor: '#69E7D8',
    borderRadius: 4,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1C1C1E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#69E7D8',
  },
  upgradeButtonText: {
    color: '#69E7D8',
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
