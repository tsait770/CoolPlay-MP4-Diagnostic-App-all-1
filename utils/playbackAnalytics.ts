import { VideoSourceType } from './videoSourceDetector';

export interface PlaybackEvent {
  id: string;
  type: PlaybackEventType;
  timestamp: number;
  url: string;
  platform: string;
  sourceType: VideoSourceType;
  metadata?: Record<string, any>;
}

export type PlaybackEventType =
  | 'playback_start'
  | 'playback_end'
  | 'playback_error'
  | 'load_start'
  | 'load_end'
  | 'retry_attempt'
  | 'strategy_switch'
  | 'user_interaction';

export interface PlaybackSession {
  sessionId: string;
  url: string;
  platform: string;
  sourceType: VideoSourceType;
  startTime: number;
  endTime?: number;
  events: PlaybackEvent[];
  success: boolean;
  errorCount: number;
  retryCount: number;
  strategiesAttempted: string[];
  finalStrategy?: string;
  loadDuration?: number;
  playbackDuration?: number;
}

export interface PlaybackAnalytics {
  totalSessions: number;
  successfulSessions: number;
  failedSessions: number;
  successRate: number;
  averageLoadTime: number;
  averagePlaybackDuration: number;
  platformStats: Record<string, PlatformStats>;
  errorStats: Record<string, number>;
  retryStats: {
    totalRetries: number;
    averageRetriesPerSession: number;
    retrySuccessRate: number;
  };
}

export interface PlatformStats {
  platform: string;
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  averageLoadTime: number;
  commonErrors: { error: string; count: number }[];
  strategyEffectiveness: Record<string, { attempts: number; successes: number; }>;
}

class PlaybackAnalyticsService {
  private sessions: Map<string, PlaybackSession> = new Map();
  private completedSessions: PlaybackSession[] = [];
  private maxCompletedSessions: number = 1000;

  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startSession(
    sessionId: string,
    url: string,
    platform: string,
    sourceType: VideoSourceType
  ): void {
    console.log('[PlaybackAnalytics] Starting session:', sessionId, platform);
    
    this.sessions.set(sessionId, {
      sessionId,
      url,
      platform,
      sourceType,
      startTime: Date.now(),
      events: [],
      success: false,
      errorCount: 0,
      retryCount: 0,
      strategiesAttempted: [],
    });
  }

  logEvent(
    sessionId: string,
    type: PlaybackEventType,
    metadata?: Record<string, any>
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn('[PlaybackAnalytics] Session not found:', sessionId);
      return;
    }

    const event: PlaybackEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      url: session.url,
      platform: session.platform,
      sourceType: session.sourceType,
      metadata,
    };

    session.events.push(event);

    if (type === 'playback_error') {
      session.errorCount++;
    } else if (type === 'retry_attempt') {
      session.retryCount++;
    } else if (type === 'strategy_switch' && metadata?.strategy) {
      if (!session.strategiesAttempted.includes(metadata.strategy)) {
        session.strategiesAttempted.push(metadata.strategy);
      }
    }

    console.log('[PlaybackAnalytics] Event logged:', type, metadata);
  }

  endSession(sessionId: string, success: boolean, finalStrategy?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn('[PlaybackAnalytics] Session not found:', sessionId);
      return;
    }

    session.endTime = Date.now();
    session.success = success;
    session.finalStrategy = finalStrategy;

    const loadStart = session.events.find((e) => e.type === 'load_start');
    const loadEnd = session.events.find((e) => e.type === 'load_end');
    if (loadStart && loadEnd) {
      session.loadDuration = loadEnd.timestamp - loadStart.timestamp;
    }

    const playbackStart = session.events.find((e) => e.type === 'playback_start');
    const playbackEnd = session.events.find((e) => e.type === 'playback_end');
    if (playbackStart && playbackEnd) {
      session.playbackDuration = playbackEnd.timestamp - playbackStart.timestamp;
    }

    console.log('[PlaybackAnalytics] Session ended:', {
      sessionId,
      success,
      duration: session.endTime - session.startTime,
      errorCount: session.errorCount,
      retryCount: session.retryCount,
    });

    this.completedSessions.push(session);
    this.sessions.delete(sessionId);

    if (this.completedSessions.length > this.maxCompletedSessions) {
      this.completedSessions.shift();
    }
  }

  getSessionStats(sessionId: string): Partial<PlaybackSession> | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      sessionId: session.sessionId,
      platform: session.platform,
      sourceType: session.sourceType,
      errorCount: session.errorCount,
      retryCount: session.retryCount,
      strategiesAttempted: session.strategiesAttempted,
      events: session.events,
    };
  }

  getAnalytics(): PlaybackAnalytics {
    const allSessions = [...this.completedSessions];
    const totalSessions = allSessions.length;
    const successfulSessions = allSessions.filter((s) => s.success).length;
    const failedSessions = totalSessions - successfulSessions;
    const successRate = totalSessions > 0 ? (successfulSessions / totalSessions) * 100 : 0;

    const totalLoadTime = allSessions.reduce(
      (sum, s) => sum + (s.loadDuration || 0),
      0
    );
    const averageLoadTime =
      allSessions.filter((s) => s.loadDuration).length > 0
        ? totalLoadTime / allSessions.filter((s) => s.loadDuration).length
        : 0;

    const totalPlaybackDuration = allSessions.reduce(
      (sum, s) => sum + (s.playbackDuration || 0),
      0
    );
    const averagePlaybackDuration =
      allSessions.filter((s) => s.playbackDuration).length > 0
        ? totalPlaybackDuration / allSessions.filter((s) => s.playbackDuration).length
        : 0;

    const platformStats: Record<string, PlatformStats> = {};
    allSessions.forEach((session) => {
      if (!platformStats[session.platform]) {
        platformStats[session.platform] = {
          platform: session.platform,
          totalAttempts: 0,
          successfulAttempts: 0,
          failedAttempts: 0,
          successRate: 0,
          averageLoadTime: 0,
          commonErrors: [],
          strategyEffectiveness: {},
        };
      }

      const stats = platformStats[session.platform];
      stats.totalAttempts++;
      
      if (session.success) {
        stats.successfulAttempts++;
      } else {
        stats.failedAttempts++;
      }

      if (session.loadDuration) {
        stats.averageLoadTime =
          (stats.averageLoadTime * (stats.totalAttempts - 1) + session.loadDuration) /
          stats.totalAttempts;
      }

      if (session.finalStrategy) {
        if (!stats.strategyEffectiveness[session.finalStrategy]) {
          stats.strategyEffectiveness[session.finalStrategy] = {
            attempts: 0,
            successes: 0,
          };
        }
        stats.strategyEffectiveness[session.finalStrategy].attempts++;
        if (session.success) {
          stats.strategyEffectiveness[session.finalStrategy].successes++;
        }
      }

      stats.successRate =
        stats.totalAttempts > 0
          ? (stats.successfulAttempts / stats.totalAttempts) * 100
          : 0;
    });

    const errorStats: Record<string, number> = {};
    allSessions.forEach((session) => {
      session.events
        .filter((e) => e.type === 'playback_error')
        .forEach((event) => {
          const errorKey = event.metadata?.error || 'Unknown error';
          errorStats[errorKey] = (errorStats[errorKey] || 0) + 1;
        });
    });

    const totalRetries = allSessions.reduce((sum, s) => sum + s.retryCount, 0);
    const averageRetriesPerSession =
      totalSessions > 0 ? totalRetries / totalSessions : 0;
    const retriedSessions = allSessions.filter((s) => s.retryCount > 0);
    const successfulRetries = retriedSessions.filter((s) => s.success).length;
    const retrySuccessRate =
      retriedSessions.length > 0
        ? (successfulRetries / retriedSessions.length) * 100
        : 0;

    return {
      totalSessions,
      successfulSessions,
      failedSessions,
      successRate,
      averageLoadTime,
      averagePlaybackDuration,
      platformStats,
      errorStats,
      retryStats: {
        totalRetries,
        averageRetriesPerSession,
        retrySuccessRate,
      },
    };
  }

  getPlatformStats(platform: string): PlatformStats | null {
    const analytics = this.getAnalytics();
    return analytics.platformStats[platform] || null;
  }

  getRecentSessions(count: number = 10): PlaybackSession[] {
    return this.completedSessions.slice(-count);
  }

  clearAnalytics(): void {
    console.log('[PlaybackAnalytics] Clearing all analytics data');
    this.sessions.clear();
    this.completedSessions = [];
  }

  exportAnalytics(): string {
    const analytics = this.getAnalytics();
    return JSON.stringify(analytics, null, 2);
  }

  logSummary(): void {
    const analytics = this.getAnalytics();
    
    console.log('=== Playback Analytics Summary ===');
    console.log(`Total Sessions: ${analytics.totalSessions}`);
    console.log(`Success Rate: ${analytics.successRate.toFixed(2)}%`);
    console.log(`Average Load Time: ${analytics.averageLoadTime.toFixed(0)}ms`);
    console.log(`Average Playback Duration: ${(analytics.averagePlaybackDuration / 1000).toFixed(2)}s`);
    
    console.log('\n=== Platform Stats ===');
    Object.values(analytics.platformStats).forEach((stats) => {
      console.log(`${stats.platform}:`);
      console.log(`  Success Rate: ${stats.successRate.toFixed(2)}%`);
      console.log(`  Total Attempts: ${stats.totalAttempts}`);
      console.log(`  Average Load Time: ${stats.averageLoadTime.toFixed(0)}ms`);
    });

    console.log('\n=== Retry Stats ===');
    console.log(`Total Retries: ${analytics.retryStats.totalRetries}`);
    console.log(`Average Retries Per Session: ${analytics.retryStats.averageRetriesPerSession.toFixed(2)}`);
    console.log(`Retry Success Rate: ${analytics.retryStats.retrySuccessRate.toFixed(2)}%`);

    console.log('\n=== Top Errors ===');
    const sortedErrors = Object.entries(analytics.errorStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    sortedErrors.forEach(([error, count]) => {
      console.log(`  ${error}: ${count}`);
    });
    
    console.log('=================================');
  }
}

export const playbackAnalytics = new PlaybackAnalyticsService();
