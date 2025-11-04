import React, { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, Text } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

interface AnimatedBackButtonProps {
  onPress: () => void;
  color?: string;
  style?: any;
}

const AnimatedBackButton: React.FC<AnimatedBackButtonProps> = ({ 
  onPress,
  color = 'greenyellow',
  style
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const circleAnim = useRef(new Animated.Value(0)).current;
  const arr1Anim = useRef(new Animated.Value(0)).current;
  const arr2Anim = useRef(new Animated.Value(-25)).current;
  const textAnim = useRef(new Animated.Value(-12)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(circleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.timing(arr1Anim, {
        toValue: -25,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(arr2Anim, {
        toValue: 16,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(textAnim, {
        toValue: 12,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(circleAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.timing(arr1Anim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(arr2Anim, {
        toValue: -25,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(textAnim, {
        toValue: -12,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const circleSize = circleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 220],
  });

  const circleOpacity = circleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1],
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View
        style={[
          styles.button,
          {
            transform: [{ scale: scaleAnim }],
            borderColor: color,
            shadowColor: color,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.circle,
            {
              width: circleSize,
              height: circleSize,
              opacity: circleOpacity,
              backgroundColor: color,
            },
          ]}
        />
        
        <Animated.View
          style={[
            styles.arrowContainer,
            {
              transform: [{ translateX: arr1Anim }],
            },
          ]}
        >
          <ChevronLeft size={24} color={color} />
        </Animated.View>

        <Animated.View
          style={[
            styles.arrowContainer,
            {
              transform: [{ translateX: arr2Anim }],
            },
          ]}
        >
          <ChevronLeft size={24} color="#212121" />
        </Animated.View>

        <Animated.Text
          style={[
            styles.text,
            {
              color: color,
              transform: [{ translateX: textAnim }],
            },
          ]}
        >
          Back
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderRadius: 100,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    borderRadius: 1000,
    marginLeft: -10,
    marginTop: -10,
  },
  arrowContainer: {
    position: 'absolute',
    left: 12,
    zIndex: 9,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    zIndex: 1,
    marginLeft: 12,
  },
});

export default AnimatedBackButton;
