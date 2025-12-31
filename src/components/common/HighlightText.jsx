import React, { memo } from 'react';
import { highlightMatches } from '../../hooks/useSearch';

/**
 * HighlightText component that highlights matching text based on a search query.
 * 
 * @param {string} text - The text to display and highlight
 * @param {string} query - The search query to highlight
 * @param {string} className - Optional className for the container span
 */
function HighlightText({ text, query, className = '' }) {
  if (!query || !text) {
    return <span className={className}>{text}</span>;
  }

  const segments = highlightMatches(text, query);

  return (
    <span className={className}>
      {segments.map((segment, index) => (
        segment.isMatch ? (
          <mark
            key={index}
            className="bg-yellow-200/80 dark:bg-yellow-700/50 text-inherit rounded-sm px-0.5"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      ))}
    </span>
  );
}

export default memo(HighlightText);
