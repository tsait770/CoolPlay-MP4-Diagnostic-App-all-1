import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedBackButtonProps {
  onPress: () => void;
  style?: any;
}

const AnimatedBackButton: React.FC<AnimatedBackButtonProps> = ({ 
  onPress,
  style
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const blurAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.7,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(blurAnim, {
        toValue: 30,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(blurAnim, {
        toValue: 20,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-180deg'],
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, style]}
    >
      <Animated.View
        style={[
          styles.glowEffect,
          {
            shadowRadius: blurAnim,
          },
        ]}
      />
      
      <Animated.View
        style={[
          styles.borderContainer,
          {
            transform: [{ scale: scaleAnim }, { rotate: rotation }],
          },
        ]}
      >
        <LinearGradient
          colors={['#00AEEF', '#0066CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        />
      </Animated.View>

      <View style={styles.buttonInner}>
        <Animated.Text
          style={[
            styles.text,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >{"B A C K"}</Animated.Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 100,
    height: 40,
  },
  glowEffect: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#00AEEF',
    borderRadius: 8,
    shadowColor: '#00AEEF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    elevation: 10,
  },
  borderContainer: {
    position: 'absolute',
    inset: -4,
    top: -1,
    left: -4,
    width: 108,
    height: 48,
    borderRadius: 10,
    zIndex: -10,
  },
  gradientBorder: {
    flex: 1,
    borderRadius: 10,
  },
  buttonInner: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    paddingHorizontal: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#00AEEF',
    letterSpacing: 2,
  },
});

export default AnimatedBackButton;
