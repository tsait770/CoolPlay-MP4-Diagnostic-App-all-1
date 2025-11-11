import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Animated,
  Modal,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";
import UniversalVideoPlayer from "@/components/UniversalVideoPlayer";
import * as DocumentPicker from "expo-document-picker";
import {
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Mic,
  Upload,
  Link as LinkIcon,
  Play,
  SkipForward,
  Volume2,
  Monitor,
  Gauge,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import PlayStationController from "@/components/PlayStationController";
import Colors from "@/constants/colors";
import DesignTokens from "@/constants/designTokens";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/hooks/useLanguage";
import { useVoiceControl } from "@/providers/VoiceControlProvider";
import { useMembership } from "@/providers/MembershipProvider";

interface VoiceCommand {
  id: string;
  name: string;
  triggers: string[];
  action: string;
}

interface VideoSource {
  uri: string;
  type: "local" | "url" | "gdrive" | "youtube" | "vimeo" | "stream";
  name?: string;
  headers?: Record<string, string>;
}

type VideoSourceType = "supported" | "extended" | "unsupported" | "unknown";

export default function PlayerScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const voiceControl = useVoiceControl();
  const membership = useMembership();
  const voiceState = voiceControl || { usageCount: 0 };
  const {
    isListening: isVoiceListening = false,
    startListening: startVoiceListening = () => Promise.resolve(),
    stopListening: stopVoiceListening = () => Promise.resolve(),
    lastCommand = null,
    isProcessing: isVoiceProcessing = false,
    alwaysListening = false,
    toggleAlwaysListening = () => Promise.resolve()
  } = voiceControl || {};
  const insets = useSafeAreaInsets();
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const { width: screenWidth, height: screenHeight } = dimensions;
  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1024;
  const isLargeDesktop = screenWidth >= 1440;
  
  // Listen to dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);
  
  // Responsive sizing
  const getResponsiveSize = (mobile: number, tablet: number, desktop: number, largeDesktop?: number) => {
    if (isLargeDesktop && largeDesktop) return largeDesktop;
    if (isDesktop) return desktop;
    if (isTablet) return tablet;
    return mobile;
  };
  
  // Get container max width for centering on large screens
  const getMaxContainerWidth = () => {
    if (isLargeDesktop) return 1400;
    if (isDesktop) return 1200;
    if (isTablet) return 900;
    return screenWidth;
  };
  
  // Siri Integration State
  const [siriEnabled, setSiriEnabled] = useState(false);
  const [showSiriSetup, setShowSiriSetup] = useState(false);
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
  const [useUniversalPlayer, setUseUniversalPlayer] = useState(false);
  const defaultVideoUri = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const [videoPlayerSource, setVideoPlayerSource] = useState(defaultVideoUri);
  
  // Only initialize VideoPlayer for native-supported formats
  // UniversalVideoPlayer will handle YouTube/Vimeo/WebView sources
  const videoPlayer = useVideoPlayer(videoPlayerSource, (player) => {
    player.loop = false;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [videoUrl, setVideoUrl] = useState("");
  const TEST_STREAM_URL = "https://www.youtube.com/live/H3KnMyojEQU?si=JCkwI15nOPXHdaL-" as const;
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const [voiceStatus, setVoiceStatus] = useState("");
  const [showCommandList, setShowCommandList] = useState(false);
  const [showProgressControl, setShowProgressControl] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [showScreenControl, setShowScreenControl] = useState(false);
  const [showSpeedControl, setShowSpeedControl] = useState(false);
  const [showCustomCommandActions, setShowCustomCommandActions] = useState(false);
  const [customCommands, setCustomCommands] = useState<VoiceCommand[]>([]);
  const [recording, setRecording] = useState<any>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [showCustomCommandModal, setShowCustomCommandModal] = useState(false);
  const [editingCommand, setEditingCommand] = useState<VoiceCommand | null>(null);
  const [commandName, setCommandName] = useState("");
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [isContentLoaded, setIsContentLoaded] = useState(false);

  const [commandAction, setCommandAction] = useState("");
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  // Define callback functions first
  const skipForward = useCallback(async (seconds: number = 10) => {
    if (!videoPlayer) return;
    try {
      const currentTime = videoPlayer.currentTime || 0;
      const duration = videoPlayer.duration || 0;
      const newPosition = Math.min(currentTime + seconds, duration);
      videoPlayer.currentTime = newPosition;
    } catch (error) {
      console.error('Error skipping forward:', error);
    }
  }, [videoPlayer]);

  const skipBackward = useCallback(async (seconds: number = 10) => {
    if (!videoPlayer) return;
    try {
      const currentTime = videoPlayer.currentTime || 0;
      const newPosition = Math.max(currentTime - seconds, 0);
      videoPlayer.currentTime = newPosition;
    } catch (error) {
      console.error('Error skipping backward:', error);
    }
  }, [videoPlayer]);

  const setVideoVolume = useCallback(async (newVolume: number) => {
    if (!videoPlayer) return;
    try {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      videoPlayer.volume = clampedVolume;
      setVolume(clampedVolume);
    } catch (error) {
      console.error('Error setting video volume:', error);
    }
  }, [videoPlayer]);

  const setVideoSpeed = useCallback(async (rate: number) => {
    if (!videoPlayer) return;
    try {
      videoPlayer.playbackRate = rate;
      setPlaybackRate(rate);
    } catch (error) {
      console.error('Error setting video speed:', error);
    }
  }, [videoPlayer]);

  // Initialize permissions and Siri integration
  useEffect(() => {
    const initializeVoiceControl = async () => {
      try {
        console.log('Voice control initialized');
      } catch (error) {
        console.error('Error initializing voice control:', error);
      }
    };
    
    initializeVoiceControl();
    
    return () => {
      if (isVoiceListening && stopVoiceListening && typeof stopVoiceListening === 'function') {
        stopVoiceListening().catch(error => {
          console.error('Error stopping voice control on cleanup:', error);
        });
      }
    };
  }, [isVoiceListening, stopVoiceListening]);

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
    } else if (showControls) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showControls, isPlaying, fadeAnim]);

  // Pulse animation for voice button (70% slower: 840ms * 1.7 = 1428ms, amplitude reduced by 15% total - 10% + 5%)
  useEffect(() => {
    if (isVoiceActive || isVoiceListening || alwaysListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.085,
            duration: 1428,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1428,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isVoiceActive, isVoiceListening, alwaysListening, pulseAnim]);

  // Listen for mic/voice permission errors
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as { code?: string; message?: string } | undefined;
        const code = detail?.code || 'mic-error';
        if (code === 'mic-denied') {
          const errorMsg = t('microphone_permission_denied');
          Alert.alert(
            t('error'),
            errorMsg !== 'microphone_permission_denied' && errorMsg
              ? errorMsg
              : 'Microphone permission denied. Please enable microphone access in your device settings.',
          );
        } else {
          Alert.alert(
            t('error'),
            detail?.message || 'Microphone access error. Please check permissions and try again.'
          );
        }
        setVoiceStatus('');
        setIsVoiceActive(false);
        // Also turn off always listening if permission denied
        if (code === 'mic-denied' && alwaysListening) {
          toggleAlwaysListening();
        }
      } catch {}
    };
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('voiceError', handler as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('voiceError', handler as EventListener);
      }
    };
  }, [t, alwaysListening, toggleAlwaysListening]);

  // Listen for voice commands from Siri integration
  useEffect(() => {
    const handleVoiceCommand = (event: CustomEvent) => {
      try {
        const { command } = event.detail || {};
        if (!command) return;
        
        switch (command) {
          case 'PlayVideoIntent':
            if (videoPlayer && typeof videoPlayer.play === 'function') {
              videoPlayer.play();
            }
            break;
          case 'PauseVideoIntent':
            if (videoPlayer && typeof videoPlayer.pause === 'function') {
              videoPlayer.pause();
            }
            break;
          case 'StopVideoIntent':
            if (videoPlayer && typeof videoPlayer.pause === 'function') {
              videoPlayer.pause();
              videoPlayer.currentTime = 0;
            }
            break;
          case 'NextVideoIntent':
            console.log('Next video command');
            break;
          case 'PreviousVideoIntent':
            console.log('Previous video command');
            break;
          case 'ReplayVideoIntent':
            if (videoPlayer) {
              videoPlayer.currentTime = 0;
              if (typeof videoPlayer.play === 'function') {
                videoPlayer.play();
              }
            }
            break;
          case 'Forward10Intent':
            skipForward(10);
            break;
          case 'Forward20Intent':
            skipForward(20);
            break;
          case 'Forward30Intent':
            skipForward(30);
            break;
          case 'Rewind10Intent':
            skipBackward(10);
            break;
          case 'Rewind20Intent':
            skipBackward(20);
            break;
          case 'Rewind30Intent':
            skipBackward(30);
            break;
          case 'VolumeMaxIntent':
            setVideoVolume(1.0);
            break;
          case 'MuteIntent':
            if (videoPlayer) {
              videoPlayer.muted = true;
              setIsMuted(true);
            }
            break;
          case 'UnmuteIntent':
            if (videoPlayer) {
              videoPlayer.muted = false;
              setIsMuted(false);
            }
            break;
          case 'VolumeUpIntent':
            setVideoVolume(Math.min(1.0, volume + 0.2));
            break;
          case 'VolumeDownIntent':
            setVideoVolume(Math.max(0, volume - 0.2));
            break;
          case 'EnterFullscreenIntent':
            setIsFullscreen(true);
            break;
          case 'ExitFullscreenIntent':
            setIsFullscreen(false);
            break;
          case 'SpeedHalfIntent':
            setVideoSpeed(0.5);
            break;
          case 'SpeedNormalIntent':
            setVideoSpeed(1.0);
            break;
          case 'Speed125Intent':
            setVideoSpeed(1.25);
            break;
          case 'Speed150Intent':
            setVideoSpeed(1.5);
            break;
          case 'Speed200Intent':
            setVideoSpeed(2.0);
            break;
          default:
            console.log('Unknown command:', command);
        }
        
        setVoiceStatus(`${t('command_executed')}: ${command.replace('Intent', '')}`);
        setTimeout(() => setVoiceStatus(''), 2000);
      } catch (error) {
        console.error('Error handling voice command:', error);
      }
    };

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('voiceCommand', handleVoiceCommand as EventListener);
      return () => {
        if (typeof window.removeEventListener === 'function') {
          window.removeEventListener('voiceCommand', handleVoiceCommand as EventListener);
        }
      };
    }
  }, [videoPlayer, volume, skipForward, skipBackward, setVideoVolume, setVideoSpeed, t]);

  // Update video player state
  useEffect(() => {
    if (videoPlayer) {
      const updateStatus = () => {
        try {
          setIsPlaying(videoPlayer.playing || false);
          setDuration((videoPlayer.duration || 0) * 1000);
          setPosition((videoPlayer.currentTime || 0) * 1000);
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
    }
  }, [videoPlayer]);

  const togglePlayPause = async () => {
    if (!videoPlayer) return;
    try {
      if (isPlaying) {
        if (videoPlayer.pause && typeof videoPlayer.pause === 'function') {
          videoPlayer.pause();
        }
      } else {
        if (videoPlayer.play && typeof videoPlayer.play === 'function') {
          videoPlayer.play();
        }
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const toggleMute = async () => {
    if (!videoPlayer) return;
    try {
      if (typeof videoPlayer.muted !== 'undefined') {
        videoPlayer.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const toggleFullscreen = async () => {
    setIsFullscreen(!isFullscreen);
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.uri && asset.uri.trim() !== '') {
          setVideoSource({
            uri: asset.uri,
            type: "local",
            name: asset.name || "Local Video",
          });
          setIsContentLoaded(true);
        } else {
          Alert.alert(t("error"), t("invalid_video_file"));
        }
      }
    } catch {
      Alert.alert(t("error"), t("failed_to_load_video"));
    }
  };

  const getVideoSourceType = (url: string): VideoSourceType => {
    const sourceInfo = require('@/utils/videoSourceDetector').detectVideoSource(url);
    
    if (sourceInfo.type === 'unsupported') return "unsupported";
    if (sourceInfo.type === 'adult') return "extended";
    if (sourceInfo.type === 'unknown') return "unknown";
    return "supported";
  };

  const processVideoUrl = (url: string): VideoSource | null => {
    const sourceInfo = require('@/utils/videoSourceDetector').detectVideoSource(url);
    
    console.log('[PlayerScreen] Processing URL:', url);
    console.log('[PlayerScreen] Source info:', sourceInfo);
    
    if (sourceInfo.type === 'unsupported') {
      Alert.alert(
        t("unsupported_source"),
        sourceInfo.error || t("drm_protected_content"),
        [{ text: t("ok") }]
      );
      return null;
    }

    const needsUniversalPlayer = 
      sourceInfo.requiresWebView ||
      sourceInfo.type === 'youtube' ||
      sourceInfo.type === 'vimeo' ||
      sourceInfo.type === 'adult' ||
      sourceInfo.type === 'twitter' ||
      sourceInfo.type === 'instagram' ||
      sourceInfo.type === 'tiktok' ||
      sourceInfo.type === 'webview';
    
    setUseUniversalPlayer(needsUniversalPlayer);
    
    if (!needsUniversalPlayer && url && url.trim() !== '') {
      setVideoPlayerSource(url);
    }
    
    console.log('[PlayerScreen] Use UniversalPlayer:', needsUniversalPlayer);

    if (sourceInfo.type === 'adult') {
      console.log('[PlayerScreen] Adult content detected:', sourceInfo.platform);
      return {
        uri: url,
        type: "url",
        name: `${sourceInfo.platform} Video`,
      };
    }

    if (sourceInfo.type === 'youtube') {
      return {
        uri: url,
        type: "youtube" as const,
        name: "YouTube Video",
      };
    }

    if (sourceInfo.type === 'vimeo') {
      return {
        uri: url,
        type: "vimeo",
        name: "Vimeo Video",
      };
    }

    if (sourceInfo.type === 'twitter' || sourceInfo.type === 'instagram' || sourceInfo.type === 'tiktok') {
      return {
        uri: url,
        type: "url",
        name: `${sourceInfo.platform} Video`,
      };
    }

    if (sourceInfo.type === 'direct') {
      return {
        uri: url,
        type: "url",
        name: "Direct Video",
      };
    }

    if (sourceInfo.type === 'stream') {
      return {
        uri: url,
        type: "stream",
        name: `${sourceInfo.streamType?.toUpperCase()} Stream`,
      };
    }

    if (sourceInfo.requiresWebView || sourceInfo.type === 'webview') {
      return {
        uri: url,
        type: "url",
        name: `${sourceInfo.platform} Video`,
      };
    }

    if (url && url.trim() !== '') {
      return {
        uri: url,
        type: "url",
        name: "Video URL",
      };
    }
    
    return null;
  };

  const loadVideoFromUrl = () => {
    if (!videoUrl.trim()) {
      Alert.alert(t("error"), t("please_enter_url"));
      return;
    }

    const trimmedUrl = videoUrl.trim();
    const sourceInfo = require('@/utils/videoSourceDetector').detectVideoSource(trimmedUrl);
    
    console.log('[PlayerScreen] Loading video from URL:', trimmedUrl);
    console.log('[PlayerScreen] Detected source:', sourceInfo);
    
    if (sourceInfo.type === 'youtube') {
      Alert.alert(
        t("youtube_support"),
        t("youtube_processing"),
        [
          {
            text: t("continue"),
            onPress: () => {
              const source = processVideoUrl(trimmedUrl);
              if (source && source.uri && source.uri.trim() !== '') {
                setVideoSource(source);
                setVideoUrl("");
                setShowUrlModal(false);
                setIsContentLoaded(true);
                setVoiceStatus(t("video_loaded_successfully"));
                setTimeout(() => setVoiceStatus(""), 3000);
              } else {
                Alert.alert(t("error"), t("invalid_url"));
              }
            }
          },
          { text: t("cancel"), style: "cancel" }
        ]
      );
      return;
    }

    if (sourceInfo.type === 'adult') {
      Alert.alert(
        t("extended_source"),
        `${sourceInfo.platform} ${t("extended_source_warning")}`,
        [
          {
            text: t("continue"),
            onPress: () => {
              const source = processVideoUrl(trimmedUrl);
              if (source && source.uri && source.uri.trim() !== '') {
                setVideoSource(source);
                setVideoUrl("");
                setShowUrlModal(false);
                setIsContentLoaded(true);
                setVoiceStatus(t("video_loaded_successfully"));
                setTimeout(() => setVoiceStatus(""), 3000);
              } else {
                Alert.alert(t("error"), t("invalid_url"));
              }
            }
          },
          { text: t("cancel"), style: "cancel" }
        ]
      );
      return;
    }

    const source = processVideoUrl(trimmedUrl);
    if (source && source.uri && source.uri.trim() !== '') {
      setVideoSource(source);
      setVideoUrl("");
      setIsContentLoaded(true);
      setVoiceStatus(t("video_loaded_successfully"));
      setTimeout(() => setVoiceStatus(""), 3000);
    } else {
      Alert.alert(t("error"), t("invalid_url"));
    }
  };

  const saveCustomCommand = () => {
    if (!commandName.trim() || !commandAction.trim()) {
      Alert.alert(t("error"), t("fill_all_fields"));
      return;
    }

    if (!editingCommand && customCommands.some(cmd => cmd.name.toLowerCase() === commandName.toLowerCase())) {
      Alert.alert(t("error"), t("command_name_exists"));
      return;
    }

    const newCommand: VoiceCommand = {
      id: editingCommand?.id || Date.now().toString(),
      name: commandName,
      triggers: [commandName.toLowerCase()],
      action: commandAction,
    };

    if (editingCommand) {
      setCustomCommands(prev => 
        prev.map(cmd => cmd.id === editingCommand.id ? newCommand : cmd)
      );
      Alert.alert(t("success"), t("command_updated_successfully"));
    } else {
      setCustomCommands(prev => [...prev, newCommand]);
      Alert.alert(t("success"), t("command_added_successfully"));
    }

    setCommandName("");
    setCommandAction("");
    setEditingCommand(null);
    setShowCustomCommandModal(false);
  };

  const deleteCustomCommand = (commandId: string) => {
    Alert.alert(
      t("delete_command"),
      t("delete_command_confirm"),
      [
        {
          text: t("cancel"),
          style: "cancel"
        },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => {
            setCustomCommands(prev => prev.filter(cmd => cmd.id !== commandId));
            Alert.alert(t("success"), t("command_deleted_successfully"));
          }
        }
      ]
    );
  };

  const startVoiceRecording = async () => {
    try {
      if (startVoiceListening && typeof startVoiceListening === 'function') {
        await startVoiceListening();
        setIsVoiceActive(true);
        setVoiceStatus(t("listening"));
      } else {
        console.error('startVoiceListening is not available or not a function');
        Alert.alert(t("error"), "Voice control not available");
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert(t("error"), t("failed_to_start_recording") + ": " + (error as Error).message);
    }
  };

  const stopVoiceRecording = async () => {
    try {
      if (stopVoiceListening && typeof stopVoiceListening === 'function') {
        await stopVoiceListening();
      }
      setIsVoiceActive(false);
      setVoiceStatus("");
    } catch (error) {
      console.error("Failed to stop recording:", error);
      setVoiceStatus("");
      setIsVoiceActive(false);
    }
  };

  const processVoiceCommand = async (audioData: string | Blob) => {
    try {
      const formData = new FormData();
      
      if (audioData instanceof Blob) {
        formData.append("audio", audioData, "recording.webm");
      } else if (typeof audioData === 'string') {
        const response = await fetch(audioData);
        const blob = await response.blob();
        formData.append("audio", blob, "recording.webm");
      }
      
      formData.append("language", language);

      const response = await fetch("https://toolkit.rork.com/stt/transcribe/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const command = result.text.toLowerCase();
        executeVoiceCommand(command);
        setVoiceStatus(`${t("command_executed")}: ${command}`);
      } else {
        setVoiceStatus(t("failed_to_process_command"));
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
      setVoiceStatus(t("error_processing_voice"));
    }

    setTimeout(() => setVoiceStatus(""), 3000);
  };

  const executeVoiceCommand = (command: string) => {
    if (command.includes(t("play")) || command.includes("play")) {
      try {
        if (videoPlayer && typeof videoPlayer.play === 'function') {
          videoPlayer.play();
        }
      } catch (error) {
        console.error('Error playing video:', error);
      }
    } else if (command.includes(t("pause")) || command.includes("pause")) {
      try {
        if (videoPlayer && typeof videoPlayer.pause === 'function') {
          videoPlayer.pause();
        }
      } catch (error) {
        console.error('Error pausing video:', error);
      }
    } else if (command.includes(t("stop")) || command.includes("stop")) {
      try {
        if (videoPlayer && typeof videoPlayer.pause === 'function') {
          videoPlayer.pause();
        }
      } catch (error) {
        console.error('Error stopping video:', error);
      }
    }
    else if (command.includes(t("forward_30")) || command.includes("forward 30")) {
      skipForward(30);
    } else if (command.includes(t("forward_20")) || command.includes("forward 20")) {
      skipForward(20);
    } else if (command.includes(t("forward_10")) || command.includes("forward 10")) {
      skipForward(10);
    } else if (command.includes(t("backward_30")) || command.includes("backward 30")) {
      skipBackward(30);
    } else if (command.includes(t("backward_20")) || command.includes("backward 20")) {
      skipBackward(20);
    } else if (command.includes(t("backward_10")) || command.includes("backward 10")) {
      skipBackward(10);
    }
    else if (command.includes(t("mute")) || command.includes("mute")) {
      try {
        if (videoPlayer) {
          videoPlayer.muted = true;
          setIsMuted(true);
        }
      } catch (error) {
        console.error('Error muting video:', error);
      }
    } else if (command.includes(t("unmute")) || command.includes("unmute")) {
      try {
        if (videoPlayer) {
          videoPlayer.muted = false;
          setIsMuted(false);
        }
      } catch (error) {
        console.error('Error unmuting video:', error);
      }
    } else if (command.includes(t("volume_up")) || command.includes("volume up")) {
      setVideoVolume(volume + 0.2);
    } else if (command.includes(t("volume_down")) || command.includes("volume down")) {
      setVideoVolume(volume - 0.2);
    } else if (command.includes(t("max_volume")) || command.includes("max volume")) {
      setVideoVolume(1.0);
    }
    else if (command.includes("0.5") || command.includes(t("half_speed"))) {
      setVideoSpeed(0.5);
    } else if (command.includes("1.25")) {
      setVideoSpeed(1.25);
    } else if (command.includes("1.5")) {
      setVideoSpeed(1.5);
    } else if (command.includes("2") || command.includes(t("double_speed"))) {
      setVideoSpeed(2.0);
    } else if (command.includes(t("normal_speed")) || command.includes("normal")) {
      setVideoSpeed(1.0);
    }
    else if (command.includes(t("fullscreen")) || command.includes("fullscreen")) {
      toggleFullscreen();
    } else if (command.includes(t("exit_fullscreen")) || command.includes("exit fullscreen")) {
      if (isFullscreen) toggleFullscreen();
    }

    customCommands.forEach((cmd) => {
      cmd.triggers.forEach((trigger) => {
        if (command.includes(trigger.toLowerCase())) {
          executeCustomAction(cmd.action);
        }
      });
    });
  };

  const getActionLabel = (actionKey: string): string => {
    const actionLabels: Record<string, string> = {
      play: t('play'),
      pause: t('pause'),
      stop: t('stop'),
      next: t('next_video'),
      previous: t('previous_video'),
      restart: t('replay'),
      forward_10: t('forward_10s'),
      forward_20: t('forward_20s'),
      forward_30: t('forward_30s'),
      rewind_10: t('rewind_10s'),
      rewind_20: t('rewind_20s'),
      rewind_30: t('rewind_30s'),
      volume_max: t('max_volume'),
      mute: t('mute'),
      unmute: t('unmute'),
      volume_up: t('volume_up'),
      volume_down: t('volume_down'),
      fullscreen: t('fullscreen'),
      exit_fullscreen: t('exit_fullscreen'),
      speed_0_5: t('speed_0_5'),
      speed_normal: t('normal_speed'),
      speed_1_25: t('speed_1_25'),
      speed_1_5: t('speed_1_5'),
      speed_2_0: t('speed_2_0'),
    };
    return actionLabels[actionKey] || actionKey;
  };

  const executeCustomAction = (action: string) => {
    switch (action) {
      case "play":
        if (videoPlayer && typeof videoPlayer.play === 'function') {
          videoPlayer.play();
        }
        break;
      case "pause":
        if (videoPlayer && typeof videoPlayer.pause === 'function') {
          videoPlayer.pause();
        }
        break;
      case "stop":
        if (videoPlayer && typeof videoPlayer.pause === 'function') {
          videoPlayer.pause();
        }
        break;
      case "forward_10":
        skipForward(10);
        break;
      case "forward_20":
        skipForward(20);
        break;
      case "forward_30":
        skipForward(30);
        break;
      case "rewind_10":
        skipBackward(10);
        break;
      case "rewind_20":
        skipBackward(20);
        break;
      case "rewind_30":
        skipBackward(30);
        break;
      case "volume_max":
        setVideoVolume(1.0);
        break;
      case "mute":
        if (videoPlayer) {
          videoPlayer.muted = true;
          setIsMuted(true);
        }
        break;
      case "unmute":
        if (videoPlayer) {
          videoPlayer.muted = false;
          setIsMuted(false);
        }
        break;
      case "volume_up":
        setVideoVolume(volume + 0.2);
        break;
      case "volume_down":
        setVideoVolume(volume - 0.2);
        break;
      case "fullscreen":
        setIsFullscreen(true);
        break;
      case "exit_fullscreen":
        setIsFullscreen(false);
        break;
      case "speed_0_5":
        setVideoSpeed(0.5);
        break;
      case "speed_normal":
        setVideoSpeed(1.0);
        break;
      case "speed_1_25":
        setVideoSpeed(1.25);
        break;
      case "speed_1_5":
        setVideoSpeed(1.5);
        break;
      case "speed_2_0":
        setVideoSpeed(2.0);
        break;
      default:
        break;
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Removed back button functionality - UI element deleted

  const getProgressPercentage = () => {
    if (duration === 0) return 0;
    return (position / duration) * 100;
  };

  const handleProgressBarPress = async (event: any) => {
    if (!videoPlayer || duration === 0) return;
    try {
      const { locationX } = event.nativeEvent;
      const progressBarWidth = Dimensions.get("window").width - 32;
      const percentage = locationX / progressBarWidth;
      const newPosition = (percentage * duration) / 1000;
      videoPlayer.currentTime = newPosition;
    } catch (error) {
      console.error('Error seeking video:', error);
    }
  };

  return (
    <View style={styles.container}>
      {videoSource && videoSource.uri && videoSource.uri.trim() !== '' ? (
        <View style={styles.videoContainer}>
          <UniversalVideoPlayer
            url={videoSource.uri}
            onError={(error) => {
              console.error('[PlayerScreen] UniversalVideoPlayer error:', error);
              setVoiceStatus(t('video_load_error'));
              setTimeout(() => setVoiceStatus(''), 3000);
            }}
            onPlaybackStart={() => {
              console.log('[PlayerScreen] Video playback started');
              setIsPlaying(true);
            }}
            onPlaybackEnd={() => {
              console.log('[PlayerScreen] Video playback ended');
              setIsPlaying(false);
            }}
            onBackPress={() => {
              // Clear video source to return to main Voice Control screen
              console.log('[PlayerScreen] Back button pressed, clearing video');
              setVideoSource(null);
              setIsContentLoaded(false);
            }}
            autoPlay={false}
            style={styles.video}
          />
        </View>
      ) : (
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={[
              styles.scrollContent, 
              { 
                paddingTop: Math.max(insets.top - 60, 20), 
                paddingHorizontal: getResponsiveSize(16, 32, 48, 64),
                maxWidth: getMaxContainerWidth(),
                alignSelf: 'center',
                width: '100%'
              }
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card1Container}>
              <View style={styles.voiceControlHeaderNonVideo}>
                <View style={styles.micIconCircleNonVideo}>
                  <Mic testID="voice-header-mic" size={getResponsiveSize(32, 40, 48)} color={Colors.accent.primary} />
                </View>
                <Text style={styles.voiceControlHeaderTitleNonVideo}>{t('voice_control')}</Text>
                <Text style={styles.voiceControlHeaderSubtitleNonVideo}>{t('voice_control_instruction')}</Text>
              </View>

              <View style={styles.videoSelectionCard}>
                <View style={styles.videoSelectionIcon}>
                  <Play size={getResponsiveSize(48, 56, 64)} color={Colors.accent.primary} />
                </View>
                <Text style={styles.videoSelectionTitle}>{t('select_video')}</Text>
                <Text style={styles.videoSelectionSubtitle}>{t('select_video_subtitle')}</Text>

                <TouchableOpacity style={styles.selectVideoButton} onPress={pickVideo}>
                  <Upload size={getResponsiveSize(20, 22, 24)} color="white" />
                  <Text style={styles.selectVideoButtonText}>{t('select_video')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.loadUrlButton} onPress={() => setShowUrlModal(true)}>
                  <LinkIcon size={getResponsiveSize(20, 22, 24)} color={Colors.accent.primary} />
                  <Text style={styles.loadUrlButtonText}>{t('load_from_url')}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.youtubePlatformBadge}
                  onPress={() => {
                    console.log('[PlayerScreen] YouTube platform badge clicked');
                    const testYoutubeUrl = TEST_STREAM_URL;
                    const source = processVideoUrl(testYoutubeUrl);
                    if (source && source.uri && source.uri.trim() !== '') {
                      setVideoSource(source);
                      setIsContentLoaded(true);
                      setIsFullscreen(true);
                      setVoiceStatus(t('video_loaded_successfully'));
                      setTimeout(() => setVoiceStatus(''), 3000);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.youtubeLogo}>
                    <Play size={16} color="#fff" fill="#fff" />
                  </View>
                  <Text style={styles.youtubePlatformText}>觀看平台：YouTube</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card2Container}>
              <View style={{ alignItems: 'center', marginBottom: DesignTokens.spacing.lg }}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity
                    testID="tap-to-speak-button"
                    accessibilityLabel="Tap to Speak"
                    style={[styles.mainVoiceButton, (isVoiceActive || isVoiceListening || alwaysListening) && styles.mainVoiceButtonActive]}
                    onPress={async () => {
                      // Toggle Always Listen when pressing the microphone button
                      await toggleAlwaysListening();
                    }}
                    activeOpacity={0.8}
                 >
                    <Mic size={getResponsiveSize(40, 48, 56)} color="#fff" />
                  </TouchableOpacity>
                </Animated.View>
                <Text style={styles.voiceButtonHint}>
                  {alwaysListening 
                    ? t('continuous_listening')
                    : t('tap_to_speak')}
                </Text>
              </View>

              <View style={styles.alwaysListenCard}>
                <View style={styles.alwaysListenContent}>
                  <View style={styles.alwaysListenIcon}>
                    <Mic size={getResponsiveSize(20, 22, 24)} color={alwaysListening ? Colors.accent.primary : Colors.primary.textSecondary} />
                  </View>
                  <View style={styles.alwaysListenText}>
                    <Text style={styles.alwaysListenTitle}>{t('always_listen')}</Text>
                  </View>
                </View>
                <Switch
                  value={alwaysListening}
                  onValueChange={async () => {
                    // Toggle Always Listen
                    await toggleAlwaysListening();
                  }}
                  trackColor={{ false: Colors.card.border, true: Colors.accent.primary }}
                  thumbColor="white"
                  ios_backgroundColor={Colors.card.border}
                />
              </View>

              <View style={styles.statsCard}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{voiceState.usageCount || 0}</Text>
                    <Text style={styles.statLabel}>{t('commands_used')}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>2000</Text>
                    <Text style={styles.statLabel}>{t('monthly_limit')}</Text>
                  </View>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.min(((voiceState.usageCount || 0) / 2000) * 100, 100)}%` }
                      ]} 
                    />
                  </View>
                </View>
                <TouchableOpacity style={styles.upgradeButton}>
                  <Text style={styles.upgradeButtonText}>{t('upgrade_plan')}</Text>
                  <ChevronUp size={getResponsiveSize(16, 18, 20)} color={Colors.accent.primary} style={{ transform: [{ rotate: '90deg' }] }} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card3Container}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('available_commands')}</Text>
                <TouchableOpacity 
                  style={styles.addCommandButton}
                  onPress={() => setShowCustomCommandModal(true)}
                >
                  <Plus size={18} color={Colors.accent.primary} />
                  <Text style={styles.addCommandText}>{t('custom')}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.commandCard}
                onPress={() => setShowCommandList(!showCommandList)}
                activeOpacity={0.7}
              >
                <View style={styles.commandCardHeader}>
                  <View style={styles.commandIconWrapper}>
                    <Play size={22} color={Colors.accent.primary} fill={Colors.accent.primary + '20'} />
                  </View>
                  <View style={styles.commandCardContent}>
                    <Text style={styles.commandCardTitle}>{t('playback_control')}</Text>
                    <Text style={styles.commandCardSubtitle}>6 {t('commands')}</Text>
                  </View>
                  <View style={styles.commandCardArrow}>
                    {showCommandList ? (
                      <ChevronUp size={20} color={Colors.primary.textSecondary} />
                    ) : (
                      <ChevronDown size={20} color={Colors.primary.textSecondary} />
                    )}
                  </View>
                </View>

                {showCommandList && (
                  <View style={styles.commandCardExpanded}>
                    {[
                      { action: t('play'), example: t('play_example') },
                      { action: t('pause'), example: t('pause_example') },
                      { action: t('stop'), example: t('stop_example') },
                      { action: t('next_video'), example: t('next_example') },
                      { action: t('previous_video'), example: t('previous_example') },
                      { action: t('replay'), example: t('replay_example') },
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
                style={styles.commandCard}
                onPress={() => setShowProgressControl(!showProgressControl)}
                activeOpacity={0.7}
              >
                <View style={styles.commandCardHeader}>
                  <View style={styles.commandIconWrapper}>
                    <SkipForward size={22} color={Colors.accent.primary} />
                  </View>
                  <View style={styles.commandCardContent}>
                    <Text style={styles.commandCardTitle}>{t('progress_control')}</Text>
                    <Text style={styles.commandCardSubtitle}>6 {t('commands')}</Text>
                  </View>
                  <View style={styles.commandCardArrow}>
                    {showProgressControl ? (
                      <ChevronUp size={20} color={Colors.primary.textSecondary} />
                    ) : (
                      <ChevronDown size={20} color={Colors.primary.textSecondary} />
                    )}
                  </View>
                </View>
                
                {showProgressControl && (
                  <View style={styles.commandCardExpanded}>
                    {[
                      { action: t('forward_10s'), example: t('forward_10s_example') },
                      { action: t('forward_20s'), example: t('forward_20s_example') },
                      { action: t('forward_30s'), example: t('forward_30s_example') },
                      { action: t('rewind_10s'), example: t('rewind_10s_example') },
                      { action: t('rewind_20s'), example: t('rewind_20s_example') },
                      { action: t('rewind_30s'), example: t('rewind_30s_example') },
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
                style={styles.commandCard}
                onPress={() => setShowVolumeControl(!showVolumeControl)}
                activeOpacity={0.7}
              >
                <View style={styles.commandCardHeader}>
                  <View style={styles.commandIconWrapper}>
                    <Volume2 size={22} color={Colors.accent.primary} />
                  </View>
                  <View style={styles.commandCardContent}>
                    <Text style={styles.commandCardTitle}>{t('volume_control')}</Text>
                    <Text style={styles.commandCardSubtitle}>5 {t('commands')}</Text>
                  </View>
                  <View style={styles.commandCardArrow}>
                    {showVolumeControl ? (
                      <ChevronUp size={20} color={Colors.primary.textSecondary} />
                    ) : (
                      <ChevronDown size={20} color={Colors.primary.textSecondary} />
                    )}
                  </View>
                </View>
                
                {showVolumeControl && (
                  <View style={styles.commandCardExpanded}>
                    {[
                      { action: t('max_volume'), example: t('max_volume_example') },
                      { action: t('mute'), example: t('mute_example') },
                      { action: t('unmute'), example: t('unmute_example') },
                      { action: t('volume_up'), example: t('volume_up_example') },
                      { action: t('volume_down'), example: t('volume_down_example') },
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
                style={styles.commandCard}
                onPress={() => setShowScreenControl(!showScreenControl)}
                activeOpacity={0.7}
              >
                <View style={styles.commandCardHeader}>
                  <View style={styles.commandIconWrapper}>
                    <Monitor size={22} color={Colors.accent.primary} />
                  </View>
                  <View style={styles.commandCardContent}>
                    <Text style={styles.commandCardTitle}>{t('screen_control')}</Text>
                    <Text style={styles.commandCardSubtitle}>2 {t('commands')}</Text>
                  </View>
                  <View style={styles.commandCardArrow}>
                    {showScreenControl ? (
                      <ChevronUp size={20} color={Colors.primary.textSecondary} />
                    ) : (
                      <ChevronDown size={20} color={Colors.primary.textSecondary} />
                    )}
                  </View>
                </View>
                
                {showScreenControl && (
                  <View style={styles.commandCardExpanded}>
                    {[
                      { action: t('fullscreen'), example: t('fullscreen_example') },
                      { action: t('exit_fullscreen'), example: t('exit_fullscreen_example') },
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
                style={styles.commandCard}
                onPress={() => setShowSpeedControl(!showSpeedControl)}
                activeOpacity={0.7}
              >
                <View style={styles.commandCardHeader}>
                  <View style={styles.commandIconWrapper}>
                    <Gauge size={22} color={Colors.accent.primary} />
                  </View>
                  <View style={styles.commandCardContent}>
                    <Text style={styles.commandCardTitle}>{t('playback_speed')}</Text>
                    <Text style={styles.commandCardSubtitle}>5 {t('commands')}</Text>
                  </View>
                  <View style={styles.commandCardArrow}>
                    {showSpeedControl ? (
                      <ChevronUp size={20} color={Colors.primary.textSecondary} />
                    ) : (
                      <ChevronDown size={20} color={Colors.primary.textSecondary} />
                    )}
                  </View>
                </View>
                
                {showSpeedControl && (
                  <View style={styles.commandCardExpanded}>
                    {[
                      { action: t('speed_0_5'), example: t('speed_0_5_example') },
                      { action: t('normal_speed'), example: t('normal_speed_example') },
                      { action: t('speed_1_25'), example: t('speed_1_25_example') },
                      { action: t('speed_1_5'), example: t('speed_1_5_example') },
                      { action: t('speed_2_0'), example: t('speed_2_0_example') },
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

        {videoSource && videoSource.uri && videoSource.uri.trim() !== '' && !isContentLoaded && (
          <View style={styles.voiceControlHeader}>
            <View style={styles.voiceControlIconCircle}>
              <Mic size={28} color={Colors.accent.primary} />
            </View>
            <Text style={styles.voiceControlHeaderTitle}>{t('voice_control')}</Text>
            <Text style={styles.voiceControlHeaderSubtitle}>{t('voice_control_instruction')}</Text>
          </View>
        )}

        {videoSource && videoSource.uri && videoSource.uri.trim() !== '' && (
          <PlayStationController
            onCrossPress={async () => {
              // Main button toggles Always Listen
              await toggleAlwaysListening();
            }}
            onCirclePress={async () => {
              // Circle button stops listening
              if (isVoiceActive || isVoiceListening) {
                await stopVoiceRecording();
              }
            }}
            onTrianglePress={togglePlayPause}
            onSquarePress={() => {
              if (videoPlayer) {
                videoPlayer.currentTime = 0;
                if (typeof videoPlayer.play === 'function') {
                  videoPlayer.play();
                }
              }
            }}
            containerHeight={Dimensions.get('window').height}
            isVoiceActive={alwaysListening || isVoiceListening}
          />
        )}

        {voiceStatus && typeof voiceStatus === 'string' && videoSource && videoSource.uri && videoSource.uri.trim() !== '' && (
          <View style={styles.floatingStatusBar}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{voiceStatus}</Text>
          </View>
        )}

        <Modal
          visible={showSiriSetup}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowSiriSetup(false)}
        >
          <View style={styles.siriSetupModal}>
            <View style={styles.siriSetupHeader}>
              <Text style={styles.siriSetupTitle}>{t('siri_shortcuts_setup')}</Text>
              <TouchableOpacity
                onPress={() => setShowSiriSetup(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.primary.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.siriSetupContent}>
              <View style={styles.siriSetupSection}>
                <View style={styles.siriFeatureCard}>
                  <View style={styles.siriFeatureIcon}>
                    <Mic size={32} color={Colors.accent.primary} />
                  </View>
                  <Text style={styles.siriFeatureTitle}>{t('dual_voice_control_system')}</Text>
                  <Text style={styles.siriFeatureDescription}>
                    {t('dual_voice_control_description')}
                  </Text>
                </View>
                
                <View style={styles.siriInstructions}>
                  <Text style={styles.siriInstructionsTitle}>{t('supported_voice_commands')}</Text>
                  <View style={styles.siriStep}>
                    <Text style={styles.siriStepNumber}>🎬</Text>
                    <Text style={styles.siriStepText}>{t('siri_playback_commands')}</Text>
                  </View>
                  <View style={styles.siriStep}>
                    <Text style={styles.siriStepNumber}>⏩</Text>
                    <Text style={styles.siriStepText}>{t('siri_progress_commands')}</Text>
                  </View>
                  <View style={styles.siriStep}>
                    <Text style={styles.siriStepNumber}>🔊</Text>
                    <Text style={styles.siriStepText}>{t('siri_volume_commands')}</Text>
                  </View>
                  <View style={styles.siriStep}>
                    <Text style={styles.siriStepNumber}>🖥️</Text>
                    <Text style={styles.siriStepText}>{t('siri_screen_commands')}</Text>
                  </View>
                  <View style={styles.siriStep}>
                    <Text style={styles.siriStepNumber}>⚡</Text>
                    <Text style={styles.siriStepText}>{t('siri_speed_commands')}</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.siriEnableButton}
                  onPress={() => {
                    setSiriEnabled(true);
                    setVoiceStatus('Siri 語音控制已啟用');
                    setShowSiriSetup(false);
                    setTimeout(() => setVoiceStatus(''), 3000);
                  }}
                >
                  <Text style={styles.siriEnableButtonText}>{t('enable_siri_voice_control')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>

        <Modal
          visible={showUrlModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowUrlModal(false)}
        >
          <View style={styles.urlModalContainer}>
            <View style={styles.urlModalHeader}>
              <Text style={styles.urlModalTitle}>{t('load_from_url')}</Text>
              <TouchableOpacity
                onPress={() => setShowUrlModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.primary.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.urlModalContent}>
              <Text style={styles.urlModalSubtitle}>{t('enter_video_url')}</Text>
              
              <View style={styles.urlModalInputGroup}>
                <Text style={styles.urlModalInputLabel}>{t('video_url')}</Text>
                <TextInput
                  style={styles.urlModalInput}
                  placeholder={t('video_url_placeholder')}
                  placeholderTextColor={Colors.primary.textSecondary}
                  value={videoUrl}
                  onChangeText={setVideoUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>

              <View style={styles.urlModalExamples}>
                <Text style={styles.urlModalExamplesTitle}>{t('example_formats')}</Text>
                <View style={styles.exampleItem}>
                  <Text style={styles.exampleBullet}>{'•'}</Text>
                  <Text style={styles.urlModalExampleItem}>Direct MP4: video.mp4</Text>
                </View>
                <View style={styles.exampleItem}>
                  <Text style={styles.exampleBullet}>{'•'}</Text>
                  <Text style={styles.urlModalExampleItem}>HLS Stream: stream.m3u8</Text>
                </View>
                <View style={styles.exampleItem}>
                  <Text style={styles.exampleBullet}>{'•'}</Text>
                  <Text style={styles.urlModalExampleItem}>YouTube: youtube.com/watch</Text>
                </View>
                <View style={styles.exampleItem}>
                  <Text style={styles.exampleBullet}>{'•'}</Text>
                  <Text style={styles.urlModalExampleItem}>Vimeo: vimeo.com/video</Text>
                </View>
                <View style={styles.exampleItem}>
                  <Text style={styles.exampleBullet}>{'•'}</Text>
                  <Text style={styles.urlModalExampleItem}>Adult sites (18+)</Text>
                </View>
                <View style={styles.exampleItem}>
                  <Text style={styles.exampleBullet}>{'•'}</Text>
                  <Text style={styles.urlModalExampleItem}>Social media videos</Text>
                </View>
              </View>

              <View style={styles.urlModalButtons}>
                <TouchableOpacity
                  style={styles.urlModalCancelButton}
                  onPress={() => {
                    setShowUrlModal(false);
                    setVideoUrl("");
                  }}
                >
                  <Text style={styles.urlModalCancelButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.urlModalLoadButton,
                    !videoUrl.trim() && styles.urlModalLoadButtonDisabled
                  ]}
                  onPress={() => {
                    loadVideoFromUrl();
                    setShowUrlModal(false);
                  }}
                  disabled={!videoUrl.trim()}
                >
                  <Text style={styles.urlModalLoadButtonText}>{t('load_video')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showCustomCommandModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCustomCommandModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('custom_voice_commands')}</Text>
              <TouchableOpacity
                onPress={() => setShowCustomCommandModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.primary.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.addCommandSection}>
                <Text style={styles.sectionTitle}>{t('custom_voice_commands')}</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('custom_command')}</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={t('custom_command_placeholder')}
                    placeholderTextColor={Colors.primary.textSecondary}
                    value={commandName}
                    onChangeText={setCommandName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('corresponding_action')}</Text>
                  <TouchableOpacity
                    style={styles.actionSelectorButton}
                    onPress={() => setShowCustomCommandActions(!showCustomCommandActions)}
                  >
                    <Text style={styles.actionSelectorText}>
                      {commandAction ? getActionLabel(commandAction) : t('select_action')}
                    </Text>
                    {showCustomCommandActions ? (
                      <ChevronUp size={16} color={Colors.primary.textSecondary} />
                    ) : (
                      <ChevronDown size={16} color={Colors.primary.textSecondary} />
                    )}
                  </TouchableOpacity>
                  
                  {showCustomCommandActions && (
                    <ScrollView style={styles.actionScrollView} nestedScrollEnabled={true}>
                      <View style={styles.actionCategory}>
                        <Text style={styles.actionCategoryTitle}>{t('playback_control')}</Text>
                        {[
                          { key: "play", label: t('play') },
                          { key: "pause", label: t('pause') },
                          { key: "stop", label: t('stop') },
                          { key: "next", label: t('next_video') },
                          { key: "previous", label: t('previous_video') },
                          { key: "restart", label: t('replay') },
                        ].map((action) => (
                          <TouchableOpacity
                            key={action.key}
                            style={[
                              styles.actionItem,
                              commandAction === action.key && styles.actionItemSelected,
                            ]}
                            onPress={() => {
                              setCommandAction(action.key);
                              setShowCustomCommandActions(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.actionItemText,
                                commandAction === action.key && styles.actionItemTextSelected,
                              ]}
                            >
                              {action.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      <View style={styles.actionCategory}>
                        <Text style={styles.actionCategoryTitle}>{t('progress_control')}</Text>
                        {[
                          { key: "forward_10", label: t('forward_10s') },
                          { key: "forward_20", label: t('forward_20s') },
                          { key: "forward_30", label: t('forward_30s') },
                          { key: "rewind_10", label: t('rewind_10s') },
                          { key: "rewind_20", label: t('rewind_20s') },
                          { key: "rewind_30", label: t('rewind_30s') },
                        ].map((action) => (
                          <TouchableOpacity
                            key={action.key}
                            style={[
                              styles.actionItem,
                              commandAction === action.key && styles.actionItemSelected,
                            ]}
                            onPress={() => {
                              setCommandAction(action.key);
                              setShowCustomCommandActions(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.actionItemText,
                                commandAction === action.key && styles.actionItemTextSelected,
                              ]}
                            >
                              {action.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      <View style={styles.actionCategory}>
                        <Text style={styles.actionCategoryTitle}>{t('volume_control')}</Text>
                        {[
                          { key: "volume_max", label: t('max_volume') },
                          { key: "mute", label: t('mute') },
                          { key: "unmute", label: t('unmute') },
                          { key: "volume_up", label: t('volume_up') },
                          { key: "volume_down", label: t('volume_down') },
                        ].map((action) => (
                          <TouchableOpacity
                            key={action.key}
                            style={[
                              styles.actionItem,
                              commandAction === action.key && styles.actionItemSelected,
                            ]}
                            onPress={() => {
                              setCommandAction(action.key);
                              setShowCustomCommandActions(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.actionItemText,
                                commandAction === action.key && styles.actionItemTextSelected,
                              ]}
                            >
                              {action.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      <View style={styles.actionCategory}>
                        <Text style={styles.actionCategoryTitle}>{t('screen_control')}</Text>
                        {[
                          { key: "fullscreen", label: t('fullscreen') },
                          { key: "exit_fullscreen", label: t('exit_fullscreen') },
                        ].map((action) => (
                          <TouchableOpacity
                            key={action.key}
                            style={[
                              styles.actionItem,
                              commandAction === action.key && styles.actionItemSelected,
                            ]}
                            onPress={() => {
                              setCommandAction(action.key);
                              setShowCustomCommandActions(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.actionItemText,
                                commandAction === action.key && styles.actionItemTextSelected,
                              ]}
                            >
                              {action.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      <View style={styles.actionCategory}>
                        <Text style={styles.actionCategoryTitle}>{t('playback_speed')}</Text>
                        {[
                          { key: "speed_0_5", label: t('speed_0_5') },
                          { key: "speed_normal", label: t('normal_speed') },
                          { key: "speed_1_25", label: t('speed_1_25') },
                          { key: "speed_1_5", label: t('speed_1_5') },
                          { key: "speed_2_0", label: t('speed_2_0') },
                        ].map((action) => (
                          <TouchableOpacity
                            key={action.key}
                            style={[
                              styles.actionItem,
                              commandAction === action.key && styles.actionItemSelected,
                            ]}
                            onPress={() => {
                              setCommandAction(action.key);
                              setShowCustomCommandActions(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.actionItemText,
                                commandAction === action.key && styles.actionItemTextSelected,
                              ]}
                            >
                              {action.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.addButton,
                    (!commandName.trim() || !commandAction) && styles.addButtonDisabled,
                  ]}
                  onPress={saveCustomCommand}
                  disabled={!commandName.trim() || !commandAction}
                >
                  <Plus size={20} color="white" />
                  <Text style={styles.addButtonText}>{t('add')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.savedCommandsSection}>
                <Text style={styles.sectionTitle}>{t('saved_commands')}</Text>
                {customCommands.length === 0 ? (
                  <Text style={styles.noCommandsText}>{t('no_custom_commands')}</Text>
                ) : (
                  <View style={styles.savedCommandsList}>
                    {customCommands.map((command) => (
                      <View key={command.id} style={styles.savedCommandItem}>
                        <View style={styles.savedCommandInfo}>
                          <Text style={styles.savedCommandName}>{command.name}</Text>
                          <Text style={styles.savedCommandAction}>{getActionLabel(command.action)}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteCommandButton}
                          onPress={() => deleteCustomCommand(command.id)}
                        >
                          <X size={16} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </Modal>
    </View>
  );
}

const createStyles = () => {
  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1024;
  const isLargeDesktop = screenWidth >= 1440;
  
  const getResponsiveSize = (mobile: number, tablet: number, desktop: number, largeDesktop?: number) => {
    if (isLargeDesktop && largeDesktop) return largeDesktop;
    if (isDesktop) return desktop;
    if (isTablet) return tablet;
    return mobile;
  };
  
  const getResponsiveFontSize = (base: number) => {
    if (isLargeDesktop) return Math.round(base * 1.3);
    if (isDesktop) return Math.round(base * 1.15);
    if (isTablet) return Math.round(base * 1.05);
    return base;
  };
  
  const getResponsivePadding = (base: number) => {
    if (isLargeDesktop) return base * 2;
    if (isDesktop) return base * 1.5;
    if (isTablet) return base * 1.25;
    return base;
  };
  
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    width: "100%",
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primary.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    textAlign: "center",
  },
  videoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },

  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "space-between",
    padding: 16,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  videoTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600" as const,
    flex: 1,
    marginRight: 12,
  },
  centerControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 40,
    padding: 12,
  },
  bottomControls: {
    gap: 12,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeText: {
    color: "white",
    fontSize: 12,
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.accent.primary,
    borderRadius: 2,
  },
  bottomButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  speedSelector: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  speedText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  placeholderContainer: {
    width: "100%",
    height: getResponsiveSize(520, 600, 700),
    backgroundColor: Colors.secondary.bg,
    borderRadius: getResponsiveSize(12, 16, 20),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: getResponsiveSize(20, 24, 28),
    borderWidth: 2,
    borderColor: Colors.card.border,
    borderStyle: "dashed",
  },

  voiceControlSection: {
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 8,
  },
  voiceButtonContainer: {
    marginBottom: 16,
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  voiceButtonActive: {
    backgroundColor: Colors.danger,
  },
  voiceStatusSection: {
    alignItems: "center",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary.textSecondary,
  },
  statusDotActive: {
    backgroundColor: Colors.accent.primary,
  },
  voiceHint: {
    color: Colors.primary.text,
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 6,
  },
  supportedCommands: {
    color: Colors.primary.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
  speedIcon: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  successMessage: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  successTitle: {
    color: Colors.primary.text,
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  successSubtitle: {
    color: Colors.primary.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  voiceStatusContainer: {
    backgroundColor: Colors.secondary.bg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: "center",
  },
  voiceStatusText: {
    color: Colors.accent.primary,
    fontSize: 14,
  },
  uploadSection: {
    marginBottom: 32,
    marginHorizontal: 4,
  },
  uploadContainer: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.card.border,
    borderStyle: "dashed",
  },
  uploadTitle: {
    color: Colors.primary.text,
    fontSize: getResponsiveSize(14, 15, 16),
    fontWeight: "600" as const,
    marginTop: 12,
    marginBottom: 6,
    textAlign: "center",
  },
  uploadSubtitle: {
    color: Colors.primary.textSecondary,
    fontSize: getResponsiveSize(13, 14, 15),
    textAlign: "center",
  },
  urlSection: {
    marginBottom: 32,
    marginHorizontal: 4,
  },
  urlInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary.bg,
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.card.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  urlIcon: {
    marginRight: 12,
  },
  urlInput: {
    flex: 1,
    paddingVertical: getResponsiveSize(12, 14, 16),
    color: Colors.primary.text,
    fontSize: getResponsiveSize(13, 14, 15),
  },
  loadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: Colors.accent.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadButtonDisabled: {
    backgroundColor: Colors.primary.textSecondary,
    opacity: 0.5,
  },
  loadButtonText: {
    color: "white",
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: "600" as const,
  },
  loadButtonTextDisabled: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  supportedFormats: {
    color: Colors.primary.textSecondary,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  commandsSection: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: getResponsiveSize(12, 16, 20),
    marginBottom: getResponsiveSize(12, 16, 20),
    marginHorizontal: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  commandsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: getResponsiveSize(15, 18, 20),
    backgroundColor: Colors.card.bg,
  },
  commandsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  commandsTitle: {
    color: Colors.primary.text,
    fontSize: getResponsiveSize(14, 15, 16),
    fontWeight: "600" as const,
  },
  commandsList: {
    padding: 16,
  },
  commandCategory: {
    marginBottom: 20,
  },
  categoryTitle: {
    color: Colors.accent.primary,
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: "600" as const,
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  commandItems: {
    gap: 8,
  },
  commandItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
  },
  commandAction: {
    color: Colors.primary.text,
    fontSize: getResponsiveSize(13, 14, 15),
  },
  commandExample: {
    color: Colors.primary.textSecondary,
    fontSize: getResponsiveSize(11, 12, 13),
    backgroundColor: Colors.card.bg,
    paddingHorizontal: getResponsiveSize(6, 8, 10),
    paddingVertical: getResponsiveSize(2, 3, 4),
    borderRadius: getResponsiveSize(4, 6, 8),
  },
  customCommandItem: {
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
    backgroundColor: Colors.secondary.bg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.primary.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  addCommandSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...DesignTokens.typography.title.medium,
    color: Colors.primary.text,
    marginBottom: DesignTokens.spacing.md,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.primary.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  actionSelector: {
    marginBottom: 8,
    maxHeight: 50,
  },
  actionScrollContent: {
    paddingHorizontal: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  actionButton: {
    backgroundColor: Colors.secondary.bg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  actionButtonSelected: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  actionButtonText: {
    color: Colors.primary.text,
    fontSize: 14,
    fontWeight: "500" as const,
  },
  actionButtonTextSelected: {
    color: "white",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  addButtonDisabled: {
    backgroundColor: Colors.primary.textSecondary,
    opacity: 0.5,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  savedCommandsSection: {
    marginBottom: 32,
  },
  noCommandsText: {
    color: Colors.primary.textSecondary,
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 16,
  },
  savedCommandsList: {
    gap: 12,
  },
  savedCommandItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.secondary.bg,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  savedCommandInfo: {
    flex: 1,
  },
  savedCommandName: {
    color: Colors.primary.text,
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  savedCommandAction: {
    color: Colors.primary.textSecondary,
    fontSize: 14,
  },
  deleteCommandButton: {
    padding: 8,
  },
  actionSelectorButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
    marginBottom: 8,
  },
  actionSelectorText: {
    color: Colors.primary.text,
    fontSize: 16,
  },
  actionScrollView: {
    maxHeight: 300,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
    marginBottom: 8,
  },
  actionCategory: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
  },
  actionCategoryTitle: {
    color: Colors.accent.primary,
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  actionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  actionItemSelected: {
    backgroundColor: Colors.accent.primary,
  },
  actionItemText: {
    color: Colors.primary.text,
    fontSize: 14,
  },
  actionItemTextSelected: {
    color: "white",
  },
  
  modernHeader: {
    marginBottom: 32,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  modernTitle: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: "600" as const,
    color: Colors.primary.text,
    textAlign: "center",
    marginBottom: 6,
  },
  modernSubtitle: {
    fontSize: getResponsiveSize(13, 14, 15),
    color: Colors.primary.textSecondary,
    textAlign: "center",
    fontWeight: "500" as const,
  },
  
  dualVoiceHub: {
    marginBottom: getResponsiveSize(24, 28, 32),
    gap: getResponsiveSize(16, 20, 24),
  },
  
  siriCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: getResponsiveSize(16, 20, 24),
    padding: getResponsiveSize(20, 24, 28),
    borderWidth: 1,
    borderColor: Colors.card.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  siriCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  siriIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.primary + '15',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  siriCardContent: {
    flex: 1,
  },
  siriCardTitle: {
    fontSize: getResponsiveSize(15, 16, 17),
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 4,
  },
  siriCardStatus: {
    fontSize: getResponsiveSize(13, 14, 15),
    color: Colors.accent.primary,
    fontWeight: "500" as const,
  },
  siriStatusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent.primary,
  },
  siriQuickActions: {
    flexDirection: "row",
    gap: 12,
  },
  siriQuickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.accent.primary + '10',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accent.primary + '20',
  },
  siriQuickActionText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.accent.primary,
  },
  
  appVoiceCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: getResponsiveSize(16, 20, 24),
    padding: getResponsiveSize(20, 24, 28),
    borderWidth: 1,
    borderColor: Colors.card.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  appVoiceHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  appVoiceTitle: {
    fontSize: getResponsiveSize(15, 16, 17),
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 6,
    textAlign: "center",
  },
  appVoiceSubtitle: {
    fontSize: getResponsiveSize(13, 14, 15),
    color: Colors.primary.textSecondary,
    textAlign: "center",
    fontWeight: "500" as const,
  },
  floatingVoiceControl: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  floatingStatusBar: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 999,
  },
  voiceControlCenter: {
    alignItems: "center",
    marginBottom: 24,
  },
  voiceControlInfo: {
    alignItems: "center",
    marginTop: 16,
  },
  statusIndicators: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  voiceControlStatus: {
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: "600" as const,
    color: Colors.primary.text,
    textAlign: "center",
  },
  quickVoiceActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  quickVoiceAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.card.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  quickVoiceActionActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  quickVoiceActionText: {
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: "600" as const,
    color: Colors.primary.textSecondary,
  },
  quickVoiceActionTextActive: {
    color: "white",
  },
  
  modernVoiceButton: {
    width: getResponsiveSize(56, 64, 72),
    height: getResponsiveSize(56, 64, 72),
    borderRadius: getResponsiveSize(28, 32, 36),
    backgroundColor: Colors.accent.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: "relative",
  },
  modernVoiceButtonActive: {
    backgroundColor: Colors.danger,
    shadowColor: Colors.danger,
  },
  voiceButtonInner: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  quickActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.card.bg,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  quickActionButtonActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.primary.textSecondary,
  },
  quickActionTextActive: {
    color: "white",
  },
  
  siriSetupModal: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  siriSetupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
    backgroundColor: Colors.secondary.bg,
  },
  siriSetupTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primary.text,
  },
  siriSetupContent: {
    flex: 1,
    padding: 20,
  },
  siriSetupSection: {
    flex: 1,
  },
  siriFeatureCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  siriFeatureIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent.primary + '20',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  siriFeatureTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.primary.text,
    marginBottom: 12,
    textAlign: "center",
  },
  siriFeatureDescription: {
    fontSize: 16,
    color: Colors.primary.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  siriInstructions: {
    marginBottom: 32,
  },
  siriInstructionsTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 16,
  },
  siriStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  siriStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent.primary,
    color: "white",
    fontSize: 16,
    fontWeight: "700" as const,
    textAlign: "center",
    lineHeight: 32,
    marginRight: 16,
  },
  siriStepText: {
    flex: 1,
    fontSize: 16,
    color: Colors.primary.text,
    lineHeight: 22,
  },
  siriEnableButton: {
    backgroundColor: Colors.accent.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  siriEnableButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "white",
  },
  
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.primary + '15',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  alwaysListenCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.secondary.bg,
    borderRadius: getResponsiveSize(20, 22, 24),
    padding: getResponsivePadding(DesignTokens.spacing.lg),
    marginBottom: getResponsivePadding(DesignTokens.spacing.lg),
    borderWidth: 1,
    borderColor: Colors.card.border,
    ...DesignTokens.shadows.sm,
  },
  alwaysListenContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  alwaysListenIcon: {
    width: getResponsiveSize(40, 48, 56),
    height: getResponsiveSize(40, 48, 56),
    borderRadius: getResponsiveSize(20, 24, 28),
    backgroundColor: Colors.card.bg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: getResponsivePadding(DesignTokens.spacing.md),
  },
  alwaysListenText: {
    flex: 1,
  },
  alwaysListenTitle: {
    fontSize: getResponsiveFontSize(17),
    fontWeight: "600" as const,
    lineHeight: getResponsiveFontSize(24),
    color: Colors.primary.text,
  },
  alwaysListenSubtitle: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
  },
  voiceButtonSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  mainVoiceButton: {
    width: getResponsiveSize(94, 112, 130, 150),
    height: getResponsiveSize(94, 112, 130, 150),
    borderRadius: getResponsiveSize(47, 56, 65, 75),
    backgroundColor: '#69E7D8',
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#69E7D8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  mainVoiceButtonActive: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
  },
  voiceButtonHint: {
    fontSize: getResponsiveFontSize(17),
    fontWeight: "600" as const,
    lineHeight: getResponsiveFontSize(24),
    color: Colors.primary.text,
    marginTop: getResponsivePadding(DesignTokens.spacing.md),
    textAlign: "center",
  },
  membershipCard: {
    backgroundColor: "#E0F7F4",
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.accent.primary + '20',
  },
  membershipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  membershipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  membershipBadgeIcon: {
    fontSize: 20,
  },
  membershipBadgeText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary.text,
  },
  trialBadge: {
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trialBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "white",
  },
  usageSection: {
    marginBottom: 16,
  },
  usageLabel: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    marginBottom: 4,
  },
  usageValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.primary.text,
  },
  upgradeText: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    marginBottom: 12,
    textAlign: "center",
  },
  planButtons: {
    flexDirection: "row",
    gap: 12,
  },
  basicButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FF9F0A",
    paddingVertical: 12,
    borderRadius: 12,
  },
  basicButtonIcon: {
    fontSize: 16,
  },
  basicButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "white",
  },
  premiumButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#BF5AF2",
    paddingVertical: 12,
    borderRadius: 12,
  },
  premiumButtonIcon: {
    fontSize: 16,
  },
  premiumButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "white",
  },
  customCommandsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  customCommandsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent.primary + '15',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  customCommandsTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.primary.text,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  card1Container: {
    marginBottom: DesignTokens.spacing.xl,
  },
  card2Container: {
    marginBottom: DesignTokens.spacing.xl,
  },
  card3Container: {
    marginBottom: DesignTokens.spacing.xl,
  },
  videoSelectionOverlay: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: Colors.primary.bg,
  },
  videoSelectionCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: getResponsiveSize(24, 28, 32),
    padding: getResponsivePadding(DesignTokens.spacing.xl),
    alignItems: "center",
    width: '100%',
    maxWidth: getResponsiveSize(400, 500, 600),
    borderWidth: 2,
    borderColor: Colors.card.border,
    borderStyle: "dashed",
  },
  videoSelectionIcon: {
    width: getResponsiveSize(88, 104, 120),
    height: getResponsiveSize(88, 104, 120),
    borderRadius: getResponsiveSize(44, 52, 60),
    backgroundColor: Colors.accent.primary + '15',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: getResponsivePadding(DesignTokens.spacing.lg),
  },
  videoSelectionTitle: {
    fontSize: getResponsiveFontSize(22),
    fontWeight: '600' as const,
    lineHeight: getResponsiveFontSize(28),
    color: Colors.primary.text,
    textAlign: "center",
    marginBottom: getResponsivePadding(DesignTokens.spacing.sm),
  },
  videoSelectionSubtitle: {
    fontSize: getResponsiveFontSize(15),
    fontWeight: '400' as const,
    lineHeight: getResponsiveFontSize(22),
    color: Colors.primary.textSecondary,
    textAlign: "center",
    marginBottom: getResponsivePadding(DesignTokens.spacing.lg),
    paddingHorizontal: getResponsivePadding(8),
  },
  selectVideoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DesignTokens.spacing.sm,
    backgroundColor: '#69E7D8',
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.borderRadius.lg,
    marginBottom: DesignTokens.spacing.md,
    width: "100%",
    ...DesignTokens.shadows.md,
  },
  selectVideoButtonText: {
    ...DesignTokens.typography.body.large,
    fontWeight: "600" as const,
    color: "white",
  },
  loadUrlButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DesignTokens.spacing.sm,
    backgroundColor: Colors.card.bg,
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.borderRadius.lg,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  loadUrlButtonText: {
    ...DesignTokens.typography.body.large,
    fontWeight: "600" as const,
    color: Colors.accent.primary,
  },
  
  youtubePlatformBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: DesignTokens.spacing.md,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#FF0000',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  youtubeLogo: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  youtubePlatformText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
    paddingVertical: 20,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent.primary + '15',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.primary.text,
    marginBottom: 8,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.primary.textSecondary,
    textAlign: "center",
    fontWeight: "500" as const,
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: '#fff',
  },
  voiceButtonWrapper: {
    marginBottom: 8,
  },
  voiceButtonInnerCircle: {
    justifyContent: "center",
    alignItems: "center",
  },
  voiceStatusLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: '#fff',
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  alwaysListenToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.secondary.bg,
    borderRadius: 16,
    padding: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.card.border,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  toggleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.card.bg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  toggleIconActive: {
    backgroundColor: Colors.accent.primary + '15',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary.text,
  },
  
  urlModalContainer: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  urlModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
    backgroundColor: Colors.secondary.bg,
  },
  urlModalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primary.text,
  },
  urlModalContent: {
    flex: 1,
    padding: 24,
  },
  urlModalSubtitle: {
    fontSize: 16,
    color: Colors.primary.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  urlModalInputGroup: {
    marginBottom: 24,
  },
  urlModalInputLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 12,
  },
  urlModalInput: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.primary.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  urlModalExamples: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  urlModalExamplesTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 12,
  },
  urlModalExampleItem: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  exampleItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 6,
  },
  exampleBullet: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    marginRight: 8,
    lineHeight: 20,
  },
  urlModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  urlModalCancelButton: {
    flex: 1,
    backgroundColor: Colors.secondary.bg,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  urlModalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary.text,
  },
  urlModalLoadButton: {
    flex: 1,
    backgroundColor: Colors.accent.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  urlModalLoadButtonDisabled: {
    backgroundColor: Colors.primary.textSecondary,
    opacity: 0.5,
  },
  urlModalLoadButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "white",
  },
  statsCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: getResponsiveSize(24, 28, 32),
    padding: getResponsivePadding(DesignTokens.spacing.lg),
    marginBottom: 0,
    borderWidth: 1,
    borderColor: Colors.card.border,
    ...DesignTokens.shadows.sm,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignTokens.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: getResponsiveFontSize(34),
    fontWeight: '700' as const,
    lineHeight: getResponsiveFontSize(40),
    color: Colors.primary.text,
    marginBottom: getResponsivePadding(DesignTokens.spacing.xs),
  },
  statLabel: {
    fontSize: getResponsiveFontSize(13),
    fontWeight: '400' as const,
    lineHeight: getResponsiveFontSize(20),
    color: Colors.primary.textSecondary,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.card.border,
  },
  progressBarContainer: {
    marginBottom: DesignTokens.spacing.lg,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.card.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.accent.primary,
    borderRadius: 4,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DesignTokens.spacing.sm,
    backgroundColor: Colors.card.bg,
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.accent.primary,
  },
  upgradeButtonText: {
    ...DesignTokens.typography.body.large,
    fontWeight: "600" as const,
    color: Colors.accent.primary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: DesignTokens.spacing.lg,
  },
  addCommandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing.xs,
    backgroundColor: Colors.accent.primary + '15',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.borderRadius.lg,
  },
  addCommandText: {
    ...DesignTokens.typography.body.medium,
    fontWeight: "600" as const,
    color: Colors.accent.primary,
  },
  commandCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: getResponsiveSize(20, 22, 24),
    marginBottom: getResponsivePadding(DesignTokens.spacing.md),
    borderWidth: 1,
    borderColor: Colors.card.border,
    overflow: "hidden",
    ...DesignTokens.shadows.sm,
  },
  commandCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: DesignTokens.spacing.lg,
  },
  commandIconWrapper: {
    width: getResponsiveSize(44, 52, 60),
    height: getResponsiveSize(44, 52, 60),
    borderRadius: getResponsiveSize(22, 26, 30),
    backgroundColor: Colors.accent.primary + '15',
    justifyContent: "center",
    alignItems: "center",
    marginRight: getResponsivePadding(DesignTokens.spacing.md),
  },
  commandCardContent: {
    flex: 1,
  },
  commandCardTitle: {
    fontSize: getResponsiveFontSize(17),
    fontWeight: "600" as const,
    lineHeight: getResponsiveFontSize(24),
    color: Colors.primary.text,
    marginBottom: getResponsivePadding(DesignTokens.spacing.xs),
  },
  commandCardSubtitle: {
    fontSize: getResponsiveFontSize(13),
    fontWeight: '400' as const,
    lineHeight: getResponsiveFontSize(20),
    color: Colors.primary.textSecondary,
  },
  commandCardArrow: {
    marginLeft: DesignTokens.spacing.sm,
  },
  commandCardExpanded: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.lg,
    paddingTop: DesignTokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.card.border,
  },
  commandRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.md,
  },
  commandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.primary,
  },
  commandText: {
    flex: 1,
    ...DesignTokens.typography.body.medium,
    color: Colors.primary.text,
    fontWeight: "500" as const,
  },
  commandBadge: {
    ...DesignTokens.typography.caption.large,
    color: Colors.primary.textSecondary,
    backgroundColor: Colors.card.bg,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.borderRadius.sm,
    fontWeight: "500" as const,
  },
  headerBar: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 1001,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    textAlign: 'center' as const,
  },
  voiceControlHeader: {
    position: 'absolute' as const,
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center' as const,
    zIndex: 998,
    paddingHorizontal: 24,
  },
  voiceControlIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.accent.primary,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  voiceControlHeaderTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  voiceControlHeaderSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center' as const,
    paddingHorizontal: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  voiceControlHeaderNonVideo: {
    alignItems: 'center' as const,
    marginBottom: DesignTokens.spacing.xl,
  },
  micIconCircleNonVideo: {
    width: getResponsiveSize(64, 72, 80, 96),
    height: getResponsiveSize(64, 72, 80, 96),
    borderRadius: getResponsiveSize(32, 36, 40, 48),
    backgroundColor: Colors.accent.primary + '15',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: getResponsivePadding(DesignTokens.spacing.md),
  },
  voiceControlHeaderTitleNonVideo: {
    fontSize: getResponsiveFontSize(28),
    fontWeight: '600' as const,
    lineHeight: getResponsiveFontSize(34),
    color: Colors.primary.text,
    textAlign: 'center' as const,
    marginBottom: getResponsivePadding(DesignTokens.spacing.sm),
  },
  voiceControlHeaderSubtitleNonVideo: {
    fontSize: getResponsiveFontSize(17),
    fontWeight: '400' as const,
    lineHeight: getResponsiveFontSize(24),
    color: Colors.primary.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 0,
    paddingHorizontal: getResponsivePadding(16),
  },

  });
};

const styles = createStyles();
