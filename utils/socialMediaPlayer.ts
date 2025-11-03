import { Platform } from 'react-native';

export interface SocialMediaConfig {
  platform: 'twitter' | 'instagram' | 'tiktok';
  url: string;
  embedStrategies: EmbedStrategy[];
}

export interface EmbedStrategy {
  name: string;
  priority: number;
  getEmbedUrl: (url: string, videoId?: string | null) => string | null;
  headers?: Record<string, string>;
  userAgent?: string;
}

const MOBILE_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
const DESKTOP_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export function extractTwitterVideoId(url: string): string | null {
  const patterns = [
    /(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/i,
    /(?:twitter\.com|x\.com)\/i\/status\/(\d+)/i,
    /t\.co\/(\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[match.length - 1];
    }
  }
  
  return null;
}

export function extractInstagramVideoId(url: string): string | null {
  const patterns = [
    /instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i,
    /instagram\.com\/reels?\/([A-Za-z0-9_-]+)/i,
    /instagr\.am\/p\/([A-Za-z0-9_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

export function extractTikTokVideoId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/i,
    /tiktok\.com\/v\/(\d+)/i,
    /vm\.tiktok\.com\/([A-Za-z0-9]+)/i,
    /vt\.tiktok\.com\/([A-Za-z0-9]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

const twitterStrategies: EmbedStrategy[] = [
  {
    name: 'Direct X.com URL',
    priority: 1,
    getEmbedUrl: (url: string) => {
      const twitterUrl = url.includes('x.com') 
        ? url 
        : url.replace('twitter.com', 'x.com');
      
      return twitterUrl;
    },
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://x.com/',
    },
    userAgent: MOBILE_USER_AGENT,
  },
  {
    name: 'Twitter oEmbed API',
    priority: 2,
    getEmbedUrl: (url: string) => {
      const videoId = extractTwitterVideoId(url);
      if (!videoId) return null;
      
      const twitterUrl = url.includes('x.com') 
        ? url 
        : url.replace('twitter.com', 'x.com');
      
      const encodedUrl = encodeURIComponent(twitterUrl);
      return `https://publish.twitter.com/oembed?url=${encodedUrl}&partner=&hide_thread=false&omit_script=true&dnt=true&theme=dark&maxwidth=550`;
    },
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    userAgent: MOBILE_USER_AGENT,
  },
  {
    name: 'Mobile Twitter URL',
    priority: 3,
    getEmbedUrl: (url: string) => {
      const twitterUrl = url.includes('x.com') 
        ? url 
        : url.replace('twitter.com', 'x.com');
      
      return `https://mobile.${twitterUrl.replace('https://', '').replace('http://', '')}`;
    },
    userAgent: MOBILE_USER_AGENT,
  },
  {
    name: 'Twitter Embed Widget',
    priority: 4,
    getEmbedUrl: (url: string) => {
      const videoId = extractTwitterVideoId(url);
      if (!videoId) return null;
      
      const twitterUrl = url.includes('x.com') 
        ? url 
        : url.replace('twitter.com', 'x.com');
      
      return `data:text/html;charset=utf-8,${encodeURIComponent(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; background: #000; overflow: hidden; }
              .twitter-container { 
                width: 100vw; 
                height: 100vh; 
                display: flex; 
                align-items: center; 
                justify-content: center;
              }
            </style>
          </head>
          <body>
            <div class="twitter-container">
              <blockquote class="twitter-tweet" data-theme="dark">
                <a href="${twitterUrl}"></a>
              </blockquote>
            </div>
            <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
          </body>
        </html>
      `)}`;
    },
  },
];

const instagramStrategies: EmbedStrategy[] = [
  {
    name: 'Direct Instagram URL',
    priority: 1,
    getEmbedUrl: (url: string) => {
      return url;
    },
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.instagram.com/',
    },
    userAgent: MOBILE_USER_AGENT,
  },
  {
    name: 'Instagram oEmbed API',
    priority: 2,
    getEmbedUrl: (url: string) => {
      const videoId = extractInstagramVideoId(url);
      if (!videoId) return null;
      
      const encodedUrl = encodeURIComponent(url);
      return `https://api.instagram.com/oembed/?url=${encodedUrl}&hidecaption=true&maxwidth=550`;
    },
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    userAgent: MOBILE_USER_AGENT,
  },
  {
    name: 'Direct Instagram Embed',
    priority: 3,
    getEmbedUrl: (url: string, videoId?: string | null) => {
      const id = videoId ?? extractInstagramVideoId(url);
      if (!id) return null;
      
      const type = url.includes('/reel') ? 'reel' : url.includes('/tv') ? 'tv' : 'p';
      return `https://www.instagram.com/${type}/${id}/embed`;
    },
    userAgent: MOBILE_USER_AGENT,
  },
  {
    name: 'Instagram Widget HTML',
    priority: 4,
    getEmbedUrl: (url: string) => {
      const videoId = extractInstagramVideoId(url);
      if (!videoId) return null;
      
      return `data:text/html;charset=utf-8,${encodeURIComponent(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; background: #000; overflow: hidden; }
              .instagram-container { 
                width: 100vw; 
                height: 100vh; 
                display: flex; 
                align-items: center; 
                justify-content: center;
              }
              iframe { max-width: 100%; border: none; }
            </style>
          </head>
          <body>
            <div class="instagram-container">
              <blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="${url}" data-instgrm-version="14">
                <a href="${url}"></a>
              </blockquote>
            </div>
            <script async src="https://www.instagram.com/embed.js"></script>
          </body>
        </html>
      `)}`;
    },
  },
];

const tiktokStrategies: EmbedStrategy[] = [
  {
    name: 'Direct TikTok URL',
    priority: 1,
    getEmbedUrl: (url: string) => {
      return url;
    },
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.tiktok.com/',
    },
    userAgent: MOBILE_USER_AGENT,
  },
  {
    name: 'TikTok oEmbed API',
    priority: 2,
    getEmbedUrl: (url: string) => {
      const encodedUrl = encodeURIComponent(url);
      return `https://www.tiktok.com/oembed?url=${encodedUrl}`;
    },
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    userAgent: MOBILE_USER_AGENT,
  },
  {
    name: 'Direct TikTok Embed',
    priority: 3,
    getEmbedUrl: (url: string, videoId?: string | null) => {
      const id = videoId ?? extractTikTokVideoId(url);
      if (!id) return null;
      
      const username = url.match(/tiktok\.com\/@([\w.-]+)/i)?.[1];
      if (!username) return null;
      
      return `https://www.tiktok.com/@${username}/video/${id}`;
    },
    userAgent: MOBILE_USER_AGENT,
  },
  {
    name: 'TikTok Embed Widget',
    priority: 4,
    getEmbedUrl: (url: string, videoId?: string | null) => {
      const id = videoId ?? extractTikTokVideoId(url);
      if (!id) return null;
      
      return `data:text/html;charset=utf-8,${encodeURIComponent(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; background: #000; overflow: hidden; }
              .tiktok-container { 
                width: 100vw; 
                height: 100vh; 
                display: flex; 
                align-items: center; 
                justify-content: center;
              }
            </style>
          </head>
          <body>
            <div class="tiktok-container">
              <blockquote class="tiktok-embed" cite="${url}" data-video-id="${id}">
                <a href="${url}"></a>
              </blockquote>
            </div>
            <script async src="https://www.tiktok.com/embed.js"></script>
          </body>
        </html>
      `)}`;
    },
  },
];

export function getSocialMediaConfig(url: string): SocialMediaConfig | null {
  const normalizedUrl = url.toLowerCase();
  
  if (normalizedUrl.includes('twitter.com') || normalizedUrl.includes('x.com')) {
    return {
      platform: 'twitter',
      url,
      embedStrategies: twitterStrategies,
    };
  }
  
  if (normalizedUrl.includes('instagram.com') || normalizedUrl.includes('instagr.am')) {
    return {
      platform: 'instagram',
      url,
      embedStrategies: instagramStrategies,
    };
  }
  
  if (normalizedUrl.includes('tiktok.com') || normalizedUrl.includes('vm.tiktok.com') || normalizedUrl.includes('vt.tiktok.com')) {
    return {
      platform: 'tiktok',
      url,
      embedStrategies: tiktokStrategies,
    };
  }
  
  return null;
}

export function getDefaultHeaders(platform: 'twitter' | 'instagram' | 'tiktok'): Record<string, string> {
  const baseHeaders = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
  };

  return baseHeaders;
}

export function getUserAgent(platform: 'twitter' | 'instagram' | 'tiktok', preferMobile: boolean = true): string {
  if (Platform.OS === 'ios' || preferMobile) {
    return MOBILE_USER_AGENT;
  }
  
  return DESKTOP_USER_AGENT;
}

export function shouldUseFallback(errorCount: number, maxRetries: number = 3): boolean {
  return errorCount >= maxRetries;
}

export function getNextStrategy(
  config: SocialMediaConfig,
  currentStrategyIndex: number
): EmbedStrategy | null {
  const nextIndex = currentStrategyIndex + 1;
  if (nextIndex >= config.embedStrategies.length) {
    return null;
  }
  
  return config.embedStrategies[nextIndex];
}
