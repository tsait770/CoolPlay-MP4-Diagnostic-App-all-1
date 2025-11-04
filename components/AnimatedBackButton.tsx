/* eslint-disable @rork/linters/general-no-raw-text */
import React, { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

interface AnimatedBackButtonProps {
  onPress: () => void;
  color?: string;
  style?: any;
}

const GO_BACK_TEXT = 'Go back' as const;

const AnimatedBackButton: React.FC<AnimatedBackButtonProps> = ({ 
  onPress,
  color = '#1a2332',
  style
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const arrowTranslateX = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 50,
        bounciness: 8,
      }),
      Animated.timing(arrowTranslateX, {
        toValue: -4,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 8,
      }),
      Animated.spring(arrowTranslateX, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

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
            backgroundColor: color,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.arrowContainer,
            {
              transform: [{ translateX: arrowTranslateX }],
            },
          ]}
        >
          <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
        </Animated.View>

        <Animated.Text
          style={[
            styles.text,
            {
              opacity: textOpacity,
            },
          ]}
        >
          {GO_BACK_TEXT}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default AnimatedBackButton;
