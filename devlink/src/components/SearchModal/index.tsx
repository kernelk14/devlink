import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/lib/store';
import { useChannels, useUsers } from '@/hooks/useData';
import { Search, X, Hash, MessageSquare, User } from 'lucide-react';

interface SearchModalProps {
  onClose: () => void;
}

export function SearchModal({ onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const { setSelectedChannel, setSelectedDMUser } = useUIStore();
  const { data: channels = [] } = useChannels();
  const { data: users = [] } = useUsers();
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
    const searchMessages: any[] = [];

    const searchChannels = channels
      .filter((c: any) => c.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map((c: any) => ({
        type: 'channel',
        id: c._id,
        title: `#${c.name}`,
        preview: c.description || 'No description',
      }));

    const searchUsers = users
      .filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      .slice(0, 3)
      .map(u => ({
        type: 'user',
        id: u._id,
        title: `@${u.name || u.email}`,
        preview: u.statusMessage || u.email || 'Online',
      }));

    setResults([...searchChannels, ...searchUsers, ...searchMessages]);
  }, [query, channels, users]);

  const handleSelect = (result: any) => {
    if (result.type === 'channel') {
      setSelectedChannel(result.id);
      addToast({ type: 'info', message: `Switched to #${result.title.replace('#', '')}` });
    } else if (result.type === 'user') {
      setSelectedDMUser(result.id);
      addToast({ type: 'info', message: `Opened DM with ${result.title}` });
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

            {results.filter(r => r.type === 'user').length > 0 && (
              <div className="search-section">
                <div className="search-section-title">// users</div>
                {results.filter(r => r.type === 'user').map((result) => (
                  <div key={result.id} className="search-result" onClick={() => handleSelect(result)} style={{ cursor: 'pointer' }}>
                    <div className="search-result-icon">
                      <User size={14} />
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
