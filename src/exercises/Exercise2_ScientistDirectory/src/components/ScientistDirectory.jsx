import { memo, useId, useRef, useState } from 'react';
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
  const [people, setPeople] = useState(initialData);
  const [query, setQuery] = useState('');
  const [minIq, setMinIq] = useState(DEFAULT_MIN_IQ);
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);

  const visible = selectVisible(people, { query, minIq, sortBy });
  const searchRef = useRef(null);

  // valueAsNumber giữ kiểu số (e.target.value luôn là chuỗi); rỗng/không hợp lệ về 0.
  const handleMinIq = (event) => {
    const value = event.target.valueAsNumber;
    setMinIq(Number.isNaN(value) ? 0 : value);
  };

  // Xoá bất biến bằng filter. Focus chuyển sang hàng kế (hoặc hàng trước) TRƯỚC khi state đổi:
  // hàng đó vẫn còn trong DOM nên không cần effect; hết hàng thì về ô tìm kiếm, không rơi về <body>.
  const handleDelete = (event, id) => {
    const row = event.currentTarget.closest('li');
    const neighbour = row?.nextElementSibling ?? row?.previousElementSibling;
    (neighbour?.querySelector('button') ?? searchRef.current)?.focus();
    setPeople((prev) => prev.filter((person) => person.id !== id));
  };

  // Một lần setState liên tiếp được React gộp thành một commit.
  const handleReset = () => {
    setPeople(initialData);
    setQuery('');
    setMinIq(DEFAULT_MIN_IQ);
    setSortBy(DEFAULT_SORT);
  };

  return (
    <section className={styles.directory} aria-label="Pioneer Directory">
      <form className={styles.controls} role="search" onSubmit={(event) => event.preventDefault()}>
        <p className={styles.field}>
          <label htmlFor={searchId}>Tìm theo tên</label>
          <input
            id={searchId}
            ref={searchRef}
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
        <p className={styles.actions}>
          <button type="button" className={styles.reset} onClick={handleReset}>
            Đặt lại
          </button>
        </p>
      </form>

      {/* <output> đã có role=status ngầm định (jsx-a11y cấm ghi thừa); aria-live đặt tường minh. */}
      <output className={styles.status} aria-live="polite">
        {visible.length === 0 ? 'Không tìm thấy nhà tiên phong nào.' : `Found ${visible.length} pioneers`}
      </output>

      <ul className={styles.list} aria-label="Danh sách nhà khoa học">
        {visible.map((person) => (
          <li key={person.id} className={styles.item}>
            <PersonCard
              fullName={person.name}
              role={ROLE}
              avatarUrl={null}
              metrics={person.metrics}
              skills={NO_SKILLS}
            />
            <button
              type="button"
              className={styles.delete}
              aria-label={`Xoá ${person.name}`}
              onClick={(event) => handleDelete(event, person.id)}
            >
              Xoá
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
