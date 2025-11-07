import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

interface PlayStationControllerProps {
  onCrossPress?: () => void;
  onCirclePress?: () => void;
  onTrianglePress?: () => void;
  onSquarePress?: () => void;
  initialPosition?: { x: number; y: number };
  containerHeight?: number;
  isVoiceActive?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PlayStationController({
  onCrossPress,
  onCirclePress,
  onTrianglePress,
  onSquarePress,
  initialPosition,
  containerHeight = SCREEN_HEIGHT,
  isVoiceActive = false,
}: PlayStationControllerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  
  // 默認位置：中間下方
  const defaultX = SCREEN_WIDTH / 2 - 45;
  const defaultY = containerHeight * 0.75;
  
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

  const getContainerSize = () => {
    return isExpanded ? 145.6 : 90;
  };

  const getButtonSize = () => {
    return isExpanded ? 44.8 : 0;
  };

  const size = getContainerSize();
  const buttonSize = getButtonSize();

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
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setIsExpanded(!isExpanded)}
        style={[
          styles.mainButton,
          { width: size, height: size },
          isVoiceActive && styles.mainButtonActive,
        ]}
      >
        <View style={styles.innerCircle}>
          {/* Center decorative element */}
          <View style={[styles.centerDot, isVoiceActive && styles.centerDotActive]} />
        </View>
      </TouchableOpacity>

      {/* Cross Button (Bottom - Blue X) */}
      {isExpanded && (
        <Animated.View
          style={[
            styles.buttonContainer,
            styles.crossButton,
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
              activeButton === 'cross' && styles.activeButton,
            ]}
            onPress={() => handleButtonPress('cross', onCrossPress)}
            activeOpacity={0.8}
          >
            <View style={styles.crossIcon}>
              <View style={[styles.crossLine, styles.crossLineVertical]} />
              <View style={[styles.crossLine, styles.crossLineHorizontal]} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Circle Button (Right - Red) */}
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
              activeButton === 'circle' && styles.activeButton,
            ]}
            onPress={() => handleButtonPress('circle', onCirclePress)}
            activeOpacity={0.8}
          >
            <View style={styles.circleIcon} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Triangle Button (Top - Green) */}
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
              activeButton === 'triangle' && styles.activeButton,
            ]}
            onPress={() => handleButtonPress('triangle', onTrianglePress)}
            activeOpacity={0.8}
          >
            <View style={styles.triangleIcon} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Square Button (Left - Pink) */}
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
              activeButton === 'square' && styles.activeButton,
            ]}
            onPress={() => handleButtonPress('square', onSquarePress)}
            activeOpacity={0.8}
          >
            <View style={styles.squareIcon} />
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
  mainButtonActive: {
    shadowColor: '#969696',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 1,
    shadowRadius: 1,
  },
  centerDotActive: {
    backgroundColor: '#fff',
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
  // Cross Icon (Blue X)
  crossIcon: {
    width: 21,
    height: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossLine: {
    position: 'absolute',
    backgroundColor: 'rgb(124, 178, 232)',
  },
  crossLineVertical: {
    width: 2.1,
    height: 16.8,
  },
  crossLineHorizontal: {
    width: 16.8,
    height: 2.1,
  },
  // Circle Icon (Red)
  circleIcon: {
    width: 18.2,
    height: 18.2,
    borderRadius: 9.1,
    borderWidth: 1.75,
    borderColor: 'rgb(255, 102, 102)',
  },
  // Triangle Icon (Green)
  triangleIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 9.1,
    borderRightWidth: 9.1,
    borderBottomWidth: 15.4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgb(64, 226, 160)',
  },
  // Square Icon (Pink)
  squareIcon: {
    width: 16.8,
    height: 16.8,
    borderWidth: 1.75,
    borderColor: 'rgb(255, 105, 248)',
  },
});
