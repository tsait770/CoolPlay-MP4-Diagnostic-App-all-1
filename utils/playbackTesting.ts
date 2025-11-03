import { detectVideoSource, VideoSourceInfo } from './videoSourceDetector';

export interface PlatformTestUrl {
  platform: string;
  url: string;
  category: 'Mainstream' | 'Adult' | 'Social Media' | 'Other';
  expectedType?: string;
}

export interface TestResult {
  platform: string;
  url: string;
  category: string;
  detected: boolean;
  detectedType: string;
  detectedPlatform: string;
  requiresWebView: boolean;
  requiresAgeVerification: boolean;
  requiresPremium: boolean;
  error?: string;
  success: boolean;
  timestamp: number;
}

export interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  successRate: number;
  categoryBreakdown: {
    [category: string]: {
      total: number;
      passed: number;
      failed: number;
      successRate: number;
    };
  };
  results: TestResult[];
  timestamp: number;
}

export const TEST_URLS: PlatformTestUrl[] = [
  { platform: 'YouTube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', category: 'Mainstream' },
  { platform: 'YouTube Shorts', url: 'https://www.youtube.com/shorts/abc123', category: 'Mainstream' },
  { platform: 'Vimeo', url: 'https://vimeo.com/12345678', category: 'Mainstream' },
  { platform: 'Twitch', url: 'https://www.twitch.tv/videos/1234567890', category: 'Mainstream' },
  { platform: 'Facebook', url: 'https://www.facebook.com/watch/?v=123456789', category: 'Mainstream' },
  { platform: 'Google Drive', url: 'https://drive.google.com/file/d/1234567890abcdef/view', category: 'Mainstream' },
  { platform: 'Dropbox', url: 'https://www.dropbox.com/s/abc123def456/video.mp4', category: 'Mainstream' },
  { platform: 'Direct MP4', url: 'https://example.com/sample.mp4', category: 'Mainstream' },
  { platform: 'HLS Stream', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Mainstream' },
  { platform: 'DASH Stream', url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd', category: 'Mainstream' },
  
  { platform: 'Twitter', url: 'https://twitter.com/user/status/1234567890', category: 'Social Media' },
  { platform: 'Instagram', url: 'https://www.instagram.com/reel/abc123def/', category: 'Social Media' },
  { platform: 'TikTok', url: 'https://www.tiktok.com/@user/video/1234567890', category: 'Social Media' },
  { platform: 'Bilibili', url: 'https://www.bilibili.com/video/BV1234567890', category: 'Social Media' },
  { platform: 'Dailymotion', url: 'https://www.dailymotion.com/video/x7xxxxx', category: 'Social Media' },
  { platform: 'Rumble', url: 'https://rumble.com/video-123', category: 'Social Media' },
  { platform: 'Odysee', url: 'https://odysee.com/@channel/video-title', category: 'Social Media' },
  
  { platform: 'Pornhub', url: 'https://www.pornhub.com/view_video.php?viewkey=ph123456', category: 'Adult' },
  { platform: 'XVideos', url: 'https://www.xvideos.com/video123456/title', category: 'Adult' },
  { platform: 'XNXX', url: 'https://www.xnxx.com/video-abc123/title', category: 'Adult' },
  { platform: 'RedTube', url: 'https://www.redtube.com/123456', category: 'Adult' },
  { platform: 'YouPorn', url: 'https://www.youporn.com/watch/123456/title', category: 'Adult' },
  { platform: 'SpankBang', url: 'https://www.spankbang.com/abc123/video/title', category: 'Adult' },
  { platform: 'Brazzers', url: 'https://www.brazzers.com/video/view/id/123456', category: 'Adult' },
  { platform: 'BangBros', url: 'https://www.bangbros.com/video/123456', category: 'Adult' },
  { platform: 'XHamster', url: 'https://xhamster.com/videos/video-123456', category: 'Adult' },
  { platform: 'Tube8', url: 'https://www.tube8.com/video/title/123456', category: 'Adult' },
  { platform: 'Beeg', url: 'https://www.beeg.com/123456', category: 'Adult' },
  { platform: 'Chaturbate', url: 'https://chaturbate.com/model_name', category: 'Adult' },
  { platform: 'Stripchat', url: 'https://www.stripchat.com/model_name', category: 'Adult' },
  
  { platform: 'Netflix', url: 'https://www.netflix.com/watch/123456', category: 'Other' },
  { platform: 'Prime Video', url: 'https://www.primevideo.com/detail/B123456', category: 'Other' },
  { platform: 'Max (HBO)', url: 'https://www.max.com/video/watch/123456', category: 'Other' },
];

export function testUrlDetection(url: string): TestResult {
  console.log(`[PlaybackTesting] Testing URL: ${url}`);
  
  try {
    const sourceInfo: VideoSourceInfo = detectVideoSource(url);
    const testUrl = TEST_URLS.find(t => t.url === url);
    
    const result: TestResult = {
      platform: testUrl?.platform || 'Unknown',
      url,
      category: testUrl?.category || 'Other',
      detected: sourceInfo.type !== 'unknown',
      detectedType: sourceInfo.type,
      detectedPlatform: sourceInfo.platform,
      requiresWebView: sourceInfo.requiresWebView || false,
      requiresAgeVerification: sourceInfo.requiresAgeVerification || false,
      requiresPremium: sourceInfo.requiresPremium,
      error: sourceInfo.error,
      success: sourceInfo.type !== 'unknown' && !sourceInfo.error,
      timestamp: Date.now(),
    };
    
    console.log(`[PlaybackTesting] Test result:`, result);
    return result;
  } catch (error) {
    console.error(`[PlaybackTesting] Test error:`, error);
    const testUrl = TEST_URLS.find(t => t.url === url);
    
    return {
      platform: testUrl?.platform || 'Unknown',
      url,
      category: testUrl?.category || 'Other',
      detected: false,
      detectedType: 'unknown',
      detectedPlatform: 'Unknown',
      requiresWebView: false,
      requiresAgeVerification: false,
      requiresPremium: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
      timestamp: Date.now(),
    };
  }
}

export function runAllTests(): TestSummary {
  console.log('[PlaybackTesting] Running all tests...');
  
  const results: TestResult[] = TEST_URLS.map(testUrl => testUrlDetection(testUrl.url));
  
  const categoryBreakdown: { [category: string]: { total: number; passed: number; failed: number; successRate: number } } = {};
  
  results.forEach(result => {
    if (!categoryBreakdown[result.category]) {
      categoryBreakdown[result.category] = {
        total: 0,
        passed: 0,
        failed: 0,
        successRate: 0,
      };
    }
    
    categoryBreakdown[result.category].total++;
    if (result.success) {
      categoryBreakdown[result.category].passed++;
    } else {
      categoryBreakdown[result.category].failed++;
    }
  });
  
  Object.keys(categoryBreakdown).forEach(category => {
    const breakdown = categoryBreakdown[category];
    breakdown.successRate = (breakdown.passed / breakdown.total) * 100;
  });
  
  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  const successRate = (passed / results.length) * 100;
  
  const summary: TestSummary = {
    totalTests: results.length,
    passed,
    failed,
    successRate,
    categoryBreakdown,
    results,
    timestamp: Date.now(),
  };
  
  console.log('[PlaybackTesting] Test summary:', summary);
  return summary;
}

export function generateTestReport(summary: TestSummary): string {
  let report = '# InstaPlay Playback Testing Report\n\n';
  report += `**Generated**: ${new Date(summary.timestamp).toLocaleString()}\n\n`;
  report += '## Overall Results\n\n';
  report += `- **Total Tests**: ${summary.totalTests}\n`;
  report += `- **Passed**: ${summary.passed} (${summary.successRate.toFixed(2)}%)\n`;
  report += `- **Failed**: ${summary.failed} (${(100 - summary.successRate).toFixed(2)}%)\n\n`;
  
  report += '## Results by Category\n\n';
  Object.entries(summary.categoryBreakdown).forEach(([category, breakdown]) => {
    report += `### ${category}\n`;
    report += `- Total: ${breakdown.total}\n`;
    report += `- Passed: ${breakdown.passed} (${breakdown.successRate.toFixed(2)}%)\n`;
    report += `- Failed: ${breakdown.failed}\n\n`;
  });
  
  report += '## Detailed Results\n\n';
  summary.results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    report += `### ${status} ${result.platform}\n`;
    report += `- **URL**: ${result.url}\n`;
    report += `- **Category**: ${result.category}\n`;
    report += `- **Detected**: ${result.detected ? 'Yes' : 'No'}\n`;
    report += `- **Detected Type**: ${result.detectedType}\n`;
    report += `- **Detected Platform**: ${result.detectedPlatform}\n`;
    report += `- **Requires WebView**: ${result.requiresWebView ? 'Yes' : 'No'}\n`;
    report += `- **Requires Age Verification**: ${result.requiresAgeVerification ? 'Yes' : 'No'}\n`;
    report += `- **Requires Premium**: ${result.requiresPremium ? 'Yes' : 'No'}\n`;
    if (result.error) {
      report += `- **Error**: ${result.error}\n`;
    }
    report += '\n';
  });
  
  return report;
}

export function testSpecificCategory(category: 'Mainstream' | 'Adult' | 'Social Media' | 'Other'): TestSummary {
  console.log(`[PlaybackTesting] Testing category: ${category}`);
  
  const categoryUrls = TEST_URLS.filter(testUrl => testUrl.category === category);
  const results: TestResult[] = categoryUrls.map(testUrl => testUrlDetection(testUrl.url));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  const successRate = (passed / results.length) * 100;
  
  const categoryBreakdown: { [key: string]: { total: number; passed: number; failed: number; successRate: number } } = {
    [category]: {
      total: results.length,
      passed,
      failed,
      successRate,
    },
  };
  
  return {
    totalTests: results.length,
    passed,
    failed,
    successRate,
    categoryBreakdown,
    results,
    timestamp: Date.now(),
  };
}

export function exportTestResults(summary: TestSummary): string {
  return JSON.stringify(summary, null, 2);
}
