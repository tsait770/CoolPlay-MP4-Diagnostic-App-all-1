import { detectVideoSource, VideoSourceInfo } from './videoSourceDetector';
import { sourceParserService } from '@/lib/player/sources/SourceParserService';

export interface TestResult {
  url: string;
  name: string;
  category: 'Mainstream' | 'Adult' | 'Stream' | 'Live' | 'Premium' | 'Cloud';
  platform: string;
  sourceType: VideoSourceInfo['type'];
  canResolve: boolean;
  requiresWebView: boolean;
  requiresAuth: boolean;
  requiresAgeVerification: boolean;
  supported: boolean;
  confidence: 'high' | 'medium' | 'low' | 'unsupported';
  notes: string[];
  error?: string;
}

export interface TestReport {
  totalTests: number;
  supportedCount: number;
  unsupportedCount: number;
  partialSupportCount: number;
  successRate: number;
  results: TestResult[];
  categoryBreakdown: Record<string, { total: number; supported: number; partial: number; unsupported: number }>;
  platformBreakdown: Record<string, { total: number; supported: number; partial: number; unsupported: number }>;
  recommendations: string[];
}

export const TEST_URLS = {
  mainstream: [
    { name: 'YouTube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', category: 'Mainstream' as const },
    { name: 'YouTube Shorts', url: 'https://www.youtube.com/shorts/abc123', category: 'Mainstream' as const },
    { name: 'Vimeo', url: 'https://vimeo.com/123456789', category: 'Mainstream' as const },
    { name: 'Vimeo On Demand', url: 'https://vimeo.com/ondemand/example', category: 'Mainstream' as const },
    { name: 'Twitch', url: 'https://www.twitch.tv/videos/123456789', category: 'Mainstream' as const },
    { name: 'Facebook', url: 'https://www.facebook.com/watch/?v=123456789', category: 'Mainstream' as const },
    { name: 'TikTok', url: 'https://www.tiktok.com/@user/video/123456789', category: 'Mainstream' as const },
    { name: 'Twitter / X', url: 'https://twitter.com/user/status/123456789', category: 'Mainstream' as const },
    { name: 'Instagram', url: 'https://www.instagram.com/reel/abc123/', category: 'Mainstream' as const },
    { name: 'Dailymotion', url: 'https://www.dailymotion.com/video/x8abc123', category: 'Mainstream' as const },
    { name: 'Rumble', url: 'https://rumble.com/v12345-example.html', category: 'Mainstream' as const },
    { name: 'Odysee', url: 'https://odysee.com/@user:1/video:1', category: 'Mainstream' as const },
    { name: 'Bilibili', url: 'https://www.bilibili.com/video/BV1xx411c7mD', category: 'Mainstream' as const },
  ],
  
  adult: [
    { name: 'Pornhub', url: 'https://www.pornhub.com/view_video.php?viewkey=123', category: 'Adult' as const },
    { name: 'XVideos', url: 'https://www.xvideos.com/video123/example', category: 'Adult' as const },
    { name: 'XNXX', url: 'https://www.xnxx.com/video-123/example', category: 'Adult' as const },
    { name: 'RedTube', url: 'https://www.redtube.com/123', category: 'Adult' as const },
    { name: 'Tktube', url: 'https://www.tktube.com/video/123', category: 'Adult' as const },
    { name: 'YouPorn', url: 'https://www.youporn.com/watch/123/example/', category: 'Adult' as const },
    { name: 'SpankBang', url: 'https://www.spankbang.com/123/video/example', category: 'Adult' as const },
    { name: 'XHamster', url: 'https://xhamster.com/videos/example-123', category: 'Adult' as const },
    { name: 'Tube8', url: 'https://www.tube8.com/video/123/example', category: 'Adult' as const },
    { name: 'Beeg', url: 'https://www.beeg.com/123/', category: 'Adult' as const },
    { name: 'Slutload', url: 'https://www.slutload.com/video/123', category: 'Adult' as const },
    { name: 'Empflix', url: 'https://www.empflix.com/videos/123', category: 'Adult' as const },
    { name: 'TNAFlix', url: 'https://www.tnaflix.com/video/123', category: 'Adult' as const },
    { name: 'PornoTube', url: 'https://www.pornotube.com/video/123', category: 'Adult' as const },
    { name: 'DrPorn', url: 'https://www.drporn.com/video/123', category: 'Adult' as const },
    { name: 'Nuvid', url: 'https://www.nuvid.com/video/123', category: 'Adult' as const },
    { name: 'Porn.com', url: 'https://www.porn.com/videos/123', category: 'Adult' as const },
    { name: 'PornHD', url: 'https://www.pornhd.com/videos/123', category: 'Adult' as const },
    { name: 'XTube', url: 'https://www.xtube.com/video-watch/123', category: 'Adult' as const },
    { name: 'FreeOnes', url: 'https://www.freeones.com/videos/123', category: 'Adult' as const },
    { name: 'PornMD', url: 'https://www.pornmd.com/123', category: 'Adult' as const },
    { name: 'PornPros', url: 'https://www.pornpros.com/video/123', category: 'Adult' as const },
    { name: 'PornRabbit', url: 'https://www.pornrabbit.com/video/123', category: 'Adult' as const },
    { name: 'PornSharing', url: 'https://www.pornsharing.com/video/123', category: 'Adult' as const },
    { name: 'PornTrex', url: 'https://www.porntrex.com/video/123', category: 'Adult' as const },
    { name: 'PornTube', url: 'https://www.porntube.com/video/123', category: 'Adult' as const },
    { name: 'PornVid', url: 'https://www.pornvid.com/video/123', category: 'Adult' as const },
    { name: 'PornVideos', url: 'https://www.pornvideos.com/video/123', category: 'Adult' as const },
    { name: 'PornVids', url: 'https://www.pornvids.com/video/123', category: 'Adult' as const },
    { name: 'PornX', url: 'https://pornx.com/video/123', category: 'Adult' as const },
    { name: 'PornXXX', url: 'https://pornxxx.com/video/123', category: 'Adult' as const },
    { name: 'Porny', url: 'https://www.porny.com/video/123', category: 'Adult' as const },
    { name: 'PornZog', url: 'https://pornzog.com/video/123', category: 'Adult' as const },
    { name: 'Porzo', url: 'https://www.porzo.com/video/123', category: 'Adult' as const },
  ],

  premium: [
    { name: 'Brazzers', url: 'https://www.brazzers.com/video/123', category: 'Premium' as const },
    { name: 'Reality Kings', url: 'https://www.realitykings.com/video/123', category: 'Premium' as const },
    { name: 'Naughty America', url: 'https://www.naughtyamerica.com/video/123', category: 'Premium' as const },
    { name: 'BangBros', url: 'https://www.bangbros.com/video/123', category: 'Premium' as const },
    { name: 'Evil Angel', url: 'https://www.evilangel.com/video/123', category: 'Premium' as const },
    { name: 'Wicked', url: 'https://www.wicked.com/video/123', category: 'Premium' as const },
    { name: 'Vixen', url: 'https://www.vixen.com/video/123', category: 'Premium' as const },
    { name: 'Blacked', url: 'https://www.blacked.com/video/123', category: 'Premium' as const },
    { name: 'Tushy', url: 'https://www.tushy.com/video/123', category: 'Premium' as const },
    { name: 'Deeper', url: 'https://www.deeper.com/video/123', category: 'Premium' as const },
    { name: 'POVD', url: 'https://www.povd.com/video/123', category: 'Premium' as const },
    { name: 'POVR', url: 'https://www.povr.com/video/123', category: 'Premium' as const },
    { name: 'POVTube', url: 'https://www.povtube.com/video/123', category: 'Premium' as const },
    { name: 'POVXXX', url: 'https://www.povxxx.com/video/123', category: 'Premium' as const },
  ],

  live: [
    { name: 'Chaturbate', url: 'https://chaturbate.com/username/', category: 'Live' as const },
    { name: 'Stripchat', url: 'https://www.stripchat.com/username', category: 'Live' as const },
    { name: 'LiveJasmin', url: 'https://www.livejasmin.com/username', category: 'Live' as const },
    { name: 'BongaCams', url: 'https://www.bongacams.com/username', category: 'Live' as const },
    { name: 'MyFreeCams', url: 'https://www.myfreecams.com/username', category: 'Live' as const },
    { name: 'Cam4', url: 'https://www.cam4.com/username', category: 'Live' as const },
    { name: 'Camsoda', url: 'https://www.camsoda.com/username', category: 'Live' as const },
  ],

  streams: [
    { name: 'Direct video (MP4)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', category: 'Stream' as const },
    { name: 'HLS (m3u8)', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Stream' as const },
    { name: 'DASH (mpd)', url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd', category: 'Stream' as const },
    { name: 'RTMP stream', url: 'rtmp://live.twitch.tv/app', category: 'Stream' as const },
    { name: 'RTSP stream', url: 'rtsp://wowzaec2demo.streamserver.com/vod/mp4:BigBuckBunny_115k.mov', category: 'Stream' as const },
  ],

  cloud: [
    { name: 'Google Drive', url: 'https://drive.google.com/file/d/1abc123/view', category: 'Cloud' as const },
    { name: 'Dropbox', url: 'https://www.dropbox.com/s/abc123/video.mp4', category: 'Cloud' as const },
  ],
};

export class PlaybackTester {
  async testUrl(name: string, url: string, category: TestResult['category']): Promise<TestResult> {
    console.log(`[PlaybackTester] Testing: ${name} - ${url}`);

    try {
      const sourceInfo = detectVideoSource(url);
      const canResolve = sourceParserService.canParse(url);
      
      const notes: string[] = [];
      let supported = false;
      let confidence: TestResult['confidence'] = 'unsupported';

      if (sourceInfo.type === 'unsupported') {
        notes.push('Platform has DRM protection or is not supported');
        confidence = 'unsupported';
      } else if (sourceInfo.type === 'unknown') {
        notes.push('Unknown source type');
        confidence = 'unsupported';
      } else if (sourceInfo.requiresWebView) {
        notes.push('Requires WebView player');
        supported = true;
        confidence = 'high';
      } else if (['direct', 'stream', 'hls', 'dash'].includes(sourceInfo.type)) {
        notes.push('Native player supported');
        supported = true;
        confidence = 'high';
      } else if (['youtube', 'vimeo'].includes(sourceInfo.type)) {
        notes.push('WebView embed supported');
        supported = true;
        confidence = 'high';
      } else if (sourceInfo.type === 'adult') {
        notes.push('Adult content - WebView required');
        notes.push('Age verification required');
        supported = true;
        confidence = 'medium';
      } else if (sourceInfo.type === 'rtmp') {
        notes.push('RTMP protocol may require special handling');
        supported = true;
        confidence = 'medium';
      }

      if (canResolve) {
        notes.push('Resolver available');
      }

      if (category === 'Live') {
        notes.push('Live streaming platform');
        notes.push('Requires WebView with real-time updates');
      }

      if (category === 'Premium') {
        notes.push('Premium platform - requires authentication');
        notes.push('May require user login');
      }

      if (sourceInfo.requiresAgeVerification) {
        notes.push('Age verification modal will be shown');
      }

      return {
        url,
        name,
        category,
        platform: sourceInfo.platform,
        sourceType: sourceInfo.type,
        canResolve,
        requiresWebView: sourceInfo.requiresWebView || false,
        requiresAuth: category === 'Premium' || category === 'Live',
        requiresAgeVerification: sourceInfo.requiresAgeVerification || false,
        supported,
        confidence,
        notes,
        error: sourceInfo.error,
      };
    } catch (error) {
      console.error(`[PlaybackTester] Error testing ${name}:`, error);
      return {
        url,
        name,
        category,
        platform: 'Unknown',
        sourceType: 'unknown',
        canResolve: false,
        requiresWebView: false,
        requiresAuth: false,
        requiresAgeVerification: false,
        supported: false,
        confidence: 'unsupported',
        notes: ['Error during testing'],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async runAllTests(): Promise<TestReport> {
    console.log('[PlaybackTester] Starting comprehensive playback tests...');
    
    const allTests = [
      ...TEST_URLS.mainstream,
      ...TEST_URLS.adult,
      ...TEST_URLS.premium,
      ...TEST_URLS.live,
      ...TEST_URLS.streams,
      ...TEST_URLS.cloud,
    ];

    const results: TestResult[] = [];

    for (const test of allTests) {
      const result = await this.testUrl(test.name, test.url, test.category);
      results.push(result);
    }

    const supportedCount = results.filter(r => r.supported && r.confidence === 'high').length;
    const partialSupportCount = results.filter(r => r.supported && r.confidence === 'medium').length;
    const unsupportedCount = results.filter(r => !r.supported || r.confidence === 'unsupported').length;
    const totalTests = results.length;
    const successRate = ((supportedCount + partialSupportCount * 0.5) / totalTests) * 100;

    const categoryBreakdown = this.calculateCategoryBreakdown(results);
    const platformBreakdown = this.calculatePlatformBreakdown(results);
    const recommendations = this.generateRecommendations(results);

    const report: TestReport = {
      totalTests,
      supportedCount,
      unsupportedCount,
      partialSupportCount,
      successRate,
      results,
      categoryBreakdown,
      platformBreakdown,
      recommendations,
    };

    console.log('[PlaybackTester] Test completed:', {
      totalTests,
      supportedCount,
      partialSupportCount,
      unsupportedCount,
      successRate: `${successRate.toFixed(2)}%`,
    });

    return report;
  }

  private calculateCategoryBreakdown(results: TestResult[]) {
    const breakdown: Record<string, { total: number; supported: number; partial: number; unsupported: number }> = {};

    for (const result of results) {
      if (!breakdown[result.category]) {
        breakdown[result.category] = { total: 0, supported: 0, partial: 0, unsupported: 0 };
      }

      breakdown[result.category].total++;

      if (result.confidence === 'high') {
        breakdown[result.category].supported++;
      } else if (result.confidence === 'medium') {
        breakdown[result.category].partial++;
      } else {
        breakdown[result.category].unsupported++;
      }
    }

    return breakdown;
  }

  private calculatePlatformBreakdown(results: TestResult[]) {
    const breakdown: Record<string, { total: number; supported: number; partial: number; unsupported: number }> = {};

    for (const result of results) {
      if (!breakdown[result.platform]) {
        breakdown[result.platform] = { total: 0, supported: 0, partial: 0, unsupported: 0 };
      }

      breakdown[result.platform].total++;

      if (result.confidence === 'high') {
        breakdown[result.platform].supported++;
      } else if (result.confidence === 'medium') {
        breakdown[result.platform].partial++;
      } else {
        breakdown[result.platform].unsupported++;
      }
    }

    return breakdown;
  }

  private generateRecommendations(results: TestResult[]): string[] {
    const recommendations: string[] = [];
    const unsupported = results.filter(r => !r.supported);
    const partial = results.filter(r => r.confidence === 'medium');

    if (unsupported.length > 0) {
      recommendations.push(`${unsupported.length} platforms are currently unsupported and need implementation`);
    }

    if (partial.length > 0) {
      recommendations.push(`${partial.length} platforms have partial support and may need optimization`);
    }

    const livePlatforms = results.filter(r => r.category === 'Live');
    const liveSupportRate = livePlatforms.filter(p => p.supported).length / livePlatforms.length;
    if (liveSupportRate < 1) {
      recommendations.push('Live streaming platforms need dedicated resolver implementations');
    }

    const premiumPlatforms = results.filter(r => r.category === 'Premium');
    const premiumSupportRate = premiumPlatforms.filter(p => p.supported).length / premiumPlatforms.length;
    if (premiumSupportRate < 1) {
      recommendations.push('Premium platforms require authentication handling');
    }

    const rtmpTests = results.filter(r => r.sourceType === 'rtmp');
    if (rtmpTests.some(t => !t.supported)) {
      recommendations.push('RTMP protocol support needs verification on mobile devices');
    }

    return recommendations;
  }

  exportReportAsMarkdown(report: TestReport): string {
    let markdown = '# 🎬 影片播放系統測試報告\n\n';
    
    markdown += '## 📊 總體統計\n\n';
    markdown += `- **總測試數量**: ${report.totalTests}\n`;
    markdown += `- **完全支援**: ${report.supportedCount} (${((report.supportedCount / report.totalTests) * 100).toFixed(1)}%)\n`;
    markdown += `- **部分支援**: ${report.partialSupportCount} (${((report.partialSupportCount / report.totalTests) * 100).toFixed(1)}%)\n`;
    markdown += `- **不支援**: ${report.unsupportedCount} (${((report.unsupportedCount / report.totalTests) * 100).toFixed(1)}%)\n`;
    markdown += `- **成功率**: ${report.successRate.toFixed(2)}%\n\n`;

    markdown += '## 📁 分類統計\n\n';
    markdown += '| 分類 | 總數 | 完全支援 | 部分支援 | 不支援 | 支援率 |\n';
    markdown += '|------|------|----------|----------|--------|--------|\n';
    
    for (const [category, stats] of Object.entries(report.categoryBreakdown)) {
      const rate = ((stats.supported + stats.partial * 0.5) / stats.total) * 100;
      markdown += `| ${category} | ${stats.total} | ${stats.supported} | ${stats.partial} | ${stats.unsupported} | ${rate.toFixed(1)}% |\n`;
    }

    markdown += '\n## 🌐 平台統計\n\n';
    
    const sortedPlatforms = Object.entries(report.platformBreakdown)
      .sort(([, a], [, b]) => b.total - a.total);

    markdown += '| 平台 | 總數 | 完全支援 | 部分支援 | 不支援 |\n';
    markdown += '|------|------|----------|----------|--------|\n';
    
    for (const [platform, stats] of sortedPlatforms) {
      markdown += `| ${platform} | ${stats.total} | ${stats.supported} | ${stats.partial} | ${stats.unsupported} |\n`;
    }

    markdown += '\n## ✅ 完全支援的平台\n\n';
    const fullSupport = report.results.filter(r => r.confidence === 'high');
    for (const result of fullSupport) {
      markdown += `- ✅ **${result.name}** (${result.platform})\n`;
      markdown += `  - 類型: ${result.sourceType}\n`;
      markdown += `  - WebView: ${result.requiresWebView ? '是' : '否'}\n`;
      if (result.notes.length > 0) {
        markdown += `  - 備註: ${result.notes.join(', ')}\n`;
      }
      markdown += '\n';
    }

    markdown += '\n## ⚠️ 部分支援的平台\n\n';
    const partialSupport = report.results.filter(r => r.confidence === 'medium');
    for (const result of partialSupport) {
      markdown += `- ⚠️ **${result.name}** (${result.platform})\n`;
      markdown += `  - 類型: ${result.sourceType}\n`;
      markdown += `  - 需要認證: ${result.requiresAuth ? '是' : '否'}\n`;
      if (result.notes.length > 0) {
        markdown += `  - 備註: ${result.notes.join(', ')}\n`;
      }
      markdown += '\n';
    }

    markdown += '\n## ❌ 不支援的平台\n\n';
    const noSupport = report.results.filter(r => r.confidence === 'unsupported' || !r.supported);
    for (const result of noSupport) {
      markdown += `- ❌ **${result.name}** (${result.platform})\n`;
      markdown += `  - 類型: ${result.sourceType}\n`;
      if (result.error) {
        markdown += `  - 錯誤: ${result.error}\n`;
      }
      if (result.notes.length > 0) {
        markdown += `  - 備註: ${result.notes.join(', ')}\n`;
      }
      markdown += '\n';
    }

    markdown += '\n## 💡 改進建議\n\n';
    for (const recommendation of report.recommendations) {
      markdown += `- ${recommendation}\n`;
    }

    markdown += '\n---\n';
    markdown += `\n*報告生成時間: ${new Date().toISOString()}*\n`;

    return markdown;
  }
}

export const playbackTester = new PlaybackTester();
