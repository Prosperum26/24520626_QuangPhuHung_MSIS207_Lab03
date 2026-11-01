import { useState } from 'react';
import styles from './App.module.css';
import { DeveloperCard } from './components/DeveloperCard.jsx';
import { ScientistDirectory } from './components/ScientistDirectory.jsx';
import { SMART_PEOPLE } from './data/smartPeople.js';

const ROLE = 'Nhà tiên phong';

export function App() {
  // selectedId nằm ở đây (nâng state): danh sách và thẻ chi tiết cùng đọc một nguồn.
  const [selectedId, setSelectedId] = useState(null);
  const selected = SMART_PEOPLE.find((person) => person.id === selectedId);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Interactive Scientist &amp; Pioneer Directory</h1>
        <p>Tìm, lọc theo IQ và sắp xếp. Gõ có dấu hay không dấu, hoa hay thường đều được.</p>
      </header>
      <section className={styles.layout}>
        <ScientistDirectory selectedId={selectedId} onSelect={setSelectedId} />
        <aside className={styles.detail} aria-label="Chi tiết đang chọn" aria-live="polite">
          {selected ? (
            <DeveloperCard
              fullName={selected.name}
              role={ROLE}
              avatarUrl={null}
              metrics={selected.metrics}
              skills={[]}
            />
          ) : (
            <p className={styles.placeholder}>Bấm &ldquo;Chi tiết&rdquo; ở một người để xem thẻ tại đây.</p>
          )}
        </aside>
      </section>
    </main>
  );
}
