import { useEffect } from "react";

type KeyHandler = (e: KeyboardEvent) => void;

interface ShortcutMap {
  [key: string]: KeyHandler;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Format key string to match (e.g. "Ctrl+Z", "Delete", "a" -> "A")
      let keyStr = "";
      if (e.ctrlKey || e.metaKey) keyStr += "Ctrl+";
      if (e.shiftKey) keyStr += "Shift+";
      if (e.altKey) keyStr += "Alt+";
      
      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      keyStr += key;

      if (shortcuts[keyStr]) {
        e.preventDefault();
        shortcuts[keyStr](e);
      } else if (shortcuts[key] && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        // Fallback to simple key string if no modifiers
        e.preventDefault();
        shortcuts[key](e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, isActive]);
}
