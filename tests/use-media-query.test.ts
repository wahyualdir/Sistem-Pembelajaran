import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useMediaQuery } from '@/hooks/use-media-query';

function TestComponent() {
  const isDesktop = useMediaQuery('(min-width: 1280px)', false);
  return React.createElement('div', { 'data-desktop': isDesktop }, String(isDesktop));
}

describe('useMediaQuery hook', () => {
  it('merender server snapshot false secara konsisten di SSR tanpa crash', () => {
    const html = renderToString(React.createElement(TestComponent));
    expect(html).toContain('false');
  });
});
