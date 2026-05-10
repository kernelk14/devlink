import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/lib/store';
import { useChannels } from '@/lib/hooks';
import { Search, X, Hash, MessageSquare } from 'lucide-react';

interface SearchModalProps {
  onClose: () => void;
}

export function SearchModal({ onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const { messages, setSelectedChannel, setSelectedDMUser } = useUIStore();
  const { channels } = useChannels();
  const addToast = useUIStore((state) => state.addToast);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const searchMessages = messages
      .filter(m => m.content.toLowerCase().includes(q))
      .slice(0, 5)
      .map(m => ({
        type: 'message',
        id: m.id,
        title: m.user?.name || 'Unknown',
        preview: m.content.slice(0, 100),
        channelId: m.channelId,
      }));

    const searchChannels = channels
      .filter(c => c.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map(c => ({
        type: 'channel',
        id: c.id,
        title: `#${c.name}`,
        preview: c.description || 'No description',
      }));

    setResults([...searchChannels, ...searchMessages]);
  }, [query, messages, channels]);

  const handleSelect = (result: any) => {
    if (result.type === 'channel') {
      setSelectedChannel(result.id);
      addToast({ type: 'info', message: `Switched to #${result.title.replace('#', '')}` });
    } else {
      setSelectedChannel(result.channelId);
      addToast({ type: 'info', message: `Jumped to message by ${result.title}` });
    }
    onClose();
  };

  return (
    <div className="popup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="popup-panel search-popup">
        <div className="popup-header">
          <div className="popup-title">
            <Search size={16} style={{ color: 'var(--cyan)' }} />
            <span>search</span>
            <span style={{ color: 'var(--fg-dim)', fontWeight: 400, fontSize: 12 }}>// find</span>
          </div>
          <button className="popup-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="popup-body" style={{ padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
            <span className="prompt-symbol" style={{ marginRight: 8 }}>$</span>
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="search channels and messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results.length > 0) {
                  handleSelect(results[0]);
                }
              }}
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--fg)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 360 }}>
            {results.length === 0 && query && (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <span className="prompt-symbol">$</span>
                <span style={{ color: 'var(--red)' }}> no results for </span>
                <span style={{ color: 'var(--cyan)' }}>"{query}"</span>
              </div>
            )}

            {results.length === 0 && !query && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-dim)', fontSize: 12 }}>
                <span className="prompt-symbol">$</span>
                <span> type to search</span>
              </div>
            )}

            {results.filter(r => r.type === 'channel').length > 0 && (
              <div className="search-section">
                <div className="search-section-title">// channels</div>
                {results.filter(r => r.type === 'channel').map((result) => (
                  <div key={result.id} className="search-result" onClick={() => handleSelect(result)} style={{ cursor: 'pointer' }}>
                    <div className="search-result-icon">
                      <Hash size={14} />
                    </div>
                    <div className="search-result-content">
                      <div className="search-result-title">{result.title}</div>
                      <div className="search-result-preview">{result.preview}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.filter(r => r.type === 'message').length > 0 && (
              <div className="search-section">
                <div className="search-section-title">// messages</div>
                {results.filter(r => r.type === 'message').map((result) => (
                  <div key={result.id} className="search-result" onClick={() => handleSelect(result)} style={{ cursor: 'pointer' }}>
                    <div className="search-result-icon">
                      <MessageSquare size={14} />
                    </div>
                    <div className="search-result-content">
                      <div className="search-result-title">{result.title}</div>
                      <div className="search-result-preview">{result.preview}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="popup-footer">
          <span className="prompt-comment" style={{ fontSize: 11 }}>esc to close · enter to select</span>
        </div>
      </div>
    </div>
  );
}
