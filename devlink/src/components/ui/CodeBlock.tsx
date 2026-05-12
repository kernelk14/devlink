import { useMemo } from 'react';
import hljs from 'highlight.js';

interface CodeBlockProps {
  code: string;
  lang: string;
}

export function CodeBlock({ code, lang }: CodeBlockProps) {
  const html = useMemo(() => {
    try {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch {
      return code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }, [code, lang]);

  const lines = code.split('\n');
  const hasMultipleLines = lines.length > 1;
  const highlightedLines = useMemo(() => html.split('\n'), [html]);

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-lang">{lang || 'text'}</span>
        <button
          className="code-block-copy"
          onClick={() => navigator.clipboard.writeText(code)}
          title="Copy code"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>
      <div className="code-block-body">
        {hasMultipleLines ? (
          <div className="code-block-lines">
            {highlightedLines.map((line, i) => (
              <div key={i} className="code-block-line">
                <span className="code-block-line-num">{i + 1}</span>
                <span className="code-block-line-code" dangerouslySetInnerHTML={{ __html: line || ' ' }} />
              </div>
            ))}
          </div>
        ) : (
          <pre className="code-block-pre"><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
        )}
      </div>
    </div>
  );
}
