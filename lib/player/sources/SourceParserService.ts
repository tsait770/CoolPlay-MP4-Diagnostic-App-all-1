import { SourceResolver, ParsedVideoSource, VideoMetadata } from './SourceResolver';
import { YouTubeResolver } from './YouTubeResolver';
import { VimeoResolver } from './VimeoResolver';
import { DirectVideoResolver } from './DirectVideoResolver';
import { AdultPlatformResolver } from './AdultPlatformResolver';

export class SourceParserService {
  private resolvers: SourceResolver[];

  constructor() {
    this.resolvers = [
      new YouTubeResolver(),
      new VimeoResolver(),
      new DirectVideoResolver(),
      new AdultPlatformResolver(),
    ];

    console.log('[SourceParserService] Initialized with resolvers:', 
      this.resolvers.map(r => r.platform).join(', ')
    );
  }

  findResolver(url: string): SourceResolver | null {
    for (const resolver of this.resolvers) {
      if (resolver.canResolve(url)) {
        console.log('[SourceParserService] Found resolver:', resolver.platform);
        return resolver;
      }
    }
    
    console.warn('[SourceParserService] No resolver found for:', url);
    return null;
  }

  async parse(url: string): Promise<ParsedVideoSource | null> {
    const resolver = this.findResolver(url);
    
    if (!resolver) {
      console.error('[SourceParserService] Cannot parse URL:', url);
      return null;
    }

    try {
      const result = await resolver.resolve(url);
      console.log('[SourceParserService] Parsed successfully:', result);
      return result;
    } catch (error) {
      console.error('[SourceParserService] Error parsing URL:', error);
      throw error;
    }
  }

  async fetchMetadata(url: string): Promise<VideoMetadata | null> {
    const resolver = this.findResolver(url);
    
    if (!resolver || !resolver.fetchMetadata) {
      console.warn('[SourceParserService] Metadata not available for:', url);
      return null;
    }

    try {
      const metadata = await resolver.fetchMetadata(url);
      console.log('[SourceParserService] Fetched metadata:', metadata);
      return metadata;
    } catch (error) {
      console.error('[SourceParserService] Error fetching metadata:', error);
      return null;
    }
  }

  canParse(url: string): boolean {
    return this.findResolver(url) !== null;
  }

  getPlatform(url: string): string | null {
    const resolver = this.findResolver(url);
    return resolver ? resolver.platform : null;
  }
}

export const sourceParserService = new SourceParserService();
