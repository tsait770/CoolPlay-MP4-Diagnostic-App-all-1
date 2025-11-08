import { Platform } from 'react-native';

export interface CodecCapability {
  codec: string;
  isSupported: boolean;
  isHardwareAccelerated: boolean;
  maxResolution?: string;
}

export interface FormatCapabilities {
  platform: 'ios' | 'android' | 'web';
  
  containers: {
    mp4: boolean;
    webm: boolean;
    ogg: boolean;
    mkv: boolean;
    avi: boolean;
    wmv: boolean;
    flv: boolean;
    mov: boolean;
    ts: boolean;
    m4v: boolean;
  };
  
  videoCodecs: {
    h264: CodecCapability;
    h265: CodecCapability;
    vp8: CodecCapability;
    vp9: CodecCapability;
    av1: CodecCapability;
  };
  
  audioCodecs: {
    aac: CodecCapability;
    mp3: CodecCapability;
    opus: CodecCapability;
    vorbis: CodecCapability;
    ac3: CodecCapability;
    eac3: CodecCapability;
  };
  
  streamingProtocols: {
    hls: boolean;
    dash: boolean;
    rtmp: boolean;
    rtsp: boolean;
  };
  
  features: {
    rangeRequests: boolean;
    adaptiveBitrate: boolean;
    drmSupport: boolean;
  };
}

export class CodecDetector {
  private static instance: CodecDetector | null = null;
  private capabilities: FormatCapabilities | null = null;
  
  private constructor() {}
  
  static getInstance(): CodecDetector {
    if (!this.instance) {
      this.instance = new CodecDetector();
    }
    return this.instance;
  }
  
  async detectCapabilities(): Promise<FormatCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }
    
    console.log('[CodecDetector] Detecting codec capabilities...');
    
    const platform = Platform.OS as 'ios' | 'android' | 'web';
    
    this.capabilities = {
      platform,
      containers: this.detectContainerSupport(platform),
      videoCodecs: this.detectVideoCodecSupport(platform),
      audioCodecs: this.detectAudioCodecSupport(platform),
      streamingProtocols: this.detectStreamingProtocolSupport(platform),
      features: this.detectFeatureSupport(platform),
    };
    
    console.log('[CodecDetector] Capabilities detected:', this.capabilities);
    
    return this.capabilities;
  }
  
  private detectContainerSupport(platform: 'ios' | 'android' | 'web') {
    switch (platform) {
      case 'ios':
        return {
          mp4: true,
          webm: false,
          ogg: false,
          mkv: false,
          avi: false,
          wmv: false,
          flv: false,
          mov: true,
          ts: true,
          m4v: true,
        };
      
      case 'android':
        return {
          mp4: true,
          webm: true,
          ogg: false,
          mkv: false,
          avi: false,
          wmv: false,
          flv: false,
          mov: false,
          ts: true,
          m4v: true,
        };
      
      case 'web':
        return {
          mp4: true,
          webm: true,
          ogg: true,
          mkv: false,
          avi: false,
          wmv: false,
          flv: false,
          mov: false,
          ts: false,
          m4v: true,
        };
      
      default:
        return {
          mp4: true,
          webm: false,
          ogg: false,
          mkv: false,
          avi: false,
          wmv: false,
          flv: false,
          mov: false,
          ts: false,
          m4v: false,
        };
    }
  }
  
  private detectVideoCodecSupport(platform: 'ios' | 'android' | 'web') {
    switch (platform) {
      case 'ios':
        return {
          h264: { codec: 'H.264', isSupported: true, isHardwareAccelerated: true, maxResolution: '4K' },
          h265: { codec: 'H.265/HEVC', isSupported: true, isHardwareAccelerated: true, maxResolution: '4K' },
          vp8: { codec: 'VP8', isSupported: false, isHardwareAccelerated: false },
          vp9: { codec: 'VP9', isSupported: false, isHardwareAccelerated: false },
          av1: { codec: 'AV1', isSupported: false, isHardwareAccelerated: false },
        };
      
      case 'android':
        return {
          h264: { codec: 'H.264', isSupported: true, isHardwareAccelerated: true, maxResolution: '1080p' },
          h265: { codec: 'H.265/HEVC', isSupported: true, isHardwareAccelerated: false, maxResolution: '1080p' },
          vp8: { codec: 'VP8', isSupported: true, isHardwareAccelerated: true, maxResolution: '1080p' },
          vp9: { codec: 'VP9', isSupported: true, isHardwareAccelerated: false, maxResolution: '1080p' },
          av1: { codec: 'AV1', isSupported: false, isHardwareAccelerated: false },
        };
      
      case 'web':
        return {
          h264: { codec: 'H.264', isSupported: true, isHardwareAccelerated: true, maxResolution: '4K' },
          h265: { codec: 'H.265/HEVC', isSupported: false, isHardwareAccelerated: false },
          vp8: { codec: 'VP8', isSupported: true, isHardwareAccelerated: true, maxResolution: '1080p' },
          vp9: { codec: 'VP9', isSupported: true, isHardwareAccelerated: true, maxResolution: '4K' },
          av1: { codec: 'AV1', isSupported: true, isHardwareAccelerated: false, maxResolution: '1080p' },
        };
      
      default:
        return {
          h264: { codec: 'H.264', isSupported: true, isHardwareAccelerated: false },
          h265: { codec: 'H.265/HEVC', isSupported: false, isHardwareAccelerated: false },
          vp8: { codec: 'VP8', isSupported: false, isHardwareAccelerated: false },
          vp9: { codec: 'VP9', isSupported: false, isHardwareAccelerated: false },
          av1: { codec: 'AV1', isSupported: false, isHardwareAccelerated: false },
        };
    }
  }
  
  private detectAudioCodecSupport(platform: 'ios' | 'android' | 'web') {
    switch (platform) {
      case 'ios':
        return {
          aac: { codec: 'AAC', isSupported: true, isHardwareAccelerated: true },
          mp3: { codec: 'MP3', isSupported: true, isHardwareAccelerated: true },
          opus: { codec: 'Opus', isSupported: false, isHardwareAccelerated: false },
          vorbis: { codec: 'Vorbis', isSupported: false, isHardwareAccelerated: false },
          ac3: { codec: 'AC3', isSupported: false, isHardwareAccelerated: false },
          eac3: { codec: 'E-AC3', isSupported: false, isHardwareAccelerated: false },
        };
      
      case 'android':
        return {
          aac: { codec: 'AAC', isSupported: true, isHardwareAccelerated: true },
          mp3: { codec: 'MP3', isSupported: true, isHardwareAccelerated: true },
          opus: { codec: 'Opus', isSupported: true, isHardwareAccelerated: false },
          vorbis: { codec: 'Vorbis', isSupported: true, isHardwareAccelerated: false },
          ac3: { codec: 'AC3', isSupported: false, isHardwareAccelerated: false },
          eac3: { codec: 'E-AC3', isSupported: false, isHardwareAccelerated: false },
        };
      
      case 'web':
        return {
          aac: { codec: 'AAC', isSupported: true, isHardwareAccelerated: true },
          mp3: { codec: 'MP3', isSupported: true, isHardwareAccelerated: true },
          opus: { codec: 'Opus', isSupported: true, isHardwareAccelerated: false },
          vorbis: { codec: 'Vorbis', isSupported: true, isHardwareAccelerated: false },
          ac3: { codec: 'AC3', isSupported: false, isHardwareAccelerated: false },
          eac3: { codec: 'E-AC3', isSupported: false, isHardwareAccelerated: false },
        };
      
      default:
        return {
          aac: { codec: 'AAC', isSupported: true, isHardwareAccelerated: false },
          mp3: { codec: 'MP3', isSupported: true, isHardwareAccelerated: false },
          opus: { codec: 'Opus', isSupported: false, isHardwareAccelerated: false },
          vorbis: { codec: 'Vorbis', isSupported: false, isHardwareAccelerated: false },
          ac3: { codec: 'AC3', isSupported: false, isHardwareAccelerated: false },
          eac3: { codec: 'E-AC3', isSupported: false, isHardwareAccelerated: false },
        };
    }
  }
  
  private detectStreamingProtocolSupport(platform: 'ios' | 'android' | 'web') {
    switch (platform) {
      case 'ios':
        return {
          hls: true,
          dash: false,
          rtmp: false,
          rtsp: false,
        };
      
      case 'android':
        return {
          hls: true,
          dash: true,
          rtmp: false,
          rtsp: false,
        };
      
      case 'web':
        return {
          hls: true,
          dash: true,
          rtmp: false,
          rtsp: false,
        };
      
      default:
        return {
          hls: false,
          dash: false,
          rtmp: false,
          rtsp: false,
        };
    }
  }
  
  private detectFeatureSupport(platform: 'ios' | 'android' | 'web') {
    return {
      rangeRequests: true,
      adaptiveBitrate: platform !== 'web',
      drmSupport: platform !== 'web',
    };
  }
  
  isCodecSupported(codec: string): boolean {
    if (!this.capabilities) {
      console.warn('[CodecDetector] Capabilities not yet detected');
      return false;
    }
    
    const codecLower = codec.toLowerCase();
    
    if (codecLower.includes('h264') || codecLower.includes('avc')) {
      return this.capabilities.videoCodecs.h264.isSupported;
    }
    if (codecLower.includes('h265') || codecLower.includes('hevc')) {
      return this.capabilities.videoCodecs.h265.isSupported;
    }
    if (codecLower.includes('vp8')) {
      return this.capabilities.videoCodecs.vp8.isSupported;
    }
    if (codecLower.includes('vp9')) {
      return this.capabilities.videoCodecs.vp9.isSupported;
    }
    if (codecLower.includes('av1')) {
      return this.capabilities.videoCodecs.av1.isSupported;
    }
    if (codecLower.includes('aac')) {
      return this.capabilities.audioCodecs.aac.isSupported;
    }
    if (codecLower.includes('mp3')) {
      return this.capabilities.audioCodecs.mp3.isSupported;
    }
    if (codecLower.includes('opus')) {
      return this.capabilities.audioCodecs.opus.isSupported;
    }
    if (codecLower.includes('vorbis')) {
      return this.capabilities.audioCodecs.vorbis.isSupported;
    }
    if (codecLower.includes('ac3') || codecLower.includes('ac-3')) {
      return this.capabilities.audioCodecs.ac3.isSupported;
    }
    if (codecLower.includes('eac3') || codecLower.includes('e-ac-3')) {
      return this.capabilities.audioCodecs.eac3.isSupported;
    }
    
    console.warn('[CodecDetector] Unknown codec:', codec);
    return false;
  }
  
  getCapabilities(): FormatCapabilities | null {
    return this.capabilities;
  }
  
  reset(): void {
    this.capabilities = null;
    console.log('[CodecDetector] Capabilities reset');
  }
}
