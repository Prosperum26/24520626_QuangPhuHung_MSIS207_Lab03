import { GrandPiano } from './components/GrandPiano.jsx';
import styles from './App.module.css';

export function App() {
  return (
    <main className={styles.page}>
      <header>
        <hgroup className={styles.masthead}>
          <h1 className={styles.title}>Grand Piano</h1>
          <p className={styles.lede}>Piano 88 phím, chơi tối đa 8 nốt cùng lúc.</p>
        </hgroup>
      </header>
      <GrandPiano />
    </main>
  );
}
