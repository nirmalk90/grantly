import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
vi.mock('../services/catalog', async (importOriginal) => ({ ...await importOriginal<typeof import('../services/catalog')>(), catalogRepository: { load: async () => (await import("./fixtures")).testCatalog } }));

document.documentElement.lang = 'en';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
  document.documentElement.dataset.theme = 'light'
  window.history.replaceState({}, '', '/');;
  document.body.style.overflow = '';
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '0px';
  readonly thresholds: readonly number[] = [0];
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element): void {
    this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this);
  }

  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  },
});

window.scrollTo = vi.fn();
window.HTMLElement.prototype.scrollTo = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
