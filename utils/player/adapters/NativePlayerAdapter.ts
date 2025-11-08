import { Platform } from 'react-native';
import { BasePlayerAdapter, PlayerCapabilities, PlayerConfig, PlayerType } from '../PlayerAdapter';

export class NativePlayerAdapter extends BasePlayerAdapter {
  type: PlayerType = 'native';
  
  capabilities: PlayerCapabilities = {
    supportsHLS: Platform.OS === 'ios',
    supportsDASH: Platform.OS === 'android',
    supportsRTMP: false,
    supportsRTSP: false,
    supportsAV1: false,
    supportsVP9: Platform.OS === 'android',
    supportsHEVC: Platform.OS === 'ios',
    supportsAC3: false,
    supportsEAC3: false,
    maxResolution: Platform.OS === 'ios' ? '4K' : '1080p',
  };
  
  private playerRef: any = null;
  
  async initialize(config: PlayerConfig): Promise<void> {
    await super.initialize(config);
    console.log('[NativePlayerAdapter] Native player initialized');
    console.log('[NativePlayerAdapter] Platform:', Platform.OS);
    console.log('[NativePlayerAdapter] Capabilities:', this.capabilities);
  }
  
  async play(): Promise<void> {
    if (!this.playerRef) {
      throw new Error('Player not initialized');
    }
    
    try {
      await this.playerRef.play();
      this.updateState({ isPlaying: true, isPaused: false });
      console.log('[NativePlayerAdapter] Playback started');
    } catch (error) {
      this.reportError({
        code: 'PLAY_FAILED',
        message: `Failed to start playback: ${error}`,
        severity: 'error',
        recoverable: true,
        timestamp: Date.now(),
      });
    }
  }
  
  async pause(): Promise<void> {
    if (!this.playerRef) {
      throw new Error('Player not initialized');
    }
    
    try {
      await this.playerRef.pause();
      this.updateState({ isPlaying: false, isPaused: true });
      console.log('[NativePlayerAdapter] Playback paused');
    } catch (error) {
      this.reportError({
        code: 'PAUSE_FAILED',
        message: `Failed to pause playback: ${error}`,
        severity: 'warning',
        recoverable: true,
        timestamp: Date.now(),
      });
    }
  }
  
  async stop(): Promise<void> {
    if (!this.playerRef) {
      return;
    }
    
    try {
      await this.playerRef.pause();
      if (this.playerRef.currentTime !== undefined) {
        this.playerRef.currentTime = 0;
      }
      this.updateState({
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
      });
      console.log('[NativePlayerAdapter] Playback stopped');
    } catch (error) {
      console.warn('[NativePlayerAdapter] Stop failed:', error);
    }
  }
  
  async seek(timeInSeconds: number): Promise<void> {
    if (!this.playerRef) {
      throw new Error('Player not initialized');
    }
    
    try {
      this.updateState({ isSeeking: true });
      this.playerRef.currentTime = timeInSeconds;
      this.updateState({
        currentTime: timeInSeconds,
        isSeeking: false,
      });
      console.log('[NativePlayerAdapter] Seeked to:', timeInSeconds);
    } catch (error) {
      this.updateState({ isSeeking: false });
      this.reportError({
        code: 'SEEK_FAILED',
        message: `Failed to seek: ${error}`,
        severity: 'warning',
        recoverable: true,
        timestamp: Date.now(),
      });
    }
  }
  
  async setVolume(volume: number): Promise<void> {
    if (!this.playerRef) {
      throw new Error('Player not initialized');
    }
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.playerRef.volume = clampedVolume;
    this.updateState({ volume: clampedVolume });
    console.log('[NativePlayerAdapter] Volume set to:', clampedVolume);
  }
  
  async setMuted(muted: boolean): Promise<void> {
    if (!this.playerRef) {
      throw new Error('Player not initialized');
    }
    
    this.playerRef.muted = muted;
    this.updateState({ isMuted: muted });
    console.log('[NativePlayerAdapter] Muted:', muted);
  }
  
  async setPlaybackRate(rate: number): Promise<void> {
    if (!this.playerRef) {
      throw new Error('Player not initialized');
    }
    
    const clampedRate = Math.max(0.25, Math.min(2.0, rate));
    if (this.playerRef.playbackRate !== undefined) {
      this.playerRef.playbackRate = clampedRate;
      this.updateState({ playbackRate: clampedRate });
      console.log('[NativePlayerAdapter] Playback rate set to:', clampedRate);
    } else {
      console.warn('[NativePlayerAdapter] Playback rate not supported');
    }
  }
  
  setPlayerRef(player: any): void {
    this.playerRef = player;
    console.log('[NativePlayerAdapter] Player reference set');
  }
  
  async destroy(): Promise<void> {
    console.log('[NativePlayerAdapter] Destroying player');
    
    if (this.playerRef) {
      try {
        await this.stop();
      } catch (error) {
        console.warn('[NativePlayerAdapter] Error stopping player:', error);
      }
      
      this.playerRef = null;
    }
    
    this.stateChangeCallbacks = [];
    this.errorCallbacks = [];
    this.config = null;
  }
}
