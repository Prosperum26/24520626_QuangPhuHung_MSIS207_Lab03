import { useId, useState } from 'react';
import styles from './Leaderboard.module.css';

/** Cột có thể sắp xếp: khoá trường dữ liệu và nhãn hiển thị. Thêm cột mới chỉ cần thêm một dòng. */
const SORT_OPTIONS = [
  { key: 'wwcdCount', label: 'WWCD' },
  { key: 'placementPts', label: 'Placement Points' },
  { key: 'killPts', label: 'Kill Points' },
];

/**
 * Bảng xếp hạng đội. Lọc và sắp xếp là giá trị DẪN XUẤT tính trong render từ
 * (`squads`, `query`, `sortKey`): không có state thứ hai cần đồng bộ nên không cần effect đồng bộ.
 * @param {object} props
 * @param {readonly import('../domain/contract.js').PubgVnSquadStanding[]} props.squads
 */
export function Leaderboard({ squads }) {
  const searchId = useId();
  const sortId = useId();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('wwcdCount');

  const needle = query.trim().toLowerCase();
  const rows = squads
    .filter((squad) => squad.squadName.toLowerCase().includes(needle))
    // toSorted không đổi mảng gốc; cùng điểm thì xếp theo tên để thứ tự ổn định.
    .toSorted((a, b) => b[sortKey] - a[sortKey] || a.squadName.localeCompare(b.squadName));

  return (
    <section className={styles.board} aria-labelledby={`${searchId}-heading`}>
      <h2 id={`${searchId}-heading`}>Bảng xếp hạng</h2>

      <form className={styles.controls} onSubmit={(e) => e.preventDefault()}>
        <p className={styles.field}>
          <label htmlFor={searchId}>Lọc theo tên đội</label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </p>
        <p className={styles.field}>
          <label htmlFor={sortId}>Sắp xếp theo</label>
          <select id={sortId} value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
        </p>
      </form>

      <output className={styles.count}>
        {rows.length === 0 ? 'Không có đội nào khớp.' : `Hiển thị ${rows.length}/${squads.length} đội`}
      </output>

      <table className={styles.table}>
        <caption className={styles.caption}>PVS Vietnam: điểm theo đội, giảm dần</caption>
        <thead>
          <tr>
            <th scope="col">Hạng</th>
            <th scope="col">Đội</th>
            {SORT_OPTIONS.map((option) => (
              <th key={option.key} scope="col" aria-sort={option.key === sortKey ? 'descending' : undefined}>
                {option.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((squad, index) => (
            <tr key={squad.squadId}>
              <td>{index + 1}</td>
              <th scope="row">{squad.squadName}</th>
              <td>{squad.wwcdCount}</td>
              <td>{squad.placementPts}</td>
              <td>{squad.killPts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
