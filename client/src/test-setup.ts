import '@testing-library/jest-dom';

// IntersectionObserver and matchMedia stubs for jsdom-environment tests.
// Both are no-ops in the default `node` environment because `globalThis.window` is undefined.
if (typeof globalThis.window !== 'undefined') {
  if (typeof globalThis.IntersectionObserver === 'undefined') {
    class MockIntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds: ReadonlyArray<number> = [];
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): IntersectionObserverEntry[] { return []; }
    }
    globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  }

  if (typeof globalThis.window.matchMedia === 'undefined') {
    globalThis.window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
  }
}
