import React, { useRef } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableWithoutFeedback, ViewStyle } from "react-native";
import { ArrowRight } from "lucide-react-native";

interface BlackButtonProps {
  label?: string;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  testID?: string;
}

const BlackButton: React.FC<BlackButtonProps> = ({ label = "BLACK", onPress, style, testID }) => {
  const widthAnim = useRef(new Animated.Value(48)).current; // circle width
  const arrowX = useRef(new Animated.Value(10)).current;
  const textColor = useRef(new Animated.Value(0)).current; // 0 = dark text, 1 = light text

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: 240,
        duration: 450,
        easing: Easing.bezier(0.65, 0, 0.076, 1),
        useNativeDriver: false,
      }),
      Animated.timing(arrowX, {
        toValue: 26,
        duration: 450,
        easing: Easing.bezier(0.65, 0, 0.076, 1),
        useNativeDriver: true,
      }),
      Animated.timing(textColor, {
        toValue: 1,
        duration: 450,
        easing: Easing.bezier(0.65, 0, 0.076, 1),
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    onPress();
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: 48,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(arrowX, {
        toValue: 10,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(textColor, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  };

  const interpolatedTextColor = textColor.interpolate({
    inputRange: [0, 1],
    outputRange: ["#007AFF", "#ffffff"],
  });

  return (
    <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut} testID={testID ?? "black-button"}>
      <Animated.View style={[styles.container, style]}>        
        <Animated.View style={[styles.circle, { width: widthAnim }]} />
        <Animated.View style={[styles.arrow, { transform: [{ translateX: arrowX }] }]}>          
          <ArrowRight size={18} color="#ffffff" />
        </Animated.View>
        <Animated.Text style={[styles.text, { color: interpolatedTextColor }]}>{label.toUpperCase()}</Animated.Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 264,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#001F3F",
    justifyContent: "center",
    overflow: "hidden",
  },
  circle: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#007AFF",
    borderRadius: 24,
  },
  arrow: {
    position: "absolute",
    left: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  text: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
  },
});

export default BlackButton;
