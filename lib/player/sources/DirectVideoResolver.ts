import { SourceResolver, ParsedVideoSource, VideoMetadata } from './SourceResolver';

export class DirectVideoResolver extends SourceResolver {
  platform = 'Direct Video';

  private readonly VIDEO_FORMATS = [
    'mp4', 'webm', 'ogg', 'ogv', 'mkv', 'avi', 'mov', 
    'flv', 'wmv', '3gp', 'ts', 'm4v',
  ];

  private readonly STREAM_PROTOCOLS = {
    hls: /\.m3u8(\?.*)?$/i,
    dash: /\.mpd(\?.*)?$/i,
    rtmp: /^rtmp:\/\/.+/i,
  };

  canResolve(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    
    const hasVideoExtension = this.VIDEO_FORMATS.some(ext => 
      new RegExp(`\\.${ext}(\\?.*)?$`, 'i').test(lowerUrl)
    );
    
    const hasStreamProtocol = Object.values(this.STREAM_PROTOCOLS).some(pattern =>
      pattern.test(url)
    );
    
    return hasVideoExtension || hasStreamProtocol;
  }

  detectFormat(url: string): string {
    const lowerUrl = url.toLowerCase();
    
    for (const [protocol, pattern] of Object.entries(this.STREAM_PROTOCOLS)) {
      if (pattern.test(url)) {
        return protocol;
      }
    }
    
    for (const format of this.VIDEO_FORMATS) {
      if (new RegExp(`\\.${format}(\\?.*)?$`, 'i').test(lowerUrl)) {
        return format;
      }
    }
    
    return 'unknown';
  }

  async fetchMetadata(url: string): Promise<VideoMetadata> {
    return {
      title: 'Direct Video',
    };
  }

  async resolve(url: string): Promise<ParsedVideoSource> {
    const format = this.detectFormat(url);
    
    let type: 'direct' | 'stream' | 'hls' | 'dash' | 'rtmp' = 'direct';
    
    if (format === 'hls') {
      type = 'hls';
    } else if (format === 'dash') {
      type = 'dash';
    } else if (format === 'rtmp') {
      type = 'rtmp';
    } else if (['m3u8', 'mpd'].includes(format)) {
      type = 'stream';
    }

    console.log('[DirectVideoResolver] Resolved:', { url, type, format });

    return {
      url,
      type,
      format,
      variants: [
        { quality: 'original', url },
      ],
    };
  }
}
