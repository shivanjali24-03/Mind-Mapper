import { useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';

export default function SearchBar({ query, onQuery, count, index, onPrev, onNext, onClose }) {
  const inputRef = useRef(null);
  useEffect(() => inputRef.current?.focus(), []);

  return (
    <div className="searchbar" role="search">
      <Search size={15} aria-hidden="true" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Search ideas and notes"
        aria-label="Search ideas"
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') (e.shiftKey ? onPrev : onNext)();
          if (e.key === 'Escape') onClose();
        }}
      />
      <span className="searchbar__count" aria-live="polite">
        {query.trim() ? (count ? `${index + 1} / ${count}` : 'No results') : ''}
      </span>
      <button className="icon-btn" onClick={onPrev} disabled={!count} aria-label="Previous result">
        <ChevronUp size={16} />
      </button>
      <button className="icon-btn" onClick={onNext} disabled={!count} aria-label="Next result">
        <ChevronDown size={16} />
      </button>
      <button className="icon-btn" onClick={onClose} aria-label="Close search">
        <X size={16} />
      </button>
    </div>
  );
}
