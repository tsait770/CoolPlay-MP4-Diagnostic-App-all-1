import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';

const errorReportSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    severity: z.enum(['info', 'warning', 'error', 'fatal']),
    recoverable: z.boolean(),
    timestamp: z.number(),
    url: z.string().optional(),
    platform: z.string().optional(),
  }),
  deviceInfo: z.object({
    platform: z.string(),
    osVersion: z.string(),
    appVersion: z.string(),
  }),
  playbackInfo: z.object({
    url: z.string(),
    format: z.string().optional(),
    playerType: z.string().optional(),
    retryAttempt: z.number().optional(),
  }),
});

export const reportPlayerErrorProcedure = protectedProcedure
  .input(errorReportSchema)
  .mutation(async ({ input, ctx }) => {
    console.log('[ReportPlayerError] Received error report:', {
      userId: ctx.user.id,
      errorCode: input.error.code,
      severity: input.error.severity,
      platform: input.deviceInfo.platform,
      playerType: input.playbackInfo.playerType,
    });
    
    try {
      const { data, error } = await ctx.supabase
        .from('player_error_reports')
        .insert({
          user_id: ctx.user.id,
          error_code: input.error.code,
          error_message: input.error.message,
          severity: input.error.severity,
          recoverable: input.error.recoverable,
          error_timestamp: new Date(input.error.timestamp).toISOString(),
          error_url: input.error.url,
          error_platform: input.error.platform,
          device_platform: input.deviceInfo.platform,
          device_os_version: input.deviceInfo.osVersion,
          device_app_version: input.deviceInfo.appVersion,
          playback_url: input.playbackInfo.url,
          playback_format: input.playbackInfo.format,
          playback_player_type: input.playbackInfo.playerType,
          playback_retry_attempt: input.playbackInfo.retryAttempt,
        })
        .select()
        .single();
      
      if (error) {
        console.error('[ReportPlayerError] Database error:', error);
        return {
          success: false,
          message: '無法記錄錯誤報告',
        };
      }
      
      console.log('[ReportPlayerError] Error report saved:', data.id);
      
      return {
        success: true,
        reportId: data.id,
        message: '錯誤報告已記錄',
      };
    } catch (error) {
      console.error('[ReportPlayerError] Exception:', error);
      return {
        success: false,
        message: '記錄錯誤報告時發生異常',
      };
    }
  });
