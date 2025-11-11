import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Localization from 'expo-localization';

interface YouTubeRegionOverlayProps {
  onPress: (youtubeURL: string) => void;
}

export default function YouTubeRegionOverlay({ onPress }: YouTubeRegionOverlayProps) {
  const region = useMemo(() => {
    try {
      return Localization.region || "US";
    } catch (error) {
      console.error('[YouTubeRegionOverlay] Error getting region:', error);
      return "US";
    }
  }, []);

  const youtubeURL = useMemo(() => {
    return `https://www.youtube.com/?gl=${region}`;
  }, [region]);

  const handlePress = useCallback(() => {
    console.log('[YouTubeRegionOverlay] Navigating to YouTube:', {
      region,
      url: youtubeURL,
    });
    
    try {
      onPress(youtubeURL);
    } catch (error) {
      console.error('[YouTubeRegionOverlay] Error in onPress:', error);
    }
  }, [onPress, youtubeURL, region]);

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
