export interface MP4DiagnosticsResult {
  isValid: boolean;
  url: string;
  httpStatus?: number;
  contentType?: string;
  acceptRanges?: boolean;
  contentLength?: number;
  corsEnabled?: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export async function diagnoseMP4Url(url: string): Promise<MP4DiagnosticsResult> {
  console.log('[MP4Diagnostics] Starting diagnostics for:', url);
  
  const result: MP4DiagnosticsResult = {
    isValid: true,
    url,
    errors: [],
    warnings: [],
    recommendations: [],
  };

  if (!url || url.trim() === '') {
    result.isValid = false;
    result.errors.push('Empty or invalid URL');
    return result;
  }

  try {
    new URL(url);
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Invalid URL format: ${error}`);
    return result;
  }

  try {
    console.log('[MP4Diagnostics] Sending HEAD request...');
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
      },
    });

    result.httpStatus = response.status;
    
    console.log('[MP4Diagnostics] Response status:', response.status);
    console.log('[MP4Diagnostics] Response headers:', {
      contentType: response.headers.get('content-type'),
      acceptRanges: response.headers.get('accept-ranges'),
      contentLength: response.headers.get('content-length'),
      accessControlAllowOrigin: response.headers.get('access-control-allow-origin'),
    });

    if (response.status >= 400) {
      result.isValid = false;
      result.errors.push(`HTTP ${response.status}: ${getHttpStatusMessage(response.status)}`);
      return result;
    }

    const contentType = response.headers.get('content-type');
    result.contentType = contentType || undefined;
    
    if (!contentType) {
      result.warnings.push('No Content-Type header found');
      result.recommendations.push('Server should return Content-Type: video/mp4 header');
    } else if (!contentType.includes('video')) {
      result.warnings.push(`Content-Type is "${contentType}", expected "video/mp4"`);
      result.recommendations.push('Server should return Content-Type: video/mp4 for better compatibility');
    }

    const acceptRanges = response.headers.get('accept-ranges');
    result.acceptRanges = acceptRanges === 'bytes';
    
    if (!result.acceptRanges) {
      result.warnings.push('Accept-Ranges header is missing or not set to "bytes"');
      result.recommendations.push('Enable Accept-Ranges: bytes header for seeking support');
      result.recommendations.push('This is critical for progressive playback and seeking');
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      result.contentLength = parseInt(contentLength, 10);
      console.log('[MP4Diagnostics] Content-Length:', result.contentLength, 'bytes');
      
      if (result.contentLength > 100 * 1024 * 1024) {
        result.warnings.push(`Large file size: ${(result.contentLength / 1024 / 1024).toFixed(2)} MB`);
        result.recommendations.push('Consider using adaptive streaming (HLS/DASH) for large files');
      }
    } else {
      result.warnings.push('Content-Length header is missing');
    }

    const corsHeader = response.headers.get('access-control-allow-origin');
    result.corsEnabled = corsHeader === '*' || corsHeader !== null;
    
    if (!result.corsEnabled) {
      result.warnings.push('CORS headers not properly configured');
      result.recommendations.push('Add Access-Control-Allow-Origin header for cross-origin requests');
    }

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.recommendations.push('Check internet connection and server availability');
  }

  if (!url.toLowerCase().endsWith('.mp4') && !url.toLowerCase().includes('.mp4?')) {
    result.warnings.push('URL does not have .mp4 extension');
    result.recommendations.push('Ensure URL points to a valid MP4 file');
  }

  console.log('[MP4Diagnostics] Diagnostics complete:', result);
  return result;
}

export function getHttpStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    200: 'OK',
    301: 'Moved Permanently',
    302: 'Found (Temporary Redirect)',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized - Authentication required',
    403: 'Forbidden - Access denied',
    404: 'Not Found - Video does not exist',
    429: 'Too Many Requests - Rate limited',
    451: 'Unavailable For Legal Reasons',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };
  
  return messages[status] || `HTTP ${status}`;
}

export function formatDiagnosticsReport(result: MP4DiagnosticsResult): string {
  const lines: string[] = [];
  
  lines.push('=== MP4 Diagnostics Report ===\n');
  lines.push(`URL: ${result.url}\n`);
  lines.push(`Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}\n`);
  
  if (result.httpStatus) {
    lines.push(`\nHTTP Status: ${result.httpStatus} (${getHttpStatusMessage(result.httpStatus)})`);
  }
  
  if (result.contentType) {
    lines.push(`Content-Type: ${result.contentType}`);
  }
  
  if (result.acceptRanges !== undefined) {
    lines.push(`Accept-Ranges: ${result.acceptRanges ? '✅ bytes' : '❌ Not supported'}`);
  }
  
  if (result.contentLength) {
    lines.push(`Content-Length: ${(result.contentLength / 1024 / 1024).toFixed(2)} MB`);
  }
  
  if (result.corsEnabled !== undefined) {
    lines.push(`CORS: ${result.corsEnabled ? '✅ Enabled' : '⚠️ Not configured'}`);
  }
  
  if (result.errors.length > 0) {
    lines.push('\n❌ Errors:');
    result.errors.forEach(error => lines.push(`  • ${error}`));
  }
  
  if (result.warnings.length > 0) {
    lines.push('\n⚠️ Warnings:');
    result.warnings.forEach(warning => lines.push(`  • ${warning}`));
  }
  
  if (result.recommendations.length > 0) {
    lines.push('\n💡 Recommendations:');
    result.recommendations.forEach(rec => lines.push(`  • ${rec}`));
  }
  
  return lines.join('\n');
}

export async function testMP4Playability(url: string): Promise<{
  canPlay: boolean;
  reason?: string;
  diagnostics: MP4DiagnosticsResult;
}> {
  console.log('[MP4Diagnostics] Testing MP4 playability for:', url);
  
  const diagnostics = await diagnoseMP4Url(url);
  
  if (!diagnostics.isValid) {
    return {
      canPlay: false,
      reason: diagnostics.errors.join('; '),
      diagnostics,
    };
  }
  
  if (diagnostics.errors.length > 0) {
    return {
      canPlay: false,
      reason: diagnostics.errors[0],
      diagnostics,
    };
  }
  
  if (!diagnostics.acceptRanges) {
    return {
      canPlay: true,
      reason: 'May have issues with seeking - Accept-Ranges header missing',
      diagnostics,
    };
  }
  
  return {
    canPlay: true,
    diagnostics,
  };
}
