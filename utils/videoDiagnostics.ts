/**
 * Video Diagnostics System
 * Comprehensive diagnostics for video playback issues
 */

import { detectVideoSource } from '@/utils/videoSourceDetector';
import { detectVideoFormat } from '@/utils/videoFormatDetector';
import { extractYouTubeVideoId } from '@/utils/videoUrlConverter';

export interface DiagnosticResult {
  url: string;
  sourceType: string;
  platform?: string;
  videoId?: string;
  formatInfo: any;
  isSupported: boolean;
  recommendedPlayer: 'native' | 'webview' | 'unsupported';
  potentialIssues: string[];
  solutions: string[];
  errorCode?: number;
  embedUrl?: string;
}

/**
 * YouTube Error Code Mapping
 */
export const YouTubeErrorCodes: Record<number, { name: string; description: string; solutions: string[] }> = {
  2: {
    name: '無效的參數錯誤',
    description: '請求包含無效參數。視頻ID可能錯誤。',
    solutions: [
      '確認視頻ID格式正確',
      '檢查URL是否完整',
      '嘗試在YouTube直接打開測試',
    ],
  },
  4: {
    name: '視頻不可用',
    description: '視頻不存在或無法訪問',
    solutions: [
      '確認視頻是否被刪除',
      '檢查視頻隱私設定（可能是私人影片）',
      '確認視頻未因版權被移除',
      '檢查地區限制',
      '確認視頻允許嵌入播放',
    ],
  },
  5: {
    name: 'HTML5 播放器錯誤',
    description: '無法在HTML5播放器中播放',
    solutions: [
      '重新整理頁面',
      '清除瀏覽器緩存',
      '更新應用程式',
      '檢查網路連線',
    ],
  },
  15: {
    name: '嵌入播放被禁止',
    description: '視頻不允許在第三方應用中播放',
    solutions: [
      '在YouTube網站直接觀看',
      '請求視頻擁有者允許嵌入',
      '使用YouTube官方應用',
    ],
  },
  100: {
    name: '視頻找不到',
    description: '指定的視頻ID不存在',
    solutions: [
      '確認視頻ID正確',
      '檢查視頻是否已被刪除',
      '嘗試其他視頻',
    ],
  },
  101: {
    name: '嵌入限制',
    description: '視頻擁有者限制了嵌入播放',
    solutions: [
      '在YouTube直接觀看',
      '聯繫視頻擁有者',
      '使用YouTube官方應用',
    ],
  },
  150: {
    name: '嵌入播放限制',
    description: '此視頻不允許在嵌入式播放器中播放',
    solutions: [
      '在YouTube網站觀看',
      '使用YouTube官方應用',
      '檢查視頻設定',
    ],
  },
};

/**
 * Get YouTube error information
 */
export function getYouTubeErrorInfo(errorCode: number): { name: string; description: string; solutions: string[] } {
  return YouTubeErrorCodes[errorCode] || {
    name: `未知錯誤 (${errorCode})`,
    description: '發生未知的YouTube錯誤',
    solutions: [
      '重新整理頁面',
      '稍後再試',
      '聯繫技術支援',
    ],
  };
}

/**
 * Diagnose video playback issues
 */
export function diagnoseVideo(url: string): DiagnosticResult {
  const sourceInfo = detectVideoSource(url);
  const formatInfo = detectVideoFormat(url);
  const potentialIssues: string[] = [];
  const solutions: string[] = [];

  let recommendedPlayer: 'native' | 'webview' | 'unsupported' = 'unsupported';
  let embedUrl: string | undefined;

  console.log('[VideoDiagnostics] Analyzing:', {
    url,
    sourceType: sourceInfo.type,
    platform: sourceInfo.platform,
    formatInfo,
  });

  // YouTube specific diagnostics
  if (sourceInfo.type === 'youtube') {
    recommendedPlayer = 'webview';
    const { videoId } = extractYouTubeVideoId(url);
    
    if (!videoId) {
      potentialIssues.push('無法解析YouTube視頻ID');
      solutions.push('確認URL格式正確');
      solutions.push('支援的格式：youtube.com/watch?v=xxx, youtu.be/xxx');
    } else {
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
      
      if (!url.includes('/embed/')) {
        potentialIssues.push('非嵌入URL格式');
        solutions.push('應用程式會自動轉換為嵌入格式');
      }

      potentialIssues.push('可能受到視頻設定限制');
      solutions.push('確認視頻允許嵌入播放');
      solutions.push('確認視頻不是私人或不公開');
      solutions.push('檢查是否有地區限制');
      solutions.push('確認視頻未被刪除');
    }
  }

  // MP4 specific diagnostics
  if (sourceInfo.type === 'direct' && formatInfo.container === 'mp4') {
    recommendedPlayer = 'native';
    
    if (url.includes('hevc') || url.includes('h265')) {
      potentialIssues.push('可能使用HEVC/H.265編碼');
      solutions.push('某些裝置不支援HEVC硬體解碼');
      solutions.push('建議使用H.264編碼的MP4');
    }

    if (!url.startsWith('https://')) {
      potentialIssues.push('非HTTPS連接');
      solutions.push('建議使用HTTPS URL');
    }

    potentialIssues.push('檔案可能需要Range Request支援');
    solutions.push('確認伺服器支援HTTP Range請求');
    solutions.push('確認Content-Type設定正確');
  }

  // HLS/DASH diagnostics
  if (sourceInfo.type === 'stream') {
    recommendedPlayer = 'native';
    
    if (formatInfo.container === 'm3u8') {
      potentialIssues.push('HLS串流格式');
      solutions.push('需要穩定的網路連線');
      solutions.push('確認.m3u8播放清單檔案可訪問');
    } else if (formatInfo.container === 'mpd') {
      potentialIssues.push('DASH串流格式');
      solutions.push('某些裝置可能不支援');
      solutions.push('建議使用HLS作為替代');
    }
  }

  // Adult platform diagnostics
  if (sourceInfo.type === 'adult') {
    recommendedPlayer = 'webview';
    potentialIssues.push('成人內容平台');
    potentialIssues.push('可能需要年齡驗證');
    potentialIssues.push('網站結構可能經常變化');
    solutions.push('確認網路環境允許訪問');
    solutions.push('使用隱私模式瀏覽');
    solutions.push('某些國家/地區可能被封鎖');
  }

  // Cloud storage diagnostics
  if (sourceInfo.type === 'gdrive' || sourceInfo.type === 'dropbox') {
    recommendedPlayer = 'webview';
    potentialIssues.push('雲端儲存連結');
    potentialIssues.push('需要轉換為直接播放連結');
    solutions.push('確認分享連結設定為「任何人都可查看」');
    solutions.push('Google Drive: 使用 /uc?export=download&id= 格式');
    solutions.push('Dropbox: 將 dl=0 改為 dl=1');
  }

  // Unknown format
  if (sourceInfo.type === 'unknown') {
    potentialIssues.push('無法識別的視頻格式');
    solutions.push('確認URL格式正確');
    solutions.push('支援的格式：MP4, WebM, HLS, YouTube, Vimeo等');
  }

  // Unsupported format
  if (sourceInfo.type === 'unsupported') {
    recommendedPlayer = 'unsupported';
    potentialIssues.push(sourceInfo.error || '不支援的格式');
    solutions.push('請使用支援的視頻格式');
    solutions.push('DRM保護內容無法播放');
  }

  return {
    url,
    sourceType: sourceInfo.type,
    platform: sourceInfo.platform,
    videoId: sourceInfo.videoId,
    formatInfo,
    isSupported: sourceInfo.type !== 'unsupported',
    recommendedPlayer,
    potentialIssues,
    solutions,
    embedUrl,
  };
}

/**
 * Generate diagnostic report
 */
export function generateDiagnosticReport(url: string): string {
  const result = diagnoseVideo(url);
  
  let report = '=== 視頻播放診斷報告 ===\n\n';
  report += `URL: ${result.url}\n`;
  report += `來源類型: ${result.sourceType}\n`;
  
  if (result.platform) {
    report += `平台: ${result.platform}\n`;
  }
  
  if (result.videoId) {
    report += `視頻ID: ${result.videoId}\n`;
  }
  
  report += `是否支援: ${result.isSupported ? '是' : '否'}\n`;
  report += `推薦播放器: ${result.recommendedPlayer}\n\n`;
  
  if (result.embedUrl) {
    report += `嵌入URL: ${result.embedUrl}\n\n`;
  }
  
  if (result.potentialIssues.length > 0) {
    report += '可能的問題:\n';
    result.potentialIssues.forEach((issue, index) => {
      report += `${index + 1}. ${issue}\n`;
    });
    report += '\n';
  }
  
  if (result.solutions.length > 0) {
    report += '建議解決方案:\n';
    result.solutions.forEach((solution, index) => {
      report += `${index + 1}. ${solution}\n`;
    });
  }
  
  return report;
}

/**
 * Test video URL accessibility
 */
export async function testVideoUrl(url: string): Promise<{
  accessible: boolean;
  statusCode?: number;
  error?: string;
  headers?: Record<string, string>;
  supportsRange?: boolean;
}> {
  try {
    console.log('[VideoDiagnostics] Testing URL accessibility:', url);
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'video/mp4,video/*,*/*',
      },
    });

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const supportsRange = headers['accept-ranges'] === 'bytes' || headers['content-range'] !== undefined;

    console.log('[VideoDiagnostics] URL test result:', {
      url,
      statusCode: response.status,
      supportsRange,
      contentType: headers['content-type'],
      contentLength: headers['content-length'],
    });

    return {
      accessible: response.ok,
      statusCode: response.status,
      headers,
      supportsRange,
    };
  } catch (error) {
    console.error('[VideoDiagnostics] URL test error:', error);
    return {
      accessible: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get detailed error message for YouTube errors
 */
export function getYouTubeErrorMessage(errorCode: number, videoId?: string): string {
  const errorInfo = getYouTubeErrorInfo(errorCode);
  
  let message = `YouTube 錯誤碼 ${errorCode}: ${errorInfo.name}\n\n`;
  message += `${errorInfo.description}\n\n`;
  
  if (videoId) {
    message += `視頻ID: ${videoId}\n`;
    message += `YouTube URL: https://youtu.be/${videoId}\n\n`;
  }
  
  message += '🛠️ 建議解決方案:\n';
  errorInfo.solutions.forEach((solution, index) => {
    message += `${index + 1}. ${solution}\n`;
  });
  
  return message;
}

/**
 * Check if URL is likely to cause playback issues
 */
export function predictPlaybackIssues(url: string): {
  hasIssues: boolean;
  issues: { severity: 'low' | 'medium' | 'high'; message: string }[];
} {
  const issues: { severity: 'low' | 'medium' | 'high'; message: string }[] = [];
  
  const sourceInfo = detectVideoSource(url);
  const formatInfo = detectVideoFormat(url);

  // YouTube-specific checks
  if (sourceInfo.type === 'youtube') {
    if (url.includes('youtube.com/watch')) {
      issues.push({
        severity: 'medium',
        message: 'YouTube watch URL需要轉換為embed格式',
      });
    }
    
    if (url.includes('/shorts/')) {
      issues.push({
        severity: 'low',
        message: 'YouTube Shorts可能在嵌入播放器中顯示不佳',
      });
    }
    
    if (url.includes('/live/')) {
      issues.push({
        severity: 'medium',
        message: 'YouTube直播可能需要特殊處理',
      });
    }
  }

  // MP4-specific checks
  if (formatInfo.container === 'mp4') {
    if (url.includes('hevc') || url.includes('h265')) {
      issues.push({
        severity: 'high',
        message: 'HEVC/H.265編碼在某些裝置上不支援',
      });
    }
    
    if (!url.startsWith('https://')) {
      issues.push({
        severity: 'medium',
        message: 'HTTP連接可能被阻擋，建議使用HTTPS',
      });
    }
    
    if (url.includes('googledrive.com') && !url.includes('/uc?')) {
      issues.push({
        severity: 'high',
        message: 'Google Drive分享連結需要轉換為直接下載連結',
      });
    }
    
    if (url.includes('dropbox.com') && url.includes('dl=0')) {
      issues.push({
        severity: 'medium',
        message: 'Dropbox連結應該使用 dl=1 以啟用直接下載',
      });
    }
  }

  // Format-specific checks
  if (formatInfo.requiresFFmpeg) {
    issues.push({
      severity: 'high',
      message: `${formatInfo.container.toUpperCase()} 格式需要FFmpeg解碼器`,
    });
  }

  // Unsupported platforms
  if (sourceInfo.type === 'unsupported') {
    issues.push({
      severity: 'high',
      message: sourceInfo.error || '不支援的視頻格式',
    });
  }

  return {
    hasIssues: issues.length > 0,
    issues,
  };
}

/**
 * Generate comprehensive diagnostic report with recommendations
 */
export function generateComprehensiveDiagnostic(url: string): string {
  const diagnostic = diagnoseVideo(url);
  const prediction = predictPlaybackIssues(url);
  
  let report = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  report += '   視頻播放完整診斷報告\n';
  report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  report += '📋 基本資訊\n';
  report += `   URL: ${diagnostic.url}\n`;
  report += `   類型: ${diagnostic.sourceType}\n`;
  if (diagnostic.platform) {
    report += `   平台: ${diagnostic.platform}\n`;
  }
  if (diagnostic.videoId) {
    report += `   視頻ID: ${diagnostic.videoId}\n`;
  }
  report += `   狀態: ${diagnostic.isSupported ? '✓ 支援' : '✗ 不支援'}\n`;
  report += `   建議播放器: ${diagnostic.recommendedPlayer}\n\n`;
  
  if (diagnostic.embedUrl) {
    report += '🔗 嵌入連結\n';
    report += `   ${diagnostic.embedUrl}\n\n`;
  }
  
  if (prediction.hasIssues) {
    report += '⚠️  可能的問題\n';
    prediction.issues.forEach((issue, index) => {
      const icon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
      report += `   ${icon} ${issue.message}\n`;
    });
    report += '\n';
  }
  
  if (diagnostic.potentialIssues.length > 0) {
    report += '🔍 偵測到的問題\n';
    diagnostic.potentialIssues.forEach((issue, index) => {
      report += `   ${index + 1}. ${issue}\n`;
    });
    report += '\n';
  }
  
  if (diagnostic.solutions.length > 0) {
    report += '💡 建議解決方案\n';
    diagnostic.solutions.forEach((solution, index) => {
      report += `   ${index + 1}. ${solution}\n`;
    });
    report += '\n';
  }
  
  report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  
  return report;
}

/**
 * Log diagnostic information to console
 */
export function logDiagnostic(url: string): void {
  const report = generateComprehensiveDiagnostic(url);
  console.log(report);
}
