import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useEffect, useState, useRef } from 'react';

interface LinkPreviewData {
  url: string;
  title: string;
  description: string;
  image: string;
  favicon: string;
}

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"']+(?:\/[^\s<>"']*)?/gi;
  const matches = text.match(urlRegex);
  if (!matches) return [];
  return [...new Set(matches.map(u => u.replace(/[.,;!?)]+$/, '')))];
}

const previewCache = new Map<string, LinkPreviewData>();

export function useLinkPreviews(content: string) {
  const fetchPreview = useAction(api.linkPreviews.fetchLinkPreview);
  const [previews, setPreviews] = useState<LinkPreviewData[]>([]);
  const fetchingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const urls = extractUrls(content);
    const cached = urls.map(u => previewCache.get(u)).filter(Boolean) as LinkPreviewData[];
    setPreviews(cached);

    const uncached = urls.filter(u => !previewCache.has(u) && !fetchingRef.current.has(u));
    if (uncached.length === 0) return;

    uncached.forEach(u => fetchingRef.current.add(u));

    Promise.allSettled(
      uncached.map(url => fetchPreview({ url }))
    ).then(results => {
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          previewCache.set(uncached[i], r.value);
        }
      });
      setPreviews(urls.map(u => previewCache.get(u)).filter(Boolean) as LinkPreviewData[]);
    });
  }, [content]);

  return previews;
}

export function LinkPreviews({ content }: { content: string }) {
  const previews = useLinkPreviews(content);
  if (previews.length === 0) return null;
  return (
    <div className="link-preview-list">
      {previews.map((p, i) => (
        <LinkPreviewCard key={i} preview={p} />
      ))}
    </div>
  );
}

export function LinkPreviewCard({ preview }: { preview: LinkPreviewData }) {
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-preview"
    >
      {preview.image && (
        <div className="link-preview-image">
          <img
            src={preview.image}
            alt=""
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
        </div>
      )}
      <div className="link-preview-body">
        {preview.favicon && (
          <img src={preview.favicon} alt="" className="link-preview-favicon" />
        )}
        <div className="link-preview-title">{preview.title || new URL(preview.url).hostname}</div>
        {preview.description && (
          <div className="link-preview-desc">{preview.description}</div>
        )}
        <div className="link-preview-url">{new URL(preview.url).hostname}</div>
      </div>
    </a>
  );
}
