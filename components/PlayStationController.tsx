import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Play, Pause, Mic, Volume2, FastForward } from 'lucide-react-native';

interface PlayStationControllerProps {
  onPlayPress?: () => void;
  onVoicePress?: () => void;
  onVolumeDownPress?: () => void;
  onSpeedUpPress?: () => void;
  initialPosition?: { x: number; y: number };
  containerHeight?: number;
  isPlaying?: boolean;
  isVoiceActive?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PlayStationController({
  onPlayPress,
  onVoicePress,
  onVolumeDownPress,
  onSpeedUpPress,
  initialPosition,
  containerHeight = SCREEN_HEIGHT,
  isPlaying = false,
  isVoiceActive = false,
}: PlayStationControllerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  
  // 默認位置：右下角，覆蓋在工具列上方，留出安全距離
  const defaultX = SCREEN_WIDTH - 90; // 減少邊距以確保可見
  const defaultY = containerHeight - 140; // 調整Y位置確保在工具列上方可見
  
  const pan = useRef(
    new Animated.ValueXY({
      x: initialPosition?.x ?? defaultX,
      y: initialPosition?.y ?? defaultY,
    })
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // 只有在移動超過一定距離時才激活拖動
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        
        // 確保控制器不會移出屏幕
        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;
        const size = getContainerSize();
        
        let newX = currentX;
        let newY = currentY;
        
        // 邊界檢查
        if (currentX < 0) newX = 0;
        if (currentX > SCREEN_WIDTH - size) newX = SCREEN_WIDTH - size;
        if (currentY < 0) newY = 0;
        if (currentY > containerHeight - size) newY = containerHeight - size;
        
        if (newX !== currentX || newY !== currentY) {
          Animated.spring(pan, {
            toValue: { x: newX, y: newY },
            useNativeDriver: false,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  const handleButtonPress = (button: string, callback?: () => void) => {
    setActiveButton(button);
    callback?.();
    setTimeout(() => setActiveButton(null), 200);
  };

  // 縮小3分之一尺寸
  const getContainerSize = () => {
    return isExpanded ? 139 : 67;
  };

  const getButtonSize = () => {
    return isExpanded ? 43 : 0;
  };

  // 語音控制呼吸動畫
  const breathAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isVoiceActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(breathAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      breathAnim.setValue(1);
    }
  }, [isVoiceActive]);

  const size = getContainerSize();
  const buttonSize = getButtonSize();

  console.log('[PlayStationController] Rendering at position:', {
    x: (pan.x as any)._value,
    y: (pan.y as any)._value,
    size,
    isExpanded,
    containerHeight,
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          width: size,
          height: size,
        },
      ]}
      {...panResponder.panHandlers}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setIsExpanded(!isExpanded)}
        style={[styles.mainButton, { width: size, height: size }]}
      >
        <View style={styles.innerCircle}>
          {/* Center decorative element */}
          <View style={styles.centerDot} />
        </View>
      </TouchableOpacity>

      {/* Voice Button (Bottom - with breathing animation) */}
      {isExpanded && (
        <Animated.View
          style={[
            styles.buttonContainer,
            styles.crossButton,
            {
              width: buttonSize,
              height: buttonSize,
              opacity: isExpanded ? 1 : 0,
              transform: [{ scale: isVoiceActive ? breathAnim : 1 }],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.voiceButton,
              activeButton === 'voice' && styles.activeButton,
              isVoiceActive && styles.voiceActiveButton,
            ]}
            onPress={() => handleButtonPress('voice', onVoicePress)}
            activeOpacity={0.8}
          >
            <Mic size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Speed Up Button (Right - Fast Forward 1.5x) */}
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
              styles.speedButton,
              activeButton === 'speed' && styles.activeButton,
            ]}
            onPress={() => handleButtonPress('speed', onSpeedUpPress)}
            activeOpacity={0.8}
          >
            <FastForward size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Play Button (Top) */}
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
              styles.playButton,
              activeButton === 'play' && styles.activeButton,
            ]}
            onPress={() => handleButtonPress('play', onPlayPress)}
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

      {/* Volume Down Button (Left) */}
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
              styles.volumeButton,
              activeButton === 'volume' && styles.activeButton,
            ]}
            onPress={() => handleButtonPress('volume', onVolumeDownPress)}
            activeOpacity={0.8}
          >
            <Volume2 size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10000, // 提高 z-index 確保在最上層
    elevation: Platform.OS === 'android' ? 10000 : undefined,
  },
  mainButton: {
    borderRadius: 999,
    backgroundColor: '#212121',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
  },
  buttonContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossButton: {
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -21.5 }],
  },
  circleButton: {
    top: '50%',
    right: 0,
    transform: [{ translateY: -21.5 }],
  },
  triangleButton: {
    top: 0,
    left: '50%',
    transform: [{ translateX: -21.5 }],
  },
  squareButton: {
    top: '50%',
    left: 0,
    transform: [{ translateY: -21.5 }],
  },
  actionButton: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
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
  // Play Button (Green)
  playButton: {
    backgroundColor: '#2a3a2a',
  },
  // Voice Button (Blue with breathing effect)
  voiceButton: {
    backgroundColor: '#2a3a4a',
  },
  voiceActiveButton: {
    backgroundColor: 'rgb(124, 178, 232)',
    shadowColor: 'rgb(124, 178, 232)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  // Volume Button (Purple)
  volumeButton: {
    backgroundColor: '#3a2a4a',
  },
  // Speed Button (Red/Orange)
  speedButton: {
    backgroundColor: '#4a2a2a',
  },
});
