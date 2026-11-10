const FALLBACK_DELAY_MS = 200;

/**
 * Chạy `fn` khi trang đã tải xong và trình duyệt rảnh, để việc phụ (tải trước âm thanh) không tranh
 * băng thông với phần hiển thị trang. Trình duyệt không có requestIdleCallback (Safari) thì đợi một nhịp.
 * @param {() => void} fn
 * @returns {() => void} hàm huỷ (dùng làm cleanup của effect)
 */
export function whenIdle(fn) {
  let cancel = () => {};

  const schedule = () => {
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(fn);
      cancel = () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(fn, FALLBACK_DELAY_MS);
      cancel = () => clearTimeout(id);
    }
  };

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
    cancel = () => window.removeEventListener('load', schedule);
  }

  return () => cancel();
}
