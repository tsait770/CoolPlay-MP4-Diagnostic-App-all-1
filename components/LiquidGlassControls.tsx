import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Gauge,
} from 'lucide-react-native';

export interface LiquidGlassControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackRate: number;
  volume: number;
  onPlayPause: () => void;
  onSeekForward: (seconds: number) => void;
  onSeekBackward: (seconds: number) => void;
  onMuteToggle: () => void;
  onVolumeChange: (volume: number) => void;
  onFullscreenToggle: () => void;
  onPlaybackRateChange: (rate: number) => void;
  visible?: boolean;
}

export default function LiquidGlassControls({
  isPlaying,
  isMuted,
  isFullscreen,
  playbackRate,
  volume,
  onPlayPause,
  onSeekForward,
  onSeekBackward,
  onMuteToggle,
  onVolumeChange,
  onFullscreenToggle,
  onPlaybackRateChange,
  visible = true,
}: LiquidGlassControlsProps) {
  if (!visible) return null;

  const playbackRates = [0.5, 1.0, 1.25, 1.5, 2.0];
  const currentRateIndex = playbackRates.indexOf(playbackRate);
  const nextRate = playbackRates[(currentRateIndex + 1) % playbackRates.length];

  return (
    <View style={styles.overlay}>
      <View style={styles.liquidGlassContainer}>
        <View style={[styles.glassPanel, styles.centerPanel]}>
          <TouchableOpacity
            style={styles.seekButton}
            onPress={() => onSeekBackward(10)}
            activeOpacity={0.7}
          >
            <SkipBack size={28} color="#fff" />
            <Text style={styles.seekText}>10s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={onPlayPause}
            activeOpacity={0.7}
          >
            {isPlaying ? (
              <Pause size={52} color="#fff" fill="#fff" />
            ) : (
              <Play size={52} color="#fff" fill="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.seekButton}
            onPress={() => onSeekForward(10)}
            activeOpacity={0.7}
          >
            <SkipForward size={28} color="#fff" />
            <Text style={styles.seekText}>10s</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.glassPanel, styles.bottomPanel]}>
          <TouchableOpacity
            style={styles.bottomButton}
            onPress={onMuteToggle}
            activeOpacity={0.7}
          >
            {isMuted ? (
              <VolumeX size={24} color="#fff" />
            ) : (
              <Volume2 size={24} color="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomButton}
            onPress={() => onPlaybackRateChange(nextRate)}
            activeOpacity={0.7}
          >
            <Gauge size={24} color="#fff" />
            <Text style={styles.rateText}>{playbackRate}x</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomButton}
            onPress={onFullscreenToggle}
            activeOpacity={0.7}
          >
            {isFullscreen ? (
              <Minimize size={24} color="#fff" />
            ) : (
              <Maximize size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  liquidGlassContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    padding: 24,
    pointerEvents: 'box-none',
  },
  glassPanel: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(33, 33, 33, 0.25)',
      },
      default: {
        backgroundColor: 'rgba(33, 33, 33, 0.75)',
      },
    }),
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#e81cff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderStyle: 'solid',
    position: 'relative',
  },
  centerPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignSelf: 'center',
    borderRadius: 24,
  },
  bottomPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  playButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(232, 28, 255, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(232, 28, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e81cff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  seekButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  seekText: {
    color: '#fff',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(64, 201, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(64, 201, 255, 0.3)',
  },
  rateText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
