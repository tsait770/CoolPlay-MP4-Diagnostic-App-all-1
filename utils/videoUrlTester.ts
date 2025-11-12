export interface VideoUrlTestResult {
  accessible: boolean;
  statusCode?: number;
  contentType?: string;
  contentLength?: number;
  acceptRanges?: string;
  error?: string;
  responseTime?: number;
}

export async function testVideoUrl(url: string): Promise<VideoUrlTestResult> {
  const startTime = Date.now();
  
  try {
    console.log('[VideoUrlTester] Testing URL:', url);
    
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'Accept': 'video/*,*/*',
      },
    });
    
    const responseTime = Date.now() - startTime;
    
    const result: VideoUrlTestResult = {
      accessible: response.ok,
      statusCode: response.status,
      contentType: response.headers.get('Content-Type') || undefined,
      contentLength: parseInt(response.headers.get('Content-Length') || '0') || undefined,
      acceptRanges: response.headers.get('Accept-Ranges') || undefined,
      responseTime,
    };
    
    console.log('[VideoUrlTester] Test result:', result);
    
    if (!response.ok) {
      result.error = `HTTP ${response.status}: ${response.statusText}`;
    }
    
    const contentType = result.contentType?.toLowerCase() || '';
    if (!contentType.includes('video') && !contentType.includes('octet-stream') && !contentType.includes('mp4')) {
      console.warn('[VideoUrlTester] ⚠️ Unexpected content type:', contentType);
    }
    
    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    console.error('[VideoUrlTester] ❌ Test failed:', errorMsg);
    
    return {
      accessible: false,
      error: errorMsg,
      responseTime,
    };
  }
}

export async function testMultipleUrls(urls: string[]): Promise<Map<string, VideoUrlTestResult>> {
  console.log('[VideoUrlTester] Testing multiple URLs:', urls.length);
  
  const results = new Map<string, VideoUrlTestResult>();
  
  await Promise.all(
    urls.map(async (url) => {
      const result = await testVideoUrl(url);
      results.set(url, result);
    })
  );
  
  return results;
}

export function formatTestResult(result: VideoUrlTestResult): string {
  if (!result.accessible) {
    return `❌ Failed: ${result.error || 'Unknown error'}`;
  }
  
  const parts: string[] = [
    `✅ Success (${result.statusCode})`,
  ];
  
  if (result.contentType) {
    parts.push(`Type: ${result.contentType}`);
  }
  
  if (result.contentLength) {
    const sizeMB = (result.contentLength / 1024 / 1024).toFixed(2);
    parts.push(`Size: ${sizeMB} MB`);
  }
  
  if (result.acceptRanges) {
    parts.push(`Ranges: ${result.acceptRanges}`);
  }
  
  if (result.responseTime) {
    parts.push(`Time: ${result.responseTime}ms`);
  }
  
  return parts.join(' | ');
}
