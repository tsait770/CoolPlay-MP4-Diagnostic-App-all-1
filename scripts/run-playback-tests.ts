#!/usr/bin/env bun

import { playbackTester } from '../utils/playbackTester';
import { writeFileSync } from 'fs';
import { join } from 'path';

console.log('🎬 影片播放系統測試工具');
console.log('========================================\n');

async function runTests() {
  try {
    console.log('📋 開始測試...\n');
    console.log('測試項目：');
    console.log('  ✓ 主流平台 (YouTube, Vimeo, Twitch 等)');
    console.log('  ✓ 成人平台 (30+ 平台)');
    console.log('  ✓ 付費平台 (Brazzers, Reality Kings 等)');
    console.log('  ✓ 直播平台 (Chaturbate, Stripchat 等)');
    console.log('  ✓ 串流格式 (MP4, HLS, DASH, RTMP, RTSP)');
    console.log('  ✓ 雲端平台 (Google Drive, Dropbox)\n');
    
    const startTime = Date.now();
    const report = await playbackTester.runAllTests();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n========================================');
    console.log('📊 測試完成！');
    console.log('========================================\n');
    
    console.log(`⏱️  測試時間: ${duration} 秒\n`);
    
    console.log('📈 測試結果:');
    console.log(`  總測試數:   ${report.totalTests}`);
    console.log(`  ✅ 完全支援: ${report.supportedCount} (${((report.supportedCount / report.totalTests) * 100).toFixed(1)}%)`);
    console.log(`  ⚠️  部分支援: ${report.partialSupportCount} (${((report.partialSupportCount / report.totalTests) * 100).toFixed(1)}%)`);
    console.log(`  ❌ 不支援:   ${report.unsupportedCount} (${((report.unsupportedCount / report.totalTests) * 100).toFixed(1)}%)`);
    console.log(`  🎯 成功率:   ${report.successRate.toFixed(2)}%\n`);
    
    console.log('📁 分類統計:');
    for (const [category, stats] of Object.entries(report.categoryBreakdown)) {
      const rate = ((stats.supported + stats.partial * 0.5) / stats.total) * 100;
      console.log(`  ${category.padEnd(15)} ${stats.supported}/${stats.total} (${rate.toFixed(1)}%)`);
    }
    console.log('');
    
    if (report.recommendations.length > 0) {
      console.log('💡 改進建議:');
      report.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
      console.log('');
    }
    
    const markdown = playbackTester.exportReportAsMarkdown(report);
    const reportPath = join(process.cwd(), 'PLAYBACK_TEST_REPORT.md');
    writeFileSync(reportPath, markdown, 'utf-8');
    
    console.log(`📄 詳細報告已生成: ${reportPath}\n`);
    
    const jsonReportPath = join(process.cwd(), 'playback-test-report.json');
    writeFileSync(jsonReportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`📊 JSON報告已生成: ${jsonReportPath}\n`);
    
    console.log('✅ 測試完成！\n');
    
    if (report.successRate < 80) {
      console.log('⚠️  警告: 成功率低於80%，建議檢查不支援的平台\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ 測試失敗:', error);
    process.exit(1);
  }
}

runTests();
