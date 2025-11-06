import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Dimensions,
  Text,
} from 'react-native';
import {
  Play,
  Pause,
  Mic,
  Volume2,
  VolumeX,
  Volume1,
  Volume,
} from 'lucide-react-native';

interface PlayStationControllerProps {
  onPlayPausePress?: () => void;
  onVoicePress?: () => void;
  onVolumePress?: () => void;
  onSpeedPress?: () => void;
  onVolumeLongPress?: () => void;
  onSpeedLongPress?: () => void;
  initialPosition?: { x: number; y: number };
  containerHeight?: number;
  isVoiceActive?: boolean;
  isPlaying?: boolean;
  currentVolume?: number;
  currentSpeed?: number;
  isVisible?: boolean;
  opacity?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PlayStationController({
  onPlayPausePress,
  onVoicePress,
  onVolumePress,
  onSpeedPress,
  onVolumeLongPress,
  onSpeedLongPress,
  initialPosition,
  containerHeight = SCREEN_HEIGHT,
  isVoiceActive = false,
  isPlaying = false,
  currentVolume = 1.0,
  currentSpeed = 1.0,
  isVisible = true,
  opacity = 0.9,
}: PlayStationControllerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Default position: bottom right corner, above toolbar
  const defaultX = SCREEN_WIDTH - 110;
  const defaultY = containerHeight - 140;
  
  const pan = useRef(
    new Animated.ValueXY({
      x: initialPosition?.x ?? defaultX,
      y: initialPosition?.y ?? defaultY,
    })
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  const handleButtonPress = (button: string, callback?: () => void) => {
    setActiveButton(button);
    callback?.();
    setTimeout(() => setActiveButton(null), 200);
  };

  const handleButtonLongPress = (button: string, callback?: () => void) => {
    setActiveButton(button);
    callback?.();
    setTimeout(() => setActiveButton(null), 300);
  };

  // Breathing animation for voice button
  useEffect(() => {
    if (isVoiceActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
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

  const getVolumeIcon = () => {
    if (currentVolume === 0) return VolumeX;
    if (currentVolume < 0.3) return Volume;
    if (currentVolume < 0.7) return Volume1;
    return Volume2;
  };

  const getContainerSize = () => {
    return isExpanded ? 145.6 : 90;
  };

  const getButtonSize = () => {
    return isExpanded ? 44.8 : 0;
  };

  const size = getContainerSize();
  const buttonSize = getButtonSize();

  if (!isVisible) return null;

  const VolumeIcon = getVolumeIcon();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          width: size,
          height: size,
          opacity: opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setIsExpanded(!isExpanded)}
        style={[
          styles.mainButton,
          { width: size, height: size },
        ]}
      >
        <View style={styles.innerCircle}>
          <View style={styles.centerDot} />
        </View>
      </TouchableOpacity>

      {/* Bottom Button - Voice Control */}
      {isExpanded && (
        <Animated.View
          style={[
            styles.buttonContainer,
            styles.crossButton,
            {
              width: buttonSize,
              height: buttonSize,
              opacity: isExpanded ? 1 : 0,
              transform: [{ scale: isVoiceActive ? pulseAnim : 1 }],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              activeButton === 'voice' && styles.activeButton,
              isVoiceActive && styles.voiceActiveButton,
            ]}
            onPress={() => handleButtonPress('voice', onVoicePress)}
            activeOpacity={0.8}
          >
            <Mic size={20} color={isVoiceActive ? '#69E7D8' : '#fff'} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Right Button - Speed Control */}
      {isExpanded && (
        <Animated.View
          style={[
            styles.buttonContainer,
            styles.circleButton,
            {
              width: buttonSize,
              height: buttonSize,
              opacity: isExpanded ? 1 : 0,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              activeButton === 'speed' && styles.activeButton,
            ]}
            onPress={() => handleButtonPress('speed', onSpeedPress)}
            onLongPress={() => handleButtonLongPress('speed', onSpeedLongPress)}
            activeOpacity={0.8}
          >
            <Text style={styles.speedText}>{currentSpeed}x</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Top Button - Play/Pause */}
      {isExpanded && (
        <Animated.View
          style={[
            styles.buttonContainer,
            styles.triangleButton,
            {
              width: buttonSize,
              height: buttonSize,
              opacity: isExpanded ? 1 : 0,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              activeButton === 'play' && styles.activeButton,
            ]}
            onPress={() => handleButtonPress('play', onPlayPausePress)}
            activeOpacity={0.8}
          >
            {isPlaying ? (
              <Pause size={20} color="#fff" fill="#fff" />
            ) : (
              <Play size={20} color="#fff" fill="#fff" />
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Left Button - Volume Control */}
      {isExpanded && (
        <Animated.View
          style={[
            styles.buttonContainer,
            styles.squareButton,
            {
              width: buttonSize,
              height: buttonSize,
              opacity: isExpanded ? 1 : 0,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              activeButton === 'volume' && styles.activeButton,
            ]}
            onPress={() => handleButtonPress('volume', onVolumePress)}
            onLongPress={() => handleButtonLongPress('volume', onVolumeLongPress)}
            activeOpacity={0.8}
          >
            <VolumeIcon size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
  },
  mainButton: {
    borderRadius: 999,
    backgroundColor: '#212121',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#969696',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 8,
  },
  innerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerDot: {
    width: 5.6,
    height: 5.6,
    borderRadius: 2.8,
    backgroundColor: '#323232',
  },
  voiceActiveButton: {
    shadowColor: '#69E7D8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 12,
  },
  speedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  buttonContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossButton: {
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -22.4 }],
  },
  circleButton: {
    top: '50%',
    right: 0,
    transform: [{ translateY: -22.4 }],
  },
  triangleButton: {
    top: 0,
    left: '50%',
    transform: [{ translateX: -22.4 }],
  },
  squareButton: {
    top: '50%',
    left: 0,
    transform: [{ translateY: -22.4 }],
  },
  actionButton: {
    width: 39.2,
    height: 39.2,
    borderRadius: 19.6,
    backgroundColor: '#323232',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderTopColor: '#969696',
    borderBottomColor: '#000',
    borderLeftColor: '#555',
    borderRightColor: '#555',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 4,
  },
  activeButton: {
    transform: [{ scale: 0.95 }],
    shadowOffset: { width: 0, height: 0 },
  },

});
