import { useEffect, useId, useRef, useState } from 'react';
import { ANNOUNCE_MS, keyLabel, padById } from './drumPads.js';
import styles from './HitLog.module.css';

/** @typedef {{ id: number, padId: string }} Hit  id tăng dần, duy nhất trong phiên. */

function describe(latest, count) {
  const pad = padById.get(latest.padId);
  return count === 1 ? `${pad.label}, phím ${keyLabel(pad)}` : `${count} cú gõ, cuối cùng: ${pad.label}`;
}

/**
 * Nhật ký gõ cho người khiếm thính và người dùng trình đọc màn hình.
 * - Danh sách cập nhật ngay (nhìn thấy), nằm ngoài vùng live nên không bị đọc.
 * - Vùng live <output> chỉ đọc một câu tóm tắt sau ANNOUNCE_MS kể từ hit cuối,
 *   nên gõ dồn dập không làm trình đọc màn hình đọc từng phím.
 * @param {{ hits: Hit[] }} props  mới nhất trước
 */
export function HitLog({ hits }) {
  const headingId = useId();
  const [announcement, setAnnouncement] = useState('');
  const announcedIdRef = useRef(0); // id của hit cuối đã đọc

  useEffect(() => {
    const latest = hits[0];
    if (!latest || latest.id === announcedIdRef.current) return undefined;
    // Mỗi hit mới huỷ timer cũ (cleanup) và hẹn lại: chỉ đọc khi đã ngừng gõ.
    const timer = setTimeout(() => {
      const count = latest.id - announcedIdRef.current;
      announcedIdRef.current = latest.id;
      setAnnouncement(describe(latest, count));
    }, ANNOUNCE_MS);
    return () => clearTimeout(timer);
  }, [hits]);

  return (
    <section aria-labelledby={headingId} className={styles.log}>
      <h2 id={headingId}>Nhật ký gõ</h2>
      <output aria-live="polite" aria-atomic="true" className={styles.announcement}>
        {announcement}
      </output>
      {hits.length === 0 ? (
        <p className={styles.empty}>Chưa có cú gõ nào. Thử nhấn A để đánh Kick.</p>
      ) : (
        <ol className={styles.list} aria-label="Lịch sử gõ, mới nhất trước">
          {hits.map((h) => {
            const pad = padById.get(h.padId);
            return (
              <li key={h.id} className={styles.item} data-sound={h.padId}>
                <span className={styles.dot} aria-hidden="true" />
                {pad.label} <kbd>{keyLabel(pad)}</kbd>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
