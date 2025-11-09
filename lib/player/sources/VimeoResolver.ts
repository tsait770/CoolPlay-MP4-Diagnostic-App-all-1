import { SourceResolver, ParsedVideoSource, VideoMetadata } from './SourceResolver';

export class VimeoResolver extends SourceResolver {
  platform = 'Vimeo';

  private readonly VIMEO_PATTERNS = [
    /vimeo\.com\/(\d+)/i,
    /player\.vimeo\.com\/video\/(\d+)/i,
  ];

  canResolve(url: string): boolean {
    return this.VIMEO_PATTERNS.some(pattern => pattern.test(url));
  }

  extractVideoId(url: string): string | null {
    for (const pattern of this.VIMEO_PATTERNS) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  async resolve(url: string): Promise<ParsedVideoSource> {
    const videoId = this.extractVideoId(url);
    
    if (!videoId) {
      throw new Error('Invalid Vimeo URL');
    }

    console.log('[VimeoResolver] Resolved video ID:', videoId);

    return {
      url: `https://vimeo.com/${videoId}`,
      type: 'stream',
      format: 'vimeo',
      variants: [
        { quality: 'auto', url: `https://vimeo.com/${videoId}` },
      ],
    };
  }

  async fetchMetadata(url: string): Promise<VideoMetadata> {
    const videoId = this.extractVideoId(url);
    
    if (!videoId) {
      throw new Error('Invalid Vimeo URL');
    }

    console.log('[VimeoResolver] Fetching metadata for:', videoId);

    return {
      title: 'Vimeo Video',
    };
  }
}
