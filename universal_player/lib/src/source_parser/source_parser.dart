import '../models/source.dart';
import 'youtube_utils.dart';
import 'youtube_resolver.dart';
import 'vimeo_resolver.dart';
import 'twitch_resolver.dart';
import 'facebook_resolver.dart';
import 'cloud_resolvers.dart';
import 'adult_resolvers.dart';

/// Result of parsing an input URL or identifier into a concrete [MediaSource].
class ParsedSource {
  const ParsedSource({required this.source});
  final MediaSource source;
}

/// Strategy interface for platform-specific parsers (e.g., YouTube, Vimeo, Pornhub, M3U8).
abstract class SourceResolver {
  bool canHandle(Uri input);
  Future<ParsedSource> resolve(Uri input);
}

/// Aggregates multiple resolvers and chooses the first that can handle the URL.
class SourceParser {
  SourceParser(this._resolvers);

  final List<SourceResolver> _resolvers;

  /// Convenience factory with built-in resolvers (YouTube, etc.).
  factory SourceParser.withDefaults() => SourceParser(<SourceResolver>[
        YouTubeResolver(),
        VimeoResolver(),
        TwitchResolver(),
        FacebookResolver(),
        DropboxResolver(),
        GoogleDriveResolver(),
        AdultResolver(enabled: false),
      ]);

  Future<ParsedSource> parse(Uri input) async {
    // YouTube normalization quick path
    final youTubeEmbed = YouTubeUtils.toEmbedUrl(input.toString());
    if (youTubeEmbed != null) {
      return ParsedSource(
        source: MediaSource(
          id: input.toString(),
          title: 'YouTube',
          isLive: false,
          url: Uri.parse(youTubeEmbed),
          mimeType: 'text/html',
        ),
      );
    }
    for (final resolver in _resolvers) {
      if (resolver.canHandle(input)) {
        return resolver.resolve(input);
      }
    }
    // Fallback: treat as direct URL with best-effort metadata.
    return ParsedSource(
      source: MediaSource(
        id: input.toString(),
        title: input.pathSegments.isNotEmpty ? input.pathSegments.last : input.host,
        isLive: false,
        url: input,
        mimeType: null,
      ),
    );
  }
}
