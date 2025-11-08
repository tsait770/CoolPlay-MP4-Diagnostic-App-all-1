import { PlayerError } from './PlayerAdapter';

export interface ErrorReport {
  id: string;
  timestamp: number;
  error: PlayerError;
  deviceInfo: {
    platform: string;
    osVersion: string;
    appVersion: string;
  };
  playbackInfo: {
    url: string;
    format?: string;
    playerType?: string;
    retryAttempt?: number;
  };
  userContext?: {
    membershipTier?: string;
    userId?: string;
  };
}

export class PlayerErrorReporter {
  private static instance: PlayerErrorReporter | null = null;
  private reports: ErrorReport[] = [];
  private maxReports: number = 100;
  
  private constructor() {}
  
  static getInstance(): PlayerErrorReporter {
    if (!this.instance) {
      this.instance = new PlayerErrorReporter();
    }
    return this.instance;
  }
  
  report(
    error: PlayerError,
    playbackUrl: string,
    context?: {
      format?: string;
      playerType?: string;
      retryAttempt?: number;
      membershipTier?: string;
      userId?: string;
    }
  ): string {
    const reportId = this.generateReportId();
    
    const report: ErrorReport = {
      id: reportId,
      timestamp: Date.now(),
      error,
      deviceInfo: this.getDeviceInfo(),
      playbackInfo: {
        url: playbackUrl,
        format: context?.format,
        playerType: context?.playerType,
        retryAttempt: context?.retryAttempt,
      },
      userContext: {
        membershipTier: context?.membershipTier,
        userId: context?.userId,
      },
    };
    
    this.reports.push(report);
    
    if (this.reports.length > this.maxReports) {
      this.reports.shift();
    }
    
    console.error('[PlayerErrorReporter] Error reported:', report);
    
    this.sendToBackend(report);
    
    return reportId;
  }
  
  private generateReportId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getDeviceInfo() {
    const { Platform } = require('react-native');
    return {
      platform: Platform.OS,
      osVersion: Platform.Version.toString(),
      appVersion: '1.0.0',
    };
  }
  
  private async sendToBackend(report: ErrorReport): Promise<void> {
    try {
      console.log('[PlayerErrorReporter] Sending report to backend:', report.id);
      
    } catch (error) {
      console.warn('[PlayerErrorReporter] Failed to send report to backend:', error);
    }
  }
  
  getReports(): ErrorReport[] {
    return [...this.reports];
  }
  
  getReportById(id: string): ErrorReport | null {
    return this.reports.find(r => r.id === id) || null;
  }
  
  clearReports(): void {
    this.reports = [];
    console.log('[PlayerErrorReporter] All reports cleared');
  }
  
  exportReports(): string {
    return JSON.stringify(this.reports, null, 2);
  }
}
