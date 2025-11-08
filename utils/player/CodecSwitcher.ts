import { CodecDetector } from './CodecDetector';

export interface TranscodingOptions {
  targetVideoCodec?: string;
  targetAudioCodec?: string;
  targetResolution?: string;
  targetBitrate?: number;
  priority?: 'quality' | 'compatibility' | 'speed';
}

export interface FallbackStrategy {
  type: 'codec-switch' | 'transcode' | 'alternative-source' | 'webview-fallback';
  reason: string;
  targetCodec?: string;
  estimatedQualityLoss?: number;
  requiresProcessing?: boolean;
}

export interface CodecSwitchDecision {
  shouldSwitch: boolean;
  originalCodec: string;
  targetCodec: string | null;
  fallbackStrategies: FallbackStrategy[];
  confidence: number;
  estimatedDelay?: number;
}

export class CodecSwitcher {
  private static instance: CodecSwitcher | null = null;
  private codecDetector: CodecDetector;

  private constructor() {
    this.codecDetector = CodecDetector.getInstance();
  }

  static getInstance(): CodecSwitcher {
    if (!this.instance) {
      this.instance = new CodecSwitcher();
    }
    return this.instance;
  }

  async analyzeAndDecide(
    videoCodec: string,
    audioCodec?: string,
    options?: TranscodingOptions
  ): Promise<CodecSwitchDecision> {
    console.log('[CodecSwitcher] Analyzing codec compatibility:', {
      videoCodec,
      audioCodec,
      options,
    });

    await this.codecDetector.detectCapabilities();

    const videoSupported = this.codecDetector.isCodecSupported(videoCodec);
    const audioSupported = audioCodec
      ? this.codecDetector.isCodecSupported(audioCodec)
      : true;

    const needsVideoSwitch = !videoSupported;
    const needsAudioSwitch = !audioSupported;

    console.log('[CodecSwitcher] Codec support status:', {
      videoCodec,
      videoSupported,
      audioCodec,
      audioSupported,
      needsVideoSwitch,
      needsAudioSwitch,
    });

    if (!needsVideoSwitch && !needsAudioSwitch) {
      return {
        shouldSwitch: false,
        originalCodec: videoCodec,
        targetCodec: null,
        fallbackStrategies: [],
        confidence: 1.0,
      };
    }

    const fallbackStrategies: FallbackStrategy[] = [];
    let targetVideoCodec: string | null = null;
    let targetAudioCodec: string | null = null;

    if (needsVideoSwitch) {
      targetVideoCodec = this.codecDetector.getSuggestedFallbackCodec(videoCodec);
      if (targetVideoCodec) {
        fallbackStrategies.push({
          type: 'codec-switch',
          reason: `Video codec ${videoCodec} not supported, switching to ${targetVideoCodec}`,
          targetCodec: targetVideoCodec,
          estimatedQualityLoss: this.estimateQualityLoss(videoCodec, targetVideoCodec),
          requiresProcessing: false,
        });
      } else {
        fallbackStrategies.push({
          type: 'webview-fallback',
          reason: `No compatible video codec found for ${videoCodec}, using WebView player`,
          estimatedQualityLoss: 0,
          requiresProcessing: false,
        });
      }
    }

    if (needsAudioSwitch && audioCodec) {
      targetAudioCodec = this.codecDetector.getSuggestedFallbackCodec(audioCodec);
      if (targetAudioCodec) {
        fallbackStrategies.push({
          type: 'codec-switch',
          reason: `Audio codec ${audioCodec} not supported, switching to ${targetAudioCodec}`,
          targetCodec: targetAudioCodec,
          estimatedQualityLoss: this.estimateQualityLoss(audioCodec, targetAudioCodec),
          requiresProcessing: false,
        });
      }
    }

    if (
      (needsVideoSwitch && !targetVideoCodec) ||
      (needsAudioSwitch && !targetAudioCodec && audioCodec)
    ) {
      fallbackStrategies.push({
        type: 'transcode',
        reason: 'Native codec switching not available, requires transcoding',
        targetCodec: targetVideoCodec || 'h264',
        estimatedQualityLoss: 20,
        requiresProcessing: true,
      });
    }

    const confidence = this.calculateConfidence(fallbackStrategies);

    return {
      shouldSwitch: true,
      originalCodec: videoCodec,
      targetCodec: targetVideoCodec || targetAudioCodec,
      fallbackStrategies,
      confidence,
      estimatedDelay: this.estimateDelay(fallbackStrategies),
    };
  }

  private estimateQualityLoss(fromCodec: string, toCodec: string): number {
    const codecQuality: Record<string, number> = {
      av1: 100,
      h265: 90,
      vp9: 85,
      h264: 75,
      vp8: 65,
      'eac3': 95,
      ac3: 85,
      aac: 80,
      opus: 75,
      mp3: 70,
    };

    const fromQuality = codecQuality[fromCodec.toLowerCase()] || 50;
    const toQuality = codecQuality[toCodec.toLowerCase()] || 50;

    const qualityLoss = Math.max(0, fromQuality - toQuality);
    return qualityLoss;
  }

  private calculateConfidence(strategies: FallbackStrategy[]): number {
    if (strategies.length === 0) {
      return 1.0;
    }

    let totalConfidence = 0;
    for (const strategy of strategies) {
      switch (strategy.type) {
        case 'codec-switch':
          totalConfidence += 0.9;
          break;
        case 'transcode':
          totalConfidence += 0.7;
          break;
        case 'alternative-source':
          totalConfidence += 0.6;
          break;
        case 'webview-fallback':
          totalConfidence += 0.8;
          break;
      }
    }

    return totalConfidence / strategies.length;
  }

  private estimateDelay(strategies: FallbackStrategy[]): number {
    let delay = 0;
    for (const strategy of strategies) {
      if (strategy.type === 'transcode') {
        delay += 5000;
      } else if (strategy.type === 'codec-switch') {
        delay += 500;
      } else if (strategy.type === 'alternative-source') {
        delay += 2000;
      }
    }
    return delay;
  }

  async getOptimalCodecForPlatform(
    availableCodecs: string[],
    preferQuality: boolean = true
  ): Promise<string | null> {
    console.log('[CodecSwitcher] Finding optimal codec from:', availableCodecs);

    await this.codecDetector.detectCapabilities();

    const capabilities = this.codecDetector.getCapabilities();
    if (!capabilities) {
      console.warn('[CodecSwitcher] Capabilities not available');
      return null;
    }

    const supportedCodecs = availableCodecs.filter((codec) =>
      this.codecDetector.isCodecSupported(codec)
    );

    if (supportedCodecs.length === 0) {
      console.warn('[CodecSwitcher] No supported codecs found');
      return null;
    }

    const codecPriority = preferQuality
      ? ['av1', 'h265', 'hevc', 'vp9', 'h264', 'vp8']
      : ['h264', 'vp8', 'h265', 'hevc', 'vp9', 'av1'];

    for (const preferredCodec of codecPriority) {
      const found = supportedCodecs.find(
        (codec) => codec.toLowerCase() === preferredCodec
      );
      if (found) {
        console.log('[CodecSwitcher] Selected optimal codec:', found);
        return found;
      }
    }

    const selected = supportedCodecs[0];
    console.log('[CodecSwitcher] Selected first available codec:', selected);
    return selected;
  }

  createFallbackPipeline(
    primaryCodec: string,
    secondaryCodec?: string
  ): string[] {
    const pipeline: string[] = [primaryCodec];

    if (secondaryCodec) {
      pipeline.push(secondaryCodec);
    }

    const fallback = this.codecDetector.getSuggestedFallbackCodec(primaryCodec);
    if (fallback && !pipeline.includes(fallback)) {
      pipeline.push(fallback);
    }

    if (!pipeline.includes('h264')) {
      pipeline.push('h264');
    }

    console.log('[CodecSwitcher] Created fallback pipeline:', pipeline);
    return pipeline;
  }
}

export const codecSwitcher = CodecSwitcher.getInstance();
