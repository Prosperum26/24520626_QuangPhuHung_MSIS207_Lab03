import { describe, it, expect } from 'vitest';
import { PHASES, EVENTS, transition } from './fsm.js';

// Bảng kỳ vọng: chỉ liệt kê chuyển hợp lệ; mọi cặp khác phải giữ nguyên pha.
const VALID = {
  'FRIENDS|ASK_OUT': 'DATING_NO_LOVE',
  'DATING_NO_LOVE|COMMIT': 'OFFICIAL_LOVE',
  'DATING_NO_LOVE|GHOST': 'GHOSTED_EXIT',
  'OFFICIAL_LOVE|GHOST': 'GHOSTED_EXIT',
};

describe('transition', () => {
  it('đúng bảng chuyển cho mọi cặp (pha x sự kiện)', () => {
    for (const phase of PHASES) {
      for (const event of EVENTS) {
        const expected = VALID[`${phase}|${event}`] ?? phase;
        expect(transition(phase, event), `${phase} + ${event}`).toBe(expected);
      }
    }
  });

  it('GHOSTED_EXIT là trạng thái cuối: mọi sự kiện đều giữ nguyên', () => {
    for (const event of EVENTS) {
      expect(transition('GHOSTED_EXIT', event)).toBe('GHOSTED_EXIT');
    }
  });

  it('sự kiện hoặc pha lạ không throw, giữ nguyên pha', () => {
    expect(transition('FRIENDS', 'NOPE')).toBe('FRIENDS');
    expect(transition('UNKNOWN', 'ASK_OUT')).toBe('UNKNOWN');
  });

  it('không có boolean nào trong bộ pha: đúng 4 pha', () => {
    expect([...PHASES]).toEqual(['FRIENDS', 'DATING_NO_LOVE', 'OFFICIAL_LOVE', 'GHOSTED_EXIT']);
  });
});
