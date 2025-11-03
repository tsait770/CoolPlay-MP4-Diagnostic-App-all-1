import { Bookmark } from '@/providers/BookmarkProvider';

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped: number;
  errors: ImportError[];
  bookmarks: Bookmark[];
}

export interface ImportError {
  line?: number;
  url?: string;
  title?: string;
  reason: string;
  raw?: string;
}

export interface ImportProgress {
  total: number;
  processed: number;
  imported: number;
  failed: number;
  skipped: number;
}

export type ImportProgressCallback = (progress: ImportProgress) => void;

const MAX_TITLE_LENGTH = 500;
const MAX_URL_LENGTH = 2000;

function sanitizeString(str: string): string {
  if (!str) return '';
  
  try {
    const decoded = decodeURIComponent(escape(str));
    return decoded
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\uFFFD/g, '')
      .trim();
  } catch {
    return str
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\uFFFD/g, '')
      .trim();
  }
}

function isValidUrl(url: string): boolean {
  if (!url || url.length > MAX_URL_LENGTH) return false;
  
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:', 'ftp:', 'file:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

function extractFavicon(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
  } catch {
    return '';
  }
}

export async function parseHTMLBookmarks(
  content: string,
  onProgress?: ImportProgressCallback
): Promise<ImportResult> {
  console.log('[BookmarkImporter] Starting HTML bookmark parsing');
  console.log('[BookmarkImporter] Content length:', content.length);
  
  const result: ImportResult = {
    success: false,
    imported: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    bookmarks: [],
  };

  if (!content || content.trim().length === 0) {
    result.errors.push({
      reason: 'Empty file content',
    });
    console.error('[BookmarkImporter] Empty file content');
    return result;
  }

  const sanitizedContent = sanitizeString(content);
  console.log('[BookmarkImporter] Sanitized content length:', sanitizedContent.length);

  // Support both uppercase and lowercase HTML tags, and various formats
  const linkRegex = /<(?:DT|dt)>\s*<(?:A|a)\s+([^>]+)>([^<]*)<\/(?:A|a)>/gi;
  const hrefRegex = /(?:HREF|href)=["']([^"']*)["']/i;
  const addDateRegex = /(?:ADD_DATE|add_date)=["']?(\d+)["']?/i;
  const iconRegex = /(?:ICON|icon)=["']([^"']*)["']/i;

  const matches = Array.from(sanitizedContent.matchAll(linkRegex));
  const total = matches.length;
  
  console.log(`[BookmarkImporter] Found ${total} bookmark entries`);

  if (total === 0) {
    result.errors.push({
      reason: 'No bookmarks found in file. Expected HTML bookmark format with <DT><A> tags.',
    });
    console.warn('[BookmarkImporter] No bookmarks found');
    return result;
  }

  let processed = 0;
  const seenUrls = new Set<string>();

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const attributes = match[1];
    const title = match[2];

    processed++;

    if (onProgress && processed % 10 === 0) {
      onProgress({
        total,
        processed,
        imported: result.imported,
        failed: result.failed,
        skipped: result.skipped,
      });
    }

    try {
      const hrefMatch = attributes.match(hrefRegex);
      if (!hrefMatch || !hrefMatch[1]) {
        result.failed++;
        result.errors.push({
          line: i + 1,
          title: sanitizeString(title),
          reason: 'Missing URL',
          raw: match[0].substring(0, 100),
        });
        console.warn(`[BookmarkImporter] Line ${i + 1}: Missing URL`);
        continue;
      }

      const url = sanitizeString(hrefMatch[1]);
      
      if (!isValidUrl(url)) {
        result.failed++;
        result.errors.push({
          line: i + 1,
          url,
          title: sanitizeString(title),
          reason: 'Invalid URL format',
        });
        console.warn(`[BookmarkImporter] Line ${i + 1}: Invalid URL: ${url}`);
        continue;
      }

      if (seenUrls.has(url)) {
        result.skipped++;
        console.log(`[BookmarkImporter] Line ${i + 1}: Duplicate URL skipped: ${url}`);
        continue;
      }

      seenUrls.add(url);

      const sanitizedTitle = sanitizeString(title || url);
      const finalTitle = sanitizedTitle.length > MAX_TITLE_LENGTH 
        ? sanitizedTitle.substring(0, MAX_TITLE_LENGTH) + '...'
        : sanitizedTitle;

      const addDateMatch = attributes.match(addDateRegex);
      const addedOn = addDateMatch && addDateMatch[1]
        ? new Date(parseInt(addDateMatch[1]) * 1000).toISOString()
        : new Date().toISOString();

      const iconMatch = attributes.match(iconRegex);
      const favicon = iconMatch && iconMatch[1] 
        ? sanitizeString(iconMatch[1])
        : extractFavicon(url);

      const bookmark: Bookmark = {
        id: `imported_${Date.now()}_${i}`,
        title: finalTitle,
        url,
        favicon,
        favorite: false,
        addedOn,
      };

      result.bookmarks.push(bookmark);
      result.imported++;
      
      if (result.imported % 100 === 0) {
        console.log(`[BookmarkImporter] Imported ${result.imported} bookmarks so far...`);
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        line: i + 1,
        reason: error instanceof Error ? error.message : 'Unknown parsing error',
        raw: match[0].substring(0, 100),
      });
      console.error(`[BookmarkImporter] Line ${i + 1}: Parse error:`, error);
    }
  }

  if (onProgress) {
    onProgress({
      total,
      processed,
      imported: result.imported,
      failed: result.failed,
      skipped: result.skipped,
    });
  }

  result.success = result.imported > 0;
  
  console.log('[BookmarkImporter] Import completed:', {
    imported: result.imported,
    failed: result.failed,
    skipped: result.skipped,
    totalErrors: result.errors.length,
  });

  return result;
}

export async function parseJSONBookmarks(
  content: string,
  onProgress?: ImportProgressCallback
): Promise<ImportResult> {
  console.log('[BookmarkImporter] Starting JSON bookmark parsing');
  
  const result: ImportResult = {
    success: false,
    imported: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    bookmarks: [],
  };

  try {
    const sanitizedContent = sanitizeString(content);
    const data = JSON.parse(sanitizedContent);

    if (!Array.isArray(data)) {
      result.errors.push({
        reason: 'JSON must be an array of bookmarks',
      });
      console.error('[BookmarkImporter] JSON is not an array');
      return result;
    }

    const total = data.length;
    console.log(`[BookmarkImporter] Found ${total} JSON entries`);

    const seenUrls = new Set<string>();

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      if (onProgress && i % 10 === 0) {
        onProgress({
          total,
          processed: i,
          imported: result.imported,
          failed: result.failed,
          skipped: result.skipped,
        });
      }

      try {
        if (!item || typeof item !== 'object') {
          result.failed++;
          result.errors.push({
            line: i + 1,
            reason: 'Invalid bookmark object',
          });
          continue;
        }

        const url = sanitizeString(item.url || '');
        
        if (!isValidUrl(url)) {
          result.failed++;
          result.errors.push({
            line: i + 1,
            url,
            reason: 'Invalid URL',
          });
          continue;
        }

        if (seenUrls.has(url)) {
          result.skipped++;
          continue;
        }

        seenUrls.add(url);

        const title = sanitizeString(item.title || url);
        const finalTitle = title.length > MAX_TITLE_LENGTH 
          ? title.substring(0, MAX_TITLE_LENGTH) + '...'
          : title;

        const bookmark: Bookmark = {
          id: item.id || `imported_${Date.now()}_${i}`,
          title: finalTitle,
          url,
          favicon: item.favicon || extractFavicon(url),
          favorite: Boolean(item.favorite),
          addedOn: item.addedOn || new Date().toISOString(),
          folderId: item.folderId,
          description: item.description ? sanitizeString(item.description) : undefined,
          color: item.color,
          category: item.category,
        };

        result.bookmarks.push(bookmark);
        result.imported++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          line: i + 1,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`[BookmarkImporter] JSON item ${i + 1}: Parse error:`, error);
      }
    }

    if (onProgress) {
      onProgress({
        total,
        processed: data.length,
        imported: result.imported,
        failed: result.failed,
        skipped: result.skipped,
      });
    }

    result.success = result.imported > 0;
    
    console.log('[BookmarkImporter] JSON import completed:', {
      imported: result.imported,
      failed: result.failed,
      skipped: result.skipped,
    });

    return result;
  } catch (error) {
    result.errors.push({
      reason: error instanceof Error ? error.message : 'Failed to parse JSON',
    });
    console.error('[BookmarkImporter] JSON parse error:', error);
    return result;
  }
}

export async function importBookmarksFromFile(
  fileContent: string,
  format?: 'html' | 'json' | 'auto',
  onProgress?: ImportProgressCallback
): Promise<ImportResult> {
  console.log(`[BookmarkImporter] Starting import with format: ${format || 'auto'}`);
  console.log(`[BookmarkImporter] File size: ${fileContent.length} bytes`);

  if (!fileContent || fileContent.trim().length === 0) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [{ reason: 'Empty file' }],
      bookmarks: [],
    };
  }

  try {
    let detectedFormat: 'html' | 'json' = format === 'html' || format === 'json' ? format : 'html';
    
    // Auto-detect format if not specified or set to auto
    if (!format || format === 'auto') {
      const trimmedContent = fileContent.trim();
      
      // Try to detect JSON first
      if (trimmedContent.startsWith('[') || trimmedContent.startsWith('{')) {
        try {
          JSON.parse(trimmedContent);
          detectedFormat = 'json';
          console.log('[BookmarkImporter] Auto-detected JSON format');
        } catch {
          // Not valid JSON, try HTML
          detectedFormat = 'html';
        }
      }
      
      // Check for HTML bookmark markers
      if (detectedFormat !== 'json' && (
        trimmedContent.includes('<!DOCTYPE NETSCAPE-Bookmark-file-1>') ||
        trimmedContent.includes('<DT><A') ||
        trimmedContent.includes('<dt><a') ||
        trimmedContent.includes('HREF=')
      )) {
        detectedFormat = 'html';
        console.log('[BookmarkImporter] Auto-detected HTML format');
      }
    }

    if (detectedFormat === 'json') {
      return await parseJSONBookmarks(fileContent, onProgress);
    } else {
      return await parseHTMLBookmarks(fileContent, onProgress);
    }
  } catch (error) {
    console.error('[BookmarkImporter] Import failed:', error);
    return {
      success: false,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [{
        reason: error instanceof Error ? error.message : 'Unknown import error',
      }],
      bookmarks: [],
    };
  }
}

export function generateImportSummary(result: ImportResult): string {
  const lines: string[] = [];
  
  lines.push('=== Bookmark Import Summary ===');
  lines.push(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  lines.push(`Imported: ${result.imported}`);
  lines.push(`Failed: ${result.failed}`);
  lines.push(`Skipped (duplicates): ${result.skipped}`);
  lines.push('');
  
  if (result.errors.length > 0) {
    lines.push('=== Errors ===');
    const maxErrors = 10;
    const displayErrors = result.errors.slice(0, maxErrors);
    
    displayErrors.forEach((error, index) => {
      lines.push(`${index + 1}. ${error.reason}`);
      if (error.line) lines.push(`   Line: ${error.line}`);
      if (error.url) lines.push(`   URL: ${error.url}`);
      if (error.title) lines.push(`   Title: ${error.title}`);
    });
    
    if (result.errors.length > maxErrors) {
      lines.push(`... and ${result.errors.length - maxErrors} more errors`);
    }
  }
  
  return lines.join('\n');
}
