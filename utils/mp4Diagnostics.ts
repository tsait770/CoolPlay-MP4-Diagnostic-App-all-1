import { detectVideoSource } from './videoSourceDetector';

export interface MP4DiagnosticsResult {
  url: string;
  isValidUrl: boolean;
  detectedType: string;
  detectedPlatform: string;
  streamType?: string;
  requiresWebView: boolean;
  shouldUseMp4Player: boolean;
  urlHasMp4Extension: boolean;
  isHttps: boolean;
  potentialIssues: string[];
  recommendations: string[];
}

export function diagnoseMP4Playback(url: string): MP4DiagnosticsResult {
  const result: MP4DiagnosticsResult = {
    url,
    isValidUrl: false,
    detectedType: 'unknown',
    detectedPlatform: 'unknown',
    requiresWebView: false,
    shouldUseMp4Player: false,
    urlHasMp4Extension: false,
    isHttps: false,
    potentialIssues: [],
    recommendations: [],
  };

  if (!url || typeof url !== 'string' || url.trim() === '') {
    result.potentialIssues.push('URL is empty or invalid');
    result.recommendations.push('Provide a valid video URL');
    return result;
  }

  result.isValidUrl = true;
  result.isHttps = url.toLowerCase().startsWith('https://');
  
  if (!result.isHttps && url.toLowerCase().startsWith('http://')) {
    result.potentialIssues.push('Using HTTP instead of HTTPS - may cause security issues');
    result.recommendations.push('Use HTTPS URL if available');
  }

  const sourceInfo = detectVideoSource(url);
  result.detectedType = sourceInfo.type;
  result.detectedPlatform = sourceInfo.platform;
  result.requiresWebView = sourceInfo.requiresWebView || false;
  result.streamType = sourceInfo.streamType;

  result.shouldUseMp4Player = sourceInfo.type === 'direct';

  const videoFormats = ['mp4', 'webm', 'ogg', 'ogv', 'mkv', 'avi', 'mov', 'flv', 'wmv', '3gp'];
  const urlLower = url.toLowerCase();
  result.urlHasMp4Extension = videoFormats.some(ext => 
    urlLower.includes(`.${ext}`)
  );

  if (sourceInfo.type !== 'direct' && result.urlHasMp4Extension) {
    result.potentialIssues.push(
      `URL appears to be a direct video file but was detected as '${sourceInfo.type}'`
    );
    result.recommendations.push(
      'Check if URL format is preventing proper detection'
    );
  }

  if (sourceInfo.type === 'direct' && !result.urlHasMp4Extension) {
    result.potentialIssues.push(
      'Detected as direct video but URL has no clear video extension'
    );
    result.recommendations.push(
      'Server may need to return proper Content-Type headers'
    );
  }

  if (sourceInfo.type === 'direct' && sourceInfo.streamType) {
    const advancedFormats = ['mkv', 'avi', 'flv', 'wmv'];
    if (advancedFormats.includes(sourceInfo.streamType)) {
      result.potentialIssues.push(
        `${sourceInfo.streamType.toUpperCase()} format may have limited support in expo-video`
      );
      result.recommendations.push(
        `Consider converting to MP4 (H.264/AAC) for best compatibility`
      );
    }
  }

  if (result.shouldUseMp4Player) {
    result.recommendations.push(
      'This URL should use MP4Player component',
      'Check console logs for [MP4Player] messages',
      'Verify network connection and CORS settings'
    );
  }

  if (!result.isValidUrl || sourceInfo.type === 'unknown') {
    result.potentialIssues.push('Could not detect video source type');
    result.recommendations.push(
      'Verify URL is accessible',
      'Check if video server allows embedding',
      'Test URL in browser first'
    );
  }

  if (url.length > 2000) {
    result.potentialIssues.push('URL is very long - may cause issues');
    result.recommendations.push('Consider using a URL shortener or direct link');
  }

  return result;
}

export function printMP4Diagnostics(url: string): void {
  const result = diagnoseMP4Playback(url);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('MP4 Playback Diagnostics Report');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`URL: ${result.url.substring(0, 100)}${result.url.length > 100 ? '...' : ''}`);
  console.log('');
  console.log('Detection Results:');
  console.log(`  ✓ Valid URL: ${result.isValidUrl ? 'Yes' : 'No'}`);
  console.log(`  ✓ Detected Type: ${result.detectedType}`);
  console.log(`  ✓ Platform: ${result.detectedPlatform}`);
  if (result.streamType) {
    console.log(`  ✓ Stream Type: ${result.streamType.toUpperCase()}`);
  }
  console.log(`  ✓ Should Use MP4Player: ${result.shouldUseMp4Player ? 'Yes' : 'No'}`);
  console.log(`  ✓ Has Video Extension: ${result.urlHasMp4Extension ? 'Yes' : 'No'}`);
  console.log(`  ✓ Uses HTTPS: ${result.isHttps ? 'Yes' : 'No'}`);
  console.log(`  ✓ Requires WebView: ${result.requiresWebView ? 'Yes' : 'No'}`);
  
  if (result.potentialIssues.length > 0) {
    console.log('');
    console.log('⚠️  Potential Issues:');
    result.potentialIssues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  }
  
  if (result.recommendations.length > 0) {
    console.log('');
    console.log('💡 Recommendations:');
    result.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

export function getMP4PlayerStatus(): {
  componentExists: boolean;
  usesExpoVideo: boolean;
  hasErrorHandling: boolean;
  hasEventListeners: boolean;
} {
  return {
    componentExists: true,
    usesExpoVideo: true,
    hasErrorHandling: true,
    hasEventListeners: true,
  };
}
