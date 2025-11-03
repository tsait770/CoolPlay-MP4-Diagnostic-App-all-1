import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  largeDesktop: number;
}

export const BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
};

export type ScreenType = 'mobile' | 'tablet' | 'desktop' | 'largeDesktop';

export const getScreenType = (): ScreenType => {
  if (width >= BREAKPOINTS.largeDesktop) return 'largeDesktop';
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
};

export const isMobile = (): boolean => {
  return width < BREAKPOINTS.tablet;
};

export const isTablet = (): boolean => {
  return width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
};

export const isDesktop = (): boolean => {
  return width >= BREAKPOINTS.desktop;
};

export const isLargeDesktop = (): boolean => {
  return width >= BREAKPOINTS.largeDesktop;
};

export const getResponsiveWidth = (baseWidth: number, scale: number = 1): number => {
  const screenType = getScreenType();
  switch (screenType) {
    case 'largeDesktop':
      return baseWidth * scale * 1.5;
    case 'desktop':
      return baseWidth * scale * 1.2;
    case 'tablet':
      return baseWidth * scale * 1;
    default:
      return baseWidth;
  }
};

export const getResponsiveHeight = (baseHeight: number, scale: number = 1): number => {
  const screenType = getScreenType();
  switch (screenType) {
    case 'largeDesktop':
      return baseHeight * scale * 1.5;
    case 'desktop':
      return baseHeight * scale * 1.2;
    case 'tablet':
      return baseHeight * scale * 1;
    default:
      return baseHeight;
  }
};

export const getResponsiveFontSize = (baseFontSize: number): number => {
  const screenType = getScreenType();
  const scale = PixelRatio.getFontScale();
  
  let multiplier = 1;
  switch (screenType) {
    case 'largeDesktop':
      multiplier = 1.3;
      break;
    case 'desktop':
      multiplier = 1.15;
      break;
    case 'tablet':
      multiplier = 1.05;
      break;
    default:
      multiplier = 1;
  }
  
  return Math.round(baseFontSize * multiplier * scale);
};

export const getResponsivePadding = (basePadding: number): number => {
  const screenType = getScreenType();
  switch (screenType) {
    case 'largeDesktop':
      return basePadding * 2;
    case 'desktop':
      return basePadding * 1.5;
    case 'tablet':
      return basePadding * 1.25;
    default:
      return basePadding;
  }
};

export const getColumnCount = (baseColumns: number = 1): number => {
  const screenType = getScreenType();
  switch (screenType) {
    case 'largeDesktop':
      return baseColumns * 4;
    case 'desktop':
      return baseColumns * 3;
    case 'tablet':
      return baseColumns * 2;
    default:
      return baseColumns;
  }
};

export const getMaxWidth = (): number => {
  const screenType = getScreenType();
  switch (screenType) {
    case 'largeDesktop':
      return 1400;
    case 'desktop':
      return 1200;
    case 'tablet':
      return 900;
    default:
      return width;
  }
};

export const isWeb = Platform.OS === 'web';
export const isNative = Platform.OS !== 'web';

export const wp = (percentage: number): number => {
  return (width * percentage) / 100;
};

export const hp = (percentage: number): number => {
  return (height * percentage) / 100;
};

export const responsiveValue = <T,>(mobileValue: T, tabletValue?: T, desktopValue?: T): T => {
  const screenType = getScreenType();
  
  if (desktopValue !== undefined && (screenType === 'desktop' || screenType === 'largeDesktop')) {
    return desktopValue;
  }
  
  if (tabletValue !== undefined && screenType === 'tablet') {
    return tabletValue;
  }
  
  return mobileValue;
};
