import styles from './App.module.css';
import { ScientistDirectory } from './components/ScientistDirectory.jsx';

export function App() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Interactive Scientist &amp; Pioneer Directory</h1>
        <p>Tìm, lọc theo IQ và sắp xếp. Gõ có dấu hay không dấu, hoa hay thường đều được.</p>
      </header>
      <ScientistDirectory />
    </main>
  );
}
