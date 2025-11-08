import { BasePlayerAdapter, PlayerCapabilities, PlayerConfig, PlayerType } from '../PlayerAdapter';
import { Platform } from 'react-native';

export type StreamProtocol = 'rtmp' | 'rtsp' | 'rtp';

export class LiveStreamAdapter extends BasePlayerAdapter {
  type: PlayerType = 'rtmp';
  
  capabilities: PlayerCapabilities = {
    supportsHLS: false,
    supportsDASH: false,
    supportsRTMP: true,
    supportsRTSP: true,
    supportsAV1: false,
    supportsVP9: false,
    supportsHEVC: Platform.OS === 'ios',
    supportsAC3: false,
    supportsEAC3: false,
    maxResolution: '1080p',
  };
  
  private protocol: StreamProtocol;
  private webViewRef: any = null;
  private fallbackToFFmpeg: boolean = false;
  
  constructor(protocol: StreamProtocol = 'rtmp') {
    super();
    this.protocol = protocol;
    console.log(`[LiveStreamAdapter] Initialized for ${protocol.toUpperCase()} protocol`);
  }
  
  async initialize(config: PlayerConfig): Promise<void> {
    await super.initialize(config);
    
    const protocolPattern = /^(rtmp|rtsp|rtp):\/\/.+/i;
    if (!protocolPattern.test(config.url)) {
      this.reportError({
        code: 'INVALID_STREAM_URL',
        message: `Invalid ${this.protocol.toUpperCase()} URL format`,
        severity: 'fatal',
        recoverable: false,
        timestamp: Date.now(),
        url: config.url,
      });
      return;
    }
    
    this.detectProtocolSupport();
    
    console.log('[LiveStreamAdapter] Stream player initialized:', {
      protocol: this.protocol,
      url: config.url,
      platform: Platform.OS,
      fallbackToFFmpeg: this.fallbackToFFmpeg,
    });
  }
  
  private detectProtocolSupport(): void {
    if (Platform.OS === 'ios') {
      if (this.protocol === 'rtmp') {
        console.warn('[LiveStreamAdapter] iOS does not support RTMP natively, will use FFmpeg fallback');
        this.fallbackToFFmpeg = true;
      }
      if (this.protocol === 'rtsp') {
        console.log('[LiveStreamAdapter] iOS has limited RTSP support, may use FFmpeg fallback');
        this.fallbackToFFmpeg = true;
      }
    } else if (Platform.OS === 'android') {
      if (this.protocol === 'rtmp') {
        console.log('[LiveStreamAdapter] Android RTMP requires ExoPlayer extension');
      }
    } else if (Platform.OS === 'web') {
      console.log('[LiveStreamAdapter] Web platform requires fallback to FFmpeg or HLS conversion');
      this.fallbackToFFmpeg = true;
    }
  }
  
  shouldUseFallback(): boolean {
    return this.fallbackToFFmpeg;
  }
  
  getWebViewPlayerHtml(): string {
    const url = this.config?.url || '';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              background: #000;
              overflow: hidden;
              width: 100vw;
              height: 100vh;
            }
            #player {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .error {
              color: white;
              text-align: center;
              padding: 20px;
              font-family: system-ui, -apple-system, sans-serif;
            }
          </style>
        </head>
        <body>
          <div id="container">
            <video id="player" controls autoplay playsinline></video>
            <div class="error" id="error" style="display:none;">
              <h3>Stream Loading Error</h3>
              <p>Could not load ${this.protocol.toUpperCase()} stream</p>
              <p><small>${url}</small></p>
            </div>
          </div>
          <script>
            console.log('[LiveStreamPlayer] Attempting to load ${this.protocol.toUpperCase()} stream');
            console.log('[LiveStreamPlayer] URL:', '${url}');
            
            var player = document.getElementById('player');
            var errorDiv = document.getElementById('error');
            
            player.addEventListener('error', function(e) {
              console.error('[LiveStreamPlayer] Video error:', e);
              errorDiv.style.display = 'block';
              player.style.display = 'none';
            });
            
            player.addEventListener('loadstart', function() {
              console.log('[LiveStreamPlayer] Stream loading started');
            });
            
            player.addEventListener('canplay', function() {
              console.log('[LiveStreamPlayer] Stream can play');
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'canplay',
                protocol: '${this.protocol}'
              }));
            });
            
            player.addEventListener('playing', function() {
              console.log('[LiveStreamPlayer] Stream is playing');
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'playing'
              }));
            });
            
            player.src = '${url}';
          </script>
        </body>
      </html>
    `;
  }
  
  async play(): Promise<void> {
    this.injectCommand('play()');
    this.updateState({ isPlaying: true, isPaused: false });
  }
  
  async pause(): Promise<void> {
    this.injectCommand('pause()');
    this.updateState({ isPlaying: false, isPaused: true });
  }
  
  async stop(): Promise<void> {
    this.injectCommand('pause(); currentTime = 0');
    this.updateState({
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    });
  }
  
  async seek(timeInSeconds: number): Promise<void> {
    console.warn('[LiveStreamAdapter] Seek not supported for live streams');
    this.updateState({ currentTime: timeInSeconds });
  }
  
  async setVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.injectCommand(`volume = ${clampedVolume}`);
    this.updateState({ volume: clampedVolume });
  }
  
  async setMuted(muted: boolean): Promise<void> {
    this.injectCommand(`muted = ${muted}`);
    this.updateState({ isMuted: muted });
  }
  
  async setPlaybackRate(rate: number): Promise<void> {
    console.warn('[LiveStreamAdapter] Playback rate not supported for live streams');
    this.updateState({ playbackRate: 1.0 });
  }
  
  private injectCommand(command: string): void {
    if (this.webViewRef && this.webViewRef.injectJavaScript) {
      const script = `
        (function() {
          try {
            var player = document.getElementById('player');
            if (player) {
              player.${command};
            }
          } catch(e) {
            console.error('[LiveStreamAdapter] Command error:', e);
          }
        })();
      `;
      this.webViewRef.injectJavaScript(script);
    }
  }
  
  setWebViewRef(ref: any): void {
    this.webViewRef = ref;
    console.log('[LiveStreamAdapter] WebView reference set');
  }
  
  async destroy(): Promise<void> {
    console.log('[LiveStreamAdapter] Destroying player');
    this.webViewRef = null;
    this.stateChangeCallbacks = [];
    this.errorCallbacks = [];
    this.config = null;
  }
}
