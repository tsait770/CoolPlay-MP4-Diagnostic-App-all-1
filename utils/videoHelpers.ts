/**
 * iOS Local MP4 File Helper
 * 
 * This utility handles iOS security-scoped resources and file access for local MP4 playback.
 * 
 * Core Issues Addressed:
 * 1. iOS security-scoped resource access restrictions
 * 2. URI format inconsistencies (file://, ph://, content://)
 * 3. Sandbox limitations requiring file copying
 * 4. Player compatibility with different URI schemes
 */

import { File, Directory } from 'expo-file-system';
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

    // For iOS: ALWAYS copy local files to cache
    // This bypasses security-scoped resource restrictions
    if (platform === 'ios' && isLocalFile) {
      console.log('[VideoHelpers] 📋 iOS local file detected - initiating copy to cache');
      return await copyToCache(cleanUri, platform);
    }

    // For Android: Check file:// accessibility first
    if (platform === 'android') {
      if (isFileUri) {
        console.log('[VideoHelpers] 🔍 Android file:// - checking accessibility');
        try {
          const file = new File(cleanUri);
          const fileExists = await file.exists();
          
          if (fileExists) {
            const size = await file.size();
            if (size && size > 0) {
              console.log('[VideoHelpers] ✅ File accessible directly on Android');
              console.log('[VideoHelpers] File size:', size, 'bytes');
              return {
                success: true,
                uri: cleanUri,
                originUri: cleanUri,
                size: size,
                platform,
                needsCopy: false,
              };
            }
          }
          console.warn('[VideoHelpers] ⚠️ File exists check failed, attempting cache copy');
          return await copyToCache(cleanUri, platform);
        } catch (accessError) {
          console.warn('[VideoHelpers] ⚠️ File access error:', accessError);
          console.log('[VideoHelpers] Attempting cache copy as fallback');
          return await copyToCache(cleanUri, platform);
        }
      }

      // For content:// or other Android URIs, copy to cache
      if (isContentUri || isLocalFile) {
        console.log('[VideoHelpers] 📋 Android content URI - copying to cache');
        return await copyToCache(cleanUri, platform);
      }
    }

    // Default: try direct access for web or unknown platforms
    console.log('[VideoHelpers] ℹ️ Non-mobile platform or unknown URI type');
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

/**
 * Copy file to app cache directory
 * 
 * This is the core solution for iOS local file playback.
 * iOS security-scoped resources can't be directly accessed by the video player,
 * so we copy them to the app's cache directory which has no restrictions.
 * 
 * @param sourceUri - Source file URI
 * @param platform - Platform identifier
 * @returns Promise<PrepareLocalVideoResult> - Result with cached file URI
 */
async function copyToCache(
  sourceUri: string,
  platform: string
): Promise<PrepareLocalVideoResult> {
  const copyStartTime = Date.now();
  
  console.log('[VideoHelpers] ========== copyToCache START ==========');
  console.log('[VideoHelpers] Source URI:', sourceUri);

  try {
    // Get cache directory using new API
    const cacheDirPath = Directory.cacheDirectory;
    if (!cacheDirPath) {
      throw new Error('CACHE_UNAVAILABLE: Cache directory not available on this platform');
    }
    const cacheDir = new Directory(cacheDirPath);
    
    console.log('[VideoHelpers] Cache directory path:', cacheDirPath);
    
    // Ensure cache directory exists
    try {
      const dirExists = await cacheDir.exists();
      if (!dirExists) {
        await cacheDir.create();
        console.log('[VideoHelpers] ✅ Created cache directory');
      }
    } catch (mkdirError) {
      console.error('[VideoHelpers] Failed to create cache directory:', mkdirError);
    }
    
    // For iOS files already in DocumentPicker cache, try direct access first
    if (platform === 'ios' && sourceUri.includes('/Caches/')) {
      console.log('[VideoHelpers] File already in iOS cache directory');
      console.log('[VideoHelpers] Attempting direct access...');
      
      try {
        const sourceFile = new File(sourceUri);
        const sourceExists = await sourceFile.exists();
        
        if (sourceExists) {
          const size = await sourceFile.size();
          if (size && size > 0) {
            console.log('[VideoHelpers] ✅ File accessible directly from cache');
            console.log('[VideoHelpers] File size:', size, 'bytes');
            console.log('[VideoHelpers] Using original URI without copy');
            
            return {
              success: true,
              uri: sourceUri,
              originUri: sourceUri,
              size: size,
              platform,
              needsCopy: false,
              isCached: true,
            };
          }
        }
      } catch (directAccessError) {
        console.warn('[VideoHelpers] Direct access failed, will attempt copy:', directAccessError);
      }
    }

    // For iOS DocumentPicker files, extract just the filename
    let filename = sourceUri.split('/').pop() || `video_${Date.now()}.mp4`;
    
    // iOS DocumentPicker may provide files with UUID names in cache
    // We need to work with the actual file in that location
    
    // Clean up filename (remove query parameters, decode URL encoding)
    filename = decodeURIComponent(filename.split('?')[0]);
    
    // Ensure valid video extension
    if (!filename.toLowerCase().endsWith('.mp4') && 
        !filename.toLowerCase().endsWith('.mov') &&
        !filename.toLowerCase().endsWith('.m4v')) {
      filename = `${filename}.mp4`;
    }

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}_${filename}`;
    const destFilePath = cacheDirPath.endsWith('/') ? cacheDirPath + uniqueFilename : cacheDirPath + '/' + uniqueFilename;
    const destFile = new File(destFilePath);

    console.log('[VideoHelpers] Destination filename:', uniqueFilename);
    console.log('[VideoHelpers] Destination URI:', destFile.uri);

    // Check if file already exists in cache (avoid re-copying)
    try {
      const destExists = await destFile.exists();
      
      if (destExists) {
        const existingSize = await destFile.size();
        if (existingSize && existingSize > 0) {
          console.log('[VideoHelpers] ✅ File already exists in cache');
          console.log('[VideoHelpers] Cached file size:', existingSize, 'bytes');
          
          return {
            success: true,
            uri: destFile.uri,
            originUri: sourceUri,
            size: existingSize,
            platform,
            needsCopy: false,
            isCached: true,
          };
        }
      }
    } catch {
      console.log('[VideoHelpers] File not in cache, will copy');
    }

    // Copy file to cache
    console.log('[VideoHelpers] 📋 Copying file to cache...');
    console.log('[VideoHelpers] From:', sourceUri);
    console.log('[VideoHelpers] To:', destFile.uri);

    // Perform the copy operation using new FileSystem API
    const sourceFile = new File(sourceUri);
    await sourceFile.copy(destFile);

    console.log('[VideoHelpers] ✅ File copy completed');

    // Verify copied file
    const copiedExists = await destFile.exists();
    
    if (!copiedExists) {
      throw new Error('COPY_VERIFICATION_FAILED: File was copied but cannot be verified');
    }

    const copiedSize = await destFile.size();
    const copyDuration = Date.now() - copyStartTime;
    const fileSizeMB = (copiedSize / 1024 / 1024).toFixed(2);
    const copySpeedMBps = (copiedSize / 1024 / 1024 / (copyDuration / 1000)).toFixed(2);

    console.log('[VideoHelpers] ========== COPY SUCCESS ==========');
    console.log('[VideoHelpers] Copied file size:', copiedSize, 'bytes');
    console.log('[VideoHelpers] File size (MB):', fileSizeMB, 'MB');
    console.log('[VideoHelpers] Copy duration:', copyDuration, 'ms');
    console.log('[VideoHelpers] Copy speed:', copySpeedMBps, 'MB/s');
    console.log('[VideoHelpers] Destination URI:', destFile.uri);

    return {
      success: true,
      uri: destFile.uri,
      originUri: sourceUri,
      size: copiedSize,
      platform,
      needsCopy: true,
      isCached: false,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const duration = Date.now() - copyStartTime;
    
    console.error('[VideoHelpers] ❌ copyToCache FAILED');
    console.error('[VideoHelpers] Error:', errorMsg);
    console.error('[VideoHelpers] Error type:', error instanceof Error ? error.name : typeof error);
    console.error('[VideoHelpers] Duration:', duration, 'ms');
    console.error('[VideoHelpers] Source URI:', sourceUri);
    console.error('[VideoHelpers] Platform:', platform);

    // Provide detailed error categorization
    let categorizedError = errorMsg;
    
    if (errorMsg.includes('ENOENT') || errorMsg.includes('not found')) {
      categorizedError = 'FILE_NOT_FOUND: Source file does not exist or is not accessible';
    } else if (errorMsg.includes('EACCES') || errorMsg.includes('permission')) {
      categorizedError = 'PERMISSION_DENIED: No permission to read source file or write to cache';
    } else if (errorMsg.includes('ENOSPC') || errorMsg.includes('space')) {
      categorizedError = 'NO_SPACE: Insufficient storage space for copying';
    } else if (errorMsg.includes('Network')) {
      categorizedError = 'NETWORK_ERROR: Network issue while accessing file';
    }

    return {
      success: false,
      originUri: sourceUri,
      error: categorizedError,
      platform,
      needsCopy: true,
    };
  }
}

/**
 * Clean up cached video files older than specified days
 * 
 * Call this periodically to prevent cache bloat.
 * Recommended: Call on app startup or when storage is low.
 * 
 * @param olderThanDays - Remove files older than this many days (default: 7)
 * @returns Promise<{ removed: number, errors: number }>
 */
export async function cleanupCachedVideos(olderThanDays: number = 7): Promise<{
  removed: number;
  errors: number;
  freedSpace: number;
}> {
  console.log('[VideoHelpers] ========== cleanupCachedVideos START ==========');
  console.log('[VideoHelpers] Removing files older than', olderThanDays, 'days');

  let removed = 0;
  let errors = 0;
  let freedSpace = 0;

  try {
    const cacheDirPath = Directory.cacheDirectory;
    if (!cacheDirPath) {
      console.error('[VideoHelpers] Cache directory not available');
      return { removed, errors: 1, freedSpace };
    }
    const cacheDir = new Directory(cacheDirPath);
    const dirExists = await cacheDir.exists();
    
    if (!dirExists) {
      console.error('[VideoHelpers] Cache directory not available');
      return { removed, errors: 1, freedSpace };
    }
    
    const files = await cacheDir.list();
    const now = Date.now();
    const maxAge = olderThanDays * 24 * 60 * 60 * 1000;

    console.log('[VideoHelpers] Found', files.length, 'files in cache');

    for (const fileName of files) {
      if (!fileName.endsWith('.mp4') && !fileName.endsWith('.mov') && !fileName.endsWith('.m4v')) {
        continue;
      }

      try {
        const filePath = cacheDirPath.endsWith('/') ? cacheDirPath + fileName : cacheDirPath + '/' + fileName;
        const file = new File(filePath);
        const fileExists = await file.exists();

        if (fileExists) {
          const metadata = await file.metadata();
          const modTime = metadata.modificationTime || 0;
          
          if (modTime) {
            const age = now - modTime;

            if (age > maxAge) {
              console.log('[VideoHelpers] Removing old cached file:', fileName);
              console.log('[VideoHelpers] Age:', (age / 1000 / 60 / 60 / 24).toFixed(1), 'days');
              
              const size = await file.size();
              await file.delete();
              
              removed++;
              freedSpace += size;
              
              console.log('[VideoHelpers] ✅ Removed:', fileName);
            }
          }
        }
      } catch (error) {
        console.error('[VideoHelpers] Error removing file:', fileName, error);
        errors++;
      }
    }

    const freedSpaceMB = (freedSpace / 1024 / 1024).toFixed(2);
    console.log('[VideoHelpers] ========== CLEANUP COMPLETE ==========');
    console.log('[VideoHelpers] Removed files:', removed);
    console.log('[VideoHelpers] Errors:', errors);
    console.log('[VideoHelpers] Freed space:', freedSpaceMB, 'MB');

    return { removed, errors, freedSpace };
  } catch (error) {
    console.error('[VideoHelpers] Cleanup failed:', error);
    return { removed, errors: 1, freedSpace };
  }
}

/**
 * Get cache statistics
 * 
 * @returns Promise<{ totalFiles: number, totalSize: number, oldestFile?: string }>
 */
export async function getCacheStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  totalSizeMB: string;
  oldestFile?: string;
  oldestFileAge?: string;
}> {
  try {
    const cacheDirPath = Directory.cacheDirectory;
    if (!cacheDirPath) {
      return { totalFiles: 0, totalSize: 0, totalSizeMB: '0.00' };
    }
    const cacheDir = new Directory(cacheDirPath);
    const dirExists = await cacheDir.exists();
    
    if (!dirExists) {
      return { totalFiles: 0, totalSize: 0, totalSizeMB: '0.00' };
    }
    
    const files = await cacheDir.list();
    let totalFiles = 0;
    let totalSize = 0;
    let oldestTime = Date.now();
    let oldestFile: string | undefined;

    for (const fileName of files) {
      if (!fileName.endsWith('.mp4') && !fileName.endsWith('.mov') && !fileName.endsWith('.m4v')) {
        continue;
      }

      try {
        const filePath = cacheDirPath.endsWith('/') ? cacheDirPath + fileName : cacheDirPath + '/' + fileName;
        const file = new File(filePath);
        const fileExists = await file.exists();

        if (fileExists) {
          totalFiles++;
          const size = await file.size();
          totalSize += size;
          
          const metadata = await file.metadata();
          const modTime = metadata.modificationTime || 0;

          if (modTime && modTime < oldestTime) {
            oldestTime = modTime;
            oldestFile = fileName;
          }
        }
      } catch (error) {
        console.warn('[VideoHelpers] Error getting file info:', fileName, error);
      }
    }

    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
    const oldestFileAge = oldestFile
      ? `${((Date.now() - oldestTime) / 1000 / 60 / 60 / 24).toFixed(1)} days`
      : undefined;

    return {
      totalFiles,
      totalSize,
      totalSizeMB,
      oldestFile,
      oldestFileAge,
    };
  } catch (error) {
    console.error('[VideoHelpers] Failed to get cache stats:', error);
    return { totalFiles: 0, totalSize: 0, totalSizeMB: '0.00' };
  }
}
