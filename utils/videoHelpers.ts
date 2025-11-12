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
import { File, Directory, Paths } from 'expo-file-system';

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
  fileName?: string;
  displayName?: string;
}

type FileNameParts = {
  baseName: string;
  extension: string;
  originalName: string;
};

const baseCacheDirectory = Paths.cache ?? Paths.document ?? ''; 
const videoCacheDirectory = baseCacheDirectory ? `${baseCacheDirectory}local-videos/` : null;
let cacheDirectoryEnsured = false;

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

function extractFileNameParts(uri: string): FileNameParts {
  const withoutQuery = uri.split('?')[0].split('#')[0];
  const segments = withoutQuery.split('/');
  const rawName = segments.pop() || `video-${Date.now()}`;
  const decoded = safeDecode(rawName);
  const extensionMatch = decoded.match(/\.([a-zA-Z0-9]+)$/);
  const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'mp4';
  const base = extensionMatch ? decoded.slice(0, decoded.length - extensionMatch[0].length) : decoded;
  const sanitizedBase = sanitizeSegment(base) || 'video';
  return {
    baseName: sanitizedBase,
    extension,
    originalName: decoded,
  };
}

async function ensureCacheDirectory(): Promise<void> {
  if (cacheDirectoryEnsured || !videoCacheDirectory) {
    return;
  }
  try {
    const dir = new Directory(videoCacheDirectory);
    const exists = await dir.exists();
    if (!exists) {
      await dir.create();
    }
    cacheDirectoryEnsured = true;
  } catch (error) {
    console.error('[VideoHelpers] Failed to ensure cache directory:', error);
    throw new Error('CACHE_DIRECTORY_ERROR');
  }
}

function buildCacheUri(originalUri: string): { uri: string; fileName: string; displayName: string } {
  if (!videoCacheDirectory) {
    throw new Error('CACHE_DIRECTORY_UNAVAILABLE');
  }
  const parts = extractFileNameParts(originalUri);
  const hash = hashString(originalUri);
  const fileName = `${parts.baseName}-${hash}.${parts.extension}`;
  const cacheUri = `${videoCacheDirectory}${fileName}`;
  return { uri: cacheUri, fileName, displayName: parts.originalName }; 
}

function normalizeUriSpacing(uri: string): string {
  return uri.includes(' ') ? uri.replace(/\s/g, '%20') : uri;
}

export async function prepareLocalVideo(originalUri: string): Promise<PrepareLocalVideoResult> {
  const startTime = Date.now();
  const platform = Platform.OS;
  
  console.log('[VideoHelpers] ========== prepareLocalVideo START ==========');
  console.log('[VideoHelpers] Platform:', platform);
  console.log('[VideoHelpers] Original URI:', originalUri);
  console.log('[VideoHelpers] Timestamp:', new Date().toISOString());

  try {
    if (!originalUri || originalUri.trim() === '') {
      throw new Error('NO_URI: Empty or invalid URI provided');
    }

    const cleanUri = originalUri.trim();
    const normalizedOriginalUri = normalizeUriSpacing(cleanUri);

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
      uriPreview: cleanUri.substring(0, 100),
    });

    if (isHttpUri) {
      return {
        success: true,
        uri: normalizedOriginalUri,
        originUri: cleanUri,
        platform,
        needsCopy: false,
      };
    }

    if (isFileUri) {
      const file = new File(normalizedOriginalUri);
      const exists = await file.exists();
      if (!exists) {
        throw new Error('FILE_NOT_FOUND: Unable to access local file');
      }
      const parts = extractFileNameParts(cleanUri);
      let fileSize: number | undefined;
      try {
        fileSize = await file.size();
      } catch {
        fileSize = undefined;
      }
      return {
        success: true,
        uri: normalizedOriginalUri,
        originUri: cleanUri,
        platform,
        size: fileSize,
        needsCopy: false,
        isCached: true,
        fileName: `${parts.baseName}.${parts.extension}`,
        displayName: parts.originalName,
      };
    }

    if (isLocalFile) {
      await ensureCacheDirectory();
      const cacheEntry = buildCacheUri(cleanUri);
      const cacheFile = new File(cacheEntry.uri);
      const alreadyCached = await cacheFile.exists();

      if (!alreadyCached) {
        console.log('[VideoHelpers] Copying local content URI to cache:', cacheEntry.uri);
        try {
          const sourceFile = new File(cleanUri);
          await sourceFile.copy(cacheEntry.uri);
        } catch (copyError) {
          console.error('[VideoHelpers] Copy failed:', copyError);
          throw new Error(`COPY_FAILED: ${(copyError instanceof Error ? copyError.message : String(copyError))}`);
        }
      } else {
        console.log('[VideoHelpers] Using cached local video:', cacheEntry.uri);
      }

      let fileSize: number | undefined;
      try {
        fileSize = await cacheFile.size();
      } catch {
        fileSize = undefined;
      }

      const normalizedCacheUri = normalizeUriSpacing(cacheEntry.uri);
      return {
        success: true,
        uri: normalizedCacheUri,
        originUri: cleanUri,
        platform,
        size: fileSize,
        needsCopy: !alreadyCached,
        isCached: alreadyCached,
        fileName: cacheEntry.fileName,
        displayName: cacheEntry.displayName,
      };
    }

    const fallbackUri = normalizeUriSpacing(cleanUri);
    return {
      success: true,
      uri: fallbackUri,
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
