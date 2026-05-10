interface CodeBlockProps {
  code: string;
  lang: string;
}

export function CodeBlock({ code, lang }: CodeBlockProps) {
  const lines = code.split('\n');
  const hasMultipleLines = lines.length > 1;

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
        {hasMultipleLines && (
          <div className="code-block-numbers">
            {lines.map((_, i) => <span key={i}>{i + 1}</span>)}
          </div>
        )}
        <pre className="code-block-pre"><code>{code}</code></pre>
      </div>
    </div>
  );
}
