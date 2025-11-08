export enum VoiceCommandType {
  PLAY = 'play',
  PAUSE = 'pause',
  STOP = 'stop',
  NEXT = 'next',
  PREVIOUS = 'previous',
  
  VOLUME_MAX = 'volumeMax',
  VOLUME_HALF = 'volumeHalf',
  VOLUME_ZERO = 'volumeZero',
  VOLUME_UP = 'volumeUp',
  VOLUME_DOWN = 'volumeDown',
  VOLUME_SET = 'volumeSet',
  
  MUTE = 'mute',
  UNMUTE = 'unmute',
  
  SEEK_FORWARD_10 = 'seekForward10',
  SEEK_FORWARD_30 = 'seekForward30',
  SEEK_BACKWARD_10 = 'seekBackward10',
  SEEK_BACKWARD_30 = 'seekBackward30',
  SEEK_TO = 'seekTo',
  
  SPEED_NORMAL = 'speedNormal',
  SPEED_FAST = 'speedFast',
  SPEED_SLOW = 'speedSlow',
  SPEED_SET = 'speedSet',
  
  QUALITY_AUTO = 'qualityAuto',
  QUALITY_1080P = 'quality1080p',
  QUALITY_720P = 'quality720p',
  QUALITY_480P = 'quality480p',
  QUALITY_4K = 'quality4K',
  
  FULLSCREEN = 'fullscreen',
  EXIT_FULLSCREEN = 'exitFullscreen',
  
  OPEN_URL = 'openUrl',
  UNKNOWN = 'unknown',
}

export interface VoiceCommand {
  type: VoiceCommandType;
  params?: {
    volume?: number;
    seekTime?: number;
    speed?: number;
    url?: string;
    [key: string]: any;
  };
  confidence?: number;
}

export class EnhancedCommandMapper {
  private static instance: EnhancedCommandMapper;

  private constructor() {
    console.log('[EnhancedCommandMapper] Initialized');
  }

  public static getInstance(): EnhancedCommandMapper {
    if (!EnhancedCommandMapper.instance) {
      EnhancedCommandMapper.instance = new EnhancedCommandMapper();
    }
    return EnhancedCommandMapper.instance;
  }

  public mapFromText(text: string): VoiceCommand {
    const normalizedText = text.trim().toLowerCase();
    console.log('[EnhancedCommandMapper] Mapping text:', normalizedText);

    const command = this.detectCommand(normalizedText);
    console.log('[EnhancedCommandMapper] Detected command:', command);
    
    return command;
  }

  private detectCommand(text: string): VoiceCommand {
    if (this.matchesPlayback(text, ['播放', 'play', '開始'])) {
      return { type: VoiceCommandType.PLAY, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['暫停', 'pause', '停一下'])) {
      return { type: VoiceCommandType.PAUSE, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['停止', 'stop'])) {
      return { type: VoiceCommandType.STOP, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['下一個', '下一首', '下一部', 'next'])) {
      return { type: VoiceCommandType.NEXT, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['上一個', '上一首', '上一部', 'previous', 'prev'])) {
      return { type: VoiceCommandType.PREVIOUS, confidence: 1.0 };
    }

    const volumeCommand = this.detectVolumeCommand(text);
    if (volumeCommand) return volumeCommand;

    const muteCommand = this.detectMuteCommand(text);
    if (muteCommand) return muteCommand;

    const seekCommand = this.detectSeekCommand(text);
    if (seekCommand) return seekCommand;

    const speedCommand = this.detectSpeedCommand(text);
    if (speedCommand) return speedCommand;

    const qualityCommand = this.detectQualityCommand(text);
    if (qualityCommand) return qualityCommand;

    const fullscreenCommand = this.detectFullscreenCommand(text);
    if (fullscreenCommand) return fullscreenCommand;

    const urlCommand = this.detectUrlCommand(text);
    if (urlCommand) return urlCommand;

    console.warn('[EnhancedCommandMapper] Unknown command:', text);
    return { type: VoiceCommandType.UNKNOWN, confidence: 0 };
  }

  private detectVolumeCommand(text: string): VoiceCommand | null {
    if (this.matchesPlayback(text, ['音量最大', '最大聲', 'volume max', 'max volume', '音量 100'])) {
      return { type: VoiceCommandType.VOLUME_MAX, params: { volume: 1.0 }, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['音量一半', '音量 50', 'half volume', 'volume half'])) {
      return { type: VoiceCommandType.VOLUME_HALF, params: { volume: 0.5 }, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['音量歸零', '音量 0', 'volume zero'])) {
      return { type: VoiceCommandType.VOLUME_ZERO, params: { volume: 0 }, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['調高音量', '增加音量', '大聲一點', 'volume up', 'louder', 'increase volume'])) {
      return { type: VoiceCommandType.VOLUME_UP, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['調低音量', '減少音量', '小聲一點', 'volume down', 'quieter', 'decrease volume'])) {
      return { type: VoiceCommandType.VOLUME_DOWN, confidence: 1.0 };
    }

    const volumeMatch = text.match(/音量\s*(\d+)|volume\s*(\d+)/i);
    if (volumeMatch) {
      const volume = parseInt(volumeMatch[1] || volumeMatch[2]) / 100;
      return {
        type: VoiceCommandType.VOLUME_SET,
        params: { volume: Math.max(0, Math.min(1, volume)) },
        confidence: 0.9,
      };
    }

    return null;
  }

  private detectMuteCommand(text: string): VoiceCommand | null {
    if (this.matchesPlayback(text, ['靜音', '關閉聲音', 'mute', 'silence'])) {
      return { type: VoiceCommandType.MUTE, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['取消靜音', '開啟聲音', 'unmute', 'sound on'])) {
      return { type: VoiceCommandType.UNMUTE, confidence: 1.0 };
    }

    return null;
  }

  private detectSeekCommand(text: string): VoiceCommand | null {
    if (this.matchesPlayback(text, ['快轉 10 秒', '快轉10秒', '前進 10 秒', 'forward 10', 'skip 10'])) {
      return { type: VoiceCommandType.SEEK_FORWARD_10, params: { seekTime: 10 }, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['快轉 30 秒', '快轉30秒', '前進 30 秒', 'forward 30', 'skip 30'])) {
      return { type: VoiceCommandType.SEEK_FORWARD_30, params: { seekTime: 30 }, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['倒轉 10 秒', '倒轉10秒', '後退 10 秒', 'back 10', 'rewind 10', 'backward 10'])) {
      return { type: VoiceCommandType.SEEK_BACKWARD_10, params: { seekTime: -10 }, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['倒轉 30 秒', '倒轉30秒', '後退 30 秒', 'back 30', 'rewind 30', 'backward 30'])) {
      return { type: VoiceCommandType.SEEK_BACKWARD_30, params: { seekTime: -30 }, confidence: 1.0 };
    }

    const seekMatch = text.match(/(?:快轉|前進|forward|skip)\s*(\d+)|(?:倒轉|後退|back|rewind)\s*(\d+)/i);
    if (seekMatch) {
      const time = parseInt(seekMatch[1] || seekMatch[2]);
      const isForward = seekMatch[1] !== undefined;
      
      return {
        type: VoiceCommandType.SEEK_TO,
        params: { seekTime: isForward ? time : -time },
        confidence: 0.8,
      };
    }

    return null;
  }

  private detectSpeedCommand(text: string): VoiceCommand | null {
    if (this.matchesPlayback(text, ['正常速度', '一倍速', 'normal speed', '1x'])) {
      return { type: VoiceCommandType.SPEED_NORMAL, params: { speed: 1.0 }, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['快速播放', '加速', '兩倍速', 'fast', 'speed up', '2x'])) {
      return { type: VoiceCommandType.SPEED_FAST, params: { speed: 2.0 }, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['慢速播放', '減速', '半速', 'slow', 'slow down', '0.5x'])) {
      return { type: VoiceCommandType.SPEED_SLOW, params: { speed: 0.5 }, confidence: 1.0 };
    }

    const speedMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:倍速|x|times)/i);
    if (speedMatch) {
      const speed = parseFloat(speedMatch[1]);
      return {
        type: VoiceCommandType.SPEED_SET,
        params: { speed: Math.max(0.25, Math.min(2.0, speed)) },
        confidence: 0.9,
      };
    }

    return null;
  }

  private detectQualityCommand(text: string): VoiceCommand | null {
    if (this.matchesPlayback(text, ['自動畫質', 'auto quality', '自動'])) {
      return { type: VoiceCommandType.QUALITY_AUTO, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['4k', '4k 畫質', '超高清', 'ultra hd', '2160p'])) {
      return { type: VoiceCommandType.QUALITY_4K, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['1080p', '1080', '全高清', 'full hd'])) {
      return { type: VoiceCommandType.QUALITY_1080P, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['720p', '720', '高清', 'hd'])) {
      return { type: VoiceCommandType.QUALITY_720P, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['480p', '480', '標清', 'sd'])) {
      return { type: VoiceCommandType.QUALITY_480P, confidence: 1.0 };
    }

    return null;
  }

  private detectFullscreenCommand(text: string): VoiceCommand | null {
    if (this.matchesPlayback(text, ['全螢幕', '全屏', 'fullscreen', 'full screen'])) {
      return { type: VoiceCommandType.FULLSCREEN, confidence: 1.0 };
    }

    if (this.matchesPlayback(text, ['退出全螢幕', '退出全屏', 'exit fullscreen', 'leave fullscreen'])) {
      return { type: VoiceCommandType.EXIT_FULLSCREEN, confidence: 1.0 };
    }

    return null;
  }

  private detectUrlCommand(text: string): VoiceCommand | null {
    if (text.includes('開啟') || text.includes('打開') || text.startsWith('open ')) {
      const urlMatch = text.match(/https?:\/\/[^\s]+/i);
      if (urlMatch) {
        return {
          type: VoiceCommandType.OPEN_URL,
          params: { url: urlMatch[0] },
          confidence: 0.9,
        };
      }
    }

    return null;
  }

  private matchesPlayback(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }
}

export const enhancedCommandMapper = EnhancedCommandMapper.getInstance();
