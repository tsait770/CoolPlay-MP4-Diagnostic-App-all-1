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
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PlayStationController({
  onCrossPress,
  onCirclePress,
  onTrianglePress,
  onSquarePress,
  initialPosition,
  containerHeight = SCREEN_HEIGHT,
}: PlayStationControllerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  
  // 默認位置：中間下方
  const defaultX = SCREEN_WIDTH / 2 - 50;
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

  const handleButtonPress = (button: string, callback?: () => void) => {
    setActiveButton(button);
    callback?.();
    setTimeout(() => setActiveButton(null), 200);
  };

  const getContainerSize = () => {
    return isExpanded ? 208 : 100;
  };

  const getButtonSize = () => {
    return isExpanded ? 64 : 0;
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
        style={[styles.mainButton, { width: size, height: size }]}
      >
        <View style={styles.innerCircle}>
          {/* Center decorative element */}
          <View style={styles.centerDot} />
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
    transform: [{ translateX: -32 }],
  },
  circleButton: {
    top: '50%',
    right: 0,
    transform: [{ translateY: -32 }],
  },
  triangleButton: {
    top: 0,
    left: '50%',
    transform: [{ translateX: -32 }],
  },
  squareButton: {
    top: '50%',
    left: 0,
    transform: [{ translateY: -32 }],
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossLine: {
    position: 'absolute',
    backgroundColor: 'rgb(124, 178, 232)',
  },
  crossLineVertical: {
    width: 3,
    height: 24,
  },
  crossLineHorizontal: {
    width: 24,
    height: 3,
  },
  // Circle Icon (Red)
  circleIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: 'rgb(255, 102, 102)',
  },
  // Triangle Icon (Green)
  triangleIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 13,
    borderRightWidth: 13,
    borderBottomWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgb(64, 226, 160)',
  },
  // Square Icon (Pink)
  squareIcon: {
    width: 24,
    height: 24,
    borderWidth: 2.5,
    borderColor: 'rgb(255, 105, 248)',
  },
});
