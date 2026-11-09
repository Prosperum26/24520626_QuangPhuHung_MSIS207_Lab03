import { DrumMachine } from './DrumMachine.jsx';
import styles from './App.module.css';

export function App() {
  return (
    <main className={styles.page}>
      <header>
        <hgroup className={styles.masthead}>
          <h1 className={styles.title}>Drum Kit</h1>
          <p className={styles.lede}>Gõ phím W A S D J K L hoặc chạm vào từng trống.</p>
        </hgroup>
      </header>
      <DrumMachine />
    </main>
  );
}
