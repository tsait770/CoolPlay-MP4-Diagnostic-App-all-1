import React from 'react';
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import { View } from 'react-native';

type SafeImageProps = ExpoImageProps & {
  fallbackColor?: string;
};

export function SafeImage({ source, fallbackColor = '#1a1a1a', ...props }: SafeImageProps) {
  const isValidSource = React.useMemo(() => {
    if (!source) return false;
    
    if (typeof source === 'string') {
      return source.trim().length > 0;
    }
    
    if (typeof source === 'object' && 'uri' in source) {
      return source.uri && source.uri.trim().length > 0;
    }
    
    return true;
  }, [source]);

  if (!isValidSource) {
    return (
      <View 
        style={[
          props.style, 
          { backgroundColor: fallbackColor }
        ]} 
      />
    );
  }

  return <ExpoImage source={source} {...props} />;
}

export default SafeImage;
