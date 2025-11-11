import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Localization from 'expo-localization';

interface YouTubeRegionOverlayProps {
  onPress: (youtubeURL: string) => void;
}

export default function YouTubeRegionOverlay({ onPress }: YouTubeRegionOverlayProps) {
  const handlePress = useCallback(() => {
    const region = Localization.region || "US";
    const youtubeURL = `https://www.youtube.com/?gl=${region}`;
    
    console.log('[YouTubeRegionOverlay] Navigating to YouTube:', {
      region,
      url: youtubeURL,
    });
    
    onPress(youtubeURL);
  }, [onPress]);

  return (
    <Pressable 
      style={styles.overlayButton} 
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    />
  );
}

const styles = StyleSheet.create({
  overlayButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    opacity: 0,
    zIndex: 999,
  }
});
