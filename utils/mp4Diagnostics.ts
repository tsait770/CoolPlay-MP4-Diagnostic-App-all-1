export interface MP4DiagnosticsResult {
  isValid: boolean;
  url: string;
  isLocalFile: boolean;
  fileInfo?: {
    name: string;
    size?: number;
    type?: string;
    uri: string;
  };
  httpStatus?: number;
  contentType?: string;
  acceptRanges?: boolean;
  contentLength?: number;
  corsEnabled?: boolean;
  corsFallbackTested?: boolean;
  mimeTypeIssue?: boolean;
  needsMimeCorrection?: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export async function diagnoseMP4Url(url: string): Promise<MP4DiagnosticsResult> {
  console.log('[MP4Diagnostics] Starting diagnostics for:', url);
  
  const result: MP4DiagnosticsResult = {
    isValid: true,
    url,
    isLocalFile: false,
    errors: [],
    warnings: [],
    recommendations: [],
  };

  if (!url || url.trim() === '') {
    result.isValid = false;
    result.errors.push('Empty or invalid URL');
    return result;
  }

  // Check if this is a local file (file://, content://, or asset protocol)
  const isLocalFile = url.startsWith('file://') || 
                      url.startsWith('content://') || 
                      url.startsWith('ph://') ||
                      url.startsWith('assets-library://');
  
  result.isLocalFile = isLocalFile;

  // If it's a local file, perform local file diagnostics
  if (isLocalFile) {
    console.log('[MP4Diagnostics] Detected local file, skipping network checks');
    
    // Extract file info from URI
    const fileName = url.split('/').pop() || 'Unknown';
    const cleanFileName = decodeURIComponent(fileName.split('?')[0]);
    
    result.fileInfo = {
      name: cleanFileName,
      uri: url,
    };

    // Validate file extension
    const extension = cleanFileName.toLowerCase().split('.').pop();
    const validExtensions = ['mp4', 'm4v', 'mov'];
    
    if (!extension || !validExtensions.includes(extension)) {
      result.warnings.push(`File extension .${extension} may not be a valid MP4 format`);
      result.recommendations.push('Ensure the file is in MP4, M4V, or MOV format');
      result.recommendations.push('Supported codecs: H.264 (video) + AAC (audio)');
    }

    // Local file specific validations
    result.recommendations.push('✅ Local file detected - network checks skipped');
    result.recommendations.push('Make sure the app has permission to read this file');
    
    // Check for common local file issues
    if (url.includes(' ')) {
      result.warnings.push('URI contains spaces - may cause playback issues');
      result.recommendations.push('File paths with spaces should be properly encoded');
    }

    console.log('[MP4Diagnostics] Local file diagnostics complete:', result);
    return result;
  }

  // Validate URL format (only for remote URLs)
  try {
    new URL(url);
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Invalid URL format: ${error}`);
    return result;
  }

  // First attempt: Standard HEAD request
  let response: Response | null = null;
  let corsError = false;
  
  try {
    console.log('[MP4Diagnostics] Sending HEAD request...');
    response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
      },
    });
  } catch (headError) {
    console.warn('[MP4Diagnostics] HEAD request failed, trying no-cors GET:', headError);
    corsError = true;
    
    // Fallback: Try no-cors GET request
    try {
      response = await fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
        },
      });
      result.corsFallbackTested = true;
      console.log('[MP4Diagnostics] no-cors GET request succeeded');
    } catch (noCorsError) {
      console.error('[MP4Diagnostics] Both HEAD and no-cors GET failed:', noCorsError);
      result.isValid = false;
      result.errors.push(`Network error: ${noCorsError instanceof Error ? noCorsError.message : 'Unknown error'}`);
      result.errors.push('CORS may be blocking requests - try using a proxy or server-side fetching');
      result.recommendations.push('Check internet connection and server availability');
      result.recommendations.push('Add CORS headers to your server or use a CORS proxy');
      return result;
    }
  }
  
  if (!response) {
    result.isValid = false;
    result.errors.push('No response received from server');
    return result;
  }
  
  try {

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
    
    // Check for MIME type issues
    if (!contentType) {
      result.warnings.push('No Content-Type header found');
      result.mimeTypeIssue = true;
      result.needsMimeCorrection = true;
      result.recommendations.push('Server should return Content-Type: video/mp4 header');
      result.recommendations.push('Player will attempt automatic MIME type correction');
    } else if (contentType === 'application/octet-stream' || !contentType.includes('video')) {
      result.warnings.push(`Content-Type is "${contentType}", expected "video/mp4"`);
      result.mimeTypeIssue = true;
      result.needsMimeCorrection = true;
      result.recommendations.push('Server should return Content-Type: video/mp4 for better compatibility');
      result.recommendations.push('Player will force MIME type to video/mp4');
      
      // Check if URL has MP4 extension
      if (url.toLowerCase().includes('.mp4')) {
        result.warnings.push('URL indicates MP4 file but Content-Type is incorrect');
        result.recommendations.push('Automatic MIME correction will be applied based on file extension');
      }
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
    
    if (!result.corsEnabled || corsError) {
      if (corsError) {
        result.warnings.push('CORS error detected - had to use no-cors mode');
        result.recommendations.push('CRITICAL: Add Access-Control-Allow-Origin header to your server');
        result.recommendations.push('Consider using WebView fallback for CORS-blocked videos');
      } else {
        result.warnings.push('CORS headers not properly configured');
        result.recommendations.push('Add Access-Control-Allow-Origin header for cross-origin requests');
      }
      result.recommendations.push('If you control the server, add these headers:');
      result.recommendations.push('  Access-Control-Allow-Origin: *');
      result.recommendations.push('  Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
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
