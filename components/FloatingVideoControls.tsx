import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface FloatingVideoControlsProps {
  onRewind?: () => void;
  onPlayPause?: () => void;
  onVoiceControl?: () => void;
  onFullscreen?: () => void;
  onSpeedChange?: () => void;
  isPlaying?: boolean;
  initialPosition?: { x: number; y: number };
  containerHeight?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FloatingVideoControls({
  onRewind,
  onPlayPause,
  onVoiceControl,
  onFullscreen,
  onSpeedChange,
  isPlaying = false,
  initialPosition,
  containerHeight = SCREEN_HEIGHT,
}: FloatingVideoControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const defaultX = 20;
  const defaultY = containerHeight - 200;

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

  const handleCenterPress = () => {
    setIsExpanded(!isExpanded);
  };

  const handleButtonPress = (callback?: () => void) => {
    callback?.();
  };

  const centerButtonSize = 64;
  const sideButtonSize = 48;
  const expandedDistance = 75;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.menuContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleCenterPress}
          style={[
            styles.mainButton,
            { width: centerButtonSize, height: centerButtonSize, borderRadius: centerButtonSize / 2 },
            isExpanded && styles.mainButtonExpanded,
          ]}
        >
          <View style={styles.centerIcon}>
            <FontAwesome
              name={isExpanded ? 'times' : 'plus'}
              size={24}
              color="white"
              style={{
                transform: [{ rotate: isExpanded ? '0deg' : '0deg' }],
              }}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <>
            <Animated.View
              style={[
                styles.buttonContainer,
                {
                  position: 'absolute',
                  left: -expandedDistance,
                  top: centerButtonSize / 2 - sideButtonSize / 2,
                  opacity: 1,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.sideButton, { width: sideButtonSize, height: sideButtonSize, borderRadius: sideButtonSize / 2 }]}
                onPress={() => handleButtonPress(onRewind)}
                activeOpacity={0.8}
              >
                <FontAwesome name="undo" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={[
                styles.buttonContainer,
                {
                  position: 'absolute',
                  left: -expandedDistance / 1.5,
                  top: -expandedDistance / 1.5,
                  opacity: 1,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.sideButton, { width: sideButtonSize, height: sideButtonSize, borderRadius: sideButtonSize / 2 }]}
                onPress={() => handleButtonPress(onPlayPause)}
                activeOpacity={0.8}
              >
                <FontAwesome name={isPlaying ? 'pause' : 'play'} size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={[
                styles.buttonContainer,
                {
                  position: 'absolute',
                  left: centerButtonSize / 2 - sideButtonSize / 2,
                  top: -expandedDistance,
                  opacity: 1,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.sideButton, { width: sideButtonSize, height: sideButtonSize, borderRadius: sideButtonSize / 2 }]}
                onPress={() => handleButtonPress(onVoiceControl)}
                activeOpacity={0.8}
              >
                <FontAwesome name="microphone" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={[
                styles.buttonContainer,
                {
                  position: 'absolute',
                  left: centerButtonSize + expandedDistance / 1.5 - sideButtonSize,
                  top: -expandedDistance / 1.5,
                  opacity: 1,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.sideButton, { width: sideButtonSize, height: sideButtonSize, borderRadius: sideButtonSize / 2 }]}
                onPress={() => handleButtonPress(onFullscreen)}
                activeOpacity={0.8}
              >
                <FontAwesome name="expand" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={[
                styles.buttonContainer,
                {
                  position: 'absolute',
                  left: centerButtonSize + expandedDistance - sideButtonSize,
                  top: centerButtonSize / 2 - sideButtonSize / 2,
                  opacity: 1,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.sideButton, { width: sideButtonSize, height: sideButtonSize, borderRadius: sideButtonSize / 2 }]}
                onPress={() => handleButtonPress(onSpeedChange)}
                activeOpacity={0.8}
              >
                <FontAwesome name="forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
  },
  menuContainer: {
    position: 'relative',
    width: 200,
    height: 160,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  mainButton: {
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    position: 'relative',
    zIndex: 100,
  },
  mainButtonExpanded: {
    transform: [{ scale: 1.1 }],
  },
  centerIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  sideButton: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
});
