import { useEffect } from 'react';

// Ô đang gõ chữ: không cướp phím. closest() bắt được cả phần tử con của contenteditable,
// việc kiểm tagName như slide thì bỏ sót.
const TYPING_TARGET = 'input, textarea, select, [contenteditable]';

/**
 * Nghe phím tắt trên window bằng e.code.
 * @param {ReadonlyMap<string, import('./drumPads.js').Pad>} padMap
 * @param {(padId: string) => void} onTriggerPad
 * @param {boolean} [isEnabled]
 */
export function useDrumKeyboard(padMap, onTriggerPad, isEnabled = true) {
  useEffect(() => {
    if (!isEnabled) return undefined;

    const onKeyDown = (e) => {
      if (e.repeat) return; // giữ phím: OS bắn lặp
      if (e.ctrlKey || e.metaKey || e.altKey) return; // Ctrl+S... của trình duyệt
      if (e.target instanceof Element && e.target.closest(TYPING_TARGET)) return;
      const pad = padMap.get(e.code);
      if (!pad) return;
      e.preventDefault();
      onTriggerPad(pad.id);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [padMap, onTriggerPad, isEnabled]);
}
