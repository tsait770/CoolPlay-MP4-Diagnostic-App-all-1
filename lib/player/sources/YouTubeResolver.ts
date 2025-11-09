import { SourceResolver, ParsedVideoSource, VideoMetadata } from './SourceResolver';

export class YouTubeResolver extends SourceResolver {
  platform = 'YouTube';

  private readonly YOUTUBE_PATTERNS = [
    /(?:youtube\.com\/watch\?.*v=)([\w-]{11})/i,
    /(?:youtu\.be\/)([\w-]{11})/i,
    /(?:youtube\.com\/embed\/)([\w-]{11})/i,
    /(?:youtube\.com\/v\/)([\w-]{11})/i,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/i,
  ];

  canResolve(url: string): boolean {
    return this.YOUTUBE_PATTERNS.some(pattern => pattern.test(url));
  }

  extractVideoId(url: string): string | null {
    for (const pattern of this.YOUTUBE_PATTERNS) {
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
      throw new Error('Invalid YouTube URL');
    }

    console.log('[YouTubeResolver] Resolved video ID:', videoId);

    return {
      url: `https://www.youtube.com/watch?v=${videoId}`,
      type: 'stream',
      format: 'youtube',
      variants: [
        { quality: 'auto', url: `https://www.youtube.com/watch?v=${videoId}` },
      ],
    };
  }

  async fetchMetadata(url: string): Promise<VideoMetadata> {
    const videoId = this.extractVideoId(url);
    
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    console.log('[YouTubeResolver] Fetching metadata for:', videoId);

    return {
      title: 'YouTube Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
  }
}
