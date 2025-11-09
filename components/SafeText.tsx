import React from 'react';
import { Text, TextProps } from 'react-native';

/**
 * SafeText component that ensures children are always valid text content
 * Helps prevent "Unexpected text node" errors
 */
export default function SafeText({ children, ...props }: TextProps) {
  const safeChildren = React.useMemo(() => {
    if (children === null || children === undefined) {
      return '';
    }
    
    // Convert to string if not already
    const text = String(children);
    
    // Warn if we get unexpected values
    if (__DEV__ && (text === '.' || text.trim() === '')) {
      console.warn('[SafeText] Rendering empty or period-only text:', text);
    }
    
    return text;
  }, [children]);

  return <Text {...props}>{safeChildren}</Text>;
}
