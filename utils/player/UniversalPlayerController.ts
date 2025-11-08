import { PlayerAdapter, PlaybackState, PlayerError, PlayerConfig } from './PlayerAdapter';

export interface QualityOption {
  id: string;
  label: string;
  height: number;
  url?: string;
}

export interface UniversalPlayerControllerOptions {
  onStateChange?: (state: PlaybackState) => void;
  onError?: (error: PlayerError) => void;
  onQualityLevelsAvailable?: (qualities: QualityOption[]) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onBuffering?: (isBuffering: boolean) => void;
}

export class UniversalPlayerController {
  private adapter: PlayerAdapter;
  private options: UniversalPlayerControllerOptions;
  private unsubscribers: (() => void)[] = [];
  private timeUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private availableQualities: QualityOption[] = [];
  private currentQuality: QualityOption | null = null;

  constructor(adapter: PlayerAdapter, options: UniversalPlayerControllerOptions = {}) {
    this.adapter = adapter;
    this.options = options;
    
    console.log('[UniversalPlayerController] Initialized with adapter:', adapter.type);
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const stateUnsubscribe = this.adapter.onStateChange((state) => {
      console.log('[UniversalPlayerController] State changed:', state);
      
      if (this.options.onStateChange) {
        this.options.onStateChange(state);
      }
      
      if (this.options.onTimeUpdate) {
        this.options.onTimeUpdate(state.currentTime, state.duration);
      }
      
      if (this.options.onBuffering) {
        this.options.onBuffering(state.isBuffering);
      }
    });
    
    const errorUnsubscribe = this.adapter.onError((error) => {
      console.error('[UniversalPlayerController] Error:', error);
      if (this.options.onError) {
        this.options.onError(error);
      }
    });
    
    this.unsubscribers.push(stateUnsubscribe, errorUnsubscribe);
  }

  async initialize(config: PlayerConfig): Promise<void> {
    console.log('[UniversalPlayerController] Initializing with config:', config);
    try {
      await this.adapter.initialize(config);
      
      if (config.autoPlay) {
        await this.play();
      }
      
      this.startTimeTracking();
    } catch (error) {
      console.error('[UniversalPlayerController] Initialization failed:', error);
      throw error;
    }
  }

  async play(): Promise<void> {
    console.log('[UniversalPlayerController] Play requested');
    try {
      await this.adapter.play();
    } catch (error) {
      console.error('[UniversalPlayerController] Play failed:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    console.log('[UniversalPlayerController] Pause requested');
    try {
      await this.adapter.pause();
    } catch (error) {
      console.error('[UniversalPlayerController] Pause failed:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    console.log('[UniversalPlayerController] Stop requested');
    try {
      await this.adapter.stop();
      this.stopTimeTracking();
    } catch (error) {
      console.error('[UniversalPlayerController] Stop failed:', error);
      throw error;
    }
  }

  async seek(timeInSeconds: number): Promise<void> {
    console.log('[UniversalPlayerController] Seek to:', timeInSeconds);
    try {
      await this.adapter.seek(timeInSeconds);
    } catch (error) {
      console.error('[UniversalPlayerController] Seek failed:', error);
      throw error;
    }
  }

  async setVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    console.log('[UniversalPlayerController] Set volume:', clampedVolume);
    try {
      await this.adapter.setVolume(clampedVolume);
    } catch (error) {
      console.error('[UniversalPlayerController] Set volume failed:', error);
      throw error;
    }
  }

  async setMuted(muted: boolean): Promise<void> {
    console.log('[UniversalPlayerController] Set muted:', muted);
    try {
      await this.adapter.setMuted(muted);
    } catch (error) {
      console.error('[UniversalPlayerController] Set muted failed:', error);
      throw error;
    }
  }

  async setPlaybackRate(rate: number): Promise<void> {
    const clampedRate = Math.max(0.25, Math.min(2.0, rate));
    console.log('[UniversalPlayerController] Set playback rate:', clampedRate);
    try {
      await this.adapter.setPlaybackRate(clampedRate);
    } catch (error) {
      console.error('[UniversalPlayerController] Set playback rate failed:', error);
      throw error;
    }
  }

  async skipForward(seconds: number = 10): Promise<void> {
    const state = this.adapter.getState();
    const newTime = Math.min(state.currentTime + seconds, state.duration);
    await this.seek(newTime);
  }

  async skipBackward(seconds: number = 10): Promise<void> {
    const state = this.adapter.getState();
    const newTime = Math.max(state.currentTime - seconds, 0);
    await this.seek(newTime);
  }

  async setQuality(qualityId: string): Promise<void> {
    console.log('[UniversalPlayerController] Set quality:', qualityId);
    const quality = this.availableQualities.find(q => q.id === qualityId);
    
    if (!quality) {
      console.warn('[UniversalPlayerController] Quality not found:', qualityId);
      return;
    }
    
    if (quality.url) {
      const currentState = this.getState();
      const currentTime = currentState.currentTime;
      const wasPlaying = currentState.isPlaying;
      
      await this.adapter.initialize({
        url: quality.url,
        autoPlay: false,
      });
      
      await this.seek(currentTime);
      
      if (wasPlaying) {
        await this.play();
      }
      
      this.currentQuality = quality;
    }
  }

  getState(): PlaybackState {
    return this.adapter.getState();
  }

  getCapabilities() {
    return this.adapter.getCapabilities();
  }

  getAdapter(): PlayerAdapter {
    return this.adapter;
  }

  getAvailableQualities(): QualityOption[] {
    return [...this.availableQualities];
  }

  getCurrentQuality(): QualityOption | null {
    return this.currentQuality;
  }

  setAvailableQualities(qualities: QualityOption[]): void {
    this.availableQualities = qualities;
    
    if (qualities.length > 0 && !this.currentQuality) {
      this.currentQuality = qualities.find(q => q.id === 'auto') || qualities[0];
    }
    
    if (this.options.onQualityLevelsAvailable) {
      this.options.onQualityLevelsAvailable(qualities);
    }
  }

  private startTimeTracking(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
    
    this.timeUpdateInterval = setInterval(() => {
      const state = this.getState();
      if (this.options.onTimeUpdate && state.isPlaying) {
        this.options.onTimeUpdate(state.currentTime, state.duration);
      }
    }, 250);
  }

  private stopTimeTracking(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  async destroy(): Promise<void> {
    console.log('[UniversalPlayerController] Destroying controller');
    
    this.stopTimeTracking();
    
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
    
    try {
      await this.adapter.destroy();
    } catch (error) {
      console.error('[UniversalPlayerController] Destroy failed:', error);
    }
  }
}
