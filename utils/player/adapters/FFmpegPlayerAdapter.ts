import { BasePlayerAdapter, PlayerCapabilities, PlayerConfig, PlayerType } from '../PlayerAdapter';
import { Platform } from 'react-native';

export type UnsupportedFormat = 'mkv' | 'avi' | 'wmv' | 'flv' | 'mov' | '3gp' | 'ts';

export class FFmpegPlayerAdapter extends BasePlayerAdapter {
  type: PlayerType = 'ffmpeg';
  
  capabilities: PlayerCapabilities = {
    supportsHLS: true,
    supportsDASH: true,
    supportsRTMP: true,
    supportsRTSP: true,
    supportsAV1: true,
    supportsVP9: true,
    supportsHEVC: true,
    supportsAC3: true,
    supportsEAC3: true,
    maxResolution: '4K',
  };
  
  private webViewRef: any = null;
  private format: UnsupportedFormat | null = null;
  private transcodedUrl: string | null = null;
  
  async initialize(config: PlayerConfig): Promise<void> {
    await super.initialize(config);
    
    this.detectFormat(config.url);
    
    console.log('[FFmpegPlayerAdapter] FFmpeg player initialized:', {
      format: this.format,
      url: config.url,
      platform: Platform.OS,
    });
    
    if (Platform.OS === 'web') {
      console.log('[FFmpegPlayerAdapter] Web platform: Will attempt WebAssembly FFmpeg playback');
    } else {
      console.log('[FFmpegPlayerAdapter] Native platform: FFmpeg not yet fully integrated');
      this.reportError({
        code: 'FFMPEG_NOT_AVAILABLE',
        message: 'FFmpeg player not yet fully implemented for native platforms',
        severity: 'error',
        recoverable: true,
        timestamp: Date.now(),
        url: config.url,
      });
    }
  }
  
  private detectFormat(url: string): void {
    const formatMatch = url.match(/\.(mkv|avi|wmv|flv|mov|3gp|ts)(\?.*)?$/i);
    if (formatMatch && formatMatch[1]) {
      this.format = formatMatch[1].toLowerCase() as UnsupportedFormat;
      console.log('[FFmpegPlayerAdapter] Detected format:', this.format);
    }
  }
  
  getFormat(): UnsupportedFormat | null {
    return this.format;
  }
  
  async transcodeToHLS(): Promise<string | null> {
    console.log('[FFmpegPlayerAdapter] Transcoding to HLS (not implemented)');
    
    return null;
  }
  
  async transcodeToMP4(): Promise<string | null> {
    console.log('[FFmpegPlayerAdapter] Transcoding to MP4 (not implemented)');
    
    return null;
  }
  
  getWebPlayerHtml(): string {
    const url = this.config?.url || '';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #000; overflow: hidden; }
            #player { width: 100vw; height: 100vh; object-fit: contain; }
            .message {
              color: white;
              text-align: center;
              padding: 40px 20px;
              font-family: system-ui, -apple-system, sans-serif;
            }
          </style>
        </head>
        <body>
          <div class="message">
            <h2>⚠️ 格式转换中</h2>
            <p>正在使用 FFmpeg 处理 ${this.format?.toUpperCase()} 格式...</p>
            <p><small>此功能尚在开发中</small></p>
            <br>
            <p>原始 URL:</p>
            <p style="font-size: 12px; word-break: break-all; padding: 10px;">${url}</p>
          </div>
        </body>
      </html>
    `;
  }
  
  async play(): Promise<void> {
    console.warn('[FFmpegPlayerAdapter] Play not yet implemented');
    this.updateState({ isPlaying: true, isPaused: false });
  }
  
  async pause(): Promise<void> {
    console.warn('[FFmpegPlayerAdapter] Pause not yet implemented');
    this.updateState({ isPlaying: false, isPaused: true });
  }
  
  async stop(): Promise<void> {
    console.warn('[FFmpegPlayerAdapter] Stop not yet implemented');
    this.updateState({
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    });
  }
  
  async seek(timeInSeconds: number): Promise<void> {
    console.warn('[FFmpegPlayerAdapter] Seek not yet implemented');
    this.updateState({ currentTime: timeInSeconds });
  }
  
  async setVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    console.warn('[FFmpegPlayerAdapter] Volume control not yet implemented');
    this.updateState({ volume: clampedVolume });
  }
  
  async setMuted(muted: boolean): Promise<void> {
    console.warn('[FFmpegPlayerAdapter] Mute control not yet implemented');
    this.updateState({ isMuted: muted });
  }
  
  async setPlaybackRate(rate: number): Promise<void> {
    const clampedRate = Math.max(0.25, Math.min(2.0, rate));
    console.warn('[FFmpegPlayerAdapter] Playback rate not yet implemented');
    this.updateState({ playbackRate: clampedRate });
  }
  
  setWebViewRef(ref: any): void {
    this.webViewRef = ref;
    console.log('[FFmpegPlayerAdapter] WebView reference set');
  }
  
  async destroy(): Promise<void> {
    console.log('[FFmpegPlayerAdapter] Destroying player');
    this.webViewRef = null;
    this.format = null;
    this.transcodedUrl = null;
    this.stateChangeCallbacks = [];
    this.errorCallbacks = [];
    this.config = null;
  }
}
