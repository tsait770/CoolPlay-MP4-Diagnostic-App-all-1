import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';

const statsSchema = z.object({
  timeRange: z.enum(['day', 'week', 'month', 'all']).default('week'),
  severity: z.enum(['info', 'warning', 'error', 'fatal']).optional(),
  platform: z.string().optional(),
});

export const getErrorStatsProcedure = protectedProcedure
  .input(statsSchema)
  .query(async ({ input, ctx }) => {
    console.log('[GetErrorStats] Fetching error statistics:', {
      userId: ctx.user.id,
      timeRange: input.timeRange,
    });
    
    try {
      let query = ctx.supabase
        .from('player_error_reports')
        .select('*', { count: 'exact' })
        .eq('user_id', ctx.user.id);
      
      const now = new Date();
      let startDate: Date;
      
      switch (input.timeRange) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
        default:
          startDate = new Date(0);
      }
      
      query = query.gte('created_at', startDate.toISOString());
      
      if (input.severity) {
        query = query.eq('severity', input.severity);
      }
      
      if (input.platform) {
        query = query.eq('device_platform', input.platform);
      }
      
      const { data, error, count } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('[GetErrorStats] Database error:', error);
        return {
          success: false,
          reports: [],
          total: 0,
          stats: null,
        };
      }
      
      const groupedBySeverity = (data || []).reduce((acc, report) => {
        acc[report.severity] = (acc[report.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const groupedByErrorCode = (data || []).reduce((acc, report) => {
        acc[report.error_code] = (acc[report.error_code] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const groupedByPlatform = (data || []).reduce((acc, report) => {
        acc[report.device_platform] = (acc[report.device_platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        success: true,
        reports: data || [],
        total: count || 0,
        stats: {
          bySeverity: groupedBySeverity,
          byErrorCode: groupedByErrorCode,
          byPlatform: groupedByPlatform,
        },
      };
    } catch (error) {
      console.error('[GetErrorStats] Exception:', error);
      return {
        success: false,
        reports: [],
        total: 0,
        stats: null,
      };
    }
  });
