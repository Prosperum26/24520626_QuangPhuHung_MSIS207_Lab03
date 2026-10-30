import { Fragment, useId, useState } from 'react';
import defaultAvatarUrl from '../assets/avatar-128.jpg';
import { SkillBadge } from './SkillBadge.jsx';
import {
  DEFAULT_FULL_NAME,
  DEFAULT_METRICS,
  DEFAULT_ROLE,
  DEFAULT_SKILLS,
  formatMetricLabel,
  formatMetricValue,
  getInitials,
  isSafeAvatarUrl,
} from './developerCardModel.js';

const AVATAR_SIZE = 64;

/**
 * Thẻ hồ sơ lập trình viên. Không dùng thẻ div: chỉ thẻ ngữ nghĩa.
 * @param {{
 *   fullName?: string,
 *   role?: string,
 *   avatarUrl?: string | null,
 *   metrics?: Readonly<Record<string, string | number>>,
 *   skills?: readonly { id: string, name: string, tier?: string }[],
 * }} props
 * `avatarUrl` bỏ trống (undefined) thì dùng ảnh local; truyền '' hoặc null để chỉ hiện chữ cái đầu.
 */
export function DeveloperCard({
  fullName = DEFAULT_FULL_NAME,
  role = DEFAULT_ROLE,
  avatarUrl = defaultAvatarUrl,
  metrics = DEFAULT_METRICS,
  skills = DEFAULT_SKILLS,
}) {
  // useId: mỗi card một id riêng, nhiều card cùng trang không trùng aria-labelledby.
  const headingId = useId();

  // Lưu URL đã lỗi (không phải boolean): đổi avatarUrl thì tự hết lỗi, không cần effect reset.
  const [failedUrl, setFailedUrl] = useState(null);
  const showImage = isSafeAvatarUrl(avatarUrl) && failedUrl !== avatarUrl;

  const metricEntries = Object.entries(metrics);

  return (
    <article aria-labelledby={headingId}>
      <header>
        {showImage ? (
          <img
            src={avatarUrl}
            alt=""
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            decoding="async"
            onError={() => setFailedUrl(avatarUrl)}
          />
        ) : (
          <span aria-hidden="true">{getInitials(fullName)}</span>
        )}
        <hgroup>
          <h2 id={headingId}>{fullName}</h2>
          <p>{role}</p>
        </hgroup>
      </header>

      {metricEntries.length > 0 && (
        <dl>
          {metricEntries.map(([key, value]) => (
            <Fragment key={key}>
              <dt>{formatMetricLabel(key)}</dt>
              <dd>{formatMetricValue(value)}</dd>
            </Fragment>
          ))}
        </dl>
      )}

      {skills.length > 0 && (
        <ul aria-label="Engineered Skills">
          {skills.map((skill) => (
            <SkillBadge key={skill.id} name={skill.name} tier={skill.tier} />
          ))}
        </ul>
      )}
    </article>
  );
}
