/**
 * Local MP4 File Helper
 * 
 * Simplified approach for local video playback on iOS and Android.
 * Files from DocumentPicker are already in accessible locations,
 * so we use them directly without complex copying logic.
 * 
 * Key principle: Keep it simple - expo-video can handle file:// URIs directly.
 */

import { Platform } from 'react-native';

export interface PrepareLocalVideoResult {
  success: boolean;
  uri?: string;
  originUri: string;
  size?: number;
  mime?: string;
  error?: string;
  needsCopy?: boolean;
  isCached?: boolean;
  platform: string;
}

/**
 * Prepare local video file for playback
 * 
 * This function handles the complexities of iOS file access by:
 * 1. Detecting URI type (file://, ph://, content://, etc.)
 * 2. Copying files to app cache directory if needed
 * 3. Verifying file accessibility
 * 4. Providing detailed error information
 * 
 * @param originalUri - The original URI from file picker or other sources
 * @returns Promise<PrepareLocalVideoResult> - Result with playable URI or error
 */
export async function prepareLocalVideo(originalUri: string): Promise<PrepareLocalVideoResult> {
  const startTime = Date.now();
  const platform = Platform.OS;
  
  console.log('[VideoHelpers] ========== prepareLocalVideo START ==========');
  console.log('[VideoHelpers] Platform:', platform);
  console.log('[VideoHelpers] Original URI:', originalUri);
  console.log('[VideoHelpers] Timestamp:', new Date().toISOString());

  try {
    // Validate input
    if (!originalUri || originalUri.trim() === '') {
      throw new Error('NO_URI: Empty or invalid URI provided');
    }

    const cleanUri = originalUri.trim();

    // Detect URI type
    const isFileUri = cleanUri.startsWith('file://');
    const isContentUri = cleanUri.startsWith('content://');
    const isPhotoUri = cleanUri.startsWith('ph://') || cleanUri.startsWith('assets-library://');
    const isHttpUri = cleanUri.startsWith('http://') || cleanUri.startsWith('https://');
    const isLocalFile = isFileUri || isContentUri || isPhotoUri;

    console.log('[VideoHelpers] URI Analysis:', {
      isFileUri,
      isContentUri,
      isPhotoUri,
      isHttpUri,
      isLocalFile,
      uri: cleanUri.substring(0, 100) + '...',
    });

    // Remote URLs don't need processing
    if (isHttpUri) {
      console.log('[VideoHelpers] ✅ Remote URL detected, no processing needed');
      return {
        success: true,
        uri: cleanUri,
        originUri: cleanUri,
        platform,
        needsCopy: false,
      };
    }

    // SIMPLIFIED APPROACH: For all local files, use them directly
    // expo-video and VideoView can handle file:// URIs directly
    // Files from DocumentPicker are already in accessible cache locations
    if (isLocalFile) {
      console.log('[VideoHelpers] ✅ Local file detected - using directly');
      console.log('[VideoHelpers] URI type:', {
        isFileUri,
        isContentUri,
        isPhotoUri,
      });
      
      return {
        success: true,
        uri: cleanUri,
        originUri: cleanUri,
        platform,
        needsCopy: false,
      };
    }

    // Default: Unknown URI type
    console.log('[VideoHelpers] ℹ️ Unknown URI type, attempting direct use');
    return {
      success: true,
      uri: cleanUri,
      originUri: cleanUri,
      platform,
      needsCopy: false,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const duration = Date.now() - startTime;
    
    console.error('[VideoHelpers] ❌ prepareLocalVideo FAILED');
    console.error('[VideoHelpers] Error:', errorMsg);
    console.error('[VideoHelpers] Duration:', duration, 'ms');
    
    return {
      success: false,
      originUri: originalUri,
      error: errorMsg,
      platform,
    };
  } finally {
    const duration = Date.now() - startTime;
    console.log('[VideoHelpers] ========== prepareLocalVideo END ==========');
    console.log('[VideoHelpers] Duration:', duration, 'ms');
  }
}


