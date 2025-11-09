export interface StreamVariant {
  quality: string;
  url: string;
  bandwidth?: number;
  resolution?: { width: number; height: number };
  codec?: string;
}

export interface ParsedVideoSource {
  url: string;
  type: 'direct' | 'stream' | 'hls' | 'dash' | 'rtmp';
  format?: string;
  variants?: StreamVariant[];
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

export interface VideoMetadata {
  title?: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
  author?: string;
  publishDate?: string;
}

export abstract class SourceResolver {
  abstract platform: string;
  abstract canResolve(url: string): boolean;
  abstract resolve(url: string): Promise<ParsedVideoSource>;
  abstract fetchMetadata?(url: string): Promise<VideoMetadata>;
}
