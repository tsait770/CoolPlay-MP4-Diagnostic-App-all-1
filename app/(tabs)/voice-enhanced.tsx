import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer } from 'expo-video';
import UniversalVideoPlayer from '@/components/UniversalVideoPlayer';
import LiquidGlassControls from '@/components/LiquidGlassControls';
import * as DocumentPicker from 'expo-document-picker';
import {
  Mic,
  Upload,
  Link as LinkIcon,
  Play,
  ChevronDown,
  ChevronUp,
  SkipForward,
  Volume2,
  Monitor,
  Gauge,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTranslation } from '@/hooks/useTranslation';
import { useVoiceControl } from '@/providers/VoiceControlProvider';

interface VideoSource {
  uri: string;
  type: 'local' | 'url' | 'gdrive' | 'youtube' | 'vimeo' | 'stream';
  name?: string;
}

export default function EnhancedVoiceControlScreen() {
  const { t } = useTranslation();
  const voiceControl = useVoiceControl();
  const isListening = voiceControl?.isListening ?? false;
  const alwaysListening = voiceControl?.alwaysListening ?? false;
  const toggleAlwaysListening = voiceControl?.toggleAlwaysListening ?? (async () => {
    console.warn('toggleAlwaysListening not available');
  });

  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    const handleVoiceError = (event: Event) => {
      const { code, message } = (event as CustomEvent).detail || {};
      if (code === 'mic-denied' || code === 'mic-error') {
        setPermissionError(message || 'Microphone permission denied');
        Alert.alert(
          t('permission_required') || 'Permission Required',
          t('microphone_permission_required') || 'Please allow microphone access to use voice control',
          [
            {
              text: t('ok') || 'OK',
              onPress: () => setPermissionError(null),
            },
          ]
        );
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('voiceError', handleVoiceError as EventListener);
      return () => {
        window.removeEventListener('voiceError', handleVoiceError as EventListener);
      };
    }
  }, [t]);

  const insets = useSafeAreaInsets();
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
  const defaultVideoUri = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const [videoPlayerSource] = useState(defaultVideoUri);

  const videoPlayer = useVideoPlayer(videoPlayerSource, (player) => {
    player.loop = false;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [showControls] = useState(true);
  const [showCommandList, setShowCommandList] = useState(false);
  const [showProgressControl, setShowProgressControl] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [showScreenControl, setShowScreenControl] = useState(false);
  const [showSpeedControl, setShowSpeedControl] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening || alwaysListening) {
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
  }, [isListening, alwaysListening, pulseAnim]);

  useEffect(() => {
    if (!videoPlayer) return;

    const updateStatus = () => {
      try {
        setIsPlaying(videoPlayer.playing || false);
        setIsMuted(videoPlayer.muted || false);
        setVolume(videoPlayer.volume || 1.0);
        setPlaybackRate(videoPlayer.playbackRate || 1.0);
      } catch (error) {
        console.error('Error updating video status:', error);
      }
    };

    const interval = setInterval(updateStatus, 100);
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [videoPlayer]);

  useEffect(() => {
    const handlePlaybackCommand = (action: string) => {
      if (!videoPlayer) return;
      switch (action) {
        case 'play':
          videoPlayer.play();
          break;
        case 'pause':
          videoPlayer.pause();
          break;
        case 'stop':
          videoPlayer.pause();
          videoPlayer.currentTime = 0;
          break;
        case 'restart':
          videoPlayer.currentTime = 0;
          videoPlayer.play();
          break;
      }
    };

    const handleSeekCommand = (action: string, slot: any) => {
      if (!videoPlayer) return;
      const seconds = slot?.seconds || 10;
      const currentTime = videoPlayer.currentTime || 0;

      if (action === 'forward') {
        const duration = videoPlayer.duration || 0;
        videoPlayer.currentTime = Math.min(currentTime + seconds, duration);
      } else if (action === 'rewind') {
        videoPlayer.currentTime = Math.max(currentTime - seconds, 0);
      }
    };

    const handleVolumeCommand = (action: string, slot: any) => {
      if (!videoPlayer) return;
      switch (action) {
        case 'max':
          videoPlayer.volume = 1.0;
          break;
        case 'mute':
          videoPlayer.muted = true;
          break;
        case 'unmute':
          videoPlayer.muted = false;
          break;
        case 'up':
          videoPlayer.volume = Math.min(1.0, (videoPlayer.volume || 0) + 0.1);
          break;
        case 'down':
          videoPlayer.volume = Math.max(0, (videoPlayer.volume || 0) - 0.1);
          break;
      }
    };

    const handleFullscreenCommand = (action: string) => {
      if (action === 'enter') {
        setIsFullscreen(true);
      } else if (action === 'exit') {
        setIsFullscreen(false);
      }
    };

    const handleSpeedCommand = (action: string, slot: any) => {
      if (!videoPlayer) return;
      const speed = slot?.speed || 1.0;
      videoPlayer.playbackRate = speed;
    };

    const handleVoiceCommand = (event: Event) => {
      try {
        const { intent, action, slot } = (event as CustomEvent).detail || {};
        if (!intent) return;

        switch (intent) {
          case 'playback_control':
            handlePlaybackCommand(action);
            break;
          case 'seek_control':
            handleSeekCommand(action, slot);
            break;
          case 'volume_control':
            handleVolumeCommand(action, slot);
            break;
          case 'fullscreen_control':
            handleFullscreenCommand(action);
            break;
          case 'speed_control':
            handleSpeedCommand(action, slot);
            break;
        }
      } catch (err) {
        console.error('Error handling voice command:', err);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('voiceCommand', handleVoiceCommand as EventListener);
      return () => {
        window.removeEventListener('voiceCommand', handleVoiceCommand as EventListener);
      };
    }
  }, [videoPlayer]);

  const togglePlayPause = () => {
    if (!videoPlayer) return;
    if (isPlaying) {
      videoPlayer.pause();
    } else {
      videoPlayer.play();
    }
  };

  const seekForward = (seconds: number) => {
    if (!videoPlayer) return;
    const currentTime = videoPlayer.currentTime || 0;
    const duration = videoPlayer.duration || 0;
    videoPlayer.currentTime = Math.min(currentTime + seconds, duration);
  };

  const seekBackward = (seconds: number) => {
    if (!videoPlayer) return;
    const currentTime = videoPlayer.currentTime || 0;
    videoPlayer.currentTime = Math.max(currentTime - seconds, 0);
  };

  const toggleMute = () => {
    if (!videoPlayer) return;
    videoPlayer.muted = !isMuted;
  };

  const changeVolume = (newVolume: number) => {
    if (!videoPlayer) return;
    videoPlayer.volume = Math.max(0, Math.min(1, newVolume));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const changePlaybackRate = (rate: number) => {
    if (!videoPlayer) return;
    videoPlayer.playbackRate = rate;
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.uri && asset.uri.trim() !== '') {
          setVideoSource({
            uri: asset.uri,
            type: 'local',
            name: asset.name || 'Local Video',
          });
        }
      }
    } catch {
      Alert.alert(t('error'), t('failed_to_load_video'));
    }
  };

  const renderVideoSection = () => {
    if (!videoSource) {
      return (
        <View style={styles.videoPlaceholder}>
          <View style={styles.liquidGlassCard}>
            <View style={styles.placeholderIcon}>
              <Play size={64} color="#e81cff" />
            </View>
            <Text style={styles.placeholderTitle}>{t('select_video')}</Text>
            <Text style={styles.placeholderSubtitle}>{t('select_video_subtitle')}</Text>

            <TouchableOpacity style={styles.uploadButton} onPress={pickVideo}>
              <Upload size={20} color="white" />
              <Text style={styles.uploadButtonText}>{t('select_video')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton}>
              <LinkIcon size={20} color="#40c9ff" />
              <Text style={styles.linkButtonText}>{t('load_from_url')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.videoContainer}>
        <UniversalVideoPlayer
          url={videoSource.uri}
          onError={(error) => console.error('Video error:', error)}
          onPlaybackStart={() => setIsPlaying(true)}
          onPlaybackEnd={() => setIsPlaying(false)}
          autoPlay={false}
          style={styles.video}
        />
        {showControls && (
          <LiquidGlassControls
            isPlaying={isPlaying}
            isMuted={isMuted}
            isFullscreen={isFullscreen}
            playbackRate={playbackRate}
            volume={volume}
            onPlayPause={togglePlayPause}
            onSeekForward={seekForward}
            onSeekBackward={seekBackward}
            onMuteToggle={toggleMute}
            onVolumeChange={changeVolume}
            onFullscreenToggle={toggleFullscreen}
            onPlaybackRateChange={changePlaybackRate}
            visible={showControls}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderVideoSection()}

      {!videoSource && (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top, 20) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.liquidGlassCard}>
            <View style={styles.headerIcon}>
              <Mic size={40} color="#e81cff" />
            </View>
            <Text style={styles.headerTitle}>{t('voice_control')}</Text>
            <Text style={styles.headerSubtitle}>{t('voice_control_instruction')}</Text>
          </View>

          <View style={styles.voiceButtonSection}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.mainVoiceButton,
                  (isListening || alwaysListening) && styles.mainVoiceButtonActive,
                  permissionError && styles.mainVoiceButtonError,
                ]}
                onPress={async () => {
                  setPermissionError(null);
                  try {
                    if (!voiceControl) {
                      console.warn('Voice control provider not available');
                      setPermissionError('Voice control not initialized');
                      return;
                    }
                    if (typeof toggleAlwaysListening !== 'function') {
                      console.warn('toggleAlwaysListening is not a function');
                      setPermissionError('Voice control not properly initialized');
                      return;
                    }
                    await toggleAlwaysListening();
                  } catch (err: any) {
                    console.error('Voice control error:', err);
                    setPermissionError(err?.message || 'Failed to start voice control');
                  }
                }}
                activeOpacity={0.8}
              >
                <Mic size={48} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.voiceButtonHint}>
              {permissionError ? permissionError : alwaysListening ? t('continuous_listening') : t('tap_to_speak')}
            </Text>
          </View>

          <View style={styles.commandsSection}>
            <Text style={styles.sectionTitle}>{t('available_commands')}</Text>

            <TouchableOpacity
              style={styles.liquidCommandCard}
              onPress={() => setShowCommandList(!showCommandList)}
            >
              <View style={styles.commandHeader}>
                <View style={styles.commandIcon}>
                  <Play size={22} color="#e81cff" />
                </View>
                <View style={styles.commandContent}>
                  <Text style={styles.commandTitle}>{t('playback_control')}</Text>
                  <Text style={styles.commandSubtitle}>6 {t('commands')}</Text>
                </View>
                {showCommandList ? (
                  <ChevronUp size={20} color="#ccc" />
                ) : (
                  <ChevronDown size={20} color="#ccc" />
                )}
              </View>
              {showCommandList && (
                <View style={styles.commandExpanded}>
                  {[
                    { action: t('play'), example: t('play_example') || 'play' },
                    { action: t('pause'), example: t('pause_example') || 'pause' },
                    { action: t('stop'), example: t('stop_example') || 'stop' },
                    { action: t('next_video'), example: t('next_example') || 'next' },
                    { action: t('previous_video'), example: t('previous_example') || 'previous' },
                    { action: t('replay'), example: t('replay_example') || 'replay' },
                  ].map((cmd, index) => (
                    <View key={index} style={styles.commandRow}>
                      <View style={styles.commandDot} />
                      <Text style={styles.commandText}>{cmd.action}</Text>
                      <Text style={styles.commandBadge}>{cmd.example}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.liquidCommandCard}
              onPress={() => setShowProgressControl(!showProgressControl)}
            >
              <View style={styles.commandHeader}>
                <View style={styles.commandIcon}>
                  <SkipForward size={22} color="#40c9ff" />
                </View>
                <View style={styles.commandContent}>
                  <Text style={styles.commandTitle}>{t('progress_control')}</Text>
                  <Text style={styles.commandSubtitle}>6 {t('commands')}</Text>
                </View>
                {showProgressControl ? (
                  <ChevronUp size={20} color="#ccc" />
                ) : (
                  <ChevronDown size={20} color="#ccc" />
                )}
              </View>
              {showProgressControl && (
                <View style={styles.commandExpanded}>
                  {[
                    { action: t('forward_10s'), example: '10秒' },
                    { action: t('forward_20s'), example: '20秒' },
                    { action: t('forward_30s'), example: '30秒' },
                    { action: t('rewind_10s'), example: '10秒' },
                    { action: t('rewind_20s'), example: '20秒' },
                    { action: t('rewind_30s'), example: '30秒' },
                  ].map((cmd, index) => (
                    <View key={index} style={styles.commandRow}>
                      <View style={styles.commandDot} />
                      <Text style={styles.commandText}>{cmd.action}</Text>
                      <Text style={styles.commandBadge}>{cmd.example}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.liquidCommandCard}
              onPress={() => setShowVolumeControl(!showVolumeControl)}
            >
              <View style={styles.commandHeader}>
                <View style={styles.commandIcon}>
                  <Volume2 size={22} color="#40c9ff" />
                </View>
                <View style={styles.commandContent}>
                  <Text style={styles.commandTitle}>{t('volume_control')}</Text>
                  <Text style={styles.commandSubtitle}>5 {t('commands')}</Text>
                </View>
                {showVolumeControl ? (
                  <ChevronUp size={20} color="#ccc" />
                ) : (
                  <ChevronDown size={20} color="#ccc" />
                )}
              </View>
              {showVolumeControl && (
                <View style={styles.commandExpanded}>
                  {[
                    { action: t('max_volume'), example: 'max' },
                    { action: t('mute'), example: 'mute' },
                    { action: t('unmute'), example: 'unmute' },
                    { action: t('volume_up'), example: 'up' },
                    { action: t('volume_down'), example: 'down' },
                  ].map((cmd, index) => (
                    <View key={index} style={styles.commandRow}>
                      <View style={styles.commandDot} />
                      <Text style={styles.commandText}>{cmd.action}</Text>
                      <Text style={styles.commandBadge}>{cmd.example}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.liquidCommandCard}
              onPress={() => setShowScreenControl(!showScreenControl)}
            >
              <View style={styles.commandHeader}>
                <View style={styles.commandIcon}>
                  <Monitor size={22} color="#40c9ff" />
                </View>
                <View style={styles.commandContent}>
                  <Text style={styles.commandTitle}>{t('screen_control')}</Text>
                  <Text style={styles.commandSubtitle}>2 {t('commands')}</Text>
                </View>
                {showScreenControl ? (
                  <ChevronUp size={20} color="#ccc" />
                ) : (
                  <ChevronDown size={20} color="#ccc" />
                )}
              </View>
              {showScreenControl && (
                <View style={styles.commandExpanded}>
                  {[
                    { action: t('fullscreen'), example: 'fullscreen' },
                    { action: t('exit_fullscreen'), example: 'exit' },
                  ].map((cmd, index) => (
                    <View key={index} style={styles.commandRow}>
                      <View style={styles.commandDot} />
                      <Text style={styles.commandText}>{cmd.action}</Text>
                      <Text style={styles.commandBadge}>{cmd.example}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.liquidCommandCard}
              onPress={() => setShowSpeedControl(!showSpeedControl)}
            >
              <View style={styles.commandHeader}>
                <View style={styles.commandIcon}>
                  <Gauge size={22} color="#40c9ff" />
                </View>
                <View style={styles.commandContent}>
                  <Text style={styles.commandTitle}>{t('playback_speed')}</Text>
                  <Text style={styles.commandSubtitle}>5 {t('commands')}</Text>
                </View>
                {showSpeedControl ? (
                  <ChevronUp size={20} color="#ccc" />
                ) : (
                  <ChevronDown size={20} color="#ccc" />
                )}
              </View>
              {showSpeedControl && (
                <View style={styles.commandExpanded}>
                  {[
                    { action: t('speed_0_5'), example: '0.5x' },
                    { action: t('normal_speed'), example: '1x' },
                    { action: t('speed_1_25'), example: '1.25x' },
                    { action: t('speed_1_5'), example: '1.5x' },
                    { action: t('speed_2_0'), example: '2x' },
                  ].map((cmd, index) => (
                    <View key={index} style={styles.commandRow}>
                      <View style={styles.commandDot} />
                      <Text style={styles.commandText}>{cmd.action}</Text>
                      <Text style={styles.commandBadge}>{cmd.example}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  liquidGlassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(33, 33, 33, 0.2)',
      },
      default: {
        backgroundColor: Colors.secondary.bg,
      },
    }),
    borderWidth: 1,
    borderColor: 'rgba(232, 28, 255, 0.2)',
    shadowColor: '#e81cff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(232, 28, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.primary.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  placeholderIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(232, 28, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 15,
    color: Colors.primary.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e81cff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 12,
    width: '100%',
    shadowColor: '#e81cff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(64, 201, 255, 0.15)',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(64, 201, 255, 0.3)',
  },
  linkButtonText: {
    color: '#40c9ff',
    fontSize: 16,
    fontWeight: '600',
  },
  voiceButtonSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mainVoiceButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e81cff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e81cff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 16,
  },
  mainVoiceButtonActive: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
  },
  mainVoiceButtonError: {
    backgroundColor: '#FF9500',
    shadowColor: '#FF9500',
  },
  voiceButtonHint: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
    textAlign: 'center',
  },
  commandsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 16,
  },
  liquidCommandCard: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(33, 33, 33, 0.2)',
      },
      default: {
        backgroundColor: Colors.secondary.bg,
      },
    }),
    borderWidth: 1,
    borderColor: 'rgba(64, 201, 255, 0.2)',
    marginBottom: 12,
    shadowColor: '#40c9ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  commandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  commandIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(64, 201, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commandContent: {
    flex: 1,
  },
  commandTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 2,
  },
  commandSubtitle: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
  },
  commandExpanded: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(64, 201, 255, 0.1)',
  },
  commandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  commandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#40c9ff',
  },
  commandText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary.text,
    fontWeight: '500',
  },
  commandBadge: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    backgroundColor: Colors.card.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '500',
  },
});
