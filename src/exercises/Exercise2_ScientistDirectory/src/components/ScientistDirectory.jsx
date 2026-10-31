import { memo, useId, useState } from 'react';
import { SMART_PEOPLE } from '../data/smartPeople.js';
import { DeveloperCard } from './DeveloperCard.jsx';
import { DEFAULT_MIN_IQ, DEFAULT_SORT, selectVisible } from './peopleModel.js';
import styles from './ScientistDirectory.module.css';

// Mọi prop truyền cho card đều ổn định (chuỗi, metrics đóng băng, mảng hằng) nên memo
// bỏ qua card không đổi khi gõ tìm kiếm hoặc đổi bộ lọc.
const PersonCard = memo(DeveloperCard);
const NO_SKILLS = Object.freeze([]);
const ROLE = 'Nhà tiên phong';

const SORT_OPTIONS = Object.freeze([
  { value: 'iq-desc', label: 'IQ giảm dần' },
  { value: 'age-asc', label: 'Tuổi tăng dần' },
]);

/**
 * @param {{ initialData?: readonly import('./peopleModel.js').Person[] }} props
 */
export function ScientistDirectory({ initialData = SMART_PEOPLE }) {
  const searchId = useId();
  const minIqId = useId();
  const sortId = useId();

  // Chỉ dữ liệu độc lập nằm trong state; danh sách hiển thị tính ngay trong lúc render.
  const [people] = useState(initialData);
  const [query, setQuery] = useState('');
  const [minIq, setMinIq] = useState(DEFAULT_MIN_IQ);
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);

  const visible = selectVisible(people, { query, minIq, sortBy });

  // valueAsNumber giữ kiểu số (e.target.value luôn là chuỗi); rỗng/không hợp lệ về 0.
  const handleMinIq = (event) => {
    const value = event.target.valueAsNumber;
    setMinIq(Number.isNaN(value) ? 0 : value);
  };

  return (
    <section className={styles.directory} aria-label="Pioneer Directory">
      <form className={styles.controls} role="search" onSubmit={(event) => event.preventDefault()}>
        <p className={styles.field}>
          <label htmlFor={searchId}>Tìm theo tên</label>
          <input
            id={searchId}
            type="search"
            value={query}
            autoComplete="off"
            placeholder="vd. ein, hung, Đặng"
            onChange={(event) => setQuery(event.target.value)}
          />
        </p>
        <p className={styles.field}>
          <label htmlFor={minIqId}>IQ tối thiểu</label>
          <input id={minIqId} type="number" inputMode="numeric" min="0" value={minIq} onChange={handleMinIq} />
        </p>
        <p className={styles.field}>
          <label htmlFor={sortId}>Sắp xếp</label>
          <select id={sortId} value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </p>
      </form>

      <ul className={styles.list} aria-label="Danh sách nhà khoa học">
        {visible.map((person) => (
          <li key={person.id}>
            <PersonCard
              fullName={person.name}
              role={ROLE}
              avatarUrl={null}
              metrics={person.metrics}
              skills={NO_SKILLS}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
