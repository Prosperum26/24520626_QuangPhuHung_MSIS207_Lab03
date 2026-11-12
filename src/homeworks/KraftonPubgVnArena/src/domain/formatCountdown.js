/**
 * Đổi mili giây còn lại thành "mm:ss" (hoặc "h:mm:ss" từ 1 giờ).
 * Làm tròn lên để 1ms còn lại vẫn hiện 00:01, chỉ hiện 00:00 khi thật sự về 0.
 * @param {number} ms
 */
export function formatCountdown(ms) {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
