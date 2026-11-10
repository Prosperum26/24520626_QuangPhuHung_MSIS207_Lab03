/** Mọi hằng số của đàn ở một chỗ: đổi yêu cầu (61 phím, 4 voice, tốc độ 4x...) chỉ sửa file này. */

/** Phạm vi MIDI của đàn 88 phím: A0 (21) đến C8 (108). */
export const MIDI_MIN = 21;
export const MIDI_MAX = 108;
/** Tần số chuẩn: MIDI 69 (A4) = 440 Hz. */
export const A4_MIDI = 69;
export const A4_HZ = 440;

export const MAX_VOICES = 8;
/** Tốc độ phát lại cho phép. */
export const SPEEDS = [0.5, 1, 2];

/** Gain mỗi voice: 8 voice x 0,1 = 0,8 < 1 nên không méo (slide đặt 0,2 thì 8 voice là 1,6). */
export const VOICE_GAIN = 0.1;
/** Tăng gain từ 0 lên VOICE_GAIN trong khoảng này lúc bắt đầu nốt, tránh tiếng click. */
export const ATTACK_S = 0.01;
/** Tắt dần trong khoảng này trước khi dừng oscillator, tránh tiếng pop. */
export const RELEASE_S = 0.04;
/** Đích của exponentialRamp: không được bằng 0 (ramp mũ không tới được 0). */
export const RELEASE_FLOOR = 0.0001;

/** Phím có tabindex=0 lúc đầu (roving tabindex): C4, "middle C". */
export const DEFAULT_FOCUS_MIDI = 60;
