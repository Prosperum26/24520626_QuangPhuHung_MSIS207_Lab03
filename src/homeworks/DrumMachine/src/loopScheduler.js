/**
 * Phần thuần của looper: không biết gì về React hay âm thanh, test được bằng số.
 *
 * Hai loại thời gian:
 *  - giờ audio: AudioContext.currentTime (giây), đồng hồ chính xác, không trôi như setTimeout;
 *  - thời gian vòng ("loopT"): giây tính trên bản ghi, chạy TĂNG DẦN không quấn
 *    (vòng 2 là 2..4 nếu vòng dài 2 giây). Không quấn nên cửa sổ vắt qua cuối vòng không cần xử lý riêng.
 *
 * @typedef {{ audioTime: number, loopT: number, speed: number }} Anchor
 *   Tại giờ audio `audioTime` thì thời gian vòng là `loopT`; từ đó chạy với hệ số `speed`.
 * @typedef {{ t: number, padId: string }} LoopEvent  t trong [0, loopLen)
 */

/** Thời gian vòng tại giờ audio `nowAudio`. */
export function positionAt(anchor, nowAudio) {
  return anchor.loopT + (nowAudio - anchor.audioTime) * anchor.speed;
}

/** Giờ audio mà thời gian vòng `loopT` sẽ tới (dùng làm `when` cho source.start). */
export function toAudioTime(anchor, loopT) {
  return anchor.audioTime + (loopT - anchor.loopT) / anchor.speed;
}

/** Anchor mới với tốc độ mới, giữ nguyên vị trí hiện tại: đổi tốc độ lúc đang chạy không bị nhảy. */
export function reanchor(anchor, nowAudio, speed) {
  return { audioTime: nowAudio, loopT: positionAt(anchor, nowAudio), speed };
}

/**
 * Các hit rơi vào [fromT, toT) của thời gian vòng, theo thứ tự thời gian.
 * Cửa sổ liên tiếp (to của lần trước = from của lần sau) không trùng và không sót hit nào.
 * @param {readonly LoopEvent[]} events
 * @param {number} loopLen  độ dài một vòng (giây)
 * @param {boolean} [repeat]  false: chỉ vòng đầu (chế độ Once)
 * @returns {LoopEvent[]}  t là thời gian vòng không quấn
 */
export function eventsInWindow(events, loopLen, fromT, toT, repeat = true) {
  const hits = [];
  for (const event of events) {
    const firstLap = Math.max(0, Math.ceil((fromT - event.t) / loopLen));
    for (let lap = firstLap; repeat || lap === 0; lap++) {
      const t = event.t + lap * loopLen;
      if (t >= toT) break;
      hits.push({ t, padId: event.padId });
    }
  }
  return hits.sort((a, b) => a.t - b.t);
}
