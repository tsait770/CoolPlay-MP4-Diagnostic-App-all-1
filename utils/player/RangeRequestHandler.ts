import { Platform } from 'react-native';

export interface RangeRequestOptions {
  url: string;
  start?: number;
  end?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface RangeRequestResult {
  success: boolean;
  data?: Blob | string;
  contentLength?: number;
  contentRange?: string;
  supportsRange: boolean;
  error?: string;
}

export class RangeRequestHandler {
  private static instance: RangeRequestHandler | null = null;
  private rangeCapabilityCache: Map<string, boolean> = new Map();

  private constructor() {}

  static getInstance(): RangeRequestHandler {
    if (!this.instance) {
      this.instance = new RangeRequestHandler();
    }
    return this.instance;
  }

  async testRangeSupport(url: string): Promise<boolean> {
    const cacheKey = this.getCacheKey(url);
    
    if (this.rangeCapabilityCache.has(cacheKey)) {
      return this.rangeCapabilityCache.get(cacheKey)!;
    }

    console.log('[RangeRequestHandler] Testing Range support for:', url);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'Range': 'bytes=0-1',
        },
      });

      const supportsRange = 
        response.status === 206 ||
        response.headers.get('Accept-Ranges')?.toLowerCase() === 'bytes' ||
        response.headers.get('Content-Range') !== null;

      console.log('[RangeRequestHandler] Range support test result:', {
        url,
        status: response.status,
        acceptRanges: response.headers.get('Accept-Ranges'),
        contentRange: response.headers.get('Content-Range'),
        supportsRange,
      });

      this.rangeCapabilityCache.set(cacheKey, supportsRange);
      return supportsRange;
    } catch (error) {
      console.warn('[RangeRequestHandler] Range support test failed:', error);
      this.rangeCapabilityCache.set(cacheKey, false);
      return false;
    }
  }

  async fetchWithRange(options: RangeRequestOptions): Promise<RangeRequestResult> {
    const { url, start = 0, end, timeout = 30000, headers = {} } = options;

    console.log('[RangeRequestHandler] Fetching with Range:', {
      url,
      start,
      end,
      timeout,
    });

    const requestHeaders: Record<string, string> = {
      ...headers,
    };

    if (end !== undefined) {
      requestHeaders['Range'] = `bytes=${start}-${end}`;
    } else if (start > 0) {
      requestHeaders['Range'] = `bytes=${start}-`;
    } else {
      requestHeaders['Range'] = 'bytes=0-';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: requestHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok && response.status !== 206) {
        return {
          success: false,
          supportsRange: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const contentLength = response.headers.get('Content-Length');
      const contentRange = response.headers.get('Content-Range');
      const supportsRange = response.status === 206 || contentRange !== null;

      console.log('[RangeRequestHandler] Fetch result:', {
        status: response.status,
        contentLength,
        contentRange,
        supportsRange,
      });

      let data: Blob | string;
      if (Platform.OS === 'web') {
        data = await response.blob();
      } else {
        data = await response.text();
      }

      return {
        success: true,
        data,
        contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
        contentRange: contentRange || undefined,
        supportsRange,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[RangeRequestHandler] Fetch error:', errorMessage);

      return {
        success: false,
        supportsRange: false,
        error: errorMessage,
      };
    }
  }

  async fetchFileInfo(url: string): Promise<{
    contentLength?: number;
    contentType?: string;
    supportsRange: boolean;
  }> {
    console.log('[RangeRequestHandler] Fetching file info:', url);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
      });

      const contentLength = response.headers.get('Content-Length');
      const contentType = response.headers.get('Content-Type');
      const acceptRanges = response.headers.get('Accept-Ranges');
      const supportsRange = acceptRanges?.toLowerCase() === 'bytes';

      const result = {
        contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
        contentType: contentType || undefined,
        supportsRange,
      };

      console.log('[RangeRequestHandler] File info:', result);

      return result;
    } catch (error) {
      console.warn('[RangeRequestHandler] File info fetch failed:', error);
      return {
        supportsRange: false,
      };
    }
  }

  private getCacheKey(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch {
      return url;
    }
  }

  clearCache(): void {
    this.rangeCapabilityCache.clear();
    console.log('[RangeRequestHandler] Cache cleared');
  }

  getCachedRangeSupport(url: string): boolean | undefined {
    const cacheKey = this.getCacheKey(url);
    return this.rangeCapabilityCache.get(cacheKey);
  }
}

export const rangeRequestHandler = RangeRequestHandler.getInstance();
