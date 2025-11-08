import { PlayerAdapter, PlayerType, PlayerError, PlayerConfig } from './PlayerAdapter';
import { PlayerAdapterFactory } from './AdapterFactory';
import { VideoSourceInfo } from '@/utils/videoSourceDetector';
import { PlayerErrorReporter } from './ErrorReporting';

export interface PipelineConfig {
  url: string;
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (stage: string, attempt: number) => void;
  onFallback?: (fromType: PlayerType, toType: PlayerType) => void;
}

export interface PipelineResult {
  success: boolean;
  adapter: PlayerAdapter | null;
  sourceInfo: VideoSourceInfo;
  attempts: PipelineAttempt[];
  finalError?: PlayerError;
}

export interface PipelineAttempt {
  playerType: PlayerType;
  timestamp: number;
  success: boolean;
  error?: PlayerError;
  durationMs?: number;
}

export class RedundancyPipeline {
  private config: PipelineConfig;
  private attempts: PipelineAttempt[] = [];
  private errorReporter = PlayerErrorReporter.getInstance();
  
  constructor(config: PipelineConfig) {
    this.config = {
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 2000,
      ...config,
    };
    
    console.log('[RedundancyPipeline] Initialized with config:', this.config);
  }
  
  async execute(): Promise<PipelineResult> {
    console.log('[RedundancyPipeline] Starting execution for URL:', this.config.url);
    
    try {
      const { adapter, sourceInfo, fallbackChain } = await PlayerAdapterFactory.createAdapter(this.config.url);
      
      console.log('[RedundancyPipeline] Primary adapter created:', adapter.type);
      console.log('[RedundancyPipeline] Fallback chain:', fallbackChain);
      
      const playerConfig: PlayerConfig = {
        url: this.config.url,
        autoPlay: false,
        retryConfig: {
          maxRetries: this.config.maxRetries || 3,
          retryDelay: this.config.retryDelay || 2000,
          exponentialBackoff: true,
        },
      };
      
      for (let i = 0; i < fallbackChain.length; i++) {
        const playerType = fallbackChain[i];
        const attemptStartTime = Date.now();
        
        this.config.onProgress?.(playerType, i + 1);
        
        console.log(`[RedundancyPipeline] Attempting ${playerType} (${i + 1}/${fallbackChain.length})`);
        
        try {
          let currentAdapter: PlayerAdapter;
          
          if (i === 0) {
            currentAdapter = adapter;
          } else {
            this.config.onFallback?.(fallbackChain[i - 1], playerType);
            
            const fallbackAdapter = await PlayerAdapterFactory.createFallbackAdapter(
              fallbackChain,
              i - 1,
              sourceInfo
            );
            
            if (!fallbackAdapter) {
              console.error('[RedundancyPipeline] No fallback adapter available');
              break;
            }
            
            currentAdapter = fallbackAdapter;
          }
          
          await currentAdapter.initialize(playerConfig);
          
          const testResult = await this.testAdapter(currentAdapter);
          
          const attemptDuration = Date.now() - attemptStartTime;
          
          if (testResult.success) {
            this.attempts.push({
              playerType,
              timestamp: attemptStartTime,
              success: true,
              durationMs: attemptDuration,
            });
            
            console.log(`[RedundancyPipeline] Success with ${playerType} after ${attemptDuration}ms`);
            
            return {
              success: true,
              adapter: currentAdapter,
              sourceInfo,
              attempts: this.attempts,
            };
          } else {
            this.attempts.push({
              playerType,
              timestamp: attemptStartTime,
              success: false,
              error: testResult.error,
              durationMs: attemptDuration,
            });
            
            if (testResult.error) {
              this.errorReporter.report(testResult.error, this.config.url, {
                playerType,
                retryAttempt: i + 1,
              });
            }
            
            console.warn(`[RedundancyPipeline] Failed with ${playerType}:`, testResult.error);
            
            await currentAdapter.destroy();
            
            if (i < fallbackChain.length - 1) {
              await this.delay(this.config.retryDelay || 2000);
            }
          }
        } catch (error) {
          const attemptDuration = Date.now() - attemptStartTime;
          
          const playerError: PlayerError = {
            code: 'ADAPTER_INITIALIZATION_FAILED',
            message: `Failed to initialize ${playerType} adapter: ${error}`,
            severity: 'error',
            recoverable: i < fallbackChain.length - 1,
            timestamp: Date.now(),
          };
          
          this.attempts.push({
            playerType,
            timestamp: attemptStartTime,
            success: false,
            error: playerError,
            durationMs: attemptDuration,
          });
          
          this.errorReporter.report(playerError, this.config.url, {
            playerType,
            retryAttempt: i + 1,
          });
          
          console.error(`[RedundancyPipeline] Exception with ${playerType}:`, error);
          
          if (i < fallbackChain.length - 1) {
            await this.delay(this.config.retryDelay || 2000);
          }
        }
      }
      
      const finalError: PlayerError = {
        code: 'ALL_ADAPTERS_FAILED',
        message: `無法播放視頻。已嘗試 ${fallbackChain.length} 種播放方式均失敗。`,
        severity: 'fatal',
        recoverable: false,
        timestamp: Date.now(),
        url: this.config.url,
      };
      
      this.errorReporter.report(finalError, this.config.url);
      
      return {
        success: false,
        adapter: null,
        sourceInfo,
        attempts: this.attempts,
        finalError,
      };
      
    } catch (error) {
      console.error('[RedundancyPipeline] Pipeline execution failed:', error);
      
      const fatalError: PlayerError = {
        code: 'PIPELINE_EXECUTION_FAILED',
        message: `Pipeline execution failed: ${error}`,
        severity: 'fatal',
        recoverable: false,
        timestamp: Date.now(),
        url: this.config.url,
      };
      
      this.errorReporter.report(fatalError, this.config.url);
      
      return {
        success: false,
        adapter: null,
        sourceInfo: {
          type: 'unknown',
          platform: 'Unknown',
          requiresPremium: false,
          error: `${error}`,
        },
        attempts: this.attempts,
        finalError: fatalError,
      };
    }
  }
  
  private async testAdapter(adapter: PlayerAdapter): Promise<{ success: boolean; error?: PlayerError }> {
    return new Promise((resolve) => {
      let resolved = false;
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            error: {
              code: 'ADAPTER_TEST_TIMEOUT',
              message: 'Adapter initialization timed out',
              severity: 'error',
              recoverable: true,
              timestamp: Date.now(),
            },
          });
        }
      }, 10000);
      
      const unsubscribeError = adapter.onError((error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          unsubscribeError();
          resolve({ success: false, error });
        }
      });
      
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          unsubscribeError();
          resolve({ success: true });
        }
      }, 3000);
    });
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  getAttempts(): PipelineAttempt[] {
    return [...this.attempts];
  }
}
