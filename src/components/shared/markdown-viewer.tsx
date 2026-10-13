import React from 'react';
import { cn } from '@/lib/utils';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

/**
 * Lightweight, safe Markdown renderer for learning materials and announcements
 * Supports headings, bold, italic, code blocks, inline code, quotes, lists, and links.
 */
export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  if (!content) {
    return <p className="text-sm italic text-muted-foreground">Tidak ada konten teks.</p>;
  }

  // Split into lines for block-level parsing
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeLanguage = '';

  const parseInline = (text: string): React.ReactNode[] => {
    // Basic inline parser: bold (**text**), italic (*text*), inline code (`code`), link [text](url)
    const tokens: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Inline Code: `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        tokens.push(
          <code
            key={keyIdx++}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-primary"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Bold: **text**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        tokens.push(
          <strong key={keyIdx++} className="font-semibold text-foreground">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic: *text* or _text_
      const italicMatch = remaining.match(/^(\*|_)([^*_]+)\1/);
      if (italicMatch) {
        tokens.push(
          <em key={keyIdx++} className="italic">
            {italicMatch[2]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Link: [text](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        tokens.push(
          <a
            key={keyIdx++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:opacity-80"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Plain character
      const nextSpecial = remaining.search(/[`*_[\]]/);
      if (nextSpecial === -1) {
        tokens.push(remaining);
        break;
      } else if (nextSpecial > 0) {
        tokens.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      } else {
        // Special character didn't match any syntax, consume 1 char
        tokens.push(remaining[0]);
        remaining = remaining.slice(1);
      }
    }

    return tokens;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks (```lang ... ```)
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${i}`} className="my-3 overflow-x-auto rounded-control bg-slate-900 p-3 text-slate-100">
            {codeLanguage && (
              <div className="mb-2 text-xs font-mono uppercase tracking-wider text-slate-400">
                {codeLanguage}
              </div>
            )}
            <pre className="font-mono text-xs leading-relaxed">
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          </div>
        );
        codeBlockLines = [];
        inCodeBlock = false;
        codeLanguage = '';
      } else {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="mb-1 mt-4 text-base font-semibold text-foreground">
          {parseInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="mb-1.5 mt-5 text-lg font-semibold text-foreground">
          {parseInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="mb-2 mt-6 text-xl font-bold text-foreground">
          {parseInline(line.slice(2))}
        </h1>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="my-2 border-l-4 border-primary pl-3 italic text-muted-foreground">
          {parseInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Unordered lists (- or *)
    if (/^[-*]\s+/.test(line)) {
      elements.push(
        <li key={i} className="ml-5 list-disc text-sm text-foreground">
          {parseInline(line.replace(/^[-*]\s+/, ''))}
        </li>
      );
      continue;
    }

    // Numbered lists (1. )
    if (/^\d+\.\s+/.test(line)) {
      elements.push(
        <li key={i} className="ml-5 list-decimal text-sm text-foreground">
          {parseInline(line.replace(/^\d+\.\s+/, ''))}
        </li>
      );
      continue;
    }

    // Empty lines (spacing)
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={i} className="text-sm leading-relaxed text-foreground">
        {parseInline(line)}
      </p>
    );
  }

  return <div className={cn('space-y-1 text-sm', className)}>{elements}</div>;
}
