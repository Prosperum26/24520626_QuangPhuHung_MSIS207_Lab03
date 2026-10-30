import { useId } from 'react';
import { DEFAULT_FULL_NAME, DEFAULT_ROLE } from './developerCardModel.js';

/**
 * Thẻ hồ sơ lập trình viên. Không dùng thẻ div: chỉ thẻ ngữ nghĩa.
 * @param {{ fullName?: string, role?: string }} props
 */
export function DeveloperCard({ fullName = DEFAULT_FULL_NAME, role = DEFAULT_ROLE }) {
  // useId: mỗi card một id riêng, nhiều card cùng trang không trùng aria-labelledby.
  const headingId = useId();

  return (
    <article aria-labelledby={headingId}>
      <header>
        <hgroup>
          <h2 id={headingId}>{fullName}</h2>
          <p>{role}</p>
        </hgroup>
      </header>
    </article>
  );
}
