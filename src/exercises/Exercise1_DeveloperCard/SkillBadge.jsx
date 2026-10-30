/**
 * Một kỹ năng trong danh sách. Tier hiển thị bằng chữ, không chỉ bằng màu (WCAG 1.4.1).
 * @param {{ name: string, tier?: string }} props
 */
export function SkillBadge({ name, tier = 'Core' }) {
  return (
    <li>
      {name} ({tier})
    </li>
  );
}
