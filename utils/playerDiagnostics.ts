/**
 * Player Diagnostics and Error Logging System
 * 
 * Provides comprehensive error tracking, diagnostics, and reporting
 * for video player issues including YouTube Error Code 4.
 */

export interface PlayerError {
  timestamp: number;
  errorType: 'youtube_error_4' | 'http_error' | 'timeout' | 'codec_error' | 'network_error' | 'unknown';
  errorCode?: string | number;
  url: string;
  videoId?: string;
  platform: string;
  sourceType: string;
  retryCount: number;
  maxRetries: number;
  loadDuration?: number;
  httpStatus?: number;
  userAgent: string;
  networkType?: string;
  errorMessage: string;
  stackTrace?: string;
  embedMethod?: string;
}

export interface DiagnosticReport {
  errors: PlayerError[];
  totalErrors: number;
  youtubeError4Count: number;
  httpErrorCount: number;
  timeoutCount: number;
  successRate: number;
  averageLoadTime: number;
  commonFailurePatterns: string[];
}

class PlayerDiagnostics {
  private errors: PlayerError[] = [];
  private maxErrorHistory = 100;
  private loadStartTimes: Map<string, number> = new Map();

  /**
   * Log a player error with comprehensive details
   */
  logError(error: Omit<PlayerError, 'timestamp' | 'userAgent'>): void {
    const playerError: PlayerError = {
      ...error,
      timestamp: Date.now(),
      userAgent: this.getUserAgent(),
    };

    this.errors.push(playerError);

    // Limit error history
    if (this.errors.length > this.maxErrorHistory) {
      this.errors.shift();
    }

    // Log to console with detailed information
    console.error('[PlayerDiagnostics] Error logged:', {
      type: playerError.errorType,
      platform: playerError.platform,
      errorCode: playerError.errorCode,
      httpStatus: playerError.httpStatus,
      retryCount: playerError.retryCount,
      url: playerError.url,
      videoId: playerError.videoId,
      message: playerError.errorMessage,
    });

    // Special handling for YouTube Error Code 4
    if (playerError.errorType === 'youtube_error_4') {
      this.logYouTubeError4Details(playerError);
    }
  }

  /**
   * Log YouTube Error Code 4 specific diagnostics
   */
  private logYouTubeError4Details(error: PlayerError): void {
    console.error('[PlayerDiagnostics] YouTube Error Code 4 Detected:');
    console.error('  Video ID:', error.videoId);
    console.error('  Embed Method:', error.embedMethod);
    console.error('  Retry Attempt:', `${error.retryCount + 1}/${error.maxRetries + 1}`);
    console.error('  HTTP Status:', error.httpStatus || 'N/A');
    console.error('  Load Duration:', error.loadDuration ? `${error.loadDuration}ms` : 'N/A');
    console.error('  Network Type:', error.networkType || 'Unknown');
    
    console.error('\n[PlayerDiagnostics] Common YouTube Error 4 Causes:');
    console.error('  1. Video is Private or Unlisted');
    console.error('  2. Video has been deleted by owner');
    console.error('  3. Video embed is disabled by owner');
    console.error('  4. Geographic restrictions apply');
    console.error('  5. Age-restricted content');
    console.error('  6. Copyright claim/strike');
    
    console.error('\n[PlayerDiagnostics] Recommended Actions:');
    console.error('  1. Test URL directly: https://youtu.be/' + error.videoId);
    console.error('  2. Check video privacy settings');
    console.error('  3. Verify embed permissions');
    console.error('  4. Try VPN for geo-restrictions');
    console.error('  5. Contact video owner for access');
  }

  /**
   * Start tracking load time for a video
   */
  startLoad(url: string): void {
    this.loadStartTimes.set(url, Date.now());
    console.log(`[PlayerDiagnostics] Load started for: ${url}`);
  }

  /**
   * End tracking and calculate load duration
   */
  endLoad(url: string, success: boolean): number {
    const startTime = this.loadStartTimes.get(url);
    if (!startTime) {
      console.warn('[PlayerDiagnostics] No start time found for URL:', url);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.loadStartTimes.delete(url);

    console.log(`[PlayerDiagnostics] Load ${success ? 'succeeded' : 'failed'} in ${duration}ms for: ${url}`);
    return duration;
  }

  /**
   * Generate a comprehensive diagnostic report
   */
  generateReport(): DiagnosticReport {
    const totalErrors = this.errors.length;
    const youtubeError4Count = this.errors.filter(e => e.errorType === 'youtube_error_4').length;
    const httpErrorCount = this.errors.filter(e => e.errorType === 'http_error').length;
    const timeoutCount = this.errors.filter(e => e.errorType === 'timeout').length;

    const loadDurations = this.errors
      .filter(e => e.loadDuration !== undefined)
      .map(e => e.loadDuration!);
    
    const averageLoadTime = loadDurations.length > 0
      ? loadDurations.reduce((a, b) => a + b, 0) / loadDurations.length
      : 0;

    // Identify common failure patterns
    const commonFailurePatterns = this.identifyFailurePatterns();

    const report: DiagnosticReport = {
      errors: this.errors,
      totalErrors,
      youtubeError4Count,
      httpErrorCount,
      timeoutCount,
      successRate: this.calculateSuccessRate(),
      averageLoadTime,
      commonFailurePatterns,
    };

    console.log('[PlayerDiagnostics] Diagnostic Report Generated:', {
      totalErrors: report.totalErrors,
      youtubeError4: report.youtubeError4Count,
      httpErrors: report.httpErrorCount,
      timeouts: report.timeoutCount,
      successRate: `${(report.successRate * 100).toFixed(2)}%`,
      avgLoadTime: `${report.averageLoadTime.toFixed(0)}ms`,
    });

    return report;
  }

  /**
   * Identify common failure patterns
   */
  private identifyFailurePatterns(): string[] {
    const patterns: string[] = [];

    // Check for high HTTP 403 rate (YouTube Error 4 indicator)
    const http403Count = this.errors.filter(e => e.httpStatus === 403).length;
    if (http403Count > 3) {
      patterns.push(`High HTTP 403 rate (${http403Count} occurrences) - likely embed restrictions or geo-blocking`);
    }

    // Check for timeout patterns
    const timeoutErrors = this.errors.filter(e => e.errorType === 'timeout').length;
    if (timeoutErrors > 5) {
      patterns.push(`Frequent timeouts (${timeoutErrors} occurrences) - check network connection quality`);
    }

    // Check for specific platform failures
    const platformFailures = new Map<string, number>();
    this.errors.forEach(e => {
      const count = platformFailures.get(e.platform) || 0;
      platformFailures.set(e.platform, count + 1);
    });

    platformFailures.forEach((count, platform) => {
      if (count > 3) {
        patterns.push(`Repeated failures on ${platform} (${count} times) - platform-specific issue`);
      }
    });

    // Check for retry exhaustion
    const maxRetriesReached = this.errors.filter(e => e.retryCount >= e.maxRetries).length;
    if (maxRetriesReached > 3) {
      patterns.push(`Multiple videos failed after max retries (${maxRetriesReached} cases) - systematic issue detected`);
    }

    return patterns;
  }

  /**
   * Calculate overall success rate
   */
  private calculateSuccessRate(): number {
    // This is a simplified calculation
    // In production, you'd track both successes and failures
    const totalAttempts = this.errors.reduce((sum, e) => sum + (e.maxRetries + 1), 0);
    const failures = this.errors.length;
    
    if (totalAttempts === 0) return 1.0;
    
    return Math.max(0, 1 - (failures / totalAttempts));
  }

  /**
   * Get user agent string
   */
  private getUserAgent(): string {
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      return navigator.userAgent;
    }
    return 'Unknown User Agent';
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errors = [];
    this.loadStartTimes.clear();
    console.log('[PlayerDiagnostics] Error history cleared');
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 10): PlayerError[] {
    return this.errors.slice(-count);
  }

  /**
   * Get errors by type
   */
  getErrorsByType(type: PlayerError['errorType']): PlayerError[] {
    return this.errors.filter(e => e.errorType === type);
  }

  /**
   * Export errors as JSON
   */
  exportErrors(): string {
    return JSON.stringify(this.errors, null, 2);
  }

  /**
   * Check if URL has failed before
   */
  hasFailedBefore(url: string): boolean {
    return this.errors.some(e => e.url === url);
  }

  /**
   * Get failure count for URL
   */
  getFailureCount(url: string): number {
    return this.errors.filter(e => e.url === url).length;
  }

  /**
   * Suggest fixes based on error patterns
   */
  suggestFixes(error: PlayerError): string[] {
    const suggestions: string[] = [];

    switch (error.errorType) {
      case 'youtube_error_4':
        suggestions.push('Test the video directly on YouTube website');
        suggestions.push('Check if video privacy is set to Public');
        suggestions.push('Verify that embedding is enabled in video settings');
        suggestions.push('Try using a VPN if geo-restricted');
        suggestions.push('Contact video owner to check permissions');
        if (error.httpStatus === 403) {
          suggestions.push('HTTP 403 indicates access forbidden - likely embed disabled or region locked');
        }
        break;

      case 'http_error':
        if (error.httpStatus === 404) {
          suggestions.push('Video may have been deleted or URL is incorrect');
          suggestions.push('Verify the video ID/URL is accurate');
        } else if (error.httpStatus === 429) {
          suggestions.push('Too many requests - wait 30-60 seconds before retrying');
          suggestions.push('Consider implementing rate limiting');
        } else if (error.httpStatus && error.httpStatus >= 500) {
          suggestions.push('Server error - the platform is experiencing issues');
          suggestions.push('Try again in a few minutes');
        }
        break;

      case 'timeout':
        suggestions.push('Check your internet connection speed');
        suggestions.push('Try a different network or Wi-Fi');
        suggestions.push('Video server may be slow - try again later');
        suggestions.push('Consider increasing timeout duration');
        break;

      case 'codec_error':
        suggestions.push('Video format may not be supported');
        suggestions.push('Try converting to a standard format (H.264/AAC)');
        suggestions.push('Update device firmware/software');
        break;

      case 'network_error':
        suggestions.push('Check internet connection');
        suggestions.push('Disable VPN if active');
        suggestions.push('Try switching between Wi-Fi and mobile data');
        suggestions.push('Check firewall settings');
        break;

      default:
        suggestions.push('Try reloading the video');
        suggestions.push('Clear app cache');
        suggestions.push('Update the app to latest version');
    }

    return suggestions;
  }
}

// Singleton instance
export const playerDiagnostics = new PlayerDiagnostics();

// Export utility functions
export const logPlayerError = (error: Omit<PlayerError, 'timestamp' | 'userAgent'>) => {
  playerDiagnostics.logError(error);
};

export const startPlayerLoad = (url: string) => {
  playerDiagnostics.startLoad(url);
};

export const endPlayerLoad = (url: string, success: boolean) => {
  return playerDiagnostics.endLoad(url, success);
};

export const generateDiagnosticReport = () => {
  return playerDiagnostics.generateReport();
};

export const getPlayerDiagnosticSuggestions = (error: PlayerError) => {
  return playerDiagnostics.suggestFixes(error);
};
