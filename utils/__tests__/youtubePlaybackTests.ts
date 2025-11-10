/**
 * YouTube Dual-Mode Playback System - Test Suite
 * 
 * Quick tests to verify the implementation works correctly
 */

import { detectYoutubePlaybackMode, extractYouTubeVideoId, isYouTubeUrl } from './youtubePlaybackManager';

interface TestCase {
  name: string;
  url: string;
  expectedMode: 'webview' | 'native' | 'not-youtube';
  expectedVideoId: string | null;
  shouldHaveEmbedUrl: boolean;
}

const testCases: TestCase[] = [
  {
    name: 'Standard YouTube watch URL',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    expectedMode: 'webview',
    expectedVideoId: 'dQw4w9WgXcQ',
    shouldHaveEmbedUrl: true,
  },
  {
    name: 'YouTube short URL',
    url: 'https://youtu.be/dQw4w9WgXcQ',
    expectedMode: 'webview',
    expectedVideoId: 'dQw4w9WgXcQ',
    shouldHaveEmbedUrl: true,
  },
  {
    name: 'YouTube mobile URL',
    url: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    expectedMode: 'webview',
    expectedVideoId: 'dQw4w9WgXcQ',
    shouldHaveEmbedUrl: true,
  },
  {
    name: 'YouTube shorts URL',
    url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    expectedMode: 'webview',
    expectedVideoId: 'dQw4w9WgXcQ',
    shouldHaveEmbedUrl: true,
  },
  {
    name: 'YouTube embed URL',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    expectedMode: 'native',
    expectedVideoId: 'dQw4w9WgXcQ',
    shouldHaveEmbedUrl: true,
  },
  {
    name: 'YouTube watch URL with timestamp',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
    expectedMode: 'webview',
    expectedVideoId: 'dQw4w9WgXcQ',
    shouldHaveEmbedUrl: true,
  },
  {
    name: 'Non-YouTube URL',
    url: 'https://vimeo.com/123456789',
    expectedMode: 'not-youtube',
    expectedVideoId: null,
    shouldHaveEmbedUrl: false,
  },
  {
    name: 'Empty URL',
    url: '',
    expectedMode: 'not-youtube',
    expectedVideoId: null,
    shouldHaveEmbedUrl: false,
  },
];

export function runYouTubePlaybackTests(): void {
  console.log('🧪 YouTube Dual-Mode Playback System - Test Suite\n');
  console.log('═'.repeat(60));
  
  let passedTests = 0;
  let failedTests = 0;
  const failures: string[] = [];

  testCases.forEach((testCase, index) => {
    const testNumber = index + 1;
    console.log(`\n📝 Test ${testNumber}: ${testCase.name}`);
    console.log(`URL: ${testCase.url}`);
    
    try {
      const result = detectYoutubePlaybackMode(testCase.url);
      
      let testPassed = true;
      const errors: string[] = [];

      if (result.mode !== testCase.expectedMode) {
        testPassed = false;
        errors.push(`Expected mode: ${testCase.expectedMode}, Got: ${result.mode}`);
      }

      if (result.videoId !== testCase.expectedVideoId) {
        testPassed = false;
        errors.push(`Expected videoId: ${testCase.expectedVideoId}, Got: ${result.videoId}`);
      }

      if (testCase.shouldHaveEmbedUrl && !result.embedUrl) {
        testPassed = false;
        errors.push('Expected embedUrl to be present, but it was null');
      }

      if (!testCase.shouldHaveEmbedUrl && result.embedUrl) {
        testPassed = false;
        errors.push('Expected embedUrl to be null, but it was present');
      }

      if (testPassed) {
        console.log(`✅ PASS`);
        console.log(`   Mode: ${result.mode}`);
        console.log(`   Video ID: ${result.videoId}`);
        console.log(`   Embed URL: ${result.embedUrl ? 'Generated' : 'N/A'}`);
        console.log(`   Reason: ${result.reason}`);
        passedTests++;
      } else {
        console.log(`❌ FAIL`);
        errors.forEach(error => console.log(`   ❌ ${error}`));
        failedTests++;
        failures.push(`Test ${testNumber}: ${testCase.name} - ${errors.join(', ')}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error}`);
      failedTests++;
      failures.push(`Test ${testNumber}: ${testCase.name} - Exception: ${error}`);
    }
  });

  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Test Results Summary');
  console.log('═'.repeat(60));
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);
  
  if (failedTests > 0) {
    console.log('\n❌ Failed Tests:');
    failures.forEach(failure => console.log(`   ${failure}`));
  } else {
    console.log('\n🎉 All tests passed!');
  }
  
  console.log('\n' + '═'.repeat(60));
}

export function testVoiceCommandIntegration(): void {
  console.log('\n🎤 Testing Voice Control Integration');
  console.log('═'.repeat(60));

  if (typeof global !== 'undefined' && (global as any).youtubeWebViewControls) {
    console.log('✅ YouTube WebView controls are registered globally');
    
    const controls = (global as any).youtubeWebViewControls;
    const methods = [
      'play', 'pause', 'stop', 
      'seekForward', 'seekBackward', 
      'mute', 'unmute', 
      'setVolume', 'setPlaybackRate',
      'getCurrentTime', 'getDuration', 'getPlayerState'
    ];

    console.log('\n📋 Available control methods:');
    methods.forEach(method => {
      const exists = typeof controls[method] === 'function';
      console.log(`   ${exists ? '✅' : '❌'} ${method}`);
    });
  } else {
    console.log('⚠️  YouTube WebView controls not found');
    console.log('   This is expected if no YouTube video is currently playing');
    console.log('   Controls are registered when YouTubeWebViewPlayer is active');
  }
  
  console.log('\n' + '═'.repeat(60));
}

export function testYouTubeUrlExtraction(): void {
  console.log('\n🔍 Testing YouTube Video ID Extraction');
  console.log('═'.repeat(60));

  const testUrls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
  ];

  testUrls.forEach(url => {
    const videoId = extractYouTubeVideoId(url);
    const isYT = isYouTubeUrl(url);
    console.log(`\nURL: ${url}`);
    console.log(`   Is YouTube: ${isYT ? '✅' : '❌'}`);
    console.log(`   Video ID: ${videoId || 'N/A'}`);
  });
  
  console.log('\n' + '═'.repeat(60));
}

export function runAllTests(): void {
  console.log('\n🚀 Running YouTube Dual-Mode Playback System Tests\n');
  
  runYouTubePlaybackTests();
  testYouTubeUrlExtraction();
  testVoiceCommandIntegration();
  
  console.log('\n✅ All test suites completed\n');
}

if (require.main === module) {
  runAllTests();
}
