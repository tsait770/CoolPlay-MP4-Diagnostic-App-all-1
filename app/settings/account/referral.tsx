import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import ReferralCodeModal from "@/components/ReferralCodeModal";

export default function ReferralScreen() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <ReferralCodeModal 
        visible={isVisible} 
        onClose={handleClose} 
        isFirstTime={false} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
});
