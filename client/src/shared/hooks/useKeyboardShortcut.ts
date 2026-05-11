import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

export function useKeyboardShortcut(
  shortcut: KeyboardShortcut,
  callback: () => void,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;

      const modifierMatch =
        (shortcut.ctrlKey === undefined || shortcut.ctrlKey === ctrlKey) &&
        (shortcut.metaKey === undefined || shortcut.metaKey === metaKey) &&
        (shortcut.shiftKey === undefined || shortcut.shiftKey === shiftKey) &&
        (shortcut.altKey === undefined || shortcut.altKey === altKey);

      if (modifierMatch && key.toLowerCase() === shortcut.key.toLowerCase()) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut, callback, enabled]);
}

export function useCommandKey(): 'metaKey' | 'ctrlKey' {
  if (typeof navigator === 'undefined') return 'ctrlKey';
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? 'metaKey' : 'ctrlKey';
}
