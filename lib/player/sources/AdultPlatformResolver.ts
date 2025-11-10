import { SourceResolver, ParsedVideoSource, VideoMetadata } from './SourceResolver';

export class AdultPlatformResolver extends SourceResolver {
  platform = 'Adult Platform';

  private readonly ADULT_PLATFORMS = [
    'pornhub.com',
    'xvideos.com',
    'xnxx.com',
    'redtube.com',
    'tktube.com',
    'youporn.com',
    'spankbang.com',
    'xhamster.com',
    'tube8.com',
    'beeg.com',
    'airav.io',
    'airav.cc',
  ];

  canResolve(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return this.ADULT_PLATFORMS.some(platform => lowerUrl.includes(platform));
  }

  detectPlatform(url: string): string {
    const lowerUrl = url.toLowerCase();
    
    for (const platform of this.ADULT_PLATFORMS) {
      if (lowerUrl.includes(platform)) {
        const platformName = platform.replace('.com', '');
        return platformName.charAt(0).toUpperCase() + platformName.slice(1);
      }
    }
    
    return 'Adult Platform';
  }

  async fetchMetadata(url: string): Promise<VideoMetadata> {
    const platform = this.detectPlatform(url);
    return {
      title: `${platform} Video`,
    };
  }

  async resolve(url: string): Promise<ParsedVideoSource> {
    const platform = this.detectPlatform(url);
    
    console.log('[AdultPlatformResolver] Resolved:', { url, platform });

    return {
      url,
      type: 'stream',
      format: 'adult',
      requiresAuth: false,
      variants: [
        { quality: 'auto', url },
      ],
    };
  }
}
